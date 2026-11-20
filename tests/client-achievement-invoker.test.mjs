import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createFirebaseAchievementInvoker,
    evaluateAchievementsPreview
} from '../app/modules/achievements/firebase-achievement-invoker.js';

function setup({ hostname = 'localhost', search = '?firebaseEmulator=1&achievementPreview=1', projectId = 'demo-quizhub' } = {}) {
    const calls = [];
    const auth = { app: { options: { projectId } } };
    const functions = { name: 'functions-emulator' };
    const callable = async payload => (calls.push(payload), { data: {
        unlocked: ['first_quiz'], newlyUnlocked: ['first_quiz'], alreadyUnlocked: false
    } });
    const invoke = createFirebaseAchievementInvoker({
        auth,
        getFunctions: (...args) => (calls.push(['getFunctions', ...args]), functions),
        connectFunctionsEmulator: (...args) => calls.push(['connect', ...args]),
        httpsCallable: (...args) => (calls.push(['httpsCallable', ...args]), callable),
        location: { hostname, search }
    });
    return { invoke, calls };
}

test('connects only to local demo project with explicit achievement preview opt-in', async () => {
    const { invoke, calls } = setup();
    await invoke();
    assert.deepEqual(calls[0], ['getFunctions', { options: { projectId: 'demo-quizhub' } }, 'europe-west1']);
    assert.deepEqual(calls[1], ['connect', { name: 'functions-emulator' }, '127.0.0.1', 5001]);
    assert.deepEqual(calls[2], ['httpsCallable', { name: 'functions-emulator' }, 'achievementUnlockPreview']);
    assert.deepEqual(calls[3], { operation: 'evaluate', payload: {} });
});

test('rejects production hosts, missing flags and non-demo projects before connecting', () => {
    for (const config of [
        { hostname: 'quizhub.example', search: '?firebaseEmulator=1&achievementPreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1' },
        { hostname: 'localhost', search: '?achievementPreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1&achievementPreview=1', projectId: 'quizhub-e65f5' }
    ]) assert.throws(() => setup(config), /ACHIEVEMENT_PREVIEW_EMULATOR_REQUIRED/);
});

test('rejects caller-supplied facts, IDs and malformed request envelopes', async () => {
    const { invoke, calls } = setup();
    for (const payload of [
        { operation: 'evaluate', payload: { experience: 999999 } },
        { operation: 'evaluate', payload: { achievementIds: ['level_ten'] } },
        { operation: 'claim', payload: {} },
        { operation: 'evaluate', payload: {}, uid: 'victim' }
    ]) await assert.rejects(invoke(payload), /INVALID_ACHIEVEMENT_REQUEST/);
    assert.equal(calls.length, 3, 'invalid requests never reach the callable');
});

test('validates server receipts and returns only newly unlocked catalog IDs', async () => {
    const catalog = [{ id: 'first_quiz' }, { id: 'level_five' }];
    const result = await evaluateAchievementsPreview(
        async () => ({ data: { unlocked: ['first_quiz'], newlyUnlocked: ['first_quiz'], alreadyUnlocked: false } }),
        catalog
    );
    assert.deepEqual(result, ['first_quiz']);
    assert.deepEqual(await evaluateAchievementsPreview(
        async () => ({ data: { unlocked: ['first_quiz'], newlyUnlocked: [], alreadyUnlocked: true } }),
        catalog
    ), []);
});

test('rejects malformed, duplicate and unknown achievement receipts', async () => {
    const catalog = [{ id: 'first_quiz' }];
    for (const data of [
        { unlocked: [], newlyUnlocked: ['unknown'], alreadyUnlocked: false },
        { unlocked: [], newlyUnlocked: ['first_quiz'], alreadyUnlocked: false },
        { unlocked: ['first_quiz'], newlyUnlocked: ['first_quiz', 'first_quiz'], alreadyUnlocked: false },
        { unlocked: ['first_quiz'], newlyUnlocked: [], alreadyUnlocked: false },
        { unlocked: 'first_quiz', newlyUnlocked: [], alreadyUnlocked: true }
    ]) {
        await assert.rejects(evaluateAchievementsPreview(async () => ({ data }), catalog), /INVALID_ACHIEVEMENT_RECEIPT/);
    }
});
