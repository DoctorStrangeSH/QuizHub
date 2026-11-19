import { directChatId } from './chat-send.mjs';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^[A-Za-z0-9_-]{1,270}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{1,200}$/;

function toMillis(value) {
    if (value && typeof value.toMillis === 'function') return value.toMillis();
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return NaN;
}

// Persist a per-member read cursor. This deliberately does not calculate
// unread counts yet; message creation must update those atomically first.
export async function markDirectChatRead(db, { actorUid, chatId, lastReadMessageId }) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    }
    if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
        typeof chatId !== 'string' || !CHAT_ID.test(chatId) ||
        typeof lastReadMessageId !== 'string' || !MESSAGE_ID.test(lastReadMessageId)) {
        throw new Error('INVALID_CHAT_READ_STATE');
    }

    const chatRef = db.collection('chats').doc(chatId);
    const messageRef = chatRef.collection('messages').doc(lastReadMessageId);
    const memberRef = chatRef.collection('members').doc(actorUid);

    return db.runTransaction(async tx => {
        const [chatSnap, messageSnap, memberSnap] = await Promise.all([
            tx.get(chatRef), tx.get(messageRef), tx.get(memberRef)
        ]);
        if (!chatSnap.exists || !messageSnap.exists) throw new Error('CHAT_READ_TARGET_NOT_FOUND');

        const members = chatSnap.data().memberUids;
        if (!Array.isArray(members) || members.length !== 2 ||
            !members.every(uid => typeof uid === 'string' && UID.test(uid)) ||
            members[0] === members[1] || !members.includes(actorUid) ||
            directChatId(...members) !== chatId) {
            throw new Error('CHAT_MEMBER_REQUIRED');
        }

        const message = messageSnap.data();
        if (!members.includes(message.senderId)) throw new Error('CHAT_READ_TARGET_INVALID');
        const messageTime = toMillis(message.createdAt);
        if (!Number.isFinite(messageTime)) throw new Error('CHAT_READ_TARGET_INVALID');

        const previous = memberSnap.exists ? memberSnap.data() : {};
        const previousTime = toMillis(previous.lastReadAt);
        if (Number.isFinite(previousTime) && messageTime <= previousTime) {
            return {
                status: previous.lastReadMessageId === lastReadMessageId ? 'unchanged' : 'stale',
                chatId, lastReadMessageId: previous.lastReadMessageId
            };
        }

        tx.set(memberRef, {
            uid: actorUid,
            lastReadMessageId,
            lastReadAt: new Date(messageTime),
            updatedAt: new Date()
        }, { merge: true });
        return { status: 'updated', chatId, lastReadMessageId };
    });
}
