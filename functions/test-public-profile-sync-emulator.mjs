import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { syncPublicProfile } from '../server/public-profile-sync.mjs';

test('Firestore emulator: trusted public-profile sync is idempotent and strips sensitive data', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, 'demo-quizhub');
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'public-sync-' + randomUUID());
    const db = getFirestore(app);
    const uid = 'sync_' + randomUUID().replaceAll('-', '');
    const privateRef = db.collection('users').doc(uid);
    const publicRef = db.collection('publicProfiles').doc(uid);
    try {
        await privateRef.set({
            nickname: 'SyncPlayer', email: 'secret@example.test', coins: 9000,
            experience: 120, weeklyExperience: 30, level: 2, wins: 5
        });
        const parallel = await Promise.all(Array.from({ length: 3 }, () => syncPublicProfile(db, uid)));
        assert.equal(parallel.filter(result => result.status === 'created').length, 1);
        const projection = (await publicRef.get()).data();
        assert.equal(projection.nickname, 'SyncPlayer');
        assert.equal(projection.experience, 120);
        assert.equal('email' in projection, false);
        assert.equal('coins' in projection, false);

        await privateRef.update({ experience: 600, nickname: 'RenamedPlayer' });
        assert.deepEqual(await syncPublicProfile(db, uid), { status: 'updated', uid });
        assert.deepEqual(await syncPublicProfile(db, uid), { status: 'unchanged', uid });
        assert.equal((await publicRef.get()).data().experience, 600);
        assert.equal((await publicRef.get()).data().nickname, 'RenamedPlayer');
        assert.equal((await privateRef.get()).data().email, 'secret@example.test');
    } finally {
        await Promise.all([privateRef.delete(), publicRef.delete()]);
        await db.terminate();
        await deleteApp(app);
    }
});
