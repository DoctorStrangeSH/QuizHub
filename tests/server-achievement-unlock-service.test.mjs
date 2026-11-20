import test from 'node:test';
import assert from 'node:assert/strict';
import { createAchievementUnlockService } from '../server/achievement-unlock-service.mjs';

function setup(facts, achievements = []) {
    const users = new Map([['alice', { nickname: 'Alice', coins: 50, achievements }]]);
    const receipts = new Set();
    let queue = Promise.resolve();
    const store = {
        users, receipts,
        runTransaction(callback) {
            const task = queue.then(async () => {
                let patch = null, pending = [];
                const tx = {
                    async getAchievementFacts(uid) { return structuredClone(facts[uid] ?? null); },
                    async getUser(uid) { return structuredClone(users.get(uid) ?? null); },
                    async setAchievementFacts(uid, value) { facts[uid] = structuredClone(value); },
                    async setUserPatch(uid, value) { patch = structuredClone(value); },
                    async createUnlockReceipts(uid, ids) { pending = ids.map(id => uid + ':' + id); }
                };
                const result = await callback(tx);
                if (patch) users.set('alice', { ...users.get('alice'), ...patch });
                for (const id of pending) receipts.add(id);
                return result;
            });
            queue = task.catch(() => {});
            return task;
        }
    };
    return store;
}

test('catalog evaluates only server facts and unlocks eligible achievements', async () => {
    const store = setup({ alice: { totalGames: 10, experience: 1200, level: 5 } });
    const service = createAchievementUnlockService({ store });
    const result = await service.evaluate({ uid: 'alice' });
    assert.deepEqual(result.newlyUnlocked, ['first_quiz', 'ten_quizzes', 'fast_learner', 'level_five']);
    assert.deepEqual(store.users.get('alice').achievements, result.newlyUnlocked);
    assert.equal(store.users.get('alice').coins, 50);
    assert.equal(store.receipts.size, 4);
});

test('retries and concurrent evaluations do not issue duplicate unlocks', async () => {
    const store = setup({ alice: { totalGames: 100, experience: 1000, level: 10 } });
    const service = createAchievementUnlockService({ store });
    const results = await Promise.all([
        service.evaluate({ uid: 'alice' }),
        service.evaluate({ uid: 'alice' })
    ]);
    assert.equal(results.reduce((n, item) => n + item.newlyUnlocked.length, 0), 7);
    assert.equal(store.receipts.size, 7);
    assert.equal(new Set(store.users.get('alice').achievements).size, 7);
});

test('preserves existing achievement IDs and never accepts caller-supplied progress', async () => {
    const store = setup({ alice: { totalGames: 0, experience: 0, level: 1 } }, ['legacy_custom']);
    const service = createAchievementUnlockService({ store });
    const result = await service.evaluate({ uid: 'alice', totalGames: 999999, experience: 999999, level: 99 });
    assert.deepEqual(result.newlyUnlocked, []);
    assert.deepEqual(store.users.get('alice').achievements, ['legacy_custom']);
});

test('missing facts do not unlock anything; missing profile and invalid catalog fail closed', async () => {
    const store = setup({});
    const service = createAchievementUnlockService({ store });
    assert.deepEqual((await service.evaluate({ uid: 'alice' })).newlyUnlocked, []);
    await assert.rejects(service.evaluate({ uid: '../alice' }), /AUTH_REQUIRED/);
    assert.throws(() => createAchievementUnlockService({ store, catalog: [{ id: 'bad', fact: 'coins', threshold: 1 }] }), /INVALID_ACHIEVEMENT_CATALOG/);
});
