import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { renameProfile } from '../server/profile-rename.mjs';

test('Firestore emulator: unique nickname claims, concurrency and privacy-safe renames', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, 'demo-quizhub');
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'rename-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const alice = 'renameA_' + suffix;
    const bob = 'renameB_' + suffix;
    const oldAlice = 'alice_' + suffix;
    const oldBob = 'bob_' + suffix;
    const target = 'winner_' + suffix;
    const references = [
        db.collection('users').doc(alice), db.collection('users').doc(bob),
        db.collection('publicProfiles').doc(alice), db.collection('publicProfiles').doc(bob),
        db.collection('nicknameClaims').doc(oldAlice),
        db.collection('nicknameClaims').doc(oldBob),
        db.collection('nicknameClaims').doc(target)
    ];
    try {
        await references[0].set({ nickname: oldAlice, nicknameLower: oldAlice, email: 'alice@secret.test', coins: 20, experience: 50 });
        await references[1].set({ nickname: oldBob, nicknameLower: oldBob, email: 'bob@secret.test', coins: 10, experience: 25 });
        await references[4].set({ uid: alice });
        await references[5].set({ uid: bob });
        const races = await Promise.allSettled([
            renameProfile(db, { uid: alice, nickname: target }),
            renameProfile(db, { uid: bob, nickname: target })
        ]);
        assert.equal(races.filter(item => item.status === 'fulfilled').length, 1);
        assert.equal(races.filter(item => item.status === 'rejected' && item.reason.message === 'NICKNAME_TAKEN').length, 1);
        const owner = (await references[6].get()).data().uid;
        const winner = (await db.collection('users').doc(owner).get()).data();
        assert.equal(winner.nicknameLower, target);
        const publicData = (await db.collection('publicProfiles').doc(owner).get()).data();
        assert.equal(publicData.nickname, target);
        assert.equal('email' in publicData, false);
        assert.equal('coins' in publicData, false);
        assert.equal((await renameProfile(db, { uid: owner, nickname: target })).status, 'unchanged');
        assert.equal((await db.collection('users').doc(owner).get()).data().email.endsWith('@secret.test'), true);
        await assert.rejects(renameProfile(db, { uid: owner, nickname: '<script>' }), /INVALID_NICKNAME/);
    } finally {
        await Promise.all(references.map(ref => ref.delete()));
        await db.terminate();
        await deleteApp(app);
    }
});

test('Firestore emulator: refusing unreserved legacy nickname prevents collisions', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'legacy-' + randomUUID());
    const db = getFirestore(app);
    const uid = 'legacy_' + randomUUID().replaceAll('-', '');
    const ref = db.collection('users').doc(uid);
    try {
        await ref.set({ nickname: 'LegacyUser', nicknameLower: 'legacyuser', coins: 100 });
        await assert.rejects(renameProfile(db, { uid, nickname: 'NewName' }), /PROFILE_MIGRATION_REQUIRED/);
        assert.equal((await ref.get()).data().nickname, 'LegacyUser');
    } finally {
        await ref.delete();
        await db.terminate();
        await deleteApp(app);
    }
});
