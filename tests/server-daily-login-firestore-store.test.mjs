import test from 'node:test';
import assert from 'node:assert/strict';
import { createDailyLoginFirestoreStore } from '../server/daily-login-firestore-store.mjs';
import { createDailyLoginRewardService } from '../server/daily-login-reward-service.mjs';

function fakeDb() {
    const docs = new Map();
    let queue = Promise.resolve();
    const ref = path => ({
        path,
        collection: name => ({ doc: id => ref(path + '/' + name + '/' + id) })
    });
    return {
        docs,
        collection: name => ({ doc: id => ref(name + '/' + id) }),
        runTransaction(callback) {
            const task = queue.then(async () => {
                const writes = new Map();
                let wrote = false;
                const native = {
                    async get(target) {
                        assert.equal(wrote, false, 'transaction reads must precede writes');
                        return { exists: docs.has(target.path), data: () => structuredClone(docs.get(target.path)) };
                    },
                    update(target, patch) {
                        wrote = true;
                        writes.set(target.path, { ...docs.get(target.path), ...structuredClone(patch) });
                    },
                    create(target, value) {
                        wrote = true;
                        assert.equal(docs.has(target.path), false);
                        writes.set(target.path, structuredClone(value));
                    }
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

test('Firestore adapter writes only approved profile fields and creates per-day receipt', async () => {
    const db = fakeDb();
    db.docs.set('users/alice', { coins: 20, dailyStreak: 1, lastDailyClaim: null, nickname: 'Alice', preferences: { theme: 'night' } });
    const service = createDailyLoginRewardService({ store: createDailyLoginFirestoreStore(db) });
    const result = await service.claim({ uid: 'alice', now: Date.parse('2026-11-20T12:00:00Z') });
    const profile = db.docs.get('users/alice');
    assert.equal(profile.coins, 30);
    assert.equal(profile.dailyStreak, 1);
    assert.ok(profile.lastDailyClaim instanceof Date);
    assert.equal(profile.nickname, 'Alice');
    assert.deepEqual(profile.preferences, { theme: 'night' });
    assert.equal(db.docs.has('dailyLoginClaims/2026-11-20/users/alice'), true);
    assert.equal(result.coins, 10);
});

test('same-day concurrent requests cannot double-credit in Firestore transaction', async () => {
    const db = fakeDb();
    db.docs.set('users/alice', { coins: 20, dailyStreak: 0, lastDailyClaim: null });
    const service = createDailyLoginRewardService({ store: createDailyLoginFirestoreStore(db) });
    const [a, b] = await Promise.all([
        service.claim({ uid: 'alice', now: Date.parse('2026-11-20T12:00:00Z') }),
        service.claim({ uid: 'alice', now: Date.parse('2026-11-20T12:00:00Z') })
    ]);
    assert.deepEqual([a.alreadyClaimed, b.alreadyClaimed].sort(), [false, true]);
    assert.equal(db.docs.get('users/alice').coins, 30);
});

test('unsafe UID and operation document paths are rejected', async () => {
    const db = fakeDb();
    const store = createDailyLoginFirestoreStore(db);
    await assert.rejects(store.runTransaction(tx => tx.getDailyLoginClaim(JSON.stringify(['2026-11-20', '../other']))), /INVALID_DAILY_LOGIN_UID/);
    await assert.rejects(store.runTransaction(tx => tx.getUser('../other')), /INVALID_DAILY_LOGIN_UID/);
    assert.equal(db.docs.size, 0);
});
