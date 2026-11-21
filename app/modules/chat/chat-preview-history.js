const REACTIONS = Object.freeze({ like: '👍', love: '❤️', laugh: '😂', wow: '😮', sad: '😢', fire: '🔥' });

export function chatTimestampMillis(value) {
    if (value && typeof value.toMillis === 'function') return value.toMillis();
    if (value && typeof value.toDate === 'function') return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value && typeof value === 'object') {
        const seconds = Number(value.seconds ?? value._seconds);
        const nanos = Number(value.nanoseconds ?? value._nanoseconds ?? 0);
        if (Number.isFinite(seconds) && Number.isFinite(nanos)) return seconds * 1000 + nanos / 1e6;
    }
    return 0;
}

export function chatTimestampDate(value) {
    const millis = chatTimestampMillis(value);
    return millis > 0 ? new Date(millis) : new Date();
}

export function compareChatMessages(a, b) {
    const delta = chatTimestampMillis(a?.createdAt) - chatTimestampMillis(b?.createdAt);
    return delta || String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
}

export function normalizeChatHistoryPage(response, expectedChatId) {
    if (!response || response.chatId !== expectedChatId || !Array.isArray(response.messages) ||
        (response.nextCursor !== null && typeof response.nextCursor !== 'string')) {
        throw new Error('INVALID_CHAT_HISTORY_RESPONSE');
    }
    const seen = new Set();
    const messages = response.messages.map(message => {
        if (!message || typeof message.id !== 'string' || seen.has(message.id) ||
            typeof message.senderId !== 'string' || typeof message.recipientId !== 'string' ||
            typeof message.deleted !== 'boolean' || typeof message.edited !== 'boolean' ||
            (!message.deleted && typeof message.text !== 'string') ||
            (message.readByRecipient !== undefined && typeof message.readByRecipient !== 'boolean') ||
            (message.replyTo !== undefined && (!message.replyTo || typeof message.replyTo !== 'object' ||
                typeof message.replyTo.id !== 'string' || typeof message.replyTo.senderId !== 'string' ||
                typeof message.replyTo.text !== 'string' || message.replyTo.text.length > 160))) {
            throw new Error('INVALID_CHAT_HISTORY_MESSAGE');
        }
        seen.add(message.id);
        return { ...message, text: message.deleted ? null : message.text };
    });
    return { messages: messages.sort(compareChatMessages), nextCursor: response.nextCursor };
}

export function mergeChatHistoryMessages(existing, incoming) {
    const byId = new Map();
    for (const message of [...existing, ...incoming]) byId.set(message.id, message);
    return [...byId.values()].sort(compareChatMessages);
}

export function latestIncomingMessageId(messages, actorUid) {
    return [...messages].filter(message => message.recipientId === actorUid && message.senderId !== actorUid)
        .sort(compareChatMessages).at(-1)?.id ?? null;
}

export function formatProjectedReactions(reactions) {
    if (!reactions || typeof reactions !== 'object' || Array.isArray(reactions)) return '';
    return Object.entries(reactions).filter(([type, value]) => REACTIONS[type] &&
        Number.isSafeInteger(value?.count) && value.count > 0)
        .map(([type, value]) => `${REACTIONS[type]}${value.count > 1 ? ` ${value.count}` : ''}`)
        .join(' ');
}

export function createChatMessageId(cryptoApi = globalThis.crypto) {
    if (typeof cryptoApi?.randomUUID !== 'function') throw new Error('SECURE_RANDOM_REQUIRED');
    return `msg_${cryptoApi.randomUUID().replaceAll('-', '')}`;
}