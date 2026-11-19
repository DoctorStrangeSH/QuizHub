import { directChatId } from './chat-send.mjs';

// Read-only planning over a trusted, already captured snapshot. Never copy
// private message bodies into logs or return them from this report.
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const DOC_ID = /^[^/\u0000-\u001F]{1,1500}$/;
const REACTIONS = new Set(['👍', '❤️', '😂', '😮', '😢']);

export function planLegacyChatMigration({ users, messages, destinationChatIds = [] }) {
    if (!Array.isArray(users) || !Array.isArray(messages) || !Array.isArray(destinationChatIds)) {
        throw new TypeError('INVALID_MIGRATION_SNAPSHOT');
    }
    const blockers = [];
    const accounts = new Map();
    const candidates = new Map();
    const destinations = new Set(destinationChatIds);

    for (const entry of users) {
        const { uid, friends } = entry ?? {};
        if (typeof uid !== 'string' || !UID.test(uid) || accounts.has(uid) ||
            !Array.isArray(friends) || friends.some(friend => typeof friend !== 'string' || !UID.test(friend))) {
            throw new TypeError('INVALID_MIGRATION_ACCOUNT');
        }
        accounts.set(uid, new Set(friends));
    }

    for (const [uid, friends] of accounts) {
        for (const friend of friends) {
            if (!accounts.get(friend)?.has(uid) || friend === uid) continue;
            const pair = [uid, friend].sort();
            const legacyId = pair.join('_');
            const nextId = directChatId(...pair);
            const current = candidates.get(legacyId);
            if (current && current.nextId !== nextId) {
                blockers.push({ code: 'AMBIGUOUS_LEGACY_CHAT_ID', chatId: legacyId });
            } else {
                candidates.set(legacyId, { legacyId, nextId, memberUids: pair, messageIds: [] });
            }
        }
    }

    const seen = new Set();
    for (const entry of messages) {
        const { chatId, messageId, senderId, reactions, deleted } = entry ?? {};
        if (typeof chatId !== 'string' || !DOC_ID.test(chatId) ||
            typeof messageId !== 'string' || !DOC_ID.test(messageId)) {
            blockers.push({ code: 'INVALID_MESSAGE_PATH' });
            continue;
        }
        const path = `${chatId}/${messageId}`;
        if (seen.has(path)) {
            blockers.push({ code: 'DUPLICATE_MESSAGE_PATH', chatId, messageId });
            continue;
        }
        seen.add(path);
        const candidate = candidates.get(chatId);
        if (!candidate) {
            blockers.push({ code: 'UNRESOLVED_LEGACY_CHAT', chatId, messageId });
            continue;
        }
        if (!candidate.memberUids.includes(senderId)) {
            blockers.push({ code: 'FORGED_OR_UNKNOWN_SENDER', chatId, messageId });
            continue;
        }
        if (reactions != null) {
            if (typeof reactions !== 'object' || Array.isArray(reactions) ||
                Object.keys(reactions).length > 50 ||
                Object.entries(reactions).some(([uid, emoji]) => !UID.test(uid) || !REACTIONS.has(emoji))) {
                blockers.push({ code: 'INVALID_LEGACY_REACTIONS', chatId, messageId });
                continue;
            }
            if (Object.keys(reactions).some(uid => !candidate.memberUids.includes(uid))) {
                blockers.push({ code: 'NONMEMBER_LEGACY_REACTION', chatId, messageId });
                continue;
            }
            if (deleted === true && Object.keys(reactions).length) {
                blockers.push({ code: 'DELETED_MESSAGE_REACTIONS_REMAIN', chatId, messageId });
                continue;
            }
        }
        candidate.messageIds.push(messageId);
    }

    const chats = [...candidates.values()].filter(chat => chat.messageIds.length > 0);
    for (const chat of chats) {
        if (destinations.has(chat.nextId)) {
            blockers.push({ code: 'DESTINATION_ALREADY_EXISTS', chatId: chat.legacyId });
        }
        chat.messageIds.sort();
    }
    const uniqueBlockers = [...new Map(blockers.map((blocker, index) => [
        blocker.code === 'AMBIGUOUS_LEGACY_CHAT_ID' ? blocker.code + blocker.chatId : index,
        blocker
    ])).values()];
    return {
        ready: uniqueBlockers.length === 0,
        totalMessages: messages.length,
        mappedMessages: chats.reduce((count, chat) => count + chat.messageIds.length, 0),
        chats: uniqueBlockers.length ? [] : chats.sort((a, b) => a.legacyId.localeCompare(b.legacyId)),
        blockers: uniqueBlockers
    };
}
