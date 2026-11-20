import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:8765/?firebaseEmulator=1&profileCreatePreview=1&serverModePreview=1';
const project = 'demo-quizhub';

test('authenticated browser completes Classic through trusted server session and receives one reward receipt', { timeout: 150000 }, async () => {
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
        await page.locator('#auth-form').waitFor({ timeout: 30000 });

        const email = 'classic-server-' + Date.now() + '@example.test';
        await page.evaluate(() => window.switchAuthMode());
        await page.locator('#auth-password[autocomplete="new-password"]').waitFor();
        await page.locator('#auth-email').fill(email);
        await page.locator('#auth-password').fill('Classic-server-emulator-5830');
        await page.locator('#auth-form button[type="submit"]').click();
        await page.locator('#profile-form').waitFor({ timeout: 30000 });

        const nickname = 'Classic' + Date.now().toString(36);
        await page.locator('#nickname-input').fill(nickname);
        await page.locator('#check-nickname-btn').click();
        await page.locator('#save-profile-btn:not([disabled])').waitFor({ timeout: 20000 });
        await page.locator('#save-profile-btn').click();
        await page.locator('.play-btn').waitFor({ timeout: 30000 });

        const result = await page.evaluate(async () => {
            const [{ auth, db, doc, getDoc }, { createLocalFirebaseClassicInvoker },
                { createServerModeClient }, { createModeSessionController }] = await Promise.all([
                import('./app/firebase-config.js'),
                import('./app/modules/quiz/firebase-classic-preview.js'),
                import('./app/modules/quiz/server-mode-client.js'),
                import('./app/modules/quiz/mode-session-controller.js')
            ]);
            const profileBefore = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (!profileBefore.exists()) throw new Error('PROFILE_NOT_CREATED');

            const client = createServerModeClient({
                invoke: createLocalFirebaseClassicInvoker(),
                claimOperation: 'complete',
                supportedModes: ['classic']
            });
            const controller = createModeSessionController({ client, random: () => 0.5 });
            const started = await controller.start({
                mode: 'classic', category: 'all', difficulty: 'easy', count: 10, language: 'en'
            });
            if (started.totalQuestions !== 10 || !started.question?.id) {
                throw new Error('INVALID_CLASSIC_START_RECEIPT');
            }

            let answered = 0;
            while (controller.getState().status === 'in_progress' && answered < 10) {
                await controller.answerDisplayed(0, { language: 'en' });
                answered++;
            }
            if (answered !== 10 || controller.getState().status !== 'ready_to_claim') {
                throw new Error('CLASSIC_SESSION_DID_NOT_FINISH');
            }

            const first = await controller.claim();
            const firstReceipt = first.receipt;
            const retry = await client.claim({ sessionId: started.sessionId });
            const profileAfter = await getDoc(doc(db, 'users', auth.currentUser.uid));
            return {
                uid: auth.currentUser.uid,
                answered,
                firstReceipt,
                retry,
                profileBefore: profileBefore.data(),
                profileAfter: profileAfter.data()
            };
        });

        assert.equal(result.answered, 10);
        assert.equal(result.firstReceipt.alreadyClaimed, false);
        assert.equal(typeof result.firstReceipt.score, 'number');
        assert.equal(typeof result.firstReceipt.xp, 'number');
        assert.equal(typeof result.firstReceipt.coins, 'number');
        assert.equal(result.retry.alreadyClaimed, true, 'Retry must return the original claim without paying again');
        assert.equal(result.profileAfter.quizzesCompleted, (result.profileBefore.quizzesCompleted || 0) + 1);
        assert.equal(result.profileAfter.coins, result.profileBefore.coins + result.firstReceipt.coins);
        assert.equal(result.profileAfter.experience, result.profileBefore.experience + result.firstReceipt.xp);
        assert.deepEqual(errors, [], 'No uncaught browser exceptions');
        await context.close();
    } finally {
        await browser.close();
    }
});
