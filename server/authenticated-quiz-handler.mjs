// Transport-independent authenticated boundary for future Firebase Functions.
// The caller must verify the Firebase ID token and supply trusted server time.
// Browser-provided uid, timestamps, scores and rewards are never forwarded.
function requirePrincipal(context) {
    const uid = context?.auth?.uid;
    if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
    return uid;
}

function requireTime(context) {
    const now = context?.now;
    if (!Number.isSafeInteger(now) || now < 0) throw new Error('INVALID_SERVER_TIME');
    return now;
}

function requirePayload(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('INVALID_REQUEST');
    }
    return data;
}

const allowed = {
    start: ['mode', 'category', 'difficulty', 'count', 'language'],
    answer: ['sessionId', 'questionId', 'answerIndex', 'language'],
    resume: ['sessionId', 'language'],
    complete: ['sessionId']
};

function validatedData(operation, data) {
    const payload = requirePayload(data);
    const keys = allowed[operation];
    if (!keys) throw new Error('UNKNOWN_OPERATION');
    for (const key of Object.keys(payload)) {
        if (!keys.includes(key)) throw new Error('UNEXPECTED_FIELD');
    }
    if ('language' in payload && !['ru', 'en'].includes(payload.language)) {
        throw new Error('INVALID_LANGUAGE');
    }
    return Object.fromEntries(keys.filter(key => Object.hasOwn(payload, key)).map(key => [key, payload[key]]));
}

export function createAuthenticatedQuizHandler(service) {
    if (!service || ['start', 'answer', 'resume', 'complete'].some(
        operation => typeof service[operation] !== 'function'
    )) throw new Error('INVALID_SERVICE_CONFIGURATION');

    return async function handleQuizRequest(operation, data, context) {
        // Authentication is checked before payload inspection, even for unknown
        // operations, to avoid revealing API details to anonymous callers.
        const uid = requirePrincipal(context);
        const now = requireTime(context);
        if (!allowed[operation]) throw new Error('UNKNOWN_OPERATION');
        const payload = validatedData(operation, data);
        return service[operation]({ ...payload, uid, now });
    };
}
