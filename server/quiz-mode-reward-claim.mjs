import { getModeResult } from './quiz-mode-session.mjs';
import { hasModeWin } from './quiz-mode-rules.mjs';
import { calculateQuizRewards } from '../app/modules/quiz/rewards.js';
import { advanceAchievementFacts } from './achievement-progress.mjs';

function nonNegative(value, code) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(code);
    return value;
}

function validateModeState(state, session) {
    if (!state || state.mode !== session.domainMode ||
        !Array.isArray(session.questions) || !Array.isArray(session.acceptedAnswers)) {
        throw new Error('INVALID_MODE_SESSION');
    }

    const expected = state.mode === 'duel' ? state.roundsPlayed : state.answeredQuestions;
    nonNegative(expected, 'INVALID_MODE_PROGRESS');
    if (expected !== session.acceptedAnswers.length || expected > session.questions.length) {
        throw new Error('INVALID_MODE_ANSWER_LOG');
    }

    if (state.mode === 'duel') {
        if (!Array.isArray(state.roundLog) || state.roundLog.length !== expected) {
            throw new Error('INVALID_MODE_ANSWER_LOG');
        }
        let playerScore = 0;
        let aiScore = 0;
        let playerCorrect = 0;
        let aiCorrect = 0;
        for (let i = 0; i < expected; i++) {
            const round = state.roundLog[i];
            const accepted = session.acceptedAnswers[i];
            if (!round || round.round !== i + 1 ||
                typeof round.playerCorrect !== 'boolean' ||
                typeof round.aiCorrect !== 'boolean' ||
                round.points !== (round.playerCorrect ? session.questions[i].points : 0) ||
                round.aiPoints !== (round.aiCorrect ? session.questions[i].points : 0) ||
                accepted.questionId !== session.questions[i].id ||
                accepted.result?.correct !== round.playerCorrect ||
                accepted.result?.aiCorrect !== round.aiCorrect) {
                throw new Error('INVALID_MODE_ANSWER_LOG');
            }
            playerScore += round.points;
            aiScore += round.aiPoints;
            playerCorrect += Number(round.playerCorrect);
            aiCorrect += Number(round.aiCorrect);
        }
        if (playerScore !== state.playerScore || aiScore !== state.aiScore ||
            playerCorrect !== state.playerCorrect || aiCorrect !== state.aiCorrect) {
            throw new Error('INVALID_MODE_RESULT');
        }
    } else {
        if (!Array.isArray(state.answerLog) || state.answerLog.length !== expected) {
            throw new Error('INVALID_MODE_ANSWER_LOG');
        }
        let score = 0;
        let correctAnswers = 0;
        let currentStreak = 0;
        let bestStreak = 0;
        for (let i = 0; i < expected; i++) {
            const answer = state.answerLog[i];
            const accepted = session.acceptedAnswers[i];
            const question = session.questions[i];
            if (!answer || answer.question !== i + 1 ||
                typeof answer.correct !== 'boolean' ||
                accepted.questionId !== question.id ||
                accepted.result?.correct !== answer.correct) {
                throw new Error('INVALID_MODE_ANSWER_LOG');
            }
            if (state.mode === 'survival') {
                const points = answer.correct ? question.points : 0;
                if (answer.points !== points || accepted.result.points !== points) {
                    throw new Error('INVALID_MODE_ANSWER_LOG');
                }
                score += points;
                correctAnswers += Number(answer.correct);
                currentStreak = answer.correct ? currentStreak + 1 : 0;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                if (!Number.isSafeInteger(answer.remainingMs) || answer.remainingMs < 0 ||
                    answer.remainingMs > 15_000) throw new Error('INVALID_MODE_ANSWER_LOG');
                const points = answer.correct
                    ? question.points + (answer.remainingMs > 10_000 ? 5 : 0) : 0;
                if (answer.points !== points || answer.speedBonus !== points - (answer.correct ? question.points : 0) ||
                    accepted.result.points !== points) throw new Error('INVALID_MODE_ANSWER_LOG');
                score += points;
                correctAnswers += Number(answer.correct);
            }
        }
        if (score !== state.score || correctAnswers !== state.correctAnswers) {
            throw new Error('INVALID_MODE_RESULT');
        }
        if (state.mode === 'survival' &&
            (bestStreak !== state.bestStreak || currentStreak !== state.currentStreak ||
             state.lives !== 3 - (expected - correctAnswers))) {
            throw new Error('INVALID_MODE_RESULT');
        }
    }
    return getModeResult(state);
}

