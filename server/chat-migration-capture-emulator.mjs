import { assertIsolatedQuizHubEmulator } from './backup-restore-emulator.mjs';
import { planLegacyChatMigration } from './chat-migration-preflight.mjs';

// Read-only inventory from a disposable emulator. It never copies message
// bodies, writes data, or claims a consistent point-in-time production export.
export async function inspectLegacyChatsInEmulator(db, { maxAccounts = 200, maxChats = 200, maxMessages = 1000 } = {}) {
    assertIsolatedQuizHubEmulator();
    if (!db || typeof db.collection !== 'function' ||
        ![maxAccounts, maxChats, maxMessages].every(n => Number.isSafeInteger(n) && n > 0 && n <= 10000)) {
        throw new TypeError('INVALID_CHAT_INSPECTION_CONFIG');
    }

    const userRefs = await db.collection('users').listDocuments();
    if (userRefs.length > maxAccounts) throw new RangeError('CHAT_INSPECTION_ACCOUNT_LIMIT');
    const users = [];
    for (const ref of userRefs) {
        const snapshot = await ref.get();
        if (!snapshot.exists) continue;
        users.push({ uid: ref.id, friends: snapshot.data().friends });
    }

    const chatRefs = await db.collection('chats').listDocuments();
    if (chatRefs.length > maxChats) throw new RangeError('CHAT_INSPECTION_CHAT_LIMIT');
    const messages = [];
    const destinationChatIds = [];
    let orphanParents = 0;
    for (const ref of chatRefs) {
        const parent = await ref.get();
        if (parent.exists && ref.id.startsWith('dm_')) destinationChatIds.push(ref.id);
        // listDocuments includes chat refs with missing parent documents but
        // existing messages subcollections — collection().get() does not.
        const messageRefs = await ref.collection('messages').listDocuments();
        if (!parent.exists && messageRefs.length) orphanParents++;
        if (messages.length + messageRefs.length > maxMessages) {
            throw new RangeError('CHAT_INSPECTION_MESSAGE_LIMIT');
        }
        for (const messageRef of messageRefs) {
            const snapshot = await messageRef.get();
            if (!snapshot.exists) continue;
            const data = snapshot.data();
            messages.push({ chatId: ref.id, messageId: messageRef.id,
                senderId: data.senderId, reactions: data.reactions, deleted: data.deleted });
        }
    }

    const result = planLegacyChatMigration({ users, messages, destinationChatIds });
    return {
        ...result,
        source: 'isolated-emulator-read-only',
        orphanParentCount: orphanParents,
        snapshotConsistentAtSingleInstant: false
    };
}
