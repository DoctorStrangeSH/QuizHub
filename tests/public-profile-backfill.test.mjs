import assert from 'node:assert/strict';
import test from 'node:test';
import { planPublicProfileBackfill } from '../server/public-profile-backfill.mjs';
import { buildPublicProfile } from '../app/modules/profile/public-profile-data.js';

const user = (uid, nickname) => ({
    uid, data: { nickname, email: 'private@example.test', coins: 9999, friends: ['secret'],
        level: 2, experience: 10, weeklyExperience: 3, wins: 1, equippedFrame: 'frame_gold' }
});

test('dry run prepares only sanitized public documents without writing anywhere', () => {
    const result = planPublicProfileBackfill([user('a', 'PlayerOne'), user('b', 'PlayerTwo')], [], { batchSize: 1 });
    assert.equal(result.sourceCount, 2);
    assert.equal(result.writeCount, 2);
    assert.equal(result.batches.length, 2);
    assert.deepEqual(result.batches.map(batch => batch[0].path), ['publicProfiles/a', 'publicProfiles/b']);
    assert.ok(!JSON.stringify(result).includes('private@example.test'));
    assert.ok(!JSON.stringify(result).includes('9999'));
});

test('repeatable backfill skips identical records and flags divergent ones', () => {
    const a = user('a', 'PlayerOne');
    const b = user('b', 'PlayerTwo');
    const result = planPublicProfileBackfill([a, b], [
        { uid: 'a', data: buildPublicProfile(a.uid, a.data) },
        { uid: 'b', data: { ...buildPublicProfile(b.uid, b.data), wins: 200 } }
    ]);
    assert.equal(result.writeCount, 0);
    assert.deepEqual(result.skipped, ['a']);
    assert.deepEqual(result.conflicts, ['b']);
});

test('invalid profiles and duplicate UIDs are quarantined without leaking source data', () => {
    const result = planPublicProfileBackfill([
        user('a', 'PlayerOne'),
        user('a', 'AnotherOne'),
        user('b', '<script>'),
        { uid: '../bad', data: { nickname: 'PlayerGood', email: 'sensitive@example.test' } }
    ]);
    assert.equal(result.writeCount, 0);
    assert.equal(result.invalidCount, 4);
    assert.ok(!JSON.stringify(result).includes('sensitive@example.test'));
    assert.throws(() => planPublicProfileBackfill([], [], { batchSize: 401 }), /Batch size/);
});

test('duplicate nicknames in different letter case quarantine all owners', () => {
    const result = planPublicProfileBackfill([
        user('a', 'Sherlock'), user('b', 'SHERLOCK'), user('c', 'UniquePlayer')
    ]);
    assert.deepEqual(result.conflicts, ['a', 'b']);
    assert.deepEqual(result.batches.flat().map(item => item.path), ['publicProfiles/c']);
});

test('public profile backfill is stable regardless of user snapshot ordering', () => {
    const accounts = [user('z', 'ZuluPlayer'), user('b', 'BravoPlayer'), user('a', 'AlphaPlayer')];
    const forward = planPublicProfileBackfill(accounts, [], { batchSize: 2 });
    const reverse = planPublicProfileBackfill([...accounts].reverse(), [], { batchSize: 2 });
    assert.deepEqual(forward, reverse);
});

test('existing divergent public data remains blocked even if it contains private fields', () => {
    const result = planPublicProfileBackfill([user('a', 'PlayerOne')], [{
        uid: 'a', data: { nickname: 'PlayerOne', email: 'private@example.test' }
    }]);
    assert.equal(result.writeCount, 0);
    assert.deepEqual(result.conflicts, ['a']);
    assert.ok(!JSON.stringify(result).includes('private@example.test'));
});
