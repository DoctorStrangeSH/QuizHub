import { validateAccountLedgerEntry } from './account-ledger-entry.mjs';

// The caller must invoke this through the same native Firestore transaction
// that mutates the balance. create() is intentionally used instead of set().
export function createAccountLedgerFirestoreWriter(db, native) {
    if (!db || typeof db.collection !== 'function' || !native || typeof native.create !== 'function') {
        throw new Error('INVALID_ACCOUNT_LEDGER_WRITER');
    }
    return {
        create(entry) {
            const valid = validateAccountLedgerEntry(entry);
            const ref = db.collection('accountLedger').doc(valid.uid).collection('entries').doc(valid.entryId);
            native.create(ref, valid);
            return valid;
        }
    };
}
