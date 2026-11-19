import { directChatId } from './chat-send.mjs';

// Trusted-server preview. The browser must not write message documents directly
// once the restrictive production rules and complete migration are ready.
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^[A-Za-z0-9_-]{1,270}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{1,200}$/;
const REACTIONS = new Set(['👍', '❤️', '😂', '😮', '😢']);

export async function modifyDirectMessage(db, { actorUid, chatId, messageId, action, text, reaction }) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    }
    if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
        typeof chatId !== 'string' || !CHAT_ID.test(chatId) ||
        typeof messageId !== 'string' || !MESSAGE_ID.test(messageId) ||
        !['edit', 'delete', 'react'].includes(action) ||
        (action === 'edit' && (typeof text !== 'string' || !text.trim() || text.trim().length > 2000 ||
            /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text))) ||
        (action === 'react' && !REACTIONS.has(reaction))) {
        throw new Error('INVALID_MESSAGE_ACTION');
    }
    const chatRef = db.collection('chats').doc(chatId);
    const messageRef = chatRef.collection('messages').doc(messageId);
    return db.runTransaction(async tx => {
        const [chatSnap, messageSnap] = await Promise.all([tx.get(chatRef), tx.get(messageRef)]);
        if (!chatSnap.exists || !messageSnap.exists) throw new Error('CHAT_MESSAGE_NOT_FOUND');
        const members = chatSnap.data().memberUids;
        if (!Array.isArray(members) || members.length !== 2 ||
            !members.every(id => typeof id === 'string' && UID.test(id)) ||
            members[0] === members[1] || !members.includes(actorUid) ||
            directChatId(...members) !== chatId) throw new Error('CHAT_MEMBER_REQUIRED');
        const message = messageSnap.data();
        if (!members.includes(message.senderId)) throw new Error('CHAT_MESSAGE_INVALID_SENDER');
        if (message.deleted) {
            if (action === 'delete' && message.senderId === actorUid) return { status: 'unchanged' };
            throw new Error('CHAT_MESSAGE_DELETED');
        }
        if (action === 'edit' || action === 'delete') {
            if (message.senderId !== actorUid) throw new Error('CHAT_MESSAGE_NOT_OWNER');
            if (action === 'edit') {
                if (message.text === text.trim() && message.edited === true) return { status: 'unchanged' };
                tx.update(messageRef, { text: text.trim(), edited: true });
            } else {
                // Erase visible reaction state as well as message content.
                // This matches the legacy browser flow until transport cutover.
                tx.update(messageRef, { text: '🗑️ Сообщение удалено', deleted: true, reactions: {} });
            }
        } else {
            const reactions = message.reactions ?? {};
            if (!reactions || typeof reactions !== 'object' || Array.isArray(reactions) ||
                Object.keys(reactions).length > 50 ||
                Object.entries(reactions).some(([uid, emoji]) => !UID.test(uid) || !REACTIONS.has(emoji))) {
                throw new Error('CHAT_REACTIONS_MIGRATION_REQUIRED');
            }
            const next = { ...reactions };
            if (next[actorUid] === reaction) delete next[actorUid];
            else next[actorUid] = reaction;
            if (Object.keys(next).length > 50) throw new Error('CHAT_REACTION_LIMIT');
            tx.update(messageRef, { reactions: next });
        }
        return { status: 'updated' };
    });
}
