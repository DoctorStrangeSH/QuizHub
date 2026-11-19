// Local checks improve UX; Firestore Rules and the future server transport
// must enforce ownership independently of browser-provided values.
export function prepareChatMessageEdit(message, userUid, newText) {
    assertEditable(message, userUid);
    if (typeof newText !== 'string' || !newText.trim() || newText.trim().length > 2000) {
        throw new TypeError('INVALID_MESSAGE_TEXT');
    }
    return { text: newText.trim(), edited: true };
}

export function prepareChatMessageDelete(message, userUid) {
    assertEditable(message, userUid);
    return { text: '🗑️ Сообщение удалено', deleted: true, reactions: {} };
}

function assertEditable(message, userUid) {
    if (!message || typeof message !== 'object' || message.deleted) throw new Error('MESSAGE_UNAVAILABLE');
    if (typeof userUid !== 'string' || !userUid || message.senderId !== userUid) {
        throw new Error('NOT_MESSAGE_SENDER');
    }
}
