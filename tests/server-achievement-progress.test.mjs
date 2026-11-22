import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceAchievementFacts } from '../server/achievement-progress.mjs';

test('trusted XP derives the existing V1 level formula and unlocks level five', () => {
    const result = advanceAchievementFacts({
        previousFacts: { totalGames: 0, experience: 0, totalWins: 0, perfectGames: 0, unlockedIds: [] },
        previousAchievements: [],
        experienceDelta: 400
    });
    assert.equal(result.facts.experience, 400);
    assert.equal(result.facts.level, 5);
    assert.ok(result.newlyUnlocked.includes('level_five'));
    assert.equal(result.newlyUnlocked.includes('level_ten'), false);
});

test('level ten unlocks at 900 trusted XP, not one point earlier', () => {
    const before = advanceAchievementFacts({
        previousFacts: { totalGames: 0, experience: 899, totalWins: 0, perfectGames: 0, unlockedIds: [] },
        previousAchievements: [],
        experienceDelta: 0
    });
    assert.equal(before.facts.level, 9);
    assert.equal(before.newlyUnlocked.includes('level_ten'), false);

    const atThreshold = advanceAchievementFacts({
        previousFacts: { totalGames: 0, experience: 899, totalWins: 0, perfectGames: 0, unlockedIds: [] },
        previousAchievements: [],
        experienceDelta: 1
    });
    assert.equal(atThreshold.facts.level, 10);
    assert.ok(atThreshold.newlyUnlocked.includes('level_ten'));
});

test('legacy client-maintained profile level is never imported into trusted facts', () => {
    const result = advanceAchievementFacts({
        previousFacts: { totalGames: 0, experience: 0, totalWins: 0, perfectGames: 0 },
        previousAchievements: [],
        experienceDelta: 0
    });
    assert.equal(result.facts.level, 1);
    assert.equal(result.newlyUnlocked.includes('level_five'), false);
});

test('trusted registration baseline marker survives progression updates', () => {
    const result = advanceAchievementFacts({
        previousFacts: { totalGames: 0, experience: 90, totalWins: 0, perfectGames: 0, unlockedIds: [], baselineTrusted: true },
        previousAchievements: [],
        experienceDelta: 10
    });
    assert.equal(result.facts.experience, 100);
    assert.equal(result.facts.level, 2);
    assert.equal(result.facts.baselineTrusted, true);
});

test('legacy facts never gain a trusted baseline from a reward claim', () => {
    const result = advanceAchievementFacts({
        previousFacts: { totalGames: 0, experience: 90, totalWins: 0, perfectGames: 0, unlockedIds: [] },
        previousAchievements: [],
        experienceDelta: 10
    });
    assert.equal(result.facts.level, 2);
    assert.equal(Object.hasOwn(result.facts, 'baselineTrusted'), false);
});
