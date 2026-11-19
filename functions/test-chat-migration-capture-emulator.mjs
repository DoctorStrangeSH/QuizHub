import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { inspectLegacyChatsInEmulator } from '../server/chat-migration-capture-emulator.mjs';
import { directChatId, sendDirectMessage } from '../server/chat-send.mjs';
import { copyOrphanChatInEmulator } from '../server/chat-migration-copy-emulator.mjs';
import { modifyDirectMessage } from '../server/chat-message-actions.mjs';

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
    const deletedRef = legacyRef.collection('messages').doc('legacyDeleted');
    const newRef = db.collection('chats').doc(directChatId(alice, bob));
    const originalCreatedAt = Timestamp.fromDate(new Date('2026-11-01T10:15:00.000Z'));
    const originalEditedAt = Timestamp.fromDate(new Date('2026-11-02T11:30:00.000Z'));
    const deletedCreatedAt = Timestamp.fromDate(new Date('2026-11-03T08:00:00.000Z'));
    let nextMessageId;
    try {
        await Promise.all([
            refs[0].set({ friends: [bob], email: 'private@example.test' }),
            refs[1].set({ friends: [alice], coins: 25 }),
            msgRef.set({
                senderId: alice, text: 'secret body', reactions: { [bob]: '❤️' },
                createdAt: originalCreatedAt, edited: true, editedAt: originalEditedAt,
                replyTo: 'older-message-id', replyPreview: 'Earlier context'
            }),
            deletedRef.set({
                senderId: bob, text: '🗑️ Сообщение удалено', reactions: {},
                createdAt: deletedCreatedAt, deleted: true, edited: false,
                replyTo: 'legacyMessage'
            })
        ]);
        assert.equal((await legacyRef.get()).exists, false);
        const first = await inspectLegacyChatsInEmulator(db);
        assert.equal(first.ready, true, JSON.stringify(first.blockers));
        assert.equal(first.mappedMessages, 2);
        assert.equal(first.orphanParentCount, 1);
        assert.equal(first.snapshotConsistentAtSingleInstant, false);
        assert.equal(JSON.stringify(first).includes('secret body'), false);
        assert.equal(JSON.stringify(first).includes('private@example.test'), false);
        assert.equal((await msgRef.get()).data().text, 'secret body');
        await msgRef.update({ reactions: { outsider: '👍' } });
        const invalidReactionPlan = await inspectLegacyChatsInEmulator(db);
        assert.equal(invalidReactionPlan.ready, false);
        assert.ok(invalidReactionPlan.blockers.some(x => x.code === 'NONMEMBER_LEGACY_REACTION'));
        assert.equal(JSON.stringify(invalidReactionPlan).includes('secret body'), false);
        await assert.rejects(copyOrphanChatInEmulator(db, first.chats[0], {
            confirmation: 'COPY_ORPHAN_CHAT_IN_DISPOSABLE_EMULATOR'
        }), /CHAT_COPY_SOURCE_VALIDATION_FAILED/);
        assert.equal((await newRef.get()).exists, false);
        await msgRef.update({ reactions: { [bob]: '❤️' } });
        await assert.rejects(inspectLegacyChatsInEmulator(db, { maxMessages: 0 }), /INVALID_CHAT_INSPECTION_CONFIG/);
        await assert.rejects(copyOrphanChatInEmulator(db, first.chats[0]),
            /EXPLICIT_EMULATOR_CHAT_COPY_CONFIRMATION_REQUIRED/);
        assert.equal((await newRef.get()).exists, false);
        const copied = await copyOrphanChatInEmulator(db, first.chats[0], {
            confirmation: 'COPY_ORPHAN_CHAT_IN_DISPOSABLE_EMULATOR'
        });
        assert.equal(copied.status, 'copied_and_verified');
        assert.equal(copied.messageCount, 2);
        assert.equal(copied.originalsDeleted, 0);
        const copiedMessage = (await newRef.collection('messages').doc('legacyMessage').get()).data();
        const copiedDeleted = (await newRef.collection('messages').doc('legacyDeleted').get()).data();
        assert.deepEqual(copiedMessage, (await msgRef.get()).data());
        assert.deepEqual(copiedDeleted, (await deletedRef.get()).data());
        assert.equal(copiedMessage.createdAt.isEqual(originalCreatedAt), true);
        assert.equal(copiedMessage.editedAt.isEqual(originalEditedAt), true);
        assert.equal(copiedMessage.replyTo, 'older-message-id');
        assert.equal(copiedMessage.replyPreview, 'Earlier context');
        assert.equal(copiedMessage.edited, true);
        assert.equal(copiedMessage.reactions[bob], '❤️');
        assert.equal(copiedDeleted.createdAt.isEqual(deletedCreatedAt), true);
        assert.equal(copiedDeleted.deleted, true);
        assert.deepEqual(copiedDeleted.reactions, {});
        assert.equal((await legacyRef.get()).exists, false);
        const nextMessage = await sendDirectMessage(db, {
            senderUid: bob, recipientUid: alice,
            clientMessageId: 'integration_12345', text: 'Fresh message after migration'
        });
        nextMessageId = nextMessage.messageId;
        assert.equal(nextMessage.status, 'sent');
        assert.equal(nextMessage.chatId, newRef.id);
        assert.equal((await newRef.collection('messages').get()).size, 3);
        await assert.rejects(modifyDirectMessage(db, {
            actorUid: bob, chatId: newRef.id, messageId: 'legacyMessage', action: 'edit', text: 'forged'
        }), /CHAT_MESSAGE_NOT_OWNER/);
        await modifyDirectMessage(db, {
            actorUid: alice, chatId: newRef.id, messageId: 'legacyMessage',
            action: 'edit', text: 'Edited after migration'
        });
        await modifyDirectMessage(db, {
            actorUid: bob, chatId: newRef.id, messageId: 'legacyMessage',
            action: 'react', reaction: '👍'
        });
        const evolved = (await newRef.collection('messages').doc('legacyMessage').get()).data();
        assert.equal(evolved.text, 'Edited after migration');
        assert.equal(evolved.edited, true);
        assert.equal(evolved.reactions[bob], '👍');
        assert.equal((await msgRef.get()).data().text, 'secret body');
        assert.equal((await msgRef.get()).data().reactions[bob], '❤️');
        await modifyDirectMessage(db, {
            actorUid: bob, chatId: newRef.id, messageId: nextMessage.messageId,
            action: 'delete'
        });
        assert.equal((await newRef.collection('messages').doc(nextMessage.messageId).get()).data().deleted, true);
        await assert.rejects(copyOrphanChatInEmulator(db, first.chats[0], {
            confirmation: 'COPY_ORPHAN_CHAT_IN_DISPOSABLE_EMULATOR'
        }), /CHAT_COPY_DESTINATION_NOT_EMPTY/);
        const blocked = await inspectLegacyChatsInEmulator(db);
        assert.equal(blocked.ready, false);
        assert.ok(blocked.blockers.some(x => x.code === 'DESTINATION_ALREADY_EXISTS'));
        assert.equal((await msgRef.get()).data().reactions[bob], '❤️');
    } finally {
        await msgRef.delete();
        await deletedRef.delete();
        await newRef.collection('messages').doc('legacyMessage').delete();
        await newRef.collection('messages').doc('legacyDeleted').delete();
        if (nextMessageId) await newRef.collection('messages').doc(nextMessageId).delete();
        await newRef.delete();
        await Promise.all(refs.map(ref => ref.delete()));
        await db.terminate();
        await deleteApp(app);
    }
});
