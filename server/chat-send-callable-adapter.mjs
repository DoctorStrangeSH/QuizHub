import { sendDirectMessage } from './chat-messages.mjs';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;
const KEYS = new Set(['targetUid', 'messageId', 'text', 'replyToMessageId']);
const ERRORS = new Map([
    ['INVALID_CHAT_PARTICIPANTS', 'invalid-argument'],
    ['INVALID_MESSAGE_ID', 'invalid-argument'],
    ['INVALID_MESSAGE_TEXT', 'invalid-argument'],
    ['INVALID_REPLY_TARGET', 'invalid-argument'],
    ['REPLY_TARGET_NOT_FOUND', 'not-found'],
    ['PROFILE_NOT_FOUND', 'not-found'],
    ['CHAT_MEMBERSHIP_REQUIRED', 'permission-denied'],
    ['CHAT_STATE_CONFLICT', 'failed-precondition'],
    ['MESSAGE_ID_CONFLICT', 'already-exists']
]);

export function createChatSendCallableAdapter({ send, HttpsError }) {
    if (typeof send !== 'function' || typeof HttpsError !== 'function') {
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
            !['targetUid', 'messageId', 'text'].every(key => Object.hasOwn(data, key)) ||
            typeof data.targetUid !== 'string' || !UID.test(data.targetUid) ||
            data.targetUid === actorUid ||
            typeof data.messageId !== 'string' || !MESSAGE_ID.test(data.messageId) ||
            typeof data.text !== 'string' || !data.text.trim() || data.text.length > 2000 ||
            (Object.hasOwn(data, 'replyToMessageId') &&
                (typeof data.replyToMessageId !== 'string' || !MESSAGE_ID.test(data.replyToMessageId) ||
                    data.replyToMessageId === data.messageId))) {
            throw new HttpsError('invalid-argument', 'INVALID_CHAT_SEND_REQUEST');
        }
        try {
            return await send({
                actorUid, targetUid: data.targetUid, messageId: data.messageId, text: data.text,
                ...(data.replyToMessageId ? { replyToMessageId: data.replyToMessageId } : {})
            });
        } catch (error) {
            const code = ERRORS.get(error?.message);
            if (code) throw new HttpsError(code, error.message);
            throw new HttpsError('internal', 'CHAT_SEND_FAILED');
        }
    };
}

export function createFirestoreChatSendCallable({ db, HttpsError }) {
    return createChatSendCallableAdapter({
        send: args => sendDirectMessage(db, args),
        HttpsError
    });
}
