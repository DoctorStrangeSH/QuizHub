const DEFAULT_MODE_NAMES = ['duel', 'survival', 'time'];
const LANGUAGES = new Set(['ru', 'en']);

function requireString(value, code) {
    if (typeof value !== 'string' || !value.trim()) throw new Error(code);
    return value;
}

function unwrap(response) {
    return response && typeof response === 'object' && 'data' in response
        ? response.data
        : response;
}

/**
 * Thin browser transport for the emulator-preview server callable.
 * It deliberately has no Firestore writes and never sends uid, score,
 * correctness, answer keys, reward values or client timestamps.
 */
export function createServerModeClient({ invoke, claimOperation = 'claim', supportedModes = DEFAULT_MODE_NAMES } = {}) {
    if (typeof invoke !== 'function' || !Array.isArray(supportedModes) ||
        supportedModes.some(mode => typeof mode !== 'string' || !['classic', 'duel', 'survival', 'time'].includes(mode))) {
        throw new Error('INVALID_MODE_TRANSPORT');
    }
    const modeNames = new Set(supportedModes);

    async function request(operation, payload) {
        try {
            const result = unwrap(await invoke({ operation, payload }));
            if (!result || typeof result !== 'object' || Array.isArray(result)) {
                throw new Error('INVALID_SERVER_RESPONSE');
            }
            return result;
        } catch (error) {
            if (error instanceof Error && error.message === 'INVALID_SERVER_RESPONSE') throw error;
            const code = error?.code || error?.message || 'unknown';
            const mapped = {
                'unauthenticated': 'AUTH_REQUIRED',
                'permission-denied': 'NOT_SESSION_OWNER',
                'not-found': 'SESSION_NOT_FOUND',
                'failed-precondition': 'SESSION_NOT_READY',
                'unavailable': 'NETWORK_UNAVAILABLE',
                'deadline-exceeded': 'NETWORK_TIMEOUT'
            }[code] || 'MODE_REQUEST_FAILED';
            const safe = new Error(mapped);
            safe.cause = error;
            throw safe;
        }
    }

    return Object.freeze({
        async start({ mode, category = 'all', difficulty = 'easy', count, language = 'ru' }) {
            if (!modeNames.has(mode)) throw new Error('UNSUPPORTED_QUIZ_MODE');
            if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new Error('INVALID_DIFFICULTY');
            if (!Number.isSafeInteger(count) || count < 1 || count > 100) throw new Error('INVALID_COUNT');
            if (!LANGUAGES.has(language)) throw new Error('INVALID_LANGUAGE');
            return request('start', { mode, category, difficulty, count, language });
        },

        async answer({ sessionId, questionId, answerIndex, language = 'ru' }) {
            requireString(sessionId, 'INVALID_SESSION_ID');
            requireString(questionId, 'INVALID_QUESTION_ID');
            if (!Number.isSafeInteger(answerIndex) || answerIndex < 0) {
                throw new Error('INVALID_ANSWER');
            }
            if (!LANGUAGES.has(language)) throw new Error('INVALID_LANGUAGE');
            return request('answer', { sessionId, questionId, answerIndex, language });
        },

        async resume({ sessionId, language = 'ru' }) {
            requireString(sessionId, 'INVALID_SESSION_ID');
            if (!LANGUAGES.has(language)) throw new Error('INVALID_LANGUAGE');
            return request('resume', { sessionId, language });
        },

        async claim({ sessionId }) {
            requireString(sessionId, 'INVALID_SESSION_ID');
            return request(claimOperation, { sessionId });
        }
    });
}
