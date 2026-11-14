import { randomUUID } from 'node:crypto';
import { createSession, submitAnswer } from './quiz-session-core.mjs';
import { selectQuestions, canonicalQuestion, publicQuestion } from './question-delivery.mjs';
import { claimSessionReward } from './quiz-reward-claim.mjs';

// Trusted-backend orchestration contract. Must be mounted behind an authenticated
// server endpoint, not imported by the browser. The store adapter must implement
// serializable transactions. The current Firebase app has not been switched.
export function createQuizService({ catalog, store, sessionDurationMs = 15 * 60 * 1000 }) {
    if (!(catalog instanceof Map) || !store || typeof store.runTransaction !== 'function') {
        throw new Error('INVALID_SERVICE_CONFIGURATION');
    }
    if (!Number.isSafeInteger(sessionDurationMs) || sessionDurationMs < 1000) {
        throw new Error('INVALID_DURATION');
    }

    return {
        async start({ uid, mode, category, difficulty, count, language = 'ru', now }) {
            if (!Number.isSafeInteger(now)) throw new Error('INVALID_TIME');
            const selected = selectQuestions(catalog, { category, difficulty, count });
            const id = randomUUID();
            const session = createSession({
                uid, mode,
                questions: selected.map(canonicalQuestion),
                startedAt: now,
                deadlineAt: now + sessionDurationMs
            });
            await store.runTransaction(async tx => {
                if (await tx.getSession(id)) throw new Error('SESSION_ID_COLLISION');
                await tx.setSession(id, session);
            });
            return {
                sessionId: id,
                deadlineAt: session.deadlineAt,
                totalQuestions: session.questions.length,
                question: publicQuestion(selected[0], language)
            };
        },

        async answer({ uid, sessionId, questionId, answerIndex, language = 'ru', now }) {
            if (typeof sessionId !== 'string' || !sessionId) throw new Error('INVALID_SESSION_ID');
            return store.runTransaction(async tx => {
                const stored = await tx.getSession(sessionId);
                if (!stored) throw new Error('SESSION_NOT_FOUND');
                // Apply modifications only to a copy; failed requests must not
                // mutate an object cached by the persistence adapter.
                const session = structuredClone(stored);
                const outcome = submitAnswer(session, {
                    uid, questionId, answerIndex, at: now
                });
                await tx.setSession(sessionId, session);
                const next = session.questions[session.answers.length];
                const nextQuestion = next ? catalog.get(next.id) : null;
                if (next && !nextQuestion) throw new Error('QUESTION_NOT_FOUND');
                return {
                    correct: outcome.correct,
                    points: outcome.points,
                    finished: outcome.finished,
                    nextQuestion: nextQuestion ? publicQuestion(nextQuestion, language) : null
                };
            });
        },

        async complete({ uid, sessionId, now }) {
            return claimSessionReward({ store, sessionId, uid, at: now });
        }
    };
}
