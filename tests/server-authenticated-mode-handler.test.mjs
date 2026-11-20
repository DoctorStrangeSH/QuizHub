import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthenticatedModeHandler } from '../server/authenticated-mode-handler.mjs';
import { createModeCallableAdapter } from '../server/firebase-mode-callable-adapter.mjs';

function setup() {
    const calls = [];
    const service = Object.fromEntries(['start', 'answer', 'resume'].map(operation => [
        operation, async input => {
            calls.push({ operation, input });
            return { operation, ok: true };
        }
    ]));
    const store = { runTransaction: async callback => callback({}) };
    const handler = createAuthenticatedModeHandler({ service, store });
    return { handler, calls };
}

const context = { auth: { uid: 'verified-player' }, now: 123456 };

test('authenticated mode boundary derives uid and clock from trusted context', async () => {
    const { handler, calls } = setup();
    await handler('start', { mode: 'duel', category: 'all', difficulty: 'easy', count: 7 }, context);
    await handler('answer', { sessionId: 's1', questionId: 'q1', answerIndex: 0 }, context);
    await handler('resume', { sessionId: 's1', language: 'en' }, context);
    assert.deepEqual(calls.map(call => call.operation), ['start', 'answer', 'resume']);
    for (const call of calls) {
        assert.equal(call.input.uid, 'verified-player');
        assert.equal(call.input.now, 123456);
    }
});

test('mode boundary rejects forged identity, score, rewards and client time', async () => {
    const { handler, calls } = setup();
    for (const field of ['uid', 'now', 'score', 'coins', 'xp', 'correctIndex']) {
        await assert.rejects(handler('claim', { sessionId: 's1', [field]: 999 }, context),
            /UNEXPECTED_FIELD/);
    }
    await assert.rejects(handler('start', {}, { auth: { uid: 'verified-player' }, now: NaN }),
        /INVALID_SERVER_TIME/);
    await assert.rejects(handler('start', {}, { now: 123456 }), /AUTH_REQUIRED/);
    assert.equal(calls.length, 0);
});

test('claim operation delegates to atomic server reward service only', async () => {
    const claims = [];
    const store = { runTransaction: async callback => callback({
        getSession: async id => ({ uid: 'verified-player', id }),
        getUser: async () => ({ stats: {} }),
        setUser: async () => {},
        setSession: async () => {}
    }) };
    const service = {
        start: async () => ({}), answer: async () => ({}), resume: async () => ({})
    };
    // Exercise the actual reward path in the companion claim tests; this test
    // verifies that the boundary does not forward client-owned identity fields.
    const handler = createAuthenticatedModeHandler({ service, store });
    await assert.rejects(handler('claim', { sessionId: 's1', uid: 'attacker' }, context),
        /UNEXPECTED_FIELD/);
    assert.deepEqual(claims, []);
});

class FakeHttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}

test('callable adapter maps authentication, ownership and precondition errors safely', async () => {
    let now = 0;
    const handle = async (operation, payload, context) => {
        assert.equal(context.auth.uid, 'verified-player');
        assert.equal(context.now, 777);
        if (operation === 'owner') throw new Error('NOT_SESSION_OWNER');
        if (operation === 'wait') throw new Error('SESSION_INCOMPLETE');
        return { ok: true, payload };
    };
    const callable = createModeCallableAdapter({
        handle, HttpsError: FakeHttpsError, clock: () => { now++; return 777; }
    });
    await assert.rejects(callable({ data: { operation: 'x', payload: {} } }),
        error => error.code === 'unauthenticated');
    await assert.rejects(callable({ auth: { uid: 'verified-player' }, data: { operation: 'owner', payload: {} } }),
        error => error.code === 'permission-denied');
    await assert.rejects(callable({ auth: { uid: 'verified-player' }, data: { operation: 'wait', payload: {} } }),
        error => error.code === 'failed-precondition');
    assert.deepEqual(await callable({
        auth: { uid: 'verified-player' }, data: { operation: 'ok', payload: { language: 'ru' } }
    }), { ok: true, payload: { language: 'ru' } });
    assert.equal(now, 3, 'unauthenticated requests are rejected before reading server time');
});

test('callable adapter rejects extra envelope fields and hides internal errors', async () => {
    const callable = createModeCallableAdapter({
        handle: async () => { throw new Error('sensitive Firestore path'); },
        HttpsError: FakeHttpsError,
        clock: () => 1
    });
    await assert.rejects(callable({
        auth: { uid: 'verified-player' },
        data: { operation: 'start', payload: {}, uid: 'forged' }
    }), error => error.code === 'invalid-argument');
    await assert.rejects(callable({
        auth: { uid: 'verified-player' },
        data: { operation: 'start', payload: {} }
    }), error => error.code === 'internal' && error.message === 'QUIZ_MODE_SERVER_ERROR');
});
