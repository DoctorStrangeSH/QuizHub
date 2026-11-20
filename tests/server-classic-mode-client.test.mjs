import test from 'node:test';
import assert from 'node:assert/strict';
import { createServerModeClient } from '../app/modules/quiz/server-mode-client.js';

test('Classic server client uses authenticated session operations and maps claim to complete', async () => {
    const calls = [];
    const client = createServerModeClient({
        invoke: async request => (calls.push(request), { data: request.operation === 'complete'
            ? { sessionId: 'session-1', xp: 20, coins: 5, score: 100 }
            : { sessionId: 'session-1', mode: 'classic', deadlineAt: 999999, totalQuestions: 10,
                question: { id: 'q1', question: 'Question', options: ['A', 'B'] } }
        }),
        claimOperation: 'complete'
    });
    await client.start({ mode: 'classic', count: 10, language: 'en' });
    await client.answer({ sessionId: 'session-1', questionId: 'q1', answerIndex: 0, language: 'en' });
    await client.resume({ sessionId: 'session-1', language: 'en' });
    const receipt = await client.claim({ sessionId: 'session-1' });
    assert.equal(receipt.coins, 5);
    assert.deepEqual(calls.map(call => call.operation), ['start', 'answer', 'resume', 'complete']);
    assert.equal(calls.some(call => 'uid' in call.payload || 'score' in call.payload), false);
});

test('Classic server client rejects unknown client-authored reward operation', async () => {
    const client = createServerModeClient({ invoke: async () => ({ data: {} }), claimOperation: 'complete' });
    await assert.rejects(client.start({ mode: 'unknown', count: 10 }), /UNSUPPORTED_QUIZ_MODE/);
});
