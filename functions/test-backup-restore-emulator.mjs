import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint, DocumentReference } from 'firebase-admin/firestore';
import { encodeFirestoreBackupData } from '../server/firestore-backup-codec.mjs';
import { createBackupIntegrityManifest } from '../server/backup-integrity.mjs';
import { planQuizHubEmulatorRestore, restoreQuizHubSnapshotInEmulator } from '../server/backup-restore-emulator.mjs';
import { protectedQuizHubManifestKeys } from '../server/firestore-migration-inventory.mjs';

function fixture(suffix) {
    const snapshot = Object.fromEntries(protectedQuizHubManifestKeys().map(key => [key, []]));
    const uid = 'restore_' + suffix;
    const chatId = 'restore_chat_' + suffix;
    const date = '2099-01-01-' + suffix;
    snapshot.users.push({ id: uid, data: {
        nickname: 'Keeper', coins: 237, experience: 900,
        friends: ['ally_' + suffix], achievements: ['first_win'],
        inventory: { frames: ['gold'] }, progress: { wins: 14, level: 6 }
    } });
    snapshot.chats.push({ id: chatId, data: { participants: [uid], name: 'Test chat' } });
    snapshot.chatMessages.push({ id: chatId + '/message_' + suffix, data: {
        senderId: uid, text: 'Nested chat preserved', sentAt: 1700000000
    } });
    snapshot.dailyAttempts.push({ id: date + '/' + uid, data: { score: 75, played: true } });
    snapshot.dailyPrizes.push({ id: date + '/' + uid, data: { coins: 15, claimed: false } });
    snapshot.dailyReceipts.push({ id: date + '/' + uid, data: { txId: 'receipt_' + suffix } });
    snapshot.dailyRankings.push({ id: date, data: { winners: [uid] } });
    snapshot.quizSessions.push({ id: 'session_' + suffix, data: {
        owner: uid, progress: { correct: 8, questions: 10 }, completed: true
    } });
    return snapshot;
}

test('disposable Firestore emulator restores private account, progress and nested chat atomically and verifies digests', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT, 'demo-quizhub');
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'restore-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const snapshot = fixture(suffix);
    const manifest = createBackupIntegrityManifest(snapshot);
    const plan = planQuizHubEmulatorRestore(snapshot, manifest);
    assert.equal(plan.operations.length, 8);
    const refs = plan.operations.map(operation => db.doc(operation.path));
    try {
        const result = await restoreQuizHubSnapshotInEmulator(db, snapshot, manifest, {
            confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR'
        });
        assert.equal(result.status, 'verified');
        assert.equal(result.restoredDocuments, 8);
        assert.equal(result.rootSha256, manifest.rootSha256);
        assert.equal((await db.collection('users').doc(snapshot.users[0].id).get()).data().coins, 237);
        assert.deepEqual((await db.doc(plan.operations.find(x => x.key === 'chatMessages').path).get()).data(), snapshot.chatMessages[0].data);
        await assert.rejects(
            restoreQuizHubSnapshotInEmulator(db, snapshot, manifest, {
                confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR'
            }),
            /RESTORE_TARGET_ALREADY_EXISTS/
        );
        assert.equal((await refs[0].get()).data().coins, 237);
    } finally {
        await Promise.all(refs.reverse().map(ref => ref.delete()));
        await db.terminate();
        await deleteApp(app);
    }
});

test('restore planner fails closed for altered snapshot and ambiguous nested paths', () => {
    const snapshot = fixture('validation');
    const manifest = createBackupIntegrityManifest(snapshot);
    assert.throws(() => planQuizHubEmulatorRestore({
        ...snapshot, users: snapshot.users.map(item => ({
            ...item, data: { ...item.data, coins: 9999 }
        }))
    }, manifest), /BACKUP_INTEGRITY_NOT_VERIFIED/);
    const bad = fixture('validation');
    bad.chatMessages[0].id = 'missing-chat-segment';
    assert.throws(() => planQuizHubEmulatorRestore(bad, createBackupIntegrityManifest(bad)), /INVALID_RESTORE_ID_DEPTH/);
    const unknown = { ...snapshot, mystery: [{ id: 'someDoc', data: { secret: 1 } }] };
    assert.throws(() => planQuizHubEmulatorRestore(unknown, createBackupIntegrityManifest(unknown)), /RESTORE_COLLECTION_NOT_ALLOWED/);
});

