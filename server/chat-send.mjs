// Trusted-server direct-message preview. Do not expose until the browser,
// existing chat IDs, membership backfill and production rules are migrated.
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{8,64}$/;

export function directChatId(a, b) {
    if (typeof a !== 'string' || !UID.test(a) || typeof b !== 'string' || !UID.test(b) || a === b) {
        throw new Error('INVALID_CHAT_PARTICIPANTS');
    }
    // Length prefixes avoid the collisions possible in legacy `uids.join('_')`.
    const [first, second] = [a, b].sort();
    return `dm_${first.length}_${first}_${second.length}_${second}`;
}

export function validateMessage({ senderUid, recipientUid, text, clientMessageId }) {
    const chatId = directChatId(senderUid, recipientUid);
    if (typeof text !== 'string' || !text.trim() || text.trim().length > 2000 ||
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text) ||
        typeof clientMessageId !== 'string' || !MESSAGE_ID.test(clientMessageId)) {
        throw new Error('INVALID_CHAT_MESSAGE');
    }
    return { chatId, text: text.trim(), messageId: `${senderUid.length}_${senderUid}_${clientMessageId}` };
}

export async function sendDirectMessage(db, args) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    }
    const { senderUid, recipientUid } = args ?? {};
    const { chatId, text, messageId } = validateMessage(args ?? {});
    const sender = db.collection('users').doc(senderUid);
    const recipient = db.collection('users').doc(recipientUid);
    const chat = db.collection('chats').doc(chatId);
    const message = chat.collection('messages').doc(messageId);

    return db.runTransaction(async tx => {
        // Firestore transactions must perform every read before the first write.
        const [senderSnap, recipientSnap, chatSnap, messageSnap] = await Promise.all([
            tx.get(sender), tx.get(recipient), tx.get(chat), tx.get(message)
        ]);
        if (!senderSnap.exists || !recipientSnap.exists) throw new Error('CHAT_PROFILE_NOT_FOUND');
        const a = senderSnap.data().friends;
        const b = recipientSnap.data().friends;
        if (!Array.isArray(a) || !Array.isArray(b) ||
            !a.includes(recipientUid) || !b.includes(senderUid)) {
            throw new Error('CHAT_FRIENDSHIP_REQUIRED');
        }
        const members = [senderUid, recipientUid].sort();
        if (chatSnap.exists && (
            !Array.isArray(chatSnap.data().memberUids) ||
            chatSnap.data().memberUids.length !== 2 ||
            chatSnap.data().memberUids.some((uid, index) => uid !== members[index])
        )) throw new Error('CHAT_MEMBERSHIP_CONFLICT');

        if (messageSnap.exists) {
            const existing = messageSnap.data();
            if (existing.senderId !== senderUid || existing.text !== text) {
                throw new Error('MESSAGE_ID_CONFLICT');
            }
            return { status: 'unchanged', chatId, messageId };
        }

        if (!chatSnap.exists) tx.create(chat, { memberUids: members, createdAt: new Date() });
        tx.create(message, {
            senderId: senderUid, text, createdAt: new Date(),
            edited: false, replyTo: null, reactions: {}
        });
        return { status: 'sent', chatId, messageId };
    });
}
