const LANGUAGES = new Set(['ru', 'en']);

function unwrap(response) {
    return response && typeof response === 'object' && 'data' in response
        ? response.data
        : response;
}

function requireDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('INVALID_DAILY_DATE');
    }
    const timestamp = Date.parse(value + 'T00:00:00.000Z');
    if (!Number.isFinite(timestamp) ||
        new Date(timestamp).toISOString().slice(0, 10) !== value) {
        throw new Error('INVALID_DAILY_DATE');
    }
    return value;
}

export function createDailyChallengeClient({ invoke } = {}) {
    if (typeof invoke !== 'function') throw new Error('INVALID_DAILY_CHALLENGE_TRANSPORT');

    async function request(operation, payload) {
        try {
            const result = unwrap(await invoke({ operation, payload }));
            if (!result || typeof result !== 'object' || Array.isArray(result)) {
                throw new Error('INVALID_DAILY_SERVER_RESPONSE');
            }
            return result;
        } catch (error) {
            if (error instanceof Error && error.message === 'INVALID_DAILY_SERVER_RESPONSE') throw error;
            const code = error?.code || error?.message || 'unknown';
            const mapped = {
                unauthenticated: 'AUTH_REQUIRED',
                'permission-denied': 'NOT_DAILY_ATTEMPT_OWNER',
                'not-found': 'DAILY_ATTEMPT_NOT_FOUND',
                'failed-precondition': 'DAILY_SESSION_NOT_READY',
                unavailable: 'NETWORK_UNAVAILABLE',
                'deadline-exceeded': 'NETWORK_TIMEOUT'
            }[code] || 'DAILY_CHALLENGE_REQUEST_FAILED';
            const safe = new Error(mapped);
            safe.cause = error;
            throw safe;
        }
    }

    return Object.freeze({
        async start({ language = 'ru' } = {}) {
            if (!LANGUAGES.has(language)) throw new Error('INVALID_LANGUAGE');
            return request('start', { language });
        },
        async resume({ date, language = 'ru' }) {
            requireDate(date);
            if (!LANGUAGES.has(language)) throw new Error('INVALID_LANGUAGE');
            return request('resume', { date, language });
        },
        async answer({ date, questionId, answerIndex, language = 'ru' }) {
            requireDate(date);
            if (typeof questionId !== 'string' || !questionId.trim() || questionId.length > 128) {
                throw new Error('INVALID_QUESTION_ID');
            }
            if (!Number.isSafeInteger(answerIndex) || answerIndex < 0 || answerIndex > 20) {
                throw new Error('INVALID_ANSWER');
            }
            if (!LANGUAGES.has(language)) throw new Error('INVALID_LANGUAGE');
            return request('answer', { date, questionId, answerIndex, language });
        },
        async complete({ date }) {
            requireDate(date);
            return request('complete', { date });
        }
    });
}
