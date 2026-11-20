export function createAuthenticatedDailyLoginHandler({ service }) {
    if (!service || typeof service.claim !== 'function') throw new Error('INVALID_DAILY_LOGIN_SERVICE');
    return async function handleDailyLogin(operation, data, context) {
        const uid = context?.auth?.uid;
        if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
        if (!Number.isSafeInteger(context?.now) || context.now < 0) throw new Error('INVALID_SERVER_TIME');
        if (operation !== 'claim') throw new Error('UNKNOWN_DAILY_LOGIN_OPERATION');
        if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length !== 0) {
            throw new Error('INVALID_DAILY_LOGIN_REQUEST');
        }
        return service.claim({ uid, now: context.now });
    };
}
