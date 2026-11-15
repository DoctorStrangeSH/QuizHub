import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:8765/?firebaseEmulator=1';
const project = 'demo-quizhub';

async function waitForIdentity(page) {
    for (let attempt = 0; attempt < 100; attempt++) {
        const identity = await page.evaluate(async () => {
            const { auth } = await import('./app/firebase-config.js');
            return { uid: auth.currentUser?.uid || null, projectId: auth.app.options.projectId };
        });
        if (identity.uid) return identity;
        await page.waitForTimeout(250);
    }
    const message = await page.locator('#auth-feedback').textContent().catch(() => '');
    throw new Error('Firebase login did not complete. UI message: ' + message);
}

test('real browser: register, persist session, log out, sign in again and sync profile across browsers', { timeout: 120000 }, async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Auth emulator required');
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);

    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ serviceWorkers: 'block' });
        const page = await context.newPage();
        const runtimeErrors = [];
        page.on('pageerror', error => runtimeErrors.push(error.message));

        await page.goto(url);
        await page.locator('#auth-form').waitFor({ timeout: 25000 });
        assert.equal(await page.locator('#auth-google').count(), 1);
        assert.equal(await page.locator('#auth-reset').count(), 1);

        const email = `browser-${Date.now()}@example.test`;
        const password = 'Browser-test-5830';
        await page.evaluate(() => window.switchAuthMode());
        await page.locator('#auth-password[autocomplete="new-password"]').waitFor();
        await page.locator('#auth-email').fill(email);
        await page.locator('#auth-password').fill(password);
        await page.locator('#auth-form button[type="submit"]').click();

        const firstIdentity = await waitForIdentity(page);
        assert.equal(firstIdentity.projectId, project);
        assert.ok(firstIdentity.uid);

        // Create the actual profile through the UI; the second browser must
        // discover it from Firestore, not from this context's local storage.
        await page.locator('#profile-form').waitFor({ timeout: 20000 });
        const nickname = 'Qh' + Date.now().toString(36);
        await page.locator('#nickname-input').fill(nickname);
        await page.locator('#check-nickname-btn').click();
        await page.locator('#save-profile-btn:not([disabled])').waitFor({ timeout: 15000 });
        await page.locator('#save-profile-btn').click();
        await page.waitForFunction(async (expected) => {
            const { auth, db, doc, getDoc } = await import('./app/firebase-config.js');
            if (!auth.currentUser) return false;
            const snapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
            return snapshot.data()?.nickname === expected;
        }, nickname, { timeout: 20000 });

        const otherContext = await browser.newContext({ serviceWorkers: 'block' });
        const otherPage = await otherContext.newPage();
        const otherErrors = [];
        otherPage.on('pageerror', error => otherErrors.push(error.message));
        await otherPage.goto(url);
        await otherPage.locator('#auth-form').waitFor({ timeout: 25000 });
        await otherPage.locator('#auth-email').fill(email);
        await otherPage.locator('#auth-password').fill(password);
        await otherPage.locator('#auth-form button[type="submit"]').click();
        const otherIdentity = await waitForIdentity(otherPage);
        assert.equal(otherIdentity.uid, firstIdentity.uid, 'Separate browser must retain the same UID');
        await otherPage.locator('#profile-form').waitFor({ state: 'detached', timeout: 20000 });
        const otherProfile = await otherPage.evaluate(async () => {
            const { auth, db, doc, getDoc } = await import('./app/firebase-config.js');
            const snapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
            return snapshot.exists() ? snapshot.data() : null;
        });
        assert.equal(otherProfile?.nickname, nickname, 'Profile must sync through Firestore');
        assert.equal(otherProfile?.coins, 100, 'Initial progress must be available on second browser');
        assert.equal(otherProfile?.level, 1);
        assert.deepEqual(otherErrors, [], `Second browser errors: ${otherErrors.join(' | ')}`);
        await otherContext.close();

        await page.reload();
        const persistedUid = (await waitForIdentity(page)).uid;
        assert.equal(persistedUid, firstIdentity.uid);

        await page.evaluate(async () => {
            const { auth } = await import('./app/firebase-config.js');
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            await signOut(auth);
        });
        await page.locator('#auth-form').waitFor({ timeout: 15000 });
        await page.locator('#auth-email').fill(email);
        await page.locator('#auth-password').fill(password);
        await page.locator('#auth-form button[type="submit"]').click();
        const secondUid = (await waitForIdentity(page)).uid;
        assert.equal(secondUid, firstIdentity.uid, 'Re-login must not create another profile identity');
        assert.deepEqual(runtimeErrors, [], `Unexpected browser errors: ${runtimeErrors.join(' | ')}`);
        await context.close();
    } finally {
        await browser.close();
    }
});

test('real browser: password reset email request and new-password sign-in', { timeout: 90000 }, async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Auth emulator required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);

    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ serviceWorkers: 'block' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(url);
        await page.locator('#auth-form').waitFor({ timeout: 25000 });

        const email = `reset-${Date.now()}@example.test`;
        const originalPassword = 'Before-reset-5830';
        const updatedPassword = 'After-reset-5830';

        await page.evaluate(() => window.switchAuthMode());
        await page.locator('#auth-password[autocomplete="new-password"]').waitFor();
        await page.locator('#auth-email').fill(email);
        await page.locator('#auth-password').fill(originalPassword);
        await page.locator('#auth-form button[type="submit"]').click();
        const firstIdentity = await waitForIdentity(page);

        await page.evaluate(async () => {
            const { auth } = await import('./app/firebase-config.js');
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            await signOut(auth);
        });
        await page.locator('#auth-reset').waitFor({ timeout: 15000 });

        await page.locator('#auth-reset').click();
        await page.locator('#auth-feedback.auth-feedback--error').waitFor();
        assert.match(await page.locator('#auth-feedback').textContent(), /Введите адрес|Enter your email/);

        await page.locator('#auth-email').fill(email);
        await page.locator('#auth-reset').click();
        await page.locator('#auth-feedback.auth-feedback--success').waitFor({ timeout: 15000 });

        // Auth Emulator captures out-of-band emails without contacting a real mailbox.
        const response = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${project}/oobCodes`);
        assert.equal(response.ok, true, 'Auth Emulator must expose the reset code');
        const { oobCodes } = await response.json();
        const reset = oobCodes.find(code => code.requestType === 'PASSWORD_RESET' && code.email === email);
        assert.ok(reset?.oobCode, 'Password-reset code must target the registered address');

        await page.evaluate(async ({ code, password }) => {
            const { auth } = await import('./app/firebase-config.js');
            const { confirmPasswordReset } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            await confirmPasswordReset(auth, code, password);
        }, { code: reset.oobCode, password: updatedPassword });

        await page.locator('#auth-password').fill(originalPassword);
        await page.locator('#auth-form button[type="submit"]').click();
        await page.locator('#auth-feedback.auth-feedback--error').waitFor({ timeout: 15000 });
        assert.equal(await page.evaluate(async () => {
            const { auth } = await import('./app/firebase-config.js');
            return auth.currentUser?.uid || null;
        }), null, 'Old password must be rejected after reset');

        await page.locator('#auth-password').fill(updatedPassword);
        await page.locator('#auth-form button[type="submit"]').click();
        const newIdentity = await waitForIdentity(page);
        assert.equal(newIdentity.uid, firstIdentity.uid, 'Password reset must preserve UID');
        assert.deepEqual(errors, [], `Browser errors: ${errors.join(' | ')}`);
        await context.close();
    } finally {
        await browser.close();
    }
});
