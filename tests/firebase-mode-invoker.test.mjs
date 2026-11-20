import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirebaseModeInvoker } from '../app/modules/quiz/firebase-mode-invoker.js';

function dependencies(overrides = {}) {
    const calls = [];
    const functions = { name: 'functions-instance' };
    const callable = async payload => ({ data: { accepted: true, payload } });
    const deps = {
        auth: { app: { options: { projectId: 'demo-quizhub' } } },
        getFunctions: (app, region) => { calls.push(['getFunctions', app, region]); return functions; },
        connectFunctionsEmulator: (instance, host, port) => calls.push(['emulator', instance, host, port]),
        httpsCallable: (instance, name) => { calls.push(['httpsCallable', instance, name]); return callable; },
        location: { hostname: 'localhost', search: '?firebaseEmulator=1' },
        ...overrides
    };
    return { deps, calls };
}

test('Firebase mode invoker connects only to the isolated Functions emulator', async () => {
    const { deps, calls } = dependencies();
    const invoke = createFirebaseModeInvoker(deps);
    const request = { operation: 'start', payload: { mode: 'survival', count: 10 } };
    assert.deepEqual(await invoke(request), { data: { accepted: true, payload: request } });
    assert.deepEqual(calls.map(call => call[0]), ['getFunctions', 'emulator', 'httpsCallable']);
    assert.deepEqual(calls[0].slice(2), ['europe-west1']);
    assert.deepEqual(calls[1].slice(2), ['127.0.0.1', 5001]);
    assert.equal(calls[2][2], 'quizModePreview');
});

test('Firebase mode invoker refuses production hosts and missing emulator opt-in', () => {
    for (const location of [
        { hostname: 'quizhub.example.com', search: '?firebaseEmulator=1' },
        { hostname: 'localhost', search: '' },
        { hostname: '127.0.0.1', search: '?firebaseEmulator=0' }
    ]) {
        const { deps } = dependencies({ location });
        assert.throws(() => createFirebaseModeInvoker(deps), /MODE_PREVIEW_EMULATOR_REQUIRED/);
    }
    const { deps } = dependencies({ auth: { app: { options: { projectId: 'quizhub-e65f5' } } } });
    assert.throws(() => createFirebaseModeInvoker(deps), /MODE_PREVIEW_EMULATOR_REQUIRED/);
});

test('Firebase mode invoker validates the callable envelope', async () => {
    const { deps } = dependencies();
    const invoke = createFirebaseModeInvoker(deps);
    await assert.rejects(invoke({ operation: 'start', payload: {}, uid: 'forged' }), /INVALID_MODE_REQUEST/);
    await assert.rejects(invoke({ operation: 'start', payload: null }), /INVALID_MODE_REQUEST/);
});
