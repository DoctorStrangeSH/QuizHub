import { toggleDirectMessageReaction } from './chat-message-reactions.mjs';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;
const TYPES = new Set(['like', 'love', 'laugh', 'wow', 'sad', 'fire']);
const KEYS = new Set(['chatId', 'messageId', 'reactionType']);
const ERRORS = new Map([
    ['INVALID_CHAT_REACTION', 'invalid-argument'],
    ['CHAT_NOT_FOUND', 'not-found'],
    ['MESSAGE_NOT_FOUND', 'not-found'],
    ['CHAT_MEMBERSHIP_REQUIRED', 'permission-denied'],
    ['MESSAGE_ALREADY_DELETED', 'failed-precondition'],
    ['CHAT_MESSAGE_STATE_CONFLICT', 'failed-precondition'],
    ['CHAT_REACTION_STATE_CONFLICT', 'failed-precondition']
]);

export function createChatReactionCallableAdapter({ toggle, HttpsError }) {
    if (typeof toggle !== 'function' || typeof HttpsError !== 'function') {
        throw new TypeError('TRUSTED_CHAT_DEPENDENCIES_REQUIRED');
    }
    return async request => {
        const actorUid = request?.auth?.uid;
        if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
            request?.auth?.token?.firebase?.sign_in_provider === 'anonymous') {
            throw new HttpsError('unauthenticated', 'SIGNED_IN_ACCOUNT_REQUIRED');
        }
        const data = request?.data;
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            Object.keys(data).some(key => !KEYS.has(key)) ||
            typeof data.chatId !== 'string' || !CHAT_ID.test(data.chatId) ||
            typeof data.messageId !== 'string' || !MESSAGE_ID.test(data.messageId) ||
            typeof data.reactionType !== 'string' || !TYPES.has(data.reactionType)) {
            throw new HttpsError('invalid-argument', 'INVALID_CHAT_REACTION');
        }
        try {
            return await toggle({ actorUid, chatId: data.chatId, messageId: data.messageId, reactionType: data.reactionType });
        } catch (error) {
            const code = ERRORS.get(error?.message);
            if (code) throw new HttpsError(code, error.message);
            throw new HttpsError('internal', 'CHAT_REACTION_FAILED');
        }
    };
}

export function createFirestoreChatReactionCallable({ db, HttpsError }) {
    return createChatReactionCallableAdapter({
        toggle: args => toggleDirectMessageReaction(db, args),
        HttpsError
    });
}
