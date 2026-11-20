import test from 'node:test';
import assert from 'node:assert/strict';
import { createAchievementFirestoreStore } from '../server/achievement-firestore-store.mjs';
import { createAchievementUnlockService } from '../server/achievement-unlock-service.mjs';

function fakeDb() {
    const docs = new Map();
    let queue = Promise.resolve();
    const ref = path => ({ path, collection: name => ({ doc: id => ref(path + '/' + name + '/' + id) }) });
    return {
        docs,
        collection: name => ({ doc: id => ref(name + '/' + id) }),
        runTransaction(callback) {
            const task = queue.then(async () => {
                const writes = new Map();
                const native = {
                    async get(target) { return { exists: docs.has(target.path), data: () => structuredClone(docs.get(target.path)) }; },
                    update(target, patch) { writes.set(target.path, { ...docs.get(target.path), ...structuredClone(patch) }); },
                    create(target, value) { assert.equal(docs.has(target.path), false); writes.set(target.path, structuredClone(value)); }
                };
                const result = await callback(native);
                for (const [path, value] of writes) docs.set(path, value);
                return result;
            });
            queue = task.catch(() => {});
            return task;
        }
    };
}

test('Firestore adapter reads server facts and writes only user achievements plus immutable receipts', async () => {
    const db = fakeDb();
    db.docs.set('users/alice', { coins: 40, nickname: 'Alice', achievements: [] });
    db.docs.set('achievementFacts/alice', { totalGames: 1, experience: 0, level: 1 });
    const service = createAchievementUnlockService({ store: createAchievementFirestoreStore(db) });
    const result = await service.evaluate({ uid: 'alice' });
    assert.deepEqual(result.newlyUnlocked, ['first_quiz']);
    assert.deepEqual(db.docs.get('users/alice').achievements, ['first_quiz']);
    assert.equal(db.docs.get('users/alice').coins, 40);
    assert.equal(db.docs.get('users/alice').nickname, 'Alice');
    assert.deepEqual(db.docs.get('achievementUnlockReceipts/alice/unlocks/first_quiz'), {
        achievementId: 'first_quiz',
        unlockedAt: db.docs.get('achievementUnlockReceipts/alice/unlocks/first_quiz').unlockedAt
    });
});

test('unsafe UIDs are rejected before any database access', async () => {
    const db = fakeDb();
    const store = createAchievementFirestoreStore(db);
    await assert.rejects(store.runTransaction(tx => tx.getUser('../alice')), /INVALID_ACHIEVEMENT_UID/);
    assert.equal(db.docs.size, 0);
});
