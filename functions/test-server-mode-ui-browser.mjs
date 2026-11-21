import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const project = 'demo-quizhub';
const url = 'http://127.0.0.1:8765/?firebaseEmulator=1&serverModePreview=1';

test('browser renders and advances Classic, Duel, Survival and Time Trial through the server preview', { timeout: 150000 }, async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Auth emulator required');
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project,
        'This browser test must never use a production Firebase project');

    const app = initializeApp({ projectId: project }, 'mode-browser-' + randomUUID());
    const db = getFirestore(app);
    const adminAuth = getAuth(app);
    const browser = await chromium.launch({ headless: true });
    const sessionIds = [];
    const uids = [];
    try {
        const context = await browser.newContext({ serviceWorkers: 'block' });
        const errors = [];

        for (const mode of ['classic', 'duel', 'survival', 'time']) {
            const page = await context.newPage();
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url);
            const identity = await page.evaluate(async modeName => {
                const [{ auth }, { signInAnonymously }, { setState }, { renderQuiz, attachQuizListeners }] =
                    await Promise.all([
                        import('./app/firebase-config.js'),
                        import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'),
                        import('./app/store/state.js'),
                        import('./app/modules/quiz/quiz.js')
                    ]);
                if (!auth.currentUser) await signInAnonymously(auth);
                setState('gameSettings', {
                    mode: modeName,
                    category: 'science',
                    difficulty: 'easy'
                });
                document.body.innerHTML = await renderQuiz();
                attachQuizListeners();
                return {
                    uid: auth.currentUser.uid,
                    sessionId: sessionStorage.getItem('quizhub:server-mode-session:' + modeName)
                };
            }, mode);
            uids.push(identity.uid);
            assert.ok(identity.sessionId, mode + ' session must be saved for resume');
            sessionIds.push(identity.sessionId);

            const root = page.locator('.server-mode-preview');
            await root.waitFor({ timeout: 30000 });
            await page.locator('[data-server-answer]').first().waitFor({ timeout: 30000 });

            if (mode === 'duel') {
                await page.locator('.duel-scoreboard').waitFor();
                const scoreboard = await page.locator('.duel-scoreboard').innerText();
                assert.ok(scoreboard.includes('0') && scoreboard.includes(':'));
            } else if (mode === 'survival') {
                await page.locator('.survival-lives').waitFor();
                assert.ok((await page.locator('.survival-lives').innerText()).includes('3/3'));
            } else if (mode === 'time') {
                await page.locator('[data-time-trial-timer]').waitFor();
                assert.ok((await page.locator('[data-time-trial-value]').innerText()).includes(':'));
            } else {
                await page.locator('.mode-badge').waitFor();
                assert.ok((await page.locator('.mode-badge').innerText()).includes('Server mode preview'));
            }

            const initialProgressText = await page.locator('.server-mode-preview .quiz-progress').first().innerText();
            const initialCount = initialProgressText.slice(initialProgressText.lastIndexOf('/') + 1).trim();
            assert.ok(Number.isSafeInteger(Number(initialCount)) && Number(initialCount) > 0,
                mode + ' must expose its selected question count');

            await page.locator('[data-server-answer]').first().click();
            await page.locator('[data-server-next]').waitFor({ timeout: 15000 });
            const feedback = await page.locator('.quiz-result h2').innerText();
            assert.match(feedback, /Correct|Not quite|Верно|Неверно/);
            if (mode === 'duel') await page.locator('.duel-round-feedback').waitFor();

            await page.locator('[data-server-next]').click();
            await page.locator('[data-server-answer]').first().waitFor({ timeout: 15000 });
            const progressText = await page.locator('.server-mode-preview .quiz-progress').first().innerText();
            const advancedCount = progressText.slice(progressText.lastIndexOf('/') + 1).trim();
            assert.ok(progressText.includes('1/'), mode + ' must advance exactly one server-accepted question');
            assert.equal(advancedCount, initialCount, mode + ' question count must remain stable');
            await page.close();
        }

        assert.deepEqual(errors, [], 'No uncaught browser exceptions');
        await context.close();
    } finally {
        for (const sessionId of sessionIds) {
            await db.collection('quizSessions').doc(sessionId).delete().catch(() => {});
        }
        for (const uid of uids) await adminAuth.deleteUser(uid).catch(() => {});
        await browser.close();
        await db.terminate();
        await deleteApp(app);
    }
});
