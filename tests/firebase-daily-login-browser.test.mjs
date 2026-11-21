import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:8765/?firebaseEmulator=1&profileCreatePreview=1&dailyLoginPreview=1';
const project = 'demo-quizhub';

test('authenticated browser claims daily login reward through trusted callable exactly once', { timeout: 150000 }, async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Auth emulator required');
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project,
        'This browser test must never use a production project');

    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ serviceWorkers: 'block', timezoneId: 'Pacific/Kiritimati' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(url);
        await page.locator('#auth-form').waitFor({ timeout: 30000 });

        const email = 'daily-login-' + Date.now() + '@example.test';
        await page.evaluate(() => window.switchAuthMode());
        await page.locator('#auth-password[autocomplete="new-password"]').waitFor();
        await page.locator('#auth-email').fill(email);
        await page.locator('#auth-password').fill('Daily-login-emulator-5830');
        await page.locator('#auth-form button[type="submit"]').click();
        await page.locator('#profile-form').waitFor({ timeout: 30000 });

        const nickname = 'Daily' + Date.now().toString(36);
        await page.locator('#nickname-input').fill(nickname);
        await page.locator('#check-nickname-btn').click();
        await page.locator('#save-profile-btn:not([disabled])').waitFor({ timeout: 20000 });
        await page.locator('#save-profile-btn').click();
        await page.locator('.play-btn').waitFor({ timeout: 30000 });

        const outcome = await page.evaluate(async () => {
            const [{ auth, db, doc, getDoc }, { claimDailyReward, checkDailyReward }] = await Promise.all([
                import('./app/firebase-config.js'),
                import('./app/modules/daily/daily.js')
            ]);
            const ref = doc(db, 'users', auth.currentUser.uid);
            const beforeSnapshot = await getDoc(ref);
            if (!beforeSnapshot.exists()) throw new Error('PROFILE_NOT_CREATED');
            const before = beforeSnapshot.data();

            const first = await claimDailyReward();
            const afterFirst = (await getDoc(ref)).data();
            const availabilityAfterFirst = await checkDailyReward();
            const retry = await claimDailyReward();
            const afterRetry = (await getDoc(ref)).data();
            return {
                uid: auth.currentUser.uid,
                before,
                first,
                afterFirst,
                availabilityAfterFirst,
                retry,
                afterRetry
            };
        });

        assert.equal(outcome.first?.coins, 10, 'First-day reward must use the server catalog');
        assert.equal(outcome.first?.day, 1);
        assert.equal(outcome.first?.balance, (outcome.before.coins || 0) + 10);
        assert.equal(outcome.afterFirst.coins, outcome.first.balance);
        assert.equal(outcome.afterFirst.dailyStreak, 1);
        assert.equal(outcome.availabilityAfterFirst.canClaim, false,
            'UTC same-day claim must remain unavailable even when browser timezone is UTC+14');
        assert.ok(outcome.afterFirst.lastDailyClaim, 'Server claim timestamp must be persisted');
        assert.equal(outcome.retry, false, 'Same-day retry must not produce another reward');
        assert.equal(outcome.afterRetry.coins, outcome.afterFirst.coins);
        assert.equal(outcome.afterRetry.dailyStreak, outcome.afterFirst.dailyStreak);
        assert.deepEqual(errors, [], 'No uncaught browser exceptions');
        await context.close();
    } finally {
        await browser.close();
    }
});
