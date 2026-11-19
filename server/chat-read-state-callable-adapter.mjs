import { markDirectChatRead } from './chat-read-state.mjs';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^[A-Za-z0-9_-]{1,270}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{1,200}$/;

export function createChatReadStateCallableAdapter({ db, HttpsError }) {
    if (!db || typeof HttpsError !== 'function') throw new TypeError('CHAT_DEPENDENCIES_REQUIRED');
    return async request => {
        const actorUid = request?.auth?.uid;
        if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
            request?.auth?.token?.firebase?.sign_in_provider === 'anonymous') {
            throw new HttpsError('unauthenticated', 'SIGNED_IN_ACCOUNT_REQUIRED');
        }
        const data = request?.data;
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            Object.keys(data).length !== 2 ||
            !Object.keys(data).every(key => ['chatId', 'lastReadMessageId'].includes(key)) ||
            typeof data.chatId !== 'string' || !CHAT_ID.test(data.chatId) ||
            typeof data.lastReadMessageId !== 'string' || !MESSAGE_ID.test(data.lastReadMessageId)) {
            throw new HttpsError('invalid-argument', 'INVALID_CHAT_READ_STATE_REQUEST');
        }
        try {
            return await markDirectChatRead(db, { ...data, actorUid });
        } catch (error) {
            const code = error?.message === 'CHAT_READ_TARGET_NOT_FOUND' ? 'not-found' :
                error?.message === 'CHAT_MEMBER_REQUIRED' ? 'permission-denied' :
                    error?.message === 'CHAT_READ_TARGET_INVALID' ? 'failed-precondition' : 'internal';
            throw new HttpsError(code, code === 'internal' ? 'CHAT_READ_STATE_FAILED' : error.message);
        }
    };
}
