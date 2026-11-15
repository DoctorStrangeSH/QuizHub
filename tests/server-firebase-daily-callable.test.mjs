import test from 'node:test';
import assert from 'node:assert/strict';
import { createDailyCallableAdapter } from '../server/firebase-daily-callable-adapter.mjs';

class FakeHttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}

function adapter(handle, clock = () => 1234) {
    return createDailyCallableAdapter({ handle, HttpsError: FakeHttpsError, clock });
}

test('callable rejects unauthenticated requests and untrusted envelope fields', async () => {
    const call = adapter(async () => { throw new Error('SHOULD_NOT_CALL'); });
    await assert.rejects(call({ data: { operation: 'start', payload: {} } }),
        error => error.code === 'unauthenticated');
    await assert.rejects(call({
        auth: { uid: 'alice' }, data: { operation: 'start', payload: {}, uid: 'bob' }
    }), error => error.code === 'invalid-argument');
});

test('callable passes only verified Firebase identity and server clock', async () => {
    const call = adapter(async (operation, payload, context) => {
        assert.equal(operation, 'answer');
        assert.deepEqual(payload, { date: '2026-11-15', questionId: 'q', answerIndex: 1 });
        assert.deepEqual(context, { auth: { uid: 'alice' }, now: 1234 });
        return { status: 'in_progress' };
    });
    const result = await call({
        auth: { uid: 'alice' },
        data: { operation: 'answer', payload: {
            date: '2026-11-15', questionId: 'q', answerIndex: 1
        } }
    });
    assert.deepEqual(result, { status: 'in_progress' });
});

test('expected errors have safe callable codes and unknown exceptions are hidden', async () => {
    for (const [message, expected] of [
        ['INVALID_DAILY_DATE', 'invalid-argument'],
        ['DAILY_ATTEMPT_NOT_FOUND', 'not-found'],
        ['SESSION_CLOSED', 'failed-precondition'],
        ['secret internal path /admin/users', 'internal']
    ]) {
        const call = adapter(async () => { throw new Error(message); });
        await assert.rejects(call({
            auth: { uid: 'alice' }, data: { operation: 'start', payload: {} }
        }), error => {
            assert.equal(error.code, expected);
            if (expected === 'internal') assert.equal(error.message, 'DAILY_SERVER_ERROR');
            return true;
        });
    }
});
