export function createDailyLoginCallableAdapter({ handle, HttpsError, clock = Date.now }) {
    if (typeof handle !== 'function' || typeof HttpsError !== 'function' || typeof clock !== 'function') {
        throw new Error('INVALID_DAILY_LOGIN_CALLABLE');
    }
    return async function dailyLoginCallable(request) {
        const uid = request?.auth?.uid;
        if (typeof uid !== 'string' || !uid.trim()) throw new HttpsError('unauthenticated', 'AUTH_REQUIRED');
        const data = request?.data;
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            Object.keys(data).some(key => !['operation', 'payload'].includes(key)) ||
            data.operation !== 'claim' || !data.payload || typeof data.payload !== 'object' ||
            Array.isArray(data.payload) || Object.keys(data.payload).length !== 0) {
            throw new HttpsError('invalid-argument', 'INVALID_DAILY_LOGIN_REQUEST');
        }
        try {
            return await handle('claim', {}, { auth: { uid }, now: clock() });
        } catch (error) {
            const code = error instanceof Error ? error.message : '';
            if (code === 'AUTH_REQUIRED') throw new HttpsError('unauthenticated', code);
            if (['INVALID_SERVER_TIME', 'INVALID_DAILY_LOGIN_REQUEST', 'UNKNOWN_DAILY_LOGIN_OPERATION'].includes(code)) {
                throw new HttpsError('invalid-argument', code);
            }
            if (code === 'USER_NOT_FOUND') throw new HttpsError('not-found', code);
            if (['DAILY_ALREADY_CLAIMED', 'INVALID_USER_BALANCE'].includes(code)) {
                throw new HttpsError('failed-precondition', code);
            }
            throw new HttpsError('internal', 'DAILY_LOGIN_SERVER_ERROR');
        }
    };
}
