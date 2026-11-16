import test from 'node:test';
import assert from 'node:assert/strict';
import { planNicknameClaimBackfill } from '../server/nickname-claims-backfill.mjs';

const user = (uid, nickname, lower = nickname.toLowerCase()) =>
    ({ uid, data: { nickname, nicknameLower: lower, email: 'secret@example.test', coins: 9999 } });

test('planner creates deterministic claims without sensitive account data', () => {
    const plan = planNicknameClaimBackfill([
        user('bob', 'Bob_1'), user('alice', 'Alice_1')
    ], [], { batchSize: 1 });
    assert.equal(plan.writeCount, 2);
    assert.deepEqual(plan.batches.map(batch => batch[0].path), [
        'nicknameClaims/alice_1', 'nicknameClaims/bob_1'
    ]);
    assert.ok(!JSON.stringify(plan).includes('secret@example.test'));
    assert.ok(!JSON.stringify(plan).includes('9999'));
    assert.deepEqual(plan.batches.flat().map(x => Object.keys(x.data)), [['uid'], ['uid']]);
});

test('case-insensitive duplicates quarantine all owners, never pick a winner', () => {
    const plan = planNicknameClaimBackfill([
        user('a', 'Sherlock'), user('b', 'SHERLOCK'), user('c', 'Someone')
    ]);
    assert.equal(plan.conflictCount, 2);
    assert.deepEqual(plan.batches.flat().map(x => x.path), ['nicknameClaims/someone']);
});

test('existing matching claims are idempotent; foreign ownership blocks overwrite', () => {
    const inputs = [user('a', 'Alpha'), user('b', 'Bravo')];
    const plan = planNicknameClaimBackfill(inputs, [
        { normalized: 'alpha', uid: 'a' },
        { normalized: 'bravo', uid: 'stranger' }
    ]);
    assert.equal(plan.writeCount, 0);
    assert.deepEqual(plan.skipped, ['a']);
    assert.equal(plan.conflictCount, 1);
    const again = planNicknameClaimBackfill(inputs, [{ normalized: 'alpha', uid: 'a' }]);
    assert.equal(again.writeCount, 1);
    assert.deepEqual(again.batches[0][0], { path: 'nicknameClaims/bravo', data: { uid: 'b' } });
});

test('malformed legacy data and duplicated UIDs are quarantined safely', () => {
    const plan = planNicknameClaimBackfill([
        user('same', 'OneName'), user('same', 'OtherName'),
        user('wrong', 'BadNick', 'different'),
        { uid: '../escape', data: { nickname: 'Escape' } },
        user('valid', 'ValidName')
    ], [{ normalized: 'validname', uid: 'other' }]);
    assert.equal(plan.writeCount, 0);
    assert.equal(plan.invalidCount, 4);
    assert.equal(plan.conflictCount, 1);
    assert.throws(() => planNicknameClaimBackfill([], [], { batchSize: 401 }), /Batch size/);
});
