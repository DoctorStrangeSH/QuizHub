const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;

export async function getDirectChatUnreadCount(db, { actorUid, chatId }) {
    if (!db || typeof db.collection !== 'function') throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
        typeof chatId !== 'string' || !CHAT_ID.test(chatId)) {
        throw new Error('INVALID_CHAT_UNREAD_REQUEST');
    }
    const chatRef = db.collection('chats').doc(chatId);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) throw new Error('CHAT_NOT_FOUND');
    const chat = chatSnap.data();
    if (!Array.isArray(chat.participants) || chat.participants.length !== 2 ||
        new Set(chat.participants).size !== 2 || !chat.participants.includes(actorUid)) {
        throw new Error('CHAT_MEMBERSHIP_REQUIRED');
    }
    const receipt = chat.readReceipts?.[actorUid];
    let query = chatRef.collection('messages')
        .where('recipientId', '==', actorUid)
        .where('deleted', '==', false)
        .orderBy('createdAt', 'asc');
    if (receipt?.lastReadMessageId !== undefined && receipt.lastReadMessageId !== null) {
        if (typeof receipt.lastReadMessageId !== 'string' || !MESSAGE_ID.test(receipt.lastReadMessageId)) {
            throw new Error('CHAT_READ_RECEIPT_STATE_CONFLICT');
        }
        const cursorSnap = await chatRef.collection('messages').doc(receipt.lastReadMessageId).get();
        if (!cursorSnap.exists) throw new Error('CHAT_READ_RECEIPT_STATE_CONFLICT');
        const cursor = cursorSnap.data();
        if (cursor.recipientId !== actorUid || !chat.participants.includes(cursor.senderId) ||
            !cursor.createdAt || typeof cursor.createdAt.toMillis !== 'function') {
            throw new Error('CHAT_READ_RECEIPT_STATE_CONFLICT');
        }
        query = query.startAfter(cursorSnap);
    }
    if (typeof query.count !== 'function') throw new TypeError('FIRESTORE_COUNT_AGGREGATION_REQUIRED');
    const snapshot = await query.count().get();
    const count = snapshot.data()?.count;
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('CHAT_UNREAD_COUNT_STATE_CONFLICT');
    return { chatId, unreadCount: count };
}
