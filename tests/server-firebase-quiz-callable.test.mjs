import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuizCallableAdapter } from '../server/firebase-quiz-callable-adapter.mjs';
import { createAuthenticatedQuizHandler } from '../server/authenticated-quiz-handler.mjs';

class FakeHttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}

const request = (operation, payload = {}, uid = 'alice') => ({
    auth: { uid }, data: { operation, payload }
});
const adapter = (handle, clock = () => 1731660000000) =>
    createQuizCallableAdapter({ handle, HttpsError: FakeHttpsError, clock });

test('rejects anonymous requests and all extra envelope fields before invoking service', async () => {
    let calls = 0;
    const call = adapter(async () => { calls++; });
    await assert.rejects(call({ data: { operation: 'start', payload: {} } }),
        error => error.code === 'unauthenticated');
    await assert.rejects(call({ ...request('start'), data: {
        operation: 'start', payload: {}, uid: 'mallory'
    } }), error => error.code === 'invalid-argument');
    for (const payload of [null, [], 'start', 42]) {
        await assert.rejects(call({ ...request('start'), data: {
            operation: 'start', payload
        } }), error => error.code === 'invalid-argument');
    }
    assert.equal(calls, 0);
});

test('end-to-end transport and authenticated boundary use only server identity and time', async () => {
    const seen = [];
    const service = Object.fromEntries(['start', 'answer', 'resume', 'complete'].map(
        operation => [operation, async input => {
            seen.push({ operation, input });
            return { ok: true };
        }]
    ));
    const call = adapter(createAuthenticatedQuizHandler(service), () => 123456);
    await call(request('start', { mode: 'classic', count: 10 }));
    await call(request('answer', { sessionId: 's1', questionId: 'q1', answerIndex: 2 }));
    await call(request('resume', { sessionId: 's1' }));
    await call(request('complete', { sessionId: 's1' }));
    assert.deepEqual(seen.map(entry => entry.operation), ['start', 'answer', 'resume', 'complete']);
    for (const { input } of seen) {
        assert.equal(input.uid, 'alice');
        assert.equal(input.now, 123456);
    }
    for (const field of ['uid', 'now', 'score', 'xp', 'coins', 'correctIndex']) {
        await assert.rejects(call(request('complete', { sessionId: 's1', [field]: 9000 })),
            error => error.code === 'invalid-argument');
    }
    assert.equal(seen.length, 4);
});

test('maps known failures without exposing internal details', async () => {
    for (const [message, expected] of [
        ['INVALID_ANSWER', 'invalid-argument'],
        ['INVALID_SELECTION', 'invalid-argument'],
        ['NOT_ENOUGH_QUESTIONS', 'failed-precondition'],
        ['UNSUPPORTED_QUIZ_MODE', 'failed-precondition'],
        ['SESSION_NOT_FOUND', 'not-found'],
        ['NOT_SESSION_OWNER', 'permission-denied'],
        ['SESSION_EXPIRED', 'failed-precondition'],
        ['USER_NOT_FOUND', 'not-found'],
        ['database credentials /projects/secret', 'internal']
    ]) {
        const call = adapter(async () => { throw new Error(message); });
        await assert.rejects(call(request('complete', { sessionId: 's1' })), error => {
            assert.equal(error.code, expected);
            assert.equal(error.message, expected === 'internal' ? 'QUIZ_SERVER_ERROR' : message);
            return true;
        });
    }
});
