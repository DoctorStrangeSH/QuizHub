import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthenticatedDailyLoginHandler } from '../server/authenticated-daily-login-handler.mjs';
import { createDailyLoginCallableAdapter } from '../server/firebase-daily-login-callable-adapter.mjs';

class FakeHttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }

test('authenticated handler uses verified UID and rejects client-selected identity or fields', async () => {
    const calls = [];
    const handle = createAuthenticatedDailyLoginHandler({ service: { claim: async input => (calls.push(input), { coins: 10 }) } });
    assert.deepEqual(await handle('claim', {}, { auth: { uid: 'verified' }, now: 10 }), { coins: 10 });
    assert.deepEqual(calls, [{ uid: 'verified', now: 10 }]);
    await assert.rejects(handle('claim', { uid: 'victim' }, { auth: { uid: 'attacker' }, now: 10 }), /INVALID_DAILY_LOGIN_REQUEST/);
    await assert.rejects(handle('claim', {}, { now: 10 }), /AUTH_REQUIRED/);
});

test('callable supplies server clock and maps duplicate claim without leaking internals', async () => {
    const callable = createDailyLoginCallableAdapter({
        handle: async (operation, payload, context) => ({ operation, payload, uid: context.auth.uid, now: context.now }),
        HttpsError: FakeHttpsError,
        clock: () => 1234
    });
    assert.deepEqual(await callable({ auth: { uid: 'alice' }, data: { operation: 'claim', payload: {} } }),
        { operation: 'claim', payload: {}, uid: 'alice', now: 1234 });

    const duplicate = createDailyLoginCallableAdapter({
        handle: async () => { throw new Error('DAILY_ALREADY_CLAIMED'); }, HttpsError: FakeHttpsError
    });
    await assert.rejects(duplicate({ auth: { uid: 'alice' }, data: { operation: 'claim', payload: {} } }),
        e => e.code === 'failed-precondition' && e.message === 'DAILY_ALREADY_CLAIMED');

    const privateError = createDailyLoginCallableAdapter({
        handle: async () => { throw new Error('private db secret'); }, HttpsError: FakeHttpsError
    });
    await assert.rejects(privateError({ auth: { uid: 'alice' }, data: { operation: 'claim', payload: {} } }),
        e => e.code === 'internal' && e.message === 'DAILY_LOGIN_SERVER_ERROR');
});

test('callable rejects unauthenticated and malformed requests', async () => {
    const callable = createDailyLoginCallableAdapter({ handle: async () => ({}), HttpsError: FakeHttpsError });
    await assert.rejects(callable({ data: { operation: 'claim', payload: {} } }), e => e.code === 'unauthenticated');
    await assert.rejects(callable({ auth: { uid: 'a' }, data: { operation: 'claim', payload: { date: '2026-11-20' } } }),
        e => e.code === 'invalid-argument');
});
