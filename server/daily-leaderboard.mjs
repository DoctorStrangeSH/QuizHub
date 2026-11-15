// Pure backend leaderboard projection. Input must come from finalized,
// server-owned daily attempt receipts, NEVER directly from browser payloads.
// The future persistent adapter will fetch only receipt records for one UTC day.
function validReceipt(receipt, date) {
    return Boolean(receipt && typeof receipt === 'object' &&
        receipt.date === date && receipt.mode === 'daily' &&
        typeof receipt.uid === 'string' && receipt.uid.length > 0 &&
        Number.isSafeInteger(receipt.score) && receipt.score >= 0 &&
        Number.isSafeInteger(receipt.correctAnswers) && receipt.correctAnswers >= 0 &&
        Number.isSafeInteger(receipt.totalQuestions) && receipt.totalQuestions === 10 &&
        Number.isSafeInteger(receipt.answeredQuestions) &&
        receipt.answeredQuestions >= receipt.correctAnswers &&
        receipt.answeredQuestions <= receipt.totalQuestions);
}

function dateIsValid(date) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const parsed = new Date(date + 'T00:00:00.000Z');
    return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
}

export function buildDailyLeaderboard({ date, receipts, viewerUid = null, limit = 100 }) {
    if (!dateIsValid(date)) throw new Error('INVALID_DAILY_DATE');
    if (!Array.isArray(receipts) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        throw new Error('INVALID_LEADERBOARD_REQUEST');
    }
    if (viewerUid !== null && (typeof viewerUid !== 'string' || !viewerUid.trim())) {
        throw new Error('INVALID_VIEWER');
    }
    const unique = new Map();
    for (const receipt of receipts) {
        if (!validReceipt(receipt, date)) throw new Error('INVALID_DAILY_RECEIPT');
        // Duplicate receipt rows imply a broken persistence contract. Never
        // silently choose the higher score or count one player twice.
        if (unique.has(receipt.uid)) throw new Error('DUPLICATE_DAILY_RECEIPT');
        unique.set(receipt.uid, receipt);
    }
    const ranked = [...unique.values()].sort((a, b) =>
        b.score - a.score ||
        b.correctAnswers - a.correctAnswers ||
        a.uid.localeCompare(b.uid)
    );
    const rank = uid => ranked.findIndex(receipt => receipt.uid === uid) + 1;
    const publicRow = (receipt, position) => ({
        rank: position,
        // No email, phone, display name or private profile metadata.
        playerId: receipt.uid,
        score: receipt.score,
        correctAnswers: receipt.correctAnswers,
        totalQuestions: receipt.totalQuestions
    });
    const rows = ranked.slice(0, limit).map((receipt, index) => publicRow(receipt, index + 1));
    const viewerRank = viewerUid && unique.has(viewerUid) ? rank(viewerUid) : null;
    return {
        date,
        participants: ranked.length,
        rows,
        viewerRank,
        viewerResult: viewerRank ? publicRow(ranked[viewerRank - 1], viewerRank) : null
    };
}
