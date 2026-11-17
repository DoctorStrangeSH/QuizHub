import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthenticatedQuizHandler } from '../server/authenticated-quiz-handler.mjs';

function setup() {
    const calls = [];
    const service = Object.fromEntries(['start', 'answer', 'resume', 'complete'].map(
        operation => [operation, async input => {
            calls.push({ operation, input });
            return { ok: true };
        }]
    ));
    return { handler: createAuthenticatedQuizHandler(service), calls };
}

const auth = { auth: { uid: 'verified-user' }, now: 123456 };

test('verified identity and server timestamp are added to every operation', async () => {
    const { handler, calls } = setup();
    await handler('start', { mode: 'classic', category: 'all', difficulty: 'easy', count: 5 }, auth);
    await handler('answer', { sessionId: 'abc', questionId: 'q', answerIndex: 0 }, auth);
    await handler('resume', { sessionId: 'abc' }, auth);
    await handler('complete', { sessionId: 'abc' }, auth);
    assert.deepEqual(calls.map(call => call.operation), ['start', 'answer', 'resume', 'complete']);
    for (const call of calls) {
        assert.equal(call.input.uid, 'verified-user');
        assert.equal(call.input.now, 123456);
    }
});

test('request cannot forge user, clock, score or reward fields', async () => {
    const { handler, calls } = setup();
    for (const field of ['uid', 'now', 'score', 'coins', 'xp', 'correctIndex', 'rewardMultiplier']) {
        await assert.rejects(handler('complete', { sessionId: 'abc', [field]: 999 }, auth), /UNEXPECTED_FIELD/);
    }
    assert.equal(calls.length, 0);
});

test('anonymous callers, invalid transport contexts and bad input are rejected', async () => {
    const { handler, calls } = setup();
    await assert.rejects(handler('start', {}, { now: 123456 }), /AUTH_REQUIRED/);
    await assert.rejects(handler('start', {}, { auth: { uid: 'verified-user' }, now: NaN }), /INVALID_SERVER_TIME/);
    await assert.rejects(handler('start', null, auth), /INVALID_REQUEST/);
    await assert.rejects(handler('start', [], auth), /INVALID_REQUEST/);
    await assert.rejects(handler('unknown', {}, auth), /UNKNOWN_OPERATION/);
    await assert.rejects(handler('resume', { sessionId: 'abc', language: 'fr' }, auth), /INVALID_LANGUAGE/);
    assert.equal(calls.length, 0);
});

test('valid language is preserved and unrecognized fields are not forwarded', async () => {
    const { handler, calls } = setup();
    assert.deepEqual(await handler('resume', { sessionId: 'abc', language: 'en' }, auth), { ok: true });
    assert.deepEqual(calls[0].input, { sessionId: 'abc', language: 'en', uid: 'verified-user', now: 123456 });
});
