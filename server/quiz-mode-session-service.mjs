import { randomUUID } from 'node:crypto';
import { selectQuestions, canonicalQuestion, publicQuestion } from './question-delivery.mjs';
import { createModeState, getModeResult } from './quiz-mode-session.mjs';
import { applyCanonicalModeAnswer, resolvePublicMode } from './quiz-mode-answer-core.mjs';

const MODE_LIMITS = Object.freeze({ duel: 7, survival: 100, timetrial: 10 });
const QUESTION_TIME_MS = 15_000;

function validateStart({ uid, now, count, language }) {
    if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
    if (!Number.isSafeInteger(now) || now < 0) throw new Error('INVALID_TIME');
    if (!Number.isSafeInteger(count) || count < 1 || count > 100) throw new Error('INVALID_COUNT');
    if (!['ru', 'en'].includes(language)) throw new Error('INVALID_LANGUAGE');
}

function currentIndex(state) {
    return state.mode === 'duel' ? state.roundsPlayed : state.answeredQuestions;
}

function publicProgress(state) {
    if (state.mode === 'survival') {
        return {
            answeredQuestions: state.answeredQuestions,
            totalQuestions: state.totalQuestions,
            score: state.score,
            lives: state.lives,
            currentStreak: state.currentStreak,
            bestStreak: state.bestStreak
        };
    }
    if (state.mode === 'duel') {
        return {
            answeredQuestions: state.roundsPlayed,
            totalQuestions: state.totalQuestions,
            playerScore: state.playerScore,
            aiScore: state.aiScore,
            playerCorrect: state.playerCorrect,
            aiCorrect: state.aiCorrect
        };
    }
    return {
        answeredQuestions: state.answeredQuestions,
        totalQuestions: state.totalQuestions,
        score: state.score,
        correctAnswers: state.correctAnswers
    };
}

function questionDeadline(state, now, sessionDeadlineAt) {
    return state.mode === 'timetrial' ? Math.min(now + QUESTION_TIME_MS, sessionDeadlineAt) : null;
}

function publicNext(catalog, canonical, language) {
    if (!canonical) return null;
    const question = catalog.get(canonical.id);
    if (!question) throw new Error('QUESTION_NOT_FOUND');
    return publicQuestion(question, language);
}

