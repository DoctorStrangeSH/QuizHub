const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;

export async function markDirectMessagesRead(db, {
    actorUid, chatId, upToMessageId
}) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    }
    if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
        typeof chatId !== 'string' || !CHAT_ID.test(chatId) ||
        typeof upToMessageId !== 'string' || !MESSAGE_ID.test(upToMessageId)) {
        throw new Error('INVALID_CHAT_READ_RECEIPT');
    }
    const chatRef = db.collection('chats').doc(chatId);
    const messageRef = chatRef.collection('messages').doc(upToMessageId);
    return db.runTransaction(async tx => {
        const [chatSnap, messageSnap] = await Promise.all([tx.get(chatRef), tx.get(messageRef)]);
        if (!chatSnap.exists) throw new Error('CHAT_NOT_FOUND');
        if (!messageSnap.exists) throw new Error('MESSAGE_NOT_FOUND');
        const chat = chatSnap.data();
        const message = messageSnap.data();
        if (!Array.isArray(chat.participants) || chat.participants.length !== 2 ||
            new Set(chat.participants).size !== 2 || !chat.participants.includes(actorUid)) {
            throw new Error('CHAT_MEMBERSHIP_REQUIRED');
        }
        if (!chat.participants.includes(message.senderId) ||
            !chat.participants.includes(message.recipientId) ||
            message.senderId === message.recipientId ||
            message.recipientId !== actorUid ||
            message.deleted !== false ||
            !message.createdAt || typeof message.createdAt.toMillis !== 'function') {
            throw new Error('INVALID_CHAT_READ_TARGET');
        }
        const receipts = chat.readReceipts && typeof chat.readReceipts === 'object' &&
            !Array.isArray(chat.readReceipts) ? chat.readReceipts : {};
        const previous = receipts[actorUid];
        if (previous && previous.lastReadAt &&
            typeof previous.lastReadAt.toMillis === 'function' &&
            previous.lastReadAt.toMillis() > message.createdAt.toMillis()) {
            return { status: 'unchanged', chatId, lastReadMessageId: previous.lastReadMessageId ?? null };
        }
        if (previous?.lastReadMessageId === upToMessageId) {
            return { status: 'unchanged', chatId, lastReadMessageId: upToMessageId };
        }
        const now = new Date();
        tx.update(chatRef, {
            readReceipts: {
                ...receipts,
                [actorUid]: {
                    lastReadMessageId: upToMessageId,
                    lastReadAt: message.createdAt,
                    updatedAt: now
                }
            }
        });
        return { status: 'updated', chatId, lastReadMessageId: upToMessageId };
    });
}
