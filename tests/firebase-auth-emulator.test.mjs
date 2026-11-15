import assert from 'node:assert/strict';
import test from 'node:test';

const project = 'demo-quizhub';
const base = 'http://127.0.0.1:9099';
const identity = `${base}/identitytoolkit.googleapis.com/v1`;

async function authRequest(action, body) {
    const response = await fetch(`${identity}/accounts:${action}?key=emulator-key`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    });
    return { status: response.status, data: await response.json() };
}

test('Firebase Auth Emulator: email signup, existing account login and recovery', async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST,
        'Auth Emulator must be started before running tests');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project,
        'Never run identity lifecycle tests against real Firebase');

    const email = `quizhub-smoke-${Date.now()}@example.test`;
    const password = 'Test-only-password-4827';
    const signUp = await authRequest('signUp', { email, password, returnSecureToken: true });
    assert.equal(signUp.status, 200, JSON.stringify(signUp.data));
    assert.ok(signUp.data.localId);
    assert.ok(signUp.data.idToken);

    const login = await authRequest('signInWithPassword', {
        email, password, returnSecureToken: true
    });
    assert.equal(login.status, 200, JSON.stringify(login.data));
    assert.equal(login.data.localId, signUp.data.localId);
    assert.ok(login.data.refreshToken);

    const account = await authRequest('lookup', { idToken: login.data.idToken });
    assert.equal(account.status, 200, JSON.stringify(account.data));
    assert.equal(account.data.users?.[0]?.localId, signUp.data.localId);

    const wrong = await authRequest('signInWithPassword', {
        email, password: 'definitely-wrong', returnSecureToken: true
    });
    assert.notEqual(wrong.status, 200);
    assert.equal(wrong.data.error?.code, 400);

    const duplicate = await authRequest('signUp', {
        email, password: 'Yet-another-test-password', returnSecureToken: true
    });
    assert.notEqual(duplicate.status, 200);
    assert.match(duplicate.data.error?.message || '', /EMAIL_EXISTS/);

    const recovery = await authRequest('sendOobCode', {
        requestType: 'PASSWORD_RESET', email
    });
    assert.equal(recovery.status, 200, JSON.stringify(recovery.data));
    assert.equal(recovery.data.email, email);
    const pending = await fetch(`${base}/emulator/v1/projects/${project}/oobCodes`);
    assert.equal(pending.status, 200);
    const codes = await pending.json();
    assert.ok(codes.oobCodes.some(code => code.email === email && code.requestType === 'PASSWORD_RESET'),
        'Password reset must generate an emulator-only out-of-band code');
});