export function createModeSessionService({
    catalog,
    store,
    sessionDurationMs = 15 * 60 * 1000,
    random = Math.random
}) {
    if (!(catalog instanceof Map) || !store || typeof store.runTransaction !== 'function' ||
        typeof random !== 'function') throw new Error('INVALID_SERVICE_CONFIGURATION');
    if (!Number.isSafeInteger(sessionDurationMs) || sessionDurationMs < 1000) {
        throw new Error('INVALID_DURATION');
    }

    return {
        async start({ uid, mode, category = 'all', difficulty = 'easy', count, language = 'ru', now }) {
            validateStart({ uid, now, count, language });
            const domainMode = resolvePublicMode(mode);
            if (!Object.hasOwn(MODE_LIMITS, domainMode)) throw new Error('UNSUPPORTED_QUIZ_MODE');
            if (!Number.isSafeInteger(now + sessionDurationMs)) throw new Error('INVALID_TIME');
            const selectedCount = Math.min(count, MODE_LIMITS[domainMode]);
            const selected = selectQuestions(catalog, { category, difficulty, count: selectedCount });
            const id = randomUUID();
            const deadlineAt = now + sessionDurationMs;
            const modeState = createModeState(domainMode, {
                difficulty,
                totalQuestions: selected.length
            });
            const session = {
                uid,
                mode,
                domainMode,
                startedAt: now,
                deadlineAt,
                questions: selected.map(canonicalQuestion),
                modeState,
                acceptedAnswers: [],
                questionDeadlineAt: questionDeadline(modeState, now, deadlineAt),
                finalized: false
            };
            await store.runTransaction(async tx => {
                if (await tx.getSession(id)) throw new Error('SESSION_ID_COLLISION');
                await tx.setSession(id, session);
            });
            return {
                sessionId: id,
                mode,
                deadlineAt,
                questionDeadlineAt: session.questionDeadlineAt,
                totalQuestions: selected.length,
                progress: publicProgress(modeState),
                question: publicQuestion(selected[0], language)
            };
        },

        async resume({ uid, sessionId, language = 'ru', now }) {
            if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
            if (typeof sessionId !== 'string' || !sessionId) throw new Error('INVALID_SESSION_ID');
            if (!Number.isSafeInteger(now) || now < 0) throw new Error('INVALID_TIME');
            if (!['ru', 'en'].includes(language)) throw new Error('INVALID_LANGUAGE');
            return store.runTransaction(async tx => {
                const session = await tx.getSession(sessionId);
                if (!session) throw new Error('SESSION_NOT_FOUND');
                if (session.uid !== uid) throw new Error('NOT_SESSION_OWNER');
                if (session.finalized) return {
                    status: 'completed',
                    result: session.result,
                    receipt: session.receipt ?? null
                };
                const index = currentIndex(session.modeState);
                const finished = index >= session.questions.length ||
                    (session.domainMode === 'survival' && session.modeState.lives <= 0);
                const expired = now >= session.deadlineAt;
                const question = !finished && !expired
                    ? publicNext(catalog, session.questions[index], language)
                    : null;
                return {
                    status: finished ? 'ready_to_complete' : expired ? 'expired' : 'in_progress',
                    sessionId,
                    mode: session.mode,
                    answeredQuestions: index,
                    totalQuestions: session.questions.length,
                    progress: publicProgress(session.modeState),
                    deadlineAt: session.deadlineAt,
                    questionDeadlineAt: session.questionDeadlineAt,
                    question
                };
            });
        },

        async answer({ uid, sessionId, questionId, answerIndex, language = 'ru', now }) {
            if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
            if (typeof sessionId !== 'string' || !sessionId) throw new Error('INVALID_SESSION_ID');
            if (typeof questionId !== 'string' || !questionId) throw new Error('INVALID_QUESTION_ID');
            if (!Number.isSafeInteger(now) || now < 0) throw new Error('INVALID_TIME');
            if (!['ru', 'en'].includes(language)) throw new Error('INVALID_LANGUAGE');
            return store.runTransaction(async tx => {
                const stored = await tx.getSession(sessionId);
                if (!stored) throw new Error('SESSION_NOT_FOUND');
                if (stored.uid !== uid) throw new Error('NOT_SESSION_OWNER');
                if (stored.finalized) throw new Error('SESSION_CLOSED');
                if (now < stored.startedAt) throw new Error('INVALID_TIME');
                const prior = stored.acceptedAnswers.find(item => item.questionId === questionId);
                if (prior) {
                    if (prior.answerIndex !== answerIndex) throw new Error('ANSWER_ALREADY_LOCKED');
                    const nextIndex = currentIndex(stored.modeState);
                    return {
                        ...prior.result,
                        replayed: true,
                        progress: publicProgress(stored.modeState),
                        finished: nextIndex >= stored.questions.length ||
                            (stored.domainMode === 'survival' && stored.modeState.lives <= 0),
                        nextQuestion: publicNext(catalog, stored.questions[nextIndex], language)
                    };
                }
                const index = currentIndex(stored.modeState);
                const canonical = stored.questions[index];
                if (!canonical || canonical.id !== questionId) throw new Error('OUT_OF_ORDER');
                const session = structuredClone(stored);
                const aiRandomValue = session.domainMode === 'duel' ? random() : undefined;
                const applied = applyCanonicalModeAnswer({
                    state: session.modeState,
                    question: canonical,
                    answerIndex,
                    now,
                    sessionDeadlineAt: session.deadlineAt,
                    questionDeadlineAt: session.questionDeadlineAt,
                    aiRandomValue
                });
                session.modeState = applied.state;
                session.acceptedAnswers.push({
                    questionId,
                    answerIndex,
                    answeredAt: now,
                    result: applied.result
                });
                const nextIndex = currentIndex(session.modeState);
                const finished = applied.finished;
                session.questionDeadlineAt = !finished && session.domainMode === 'timetrial'
                    ? questionDeadline(session.modeState, now, session.deadlineAt)
                    : null;
                await tx.setSession(sessionId, session);
                return {
                    ...applied.result,
                    finished,
                    replayed: false,
                    progress: publicProgress(session.modeState),
                    questionDeadlineAt: session.questionDeadlineAt,
                    nextQuestion: finished ? null : publicNext(catalog, session.questions[nextIndex], language)
                };
            });
        },

        async complete({ uid, sessionId, now }) {
            if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
            if (typeof sessionId !== 'string' || !sessionId) throw new Error('INVALID_SESSION_ID');
            if (!Number.isSafeInteger(now) || now < 0) throw new Error('INVALID_TIME');
            return store.runTransaction(async tx => {
                const stored = await tx.getSession(sessionId);
                if (!stored) throw new Error('SESSION_NOT_FOUND');
                if (stored.uid !== uid) throw new Error('NOT_SESSION_OWNER');
                if (stored.finalized) return { ...stored.result, alreadyFinalized: true };
                const index = currentIndex(stored.modeState);
                const finished = index >= stored.questions.length ||
                    (stored.domainMode === 'survival' && stored.modeState.lives <= 0);
                if (!finished && now < stored.deadlineAt) throw new Error('SESSION_INCOMPLETE');
                const session = structuredClone(stored);
                const result = getModeResult(session.modeState);
                session.finalized = true;
                session.finalizedAt = now;
                session.result = result;
                await tx.setSession(sessionId, session);
                return { ...result, alreadyFinalized: false };
            });
        }
    };
}
