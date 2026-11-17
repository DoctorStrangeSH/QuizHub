import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
