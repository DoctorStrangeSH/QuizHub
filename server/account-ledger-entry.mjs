import { createHash } from 'node:crypto';

const EVENT_TYPES = new Set([
    'quiz_reward', 'daily_login_reward', 'shop_purchase',
    'shop_refund', 'achievement_unlock'
]);
const ID = /^[A-Za-z0-9_-]{1,128}$/;
const ITEM_ID = /^[A-Za-z0-9_-]{1,80}$/;
const ACHIEVEMENT_ID = /^[a-z0-9_]{1,64}$/;

function safeDelta(value, field) {
    if (!Number.isSafeInteger(value)) throw new Error('INVALID_LEDGER_' + field.toUpperCase());
    return value;
}

function validateInput(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('INVALID_LEDGER_ENTRY');
    const { uid, type, sourceId, occurredAt } = input;
    if (typeof uid !== 'string' || !/^[^/\x00-\x1f]{1,256}$/.test(uid) || uid === '.' || uid === '..') throw new Error('INVALID_LEDGER_UID');
    if (!EVENT_TYPES.has(type)) throw new Error('INVALID_LEDGER_EVENT_TYPE');
    if (typeof sourceId !== 'string' || !ID.test(sourceId)) throw new Error('INVALID_LEDGER_SOURCE_ID');
    if (!Number.isSafeInteger(occurredAt) || occurredAt < 0) throw new Error('INVALID_LEDGER_TIMESTAMP');
    const coinsDelta = safeDelta(input.coinsDelta ?? 0, 'coins_delta');
    const xpDelta = safeDelta(input.xpDelta ?? 0, 'xp_delta');
    if (coinsDelta === 0 && xpDelta === 0 && type !== 'achievement_unlock') {
        throw new Error('EMPTY_LEDGER_EVENT');
    }
    if (type === 'quiz_reward' && (coinsDelta < 0 || xpDelta < 0)) throw new Error('INVALID_QUIZ_REWARD_DELTA');
    if (type === 'daily_login_reward' && (coinsDelta <= 0 || xpDelta !== 0)) throw new Error('INVALID_DAILY_LOGIN_DELTA');
    if (type === 'shop_purchase' && (coinsDelta >= 0 || xpDelta !== 0)) throw new Error('INVALID_SHOP_PURCHASE_DELTA');
    if (type === 'shop_refund' && (coinsDelta <= 0 || xpDelta !== 0)) throw new Error('INVALID_SHOP_REFUND_DELTA');
    if (type === 'achievement_unlock' && (coinsDelta !== 0 || xpDelta !== 0)) throw new Error('INVALID_ACHIEVEMENT_DELTA');

    const result = { uid, type, sourceId, occurredAt, coinsDelta, xpDelta };
    if (input.itemId !== undefined) {
        if (typeof input.itemId !== 'string' || !ITEM_ID.test(input.itemId)) throw new Error('INVALID_LEDGER_ITEM_ID');
        result.itemId = input.itemId;
    }
    if (input.achievementId !== undefined) {
        if (typeof input.achievementId !== 'string' || !ACHIEVEMENT_ID.test(input.achievementId)) {
            throw new Error('INVALID_LEDGER_ACHIEVEMENT_ID');
        }
        result.achievementId = input.achievementId;
    }
    if (type === 'shop_purchase' || type === 'shop_refund') {
        if (!result.itemId) throw new Error('LEDGER_ITEM_REQUIRED');
    }
    if (type === 'achievement_unlock' && !result.achievementId) throw new Error('LEDGER_ACHIEVEMENT_REQUIRED');
    if (type !== 'achievement_unlock' && result.achievementId !== undefined) throw new Error('UNEXPECTED_LEDGER_ACHIEVEMENT');
    return result;
}

/** Deterministic document ID: retries of the same source event target one ledger entry. */
export function accountLedgerEntryId(type, sourceId) {
    if (!EVENT_TYPES.has(type) || typeof sourceId !== 'string' || !ID.test(sourceId)) {
        throw new Error('INVALID_LEDGER_SOURCE');
    }
    const digest = createHash('sha256').update(type + ':' + sourceId).digest('hex').slice(0, 40);
    return type + '_' + digest;
}

/**
 * Canonical append-only account event contract. This function is pure: callers
 * must create the returned document in the same Firestore transaction as the
 * balance/entitlement mutation. Never use it to backfill unverified legacy data.
 */
export function createAccountLedgerEntry(input) {
    const entry = validateInput(input);
    return {
        ...entry,
        schemaVersion: 1,
        entryId: accountLedgerEntryId(entry.type, entry.sourceId)
    };
}

export function validateAccountLedgerEntry(input, expectedUid) {
    const entry = validateInput(input);
    if (expectedUid !== undefined && entry.uid !== expectedUid) throw new Error('LEDGER_OWNER_MISMATCH');
    const expectedId = accountLedgerEntryId(entry.type, entry.sourceId);
    if (input.entryId !== expectedId || input.schemaVersion !== 1) throw new Error('INVALID_LEDGER_IDENTITY');
    return { ...entry, schemaVersion: 1, entryId: expectedId };
}
