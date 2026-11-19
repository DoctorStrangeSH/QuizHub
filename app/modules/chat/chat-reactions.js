export const CHAT_REACTIONS = Object.freeze(['👍', '❤️', '😂', '😮', '😢']);

// Keep reactions from other participants intact during a Firestore transaction.
export function toggleChatReaction(existing, userUid, reaction) {
    if (typeof userUid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(userUid)) {
        throw new TypeError('INVALID_REACTION_USER');
    }
    if (!CHAT_REACTIONS.includes(reaction)) throw new TypeError('INVALID_REACTION');
    if (existing != null && (typeof existing !== 'object' || Array.isArray(existing))) {
        throw new TypeError('INVALID_REACTIONS_DATA');
    }
    const next = { ...(existing ?? {}) };
    if (next[userUid] === reaction) delete next[userUid];
    else next[userUid] = reaction;
    return next;
}
