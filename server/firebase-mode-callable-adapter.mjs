const INVALID = new Set([
    'INVALID_REQUEST', 'UNKNOWN_OPERATION', 'UNEXPECTED_FIELD', 'INVALID_LANGUAGE',
    'INVALID_SERVER_TIME', 'INVALID_TIME', 'INVALID_SESSION_ID', 'INVALID_QUESTION_ID',
    'INVALID_ANSWER', 'INVALID_COUNT', 'INVALID_MODE', 'UNSUPPORTED_QUIZ_MODE',
    'INVALID_CATEGORY', 'INVALID_DIFFICULTY'
]);
const NOT_FOUND = new Set(['SESSION_NOT_FOUND', 'QUESTION_NOT_FOUND', 'USER_NOT_FOUND']);
const FORBIDDEN = new Set(['NOT_SESSION_OWNER']);
const PRECONDITION = new Set([
    'SESSION_CLOSED', 'SESSION_INCOMPLETE', 'ANSWER_ALREADY_LOCKED', 'OUT_OF_ORDER',
    'INVALID_MODE_SESSION', 'INVALID_MODE_PROGRESS', 'INVALID_MODE_ANSWER_LOG',
    'INVALID_MODE_RESULT', 'INVALID_USER_BALANCE', 'INVALID_USER_STATS',
    'BALANCE_OVERFLOW', 'INVALID_STORAGE_SESSION_ID'
]);

export function createModeCallableAdapter({ handle, HttpsError, clock = Date.now }) {
    if (typeof handle !== 'function' || typeof HttpsError !== 'function' ||
        typeof clock !== 'function') throw new Error('INVALID_CALLABLE_ADAPTER');

    return async function modeCallable(request) {
        const uid = request?.auth?.uid;
        if (typeof uid !== 'string' || !uid.trim()) {
            throw new HttpsError('unauthenticated', 'AUTH_REQUIRED');
        }
        const data = request?.data;
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            Object.keys(data).some(key => !['operation', 'payload'].includes(key)) ||
            typeof data.operation !== 'string' ||
            !data.payload || typeof data.payload !== 'object' || Array.isArray(data.payload)) {
            throw new HttpsError('invalid-argument', 'INVALID_REQUEST');
        }
        try {
            return await handle(data.operation, data.payload, {
                auth: { uid }, now: clock()
            });
        } catch (error) {
            const code = error instanceof Error ? error.message : '';
            if (code === 'AUTH_REQUIRED') throw new HttpsError('unauthenticated', code);
            if (INVALID.has(code)) throw new HttpsError('invalid-argument', code);
            if (NOT_FOUND.has(code)) throw new HttpsError('not-found', code);
            if (FORBIDDEN.has(code)) throw new HttpsError('permission-denied', code);
            if (PRECONDITION.has(code)) throw new HttpsError('failed-precondition', code);
            throw new HttpsError('internal', 'QUIZ_MODE_SERVER_ERROR');
        }
    };
}
