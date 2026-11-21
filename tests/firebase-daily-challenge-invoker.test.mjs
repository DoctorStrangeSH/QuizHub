import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirebaseDailyChallengeInvoker } from '../app/modules/quiz/firebase-daily-challenge-invoker.js';

function fixture({ hostname = 'localhost', search = '?firebaseEmulator=1&dailyChallengePreview=1', projectId = 'demo-quizhub' } = {}) {
    const calls = [];
    const auth = { app: { options: { projectId } } };
    const functions = { region: 'europe-west1' };
    const callable = async payload => { calls.push(payload); return { data: { ok: true } }; };
    const invoke = createFirebaseDailyChallengeInvoker({
        auth,
        getFunctions: (app, region) => { assert.equal(app, auth.app); assert.equal(region, 'europe-west1'); return functions; },
        connectFunctionsEmulator: (instance, host, port) => {
            assert.equal(instance, functions); assert.equal(host, '127.0.0.1'); assert.equal(port, 5001);
        },
        httpsCallable: (instance, name) => { assert.equal(instance, functions); assert.equal(name, 'dailyChallenge'); return callable; },
        location: { hostname, search }
    });
    return { invoke, calls };
}

test('daily challenge invoker is restricted to explicit local demo-emulator preview', async () => {
    const { invoke, calls } = fixture();
    await invoke({ operation: 'start', payload: { language: 'en' } });
    assert.equal(calls.length, 1);
    for (const options of [
        { hostname: 'quizhub.example' },
        { search: '?firebaseEmulator=1' },
        { projectId: 'quizhub-e65f5' }
    ]) {
        assert.throws(() => fixture(options), /DAILY_CHALLENGE_PREVIEW_EMULATOR_REQUIRED/);
    }
});

test('daily challenge invoker rejects unexpected operation fields before callable', async () => {
    const { invoke, calls } = fixture();
    await assert.rejects(invoke({ operation: 'start', payload: { uid: 'forged' } }), /INVALID_DAILY_CHALLENGE_REQUEST/);
    await assert.rejects(invoke({ operation: 'admin', payload: {} }), /INVALID_DAILY_CHALLENGE_REQUEST/);
    assert.equal(calls.length, 0);
});
