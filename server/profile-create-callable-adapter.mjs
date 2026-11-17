// Authenticated callable boundary. The only client-controlled field is nickname.
// UID/email are always derived from Firebase's verified request.auth context.
const REQUEST_KEYS = new Set(['nickname']);
const PUBLIC_ERRORS = new Map([
    ['INVALID_NICKNAME', 'invalid-argument'],
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
            typeof data.nickname !== 'string') {
            throw new HttpsError('invalid-argument', 'NICKNAME_ONLY');
        }
        try {
            return await create({
                uid,
                email: typeof auth.token?.email === 'string' ? auth.token.email : null,
                nickname: data.nickname
            });
        } catch (error) {
            const code = PUBLIC_ERRORS.get(error?.message);
            if (code) throw new HttpsError(code, error.message);
            // Never expose internal Firestore errors or account data to clients.
            throw new HttpsError('internal', 'PROFILE_CREATE_FAILED');
        }
    };
}
