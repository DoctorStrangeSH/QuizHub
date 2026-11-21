// Preview-only authenticated boundary. Never accept an actor UID from the client.
const OPERATIONS = new Set(['send', 'accept', 'decline', 'cancel', 'remove']);
const KEYS = new Set(['operation', 'targetUid']);
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const ERRORS = new Map([
    ['INVALID_SOCIAL_TARGET', 'invalid-argument'],
    ['INVALID_SOCIAL_OPERATION', 'invalid-argument'],
    ['PROFILE_NOT_FOUND', 'not-found'],
    ['REQUEST_NOT_FOUND', 'failed-precondition'],
    ['INCOMING_REQUEST_EXISTS', 'failed-precondition'],
    ['SOCIAL_STATE_CONFLICT', 'failed-precondition'],
    ['SOCIAL_MIGRATION_REQUIRED', 'failed-precondition'],
    ['SOCIAL_LIST_FULL', 'resource-exhausted']
]);

export function createFriendCallableAdapter({ update, HttpsError }) {
    if (typeof update !== 'function' || typeof HttpsError !== 'function') {
        throw new TypeError('TRUSTED_SOCIAL_DEPENDENCIES_REQUIRED');
    }
    return async request => {
        const actorUid = request?.auth?.uid;
        if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
            request?.auth?.token?.firebase?.sign_in_provider === 'anonymous') {
            throw new HttpsError('unauthenticated', 'SIGNED_IN_ACCOUNT_REQUIRED');
        }
        const data = request?.data;
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            Object.keys(data).length !== 2 || Object.keys(data).some(k => !KEYS.has(k)) ||
            !OPERATIONS.has(data.operation) || typeof data.targetUid !== 'string' ||
            !UID.test(data.targetUid) || data.targetUid === actorUid) {
            throw new HttpsError('invalid-argument', 'INVALID_SOCIAL_REQUEST');
        }
        try {
            return await update({ actorUid, targetUid: data.targetUid, operation: data.operation });
        } catch (error) {
            const code = ERRORS.get(error?.message);
            if (code) throw new HttpsError(code, error.message);
            throw new HttpsError('internal', 'FRIEND_OPERATION_FAILED');
        }
    };
}
