const UID = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_ID = /^dm_[a-f0-9]{48}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{16,128}$/;

function isPlainRecord(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function assertExactKeys(value, keys, code) {
    if (!isPlainRecord(value) || Object.keys(value).length !== keys.length ||
        Object.keys(value).some(key => !keys.includes(key))) {
        throw new Error(code);
    }
}

export function createFirebaseChatTransport({
    auth, functions, httpsCallable, location
}) {
    if (!auth || !functions || typeof httpsCallable !== 'function' ||
        !location || typeof location.hostname !== 'string' ||
        typeof location.search !== 'string') {
        throw new Error('INVALID_CHAT_TRANSPORT_CONFIGURATION');
    }
    const params = new URLSearchParams(location.search);
    const allowedHost = ['localhost', '127.0.0.1'].includes(location.hostname);
    const allowedPreview = params.get('firebaseEmulator') === '1' &&
        params.get('chatPreview') === '1';
    if (!allowedHost || !allowedPreview ||
        auth.app?.options?.projectId !== 'demo-quizhub' ||
        functions.app?.options?.projectId !== 'demo-quizhub') {
        throw new Error('CHAT_PREVIEW_EMULATOR_REQUIRED');
    }
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
        throw new Error('SIGNED_IN_ACCOUNT_REQUIRED');
    }

    const send = httpsCallable(functions, 'chatSendPreviewCallable');
    const history = httpsCallable(functions, 'chatHistoryPreviewCallable');
    const markRead = httpsCallable(functions, 'chatReadReceiptPreviewCallable');
    const unreadCount = httpsCallable(functions, 'chatUnreadCountPreviewCallable');
    const mutateMessage = httpsCallable(functions, 'chatMessageMutationPreviewCallable');
    const toggleReaction = httpsCallable(functions, 'chatReactionPreviewCallable');

    const invoke = async (callable, payload) => {
        if (!auth.currentUser || auth.currentUser.isAnonymous) {
            throw new Error('SIGNED_IN_ACCOUNT_REQUIRED');
        }
        const response = await callable(payload);
        return response?.data;
    };

    return Object.freeze({
        async sendMessage(payload) {
            assertExactKeys(payload, ['targetUid', 'messageId', 'text'], 'INVALID_CHAT_SEND_REQUEST');
            if (typeof payload.targetUid !== 'string' || !UID.test(payload.targetUid) ||
                payload.targetUid === auth.currentUser.uid ||
                typeof payload.messageId !== 'string' || !MESSAGE_ID.test(payload.messageId) ||
                typeof payload.text !== 'string' || !payload.text.trim() || payload.text.length > 2000) {
                throw new Error('INVALID_CHAT_SEND_REQUEST');
            }
            return invoke(send, {
                targetUid: payload.targetUid,
                messageId: payload.messageId,
                text: payload.text
            });
        },
        async readHistory(payload) {
            if (!isPlainRecord(payload) ||
                Object.keys(payload).some(key => !['chatId', 'pageSize', 'cursorMessageId'].includes(key)) ||
                typeof payload.chatId !== 'string' || !CHAT_ID.test(payload.chatId) ||
                (payload.pageSize !== undefined &&
                    (!Number.isInteger(payload.pageSize) || payload.pageSize < 1 || payload.pageSize > 50)) ||
                (payload.cursorMessageId !== undefined &&
                    (typeof payload.cursorMessageId !== 'string' || !MESSAGE_ID.test(payload.cursorMessageId)))) {
                throw new Error('INVALID_CHAT_HISTORY_REQUEST');
            }
            return invoke(history, {
                chatId: payload.chatId,
                ...(payload.pageSize === undefined ? {} : { pageSize: payload.pageSize }),
                ...(payload.cursorMessageId === undefined ? {} : { cursorMessageId: payload.cursorMessageId })
            });
        },
        async markRead(payload) {
            assertExactKeys(payload, ['chatId', 'upToMessageId'], 'INVALID_CHAT_READ_RECEIPT');
            if (typeof payload.chatId !== 'string' || !CHAT_ID.test(payload.chatId) ||
                typeof payload.upToMessageId !== 'string' || !MESSAGE_ID.test(payload.upToMessageId)) {
                throw new Error('INVALID_CHAT_READ_RECEIPT');
            }
            return invoke(markRead, {
                chatId: payload.chatId,
                upToMessageId: payload.upToMessageId
            });
        },
        async mutateMessage(payload) {
            if (!isPlainRecord(payload) ||
                Object.keys(payload).some(key => !['operation', 'chatId', 'messageId', 'text'].includes(key)) ||
                !['edit', 'delete'].includes(payload.operation) ||
                typeof payload.chatId !== 'string' || !CHAT_ID.test(payload.chatId) ||
                typeof payload.messageId !== 'string' || !MESSAGE_ID.test(payload.messageId) ||
                (payload.operation === 'edit' &&
                    (typeof payload.text !== 'string' || !payload.text.trim() || payload.text.length > 2000)) ||
                (payload.operation === 'delete' && Object.hasOwn(payload, 'text'))) {
                throw new Error('INVALID_CHAT_MESSAGE_MUTATION');
            }
            return invoke(mutateMessage, {
                operation: payload.operation,
                chatId: payload.chatId,
                messageId: payload.messageId,
                ...(payload.operation === 'edit' ? { text: payload.text } : {})
            });
        },
        async toggleReaction(payload) {
            assertExactKeys(payload, ['chatId', 'messageId', 'reactionType'], 'INVALID_CHAT_REACTION');
            if (typeof payload.chatId !== 'string' || !CHAT_ID.test(payload.chatId) ||
                typeof payload.messageId !== 'string' || !MESSAGE_ID.test(payload.messageId) ||
                !['like', 'love', 'laugh', 'wow', 'sad', 'fire'].includes(payload.reactionType)) {
                throw new Error('INVALID_CHAT_REACTION');
            }
            return invoke(toggleReaction, {
                chatId: payload.chatId,
                messageId: payload.messageId,
                reactionType: payload.reactionType
            });
        },
        async getUnreadCount(payload) {
            assertExactKeys(payload, ['chatId'], 'INVALID_CHAT_UNREAD_REQUEST');
            if (typeof payload.chatId !== 'string' || !CHAT_ID.test(payload.chatId)) {
                throw new Error('INVALID_CHAT_UNREAD_REQUEST');
            }
            return invoke(unreadCount, { chatId: payload.chatId });
        }
    });
}
