import { normalizeQuizTimeZone } from './quiz-event-rewards.mjs';

export function createProfileTimeZoneCallableAdapter({ update, HttpsError }) {
    if (typeof update !== 'function' || typeof HttpsError !== 'function') {
        throw new TypeError('TRUSTED_PROFILE_TIMEZONE_DEPENDENCIES_REQUIRED');
    }
    return async request => {
        const auth = request?.auth;
        const uid = auth?.uid;
        if (typeof uid !== 'string' || !uid ||
            auth?.token?.firebase?.sign_in_provider === 'anonymous') {
            throw new HttpsError('unauthenticated', 'SIGNED_IN_ACCOUNT_REQUIRED');
        }
        const data = request?.data;
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            Object.keys(data).some(key => key !== 'timeZone') ||
            typeof data.timeZone !== 'string') {
            throw new HttpsError('invalid-argument', 'INVALID_TIME_ZONE_REQUEST');
        }
        try {
            const timeZone = normalizeQuizTimeZone(data.timeZone);
            return await update({ uid, timeZone });
        } catch (error) {
            if (error?.message === 'INVALID_TIME_ZONE') {
                throw new HttpsError('invalid-argument', 'INVALID_TIME_ZONE');
            }
            if (error?.message === 'USER_NOT_FOUND') {
                throw new HttpsError('not-found', 'PROFILE_NOT_FOUND');
            }
            throw new HttpsError('internal', 'PROFILE_TIME_ZONE_UPDATE_FAILED');
        }
    };
}
