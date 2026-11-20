import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirebaseDailyLoginInvoker, claimDailyLoginPreview } from '../app/modules/daily/firebase-daily-login-invoker.js';

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

const rewards = [10, 20, 30, 50, 75, 100, 200].map((coins, index) => ({ day: index + 1, coins }));

test('adapts the server receipt to the daily popup without recalculating its award', async () => {
    const result = await claimDailyLoginPreview(
        async () => ({ data: { streak: 2, coins: 20, balance: 120, alreadyClaimed: false } }),
        rewards
    );
    assert.deepEqual(result, { day: 2, coins: 20, balance: 120 });
});

test('caps streak display at the final reward tier while retaining actual streak', async () => {
    const result = await claimDailyLoginPreview(
        async () => ({ data: { streak: 12, coins: 200, balance: 500, alreadyClaimed: false } }),
        rewards
    );
    assert.deepEqual(result, { day: 12, coins: 200, balance: 500 });
});

test('does not show a reward for an already-claimed receipt', async () => {
    const result = await claimDailyLoginPreview(
        async () => ({ data: { streak: 2, coins: 20, balance: 120, alreadyClaimed: true } }),
        rewards
    );
    assert.equal(result, false);
});

test('rejects malformed or inconsistent server receipts', async () => {
    for (const data of [
        null,
        { streak: 0, coins: 10, balance: 10 },
        { streak: 1, coins: 20, balance: 20 },
        { streak: 1, coins: 10, balance: -1 },
        { streak: 1, coins: 10, balance: 10.5 }
    ]) {
        await assert.rejects(
            claimDailyLoginPreview(async () => ({ data }), rewards),
            /INVALID_DAILY_LOGIN_RECEIPT/
        );
    }
});
