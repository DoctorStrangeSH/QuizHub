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

test('real browser: register, persist session, log out and sign in again', { timeout: 90000 }, async () => {
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
