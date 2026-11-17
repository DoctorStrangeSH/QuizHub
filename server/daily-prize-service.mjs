import { buildDailyLeaderboard } from './daily-leaderboard.mjs';

// Proposed competitive reward policy. This is a backend-only transaction
// contract; it does not touch real Firebase balances until deployed with a
// verified storage adapter and authenticated endpoint.
export const DAILY_PRIZES = Object.freeze([
    Object.freeze({ maxRank: 1, xp: 200, coins: 100 }),
    Object.freeze({ maxRank: 3, xp: 120, coins: 60 }),
    Object.freeze({ maxRank: 10, xp: 40, coins: 20 })
]);

function addBalance(value, delta) {
    const previous = value === undefined ? 0 : value;
    if (!Number.isSafeInteger(previous) || previous < 0 ||
        !Number.isSafeInteger(previous + delta)) {
        throw new Error('INVALID_USER_BALANCE');
    }
    return previous + delta;
}

export function dailyPrizeForRank(rank) {
    if (!Number.isSafeInteger(rank) || rank < 1) return { xp: 0, coins: 0 };
    const tier = DAILY_PRIZES.find(prize => rank <= prize.maxRank);
    return tier ? { xp: tier.xp, coins: tier.coins } : { xp: 0, coins: 0 };
}

export function createDailyPrizeService(store) {
    if (!store || typeof store.runTransaction !== 'function') {
        throw new Error('TRANSACTION_REQUIRED');
    }
    return {
        async claim({ uid, date, now }) {
            if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
            if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
                !Number.isSafeInteger(now) || now < 0) {
                throw new Error('INVALID_DAILY_PRIZE_REQUEST');
            }
            const midnight = Date.parse(date + 'T00:00:00.000Z');
            if (!Number.isFinite(midnight) ||
                new Date(midnight).toISOString().slice(0, 10) !== date ||
                now < midnight + 24 * 60 * 60 * 1000) {
                throw new Error('DAILY_NOT_CLOSED');
            }
            const key = JSON.stringify([date, uid]);
            return store.runTransaction(async tx => {
                // The adapter MUST use serializable transactions and a durable,
                // immutable sealed ranking snapshot. Read all transaction data
                // before writing any records.
                const claimed = await tx.getDailyPrize(key);
                if (claimed) return { ...claimed, alreadyClaimed: true };
                const ranking = await tx.getDailyRanking(date);
                if (!ranking || ranking.date !== date || ranking.sealed !== true ||
                    !Array.isArray(ranking.receipts)) {
                    throw new Error('DAILY_RANKING_NOT_SEALED');
                }
                const board = buildDailyLeaderboard({
                    date, receipts: ranking.receipts, viewerUid: uid, limit: 1
                });
                if (board.viewerRank === null) throw new Error('DAILY_RESULT_NOT_FOUND');
                const prize = dailyPrizeForRank(board.viewerRank);
                const user = await tx.getUser(uid);
                if (!user) throw new Error('USER_NOT_FOUND');
                if (prize.xp === 0 && prize.coins === 0) {
                    const receipt = { uid, date, rank: board.viewerRank, ...prize };
                    await tx.setDailyPrize(key, receipt);
                    return { ...receipt, alreadyClaimed: false };
                }
                const updated = {
                    ...user,
                    experience: addBalance(user.experience, prize.xp),
                    weeklyExperience: addBalance(user.weeklyExperience, prize.xp),
                    coins: addBalance(user.coins, prize.coins)
                };
                const receipt = { uid, date, rank: board.viewerRank, ...prize };
                await tx.setUser(uid, updated);
                await tx.setDailyPrize(key, receipt);
                return { ...receipt, alreadyClaimed: false };
            });
        }
    };
}
