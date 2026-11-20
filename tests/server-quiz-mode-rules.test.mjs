import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getDuelAiChance,
    resolveDuelAiAnswer,
    resolveDuelOutcome,
    applySurvivalAnswer,
    calculateTimeTrialPoints,
    hasModeWin
} from '../server/quiz-mode-rules.mjs';

test('Duel AI keeps the existing difficulty probabilities and easy fallback', () => {
    assert.equal(getDuelAiChance('easy'), 0.4);
    assert.equal(getDuelAiChance('medium'), 0.6);
    assert.equal(getDuelAiChance('hard'), 0.8);
    assert.equal(getDuelAiChance('unknown'), 0.4);
});

test('Duel AI outcome is derived from server random input with strict threshold', () => {
    assert.equal(resolveDuelAiAnswer({ difficulty: 'easy', randomValue: 0.399999 }), true);
    assert.equal(resolveDuelAiAnswer({ difficulty: 'easy', randomValue: 0.4 }), false);
    assert.equal(resolveDuelAiAnswer({ difficulty: 'medium', randomValue: 0.599999 }), true);
    assert.equal(resolveDuelAiAnswer({ difficulty: 'hard', randomValue: 0.799999 }), true);
    for (const randomValue of [-0.1, 1, NaN, Infinity, '0.2']) {
        assert.throws(() => resolveDuelAiAnswer({ randomValue }), /INVALID_RANDOM_VALUE/);
    }
});

test('Duel result preserves strict win, draw and loss comparison', () => {
    assert.equal(resolveDuelOutcome({ playerScore: 21, aiScore: 20 }), 'win');
    assert.equal(resolveDuelOutcome({ playerScore: 20, aiScore: 20 }), 'draw');
    assert.equal(resolveDuelOutcome({ playerScore: 19, aiScore: 20 }), 'loss');
    assert.throws(() => resolveDuelOutcome({ playerScore: -1, aiScore: 0 }), /INVALID_PLAYER_SCORE/);
});

test('Survival correct answer increases score and streak without consuming a life', () => {
    const next = applySurvivalAnswer(
        { lives: 3, currentStreak: 2, bestStreak: 4, score: 30 },
        { correct: true, points: 10 }
    );
    assert.deepEqual(next, { lives: 3, currentStreak: 3, bestStreak: 4, score: 40 });
});

test('Survival wrong answer resets streak, consumes one life and preserves best record', () => {
    const next = applySurvivalAnswer(
        { lives: 2, currentStreak: 3, bestStreak: 5, score: 40 },
        { correct: false, points: 10 }
    );
    assert.deepEqual(next, { lives: 1, currentStreak: 0, bestStreak: 5, score: 40 });
});

test('Survival lives cannot fall below zero and state input is not mutated', () => {
    const state = { lives: 0, currentStreak: 1, bestStreak: 1, score: 10 };
    const next = applySurvivalAnswer(state, { correct: false, points: 5 });
    assert.equal(next.lives, 0);
    assert.deepEqual(state, { lives: 0, currentStreak: 1, bestStreak: 1, score: 10 });
});

test('Time Trial grants the speed bonus only above ten full seconds remaining', () => {
    assert.equal(calculateTimeTrialPoints({ correct: true, points: 20, remainingMs: 10_001 }), 25);
    assert.equal(calculateTimeTrialPoints({ correct: true, points: 20, remainingMs: 10_000 }), 20);
    assert.equal(calculateTimeTrialPoints({ correct: true, points: 20, remainingMs: 9_999 }), 20);
    assert.equal(calculateTimeTrialPoints({ correct: false, points: 20, remainingMs: 15_000 }), 0);
});

test('win threshold remains at 70 percent rounded up', () => {
    assert.equal(hasModeWin({ correctAnswers: 7, totalQuestions: 10 }), true);
    assert.equal(hasModeWin({ correctAnswers: 6, totalQuestions: 10 }), false);
    assert.equal(hasModeWin({ correctAnswers: 5, totalQuestions: 7 }), true);
    assert.equal(hasModeWin({ correctAnswers: 4, totalQuestions: 7 }), false);
    assert.throws(() => hasModeWin({ correctAnswers: 2, totalQuestions: 0 }), /INVALID_QUIZ_RESULT/);
});
