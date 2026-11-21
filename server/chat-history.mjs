const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 50;

function validParticipants(value) {
    return Array.isArray(value) && value.length === 2 &&
        value.every(uid => typeof uid === 'string' && UID.test(uid)) &&
        value[0] !== value[1];
}

function serializeMessage(snapshot, participants) {
    const value = snapshot.data();
    if (!value || !participants.includes(value.senderId) ||
        !participants.includes(value.recipientId) || value.senderId === value.recipientId ||
        typeof value.text !== 'string' || typeof value.deleted !== 'boolean' ||
        typeof value.edited !== 'boolean') {
        throw new Error('CHAT_MESSAGE_STATE_CONFLICT');
    }
    return {
        id: snapshot.id,
        senderId: value.senderId,
        recipientId: value.recipientId,
        text: value.deleted ? null : value.text,
        createdAt: value.createdAt,
        edited: value.edited,
        deleted: value.deleted
    };
}

/**
 * Trusted read path for a single direct conversation.
 * Membership is derived from the server-owned chat document, never client data.
 * An existing conversation remains readable to its two participants even if
 * they later remove each other from the friends list.
 */
export async function readDirectMessages(db, {
    actorUid, chatId, pageSize = DEFAULT_PAGE_SIZE, cursorMessageId = null
}) {
    if (!db || typeof db.collection !== 'function') throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
        typeof chatId !== 'string' || !CHAT_ID.test(chatId)) {
        throw new Error('INVALID_CHAT_READ_REQUEST');
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
        throw new Error('INVALID_CHAT_PAGE_SIZE');
    }
    if (cursorMessageId !== null &&
        (typeof cursorMessageId !== 'string' || !MESSAGE_ID.test(cursorMessageId))) {
        throw new Error('INVALID_CHAT_CURSOR');
    }

    const chatRef = db.collection('chats').doc(chatId);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) throw new Error('CHAT_NOT_FOUND');
    const chat = chatSnap.data();
    if (!validParticipants(chat.participants) || !chat.participants.includes(actorUid)) {
        throw new Error('CHAT_MEMBERSHIP_REQUIRED');
    }

    const messagesRef = chatRef.collection('messages');
    let query = messagesRef.orderBy('createdAt', 'desc');
    if (cursorMessageId) {
        const cursorSnap = await messagesRef.doc(cursorMessageId).get();
        if (!cursorSnap.exists) throw new Error('INVALID_CHAT_CURSOR');
        const cursor = cursorSnap.data();
        if (!chat.participants.includes(cursor.senderId) ||
            !chat.participants.includes(cursor.recipientId)) {
            throw new Error('CHAT_MESSAGE_STATE_CONFLICT');
        }
        query = query.startAfter(cursorSnap);
    }
    const page = await query.limit(pageSize + 1).get();
    const hasMore = page.docs.length > pageSize;
    const visible = page.docs.slice(0, pageSize);
    const messages = visible.map(snapshot => serializeMessage(snapshot, chat.participants));
    return {
        chatId,
        peerUid: chat.participants.find(uid => uid !== actorUid),
        messages,
        nextCursor: hasMore && visible.length ? visible[visible.length - 1].id : null
    };
}
