import { createHash } from 'node:crypto';
import { createSession, submitAnswer, finalizeSession } from './quiz-session-core.mjs';
import { canonicalQuestion, publicQuestion } from './question-delivery.mjs';

// Backend-only contract. Requires a serializable transactional store that supports
// getDailyAttempt(key) and setDailyAttempt(key, value). Never serve this catalog
// or its answer key to the browser.
const PLAN = [['easy', 3], ['medium', 3], ['hard', 4]];
const DAY_MS = 24 * 60 * 60 * 1000;

export function utcDailyKey(now) {
    if (!Number.isSafeInteger(now) || now < 0) throw new Error('INVALID_SERVER_TIME');
    return new Date(now).toISOString().slice(0, 10);
}

export function selectServerDailyQuestions(catalog, date) {
    if (!(catalog instanceof Map) || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        new Date(date + 'T00:00:00.000Z').toISOString().slice(0, 10) !== date) {
        throw new Error('INVALID_DAILY_SELECTION');
    }
    const chosen = [];
    for (const [difficulty, count] of PLAN) {
        const pool = [...catalog.values()].filter(question => question.difficulty === difficulty);
        if (pool.length < count) throw new Error('NOT_ENOUGH_DAILY_QUESTIONS');
        pool.sort((a, b) => {
            const rank = q => createHash('sha256').update(date + ':' + difficulty + ':' + q.id).digest('hex');
            return rank(a).localeCompare(rank(b)) || a.id.localeCompare(b.id);
        });
        chosen.push(...pool.slice(0, count));
    }
    return chosen;
}

function assertUid(uid) {
    if (typeof uid !== 'string' || !uid.trim() || uid.includes('/')) throw new Error('AUTH_REQUIRED');
}

export function createServerDailyChallenge({ catalog, store, durationMs = 15 * 60 * 1000 }) {
    if (!(catalog instanceof Map) || !store || typeof store.runTransaction !== 'function' ||
        !Number.isSafeInteger(durationMs) || durationMs < 1000 || durationMs > DAY_MS) {
        throw new Error('INVALID_DAILY_CONFIGURATION');
    }

    const attemptKey = (uid, day) => JSON.stringify([day, uid]);
    const view = (attempt, language, now) => {
        const answered = attempt.session.answers.length;
        const finished = answered === attempt.session.questions.length;
        const expired = now >= attempt.session.deadlineAt;
        const next = !finished && !expired ? attempt.session.questions[answered] : null;
        const question = next ? catalog.get(next.id) : null;
        if (next && !question) throw new Error('QUESTION_NOT_FOUND');
        return {
            date: attempt.date, status: attempt.receipt ? 'completed' :
                finished ? 'ready_to_complete' : expired ? 'expired' : 'in_progress',
            deadlineAt: attempt.session.deadlineAt,
            answeredQuestions: answered,
            totalQuestions: attempt.session.questions.length,
            question: question ? publicQuestion(question, language) : null,
            receipt: attempt.receipt ? { ...attempt.receipt } : null
        };
    };
    const check = (uid, date, now, allowPriorDay = false) => {
        assertUid(uid);
        const today = utcDailyKey(now);
        const yesterday = utcDailyKey(Math.max(0, now - DAY_MS));
        if (typeof date !== 'string' || (date !== today && !(allowPriorDay && date === yesterday))) {
            throw new Error('INVALID_DAILY_DATE');
        }
    };
    return {
        async start({ uid, now, language = 'ru' }) {
            assertUid(uid);
            const date = utcDailyKey(now);
            const key = attemptKey(uid, date);
            return store.runTransaction(async tx => {
                const existing = await tx.getDailyAttempt(key);
                if (existing) return { ...view(existing, language, now), alreadyStarted: true };
                const questions = selectServerDailyQuestions(catalog, date);
                const midnight = Date.parse(date + 'T00:00:00.000Z') + DAY_MS;
                const session = createSession({
                    uid, mode: 'daily', questions: questions.map(canonicalQuestion),
                    startedAt: now, deadlineAt: Math.min(now + durationMs, midnight)
                });
                const attempt = { uid, date, session, receipt: null };
                await tx.setDailyAttempt(key, attempt);
                return { ...view(attempt, language, now), alreadyStarted: false };
            });
        },
        async resume({ uid, date, now, language = 'ru' }) {
            check(uid, date, now, true);
            return store.runTransaction(async tx => {
                const attempt = await tx.getDailyAttempt(attemptKey(uid, date));
                if (!attempt || attempt.uid !== uid) throw new Error('DAILY_ATTEMPT_NOT_FOUND');
                return view(attempt, language, now);
            });
        },
        async answer({ uid, date, now, questionId, answerIndex, language = 'ru' }) {
            check(uid, date, now);
            return store.runTransaction(async tx => {
                const key = attemptKey(uid, date);
                const stored = await tx.getDailyAttempt(key);
                if (!stored || stored.uid !== uid) throw new Error('DAILY_ATTEMPT_NOT_FOUND');
                if (stored.receipt) throw new Error('SESSION_CLOSED');
                const attempt = structuredClone(stored);
                const previous = attempt.session.answers.find(answer => answer.questionId === questionId);
                if (previous) {
                    if (previous.answerIndex !== answerIndex) throw new Error('ANSWER_ALREADY_LOCKED');
                    return { ...view(attempt, language, now), replayed: true };
                }
                submitAnswer(attempt.session, { uid, questionId, answerIndex, at: now });
                await tx.setDailyAttempt(key, attempt);
                return { ...view(attempt, language, now), replayed: false };
            });
        },
        async complete({ uid, date, now }) {
            check(uid, date, now, true);
            return store.runTransaction(async tx => {
                const key = attemptKey(uid, date);
                const stored = await tx.getDailyAttempt(key);
                if (!stored || stored.uid !== uid) throw new Error('DAILY_ATTEMPT_NOT_FOUND');
                if (stored.receipt) return { ...stored.receipt, alreadyCompleted: true };
                const attempt = structuredClone(stored);
                const result = finalizeSession(attempt.session, { uid, at: now });
                // A score receipt is not an economy reward. Production leaderboard
                // and rewards require an authenticated Functions endpoint and rules.
                attempt.receipt = { uid, date, ...result };
                await tx.setDailyAttempt(key, attempt);
                return { ...attempt.receipt, alreadyCompleted: false };
            });
        }
    };
}
