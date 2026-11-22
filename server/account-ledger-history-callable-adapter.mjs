import { readAccountLedgerHistory } from './account-ledger-history.mjs';

const UID = /^(?!\\.{1,2}$)[^/\\x00-\\x1f]{1,128}$/;
const TYPES = new Set([
    'quiz_reward', 'daily_login_reward', 'shop_purchase',
    'shop_refund', 'achievement_unlock'
]);
const KEYS = new Set(['pageSize', 'type', 'cursor']);
const ERRORS = new Map([
    ['INVALID_LEDGER_OWNER', 'invalid-argument'],
    ['INVALID_LEDGER_PAGE_SIZE', 'invalid-argument'],
    ['INVALID_LEDGER_FILTER', 'invalid-argument'],
    ['INVALID_LEDGER_CURSOR', 'invalid-argument'],
    ['INVALID_LEDGER_ENTRY', 'failed-precondition'],
    ['INVALID_LEDGER_IDENTITY', 'failed-precondition'],
    ['LEDGER_OWNER_MISMATCH', 'failed-precondition'],
    ['INVALID_LEDGER_DOCUMENT', 'failed-precondition']
]);

export function createAccountLedgerHistoryCallableAdapter({ read, HttpsError }) {
    if (typeof read !== 'function' || typeof HttpsError !== 'function') {
        throw new TypeError('TRUSTED_LEDGER_HISTORY_DEPENDENCIES_REQUIRED');
    }
    return async request => {
        const actorUid = request?.auth?.uid;
        if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
            request?.auth?.token?.firebase?.sign_in_provider === 'anonymous') {
            throw new HttpsError('unauthenticated', 'SIGNED_IN_ACCOUNT_REQUIRED');
        }
        const data = request?.data;
        if (data !== undefined && (!data || typeof data !== 'object' || Array.isArray(data) ||
            Object.keys(data).some(key => !KEYS.has(key)))) {
            throw new HttpsError('invalid-argument', 'INVALID_LEDGER_HISTORY_REQUEST');
        }
        const input = data ?? {};
        if ((input.pageSize !== undefined &&
                (!Number.isInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > 50)) ||
            (input.type !== undefined && input.type !== null && !TYPES.has(input.type)) ||
            (input.cursor !== undefined && input.cursor !== null &&
                (typeof input.cursor !== 'string' || input.cursor.length > 1024))) {
            throw new HttpsError('invalid-argument', 'INVALID_LEDGER_HISTORY_REQUEST');
        }
        try {
            return await read({
                actorUid,
                pageSize: input.pageSize ?? 20,
                type: input.type ?? null,
                cursor: input.cursor ?? null
            });
        } catch (error) {
            const code = ERRORS.get(error?.message);
            if (code) throw new HttpsError(code, error.message);
            throw new HttpsError('internal', 'LEDGER_HISTORY_READ_FAILED');
        }
    };
}

export function createFirestoreAccountLedgerHistoryCallable({ db, HttpsError }) {
    return createAccountLedgerHistoryCallableAdapter({
        read: args => readAccountLedgerHistory(db, args),
        HttpsError
    });
}
