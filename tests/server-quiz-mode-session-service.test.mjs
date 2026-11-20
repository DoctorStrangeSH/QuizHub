import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuestionCatalog } from '../server/question-delivery.mjs';
import { createModeSessionService } from '../server/quiz-mode-session-service.mjs';

const catalog = buildQuestionCatalog({
    science: {
        easy: Array.from({ length: 12 }, (_, i) => ({
            questionRU: `Вопрос ${i}?`, questionEN: `Question ${i}?`,
            optionsRU: ['Нет', 'Да'], optionsEN: ['No', 'Yes'],
            correctIndex: 1, points: 10
        })),
        medium: [], hard: []
    }
});

function makeStore() {
    const sessions = new Map();
    let queue = Promise.resolve();
    return {
        sessions,
        runTransaction(callback) {
            const task = queue.then(async () => {
                const staged = new Map();
                const tx = {
                    getSession: async id => structuredClone(staged.get(id) ?? sessions.get(id) ?? null),
                    setSession: async (id, value) => staged.set(id, structuredClone(value))
                };
                const result = await callback(tx);
                for (const [id, value] of staged) sessions.set(id, value);
                return result;
            });
            queue = task.catch(() => {});
            return task;
        }
    };
}

test('Survival server session starts, answers, resumes and finalizes without exposing keys', async () => {
    const store = makeStore();
    const service = createModeSessionService({ catalog, store, sessionDurationMs: 5000 });
    const started = await service.start({
        uid: 'player-1', mode: 'survival', category: 'science',
        difficulty: 'easy', count: 4, now: 1000
    });
    assert.equal('correctIndex' in started.question, false);
    const first = await service.answer({
        uid: 'player-1', sessionId: started.sessionId, questionId: started.question.id,
        answerIndex: 1, now: 2000
    });
    assert.equal(first.correct, true);
    assert.equal(first.points, 10);
    assert.equal(first.finished, false);
    const resumed = await service.resume({
        uid: 'player-1', sessionId: started.sessionId, now: 2100
    });
    assert.equal(resumed.answeredQuestions, 1);
    assert.equal(resumed.question.id, first.nextQuestion.id);
    let nextQuestion = first.nextQuestion;
    for (const now of [2200, 2300, 2400]) {
        const next = await service.answer({
            uid: 'player-1', sessionId: started.sessionId, questionId: nextQuestion.id,
            answerIndex: 1, now
        });
        nextQuestion = next.nextQuestion;
    }
    assert.equal(nextQuestion, null);
    const completed = await service.complete({
        uid: 'player-1', sessionId: started.sessionId, now: 2500
    });
    assert.equal(completed.answeredQuestions, 4);
    assert.equal(completed.correctAnswers, 4);
});

test('Time Trial server deadlines award speed bonus and record timeout as incorrect', async () => {
    const store = makeStore();
    const service = createModeSessionService({ catalog, store, sessionDurationMs: 60_000 });
    const started = await service.start({
        uid: 'player-1', mode: 'time', category: 'science',
        difficulty: 'easy', count: 2, now: 1000
    });
    assert.equal(started.mode, 'time');
    assert.equal(started.questionDeadlineAt, 16_000);
    const fast = await service.answer({
        uid: 'player-1', sessionId: started.sessionId, questionId: started.question.id,
        answerIndex: 1, now: 5_999
    });
    assert.equal(fast.points, 25);
    assert.equal(fast.speedBonus, 5);
    assert.equal(fast.questionDeadlineAt, 20_999);
    const timeout = await service.answer({
        uid: 'player-1', sessionId: started.sessionId, questionId: fast.nextQuestion.id,
        answerIndex: 999, now: 20_999
    });
    assert.equal(timeout.correct, false);
    assert.equal(timeout.timedOut, true);
    assert.equal(timeout.finished, true);
});

test('Duel persists AI outcome so identical retry does not reroll', async () => {
    const store = makeStore();
    let rolls = 0;
    const service = createModeSessionService({
        catalog, store, random: () => { rolls++; return 0.9; }
    });
    const started = await service.start({
        uid: 'player-1', mode: 'duel', category: 'science',
        difficulty: 'hard', count: 1, now: 1000
    });
    const request = {
        uid: 'player-1', sessionId: started.sessionId,
        questionId: started.question.id, answerIndex: 1, now: 2000
    };
    const first = await service.answer(request);
    const retry = await service.answer(request);
    assert.equal(first.aiCorrect, false);
    assert.equal(retry.replayed, true);
    assert.equal(retry.aiCorrect, false);
    assert.equal(rolls, 1);
});

test('foreign owner, out-of-order and changed retry are rejected', async () => {
    const store = makeStore();
    const service = createModeSessionService({ catalog, store });
    const started = await service.start({
        uid: 'player-1', mode: 'survival', category: 'science',
        difficulty: 'easy', count: 2, now: 1000
    });
    await assert.rejects(service.answer({
        uid: 'intruder', sessionId: started.sessionId, questionId: started.question.id,
        answerIndex: 1, now: 2000
    }), /NOT_SESSION_OWNER/);
    await assert.rejects(service.answer({
        uid: 'player-1', sessionId: started.sessionId, questionId: 'wrong',
        answerIndex: 1, now: 2000
    }), /OUT_OF_ORDER/);
    const next = await service.answer({
        uid: 'player-1', sessionId: started.sessionId, questionId: started.question.id,
        answerIndex: 1, now: 2000
    });
    await assert.rejects(service.answer({
        uid: 'player-1', sessionId: started.sessionId, questionId: started.question.id,
        answerIndex: 0, now: 2100
    }), /ANSWER_ALREADY_LOCKED/);
    assert.ok(next.nextQuestion);
});

test('mode completion is idempotent and does not accept an early finish', async () => {
    const store = makeStore();
    const service = createModeSessionService({ catalog, store });
    const started = await service.start({
        uid: 'player-1', mode: 'survival', category: 'science',
        difficulty: 'easy', count: 1, now: 1000
    });
    await assert.rejects(service.complete({
        uid: 'player-1', sessionId: started.sessionId, now: 2000
    }), /SESSION_INCOMPLETE/);
    await service.answer({
        uid: 'player-1', sessionId: started.sessionId, questionId: started.question.id,
        answerIndex: 1, now: 2000
    });
    const first = await service.complete({ uid: 'player-1', sessionId: started.sessionId, now: 2100 });
    const retry = await service.complete({ uid: 'player-1', sessionId: started.sessionId, now: 2200 });
    assert.equal(first.score, 10);
    assert.equal(retry.alreadyFinalized, true);
});
