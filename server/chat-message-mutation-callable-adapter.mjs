import { mutateDirectMessage } from './chat-message-mutations.mjs';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;
const KEYS = new Set(['operation', 'chatId', 'messageId', 'text']);
const ERRORS = new Map([
    ['INVALID_CHAT_MESSAGE_MUTATION', 'invalid-argument'],
    ['INVALID_MESSAGE_TEXT', 'invalid-argument'],
    ['CHAT_NOT_FOUND', 'not-found'],
    ['MESSAGE_NOT_FOUND', 'not-found'],
    ['CHAT_MEMBERSHIP_REQUIRED', 'permission-denied'],
    ['MESSAGE_AUTHOR_REQUIRED', 'permission-denied'],
    ['MESSAGE_ALREADY_DELETED', 'failed-precondition'],
    ['CHAT_MESSAGE_STATE_CONFLICT', 'failed-precondition']
]);

export function createChatMessageMutationCallableAdapter({ mutate, HttpsError }) {
    if (typeof mutate !== 'function' || typeof HttpsError !== 'function') {
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
            !['edit', 'delete'].includes(data.operation) ||
            typeof data.chatId !== 'string' || !CHAT_ID.test(data.chatId) ||
            typeof data.messageId !== 'string' || !MESSAGE_ID.test(data.messageId) ||
            (data.operation === 'edit' &&
                (typeof data.text !== 'string' || !data.text.trim() || data.text.length > 2000)) ||
            (data.operation === 'delete' && Object.hasOwn(data, 'text'))) {
            throw new HttpsError('invalid-argument', 'INVALID_CHAT_MESSAGE_MUTATION');
        }
        try {
            return await mutate({
                actorUid, chatId: data.chatId, messageId: data.messageId,
                operation: data.operation, ...(data.operation === 'edit' ? { text: data.text } : {})
            });
        } catch (error) {
            const code = ERRORS.get(error?.message);
            if (code) throw new HttpsError(code, error.message);
            throw new HttpsError('internal', 'CHAT_MESSAGE_MUTATION_FAILED');
        }
    };
}

export function createFirestoreChatMessageMutationCallable({ db, HttpsError }) {
    return createChatMessageMutationCallableAdapter({
        mutate: args => mutateDirectMessage(db, args),
        HttpsError
    });
}
