import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:8765/?firebaseEmulator=1&dailyChallengePreview=1';
const project = 'demo-quizhub';

test('Daily Challenge UI uses server questions, verified answer feedback and resumes completed receipt', { timeout: 150000 }, async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Auth emulator required');
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project,
        'This browser test must never use a production project');

    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ serviceWorkers: 'block' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(url);

        await page.evaluate(async () => {
            const [{ auth }, { signInAnonymously }, { setState }, { renderQuiz, attachQuizListeners }] =
                await Promise.all([
                    import('./app/firebase-config.js'),
                    import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'),
                    import('./app/store/state.js'),
                    import('./app/modules/quiz/quiz.js')
                ]);
            if (!auth.currentUser) await signInAnonymously(auth);
            setState('gameSettings', { mode: 'daily', category: 'all', difficulty: 'easy' });
            document.body.innerHTML = await renderQuiz();
            attachQuizListeners();
        });

        await page.locator('[data-daily-answer]').first().waitFor({ timeout: 30000 });
        for (let index = 0; index < 10; index++) {
            await page.locator('[data-daily-answer]').first().click();
            await page.locator('[data-daily-next]').waitFor({ timeout: 10000 });
            await page.locator('[data-daily-next]').click();
            if (index < 9) {
                await page.locator('[data-daily-answer]').first().waitFor({ timeout: 10000 });
            }
        }
        await page.locator('[data-daily-complete]').waitFor({ timeout: 10000 });
        await page.locator('[data-daily-complete]').click();
        await page.locator('.server-daily-challenge-preview [role="status"]')
            .filter({ hasText: /Тренировочный результат|Practice result only/ })
            .waitFor({ timeout: 15000 });

        const firstResult = await page.locator('.server-daily-challenge-preview .quiz-result').innerText();
        assert.match(firstResult, /10/);
        assert.match(firstResult, /Тренировочный результат|Practice result only/);

        await page.reload();
        await page.evaluate(async () => {
            const [{ auth }, { setState }, { renderQuiz, attachQuizListeners }] = await Promise.all([
                import('./app/firebase-config.js'),
                import('./app/store/state.js'),
                import('./app/modules/quiz/quiz.js')
            ]);
            if (!auth.currentUser) throw new Error('AUTH_SESSION_NOT_RESTORED');
            setState('gameSettings', { mode: 'daily', category: 'all', difficulty: 'easy' });
            document.body.innerHTML = await renderQuiz();
            attachQuizListeners();
        });
        await page.locator('.server-daily-challenge-preview .quiz-result').waitFor({ timeout: 30000 });
        const resumedResult = await page.locator('.server-daily-challenge-preview .quiz-result').innerText();
        assert.equal(resumedResult, firstResult, 'Reload must display the same server-owned receipt');
        assert.deepEqual(errors, [], 'No uncaught browser exceptions');
        await context.close();
    } finally {
        await browser.close();
    }
});
