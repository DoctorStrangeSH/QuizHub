import test from 'node:test';
import assert from 'node:assert/strict';
import { getServerQuizRewardMultipliers, normalizeQuizTimeZone } from '../server/quiz-event-rewards.mjs';

const at = value => Date.parse(value);

test('uses trusted UTC time and defaults missing timezone to UTC', () => {
    assert.deepEqual(getServerQuizRewardMultipliers({ at: at('2026-11-23T12:00:00Z') }), {
        xpMultiplier: 1.5,
        coinMultiplier: 1,
        timeZone: 'UTC',
        activeEventIds: ['monday_motivation']
    });
});

test('weekend XP and Happy Hour coin bonuses use the stored player timezone', () => {
    const result = getServerQuizRewardMultipliers({
        at: at('2026-11-21T17:30:00Z'),
        timeZone: 'Europe/Berlin'
    });
    assert.deepEqual(result, {
        xpMultiplier: 2,
        coinMultiplier: 1.5,
        timeZone: 'Europe/Berlin',
        activeEventIds: ['xp_weekend', 'happy_hour']
    });
});

test('event hours follow daylight-saving transitions in the selected IANA zone', () => {
    // 17:30 UTC is 18:30 in Berlin during winter, but 19:30 during summer.
    const winter = getServerQuizRewardMultipliers({
        at: at('2026-11-21T17:30:00Z'), timeZone: 'Europe/Berlin'
    });
    const summer = getServerQuizRewardMultipliers({
        at: at('2026-07-18T17:30:00Z'), timeZone: 'Europe/Berlin'
    });
    assert.ok(winter.activeEventIds.includes('happy_hour'));
    assert.ok(summer.activeEventIds.includes('happy_hour'));
    assert.equal(winter.coinMultiplier, 1.5);
    assert.equal(summer.coinMultiplier, 1.5);
});

test('overlapping XP boosts use the strongest multiplier rather than stacking', () => {
    const result = getServerQuizRewardMultipliers({
        at: at('2026-11-22T00:30:00Z'),
        timeZone: 'Europe/Berlin'
    });
    assert.equal(result.xpMultiplier, 2);
    assert.ok(result.activeEventIds.includes('xp_weekend'));
    assert.ok(result.activeEventIds.includes('night_owl'));
});

test('inactive holiday events do not grant rewards', () => {
    const result = getServerQuizRewardMultipliers({
        at: at('2026-10-30T12:00:00Z'), timeZone: 'UTC'
    });
    assert.deepEqual(result.activeEventIds, []);
    assert.equal(result.xpMultiplier, 1);
    assert.equal(result.coinMultiplier, 1);
});

test('rejects invalid timezones and untrusted or malformed server timestamps', () => {
    for (const timeZone of ['', 'Mars/Olympus', 'x'.repeat(65), null]) {
        assert.throws(() => normalizeQuizTimeZone(timeZone), /INVALID_TIME_ZONE/);
    }
    for (const value of [NaN, Infinity, -1, 1.5, '2026-01-01']) {
        assert.throws(() => getServerQuizRewardMultipliers({ at: value }), /INVALID_SERVER_TIME/);
    }
});

test('event schedule remains inactive before its configured start date', () => {
    assert.deepEqual(getServerQuizRewardMultipliers({
        at: at('2023-12-31T23:59:59Z'), timeZone: 'UTC'
    }), {
        xpMultiplier: 1, coinMultiplier: 1, timeZone: 'UTC', activeEventIds: []
    });
});
