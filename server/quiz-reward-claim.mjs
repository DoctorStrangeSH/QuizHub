import { finalizeSession } from './quiz-session-core.mjs';
import { calculateQuizRewards } from '../app/modules/quiz/rewards.js';
import { advanceAchievementFacts } from './achievement-progress.mjs';

// Storage-independent transaction coordinator. The production adapter MUST
// implement one atomic, retryable transaction across session and user records:
// store.runTransaction(async tx => ...), tx.getSession(), tx.getUser(),
// tx.setSession(), tx.setUser(). Neither the API nor Firestore adapter is live.
export async function claimSessionReward({ store, sessionId, uid, at }) {
    if (!store || typeof store.runTransaction !== 'function') throw new Error('TRANSACTION_REQUIRED');
    if (typeof sessionId !== 'string' || !sessionId.trim()) throw new Error('INVALID_SESSION_ID');
    if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');

    return store.runTransaction(async transaction => {
        const stored = await transaction.getSession(sessionId);
        if (!stored) throw new Error('SESSION_NOT_FOUND');
        if (stored.uid !== uid) throw new Error('NOT_SESSION_OWNER');
        if (stored.finalized) {
            if (!stored.receipt) throw new Error('MISSING_RECEIPT');
            return { ...stored.receipt, alreadyClaimed: true };
        }

        const session = structuredClone(stored);
        const result = finalizeSession(session, { uid, at });
        // All points come from the server-owned answer key and answer log.
        // Event bonuses must also be resolved server-side when integrated.
        const { xp, coins } = calculateQuizRewards(result.score);
        // Preserve the existing Classic win rule: at least 70% correct.
        const won = result.correctAnswers >= Math.ceil(result.totalQuestions * 0.7);
        const perfect = result.totalQuestions === 10 && result.correctAnswers === 10;
        const user = await transaction.getUser(uid);
        if (!user) throw new Error('USER_NOT_FOUND');
        const stats = user.stats ?? {};
        if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
            throw new Error('INVALID_USER_STATS');
        }
        const current = value => {
            if (value === undefined) return 0;
            if (!Number.isSafeInteger(value) || value < 0) throw new Error('INVALID_USER_BALANCE');
            return value;
        };
        const add = (value, delta) => {
            const updated = current(value) + delta;
            if (!Number.isSafeInteger(updated)) throw new Error('BALANCE_OVERFLOW');
            return updated;
        };
        const achievementProgress = advanceAchievementFacts({
            previousFacts: await transaction.getAchievementFacts(uid),
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
                ...stats,
                totalGames: add(stats.totalGames, 1),
                totalQuestions: add(stats.totalQuestions, result.answeredQuestions),
                correctAnswers: add(stats.correctAnswers, result.correctAnswers),
                totalWins: add(stats.totalWins, Number(won))
            }
        };

        const receipt = { sessionId, uid, ...result, xp, coins, won, perfect, newlyUnlocked: achievementProgress.newlyUnlocked };
        session.receipt = receipt;
        await transaction.setAchievementFacts(uid, achievementProgress.facts);
        await transaction.createAchievementReceipts(uid, achievementProgress.newlyUnlocked);
        await transaction.setUser(uid, nextUser);
        await transaction.setSession(sessionId, session);
        return { ...receipt, alreadyClaimed: false };
    });
}
