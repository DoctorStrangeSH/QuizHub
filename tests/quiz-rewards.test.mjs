import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuizRewards } from '../app/modules/quiz/rewards.js';

test('base rewards give full XP and half-score coins', () => {
    assert.deepEqual(calculateQuizRewards(100), { xp: 100, coins: 50 });
});

test('fractional coin multiplier is applied before rounding down', () => {
    assert.deepEqual(
        calculateQuizRewards(35, { xpMultiplier: 2, coinMultiplier: 1.5 }),
        { xp: 70, coins: 26 }
    );
});

test('zero points never create currency', () => {
    assert.deepEqual(calculateQuizRewards(0), { xp: 0, coins: 0 });
});

test('negative and nonfinite scores cannot grant currency', () => {
    for (const score of [-100, NaN, Infinity, -Infinity]) {
        assert.deepEqual(calculateQuizRewards(score), { xp: 0, coins: 0 });
    }
});

test('invalid event multipliers fall back to one', () => {
    assert.deepEqual(
        calculateQuizRewards(40, { xpMultiplier: -3, coinMultiplier: NaN }),
        { xp: 40, coins: 20 }
    );
});

test('calculation is deterministic and does not mutate event multipliers', () => {
    const multipliers = Object.freeze({ xpMultiplier: 1.5, coinMultiplier: 2 });
    const expected = { xp: 37, coins: 25 };
    assert.deepEqual(calculateQuizRewards(25, multipliers), expected);
    assert.deepEqual(calculateQuizRewards(25, multipliers), expected);
});
