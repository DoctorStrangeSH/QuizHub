import { getDirectChatUnreadCount } from './chat-unread-count.mjs';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const ERRORS = new Map([
    ['INVALID_CHAT_UNREAD_REQUEST', 'invalid-argument'],
    ['CHAT_NOT_FOUND', 'not-found'],
    ['CHAT_MEMBERSHIP_REQUIRED', 'permission-denied'],
    ['CHAT_READ_RECEIPT_STATE_CONFLICT', 'failed-precondition'],
    ['CHAT_UNREAD_COUNT_STATE_CONFLICT', 'failed-precondition']
]);

export function createChatUnreadCountCallableAdapter({ getCount, HttpsError }) {
    if (typeof getCount !== 'function' || typeof HttpsError !== 'function') {
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
            Object.keys(data).some(key => key !== 'chatId') ||
            typeof data.chatId !== 'string' || !CHAT_ID.test(data.chatId)) {
            throw new HttpsError('invalid-argument', 'INVALID_CHAT_UNREAD_REQUEST');
        }
        try {
            return await getCount({ actorUid, chatId: data.chatId });
        } catch (error) {
            const code = ERRORS.get(error?.message);
            if (code) throw new HttpsError(code, error.message);
            throw new HttpsError('internal', 'CHAT_UNREAD_COUNT_FAILED');
        }
    };
}

export function createFirestoreChatUnreadCountCallable({ db, HttpsError }) {
    return createChatUnreadCountCallableAdapter({
        getCount: args => getDirectChatUnreadCount(db, args),
        HttpsError
    });
}
