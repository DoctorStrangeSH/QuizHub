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

        async resume({ uid, sessionId, language = 'ru', now }) {
            if (typeof sessionId !== 'string' || !sessionId) throw new Error('INVALID_SESSION_ID');
            if (!Number.isSafeInteger(now)) throw new Error('INVALID_TIME');
            return store.runTransaction(async tx => {
                const session = await tx.getSession(sessionId);
                if (!session) throw new Error('SESSION_NOT_FOUND');
                if (session.uid !== uid) throw new Error('NOT_SESSION_OWNER');
                if (session.finalized) {
                    // Return the existing receipt only to the session owner.
                    return {
                        status: 'completed',
                        receipt: session.receipt ? { ...session.receipt, alreadyClaimed: true } : null
                    };
                }
                const answeredQuestions = session.answers.length;
                const finished = answeredQuestions === session.questions.length;
                const expired = now >= session.deadlineAt;
                const next = !finished && !expired ? session.questions[answeredQuestions] : null;
                const question = next ? catalog.get(next.id) : null;
                if (next && !question) throw new Error('QUESTION_NOT_FOUND');
                return {
                    status: expired ? 'expired' : finished ? 'ready_to_complete' : 'in_progress',
                    sessionId,
                    deadlineAt: session.deadlineAt,
                    answeredQuestions,
                    totalQuestions: session.questions.length,
                    question: question ? publicQuestion(question, language) : null
                };
            });
        },

        async answer({ uid, sessionId, questionId, answerIndex, language = 'ru', now }) {
            if (typeof sessionId !== 'string' || !sessionId) throw new Error('INVALID_SESSION_ID');
            return store.runTransaction(async tx => {
                const stored = await tx.getSession(sessionId);
                if (!stored) throw new Error('SESSION_NOT_FOUND');
                if (stored.uid !== uid) throw new Error('NOT_SESSION_OWNER');
                // A request may be retried after a network timeout when the
                // original answer was already committed. Replay only an exact
                // match; never allow changing a previously recorded answer.
                const previousIndex = stored.answers.findIndex(answer => answer.questionId === questionId);
                if (previousIndex !== -1) {
                    if (stored.finalized) throw new Error('SESSION_CLOSED');
                    const previous = stored.answers[previousIndex];
                    if (previous.answerIndex !== answerIndex) throw new Error('ANSWER_ALREADY_LOCKED');
                    const canonical = stored.questions[previousIndex];
                    if (!canonical || canonical.id !== questionId) throw new Error('INVALID_ANSWER_LOG');
                    const next = stored.questions[stored.answers.length];
                    const nextQuestion = next && now <= stored.deadlineAt ? catalog.get(next.id) : null;
                    if (next && now <= stored.deadlineAt && !nextQuestion) throw new Error('QUESTION_NOT_FOUND');
                    return {
                        correct: previous.answerIndex === canonical.correctIndex,
                        points: previous.answerIndex === canonical.correctIndex ? canonical.points : 0,
                        finished: stored.answers.length === stored.questions.length,
                        nextQuestion: nextQuestion ? publicQuestion(nextQuestion, language) : null,
                        replayed: true
                    };
                }
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
                    nextQuestion: nextQuestion ? publicQuestion(nextQuestion, language) : null,
                    replayed: false
                };
            });
        },

        async complete({ uid, sessionId, now }) {
            return claimSessionReward({ store, sessionId, uid, at: now });
        }
    };
}
