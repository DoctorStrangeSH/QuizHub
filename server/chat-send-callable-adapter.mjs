import { sendDirectMessage } from './chat-send.mjs';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const ID = /^[A-Za-z0-9_-]{8,64}$/;
const KNOWN = new Map([
    ['CHAT_PROFILE_NOT_FOUND', 'not-found'],
    ['CHAT_FRIENDSHIP_REQUIRED', 'permission-denied'],
    ['CHAT_MEMBERSHIP_CONFLICT', 'failed-precondition'],
    ['MESSAGE_ID_CONFLICT', 'already-exists']
]);

export function createChatSendCallableAdapter({ db, HttpsError }) {
    if (!db || typeof HttpsError !== 'function') throw new TypeError('CHAT_DEPENDENCIES_REQUIRED');
    return async request => {
        const senderUid = request?.auth?.uid;
        if (typeof senderUid !== 'string' || !UID.test(senderUid) ||
            request?.auth?.token?.firebase?.sign_in_provider === 'anonymous') {
            throw new HttpsError('unauthenticated', 'SIGNED_IN_ACCOUNT_REQUIRED');
        }
        const data = request?.data;
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            Object.keys(data).length !== 3 ||
            !Object.keys(data).every(key => ['recipientUid', 'text', 'clientMessageId'].includes(key)) ||
            typeof data.recipientUid !== 'string' || !UID.test(data.recipientUid) ||
            data.recipientUid === senderUid || typeof data.clientMessageId !== 'string' ||
            !ID.test(data.clientMessageId) || typeof data.text !== 'string' ||
            !data.text.trim() || data.text.trim().length > 2000 ||
            /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(data.text)) {
            throw new HttpsError('invalid-argument', 'INVALID_CHAT_REQUEST');
        }
        try {
            return await sendDirectMessage(db, { senderUid, ...data });
        } catch (error) {
            throw new HttpsError(KNOWN.get(error?.message) ?? 'internal',
                KNOWN.has(error?.message) ? error.message : 'CHAT_SEND_FAILED');
        }
    };
}
