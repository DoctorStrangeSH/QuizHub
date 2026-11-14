import { finalizeSession } from './quiz-session-core.mjs';
import { calculateQuizRewards } from '../app/modules/quiz/rewards.js';

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
        const user = await transaction.getUser(uid);
        if (!user) throw new Error('USER_NOT_FOUND');
        const stats = user.stats || {};
        const current = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
        const nextUser = {
            ...user,
            experience: current(user.experience) + xp,
            weeklyExperience: current(user.weeklyExperience) + xp,
            coins: current(user.coins) + coins,
            quizzesCompleted: current(user.quizzesCompleted) + 1,
            stats: {
                ...stats,
                totalGames: current(stats.totalGames) + 1,
                totalQuestions: current(stats.totalQuestions) + result.answeredQuestions,
                correctAnswers: current(stats.correctAnswers) + result.correctAnswers
            }
        };

        const receipt = { sessionId, uid, ...result, xp, coins };
        session.receipt = receipt;
        await transaction.setUser(uid, nextUser);
        await transaction.setSession(sessionId, session);
        return { ...receipt, alreadyClaimed: false };
    });
}
