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
        const context = await browser.newContext({ serviceWorkers: 'block' });
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

        const firstOutcome = await page.evaluate(async () => {
            const [{ auth, db, doc, getDoc }, { claimDailyReward }] = await Promise.all([
                import('./app/firebase-config.js'),
                import('./app/modules/daily/daily.js')
            ]);
            const ref = doc(db, 'users', auth.currentUser.uid);
            const beforeSnapshot = await getDoc(ref);
            if (!beforeSnapshot.exists()) throw new Error('PROFILE_NOT_CREATED');
            const before = beforeSnapshot.data();
            const first = await claimDailyReward();
            const afterFirst = (await getDoc(ref)).data();
            const claimedAt = afterFirst.lastDailyClaim?.toDate?.();
            if (!claimedAt) throw new Error('SERVER_CLAIM_TIMESTAMP_MISSING');
            return {
                before,
                first,
                afterFirst,
                claimedAtIso: claimedAt.toISOString()
            };
        });

        // Simulate the local calendar offset that exposes the old local-midnight
        // bug: UTC-10 before 10:00 UTC catches premature claims; UTC+14 after
        // 10:00 UTC catches delayed claims after UTC midnight.
        const claimedAt = new Date(firstOutcome.claimedAtIso);
        const beforeUtcRollover = claimedAt.getUTCHours() < 10;
        const localUtcOffsetHours = beforeUtcRollover ? -10 : 14;
        const fixedNow = new Date(Date.UTC(
            claimedAt.getUTCFullYear(),
            claimedAt.getUTCMonth(),
            claimedAt.getUTCDate() + (beforeUtcRollover ? 0 : 1),
            beforeUtcRollover ? 10 : 0,
            15
        ));
        const expectedCanClaim = !beforeUtcRollover;
        const availabilityAfterBoundary = await page.evaluate(async ({ fixedNowMs, localUtcOffsetHours }) => {
            const { checkDailyReward } = await import('./app/modules/daily/daily.js');
            const NativeDate = Date;
            const offsetMs = localUtcOffsetHours * 60 * 60 * 1000;
            class FixedDate extends NativeDate {
                constructor(...args) { super(...(args.length ? args : [fixedNowMs])); }
                static now() { return fixedNowMs; }
                static [Symbol.hasInstance](value) { return value instanceof NativeDate; }
            }
            globalThis.Date = FixedDate;
            try {
                return await checkDailyReward();
            } finally {
                globalThis.Date = NativeDate;
            }
        }, { fixedNowMs: fixedNow.getTime(), localUtcOffsetHours });

        const retryOutcome = await page.evaluate(async () => {
            const [{ auth, db, doc, getDoc }, { claimDailyReward }] = await Promise.all([
                import('./app/firebase-config.js'),
                import('./app/modules/daily/daily.js')
            ]);
            const retry = await claimDailyReward();
            const afterRetry = (await getDoc(doc(db, 'users', auth.currentUser.uid))).data();
            return { retry, afterRetry };
        });
        const outcome = {
            ...firstOutcome,
            availabilityAfterBoundary,
            expectedCanClaim,
            ...retryOutcome
        };

        assert.equal(outcome.first?.coins, 10, 'First-day reward must use the server catalog');
        assert.equal(outcome.first?.day, 1);
        assert.equal(outcome.first?.balance, (outcome.before.coins || 0) + 10);
        assert.equal(outcome.afterFirst.coins, outcome.first.balance);
        assert.equal(outcome.afterFirst.dailyStreak, 1);
        assert.equal(outcome.availabilityAfterBoundary.canClaim, outcome.expectedCanClaim,
            'Claim availability must follow UTC midnight, not the simulated local calendar boundary');
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
