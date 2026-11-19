import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { inspectLegacyChatsInEmulator } from '../server/chat-migration-capture-emulator.mjs';
import { directChatId } from '../server/chat-send.mjs';

test('read-only chat migration inventory detects orphan parents without touching message contents', async () => {
    assert.equal(process.env.GCLOUD_PROJECT, 'demo-quizhub');
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'chat-inventory-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().slice(0, 10);
    const alice = `alice_${suffix}`;
    const bob = `bob_${suffix}`;
    const legacyId = [alice, bob].sort().join('_');
    const refs = [db.collection('users').doc(alice), db.collection('users').doc(bob)];
    const legacyRef = db.collection('chats').doc(legacyId);
    const msgRef = legacyRef.collection('messages').doc('legacyMessage');
    const newRef = db.collection('chats').doc(directChatId(alice, bob));
    try {
        await Promise.all([
            refs[0].set({ friends: [bob], email: 'private@example.test' }),
            refs[1].set({ friends: [alice], coins: 25 }),
            msgRef.set({ senderId: alice, text: 'secret body', reactions: { [bob]: '❤️' } })
        ]);
        assert.equal((await legacyRef.get()).exists, false);
        const first = await inspectLegacyChatsInEmulator(db);
        assert.equal(first.ready, true, JSON.stringify(first.blockers));
        assert.equal(first.mappedMessages, 1);
        assert.equal(first.orphanParentCount, 1);
        assert.equal(first.snapshotConsistentAtSingleInstant, false);
        assert.equal(JSON.stringify(first).includes('secret body'), false);
        assert.equal(JSON.stringify(first).includes('private@example.test'), false);
        assert.equal((await msgRef.get()).data().text, 'secret body');
        await assert.rejects(inspectLegacyChatsInEmulator(db, { maxMessages: 0 }), /INVALID_CHAT_INSPECTION_CONFIG/);
        await newRef.set({ memberUids: [alice, bob] });
        const blocked = await inspectLegacyChatsInEmulator(db);
        assert.equal(blocked.ready, false);
        assert.ok(blocked.blockers.some(x => x.code === 'DESTINATION_ALREADY_EXISTS'));
        assert.equal((await msgRef.get()).data().reactions[bob], '❤️');
    } finally {
        await msgRef.delete();
        await newRef.delete();
        await Promise.all(refs.map(ref => ref.delete()));
        await db.terminate();
        await deleteApp(app);
    }
});
