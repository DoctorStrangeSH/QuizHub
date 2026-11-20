export function createAuthenticatedAchievementHandler({ service }) {
    if (!service || typeof service.evaluate !== 'function') throw new Error('INVALID_ACHIEVEMENT_SERVICE');
    return async function handleAchievement(operation, payload, context) {
        const uid = context?.auth?.uid;
        if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
        if (operation !== 'evaluate') throw new Error('UNKNOWN_ACHIEVEMENT_OPERATION');
        if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).length) {
            throw new Error('INVALID_ACHIEVEMENT_REQUEST');
        }
        return service.evaluate({ uid });
    };
}
