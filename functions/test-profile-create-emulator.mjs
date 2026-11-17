import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createPlayerProfile } from '../server/profile-create.mjs';

test('Firestore emulator: concurrent registrations reserve one nickname and do not expose private fields', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, 'demo-quizhub');
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'create-profile-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const nickname = 'player_' + suffix;
    const uidA = 'createA_' + suffix;
    const uidB = 'createB_' + suffix;
    const refs = [
        db.collection('users').doc(uidA), db.collection('users').doc(uidB),
        db.collection('publicProfiles').doc(uidA), db.collection('publicProfiles').doc(uidB),
        db.collection('nicknameClaims').doc(nickname)
    ];
    try {
        const results = await Promise.allSettled([
            createPlayerProfile(db, { uid: uidA, nickname, email: 'alice@private.test' }),
            createPlayerProfile(db, { uid: uidB, nickname: nickname.toUpperCase(), email: 'bob@private.test' })
        ]);
        assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
        assert.equal(results.filter(result => result.status === 'rejected' && result.reason.message === 'NICKNAME_TAKEN').length, 1);
        const claim = (await refs[4].get()).data();
        const owner = claim.uid;
        const loser = owner === uidA ? uidB : uidA;
        const privateProfile = (await db.collection('users').doc(owner).get()).data();
        const publicProfile = (await db.collection('publicProfiles').doc(owner).get()).data();
        assert.equal(privateProfile.coins, 100);
        assert.match(privateProfile.email, /@private\.test$/);
        assert.equal(publicProfile.uid, owner);
        assert.equal(publicProfile.nicknameLower, nickname);
        for (const privateKey of ['coins', 'email', 'friends', 'friendRequests', 'achievements', 'ownedFrames']) {
            assert.equal(Object.hasOwn(publicProfile, privateKey), false);
        }
        assert.equal((await db.collection('users').doc(loser).get()).exists, false);
        assert.equal((await db.collection('publicProfiles').doc(loser).get()).exists, false);
        await assert.rejects(createPlayerProfile(db, { uid: owner, nickname: 'another_name' }), /PROFILE_ALREADY_EXISTS/);
        assert.equal((await db.collection('users').doc(owner).get()).data().nicknameLower, nickname);
    } finally {
        await Promise.all(refs.map(ref => ref.delete()));
        await db.terminate();
        await deleteApp(app);
    }
});

test('Firestore emulator: invalid inputs and preexisting records cannot be replaced', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'create-invalid-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const uid = 'legacy_' + suffix;
    const name = 'name_' + suffix;
    const userRef = db.collection('users').doc(uid);
    const claimRef = db.collection('nicknameClaims').doc(name);
    try {
        await assert.rejects(createPlayerProfile(db, { uid, nickname: '<script>' }), /INVALID_NICKNAME/);
        await assert.rejects(createPlayerProfile(db, { uid: '../bad', nickname: name }), /INVALID_UID/);
        await userRef.set({ nickname: 'OldUser', coins: 12345, email: 'existing@private.test' });
        await assert.rejects(createPlayerProfile(db, { uid, nickname: name }), /PROFILE_ALREADY_EXISTS/);
        assert.equal((await userRef.get()).data().coins, 12345);
        await userRef.delete();
        await claimRef.set({ uid: 'another_owner' });
        await assert.rejects(createPlayerProfile(db, { uid, nickname: name }), /NICKNAME_TAKEN/);
        assert.equal((await userRef.get()).exists, false);
        assert.equal((await claimRef.get()).data().uid, 'another_owner');
    } finally {
        await Promise.all([userRef.delete(), claimRef.delete()]);
        await db.terminate();
        await deleteApp(app);
    }
});
