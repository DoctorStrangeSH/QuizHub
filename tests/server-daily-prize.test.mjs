import test from 'node:test';
import assert from 'node:assert/strict';
import { createDailyPrizeService, dailyPrizeForRank } from '../server/daily-prize-service.mjs';

const date = '2026-11-15';
const tomorrow = Date.parse('2026-11-16T00:00:00Z');
const winner = (uid, score) => ({
    uid, date, mode: 'daily', score, correctAnswers: score / 10,
    answeredQuestions: 10, totalQuestions: 10
});
function fixture() {
    const users = new Map(['alice', 'bob', 'carol', 'dan'].map(uid => [
        uid, { experience: 0, weeklyExperience: 0, coins: 0, displayName: uid }
    ]));
    const prizes = new Map();
    let ranking = {
        date, sealed: true,
        receipts: [winner('alice', 100), winner('bob', 90),
            winner('carol', 80), winner('dan', 70)]
    };
    let queue = Promise.resolve();
    const store = {
        users, prizes,
        setRanking: value => { ranking = value; },
        runTransaction(callback) {
            const job = queue.then(async () => {
                const changed = new Map();
                const tx = {
                    getDailyPrize: async key => structuredClone(changed.get('p:' + key) ?? prizes.get(key)),
                    setDailyPrize: async (key, value) => changed.set('p:' + key, structuredClone(value)),
                    getDailyRanking: async () => structuredClone(ranking),
                    getUser: async uid => structuredClone(changed.get('u:' + uid) ?? users.get(uid)),
                    setUser: async (uid, value) => changed.set('u:' + uid, structuredClone(value))
                };
                const result = await callback(tx);
                for (const [key, value] of changed) {
                    if (key.startsWith('p:')) prizes.set(key.slice(2), value);
                    else users.set(key.slice(2), value);
                }
                return result;
            });
            queue = job.catch(() => {});
            return job;
        }
    };
    return { ...store, service: createDailyPrizeService(store) };
}

test('prize tiers are deterministic and small enough for bounded economy', () => {
    assert.deepEqual(dailyPrizeForRank(1), { xp: 200, coins: 100 });
    assert.deepEqual(dailyPrizeForRank(2), { xp: 120, coins: 60 });
    assert.deepEqual(dailyPrizeForRank(10), { xp: 40, coins: 20 });
    assert.deepEqual(dailyPrizeForRank(11), { xp: 0, coins: 0 });
    assert.deepEqual(dailyPrizeForRank(0), { xp: 0, coins: 0 });
});

test('two simultaneous claims create exactly one prize and preserve profile', async () => {
    const { service, users, prizes } = fixture();
    const request = { uid: 'alice', date, now: tomorrow };
    const [first, second] = await Promise.all([service.claim(request), service.claim(request)]);
    assert.deepEqual([first.alreadyClaimed, second.alreadyClaimed], [false, true]);
    assert.equal(first.rank, 1);
    assert.equal(users.get('alice').experience, 200);
    assert.equal(users.get('alice').weeklyExperience, 200);
    assert.equal(users.get('alice').coins, 100);
    assert.equal(users.get('alice').displayName, 'alice');
    assert.equal(prizes.size, 1);
});

test('claim cannot happen before UTC date closes or before ranking is sealed', async () => {
    const data = fixture();
    await assert.rejects(data.service.claim({
        uid: 'alice', date, now: tomorrow - 1
    }), /DAILY_NOT_CLOSED/);
    data.setRanking({ date, sealed: false, receipts: [winner('alice', 100)] });
    await assert.rejects(data.service.claim({
        uid: 'alice', date, now: tomorrow
    }), /DAILY_RANKING_NOT_SEALED/);
    assert.equal(data.prizes.size, 0);
});

test('a player without finalized result cannot claim rewards', async () => {
    const data = fixture();
    await assert.rejects(data.service.claim({
        uid: 'intruder', date, now: tomorrow
    }), /DAILY_RESULT_NOT_FOUND/);
    assert.equal(data.prizes.size, 0);
});

test('invalid ranking receipts or user balances cause no partial writes', async () => {
    const data = fixture();
    data.setRanking({ date, sealed: true, receipts: [
        winner('alice', 100), winner('alice', 50)
    ] });
    await assert.rejects(data.service.claim({
        uid: 'alice', date, now: tomorrow
    }), /DUPLICATE_DAILY_RECEIPT/);
    assert.equal(data.users.get('alice').coins, 0);
    data.setRanking({ date, sealed: true, receipts: [winner('alice', 100)] });
    data.users.get('alice').coins = Number.MAX_SAFE_INTEGER;
    await assert.rejects(data.service.claim({
        uid: 'alice', date, now: tomorrow
    }), /INVALID_USER_BALANCE/);
    assert.equal(data.prizes.size, 0);
});

test('missing, malformed and impossible dates are rejected', async () => {
    const data = fixture();
    for (const badDate of ['2026-02-30', '15.11.2026']) {
        await assert.rejects(data.service.claim({
            uid: 'alice', date: badDate, now: tomorrow
        }), /DAILY_NOT_CLOSED|INVALID_DAILY_PRIZE_REQUEST/);
    }
    await assert.rejects(data.service.claim({
        uid: '', date, now: tomorrow
    }), /AUTH_REQUIRED/);
});
