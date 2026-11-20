import { claimModeSessionReward } from './quiz-mode-reward-claim.mjs';

const allowed = {
    start: ['mode', 'category', 'difficulty', 'count', 'language'],
    answer: ['sessionId', 'questionId', 'answerIndex', 'language'],
    resume: ['sessionId', 'language'],
    claim: ['sessionId']
};

function principal(context) {
    const uid = context?.auth?.uid;
    if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
    const now = context?.now;
    if (!Number.isSafeInteger(now) || now < 0) throw new Error('INVALID_SERVER_TIME');
    return { uid, now };
}

export function createAuthenticatedModeHandler({ service, store }) {
    if (!service || ['start', 'answer', 'resume'].some(key => typeof service[key] !== 'function') ||
        !store || typeof store.runTransaction !== 'function') {
        throw new Error('INVALID_SERVICE_CONFIGURATION');
    }

    return async function handleModeRequest(operation, data, context) {
        const { uid, now } = principal(context);
        const keys = allowed[operation];
        if (!keys) throw new Error('UNKNOWN_OPERATION');
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('INVALID_REQUEST');
        }
        for (const key of Object.keys(data)) {
            if (!keys.includes(key)) throw new Error('UNEXPECTED_FIELD');
        }
        if ('language' in data && !['ru', 'en'].includes(data.language)) {
            throw new Error('INVALID_LANGUAGE');
        }
        const payload = Object.fromEntries(keys
            .filter(key => Object.hasOwn(data, key))
            .map(key => [key, data[key]]));

        if (operation === 'claim') {
            return claimModeSessionReward({ store, uid, sessionId: payload.sessionId, at: now });
        }
        return service[operation]({ ...payload, uid, now });
    };
}
