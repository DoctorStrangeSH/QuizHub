import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuestionCatalog } from '../server/question-delivery.mjs';
import { createQuizService } from '../server/quiz-service.mjs';

const catalog = buildQuestionCatalog({
    science: {
        easy: [
            { questionRU: 'Два плюс два?', questionEN: 'Two plus two?',
              optionsRU: ['3', '4'], optionsEN: ['3', '4'],
              correctIndex: 1, points: 10 },
            { questionRU: 'Один плюс один?', questionEN: 'One plus one?',
              optionsRU: ['2', '3'], optionsEN: ['2', '3'],
              correctIndex: 0, points: 10 }
        ]
    }
});

function makeStore() {
    const sessions = new Map();
    const users = new Map([['user-1', {
        experience: 0, weeklyExperience: 0, coins: 0,
        quizzesCompleted: 0, stats: {}
    }]]);
    let queue = Promise.resolve();
    return {
        sessions, users,
        runTransaction(callback) {
            const task = queue.then(async () => {
                const staged = new Map();
                const tx = {
                    getSession: async id => structuredClone(staged.get(`s:${id}`) ?? sessions.get(id)),
                    getUser: async id => structuredClone(staged.get(`u:${id}`) ?? users.get(id)),
                    setSession: async (id, value) => { staged.set(`s:${id}`, structuredClone(value)); },
                    setUser: async (id, value) => { staged.set(`u:${id}`, structuredClone(value)); }
                };
                const result = await callback(tx);
                for (const [key, value] of staged) {
                    if (key.startsWith('s:')) sessions.set(key.slice(2), value);
                    else users.set(key.slice(2), value);
                }
                return result;
            });
            queue = task.catch(() => {});
            return task;
        }
    };
}

test('complete backend quiz flow hides answers and grants once', async () => {
    const store = makeStore();
    const quiz = createQuizService({ catalog, store, sessionDurationMs: 5000 });
    const started = await quiz.start({
        uid: 'user-1', mode: 'classic', category: 'science',
        difficulty: 'easy', count: 2, language: 'en', now: 1000
    });
    assert.equal(started.totalQuestions, 2);
    assert.equal(started.deadlineAt, 6000);
    assert.equal(started.question.question, started.question.question.trim());
    assert.equal('correctIndex' in started.question, false);
    assert.equal('points' in started.question, false);

    const firstCorrect = catalog.get(started.question.id).correctIndex;
    const first = await quiz.answer({
        uid: 'user-1', sessionId: started.sessionId,
        questionId: started.question.id, answerIndex: firstCorrect,
        now: 2000, language: 'en'
    });
    assert.equal(first.correct, true);
    assert.equal(first.finished, false);
    assert.ok(first.nextQuestion?.id);
    assert.equal('correctIndex' in first.nextQuestion, false);

    const secondCorrect = catalog.get(first.nextQuestion.id).correctIndex;
    const second = await quiz.answer({
        uid: 'user-1', sessionId: started.sessionId,
        questionId: first.nextQuestion.id, answerIndex: secondCorrect, now: 3000
    });
    assert.equal(second.finished, true);
    assert.equal(second.nextQuestion, null);

    const [one, two] = await Promise.all([
        quiz.complete({ uid: 'user-1', sessionId: started.sessionId, now: 4000 }),
        quiz.complete({ uid: 'user-1', sessionId: started.sessionId, now: 4000 })
    ]);
    assert.equal(one.score, 20);
    assert.equal(one.coins, 10);
    assert.equal(two.alreadyClaimed, true);
    assert.equal(store.users.get('user-1').coins, 10);
    assert.equal(store.users.get('user-1').quizzesCompleted, 1);
});

