import test from 'node:test';
import assert from 'node:assert/strict';
import { syncPublicProfile } from '../server/public-profile-sync.mjs';

function fakeStore(privateData, publicData = null) {
    const docs = new Map([['users/alice', structuredClone(privateData)]]);
    if (publicData) docs.set('publicProfiles/alice', structuredClone(publicData));
    let writes = 0;
    const db = {
        collection(collectionName) {
            return { doc(id) { return { path: collectionName + '/' + id }; } };
        },
        async runTransaction(callback) {
            const tx = {
                async get(ref) {
                    return {
                        exists: docs.has(ref.path),
                        data: () => structuredClone(docs.get(ref.path))
                    };
                },
                set(ref, data) { docs.set(ref.path, structuredClone(data)); writes++; }
            };
            return callback(tx);
        }
    };
    return { db, docs, get writes() { return writes; } };
}

test('sync creates only an allowlisted public projection and never copies secrets', async () => {
    const fixture = fakeStore({
        nickname: 'Alice_1', email: 'private@example.test',
        coins: 999, isAdmin: true, friends: ['private'], experience: 100,
        weeklyExperience: 20, level: 2, wins: 1, equippedFrame: 'frame_gold'
    });
    assert.deepEqual(await syncPublicProfile(fixture.db, 'alice'), { status: 'created', uid: 'alice' });
    const publicData = fixture.docs.get('publicProfiles/alice');
    assert.equal(publicData.nickname, 'Alice_1');
    assert.equal(publicData.experience, 100);
    for (const key of ['email', 'coins', 'friends', 'isAdmin']) {
        assert.equal(key in publicData, false, key + ' should be private');
    }
    assert.equal(fixture.writes, 1);
    assert.deepEqual(await syncPublicProfile(fixture.db, 'alice'), { status: 'unchanged', uid: 'alice' });
    assert.equal(fixture.writes, 1);
});

test('sync refreshes ranks and strips unexpected old public fields', async () => {
    const fixture = fakeStore({ nickname: 'NewName', experience: 250, level: 3 },
        { uid: 'alice', nickname: 'OldName', email: 'oops@example.test', coins: 500 });
    assert.equal((await syncPublicProfile(fixture.db, 'alice')).status, 'updated');
    const data = fixture.docs.get('publicProfiles/alice');
    assert.equal(data.nickname, 'NewName');
    assert.equal(data.experience, 250);
    assert.equal('email' in data, false);
    assert.equal('coins' in data, false);
    assert.equal(fixture.writes, 1);
});

test('sync is strict about uid, missing account, and invalid nickname', async () => {
    const fixture = fakeStore({ nickname: 'Alice_1' });
    await assert.rejects(() => syncPublicProfile(fixture.db, '../alice'), /Invalid UID/);
    await assert.rejects(() => syncPublicProfile({}, 'alice'), /trusted Firestore/);
    assert.deepEqual(await syncPublicProfile(fixture.db, 'bob'), { status: 'missing', uid: 'bob' });
    fixture.docs.set('users/alice', { nickname: '<script>', email: 'private@example.test' });
    await assert.rejects(() => syncPublicProfile(fixture.db, 'alice'), /Invalid public nickname/);
    assert.equal(fixture.docs.has('publicProfiles/alice'), false);
});
