import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthenticatedDailyChallengeHandler } from '../server/authenticated-daily-challenge-handler.mjs';
import { createServerDailyChallenge } from '../server/daily-challenge-service.mjs';
import { buildQuestionCatalog } from '../server/question-delivery.mjs';

const now = Date.parse('2026-11-15T10:00:00Z');
const context = { auth: { uid: 'real-user' }, now };

function createRecordingHandler() {
    const calls = [];
    const service = Object.fromEntries(['start', 'resume', 'answer', 'complete'].map(
        operation => [operation, async data => {
            calls.push({ operation, data });
            return data;
        }]
    ));
    return { calls, handler: createAuthenticatedDailyChallengeHandler(service) };
}

test('handler forwards only verified identity, trusted server time and allowed data', async () => {
    const { handler, calls } = createRecordingHandler();
    const start = await handler('start', { language: 'en' }, context);
    assert.deepEqual(start, { language: 'en', uid: 'real-user', now });
    await handler('answer', {
        date: '2026-11-15', questionId: 'question-1', answerIndex: 1
    }, context);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].data.uid, 'real-user');
    assert.equal(calls[1].data.now, now);
});

test('authentication fails closed before operation and payload inspection', async () => {
    const { handler, calls } = createRecordingHandler();
    await assert.rejects(handler('start', {}, {}), /AUTH_REQUIRED/);
    await assert.rejects(handler('unknown', {}, {}), /AUTH_REQUIRED/);
    await assert.rejects(handler('start', {}, { auth: { uid: 'real-user' } }),
        /INVALID_SERVER_TIME/);
    assert.equal(calls.length, 0);
});

test('browser cannot forge identity, clock, score, rewards or claim date on start', async () => {
    const { handler, calls } = createRecordingHandler();
    for (const field of ['uid', 'now', 'score', 'coins', 'xp', 'correctIndex', 'date']) {
        await assert.rejects(handler('start', { [field]: 'forged' }, context),
            /UNEXPECTED_DAILY_FIELD/);
    }
    await assert.rejects(handler('answer', {
        date: '2026-11-15', questionId: 'q', answerIndex: 0, uid: 'intruder'
    }, context), /UNEXPECTED_DAILY_FIELD/);
    assert.equal(calls.length, 0);
});

test('handler validates operation payloads, dates, answer index and language', async () => {
    const { handler } = createRecordingHandler();
    await assert.rejects(handler('missing', {}, context), /UNKNOWN_DAILY_OPERATION/);
    await assert.rejects(handler('start', null, context), /INVALID_DAILY_REQUEST/);
    await assert.rejects(handler('resume', {}, context), /MISSING_DAILY_FIELD/);
    await assert.rejects(handler('answer', {
        date: '2026-11-15', questionId: 'q'
    }, context), /MISSING_DAILY_FIELD/);
    await assert.rejects(handler('answer', {
        date: '15.11.2026', questionId: 'q', answerIndex: 1
    }, context), /INVALID_DAILY_DATE/);
    await assert.rejects(handler('answer', {
        date: '2026-11-15', questionId: 'q', answerIndex: 1.5
    }, context), /INVALID_ANSWER/);
    await assert.rejects(handler('complete', {
        date: '2026-11-15', language: 'fr'
    }, context), /INVALID_LANGUAGE/);
});

test('authenticated handler works with server daily service and cannot cross user boundary', async () => {
    const bank = { science: {} };
    for (const difficulty of ['easy', 'medium', 'hard']) {
        bank.science[difficulty] = Array.from({ length: 5 }, (_, index) => ({
            questionRU: difficulty + index, questionEN: difficulty + index,
            optionsRU: ['нет', 'да'], optionsEN: ['no', 'yes'],
            correctIndex: 1, points: 10
        }));
    }
    const attempts = new Map();
    let queue = Promise.resolve();
    const store = {
        runTransaction(callback) {
            const job = queue.then(async () => {
                const pending = new Map();
                const tx = {
                    getDailyAttempt: async key => structuredClone(pending.get(key) ?? attempts.get(key)),
                    setDailyAttempt: async (key, value) => pending.set(key, structuredClone(value))
                };
                const result = await callback(tx);
                for (const [key, value] of pending) attempts.set(key, value);
                return result;
            });
            queue = job.catch(() => {});
            return job;
        }
    };
    const handler = createAuthenticatedDailyChallengeHandler(
        createServerDailyChallenge({ catalog: buildQuestionCatalog(bank), store })
    );
    const started = await handler('start', {}, context);
    const other = { auth: { uid: 'different-user' }, now };
    await assert.rejects(handler('resume', { date: started.date }, other),
        /DAILY_ATTEMPT_NOT_FOUND/);
    const answer = await handler('answer', {
        date: started.date, questionId: started.question.id, answerIndex: 1
    }, { ...context, now: now + 1000 });
    assert.equal(answer.answeredQuestions, 1);
    assert.equal(attempts.size, 1);
    assert.equal('correctIndex' in answer.question, false);
});
