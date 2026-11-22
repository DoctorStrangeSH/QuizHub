import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountLedgerEntry } from '../server/account-ledger-entry.mjs';
import { createAccountLedgerFirestoreWriter } from '../server/account-ledger-firestore-writer.mjs';

function fixture() {
    const created = [];
    const db = {
        collection(name) {
            return { doc(id) { return { collection(sub) { return { doc(entryId) { return { path: name + '/' + id + '/' + sub + '/' + entryId }; } }; } }; }
        }
    };
    const native = { create(ref, value) { created.push({ path: ref.path, value: structuredClone(value) }); } };
    return { created, db, native };
}

test('writes a validated ledger event under its owning account with create-only semantics', () => {
    const f = fixture();
    const writer = createAccountLedgerFirestoreWriter(f.db, f.native);
    const entry = createAccountLedgerEntry({
        uid: 'player-1', type: 'shop_purchase', sourceId: 'purchase_0001',
        occurredAt: 1234, coinsDelta: -250, itemId: 'frame_gold'
    });
    const result = writer.create(entry);
    assert.deepEqual(result, entry);
    assert.equal(f.created.length, 1);
    assert.equal(f.created[0].path, 'accountLedger/player-1/entries/' + entry.entryId);
    assert.deepEqual(f.created[0].value, entry);
});

test('rejects forged event identity before touching Firestore transaction', () => {
    const f = fixture();
    const writer = createAccountLedgerFirestoreWriter(f.db, f.native);
    const entry = createAccountLedgerEntry({
        uid: 'player-1', type: 'shop_purchase', sourceId: 'purchase_0001',
        occurredAt: 1234, coinsDelta: -250, itemId: 'frame_gold'
    });
    assert.throws(() => writer.create({ ...entry, entryId: 'forged' }), /INVALID_LEDGER_IDENTITY/);
    assert.equal(f.created.length, 0);
});

test('requires native transaction create primitive and never falls back to set', () => {
    assert.throws(() => createAccountLedgerFirestoreWriter({ collection() {} }, {}), /INVALID_ACCOUNT_LEDGER_WRITER/);
});
