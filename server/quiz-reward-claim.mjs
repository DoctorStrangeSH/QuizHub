import { createAccountLedgerEntry } from './account-ledger-entry.mjs';
import { finalizeSession } from './quiz-session-core.mjs';
import { calculateQuizRewards } from '../app/modules/quiz/rewards.js';
import { advanceAchievementFacts } from './achievement-progress.mjs';
import { getServerQuizRewardMultipliers } from './quiz-event-rewards.mjs';

// Storage-independent transaction coordinator. The production adapter MUST
// implement one atomic, retryable transaction across session and user records.
// Event time is supplied by the authenticated callable's server clock; the
// IANA timezone is read only from the stored user profile.
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
        const user = await transaction.getUser(uid);
        if (!user) throw new Error('USER_NOT_FOUND');
        const rewardMultipliers = getServerQuizRewardMultipliers({
            at,
            timeZone: user.timeZone ?? 'UTC'
        });
        // All points and event multipliers come from trusted server data.
        const { xp, coins } = calculateQuizRewards(result.score, rewardMultipliers);
        // Preserve the existing Classic win rule: at least 70% correct.
        const won = result.correctAnswers >= Math.ceil(result.totalQuestions * 0.7);
        const perfect = result.totalQuestions === 10 && result.correctAnswers === 10;
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
            ...(achievementProgress.facts.baselineTrusted === true ? { level: achievementProgress.facts.level } : {}),
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

        const receipt = {
            sessionId, uid, ...result, xp, coins, won, perfect,
            rewardMultipliers: {
                xp: rewardMultipliers.xpMultiplier,
                coins: rewardMultipliers.coinMultiplier
            },
            activeRewardEvents: rewardMultipliers.activeEventIds,
            newlyUnlocked: achievementProgress.newlyUnlocked
        };
        session.receipt = receipt;
        await transaction.setAchievementFacts(uid, achievementProgress.facts);
        await transaction.createAchievementReceipts(uid, achievementProgress.newlyUnlocked);
        await transaction.setUser(uid, nextUser);
        await transaction.setSession(sessionId, session);
        await transaction.createLedgerEntry(createAccountLedgerEntry({
            uid, type: 'quiz_reward', sourceId: sessionId, occurredAt: at,
            coinsDelta: coins, xpDelta: xp
        }));
        return { ...receipt, alreadyClaimed: false };
    });
}
