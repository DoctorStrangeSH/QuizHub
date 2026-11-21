import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayerProfile } from '../server/profile-create.mjs';
import { createProfileCallableAdapter } from '../server/profile-create-callable-adapter.mjs';

class FakeHttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}

function fakeDatabase() {
    const records = new Map();
    return {
        records,
        collection(name) {
            return { doc(id) { return { path: name + '/' + id }; } };
        },
        async runTransaction(callback) {
            const writes = [];
            const tx = {
                async get(ref) {
                    return { exists: records.has(ref.path), data: () => records.get(ref.path) };
                },
                create(ref, value) { writes.push([ref.path, structuredClone(value)]); }
            };
            const result = await callback(tx);
            for (const [path, value] of writes) records.set(path, value);
            return result;
        }
    };
}

test('trusted profile creation persists a validated IANA timezone privately', async () => {
    const db = fakeDatabase();
    const result = await createPlayerProfile(db, {
        uid: 'player-1', nickname: 'TimeZoneHero', email: 'player@example.test',
        timeZone: 'Europe/Berlin'
    });
    assert.equal(result.status, 'created');
    assert.equal(db.records.get('users/player-1').timeZone, 'Europe/Berlin');
    assert.equal('timeZone' in db.records.get('publicProfiles/player-1'), false);
});

test('profile creation defaults missing timezone to UTC and rejects invalid zones', async () => {
    const db = fakeDatabase();
    await createPlayerProfile(db, { uid: 'player-2', nickname: 'UtcHero' });
    assert.equal(db.records.get('users/player-2').timeZone, 'UTC');
    await assert.rejects(createPlayerProfile(db, {
        uid: 'player-3', nickname: 'BadZone', timeZone: 'Mars/Olympus'
    }), /INVALID_TIME_ZONE/);
    assert.equal(db.records.has('users/player-3'), false);
});

test('authenticated profile callable passes timezone preference but derives UID and email from Auth', async () => {
    const calls = [];
    const callable = createProfileCallableAdapter({
        create: async input => (calls.push(input), {
            status: 'created', uid: input.uid, nickname: input.nickname
        }),
        HttpsError: FakeHttpsError
    });
    await callable({
        auth: { uid: 'verified-uid', token: { email: 'verified@example.test' } },
        data: { nickname: 'PlayerOne', timeZone: 'Europe/Berlin' }
    });
    assert.deepEqual(calls, [{
        uid: 'verified-uid', email: 'verified@example.test',
        nickname: 'PlayerOne', timeZone: 'Europe/Berlin'
    }]);
});

test('profile callable rejects invalid timezone and unexpected fields before creating profile', async () => {
    let calls = 0;
    const callable = createProfileCallableAdapter({
        create: async () => { calls++; },
        HttpsError: FakeHttpsError
    });
    const auth = { uid: 'verified-uid', token: {} };
    await assert.rejects(callable({
        auth, data: { nickname: 'PlayerOne', timeZone: 'Mars/Olympus' }
    }), error => error.code === 'invalid-argument');
    await assert.rejects(callable({
        auth, data: { nickname: 'PlayerOne', coins: 999999 }
    }), error => error.code === 'invalid-argument');
    assert.equal(calls, 0);
});
