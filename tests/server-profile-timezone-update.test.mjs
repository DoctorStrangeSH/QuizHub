import test from 'node:test';
import assert from 'node:assert/strict';
import { updatePlayerTimeZone } from '../server/profile-timezone-update.mjs';
import { createProfileTimeZoneCallableAdapter } from '../server/profile-timezone-callable-adapter.mjs';

class FakeHttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}

function fakeDatabase(initial = {}) {
    const records = new Map(Object.entries(initial));
    const updates = [];
    return {
        records,
        updates,
        collection(name) {
            return { doc(id) { return { path: name + '/' + id }; } };
        },
        async runTransaction(callback) {
            const staged = [];
            const transaction = {
                async get(ref) {
                    const exists = records.has(ref.path);
                    return { exists, data: () => records.get(ref.path) };
                },
                update(ref, patch) { staged.push([ref.path, structuredClone(patch)]); }
            };
            const result = await callback(transaction);
            for (const [path, patch] of staged) {
                const next = { ...records.get(path), ...patch };
                records.set(path, next);
                updates.push({ path, patch });
            }
            return result;
        }
    };
}

test('updates only the private timezone field and preserves every other profile value', async () => {
    const original = {
        nickname: 'PlayerOne', experience: 725, level: 8, coins: 91,
        stats: { totalGames: 12 }, timeZone: 'UTC'
    };
    const db = fakeDatabase({ 'users/player-1': original });
    const result = await updatePlayerTimeZone(db, {
        uid: 'player-1', timeZone: 'Europe/Berlin'
    });
    assert.deepEqual(result, {
        status: 'updated', uid: 'player-1', timeZone: 'Europe/Berlin'
    });
    assert.deepEqual(db.records.get('users/player-1'), {
        ...original, timeZone: 'Europe/Berlin'
    });
    assert.deepEqual(db.updates, [{
        path: 'users/player-1', patch: { timeZone: 'Europe/Berlin' }
    }]);
});

test('rejects invalid timezone and missing profile without writing anything', async () => {
    const db = fakeDatabase({ 'users/player-1': { nickname: 'PlayerOne' } });
    await assert.rejects(updatePlayerTimeZone(db, {
        uid: 'player-1', timeZone: 'Mars/Olympus'
    }), /INVALID_TIME_ZONE/);
    await assert.rejects(updatePlayerTimeZone(db, {
        uid: 'missing-user', timeZone: 'UTC'
    }), /USER_NOT_FOUND/);
    assert.equal(db.updates.length, 0);
});

test('callable derives UID from Auth and accepts only the timezone field', async () => {
    const calls = [];
    const callable = createProfileTimeZoneCallableAdapter({
        update: async input => (calls.push(input), {
            status: 'updated', uid: input.uid, timeZone: input.timeZone
        }),
        HttpsError: FakeHttpsError
    });
    const result = await callable({
        auth: { uid: 'verified-uid', token: { firebase: { sign_in_provider: 'password' } } },
        data: { timeZone: 'Europe/Berlin' }
    });
    assert.deepEqual(result, {
        status: 'updated', uid: 'verified-uid', timeZone: 'Europe/Berlin'
    });
    assert.deepEqual(calls, [{ uid: 'verified-uid', timeZone: 'Europe/Berlin' }]);
});

test('callable rejects unauthenticated, anonymous, malformed and overprivileged requests', async () => {
    let calls = 0;
    const callable = createProfileTimeZoneCallableAdapter({
        update: async () => { calls++; },
        HttpsError: FakeHttpsError
    });
    await assert.rejects(callable({ data: { timeZone: 'UTC' } }),
        error => error.code === 'unauthenticated');
    await assert.rejects(callable({
        auth: { uid: 'anon', token: { firebase: { sign_in_provider: 'anonymous' } } },
        data: { timeZone: 'UTC' }
    }), error => error.code === 'unauthenticated');
    const auth = { uid: 'verified-uid', token: {} };
    for (const data of [
        null, {}, { timeZone: 'Mars/Olympus' },
        { timeZone: 'UTC', uid: 'victim' },
        { timeZone: 123 }
    ]) {
        await assert.rejects(callable({ auth, data }), error =>
            error.code === 'invalid-argument');
    }
    assert.equal(calls, 0);
});
