import { validateAccountLedgerEntry } from './account-ledger-entry.mjs';

const UID = /^[^/\x00-\x1f]{1,128}$/;
const EVENT_TYPES = new Set([
    'quiz_reward', 'daily_login_reward', 'shop_purchase',
    'shop_refund', 'achievement_unlock'
]);
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MAX_CURSOR_LENGTH = 1024;

function encodeCursor(value) {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function decodeCursor(value, expectedType) {
    if (value === null) return null;
    if (typeof value !== 'string' || value.length < 8 || value.length > MAX_CURSOR_LENGTH ||
        !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('INVALID_LEDGER_CURSOR');
    let parsed;
    try { parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')); }
    catch { throw new Error('INVALID_LEDGER_CURSOR'); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) ||
        parsed.version !== 1 || !Number.isSafeInteger(parsed.occurredAt) || parsed.occurredAt < 0 ||
        typeof parsed.entryId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(parsed.entryId) ||
        (parsed.type !== null && !EVENT_TYPES.has(parsed.type)) ||
        parsed.type !== expectedType) throw new Error('INVALID_LEDGER_CURSOR');
    return parsed;
}

function projectEntry(snapshot, uid) {
    const value = snapshot.data();
    const valid = validateAccountLedgerEntry(value, uid);
    if (snapshot.id !== valid.entryId) throw new Error('INVALID_LEDGER_DOCUMENT');
    return {
        entryId: valid.entryId,
        type: valid.type,
        sourceId: valid.sourceId,
        occurredAt: valid.occurredAt,
        coinsDelta: valid.coinsDelta,
        xpDelta: valid.xpDelta,
        ...(valid.itemId ? { itemId: valid.itemId } : {}),
        ...(valid.achievementId ? { achievementId: valid.achievementId } : {})
    };
}

/**
 * Owner-scoped, stable cursor pagination over the append-only account ledger.
 * Identity is supplied only by a trusted callable boundary, never by client data.
 */
export async function readAccountLedgerHistory(db, {
    actorUid, pageSize = DEFAULT_PAGE_SIZE, type = null, cursor = null
}) {
    if (!db || typeof db.collection !== 'function') throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    if (typeof actorUid !== 'string' || !UID.test(actorUid) || actorUid === '.' || actorUid === '..') {
        throw new Error('INVALID_LEDGER_OWNER');
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
        throw new Error('INVALID_LEDGER_PAGE_SIZE');
    }
    if (type !== null && !EVENT_TYPES.has(type)) throw new Error('INVALID_LEDGER_FILTER');
    const decoded = decodeCursor(cursor, type);

    let query = db.collection('accountLedger').doc(actorUid).collection('entries');
    if (type) query = query.where('type', '==', type);
    query = query.orderBy('occurredAt', 'desc').orderBy('entryId', 'desc');
    if (decoded) query = query.startAfter(decoded.occurredAt, decoded.entryId);
    const result = await query.limit(pageSize + 1).get();
    const hasMore = result.docs.length > pageSize;
    const visible = result.docs.slice(0, pageSize).map(snapshot => projectEntry(snapshot, actorUid));
    const last = visible[visible.length - 1];
    return {
        entries: visible,
        nextCursor: hasMore && last ? encodeCursor({
            version: 1, occurredAt: last.occurredAt, entryId: last.entryId, type
        }) : null
    };
}
