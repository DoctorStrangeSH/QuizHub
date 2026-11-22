import test from 'node:test';
import assert from 'node:assert/strict';
import {
    accountLedgerEntryId, createAccountLedgerEntry, validateAccountLedgerEntry
} from '../server/account-ledger-entry.mjs';

test('creates deterministic immutable-shape quiz reward entries with XP and coin deltas', () => {
    const input = { uid:'player_1', type:'quiz_reward', sourceId:'session_123', occurredAt:1000, xpDelta:50, coinsDelta:25 };
    const first = createAccountLedgerEntry(input);
    const second = createAccountLedgerEntry(input);
    assert.deepEqual(first, second);
    assert.equal(first.entryId, accountLedgerEntryId('quiz_reward', 'session_123'));
    assert.equal(first.schemaVersion, 1);
    assert.deepEqual(validateAccountLedgerEntry(first, 'player_1'), first);
});

test('supports daily login rewards, shop purchases/refunds and achievement unlocks', () => {
    assert.equal(createAccountLedgerEntry({uid:'p1',type:'daily_login_reward',sourceId:'2026-11-22',occurredAt:1,coinsDelta:10}).coinsDelta, 10);
    assert.equal(createAccountLedgerEntry({uid:'p1',type:'shop_purchase',sourceId:'purchase_123',occurredAt:2,coinsDelta:-300,itemId:'frame_gold'}).itemId, 'frame_gold');
    assert.equal(createAccountLedgerEntry({uid:'p1',type:'shop_refund',sourceId:'refund_123',occurredAt:3,coinsDelta:300,itemId:'frame_gold'}).coinsDelta, 300);
    assert.equal(createAccountLedgerEntry({uid:'p1',type:'achievement_unlock',sourceId:'first_quiz',occurredAt:4,achievementId:'first_quiz'}).achievementId, 'first_quiz');
});

test('rejects unsafe timestamps, non-integer deltas, empty non-quiz events and invalid type semantics', () => {
    const base = {uid:'p1',type:'quiz_reward',sourceId:'session_1',occurredAt:1,xpDelta:1,coinsDelta:1};
    assert.throws(() => createAccountLedgerEntry({...base,occurredAt:-1}), /INVALID_LEDGER_TIMESTAMP/);
    assert.throws(() => createAccountLedgerEntry({...base,xpDelta:1.5}), /INVALID_LEDGER_XP_DELTA/);
    assert.deepEqual(
        createAccountLedgerEntry({...base,xpDelta:0,coinsDelta:0}),
        { uid:'p1', type:'quiz_reward', sourceId:'session_1', occurredAt:1, xpDelta:0, coinsDelta:0, schemaVersion:1, entryId:accountLedgerEntryId('quiz_reward','session_1') }
    );
    assert.throws(() => createAccountLedgerEntry({...base,type:'daily_login_reward',xpDelta:0,coinsDelta:0}), /EMPTY_LEDGER_EVENT/);
    assert.throws(() => createAccountLedgerEntry({...base,type:'daily_login_reward',coinsDelta:-1}), /INVALID_DAILY_LOGIN_DELTA/);
    assert.throws(() => createAccountLedgerEntry({...base,type:'shop_purchase',coinsDelta:1}), /INVALID_SHOP_PURCHASE_DELTA/);
});

test('requires item and achievement references for their respective event types', () => {
    assert.throws(() => createAccountLedgerEntry({uid:'p1',type:'shop_purchase',sourceId:'purchase_1',occurredAt:1,coinsDelta:-10}), /LEDGER_ITEM_REQUIRED/);
    assert.throws(() => createAccountLedgerEntry({uid:'p1',type:'achievement_unlock',sourceId:'first_quiz',occurredAt:1}), /LEDGER_ACHIEVEMENT_REQUIRED/);
});

test('prevents cross-account reads and forged deterministic IDs', () => {
    const entry = createAccountLedgerEntry({uid:'p1',type:'quiz_reward',sourceId:'session_1',occurredAt:1,xpDelta:1,coinsDelta:1});
    assert.throws(() => validateAccountLedgerEntry(entry, 'p2'), /LEDGER_OWNER_MISMATCH/);
    assert.throws(() => validateAccountLedgerEntry({...entry,entryId:'forged'}, 'p1'), /INVALID_LEDGER_IDENTITY/);
});

test('same source key is stable while distinct operations never share an ID', () => {
    assert.equal(accountLedgerEntryId('shop_purchase','purchase_1'), accountLedgerEntryId('shop_purchase','purchase_1'));
    assert.notEqual(accountLedgerEntryId('shop_purchase','purchase_1'), accountLedgerEntryId('shop_purchase','purchase_2'));
    assert.notEqual(accountLedgerEntryId('shop_purchase','purchase_1'), accountLedgerEntryId('shop_refund','purchase_1'));
});
