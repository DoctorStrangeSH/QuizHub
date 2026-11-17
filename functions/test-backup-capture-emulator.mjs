import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint, DocumentReference } from 'firebase-admin/firestore';
import { captureQuizHubEmulatorSnapshot } from '../server/backup-capture-emulator.mjs';
import { restoreQuizHubSnapshotInEmulator } from '../server/backup-restore-emulator.mjs';
import { verifyBackupIntegrity } from '../server/backup-integrity.mjs';
import { protectedQuizHubManifestKeys } from '../server/firestore-migration-inventory.mjs';

test('read-only collector discovers ordinary, nested and orphan-parent documents and produces a verifiable manifest', async () => {
    assert.equal(process.env.GCLOUD_PROJECT, 'demo-quizhub');
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'capture-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const uid = 'capture_' + suffix, chat = 'chat_' + suffix, date = '2099-' + suffix;
    const refs = [
        db.doc('users/' + uid),
        db.doc('chats/' + chat),
        db.doc('chats/' + chat + '/messages/m1'),
        db.doc('dailyAttempts/' + date + '/users/' + uid)
    ];
    try {
        await refs[0].create({
            coins: 500, achievements: ['winner'],
            joinedAt: new Timestamp(1700000000, 987654000),
            lastLocation: new GeoPoint(60.1, 24.9),
            avatar: Buffer.from([4, 5]),
            teammate: db.doc('users/friend_' + suffix)
        });
        await refs[1].create({ participants: [uid] });
        await refs[2].create({ text: 'Nested message', sentAt: new Timestamp(1700000001, 123456000) });
        // Parent dailyAttempts/{date} intentionally DOES NOT exist.
        await refs[3].create({ score: 123 });
        const options = { firestoreTypes: { Timestamp, GeoPoint, DocumentReference } };
        const { snapshot, manifest, summary } = await captureQuizHubEmulatorSnapshot(db, options);
        assert.equal(summary.documentCount, 4);
        assert.equal(summary.consistentAtSingleInstant, false);
        assert.equal(Object.keys(snapshot).length, protectedQuizHubManifestKeys().length);
        assert.equal(snapshot.chatMessages[0].id, chat + '/m1');
        assert.equal(snapshot.dailyAttempts[0].id, date + '/' + uid);
        assert.equal(snapshot.users[0].data.coins, 500);
        assert.equal(snapshot.users[0].data.joinedAt.__quizhub_firestore_type_v1, 'timestamp');
        assert.equal(snapshot.users[0].data.avatar.__quizhub_firestore_type_v1, 'bytes');
        assert.equal(snapshot.users[0].data.teammate.__quizhub_firestore_type_v1, 'reference');
        assert.equal(verifyBackupIntegrity(snapshot, manifest).status, 'verified');
        await assert.rejects(captureQuizHubEmulatorSnapshot(db, { ...options, maxDocuments: 2 }), /EMULATOR_SNAPSHOT_DOCUMENT_LIMIT/);
        assert.equal((await refs[0].get()).data().coins, 500);
        // The disposable emulator is the only place where this rehearsal
        // deletes seeded fixture documents. Never do this to a live database.
        for (const ref of [...refs].reverse()) await ref.delete();
        for (const ref of refs) assert.equal((await ref.get()).exists, false);
        const tampered = structuredClone(snapshot);
        tampered.users[0].data.coins = 999999;
        await assert.rejects(restoreQuizHubSnapshotInEmulator(db, tampered, manifest, {
            confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR',
            ...options
        }), /BACKUP_INTEGRITY_NOT_VERIFIED/);
        for (const ref of refs) assert.equal((await ref.get()).exists, false);
        const restored = await restoreQuizHubSnapshotInEmulator(db, snapshot, manifest, {
            confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR',
            ...options
        });
        assert.equal(restored.status, 'verified');
        assert.equal(restored.restoredDocuments, 4);
        assert.equal(restored.rootSha256, manifest.rootSha256);
        const secondCapture = await captureQuizHubEmulatorSnapshot(db, options);
        assert.equal(secondCapture.manifest.rootSha256, manifest.rootSha256);
        assert.equal(secondCapture.summary.documentCount, 4);
        assert.equal((await refs[0].get()).data().coins, 500);
        assert.deepEqual((await refs[2].get()).data().text, 'Nested message');
    } finally {
        await Promise.all(refs.reverse().map(ref => ref.delete()));
        await db.terminate();
        await deleteApp(app);
    }
});

test('unknown nested collection fails closed without modifying data', async () => {
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'unknown-nested-' + randomUUID());
    const db = getFirestore(app);
    const uid = 'orphan_' + randomUUID().replaceAll('-', '').slice(0, 12);
    const ref = db.doc('users/' + uid + '/unexpected/legacy');
    try {
        await ref.create({ rareItem: true });
        await assert.rejects(
            captureQuizHubEmulatorSnapshot(db),
            /UNKNOWN_NESTED_EMULATOR_COLLECTION/
        );
        assert.equal((await ref.get()).data().rareItem, true);
    } finally {
        await ref.delete();
        await db.terminate();
        await deleteApp(app);
    }
});
