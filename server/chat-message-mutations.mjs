const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;
const MAX_TEXT_LENGTH = 2000;

function normalizeText(value) {
    if (typeof value !== 'string') throw new Error('INVALID_MESSAGE_TEXT');
    const text = value.trim();
    if (!text || text.length > MAX_TEXT_LENGTH ||
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
        throw new Error('INVALID_MESSAGE_TEXT');
    }
    return text;
}

export async function mutateDirectMessage(db, {
    actorUid, chatId, messageId, operation, text
}) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    }
    if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
        typeof chatId !== 'string' || !CHAT_ID.test(chatId) ||
        typeof messageId !== 'string' || !MESSAGE_ID.test(messageId) ||
        !['edit', 'delete'].includes(operation)) {
        throw new Error('INVALID_CHAT_MESSAGE_MUTATION');
    }
    const safeText = operation === 'edit' ? normalizeText(text) : null;
    const chatRef = db.collection('chats').doc(chatId);
    const messageRef = chatRef.collection('messages').doc(messageId);

    return db.runTransaction(async tx => {
        const [chatSnap, messageSnap] = await Promise.all([tx.get(chatRef), tx.get(messageRef)]);
        if (!chatSnap.exists) throw new Error('CHAT_NOT_FOUND');
        if (!messageSnap.exists) throw new Error('MESSAGE_NOT_FOUND');
        const chat = chatSnap.data();
        const message = messageSnap.data();
        if (!Array.isArray(chat.participants) || chat.participants.length !== 2 ||
            !chat.participants.includes(actorUid)) {
            throw new Error('CHAT_MEMBERSHIP_REQUIRED');
        }
        if (message.senderId !== actorUid) throw new Error('MESSAGE_AUTHOR_REQUIRED');
        if (message.recipientId === actorUid || !chat.participants.includes(message.recipientId) ||
            typeof message.deleted !== 'boolean' || typeof message.edited !== 'boolean') {
            throw new Error('CHAT_MESSAGE_STATE_CONFLICT');
        }
        if (operation === 'edit') {
            if (message.deleted) throw new Error('MESSAGE_ALREADY_DELETED');
            if (message.text === safeText) return { status: 'unchanged', chatId, messageId };
            const now = new Date();
            tx.update(messageRef, { text: safeText, edited: true, editedAt: now });
            if (chat.lastMessageId === messageId) {
                tx.update(chatRef, {
                    updatedAt: now,
                    lastMessagePreview: safeText.slice(0, 120)
                });
            }
            return { status: 'updated', chatId, messageId };
        }

        if (message.deleted) return { status: 'unchanged', chatId, messageId };
        const now = new Date();
        tx.update(messageRef, { text: null, deleted: true, deletedAt: now });
        if (chat.lastMessageId === messageId) {
            tx.update(chatRef, {
                updatedAt: now,
                lastMessagePreview: 'Сообщение удалено'
            });
        }
        return { status: 'deleted', chatId, messageId };
    });
}
