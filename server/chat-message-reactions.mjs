const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;

// Stable identifiers are stored; the UI maps them to their emoji glyphs.
export const CHAT_REACTION_TYPES = Object.freeze(['like', 'love', 'laugh', 'wow', 'sad', 'fire']);

function validReactions(value, participants) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    return Object.entries(value).every(([type, uids]) =>
        CHAT_REACTION_TYPES.includes(type) && Array.isArray(uids) &&
        uids.length <= 2 && new Set(uids).size === uids.length &&
        uids.every(uid => participants.includes(uid))
    );
}

export async function toggleDirectMessageReaction(db, {
    actorUid, chatId, messageId, reactionType
}) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    }
    if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
        typeof chatId !== 'string' || !CHAT_ID.test(chatId) ||
        typeof messageId !== 'string' || !MESSAGE_ID.test(messageId) ||
        !CHAT_REACTION_TYPES.includes(reactionType)) {
        throw new Error('INVALID_CHAT_REACTION');
    }
    const chatRef = db.collection('chats').doc(chatId);
    const messageRef = chatRef.collection('messages').doc(messageId);
    return db.runTransaction(async tx => {
        const [chatSnap, messageSnap] = await Promise.all([tx.get(chatRef), tx.get(messageRef)]);
        if (!chatSnap.exists) throw new Error('CHAT_NOT_FOUND');
        if (!messageSnap.exists) throw new Error('MESSAGE_NOT_FOUND');
        const chat = chatSnap.data();
        const message = messageSnap.data();
        if (!Array.isArray(chat.participants) || chat.participants.length !== 2 ||
            new Set(chat.participants).size !== 2 || !chat.participants.every(uid => UID.test(uid)) ||
            !chat.participants.includes(actorUid)) {
            throw new Error('CHAT_MEMBERSHIP_REQUIRED');
        }
        if (!chat.participants.includes(message.senderId) ||
            !chat.participants.includes(message.recipientId) ||
            message.senderId === message.recipientId ||
            typeof message.deleted !== 'boolean') {
            throw new Error('CHAT_MESSAGE_STATE_CONFLICT');
        }
        if (message.deleted) throw new Error('MESSAGE_ALREADY_DELETED');
        const current = message.reactions ?? {};
        if (!validReactions(current, chat.participants)) throw new Error('CHAT_REACTION_STATE_CONFLICT');
        const users = [...(current[reactionType] ?? [])];
        const existingIndex = users.indexOf(actorUid);
        const active = existingIndex === -1;
        if (active) users.push(actorUid);
        else users.splice(existingIndex, 1);
        const reactions = { ...current };
        if (users.length) reactions[reactionType] = users;
        else delete reactions[reactionType];
        tx.update(messageRef, { reactions, reactionsUpdatedAt: new Date() });
        return {
            status: active ? 'added' : 'removed',
            chatId, messageId, reactionType, active
        };
    });
}
