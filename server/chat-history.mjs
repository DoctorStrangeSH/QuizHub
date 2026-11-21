const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const REACTION_TYPES = ['like', 'love', 'laugh', 'wow', 'sad', 'fire'];
const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 50;

function validParticipants(value) {
    return Array.isArray(value) && value.length === 2 &&
        value.every(uid => typeof uid === 'string' && UID.test(uid)) &&
        value[0] !== value[1];
}

function projectReactions(value, participants, actorUid, deleted) {
    if (deleted) return {};
    if (value === undefined) return {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('CHAT_MESSAGE_STATE_CONFLICT');
    }
    const projected = {};
    for (const [type, users] of Object.entries(value)) {
        if (!REACTION_TYPES.includes(type) || !Array.isArray(users) ||
            users.length > 2 || new Set(users).size !== users.length ||
            !users.every(uid => participants.includes(uid))) {
            throw new Error('CHAT_MESSAGE_STATE_CONFLICT');
        }
        if (users.length) projected[type] = {
            count: users.length,
            reactedByMe: users.includes(actorUid)
        };
    }
    return projected;
}

function serializeMessage(snapshot, participants, actorUid, peerReadCursor = null) {
    const value = snapshot.data();
    if (!value || !participants.includes(value.senderId) ||
        !participants.includes(value.recipientId) || value.senderId === value.recipientId ||
        typeof value.deleted !== 'boolean' || (value.deleted ? (value.text !== null && typeof value.text !== 'string') : typeof value.text !== 'string') ||
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
        deleted: value.deleted,
        reactions: projectReactions(value.reactions, participants, actorUid, value.deleted),
        ...(value.replyTo !== undefined ? {
            replyTo: (() => {
                const reply = value.replyTo;
                if (!reply || typeof reply !== 'object' || Array.isArray(reply) ||
                    typeof reply.id !== 'string' || !MESSAGE_ID.test(reply.id) ||
                    !participants.includes(reply.senderId) ||
                    typeof reply.text !== 'string' || reply.text.length > 160) {
                    throw new Error('CHAT_MESSAGE_STATE_CONFLICT');
                }
                return { id: reply.id, senderId: reply.senderId, text: reply.text };
            })()
        } : {}),
        ...(value.senderId === actorUid ? {
            readByRecipient: Boolean(peerReadCursor && value.createdAt &&
                typeof value.createdAt.toMillis === 'function' &&
                (value.createdAt.toMillis() < peerReadCursor.createdAt.toMillis() ||
                    (value.createdAt.toMillis() === peerReadCursor.createdAt.toMillis() &&
                        snapshot.id <= peerReadCursor.id)))
        } : {})
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
    const peerUid = chat.participants.find(uid => uid !== actorUid);
    const peerReceipt = chat.readReceipts?.[peerUid];
    let peerReadCursor = null;
    if (peerReceipt?.lastReadMessageId) {
        const receiptId = peerReceipt.lastReadMessageId;
        if (typeof receiptId !== 'string' || !MESSAGE_ID.test(receiptId)) {
            throw new Error('CHAT_MESSAGE_STATE_CONFLICT');
        }
        const receiptSnap = await messagesRef.doc(receiptId).get();
        if (!receiptSnap.exists) throw new Error('CHAT_MESSAGE_STATE_CONFLICT');
        const receiptMessage = receiptSnap.data();
        if (receiptMessage.senderId !== actorUid || receiptMessage.recipientId !== peerUid ||
            !receiptMessage.createdAt || typeof receiptMessage.createdAt.toMillis !== 'function') {
            throw new Error('CHAT_MESSAGE_STATE_CONFLICT');
        }
        peerReadCursor = { id: receiptSnap.id, createdAt: receiptMessage.createdAt };
    }
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
    const messages = visible.map(snapshot => serializeMessage(snapshot, chat.participants, actorUid, peerReadCursor));
    return {
        chatId,
        peerUid: chat.participants.find(uid => uid !== actorUid),
        messages,
        nextCursor: hasMore && visible.length ? visible[visible.length - 1].id : null
    };
}
