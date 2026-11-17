import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint, DocumentReference } from 'firebase-admin/firestore';
import { captureQuizHubEmulatorSnapshot, captureStableQuizHubEmulatorSnapshot } from '../server/backup-capture-emulator.mjs';
import { restoreQuizHubSnapshotInEmulator } from '../server/backup-restore-emulator.mjs';
import { sealQuizHubEmulatorBackup, restoreSealedQuizHubBackupInEmulator, preflightSealedQuizHubRestoreInEmulator } from '../server/backup-package-emulator.mjs';
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
        const captured = await captureStableQuizHubEmulatorSnapshot(db, options);
        const { snapshot, manifest, summary } = captured;
        const sealed = sealQuizHubEmulatorBackup(captured);
        assert.equal(sealed.state, 'complete');
        assert.equal(sealed.metadata.documentCount, 4);
        const blockedPreflight = await preflightSealedQuizHubRestoreInEmulator(db, sealed);
        assert.equal(blockedPreflight.status, 'blocked_existing_documents');
        assert.equal(blockedPreflight.conflictingDocuments, 4);
        assert.equal(blockedPreflight.documentCount, 4);
        assert.equal(blockedPreflight.readOnly, true);
        assert.equal(JSON.stringify(blockedPreflight).includes(uid), false);
        assert.throws(() => sealQuizHubEmulatorBackup({ ...captured, summary: { ...summary, stableAcrossTwoPasses: false } }), /UNSTABLE_OR_INCOMPLETE_EMULATOR_CAPTURE/);
        const truncated = structuredClone(sealed);
        truncated.snapshot.users.pop();
        await assert.rejects(restoreSealedQuizHubBackupInEmulator(db, truncated, {
            confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR', ...options
        }), /INCOMPLETE_OR_CORRUPT_EMULATOR_BACKUP_PACKAGE/);
        await assert.rejects(restoreSealedQuizHubBackupInEmulator(db, { ...sealed, state: 'writing' }, {
            confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR', ...options
        }), /INCOMPLETE_EMULATOR_BACKUP_PACKAGE/);
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
        const readyPreflight = await preflightSealedQuizHubRestoreInEmulator(db, sealed);
        assert.equal(readyPreflight.status, 'ready');
        assert.equal(readyPreflight.conflictingDocuments, 0);
        // Simulate another writer racing AFTER a ready preflight.
        await refs[1].create({ participants: ['concurrent-writer'], protected: true });
        await assert.rejects(
            restoreSealedQuizHubBackupInEmulator(db, sealed, {
                confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR',
                ...options
            }),
            /RESTORE_TARGET_ALREADY_EXISTS/
        );
        assert.deepEqual((await refs[1].get()).data(), {
            participants: ['concurrent-writer'], protected: true
        });
        for (const ref of [refs[0], refs[2], refs[3]]) {
            assert.equal((await ref.get()).exists, false);
        }
        await refs[1].delete();
        const tampered = structuredClone(snapshot);
        tampered.users[0].data.coins = 999999;
        await assert.rejects(restoreQuizHubSnapshotInEmulator(db, tampered, manifest, {
            confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR',
            ...options
        }), /BACKUP_INTEGRITY_NOT_VERIFIED/);
        for (const ref of refs) assert.equal((await ref.get()).exists, false);
        const restored = await restoreSealedQuizHubBackupInEmulator(db, sealed, {
            confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR',
            ...options
        });
        assert.equal(restored.status, 'verified');
        assert.equal(restored.restoredDocuments, 4);
        assert.equal(restored.rootSha256, manifest.rootSha256);
        const secondCapture = await captureStableQuizHubEmulatorSnapshot(db, options);
        assert.equal(secondCapture.summary.stableAcrossTwoPasses, true);
        assert.equal(secondCapture.summary.consistentAtSingleInstant, false);
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


test('two-pass capture rejects a document changed between passes', async () => {
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'changing-capture-' + randomUUID());
    const db = getFirestore(app);
    const uid = 'changing_' + randomUUID().replaceAll('-', '').slice(0, 12);
    const ref = db.doc('users/' + uid);
    try {
        await ref.create({ coins: 10 });
        await assert.rejects(
            captureStableQuizHubEmulatorSnapshot(db, {
                betweenPasses: async () => ref.update({ coins: 999 })
            }),
            /EMULATOR_SNAPSHOT_CHANGED_DURING_CAPTURE/
        );
        assert.equal((await ref.get()).data().coins, 999);
        await assert.rejects(
            captureStableQuizHubEmulatorSnapshot(db, { betweenPasses: true }),
            /INVALID_EMULATOR_BETWEEN_PASSES_HOOK/
        );
    } finally {
        await ref.delete();
        await db.terminate();
        await deleteApp(app);
    }
});


test('unknown root blocks capture without modifying the fixture', async () => {
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'unknown-root-' + randomUUID());
    const db = getFirestore(app);
    const ref = db.doc('untrackedCollection/' + randomUUID().replaceAll('-', ''));
    try {
        await ref.create({ shouldSurvive: true });
        await assert.rejects(
            captureStableQuizHubEmulatorSnapshot(db),
            /UNKNOWN_ROOT_EMULATOR_COLLECTION/
        );
        assert.equal((await ref.get()).data().shouldSurvive, true);
    } finally {
        await ref.delete();
        await db.terminate();
        await deleteApp(app);
    }
});

test('two-pass capture rejects a nested document deleted between passes', async () => {
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'deleted-nested-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const ref = db.doc('dailyPrizes/2099-' + suffix + '/users/u_' + suffix);
    try {
        // This nested document has a deliberately absent parent.
        await ref.create({ item: 'reward', claimed: false });
        await assert.rejects(
            captureStableQuizHubEmulatorSnapshot(db, {
                betweenPasses: async () => ref.delete()
            }),
            /EMULATOR_SNAPSHOT_CHANGED_DURING_CAPTURE/
        );
        assert.equal((await ref.get()).exists, false);
    } finally {
        await ref.delete();
        await db.terminate();
        await deleteApp(app);
    }
});


test('empty protected snapshot is a valid no-op restore rehearsal', async () => {
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'empty-restore-' + randomUUID());
    const db = getFirestore(app);
    try {
        const capture = await captureStableQuizHubEmulatorSnapshot(db);
        assert.equal(capture.summary.documentCount, 0);
        const sealed = sealQuizHubEmulatorBackup(capture);
        const preflight = await preflightSealedQuizHubRestoreInEmulator(db, sealed);
        assert.equal(preflight.status, 'ready');
        assert.equal(preflight.documentCount, 0);
        const result = await restoreSealedQuizHubBackupInEmulator(db, sealed, {
            confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR'
        });
        assert.equal(result.status, 'verified');
        assert.equal(result.restoredDocuments, 0);
        assert.equal(result.rootSha256, sealed.manifest.rootSha256);
    } finally {
        await db.terminate();
        await deleteApp(app);
    }
});
