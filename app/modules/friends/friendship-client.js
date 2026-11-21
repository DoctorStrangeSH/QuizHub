const OPERATIONS = new Set(['send', 'accept', 'decline', 'cancel', 'remove']);

function unwrap(response) {
    return response && typeof response === 'object' && 'data' in response
        ? response.data
        : response;
}

export function createFriendshipClient({ invoke } = {}) {
    if (typeof invoke !== 'function') throw new Error('INVALID_FRIENDSHIP_TRANSPORT');
    return Object.freeze({
        async perform(operation, targetUid) {
            if (!OPERATIONS.has(operation) || typeof targetUid !== 'string' ||
                !/^[A-Za-z0-9_-]{1,128}$/.test(targetUid)) {
                throw new Error('INVALID_FRIENDSHIP_REQUEST');
            }
            try {
                const result = unwrap(await invoke({ operation, targetUid }));
                if (!result || !['updated', 'unchanged'].includes(result.status)) {
                    throw new Error('INVALID_FRIENDSHIP_RESPONSE');
                }
                return result;
            } catch (error) {
                const mapped = {
                    unauthenticated: 'AUTH_REQUIRED',
                    'invalid-argument': 'INVALID_FRIENDSHIP_REQUEST',
                    'not-found': 'PLAYER_NOT_FOUND',
                    'failed-precondition': 'FRIENDSHIP_STATE_CONFLICT',
                    'resource-exhausted': 'FRIEND_LIST_FULL',
                    unavailable: 'NETWORK_UNAVAILABLE',
                    'deadline-exceeded': 'NETWORK_TIMEOUT'
                }[error?.code] || error?.message || 'FRIENDSHIP_REQUEST_FAILED';
                const safe = new Error(mapped);
                safe.cause = error;
                throw safe;
            }
        }
    });
}