function add(current, delta) {
    const value = current === undefined ? 0 : nonNegative(current, 'INVALID_USER_BALANCE');
    const next = value + delta;
    if (!Number.isSafeInteger(next)) throw new Error('BALANCE_OVERFLOW');
    return next;
}

export async function claimModeSessionReward({ store, sessionId, uid, at }) {
    if (!store || typeof store.runTransaction !== 'function') throw new Error('TRANSACTION_REQUIRED');
    if (typeof sessionId !== 'string' || !sessionId.trim()) throw new Error('INVALID_SESSION_ID');
    if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
    if (!Number.isSafeInteger(at) || at < 0) throw new Error('INVALID_TIME');

    return store.runTransaction(async tx => {
        const session = await tx.getSession(sessionId);
        if (!session) throw new Error('SESSION_NOT_FOUND');
        if (session.uid !== uid) throw new Error('NOT_SESSION_OWNER');
        if (session.receipt) return { ...session.receipt, alreadyClaimed: true };
        if (session.finalized) throw new Error('SESSION_CLOSED');
        if (at < session.startedAt) throw new Error('INVALID_TIME');

        const state = session.modeState;
        const progress = state?.mode === 'duel' ? state.roundsPlayed : state?.answeredQuestions;
        const finished = progress >= session.questions.length ||
            (state?.mode === 'survival' && state.lives <= 0);
        if (!finished && at < session.deadlineAt) throw new Error('SESSION_INCOMPLETE');

        const result = validateModeState(state, session);
        const { xp, coins } = calculateQuizRewards(result.score);
        const user = await tx.getUser(uid);
        if (!user) throw new Error('USER_NOT_FOUND');
        if (!user.stats || typeof user.stats !== 'object' || Array.isArray(user.stats)) {
            throw new Error('INVALID_USER_STATS');
        }

        const won = state.mode === 'duel'
            ? result.outcome === 'win'
            : state.mode === 'timetrial'
                ? hasModeWin({ correctAnswers: result.correctAnswers, totalQuestions: result.totalQuestions })
                : false;
        const perfect = result.totalQuestions === 10 && result.correctAnswers === 10;
        const achievementProgress = advanceAchievementFacts({
            previousFacts: await tx.getAchievementFacts(uid),
            previousAchievements: user.achievements,
            experienceDelta: xp,
            winDelta: Number(won),
            perfectDelta: Number(perfect)
        });
        const nextUser = {
            ...user,
            achievements: achievementProgress.achievements,
            experience: add(user.experience, xp),
            weeklyExperience: add(user.weeklyExperience, xp),
            coins: add(user.coins, coins),
            quizzesCompleted: add(user.quizzesCompleted, 1),
            wins: add(user.wins, Number(won)),
            stats: {
                ...user.stats,
                totalGames: add(user.stats.totalGames, 1),
                totalQuestions: add(user.stats.totalQuestions, result.answeredQuestions ?? progress),
                correctAnswers: add(user.stats.correctAnswers, result.correctAnswers),
                totalWins: add(user.stats.totalWins, Number(won)),
                ...(state.mode === 'survival' ? {
                    bestStreak: Math.max(
                        add(user.stats.bestStreak, 0),
                        result.bestStreak
                    )
                } : {})
            }
        };
        const receipt = { sessionId, uid, ...result, xp, coins, won, perfect, newlyUnlocked: achievementProgress.newlyUnlocked };
        const updated = structuredClone(session);
        updated.finalized = true;
        updated.finalizedAt = at;
        updated.result = result;
        updated.receipt = receipt;
        await tx.setAchievementFacts(uid, achievementProgress.facts);
        await tx.createAchievementReceipts(uid, achievementProgress.newlyUnlocked);
        await tx.setUser(uid, nextUser);
        await tx.setSession(sessionId, updated);
        return { ...receipt, alreadyClaimed: false };
    });
}
