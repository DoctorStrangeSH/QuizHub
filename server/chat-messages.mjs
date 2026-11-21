import { createHash } from 'node:crypto';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;
const MAX_TEXT_LENGTH = 2000;

function normalizeText(value) {
    if (typeof value !== 'string') throw new Error('INVALID_MESSAGE_TEXT');
    const text = value.trim();
    if (!text || text.length > MAX_TEXT_LENGTH || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
        throw new Error('INVALID_MESSAGE_TEXT');
    }
    return text;
}

export function directChatId(firstUid, secondUid) {
    if (typeof firstUid !== 'string' || !UID.test(firstUid) ||
        typeof secondUid !== 'string' || !UID.test(secondUid) || firstUid === secondUid) {
        throw new Error('INVALID_CHAT_PARTICIPANTS');
    }
    const pair = [firstUid, secondUid].sort();
    return 'dm_' + createHash('sha256').update(pair.join('\0')).digest('hex').slice(0, 48);
}

export async function sendDirectMessage(db, {
    actorUid, targetUid, messageId, text, replyToMessageId = null
}) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    }
    if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
        typeof targetUid !== 'string' || !UID.test(targetUid) || actorUid === targetUid) {
        throw new Error('INVALID_CHAT_PARTICIPANTS');
    }
    if (typeof messageId !== 'string' || !MESSAGE_ID.test(messageId)) {
        throw new Error('INVALID_MESSAGE_ID');
    }
    const safeText = normalizeText(text);
    if (replyToMessageId !== null &&
        (typeof replyToMessageId !== 'string' || !MESSAGE_ID.test(replyToMessageId) || replyToMessageId === messageId)) {
        throw new Error('INVALID_REPLY_TARGET');
    }
    const participants = [actorUid, targetUid].sort();
    const chatId = directChatId(actorUid, targetUid);
    const chatRef = db.collection('chats').doc(chatId);
    const actorRef = db.collection('users').doc(actorUid);
    const targetRef = db.collection('users').doc(targetUid);
    const messageRef = chatRef.collection('messages').doc(messageId);

    return db.runTransaction(async tx => {
        const [actorSnap, targetSnap, chatSnap, messageSnap] = await Promise.all([
            tx.get(actorRef), tx.get(targetRef), tx.get(chatRef), tx.get(messageRef)
        ]);
        const replySnap = replyToMessageId
            ? await tx.get(chatRef.collection('messages').doc(replyToMessageId))
            : null;
        if (!actorSnap.exists || !targetSnap.exists) throw new Error('PROFILE_NOT_FOUND');
        const actor = actorSnap.data();
        const target = targetSnap.data();
        if (!Array.isArray(actor.friends) || !actor.friends.includes(targetUid) ||
            !Array.isArray(target.friends) || !target.friends.includes(actorUid)) {
            throw new Error('CHAT_MEMBERSHIP_REQUIRED');
        }
        if (chatSnap.exists) {
            const stored = chatSnap.data();
            if (!Array.isArray(stored.participants) ||
                stored.participants.length !== 2 ||
                [...stored.participants].sort().some((uid, index) => uid !== participants[index])) {
                throw new Error('CHAT_STATE_CONFLICT');
            }
        }
        if (messageSnap.exists) {
            const previous = messageSnap.data();
            if (previous.senderId === actorUid && previous.recipientId === targetUid &&
                previous.text === safeText && (previous.replyTo?.id ?? null) === replyToMessageId) {
                return { status: 'unchanged', chatId, messageId };
            }
            throw new Error('MESSAGE_ID_CONFLICT');
        }
        let replyTo = null;
        if (replyToMessageId) {
            if (!replySnap?.exists) throw new Error('REPLY_TARGET_NOT_FOUND');
            const targetMessage = replySnap.data();
            if (![actorUid, targetUid].includes(targetMessage.senderId) ||
                ![actorUid, targetUid].includes(targetMessage.recipientId) ||
                targetMessage.senderId === targetMessage.recipientId ||
                targetMessage.deleted !== false || typeof targetMessage.text !== 'string') {
                throw new Error('INVALID_REPLY_TARGET');
            }
            replyTo = {
                id: replySnap.id,
                senderId: targetMessage.senderId,
                text: targetMessage.text.slice(0, 160)
            };
        }
        const now = new Date();
        if (!chatSnap.exists) {
            tx.create(chatRef, {
                participants,
                createdAt: now,
                updatedAt: now,
                lastMessageId: messageId,
                lastMessageAt: now,
                lastMessagePreview: safeText.slice(0, 120)
            });
        } else {
            tx.update(chatRef, {
                updatedAt: now,
                lastMessageId: messageId,
                lastMessageAt: now,
                lastMessagePreview: safeText.slice(0, 120)
            });
        }
        tx.create(messageRef, {
            senderId: actorUid,
            recipientId: targetUid,
            text: safeText,
            createdAt: now,
            edited: false,
            deleted: false,
            reactions: {},
            ...(replyTo ? { replyTo } : {})
        });
        return { status: 'created', chatId, messageId };
    });
}
