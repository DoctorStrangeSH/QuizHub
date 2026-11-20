import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirebaseClassicInvoker } from '../app/modules/quiz/firebase-classic-invoker.js';

function setup({ hostname = 'localhost', search = '?firebaseEmulator=1&serverModePreview=1', projectId = 'demo-quizhub' } = {}) {
    const calls = [];
    const auth = { app: { options: { projectId } } };
    const functions = { id: 'functions' };
    const callable = async payload => (calls.push(payload), { data: { ok: true } });
    const invoke = createFirebaseClassicInvoker({
        auth,
        getFunctions: (...args) => (calls.push(['getFunctions', ...args]), functions),
        connectFunctionsEmulator: (...args) => calls.push(['connect', ...args]),
        httpsCallable: (...args) => (calls.push(['httpsCallable', ...args]), callable),
        location: { hostname, search }
    });
    return { invoke, calls };
}

test('Classic transport connects only to isolated local demo project', async () => {
    const { invoke, calls } = setup();
    await invoke({ operation: 'start', payload: { mode: 'classic' } });
    assert.deepEqual(calls[0], ['getFunctions', { options: { projectId: 'demo-quizhub' } }, 'europe-west1']);
    assert.deepEqual(calls[1], ['connect', { id: 'functions' }, '127.0.0.1', 5001]);
    assert.deepEqual(calls[2], ['httpsCallable', { id: 'functions' }, 'quizSessionPreview']);
    assert.deepEqual(calls[3], { operation: 'start', payload: { mode: 'classic' } });
});

test('Classic transport rejects production hosts, missing opt-in and non-demo project', () => {
    for (const config of [
        { hostname: 'quizhub.example', search: '?firebaseEmulator=1&serverModePreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1' },
        { hostname: 'localhost', search: '?serverModePreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1&serverModePreview=1', projectId: 'quizhub-e65f5' }
    ]) assert.throws(() => setup(config), /CLASSIC_PREVIEW_EMULATOR_REQUIRED/);
});

test('Classic transport rejects forged operations and malformed envelopes before network calls', async () => {
    const { invoke, calls } = setup();
    for (const payload of [
        { operation: 'claim', payload: { sessionId: 's' } },
        { operation: 'start', payload: { uid: 'victim', score: 999 } },
        { operation: 'answer', payload: [] },
        { operation: 'start', payload: { mode: 'classic' }, uid: 'victim' }
    ]) await assert.rejects(invoke(payload), /INVALID_CLASSIC_REQUEST/);
    assert.equal(calls.length, 3);
});
