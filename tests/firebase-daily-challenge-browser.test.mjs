import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:8765/?firebaseEmulator=1';
const project = 'demo-quizhub';

test('authenticated browser completes the server-owned Daily Challenge and receives an idempotent receipt', { timeout: 150000 }, async () => {
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

        const outcome = await page.evaluate(async () => {
            const [{ auth }, { signInAnonymously }, { getFunctions, connectFunctionsEmulator, httpsCallable }] =
                await Promise.all([
                    import('./app/firebase-config.js'),
                    import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'),
                    import('https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js')
                ]);
            const credential = await signInAnonymously(auth);
            const functions = getFunctions(auth.app, 'europe-west1');
            connectFunctionsEmulator(functions, '127.0.0.1', 5001);
            const dailyChallenge = httpsCallable(functions, 'dailyChallenge');
            const call = async (operation, payload = {}) =>
                (await dailyChallenge({ operation, payload })).data;

            const started = await call('start', { language: 'en' });
            if (started.totalQuestions !== 10 || started.status !== 'in_progress' ||
                !started.question?.id || 'correctIndex' in started.question || 'answer' in started.question) {
                throw new Error('INVALID_DAILY_START_RECEIPT');
            }

            let current = started;
            for (let index = 0; index < 10; index++) {
                if (!current.question?.id) throw new Error('DAILY_QUESTION_MISSING_' + index);
                current = await call('answer', {
                    date: started.date,
                    questionId: current.question.id,
                    answerIndex: 0,
                    language: 'en'
                });
                if (current.answeredQuestions !== index + 1) {
                    throw new Error('DAILY_ANSWER_COUNT_MISMATCH_' + index);
                }
            }
            if (current.status !== 'ready_to_complete' || current.question !== null) {
                throw new Error('DAILY_SESSION_NOT_READY_TO_COMPLETE');
            }

            const receipt = await call('complete', { date: started.date });
            const retry = await call('complete', { date: started.date });
            const resumed = await call('resume', { date: started.date, language: 'en' });
            return {
                uid: credential.user.uid,
                date: started.date,
                answered: current.answeredQuestions,
                receipt,
                retry,
                resumed
            };
        });

        assert.equal(outcome.answered, 10);
        assert.equal(outcome.receipt.alreadyCompleted, false);
        assert.equal(outcome.receipt.uid, outcome.uid);
        assert.equal(outcome.receipt.date, outcome.date);
        assert.equal(outcome.receipt.totalQuestions, 10);
        assert.equal(Number.isSafeInteger(outcome.receipt.correctAnswers), true);
        assert.equal(Number.isSafeInteger(outcome.receipt.score), true);
        assert.equal(outcome.retry.alreadyCompleted, true);
        assert.equal(outcome.retry.score, outcome.receipt.score);
        assert.equal(outcome.retry.correctAnswers, outcome.receipt.correctAnswers);
        assert.equal(outcome.resumed.status, 'completed');
        assert.equal(outcome.resumed.receipt.score, outcome.receipt.score);
        assert.deepEqual(errors, [], 'No uncaught browser exceptions');
        await context.close();
    } finally {
        await browser.close();
    }
});
