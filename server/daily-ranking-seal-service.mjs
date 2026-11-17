import { buildDailyLeaderboard } from './daily-leaderboard.mjs';

const DAY_MS = 86_400_000;

function assertClosedDate(date, now) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isSafeInteger(now) || now < 0) {
        throw new Error('INVALID_DAILY_SEAL_REQUEST');
    }
    const midnight = Date.parse(date + 'T00:00:00.000Z');
    if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== date ||
        now < midnight + DAY_MS) {
        throw new Error('DAILY_NOT_CLOSED');
    }
}

// Backend-only seal. The store must implement serializable transactions and
// getDailyReceipts must read finalized server-owned receipts, never client scores.
export function createDailyRankingSealService(store) {
    if (!store || typeof store.runTransaction !== 'function') {
        throw new Error('TRANSACTION_REQUIRED');
    }
    return {
        async seal({ date, now }) {
            assertClosedDate(date, now);
            return store.runTransaction(async tx => {
                const existing = await tx.getDailyRanking(date);
                if (existing?.sealed === true) {
                    if (existing.date !== date || !Array.isArray(existing.receipts)) {
                        throw new Error('INVALID_SEALED_RANKING');
                    }
                    buildDailyLeaderboard({ date, receipts: existing.receipts, limit: 1 });
                    return { date, participants: existing.receipts.length, alreadySealed: true };
                }
                if (existing) throw new Error('RANKING_ALREADY_EXISTS');
                const receipts = await tx.getDailyReceipts(date);
                if (!Array.isArray(receipts)) throw new Error('INVALID_DAILY_RECEIPTS');
                // Reject duplicates, malformed receipts and receipts from the wrong day
                // before the first write. This validates a complete immutable snapshot.
                const leaderboard = buildDailyLeaderboard({ date, receipts, limit: 1 });
                const ranking = {
                    date, sealed: true, sealedAt: now,
                    receipts: structuredClone(receipts)
                };
                await tx.setDailyRanking(date, ranking);
                return { date, participants: leaderboard.participants, alreadySealed: false };
            });
        }
    };
}
