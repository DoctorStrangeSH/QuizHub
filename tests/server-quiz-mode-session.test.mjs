import test from 'node:test';
import assert from 'node:assert/strict';
import { createModeState, applyModeAnswer, getModeResult } from '../server/quiz-mode-session.mjs';

test('Duel mode caps at seven rounds and records server-generated AI outcomes', () => {
    let state = createModeState('duel', { difficulty: 'hard', totalQuestions: 10 });
    assert.equal(state.totalQuestions, 7);
    for (let i = 0; i < 7; i++) {
        const result = applyModeAnswer(state, {
            correct: true, points: 10, aiRandomValue: 0.9
        });
        state = result.state;
        assert.equal(result.round.aiCorrect, false);
    }
    assert.equal(getModeResult(state).outcome, 'win');
    assert.equal(getModeResult(state).wins, 1);
    assert.equal(state.roundLog.length, 7);
    assert.equal(state.roundLog[0].aiCorrect, false);
    assert.equal(state.roundLog[0].aiPoints, 0);
    assert.throws(() => applyModeAnswer(state, {
        correct: true, points: 10, aiRandomValue: 0.1
    }), /MODE_FINISHED/);
});

test('Duel does not mutate prior state and keeps draws distinct from wins', () => {
    const state = createModeState('duel', { difficulty: 'easy', totalQuestions: 1 });
    const next = applyModeAnswer(state, {
        correct: true, points: 10, aiRandomValue: 0.1
    }).state;
    assert.equal(state.roundsPlayed, 0);
    assert.equal(getModeResult(next).outcome, 'draw');
    assert.equal(getModeResult(next).wins, 0);
    assert.deepEqual(next.roundLog, [{ round: 1, playerCorrect: true, aiCorrect: true, points: 10, aiPoints: 10 }]);
});

test('Survival stops at zero lives and preserves the best streak', () => {
    let state = createModeState('survival', { totalQuestions: 20 });
    for (let i = 0; i < 4; i++) {
        state = applyModeAnswer(state, {
            correct: i === 0, points: 10
        }).state;
    }
    const result = getModeResult(state);
    assert.equal(state.lives, 0);
    assert.equal(result.bestStreak, 1);
    assert.equal(result.answeredQuestions, 4);
    assert.equal(result.correctAnswers, 1);
    assert.equal(state.answerLog.length, 4);
    assert.deepEqual(state.answerLog[0], { question: 1, correct: true, points: 10 });
    assert.throws(() => applyModeAnswer(state, { correct: true, points: 10 }), /MODE_FINISHED/);
});

test('Time Trial applies the strict server-time speed threshold and ten-question cap', () => {
    let state = createModeState('timetrial', { totalQuestions: 20 });
    assert.equal(state.totalQuestions, 10);
    const fast = applyModeAnswer(state, {
        correct: true, points: 10, remainingMs: 10_001
    });
    state = fast.state;
    assert.equal(fast.round.points, 15);
    assert.equal(fast.round.speedBonus, 5);
    const boundary = applyModeAnswer(state, {
        correct: true, points: 10, remainingMs: 10_000
    });
    assert.equal(boundary.round.points, 10);
    assert.equal(getModeResult(boundary.state).score, 25);
    assert.equal(getModeResult(boundary.state).correctAnswers, 2);
    assert.deepEqual(boundary.state.answerLog[0], {
        question: 1, correct: true, points: 15, remainingMs: 10_001, speedBonus: 5
    });
});

test('invalid mode, exhausted state and invalid timer values are rejected', () => {
    assert.throws(() => createModeState('classic', { totalQuestions: 1 }), /UNSUPPORTED_QUIZ_MODE/);
    assert.throws(() => createModeState('duel', { totalQuestions: 0 }), /INVALID_TOTAL_QUESTIONS/);
    const state = createModeState('timetrial', { totalQuestions: 1 });
    assert.throws(() => applyModeAnswer(state, {
        correct: true, points: 10, remainingMs: 15_001
    }), /INVALID_REMAINING_TIME/);
});
