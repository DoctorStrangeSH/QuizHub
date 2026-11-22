import { createAccountLedgerEntry } from './account-ledger-entry.mjs';

const DAY_MS = 86_400_000;
export const DAILY_LOGIN_REWARDS = Object.freeze([10, 20, 30, 50, 75, 100, 200]);

export function createDailyLoginRewardService({ store }) {
    if (!store || typeof store.runTransaction !== 'function') throw new Error('INVALID_DAILY_LOGIN_STORE');
    return {
        async claim({ uid, now }) {
            if (typeof uid !== 'string' || !uid.trim() || uid.includes('/')) throw new Error('AUTH_REQUIRED');
            if (!Number.isSafeInteger(now) || now < 0 || !Number.isFinite(new Date(now).getTime())) {
                throw new Error('INVALID_SERVER_TIME');
            }
            const date = new Date(now).toISOString().slice(0, 10);
            const todayStart = Date.parse(date + 'T00:00:00.000Z');
            const yesterday = new Date(todayStart - DAY_MS).toISOString().slice(0, 10);
            const key = JSON.stringify([date, uid]);

            return store.runTransaction(async tx => {
                const previous = await tx.getDailyLoginClaim(key);
                if (previous) return { ...previous, alreadyClaimed: true };

                const user = await tx.getUser(uid);
                if (!user) throw new Error('USER_NOT_FOUND');
                const coins = user.coins === undefined ? 0 : user.coins;
                const previousStreak = user.dailyStreak === undefined ? 0 : user.dailyStreak;
                if (!Number.isSafeInteger(coins) || coins < 0 ||
                    !Number.isSafeInteger(previousStreak) || previousStreak < 0) {
                    throw new Error('INVALID_USER_BALANCE');
                }

                const last = user.lastDailyClaim;
                let lastDate = null;
                if (last instanceof Date && Number.isFinite(last.getTime())) {
                    lastDate = last.toISOString().slice(0, 10);
                } else if (last && typeof last.toDate === 'function') {
                    const value = last.toDate();
                    if (value instanceof Date && Number.isFinite(value.getTime())) lastDate = value.toISOString().slice(0, 10);
                } else if (last && typeof last.toMillis === 'function') {
                    const value = last.toMillis();
                    if (Number.isSafeInteger(value)) lastDate = new Date(value).toISOString().slice(0, 10);
                } else if (typeof last === 'number' && Number.isSafeInteger(last)) {
                    lastDate = new Date(last).toISOString().slice(0, 10);
                }

                if (lastDate === date) {
                    // Handles legacy profiles whose last-claim timestamp predates
                    // the new immutable claim receipt collection.
                    throw new Error('DAILY_ALREADY_CLAIMED');
                }
                const streak = lastDate === yesterday ? previousStreak + 1 : 1;
                if (!Number.isSafeInteger(streak) || streak < 1) throw new Error('INVALID_DAILY_STREAK');
                const reward = DAILY_LOGIN_REWARDS[Math.min(streak - 1, DAILY_LOGIN_REWARDS.length - 1)];
                const balance = coins + reward;
                if (!Number.isSafeInteger(balance)) throw new Error('INVALID_USER_BALANCE');
                const receipt = { uid, date, streak, coins: reward, balance, claimedAt: now };
                await tx.setUserPatch(uid, { coins: balance, dailyStreak: streak, lastDailyClaim: new Date(now) });
                await tx.setDailyLoginClaim(key, receipt);
                await tx.createLedgerEntry(createAccountLedgerEntry({
                    uid, type: 'daily_login_reward', sourceId: date, occurredAt: now,
                    coinsDelta: reward
                }));
                return { ...receipt, alreadyClaimed: false };
            });
        }
    };
}
