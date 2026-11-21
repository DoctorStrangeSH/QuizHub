import test from 'node:test';
import assert from 'node:assert/strict';
import { createDailyChallengeClient } from '../app/modules/quiz/daily-challenge-client.js';

test('daily challenge client sends only validated callable payloads', async () => {
    const calls = [];
    const client = createDailyChallengeClient({
        invoke: async request => { calls.push(request); return { data: { status: 'ok' } }; }
    });
    await client.start({ language: 'en' });
    await client.answer({ date: '2026-11-21', questionId: 'question-1', answerIndex: 2, language: 'ru' });
    await client.resume({ date: '2026-11-21', language: 'en' });
    await client.complete({ date: '2026-11-21' });
    assert.deepEqual(calls, [
        { operation: 'start', payload: { language: 'en' } },
        { operation: 'answer', payload: { date: '2026-11-21', questionId: 'question-1', answerIndex: 2, language: 'ru' } },
        { operation: 'resume', payload: { date: '2026-11-21', language: 'en' } },
        { operation: 'complete', payload: { date: '2026-11-21' } }
    ]);
});

test('daily challenge client rejects invalid dates, answers and languages before transport', async () => {
    let calls = 0;
    const client = createDailyChallengeClient({ invoke: async () => { calls++; return {}; } });
    await assert.rejects(client.answer({ date: '2026-02-30', questionId: 'q', answerIndex: 0 }), /INVALID_DAILY_DATE/);
    await assert.rejects(client.answer({ date: '2026-11-21', questionId: '', answerIndex: 0 }), /INVALID_QUESTION_ID/);
    await assert.rejects(client.answer({ date: '2026-11-21', questionId: 'q', answerIndex: -1 }), /INVALID_ANSWER/);
    await assert.rejects(client.start({ language: 'fr' }), /INVALID_LANGUAGE/);
    assert.equal(calls, 0);
});

test('daily challenge client maps callable failures to safe domain errors', async () => {
    const client = createDailyChallengeClient({
        invoke: async () => { throw Object.assign(new Error('permission-denied'), { code: 'permission-denied' }); }
    });
    await assert.rejects(client.start(), /NOT_DAILY_ATTEMPT_OWNER/);
});
