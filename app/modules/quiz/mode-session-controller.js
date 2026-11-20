import { createServerModeClient } from './server-mode-client.js';

function requireQuestion(question) {
    if (!question || typeof question.id !== 'string' || !question.id ||
        typeof question.question !== 'string' || !Array.isArray(question.options) ||
        question.options.length < 2 || question.options.some(option => typeof option !== 'string')) {
        throw new Error('INVALID_SERVER_QUESTION');
    }
    return question;
}

function shuffledIndexes(length, random) {
    const indexes = Array.from({ length }, (_, index) => index);
    for (let index = indexes.length - 1; index > 0; index--) {
        const value = random();
        if (typeof value !== 'number' || value < 0 || value >= 1) {
            throw new Error('INVALID_RANDOM_SOURCE');
        }
        const target = Math.floor(value * (index + 1));
        [indexes[index], indexes[target]] = [indexes[target], indexes[index]];
    }
    return indexes;
}

/**
 * Stateful UI adapter for server-owned mode sessions.
 * The server sends no answer key. The adapter only shuffles visible options
 * and translates the selected visible index back to the server's canonical index.
 */
export function createModeSessionController({ client, invoke, random = Math.random }) {
    const transport = client || createServerModeClient({ invoke });
    if (!transport || ['start', 'answer', 'resume', 'claim'].some(name => typeof transport[name] !== 'function') ||
        typeof random !== 'function') throw new Error('INVALID_MODE_CONTROLLER');

    let state = {
        status: 'idle',
        sessionId: null,
        mode: null,
        totalQuestions: 0,
        answeredQuestions: 0,
        deadlineAt: null,
        questionDeadlineAt: null,
        question: null,
        result: null,
        receipt: null
    };
    let canonicalIndexes = [];

    function present(question) {
        if (question == null) {
            canonicalIndexes = [];
            return null;
        }
        const canonical = requireQuestion(question);
        canonicalIndexes = shuffledIndexes(canonical.options.length, random);
        return {
            id: canonical.id,
            category: canonical.category,
            difficulty: canonical.difficulty,
            text: canonical.question,
            options: canonicalIndexes.map(index => canonical.options[index])
        };
    }

    function snapshot() {
        return { ...state, question: state.question && {
            ...state.question,
            options: [...state.question.options]
        }};
    }

    function acceptQuestion(question) {
        state.question = present(question);
    }

    return Object.freeze({
        getState: snapshot,

        async start(settings) {
            if (state.status === 'starting' || state.status === 'answering' || state.status === 'claiming') {
                throw new Error('MODE_REQUEST_IN_PROGRESS');
            }
            state = { ...state, status: 'starting', result: null, receipt: null, question: null };
            try {
                const started = await transport.start(settings);
                if (typeof started.sessionId !== 'string' || !started.sessionId ||
                    !Number.isSafeInteger(started.deadlineAt) ||
                    !Number.isSafeInteger(started.totalQuestions) || started.totalQuestions < 1) {
                    throw new Error('INVALID_SERVER_RESPONSE');
                }
                state = {
                    status: 'in_progress',
                    sessionId: started.sessionId,
                    mode: started.mode,
                    totalQuestions: started.totalQuestions,
                    answeredQuestions: 0,
                    deadlineAt: started.deadlineAt,
                    questionDeadlineAt: started.questionDeadlineAt ?? null,
                    question: null,
                    result: null,
                    receipt: null
                };
                acceptQuestion(started.question);
                return snapshot();
            } catch (error) {
                state = { ...state, status: 'error' };
                throw error;
            }
        },

        async answerDisplayed(displayIndex, { language = 'ru' } = {}) {
            if (state.status !== 'in_progress' || !state.question) throw new Error('NO_ACTIVE_QUESTION');
            if (!Number.isSafeInteger(displayIndex) || displayIndex < 0 ||
                displayIndex >= canonicalIndexes.length) throw new Error('INVALID_ANSWER');
            const questionId = state.question.id;
            const canonicalIndex = canonicalIndexes[displayIndex];
            state.status = 'answering';
            try {
                const response = await transport.answer({
                    sessionId: state.sessionId,
                    questionId,
                    answerIndex: canonicalIndex,
                    language
                });
                if (!response || typeof response !== 'object') throw new Error('INVALID_SERVER_RESPONSE');
                state.answeredQuestions = Math.min(state.totalQuestions,
                    state.answeredQuestions + (response.replayed ? 0 : 1));
                state.result = response;
                state.questionDeadlineAt = response.questionDeadlineAt ?? null;
                if (response.finished) {
                    state.status = 'ready_to_claim';
                    acceptQuestion(null);
                } else {
                    if (!response.nextQuestion) throw new Error('INVALID_SERVER_RESPONSE');
                    acceptQuestion(response.nextQuestion);
                    state.status = 'in_progress';
                }
                return { response, state: snapshot() };
            } catch (error) {
                state.status = 'in_progress';
                throw error;
            }
        },

        async resume({ sessionId, language = 'ru' }) {
            state = { ...state, status: 'resuming' };
            try {
                const resumed = await transport.resume({ sessionId, language });
                state = {
                    status: resumed.status,
                    sessionId: resumed.sessionId || sessionId,
                    mode: resumed.mode ?? state.mode,
                    totalQuestions: resumed.totalQuestions ?? state.totalQuestions,
                    answeredQuestions: resumed.answeredQuestions ?? state.answeredQuestions,
                    deadlineAt: resumed.deadlineAt ?? state.deadlineAt,
                    questionDeadlineAt: resumed.questionDeadlineAt ?? null,
                    question: null,
                    result: resumed.result ?? null,
                    receipt: resumed.receipt ?? null
                };
                if (resumed.status === 'in_progress') acceptQuestion(resumed.question);
                else canonicalIndexes = [];
                return snapshot();
            } catch (error) {
                state = { ...state, status: 'error' };
                throw error;
            }
        },

        async claim() {
            if (!state.sessionId || !['ready_to_claim', 'ready_to_complete', 'expired', 'completed'].includes(state.status)) {
                throw new Error('SESSION_NOT_READY');
            }
            state.status = 'claiming';
            try {
                const receipt = await transport.claim({ sessionId: state.sessionId });
                state.receipt = receipt;
                state.result = receipt;
                state.status = 'completed';
                return snapshot();
            } catch (error) {
                state.status = 'ready_to_claim';
                throw error;
            }
        }
    });
}
