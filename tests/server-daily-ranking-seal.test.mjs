import test from 'node:test';
import assert from 'node:assert/strict';
import { createDailyRankingSealService } from '../server/daily-ranking-seal-service.mjs';
import { createDailyPrizeService } from '../server/daily-prize-service.mjs';

const date = '2026-11-15';
const closedAt = Date.parse('2026-11-16T00:00:00Z');
const receipt = (uid, score) => ({
    uid, date, mode: 'daily', score, correctAnswers: score / 10,
    answeredQuestions: 10, totalQuestions: 10
});

function fixture(receipts = [receipt('alice', 100), receipt('bob', 90)]) {
    const records = structuredClone(receipts);
    const rankings = new Map();
    const users = new Map([['alice', { coins: 0, experience: 0, weeklyExperience: 0 }]]);
    const prizes = new Map();
    let queue = Promise.resolve();
    const store = {
        rankings, records, users, prizes,
        runTransaction(callback) {
            const job = queue.then(async () => {
                const changes = new Map();
                const tx = {
                    getDailyRanking: async key => structuredClone(rankings.get(key)),
                    getDailyReceipts: async () => structuredClone(records),
                    setDailyRanking: async (key, value) => changes.set('r:' + key, structuredClone(value)),
                    getDailyPrize: async key => structuredClone(prizes.get(key)),
                    setDailyPrize: async (key, value) => changes.set('p:' + key, structuredClone(value)),
                    getUser: async uid => structuredClone(users.get(uid)),
                    setUser: async (uid, value) => changes.set('u:' + uid, structuredClone(value))
                };
                const result = await callback(tx);
                for (const [key, value] of changes) {
                    if (key.startsWith('r:')) rankings.set(key.slice(2), value);
                    if (key.startsWith('p:')) prizes.set(key.slice(2), value);
                    if (key.startsWith('u:')) users.set(key.slice(2), value);
                }
                return result;
            });
            queue = job.catch(() => {});
            return job;
        }
    };
    return { store, seal: createDailyRankingSealService(store), prize: createDailyPrizeService(store) };
}

test('only a closed UTC day can be sealed', async () => {
    const { seal, store } = fixture();
    await assert.rejects(seal.seal({ date, now: closedAt - 1 }), /DAILY_NOT_CLOSED/);
    await assert.rejects(seal.seal({ date: '2026-02-30', now: closedAt }), /DAILY_NOT_CLOSED/);
    assert.equal(store.rankings.size, 0);
});

test('concurrent requests seal exactly one snapshot and retries cannot change it', async () => {
    const { seal, store } = fixture();
    const [first, replay] = await Promise.all([
        seal.seal({ date, now: closedAt }), seal.seal({ date, now: closedAt })
    ]);
    assert.deepEqual([first.alreadySealed, replay.alreadySealed], [false, true]);
    assert.equal(first.participants, 2);
    const original = structuredClone(store.rankings.get(date));
    store.records[0].score = 0;
    assert.deepEqual(store.rankings.get(date), original);
    assert.equal((await seal.seal({ date, now: closedAt + 100 })).alreadySealed, true);
    assert.deepEqual(store.rankings.get(date), original);
});

test('malformed and duplicate receipts are rejected before any writes', async () => {
    for (const records of [
        [receipt('alice', 100), receipt('alice', 80)],
        [{ ...receipt('alice', 100), date: '2026-11-14' }],
        [{ ...receipt('alice', 100), totalQuestions: 9 }]
    ]) {
        const { seal, store } = fixture(records);
        await assert.rejects(seal.seal({ date, now: closedAt }));
        assert.equal(store.rankings.size, 0);
    }
});

test('sealed snapshot is accepted by prize claiming without client scores', async () => {
    const { seal, prize, store } = fixture();
    await seal.seal({ date, now: closedAt });
    const awarded = await prize.claim({ uid: 'alice', date, now: closedAt });
    assert.equal(awarded.rank, 1);
    assert.equal(awarded.coins, 100);
    assert.equal(store.users.get('alice').coins, 100);
    const replay = await prize.claim({ uid: 'alice', date, now: closedAt });
    assert.equal(replay.alreadyClaimed, true);
    assert.equal(store.users.get('alice').coins, 100);
});
