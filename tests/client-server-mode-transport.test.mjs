import test from 'node:test';
import assert from 'node:assert/strict';
import { createServerModeClient } from '../app/modules/quiz/server-mode-client.js';

test('client transport sends only allowlisted gameplay payloads', async () => {
    const calls = [];
    const client = createServerModeClient({
        invoke: async request => {
            calls.push(request);
            return { data: { ok: true, operation: request.operation } };
        }
    });
    await client.start({ mode: 'duel', category: 'science', difficulty: 'easy', count: 7, language: 'ru' });
    await client.answer({ sessionId: 's1', questionId: 'q1', answerIndex: 2 });
    await client.resume({ sessionId: 's1', language: 'en' });
    await client.claim({ sessionId: 's1' });
    assert.deepEqual(calls, [
        { operation: 'start', payload: { mode: 'duel', category: 'science', difficulty: 'easy', count: 7, language: 'ru' } },
        { operation: 'answer', payload: { sessionId: 's1', questionId: 'q1', answerIndex: 2, language: 'ru' } },
        { operation: 'resume', payload: { sessionId: 's1', language: 'en' } },
        { operation: 'claim', payload: { sessionId: 's1' } }
    ]);
    for (const call of calls) {
        for (const forbidden of ['uid', 'now', 'score', 'correct', 'correctIndex', 'coins', 'xp']) {
            assert.equal(forbidden in call.payload, false);
        }
    }
});

test('client rejects unsupported modes and malformed input before network calls', async () => {
    let calls = 0;
    const client = createServerModeClient({ invoke: async () => { calls++; return {}; } });
    await assert.rejects(client.start({ mode: 'classic', count: 10 }), /UNSUPPORTED_QUIZ_MODE/);
    await assert.rejects(client.start({ mode: 'time', count: 0 }), /INVALID_COUNT/);
    await assert.rejects(client.answer({ sessionId: 's1', questionId: 'q1', answerIndex: 9 }), /INVALID_ANSWER/);
    await assert.rejects(client.resume({ sessionId: '' }), /INVALID_SESSION_ID/);
    assert.equal(calls, 0);
});

test('transport unwraps callable responses and maps known errors to safe codes', async () => {
    const success = createServerModeClient({ invoke: async () => ({ data: { sessionId: 's1' } }) });
    assert.deepEqual(await success.resume({ sessionId: 's1' }), { sessionId: 's1' });

    for (const [firebaseCode, expected] of [
        ['unauthenticated', 'AUTH_REQUIRED'],
        ['permission-denied', 'NOT_SESSION_OWNER'],
        ['unavailable', 'NETWORK_UNAVAILABLE'],
        ['deadline-exceeded', 'NETWORK_TIMEOUT'],
        ['internal', 'MODE_REQUEST_FAILED']
    ]) {
        const client = createServerModeClient({
            invoke: async () => { throw Object.assign(new Error('private backend detail'), { code: firebaseCode }); }
        });
        await assert.rejects(client.resume({ sessionId: 's1' }), error =>
            error.message === expected && error.message !== 'private backend detail');
    }
});

test('invalid server response is rejected instead of being treated as a successful result', async () => {
    const client = createServerModeClient({ invoke: async () => ({ data: null }) });
    await assert.rejects(client.resume({ sessionId: 's1' }), /INVALID_SERVER_RESPONSE/);
});
