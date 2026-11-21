import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuestionCatalog } from '../server/question-delivery.mjs';
import { createServerDailyChallenge, selectServerDailyQuestions, utcDailyKey } from '../server/daily-challenge-service.mjs';

function makeCatalog() {
    const groups = { science: {} };
    for (const difficulty of ['easy', 'medium', 'hard']) {
        groups.science[difficulty] = Array.from({ length: 8 }, (_, i) => ({
            questionRU: difficulty + ' вопрос ' + i,
            questionEN: difficulty + ' question ' + i,
            optionsRU: ['нет', 'да'], optionsEN: ['no', 'yes'],
            correctIndex: 1, points: 10
        }));
    }
    return buildQuestionCatalog(groups);
}

function makeStore() {
    const attempts = new Map();
    let queue = Promise.resolve();
    return {
        attempts,
        runTransaction(callback) {
            const work = queue.then(async () => {
                const staged = new Map();
                const tx = {
                    getDailyAttempt: async key => structuredClone(staged.get(key) ?? attempts.get(key)),
                    setDailyAttempt: async (key, value) => staged.set(key, structuredClone(value))
                };
                const result = await callback(tx);
                for (const [key, value] of staged) attempts.set(key, value);
                return result;
            });
            queue = work.catch(() => {});
            return work;
        }
    };
}

const now = Date.parse('2026-11-15T12:00:00.000Z');

test('selection is identical across players and is 3/3/4 without exposing answer keys', async () => {
    const catalog = makeCatalog();
    const a = selectServerDailyQuestions(catalog, '2026-11-15');
    const b = selectServerDailyQuestions(catalog, '2026-11-15');
    assert.deepEqual(a.map(q => q.id), b.map(q => q.id));
    assert.deepEqual(a.map(q => q.difficulty), [
        'easy', 'easy', 'easy', 'medium', 'medium', 'medium',
        'hard', 'hard', 'hard', 'hard'
    ]);
    const service = createServerDailyChallenge({ catalog, store: makeStore() });
    const started = await service.start({ uid: 'one', now, language: 'en' });
    assert.equal(started.totalQuestions, 10);
    assert.equal('correctIndex' in started.question, false);
    assert.equal('points' in started.question, false);
    assert.equal(started.receipt, null);
});

test('concurrent starts for one user create exactly one attempt', async () => {
    const store = makeStore();
    const service = createServerDailyChallenge({ catalog: makeCatalog(), store });
    const [first, second] = await Promise.all([
        service.start({ uid: 'one', now }), service.start({ uid: 'one', now })
    ]);
    assert.equal(store.attempts.size, 1);
    assert.deepEqual([first.alreadyStarted, second.alreadyStarted], [false, true]);
    assert.equal(first.question.id, second.question.id);
});

test('answer retries are idempotent, locked, and score is computed on server once', async () => {
    const catalog = makeCatalog();
    const store = makeStore();
    const service = createServerDailyChallenge({ catalog, store });
    let state = await service.start({ uid: 'one', now });
    const first = { uid: 'one', date: state.date, now: now + 1000,
        questionId: state.question.id, answerIndex: 1 };
    const [a, b] = await Promise.all([service.answer(first), service.answer(first)]);
    assert.deepEqual([a.replayed, b.replayed], [false, true]);
    assert.deepEqual(a.answerResult, { correct: true, points: 10 });
    assert.deepEqual(b.answerResult, { correct: true, points: 10 });
    await assert.rejects(service.answer({ ...first, answerIndex: 0 }), /ANSWER_ALREADY_LOCKED/);
    state = b;
    for (let index = 1; index < 10; index++) {
        state = await service.answer({
            uid: 'one', date: state.date, now: now + 1000 + index,
            questionId: state.question.id, answerIndex: 1
        });
    }
    assert.equal(state.status, 'ready_to_complete');
    assert.equal(state.question, null);
    const [receipt, retry] = await Promise.all([
        service.complete({ uid: 'one', date: state.date, now: now + 2000 }),
        service.complete({ uid: 'one', date: state.date, now: now + 2000 })
    ]);
    assert.equal(receipt.score, 100);
    assert.equal(retry.alreadyCompleted, true);
    assert.equal(store.attempts.size, 1);
    await assert.rejects(service.answer(first), /SESSION_CLOSED/);
});

test('one player cannot access another attempt and next day starts fresh', async () => {
    const store = makeStore();
    const service = createServerDailyChallenge({ catalog: makeCatalog(), store });
    const first = await service.start({ uid: 'one', now });
    await assert.rejects(service.resume({
        uid: 'two', date: first.date, now
    }), /DAILY_ATTEMPT_NOT_FOUND/);
    await assert.rejects(service.answer({
        uid: 'two', date: first.date, now,
        questionId: first.question.id, answerIndex: 1
    }), /DAILY_ATTEMPT_NOT_FOUND/);
    const tomorrow = now + 24 * 60 * 60 * 1000;
    const next = await service.start({ uid: 'one', now: tomorrow });
    assert.notEqual(first.date, next.date);
    assert.equal(store.attempts.size, 2);
});

test('deadline cannot extend beyond UTC midnight; expired run can be completed', async () => {
    const catalog = makeCatalog();
    const service = createServerDailyChallenge({ catalog, store: makeStore() });
    const late = Date.parse('2026-11-15T23:59:58.000Z');
    const started = await service.start({ uid: 'one', now: late });
    assert.equal(started.deadlineAt, Date.parse('2026-11-16T00:00:00.000Z'));
    await assert.rejects(service.complete({
        uid: 'one', date: started.date, now: late + 1000
    }), /SESSION_INCOMPLETE/);
    const receipt = await service.complete({
        uid: 'one', date: started.date, now: late + 2000
    });
    assert.equal(receipt.answeredQuestions, 0);
    assert.equal(receipt.score, 0);
});

test('rejects malformed time, date and identity', async () => {
    assert.equal(utcDailyKey(now), '2026-11-15');
    assert.throws(() => utcDailyKey(NaN), /INVALID_SERVER_TIME/);
    assert.throws(() => selectServerDailyQuestions(makeCatalog(), '2026-02-30'), /INVALID_DAILY_SELECTION/);
    const service = createServerDailyChallenge({ catalog: makeCatalog(), store: makeStore() });
    await assert.rejects(service.start({ uid: '../other', now }), /AUTH_REQUIRED/);
    await assert.rejects(service.start({ uid: 'one', now: NaN }), /INVALID_SERVER_TIME/);
    await assert.rejects(service.resume({
        uid: 'one', date: '2026-11-13', now
    }), /INVALID_DAILY_DATE/);
});
