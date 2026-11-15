// Pure transport boundary. Firebase supplies a VERIFIED request.auth.uid.
// Do not accept uid, clock, score, rewards or role from request.data.
const INVALID = new Set([
    'INVALID_DAILY_REQUEST', 'UNEXPECTED_DAILY_FIELD', 'MISSING_DAILY_FIELD',
    'INVALID_LANGUAGE', 'INVALID_DAILY_DATE', 'INVALID_QUESTION_ID',
    'INVALID_ANSWER', 'UNKNOWN_DAILY_OPERATION'
]);
const NOT_FOUND = new Set(['DAILY_ATTEMPT_NOT_FOUND']);
const PRECONDITION = new Set([
    'SESSION_CLOSED', 'ANSWER_ALREADY_LOCKED', 'SESSION_INCOMPLETE',
    'OUT_OF_ORDER', 'ALL_QUESTIONS_ANSWERED', 'DAILY_NOT_CLOSED',
    'DAILY_RANKING_NOT_SEALED', 'SESSION_EXPIRED', 'INVALID_QUESTION_ORDER'
]);

export function createDailyCallableAdapter({ handle, HttpsError, clock = Date.now }) {
    if (typeof handle !== 'function' || typeof HttpsError !== 'function' ||
        typeof clock !== 'function') throw new Error('INVALID_CALLABLE_ADAPTER');

    return async function dailyCallable(request) {
        const uid = request?.auth?.uid;
        if (typeof uid !== 'string' || !uid.trim()) {
            throw new HttpsError('unauthenticated', 'AUTH_REQUIRED');
        }
        const data = request?.data;
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            Object.keys(data).some(key => !['operation', 'payload'].includes(key))) {
            throw new HttpsError('invalid-argument', 'INVALID_DAILY_REQUEST');
        }
        try {
            return await handle(data.operation, data.payload, {
                auth: { uid }, now: clock()
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (INVALID.has(message)) throw new HttpsError('invalid-argument', message);
            if (NOT_FOUND.has(message)) throw new HttpsError('not-found', message);
            if (PRECONDITION.has(message)) throw new HttpsError('failed-precondition', message);
            // Never leak private service exceptions, account metadata or stack traces.
            throw new HttpsError('internal', 'DAILY_SERVER_ERROR');
        }
    };
}
