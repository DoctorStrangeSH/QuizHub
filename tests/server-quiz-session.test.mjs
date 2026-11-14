import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, submitAnswer, finalizeSession } from '../server/quiz-session-core.mjs';

const start = () => createSession({
    uid: 'user-a',
    mode: 'classic',
    startedAt: 1000,
    deadlineAt: 5000,
    questions: [
        { id: 'q-1', correctIndex: 1, optionCount: 3, points: 20 },
        { id: 'q-2', correctIndex: 0, optionCount: 2, points: 10 }
    ]
});

test('scores only answers validated against server-side key', () => {
    const session = start();
    assert.deepEqual(submitAnswer(session, { uid: 'user-a', questionId: 'q-1', answerIndex: 1, at: 2000 }), {
        correct: true, points: 20, finished: false
    });
    assert.deepEqual(submitAnswer(session, { uid: 'user-a', questionId: 'q-2', answerIndex: 1, at: 3000 }), {
        correct: false, points: 0, finished: true
    });
    assert.deepEqual(finalizeSession(session, { uid: 'user-a', at: 3000 }), {
        mode: 'classic', totalQuestions: 2, answeredQuestions: 2, correctAnswers: 1, score: 20
    });
});

test('cannot skip questions or submit duplicate answers', () => {
    const session = start();
    assert.throws(() => submitAnswer(session, { uid: 'user-a', questionId: 'q-2', answerIndex: 0, at: 2000 }), /OUT_OF_ORDER/);
    submitAnswer(session, { uid: 'user-a', questionId: 'q-1', answerIndex: 1, at: 2000 });
    assert.throws(() => submitAnswer(session, { uid: 'user-a', questionId: 'q-1', answerIndex: 1, at: 2200 }), /OUT_OF_ORDER/);
});

test('session ownership, deadline and answer indexes are enforced', () => {
    const session = start();
    assert.throws(() => submitAnswer(session, { uid: 'user-b', questionId: 'q-1', answerIndex: 1, at: 2000 }), /NOT_SESSION_OWNER/);
    assert.throws(() => submitAnswer(session, { uid: 'user-a', questionId: 'q-1', answerIndex: 3, at: 2000 }), /INVALID_ANSWER/);
    assert.throws(() => submitAnswer(session, { uid: 'user-a', questionId: 'q-1', answerIndex: 1, at: 5001 }), /SESSION_EXPIRED/);
    assert.equal(session.answers.length, 0);
});

test('completion cannot be replayed and cannot precede the last answer', () => {
    const session = start();
    assert.throws(() => finalizeSession(session, { uid: 'user-a', at: 2000 }), /SESSION_INCOMPLETE/);
    submitAnswer(session, { uid: 'user-a', questionId: 'q-1', answerIndex: 1, at: 2000 });
    submitAnswer(session, { uid: 'user-a', questionId: 'q-2', answerIndex: 0, at: 2500 });
    assert.equal(finalizeSession(session, { uid: 'user-a', at: 2500 }).score, 30);
    assert.throws(() => finalizeSession(session, { uid: 'user-a', at: 2500 }), /ALREADY_FINALIZED/);
    assert.throws(() => submitAnswer(session, { uid: 'user-a', questionId: 'q-2', answerIndex: 0, at: 2500 }), /SESSION_CLOSED/);
});

test('expired partial session can finalize only answered questions', () => {
    const session = start();
    submitAnswer(session, { uid: 'user-a', questionId: 'q-1', answerIndex: 2, at: 4000 });
    const result = finalizeSession(session, { uid: 'user-a', at: 5000 });
    assert.equal(result.score, 0);
    assert.equal(result.answeredQuestions, 1);
});

test('invalid and duplicate canonical questions are rejected', () => {
    assert.throws(() => createSession({
        uid: 'u', mode: 'classic', startedAt: 1000, deadlineAt: 5000,
        questions: [{ id: 'dup', correctIndex: 0, optionCount: 2, points: 5 },
            { id: 'dup', correctIndex: 1, optionCount: 2, points: 5 }]
    }), /INVALID_QUESTION_ID/);
    assert.throws(() => createSession({
        uid: 'u', mode: 'classic', startedAt: 1000, deadlineAt: 5000,
        questions: [{ id: 'q', correctIndex: 9, optionCount: 2, points: 5 }]
    }), /INVALID_ANSWER_KEY/);
});
