import { readDirectMessages } from './chat-history.mjs';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;
const KEYS = new Set(['chatId', 'pageSize', 'cursorMessageId']);
const ERRORS = new Map([
    ['INVALID_CHAT_READ_REQUEST', 'invalid-argument'],
    ['INVALID_CHAT_PAGE_SIZE', 'invalid-argument'],
    ['INVALID_CHAT_CURSOR', 'invalid-argument'],
    ['CHAT_NOT_FOUND', 'not-found'],
    ['CHAT_MEMBERSHIP_REQUIRED', 'permission-denied'],
    ['CHAT_MESSAGE_STATE_CONFLICT', 'failed-precondition']
]);

export function createChatHistoryCallableAdapter({ read, HttpsError }) {
    if (typeof read !== 'function' || typeof HttpsError !== 'function') {
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
            !Object.prototype.hasOwnProperty.call(data, 'chatId') ||
            typeof data.chatId !== 'string' || !CHAT_ID.test(data.chatId) ||
            (data.pageSize !== undefined && (!Number.isInteger(data.pageSize) || data.pageSize < 1 || data.pageSize > 50)) ||
            (data.cursorMessageId !== undefined &&
                (typeof data.cursorMessageId !== 'string' || !MESSAGE_ID.test(data.cursorMessageId)))) {
            throw new HttpsError('invalid-argument', 'INVALID_CHAT_READ_REQUEST');
        }
        try {
            return await read({
                actorUid,
                chatId: data.chatId,
                pageSize: data.pageSize ?? 30,
                cursorMessageId: data.cursorMessageId ?? null
            });
        } catch (error) {
            const code = ERRORS.get(error?.message);
            if (code) throw new HttpsError(code, error.message);
            throw new HttpsError('internal', 'CHAT_READ_FAILED');
        }
    };
}

export function createFirestoreChatHistoryCallable({ db, HttpsError }) {
    return createChatHistoryCallableAdapter({
        read: args => readDirectMessages(db, args),
        HttpsError
    });
}
