// Firebase callable boundary for the server-verified quiz session contract.
// The transport supplies the authenticated principal; browser fields never
// provide identity, server time, score, correct answers or economic rewards.
const INVALID = new Set([
    'INVALID_REQUEST', 'UNKNOWN_OPERATION', 'UNEXPECTED_FIELD',
    'INVALID_LANGUAGE', 'INVALID_MODE', 'INVALID_QUESTIONS',
    'INVALID_QUESTION_ID', 'INVALID_ANSWER', 'INVALID_SESSION_ID',
    'INVALID_TIME', 'INVALID_DURATION', 'INVALID_DEADLINE',
    'INVALID_CATEGORY', 'INVALID_DIFFICULTY', 'INVALID_COUNT'
]);
const NOT_FOUND = new Set(['SESSION_NOT_FOUND', 'QUESTION_NOT_FOUND', 'USER_NOT_FOUND']);
const PRECONDITION = new Set([
    'SESSION_CLOSED', 'SESSION_EXPIRED', 'SESSION_INCOMPLETE',
    'ALREADY_FINALIZED', 'ALL_QUESTIONS_ANSWERED', 'OUT_OF_ORDER',
    'NOT_SESSION_OWNER', 'ANSWER_ALREADY_LOCKED', 'INVALID_ANSWER_LOG',
    'INVALID_USER_BALANCE', 'INVALID_USER_STATS', 'BALANCE_OVERFLOW',
    'MISSING_RECEIPT'
]);

export function createQuizCallableAdapter({ handle, HttpsError, clock = Date.now }) {
    if (typeof handle !== 'function' || typeof HttpsError !== 'function' ||
        typeof clock !== 'function') throw new Error('INVALID_CALLABLE_ADAPTER');

    return async function quizCallable(request) {
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
            if (PRECONDITION.has(code)) throw new HttpsError('failed-precondition', code);
            // Unrecognized errors must not expose internal Firestore paths,
            // profile data, server stack traces or adapter implementation.
            throw new HttpsError('internal', 'QUIZ_SERVER_ERROR');
        }
    };
}
