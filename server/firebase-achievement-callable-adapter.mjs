export function createAchievementCallableAdapter({ handle, HttpsError }) {
    if (typeof handle !== 'function' || typeof HttpsError !== 'function') throw new Error('INVALID_ACHIEVEMENT_CALLABLE');
    return async function achievementCallable(request) {
        const uid = request?.auth?.uid;
        if (typeof uid !== 'string' || !uid.trim()) throw new HttpsError('unauthenticated', 'AUTH_REQUIRED');
        const data = request?.data;
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            Object.keys(data).some(key => !['operation', 'payload'].includes(key)) ||
            data.operation !== 'evaluate' || !data.payload || typeof data.payload !== 'object' ||
            Array.isArray(data.payload) || Object.keys(data.payload).length) {
            throw new HttpsError('invalid-argument', 'INVALID_ACHIEVEMENT_REQUEST');
        }
        try {
            return await handle('evaluate', {}, { auth: { uid } });
        } catch (error) {
            const code = error instanceof Error ? error.message : '';
            if (code === 'AUTH_REQUIRED') throw new HttpsError('unauthenticated', code);
            if (code === 'USER_NOT_FOUND') throw new HttpsError('not-found', code);
            if (code === 'INVALID_ACHIEVEMENT_REQUEST' || code === 'UNKNOWN_ACHIEVEMENT_OPERATION') {
                throw new HttpsError('invalid-argument', code);
            }
            throw new HttpsError('internal', 'ACHIEVEMENT_SERVER_ERROR');
        }
    };
}
