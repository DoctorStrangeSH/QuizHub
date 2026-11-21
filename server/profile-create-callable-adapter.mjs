// Authenticated callable boundary. The client may provide a timezone preference;
// UID/email are always derived from Firebase's verified request.auth context.
import { normalizeQuizTimeZone } from './quiz-event-rewards.mjs';

const REQUEST_KEYS = new Set(['nickname', 'timeZone']);
const PUBLIC_ERRORS = new Map([
    ['INVALID_NICKNAME', 'invalid-argument'],
    ['INVALID_TIME_ZONE', 'invalid-argument'],
    ['NICKNAME_TAKEN', 'already-exists'],
    ['PROFILE_ALREADY_EXISTS', 'already-exists']
]);

export function createProfileCallableAdapter({ create, HttpsError }) {
    if (typeof create !== 'function' || typeof HttpsError !== 'function') {
        throw new TypeError('TRUSTED_PROFILE_DEPENDENCIES_REQUIRED');
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
            Object.keys(data).some(key => !REQUEST_KEYS.has(key)) ||
            typeof data.nickname !== 'string' ||
            (data.timeZone !== undefined && typeof data.timeZone !== 'string')) {
            throw new HttpsError('invalid-argument', 'INVALID_PROFILE_CREATE_REQUEST');
        }
        try {
            return await create({
                uid,
                email: typeof auth.token?.email === 'string' ? auth.token.email : null,
                nickname: data.nickname,
                timeZone: normalizeQuizTimeZone(data.timeZone ?? 'UTC')
            });
        } catch (error) {
            const code = PUBLIC_ERRORS.get(error?.message);
            if (code) throw new HttpsError(code, error.message);
            throw new HttpsError('internal', 'PROFILE_CREATE_FAILED');
        }
    };
}
