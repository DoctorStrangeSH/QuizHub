import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyLeaderboard } from '../server/daily-leaderboard.mjs';

const date = '2026-11-15';
const receipt = (uid, score, correctAnswers) => ({
    uid, date, mode: 'daily', score, correctAnswers,
    totalQuestions: 10, answeredQuestions: 10
});

test('rank is deterministic by server score, correct answers and UID', () => {
    const input = [
        receipt('c', 70, 7), receipt('a', 90, 8),
        receipt('d', 90, 9), receipt('b', 90, 9)
    ];
    const first = buildDailyLeaderboard({ date, receipts: input, viewerUid: 'c' });
    const second = buildDailyLeaderboard({ date, receipts: [...input].reverse(), viewerUid: 'c' });
    assert.deepEqual(first, second);
    assert.equal(first.rows[0].score, 90);
    assert.equal(first.rows[0].correctAnswers, 9);
    assert.equal(first.viewerRank, 4);
    assert.equal(first.participants, 4);
    assert.equal(first.viewerResult.rank, 4);
});

test('paginates public top rows but returns viewer position beyond limit', () => {
    const result = buildDailyLeaderboard({
        date,
        receipts: [receipt('a', 100, 10), receipt('b', 80, 8), receipt('c', 60, 6)],
        viewerUid: 'c', limit: 2
    });
    assert.equal(result.rows.length, 2);
    assert.equal(result.viewerRank, 3);
    assert.equal(result.viewerResult.score, 60);
});

test('does not publish private UID or other profile data', () => {
    const result = buildDailyLeaderboard({
        date,
        receipts: [{ ...receipt('user-secret-uid', 10, 1), email: 'private@example.com',
            phone: '555-0100', admin: true }],
        viewerUid: 'user-secret-uid'
    });
    const serialized = JSON.stringify(result);
    for (const secret of ['user-secret-uid', 'private@example.com', '555-0100', 'admin']) {
        assert.equal(serialized.includes(secret), false);
    }
    assert.match(result.rows[0].playerId, /^[a-f0-9]{16}$/);
    assert.equal(result.viewerRank, 1);
});

test('cross-date, duplicate, malformed and client-fabricated receipts fail closed', () => {
    const valid = receipt('a', 80, 8);
    const invalid = [
        { ...valid, date: '2026-11-14' },
        { ...valid, score: 1e30 },
        { ...valid, score: -1 },
        { ...valid, correctAnswers: 11 },
        { ...valid, answeredQuestions: 5 },
        { ...valid, mode: 'classic' }
    ];
    for (const entry of invalid) {
        assert.throws(() => buildDailyLeaderboard({
            date, receipts: [entry]
        }), /INVALID_DAILY_RECEIPT/);
    }
    assert.throws(() => buildDailyLeaderboard({
        date, receipts: [valid, { ...valid, score: 90 }]
    }), /DUPLICATE_DAILY_RECEIPT/);
    assert.throws(() => buildDailyLeaderboard({
        date: '2026-02-30', receipts: []
    }), /INVALID_DAILY_DATE/);
    assert.throws(() => buildDailyLeaderboard({
        date, receipts: [], limit: 5000
    }), /INVALID_LEADERBOARD_REQUEST/);
});

test('empty leaderboard and anonymous viewer have no rank', () => {
    const result = buildDailyLeaderboard({ date, receipts: [] });
    assert.equal(result.participants, 0);
    assert.equal(result.viewerRank, null);
    assert.equal(result.viewerResult, null);
});
