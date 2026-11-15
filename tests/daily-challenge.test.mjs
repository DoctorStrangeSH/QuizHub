import test from 'node:test';
import assert from 'node:assert/strict';
import allQuestions from '../app/data/questions/index.js';
import {
    createDailyChallenge,
    createSeededRandom,
    getUtcDateKey
} from '../app/modules/quiz/daily-challenge.js';

test('same UTC date produces an identical challenge for every client', () => {
    const first = createDailyChallenge('2026-11-15');
    const second = createDailyChallenge('2026-11-15');

    assert.equal(first.id, 'daily-2026-11-15');
    assert.deepEqual(
        first.questions.map(question => question.dailyQuestionId),
        second.questions.map(question => question.dailyQuestionId)
    );
});

test('daily challenge changes its deterministic selection on a new date', () => {
    const today = createDailyChallenge('2026-11-15');
    const tomorrow = createDailyChallenge('2026-11-16');

    assert.notDeepEqual(
        today.questions.map(question => question.dailyQuestionId),
        tomorrow.questions.map(question => question.dailyQuestionId)
    );
});

test('daily challenge has a fixed progressive difficulty plan', () => {
    const challenge = createDailyChallenge('2026-11-15');
    assert.equal(challenge.totalQuestions, 10);
    assert.deepEqual(
        challenge.questions.reduce((counts, question) => {
            counts[question.difficulty] = (counts[question.difficulty] || 0) + 1;
            return counts;
        }, {}),
        { easy: 3, medium: 3, hard: 4 }
    );
});

test('daily challenge draws from multiple categories and assigns stable question IDs', () => {
    const challenge = createDailyChallenge('2026-11-15');
    const categories = new Set(challenge.questions.map(question => question.category));
    const ids = challenge.questions.map(question => question.dailyQuestionId);

    assert.ok(categories.size > 1);
    assert.equal(new Set(ids).size, 10);
    assert.ok(challenge.questions.every(question => question.questionRU && question.questionEN));
});

test('daily selection does not mutate the source question bank', () => {
    const before = JSON.stringify(allQuestions);
    createDailyChallenge('2026-11-15');
    assert.equal(JSON.stringify(allQuestions), before);
});

test('UTC date key does not depend on the machine local timezone', () => {
    const instant = new Date('2026-11-15T23:30:00.000Z');
    assert.equal(getUtcDateKey(instant), '2026-11-15');
    assert.equal(getUtcDateKey(new Date('2026-11-16T00:30:00.000Z')), '2026-11-16');
});

test('invalid date keys are rejected instead of silently selecting a fallback challenge', () => {
    assert.throws(() => createDailyChallenge('2026-02-30'), /valid calendar date/);
    assert.throws(() => createDailyChallenge('15.11.2026'), /YYYY-MM-DD/);
});

test('insufficient question pools fail explicitly', () => {
    const tinyBank = {
        science: {
            easy: [{ questionRU: 'Q', questionEN: 'Q', optionsRU: ['a', 'b', 'c', 'd'], optionsEN: ['a', 'b', 'c', 'd'], correctIndex: 0 }]
        }
    };

    assert.throws(
        () => createDailyChallenge('2026-11-15', tinyBank),
        /requires 3 easy questions; found 1/
    );
});

test('seeded random generator returns reproducible values', () => {
    const first = createSeededRandom('daily-seed');
    const second = createSeededRandom('daily-seed');

    assert.deepEqual(
        Array.from({ length: 8 }, () => first()),
        Array.from({ length: 8 }, () => second())
    );
});