test('emulator restores typed Firestore fields, then re-encodes readback for exact SHA-256 verification', async () => {
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'typed-restore-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const options = { Timestamp, GeoPoint, DocumentReference, db };
    const snapshot = fixture(suffix);
    snapshot.users[0].data = encodeFirestoreBackupData({
        ...snapshot.users[0].data,
        joinedAt: new Timestamp(1700000000, 987654000),
        location: new GeoPoint(60.1234, 24.9876),
        portrait: Buffer.from([1, 20, 255]),
        teammate: db.collection('users').doc('friend_' + suffix)
    }, options);
    snapshot.chatMessages[0].data = encodeFirestoreBackupData({
        text: 'Timestamp-backed chat', sentAt: new Timestamp(1700000001, 123456000)
    }, options);
    const manifest = createBackupIntegrityManifest(snapshot);
    const plan = planQuizHubEmulatorRestore(snapshot, manifest);
    const refs = plan.operations.map(operation => db.doc(operation.path));
    try {
        const result = await restoreQuizHubSnapshotInEmulator(db, snapshot, manifest, {
            confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR',
            firestoreTypes: { Timestamp, GeoPoint, DocumentReference }
        });
        assert.equal(result.status, 'verified');
        assert.equal(result.rootSha256, manifest.rootSha256);
        const saved = (await db.collection('users').doc(snapshot.users[0].id).get()).data();
        assert.equal(saved.joinedAt.nanoseconds, 987654000);
        assert.deepEqual(saved.portrait, Buffer.from([1, 20, 255]));
        assert.equal(saved.teammate.path, 'users/friend_' + suffix);
        assert.equal((await db.doc(plan.operations.find(x => x.key === 'chatMessages').path).get()).data().sentAt.nanoseconds, 123456000);
    } finally {
        await Promise.all(refs.reverse().map(ref => ref.delete()));
        await db.terminate();
        await deleteApp(app);
    }
});

test('unsupported tagged Date is blocked BEFORE any Firestore write', async () => {
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'date-restore-' + randomUUID());
    const db = getFirestore(app);
    const snapshot = fixture(randomUUID().replaceAll('-', '').slice(0, 12));
    snapshot.users[0].data.createdAt = {
        __quizhub_firestore_type_v1: 'date',
        iso: '2024-01-01T00:00:00.000Z'
    };
    const manifest = createBackupIntegrityManifest(snapshot);
    try {
        await assert.rejects(
            restoreQuizHubSnapshotInEmulator(db, snapshot, manifest, {
                confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR',
                firestoreTypes: { Timestamp, GeoPoint, DocumentReference }
            }),
            /FIRESTORE_DATE_REQUIRES_TIMESTAMP_CANONICALIZATION/
        );
        assert.equal((await db.collection('users').doc(snapshot.users[0].id).get()).exists, false);
    } finally {
        await db.terminate();
        await deleteApp(app);
    }
});

test('sub-microsecond Firestore Timestamp is rejected before any document is created', async () => {
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'submicro-' + randomUUID());
    const db = getFirestore(app);
    const snapshot = fixture(randomUUID().replaceAll('-', '').slice(0, 12));
    snapshot.users[0].data.joinedAt = {
        __quizhub_firestore_type_v1: 'timestamp',
        seconds: 1700000000,
        nanoseconds: 987654321
    };
    try {
        await assert.rejects(
            restoreQuizHubSnapshotInEmulator(db, snapshot, createBackupIntegrityManifest(snapshot), {
                confirmation: 'RESTORE_TO_DISPOSABLE_EMULATOR',
                firestoreTypes: { Timestamp, GeoPoint, DocumentReference }
            }),
            /FIRESTORE_TIMESTAMP_PRECISION_EXCEEDS_MICROSECONDS/
        );
        assert.equal((await db.collection('users').doc(snapshot.users[0].id).get()).exists, false);
    } finally {
        await db.terminate();
        await deleteApp(app);
    }
});
