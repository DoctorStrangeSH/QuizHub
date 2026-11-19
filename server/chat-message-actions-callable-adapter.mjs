import { modifyDirectMessage } from './chat-message-actions.mjs';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const ERRORS = new Map([
    ['CHAT_MESSAGE_NOT_FOUND', 'not-found'],
    ['CHAT_MEMBER_REQUIRED', 'permission-denied'],
    ['CHAT_MESSAGE_NOT_OWNER', 'permission-denied'],
    ['CHAT_MESSAGE_INVALID_SENDER', 'failed-precondition'],
    ['CHAT_MESSAGE_DELETED', 'failed-precondition'],
    ['CHAT_REACTIONS_MIGRATION_REQUIRED', 'failed-precondition'],
    ['CHAT_REACTION_LIMIT', 'resource-exhausted']
]);

export function createChatActionsCallableAdapter({ db, HttpsError }) {
    if (!db || typeof HttpsError !== 'function') throw new TypeError('CHAT_DEPENDENCIES_REQUIRED');
    return async request => {
        const actorUid = request?.auth?.uid;
        if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
            request?.auth?.token?.firebase?.sign_in_provider === 'anonymous') {
            throw new HttpsError('unauthenticated', 'SIGNED_IN_ACCOUNT_REQUIRED');
        }
        const data = request?.data;
        const action = data?.action;
        const keys = action === 'edit' ? ['chatId', 'messageId', 'action', 'text'] :
            action === 'react' ? ['chatId', 'messageId', 'action', 'reaction'] :
                action === 'delete' ? ['chatId', 'messageId', 'action'] : [];
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            !keys.length || Object.keys(data).length !== keys.length ||
            !Object.keys(data).every(key => keys.includes(key)) ||
            typeof data.chatId !== 'string' || typeof data.messageId !== 'string') {
            throw new HttpsError('invalid-argument', 'INVALID_MESSAGE_ACTION_REQUEST');
        }
        try {
            return await modifyDirectMessage(db, { ...data, actorUid });
        } catch (error) {
            if (error?.message === 'INVALID_MESSAGE_ACTION') {
                throw new HttpsError('invalid-argument', error.message);
            }
            throw new HttpsError(ERRORS.get(error?.message) ?? 'internal',
                ERRORS.has(error?.message) ? error.message : 'CHAT_ACTION_FAILED');
        }
    };
}
