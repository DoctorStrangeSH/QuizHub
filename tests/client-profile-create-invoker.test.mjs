import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirebaseProfileCreateInvoker } from '../app/modules/profile/firebase-profile-create-invoker.js';

function setup({ hostname = 'localhost', search = '?firebaseEmulator=1&profileCreatePreview=1', projectId = 'demo-quizhub', user = { uid: 'verified-user', isAnonymous: false } } = {}) {
    const calls = [];
    const auth = { app: { options: { projectId } }, currentUser: user };
    const functions = { id: 'functions' };
    const callable = async payload => {
        calls.push(payload);
        return { data: { status: 'created', uid: auth.currentUser.uid, nickname: payload.nickname } };
    };
    const create = createFirebaseProfileCreateInvoker({
        auth,
        getFunctions: (...args) => (calls.push(['getFunctions', ...args]), functions),
        connectFunctionsEmulator: (...args) => calls.push(['connect', ...args]),
        httpsCallable: (...args) => (calls.push(['httpsCallable', ...args]), callable),
        location: { hostname, search }
    });
    return { create, calls };
}

test('connects only to local demo emulator with explicit profile-create opt-in', async () => {
    const { create, calls } = setup();
    assert.deepEqual(await create('Hero_123'), { status: 'created', nickname: 'Hero_123' });
    assert.deepEqual(calls[0], ['getFunctions', { options: { projectId: 'demo-quizhub' } }, 'europe-west1']);
    assert.deepEqual(calls[1], ['connect', { id: 'functions' }, '127.0.0.1', 5001]);
    assert.deepEqual(calls[2], ['httpsCallable', { id: 'functions' }, 'profileCreatePreview']);
    assert.deepEqual(calls[3], { nickname: 'Hero_123', timeZone: 'UTC' });
});

test('rejects production host, missing flags, wrong project and anonymous accounts', () => {
    for (const config of [
        { hostname: 'quizhub.example', search: '?firebaseEmulator=1&profileCreatePreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1&profileCreatePreview=1', projectId: 'quizhub-e65f5' },
        { hostname: 'localhost', search: '?firebaseEmulator=1&profileCreatePreview=1', user: { uid: 'anon', isAnonymous: true } },
        { hostname: 'localhost', search: '?firebaseEmulator=1&profileCreatePreview=1', user: null }
    ]) assert.throws(() => setup(config), /PROFILE_CREATE_PREVIEW_EMULATOR_REQUIRED|SIGNED_IN_ACCOUNT_REQUIRED/);
});

test('sends nickname and timezone preference and rejects invalid input before callable invocation', async () => {
    const { create, calls } = setup();
    for (const nickname of ['ab', 'bad name', 'name/with/slash', 'a'.repeat(21)]) {
        await assert.rejects(create(nickname), /INVALID_NICKNAME/);
    }
    await assert.rejects(create('ValidName', 'Mars/Olympus'), /INVALID_TIME_ZONE/);
    assert.equal(calls.length, 3);
});

test('rejects a forged or mismatched server receipt', async () => {
    const auth = { app: { options: { projectId: 'demo-quizhub' } }, currentUser: { uid: 'verified-user', isAnonymous: false } };
    const create = createFirebaseProfileCreateInvoker({
        auth, getFunctions: () => ({}), connectFunctionsEmulator() {},
        httpsCallable: () => async () => ({ data: { status: 'created', uid: 'victim', nickname: 'Hero' } }),
        location: { hostname: 'localhost', search: '?firebaseEmulator=1&profileCreatePreview=1' }
    });
    await assert.rejects(create('Hero'), /INVALID_PROFILE_CREATE_RECEIPT/);
});
