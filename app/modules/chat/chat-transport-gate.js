// The published browser still writes legacy Firestore messages directly.
// Server transport must remain off until message history, read rules, indexes,
// server functions and a rollback have been verified together.
export const CHAT_SERVER_TRANSPORT_ENABLED = false;

const UID = /^[A-Za-z0-9_-]{1,128}$/;

export function chatIdForUsers(userUid, friendUid) {
    if (typeof userUid !== 'string' || !UID.test(userUid) ||
        typeof friendUid !== 'string' || !UID.test(friendUid) || userUid === friendUid) {
        throw new TypeError('INVALID_CHAT_PARTICIPANTS');
    }
    const [first, second] = [userUid, friendUid].sort();
    return CHAT_SERVER_TRANSPORT_ENABLED
        ? `dm_${first.length}_${first}_${second.length}_${second}`
        : `${first}_${second}`;
}

export function chatTransportMode() {
    return CHAT_SERVER_TRANSPORT_ENABLED ? 'server' : 'legacy';
}