test('foreign caller cannot answer or claim another player session', async () => {
    const store = makeStore();
    const quiz = createQuizService({ catalog, store });
    const started = await quiz.start({
        uid: 'user-1', mode: 'classic', category: 'science',
        difficulty: 'easy', count: 1, now: 1000
    });
    await assert.rejects(quiz.answer({
        uid: 'intruder', sessionId: started.sessionId,
        questionId: started.question.id, answerIndex: 0, now: 2000
    }), /NOT_SESSION_OWNER/);
    await assert.rejects(quiz.complete({
        uid: 'intruder', sessionId: started.sessionId, now: 2000
    }), /NOT_SESSION_OWNER/);
    assert.equal(store.sessions.get(started.sessionId).answers.length, 0);
});

test('duplicate and out-of-order answers do not change stored session', async () => {
    const store = makeStore();
    const quiz = createQuizService({ catalog, store });
    const started = await quiz.start({
        uid: 'user-1', mode: 'classic', category: 'science',
        difficulty: 'easy', count: 2, now: 1000
    });
    const first = await quiz.answer({
        uid: 'user-1', sessionId: started.sessionId,
        questionId: started.question.id, answerIndex: 0, now: 2000
    });
    await assert.rejects(quiz.answer({
        uid: 'user-1', sessionId: started.sessionId,
        questionId: started.question.id, answerIndex: 0, now: 2200
    }), /OUT_OF_ORDER/);
    assert.equal(store.sessions.get(started.sessionId).answers.length, 1);
    assert.notEqual(first.nextQuestion.id, started.question.id);
});

test('resume returns the next unanswered question without exposing its answer', async () => {
    const store = makeStore();
    const quiz = createQuizService({ catalog, store, sessionDurationMs: 5000 });
    const started = await quiz.start({
        uid: 'user-1', mode: 'classic', category: 'science',
        difficulty: 'easy', count: 2, now: 1000
    });
    const initial = await quiz.resume({
        uid: 'user-1', sessionId: started.sessionId, now: 1500, language: 'en'
    });
    assert.equal(initial.status, 'in_progress');
    assert.equal(initial.question.id, started.question.id);
    assert.equal(initial.answeredQuestions, 0);
    assert.equal('correctIndex' in initial.question, false);

    const first = await quiz.answer({
        uid: 'user-1', sessionId: started.sessionId,
        questionId: started.question.id, answerIndex: 0, now: 2000
    });
    const resumed = await quiz.resume({
        uid: 'user-1', sessionId: started.sessionId, now: 2500
    });
    assert.equal(resumed.answeredQuestions, 1);
    assert.equal(resumed.question.id, first.nextQuestion.id);
    assert.equal('points' in resumed.question, false);
});

test('resume enforces ownership and reveals only final receipt after completion', async () => {
    const store = makeStore();
    const quiz = createQuizService({ catalog, store, sessionDurationMs: 5000 });
    const started = await quiz.start({
        uid: 'user-1', mode: 'classic', category: 'science',
        difficulty: 'easy', count: 1, now: 1000
    });
    await assert.rejects(quiz.resume({
        uid: 'intruder', sessionId: started.sessionId, now: 2000
    }), /NOT_SESSION_OWNER/);
    await quiz.answer({
        uid: 'user-1', sessionId: started.sessionId,
        questionId: started.question.id, answerIndex: 0, now: 2000
    });
    assert.equal((await quiz.resume({
        uid: 'user-1', sessionId: started.sessionId, now: 2200
    })).status, 'ready_to_complete');
    await quiz.complete({ uid: 'user-1', sessionId: started.sessionId, now: 2300 });
    const final = await quiz.resume({
        uid: 'user-1', sessionId: started.sessionId, now: 2400
    });
    assert.equal(final.status, 'completed');
    assert.equal(final.receipt.alreadyClaimed, true);
});

test('expired sessions do not disclose unanswered questions', async () => {
    const store = makeStore();
    const quiz = createQuizService({ catalog, store, sessionDurationMs: 5000 });
    const started = await quiz.start({
        uid: 'user-1', mode: 'classic', category: 'science',
        difficulty: 'easy', count: 2, now: 1000
    });
    const result = await quiz.resume({
        uid: 'user-1', sessionId: started.sessionId, now: 6001
    });
    assert.equal(result.status, 'expired');
    assert.equal(result.question, null);
    assert.equal(result.totalQuestions, 2);
});
