import test from 'node:test';
import assert from 'node:assert/strict';
import { createModeState } from '../server/quiz-mode-session.mjs';
import { applyCanonicalModeAnswer, resolvePublicMode } from '../server/quiz-mode-answer-core.mjs';

const question = {
    id: 'question-1',
    correctIndex: 1,
    optionCount: 4,
    points: 20
};

test('public Time Trial identifier maps explicitly to the server domain mode', () => {
    assert.equal(resolvePublicMode('time'), 'timetrial');
    assert.equal(resolvePublicMode('duel'), 'duel');
    assert.equal(resolvePublicMode('survival'), 'survival');
    assert.throws(() => resolvePublicMode('timetrial'), /UNSUPPORTED_QUIZ_MODE/);
    assert.throws(() => resolvePublicMode('unknown'), /UNSUPPORTED_QUIZ_MODE/);
});

test('answer correctness and points are derived from canonical server question', () => {
    const state = createModeState('survival', { totalQuestions: 1 });
    const result = applyCanonicalModeAnswer({
        state, question, answerIndex: 1, now: 1_000, sessionDeadlineAt: 60_000
    });
    assert.equal(result.result.correct, true);
    assert.equal(result.result.points, 20);
    assert.equal(result.state.score, 20);
    assert.equal(result.state.correctAnswers, 1);
});

test('invalid option indexes and expired sessions are rejected without changing input', () => {
    const state = createModeState('survival', { totalQuestions: 1 });
    assert.throws(() => applyCanonicalModeAnswer({
        state, question, answerIndex: 4, now: 1_000, sessionDeadlineAt: 60_000
    }), /INVALID_ANSWER/);
    assert.throws(() => applyCanonicalModeAnswer({
        state, question, answerIndex: 1, now: 60_000, sessionDeadlineAt: 60_000
    }), /SESSION_EXPIRED/);
    assert.equal(state.answeredQuestions, 0);
});

test('Time Trial timeout becomes an incorrect answer and ignores submitted index', () => {
    const state = createModeState('timetrial', { totalQuestions: 1 });
    const result = applyCanonicalModeAnswer({
        state, question, answerIndex: 1, now: 15_000,
        sessionDeadlineAt: 60_000, questionDeadlineAt: 15_000
    });
    assert.equal(result.result.correct, false);
    assert.equal(result.result.points, 0);
    assert.equal(result.result.timedOut, true);
    assert.equal(result.state.answeredQuestions, 1);
});

test('Time Trial speed bonus uses server deadline, not a client time-left value', () => {
    const state = createModeState('timetrial', { totalQuestions: 1 });
    const result = applyCanonicalModeAnswer({
        state, question, answerIndex: 1, now: 4_999,
        sessionDeadlineAt: 60_000, questionDeadlineAt: 15_000
    });
    assert.equal(result.result.points, 25);
    assert.equal(result.result.speedBonus, 5);
    assert.equal(result.result.timedOut, false);
});

test('Duel AI result is derived only from server-supplied random value', () => {
    const state = createModeState('duel', { totalQuestions: 1 });
    const result = applyCanonicalModeAnswer({
        state, question, answerIndex: 1, now: 1_000,
        sessionDeadlineAt: 60_000, aiRandomValue: 0.9
    });
    assert.equal(result.result.correct, true);
    assert.equal(result.result.aiCorrect, false);
    assert.equal(result.state.playerScore, 20);
    assert.equal(result.state.aiScore, 0);
});
