// Transport-independent boundary for the ranked Daily Challenge contract.
// The future Firebase Functions adapter MUST verify the caller's ID token and
// supply auth.uid and trusted server time; client-provided identity, clock,
// score and rewards are never passed to the service.
const OPERATIONS = Object.freeze({
    start: [],
    resume: ['date'],
    answer: ['date', 'questionId', 'answerIndex'],
    complete: ['date']
});

function validatePayload(operation, payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('INVALID_DAILY_REQUEST');
    }
    const allowed = [...OPERATIONS[operation], 'language'];
    if (Object.keys(payload).some(key => !allowed.includes(key))) {
        throw new Error('UNEXPECTED_DAILY_FIELD');
    }
    for (const required of OPERATIONS[operation]) {
        if (!Object.hasOwn(payload, required)) throw new Error('MISSING_DAILY_FIELD');
    }
    if ('language' in payload && !['ru', 'en'].includes(payload.language)) {
        throw new Error('INVALID_LANGUAGE');
    }
    if ('date' in payload &&
        (typeof payload.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date))) {
        throw new Error('INVALID_DAILY_DATE');
    }
    if ('questionId' in payload &&
        (typeof payload.questionId !== 'string' || !payload.questionId ||
         payload.questionId.length > 128)) {
        throw new Error('INVALID_QUESTION_ID');
    }
    if ('answerIndex' in payload &&
        (!Number.isSafeInteger(payload.answerIndex) || payload.answerIndex < 0 ||
         payload.answerIndex > 20)) {
        throw new Error('INVALID_ANSWER');
    }
    return Object.fromEntries(allowed.filter(key => Object.hasOwn(payload, key))
        .map(key => [key, payload[key]]));
}

export function createAuthenticatedDailyChallengeHandler(service) {
    if (!service || Object.keys(OPERATIONS).some(
        operation => typeof service[operation] !== 'function'
    )) throw new Error('INVALID_DAILY_SERVICE');

    return async function handleDailyChallenge(operation, payload, context) {
        const uid = context?.auth?.uid;
        if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
        const now = context?.now;
        if (!Number.isSafeInteger(now) || now < 0) throw new Error('INVALID_SERVER_TIME');
        if (!Object.hasOwn(OPERATIONS, operation)) throw new Error('UNKNOWN_DAILY_OPERATION');
        const data = validatePayload(operation, payload);
        return service[operation]({ ...data, uid, now });
    };
}
