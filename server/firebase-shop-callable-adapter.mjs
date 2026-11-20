const INVALID = new Set(['INVALID_SHOP_REQUEST', 'UNEXPECTED_SHOP_FIELD', 'UNKNOWN_SHOP_OPERATION', 'INVALID_ITEM', 'INVALID_OPERATION_ID', 'SHOP_ITEM_NOT_FOUND', 'INVALID_SERVER_TIME']);
const NOT_FOUND = new Set(['USER_NOT_FOUND']);
const PRECONDITION = new Set(['INSUFFICIENT_COINS', 'ITEM_ALREADY_OWNED', 'ITEM_NOT_OWNED', 'BONUS_ALREADY_ACTIVE', 'IDEMPOTENCY_KEY_REUSED', 'INVALID_USER_BALANCE', 'INVALID_BONUS_EXPIRY', 'UNSUPPORTED_SHOP_ITEM']);

export function createShopCallableAdapter({ handle, HttpsError, clock = Date.now }) {
    if (typeof handle !== 'function' || typeof HttpsError !== 'function' || typeof clock !== 'function') {
        throw new Error('INVALID_SHOP_CALLABLE_ADAPTER');
    }
    return async function shopCallable(request) {
        const uid = request?.auth?.uid;
        if (typeof uid !== 'string' || !uid.trim()) throw new HttpsError('unauthenticated', 'AUTH_REQUIRED');
        const data = request?.data;
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            Object.keys(data).some(key => !['operation', 'payload'].includes(key)) ||
            typeof data.operation !== 'string' || !data.payload || typeof data.payload !== 'object' ||
            Array.isArray(data.payload)) {
            throw new HttpsError('invalid-argument', 'INVALID_SHOP_REQUEST');
        }
        try {
            return await handle(data.operation, data.payload, { auth: { uid }, now: clock() });
        } catch (error) {
            const code = error instanceof Error ? error.message : '';
            if (code === 'AUTH_REQUIRED') throw new HttpsError('unauthenticated', code);
            if (INVALID.has(code)) throw new HttpsError('invalid-argument', code);
            if (NOT_FOUND.has(code)) throw new HttpsError('not-found', code);
            if (PRECONDITION.has(code)) throw new HttpsError('failed-precondition', code);
            throw new HttpsError('internal', 'SHOP_SERVER_ERROR');
        }
    };
}
