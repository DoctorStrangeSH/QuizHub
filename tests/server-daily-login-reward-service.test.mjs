import test from 'node:test';
import assert from 'node:assert/strict';
import { createDailyLoginRewardService, DAILY_LOGIN_REWARDS } from '../server/daily-login-reward-service.mjs';

function makeStore(users) {
    const claims = new Map();
    let queue = Promise.resolve();
    const store = {
        users: structuredClone(users), claims,
        runTransaction(callback) {
            const task = queue.then(async () => {
                const userWrites = new Map(), claimWrites = new Map();
                const tx = {
                    async getDailyLoginClaim(key) { return structuredClone(claimWrites.get(key) ?? claims.get(key) ?? null); },
                    async getUser(uid) { return structuredClone(userWrites.get(uid) ?? store.users[uid] ?? null); },
                    async setUserPatch(uid, patch) { userWrites.set(uid, { ...store.users[uid], ...structuredClone(patch) }); },
                    async setDailyLoginClaim(key, receipt) { claimWrites.set(key, structuredClone(receipt)); }
                };
                const result = await callback(tx);
                for (const [uid, value] of userWrites) store.users[uid] = value;
                for (const [key, value] of claimWrites) claims.set(key, value);
                return result;
            });
            queue = task.catch(() => {});
            return task;
        }
    };
    return store;
}

const at = date => Date.parse(date + 'T12:00:00.000Z');

test('seven-day reward schedule is preserved', () => {
    assert.deepEqual(DAILY_LOGIN_REWARDS, [10, 20, 30, 50, 75, 100, 200]);
});

test('first claim awards day one and stores a durable receipt', async () => {
    const store = makeStore({ alice: { coins: 100, dailyStreak: 0, lastDailyClaim: null, nickname: 'Alice' } });
    const service = createDailyLoginRewardService({ store });
    const result = await service.claim({ uid: 'alice', now: at('2026-11-20') });
    assert.equal(result.coins, 10);
    assert.equal(result.streak, 1);
    assert.equal(result.balance, 110);
    assert.equal(store.users.alice.nickname, 'Alice');
    assert.equal(store.users.alice.coins, 110);
    assert.equal(store.claims.size, 1);
});

test('same-day retries, including concurrent requests, credit exactly once', async () => {
    const store = makeStore({ alice: { coins: 100, dailyStreak: 2, lastDailyClaim: new Date(at('2026-11-19')) } });
    const service = createDailyLoginRewardService({ store });
    const [a, b] = await Promise.all([
        service.claim({ uid: 'alice', now: at('2026-11-20') }),
        service.claim({ uid: 'alice', now: at('2026-11-20') })
    ]);
    assert.deepEqual([a.alreadyClaimed, b.alreadyClaimed].sort(), [false, true]);
    assert.equal(store.users.alice.coins, 130);
    assert.equal(store.users.alice.dailyStreak, 3);
    assert.equal(store.claims.size, 1);
});

test('consecutive UTC day increments streak and skipped day resets it', async () => {
    const store = makeStore({
        alice: { coins: 0, dailyStreak: 6, lastDailyClaim: new Date(at('2026-11-19')) },
        bob: { coins: 0, dailyStreak: 6, lastDailyClaim: new Date(at('2026-11-18')) }
    });
    const service = createDailyLoginRewardService({ store });
    const [a, b] = await Promise.all([
        service.claim({ uid: 'alice', now: at('2026-11-20') }),
        service.claim({ uid: 'bob', now: at('2026-11-20') })
    ]);
    assert.equal(a.streak, 7);
    assert.equal(a.coins, 200);
    assert.equal(b.streak, 1);
    assert.equal(b.coins, 10);
});

test('legacy Firestore Timestamp is understood and same-day claim is blocked without receipt', async () => {
    const last = at('2026-11-20');
    const timestamp = { toMillis: () => last };
    const store = makeStore({ alice: { coins: 55, dailyStreak: 4, lastDailyClaim: timestamp } });
    const service = createDailyLoginRewardService({ store });
    await assert.rejects(service.claim({ uid: 'alice', now: at('2026-11-20') }), /DAILY_ALREADY_CLAIMED/);
    assert.equal(store.users.alice.coins, 55);
});

test('rejects missing profile, invalid identity and invalid time without writes', async () => {
    const store = makeStore({ alice: { coins: 5, dailyStreak: 0 } });
    const service = createDailyLoginRewardService({ store });
    await assert.rejects(service.claim({ uid: 'nobody', now: at('2026-11-20') }), /USER_NOT_FOUND/);
    await assert.rejects(service.claim({ uid: '../alice', now: at('2026-11-20') }), /AUTH_REQUIRED/);
    await assert.rejects(service.claim({ uid: 'alice', now: NaN }), /INVALID_SERVER_TIME/);
    assert.equal(store.users.alice.coins, 5);
    assert.equal(store.claims.size, 0);
});
