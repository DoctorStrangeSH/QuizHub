import { isAccountLedgerHistoryPreviewEnabled } from './account-ledger-history-settings.js';

const EVENT_TYPES = new Set([
    'quiz_reward', 'daily_login_reward', 'shop_purchase',
    'shop_refund', 'achievement_unlock'
]);

function validateResponse(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        !Array.isArray(value.entries) || value.entries.length > 50 ||
        !(value.nextCursor === null ||
            (typeof value.nextCursor === 'string' && value.nextCursor.length <= 1024))) {
        throw new Error('INVALID_ACCOUNT_LEDGER_HISTORY_RESPONSE');
    }
    const entries = value.entries.map(entry => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry) ||
            typeof entry.entryId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(entry.entryId) ||
            !EVENT_TYPES.has(entry.type) ||
            !Number.isSafeInteger(entry.occurredAt) || entry.occurredAt < 0 ||
            !Number.isSafeInteger(entry.coinsDelta) ||
            !Number.isSafeInteger(entry.xpDelta) ||
            (entry.itemId !== undefined && (typeof entry.itemId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(entry.itemId))) ||
            (entry.achievementId !== undefined && (typeof entry.achievementId !== 'string' || !/^[a-z0-9_]{1,64}$/.test(entry.achievementId)))) {
            throw new Error('INVALID_ACCOUNT_LEDGER_HISTORY_ENTRY');
        }
        return {
            entryId: entry.entryId,
            type: entry.type,
            occurredAt: entry.occurredAt,
            coinsDelta: entry.coinsDelta,
            xpDelta: entry.xpDelta,
            ...(entry.itemId ? { itemId: entry.itemId } : {}),
            ...(entry.achievementId ? { achievementId: entry.achievementId } : {})
        };
    });
    return { entries, nextCursor: value.nextCursor };
}

export function createFirebaseAccountLedgerHistoryInvoker({
    auth, functions, httpsCallable, location
}) {
    if (!isAccountLedgerHistoryPreviewEnabled(location, auth)) {
        throw new Error('ACCOUNT_LEDGER_HISTORY_PREVIEW_EMULATOR_REQUIRED');
    }
    if (!functions || typeof httpsCallable !== 'function') {
        throw new Error('ACCOUNT_LEDGER_HISTORY_DEPENDENCIES_REQUIRED');
    }
    const callable = httpsCallable(functions, 'accountLedgerHistoryPreviewCallable');
    return async ({ pageSize = 20, type = null, cursor = null } = {}) => {
        if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50 ||
            (type !== null && !EVENT_TYPES.has(type)) ||
            (cursor !== null && (typeof cursor !== 'string' || cursor.length > 1024))) {
            throw new Error('INVALID_ACCOUNT_LEDGER_HISTORY_REQUEST');
        }
        const result = await callable({ pageSize, type, cursor });
        return validateResponse(result?.data);
    };
}
