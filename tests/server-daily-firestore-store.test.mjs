import test from 'node:test';
import assert from 'node:assert/strict';
import { createDailyFirestoreStore } from '../server/daily-firestore-store.mjs';
import { createDailyRankingSealService } from '../server/daily-ranking-seal-service.mjs';
import { createDailyPrizeService } from '../server/daily-prize-service.mjs';

const date = '2026-11-15';
const closedAt = Date.parse('2026-11-16T00:00:00Z');
const key = uid => JSON.stringify([date, uid]);
const receipt = (uid, score) => ({
    uid, date, mode: 'daily', score,
    correctAnswers: score / 10, answeredQuestions: 10, totalQuestions: 10
});

function fakeAdminDb() {
    const docs = new Map();
    let queue = Promise.resolve();
    const ref = (path, type = 'document') => ({
        path, type,
        collection(name) { return ref(path + '/' + name, 'collection'); },
        doc(name) { return ref(path + '/' + name); }
    });
    const db = {
        docs,
        collection: name => ref(name, 'collection'),
        runTransaction(callback) {
            const operation = queue.then(async () => {
                const pending = new Map();
                const snapshot = target => ({
                    exists: docs.has(target.path),
                    data: () => structuredClone(docs.get(target.path))
                });
                const native = {
                    async get(target) {
                        if (target.type === 'collection') {
                            return {
                                docs: [...docs].filter(([path]) =>
                                    path.startsWith(target.path + '/') &&
                                    !path.slice(target.path.length + 1).includes('/')
                                ).map(([, value]) => ({ data: () => structuredClone(value) }))
                            };
                        }
                        return snapshot(target);
                    },
                    set(target, value) { pending.set(target.path, structuredClone(value)); },
                    update(target, value) {
                        if (!docs.has(target.path)) throw new Error('MISSING_DOCUMENT');
                        pending.set(target.path, { ...docs.get(target.path), ...structuredClone(value) });
                    },
                    create(target, value) {
                        if (docs.has(target.path)) throw new Error('ALREADY_EXISTS');
                        pending.set(target.path, structuredClone(value));
                    }
                };
                const result = await callback(native);
                for (const [path, value] of pending) docs.set(path, value);
                return result;
            });
            queue = operation.catch(() => {});
            return operation;
        }
    };
    return db;
}

test('Firestore adapter stores attempts and their finalized receipts atomically', async () => {
    const db = fakeAdminDb();
    const store = createDailyFirestoreStore(db);
    const attempt = { uid: 'alice', date, session: { answers: [] }, receipt: receipt('alice', 100) };
    await store.runTransaction(async tx => {
        assert.equal(await tx.getDailyAttempt(key('alice')), null);
        await tx.setDailyAttempt(key('alice'), attempt);
    });
    assert.deepEqual(db.docs.get('dailyAttempts/' + date + '/users/alice'), attempt);
    assert.deepEqual(db.docs.get('dailyReceipts/' + date + '/users/alice'), attempt.receipt);
    await store.runTransaction(async tx => {
        assert.deepEqual(await tx.getDailyReceipts(date), [attempt.receipt]);
    });
});

test('sealing plus concurrent prize claims touches only existing economy fields', async () => {
    const db = fakeAdminDb();
    db.docs.set('users/alice', {
        experience: 10, weeklyExperience: 5, coins: 7,
        displayName: 'Alice', preferences: { theme: 'night' }
    });
    const store = createDailyFirestoreStore(db);
    await store.runTransaction(async tx => {
        await tx.setDailyAttempt(key('alice'), { uid: 'alice', date, receipt: receipt('alice', 100) });
    });
    const sealer = createDailyRankingSealService(store);
    assert.equal((await sealer.seal({ date, now: closedAt })).participants, 1);
    const prizes = createDailyPrizeService(store);
    const [first, second] = await Promise.all([
        prizes.claim({ uid: 'alice', date, now: closedAt }),
        prizes.claim({ uid: 'alice', date, now: closedAt })
    ]);
    assert.equal(first.coins, 100);
    assert.equal(second.alreadyClaimed, true);
    assert.deepEqual(db.docs.get('users/alice'), {
        experience: 210, weeklyExperience: 205, coins: 107,
        displayName: 'Alice', preferences: { theme: 'night' }
    });
});

test('invalid keys and failed transactions do not write records', async () => {
    const db = fakeAdminDb();
    const store = createDailyFirestoreStore(db);
    await assert.rejects(store.runTransaction(async tx => {
        await tx.setDailyAttempt('["2026-11-15","../../admin"]', {});
    }), /INVALID_DAILY_STORAGE_UID/);
    await assert.rejects(store.runTransaction(async tx => {
        await tx.setDailyAttempt(key('alice'), { uid: 'alice', date });
        throw new Error('ROLLBACK');
    }), /ROLLBACK/);
    assert.equal(db.docs.size, 0);
});
