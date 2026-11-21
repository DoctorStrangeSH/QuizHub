import { markDirectMessagesRead } from './chat-read-receipts.mjs';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;
const ERRORS = new Map([
    ['INVALID_CHAT_READ_RECEIPT', 'invalid-argument'],
    ['INVALID_CHAT_READ_TARGET', 'failed-precondition'],
    ['CHAT_NOT_FOUND', 'not-found'],
    ['MESSAGE_NOT_FOUND', 'not-found'],
    ['CHAT_MEMBERSHIP_REQUIRED', 'permission-denied']
]);

export function createChatReadReceiptCallableAdapter({ markRead, HttpsError }) {
    if (typeof markRead !== 'function' || typeof HttpsError !== 'function') {
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
            Object.keys(data).some(key => !['chatId', 'upToMessageId'].includes(key)) ||
            typeof data.chatId !== 'string' || !CHAT_ID.test(data.chatId) ||
            typeof data.upToMessageId !== 'string' || !MESSAGE_ID.test(data.upToMessageId)) {
            throw new HttpsError('invalid-argument', 'INVALID_CHAT_READ_RECEIPT');
        }
        try {
            return await markRead({ actorUid, chatId: data.chatId, upToMessageId: data.upToMessageId });
        } catch (error) {
            const code = ERRORS.get(error?.message);
            if (code) throw new HttpsError(code, error.message);
            throw new HttpsError('internal', 'CHAT_READ_RECEIPT_FAILED');
        }
    };
}

export function createFirestoreChatReadReceiptCallable({ db, HttpsError }) {
    return createChatReadReceiptCallableAdapter({
        markRead: args => markDirectMessagesRead(db, args),
        HttpsError
    });
}
