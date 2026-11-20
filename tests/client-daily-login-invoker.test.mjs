import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirebaseDailyLoginInvoker } from '../app/modules/daily/firebase-daily-login-invoker.js';

function setup({ hostname = 'localhost', search = '?firebaseEmulator=1&dailyLoginPreview=1', projectId = 'demo-quizhub' } = {}) {
    const calls = [];
    const auth = { app: { options: { projectId } } };
    const functions = { name: 'functions-emulator' };
    const callable = async payload => (calls.push(payload), { data: { coins: 20, streak: 2, alreadyClaimed: false } });
    const invoke = createFirebaseDailyLoginInvoker({
        auth,
        getFunctions: (...args) => (calls.push(['getFunctions', ...args]), functions),
        connectFunctionsEmulator: (...args) => calls.push(['connect', ...args]),
        httpsCallable: (...args) => (calls.push(['httpsCallable', ...args]), callable),
        location: { hostname, search }
    });
    return { invoke, calls };
}

test('connects only to local demo project with explicit daily preview opt-in', async () => {
    const { invoke, calls } = setup();
    const result = await invoke();
    assert.deepEqual(result.data, { coins: 20, streak: 2, alreadyClaimed: false });
    assert.deepEqual(calls[0], ['getFunctions', { options: { projectId: 'demo-quizhub' } }, 'europe-west1']);
    assert.deepEqual(calls[1], ['connect', { name: 'functions-emulator' }, '127.0.0.1', 5001]);
    assert.deepEqual(calls[2], ['httpsCallable', { name: 'functions-emulator' }, 'dailyLoginRewardPreview']);
    assert.deepEqual(calls[3], { operation: 'claim', payload: {} });
});

test('rejects production hosts, missing opt-in and non-demo projects before connecting', () => {
    for (const config of [
        { hostname: 'quizhub.example', search: '?firebaseEmulator=1&dailyLoginPreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1' },
        { hostname: 'localhost', search: '?dailyLoginPreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1&dailyLoginPreview=1', projectId: 'quizhub-e65f5' }
    ]) {
        assert.throws(() => setup(config), /DAILY_LOGIN_PREVIEW_EMULATOR_REQUIRED/);
    }
});

test('rejects malformed or client-authored callable envelopes', async () => {
    const { invoke, calls } = setup();
    for (const payload of [
        null,
        [],
        { operation: 'claim', payload: {}, uid: 'attacker' },
        { operation: 'claim', payload: { uid: 'attacker' } },
        { operation: 'award', payload: {} }
    ]) {
        await assert.rejects(invoke(payload), /INVALID_DAILY_LOGIN_REQUEST/);
    }
    assert.equal(calls.length, 3, 'invalid payloads never reach the callable');
});
