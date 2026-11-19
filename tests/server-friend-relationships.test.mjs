import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionFriendship, updateFriendship } from '../server/friend-relationships.mjs';

const empty = () => ({ friends: [], friendRequests: [], sentRequests: [], coins: 500, email: 'secret@example.test' });
const perform = (operation, actor, target, actorUid = 'alice', targetUid = 'bob') =>
    transitionFriendship(operation, actorUid, targetUid, actor, target);

test('request → accept is symmetric and preserves unrelated private data', () => {
    const alice = empty();
    const bob = empty();
    const request = perform('send', alice, bob);
    assert.equal(request.status, 'updated');
    assert.deepEqual(request.actor.sentRequests, ['bob']);
    assert.deepEqual(request.target.friendRequests, ['alice']);
    assert.equal(perform('send', { ...alice, ...request.actor }, { ...bob, ...request.target }).status, 'unchanged');

    const accept = perform('accept',
        { ...bob, ...request.target }, { ...alice, ...request.actor }, 'bob', 'alice');
    assert.deepEqual(accept.actor.friends, ['alice']);
    assert.deepEqual(accept.target.friends, ['bob']);
    assert.deepEqual(accept.actor.friendRequests, []);
    assert.deepEqual(accept.target.sentRequests, []);
    assert.deepEqual(alice, empty());
    assert.deepEqual(bob, empty());
    assert.ok(!JSON.stringify(accept).includes('secret@example.test'));
});

test('decline, cancel, remove are directional and idempotent', () => {
    const request = perform('send', empty(), empty());
    const declined = perform('decline',
        { ...empty(), ...request.target }, { ...empty(), ...request.actor }, 'bob', 'alice');
    assert.deepEqual(declined.actor.friendRequests, []);
    assert.deepEqual(declined.target.sentRequests, []);
    const cancelled = perform('cancel',
        { ...empty(), ...request.actor }, { ...empty(), ...request.target });
    assert.deepEqual(cancelled.actor.sentRequests, []);
    assert.deepEqual(cancelled.target.friendRequests, []);
    assert.equal(perform('cancel', empty(), empty()).status, 'unchanged');
    const befriended = { ...empty(), friends: ['bob'] };
    const friend = { ...empty(), friends: ['alice'] };
    const removed = perform('remove', befriended, friend);
    assert.deepEqual(removed.actor.friends, []);
    assert.deepEqual(removed.target.friends, []);
    assert.equal(perform('remove', empty(), empty()).status, 'unchanged');
});

test('forged, inconsistent and oversized social operations are refused', () => {
    assert.throws(() => perform('send', empty(), empty(), 'alice', 'alice'), /INVALID_SOCIAL_TARGET/);
    assert.throws(() => perform('hack', empty(), empty()), /INVALID_SOCIAL_OPERATION/);
    assert.throws(() => perform('accept', empty(), empty()), /REQUEST_NOT_FOUND/);
    assert.throws(() => perform('send', { ...empty(), friends: ['bob'] }, empty()), /SOCIAL_STATE_CONFLICT/);
    assert.throws(() => perform('send', { ...empty(), friends: ['x', 'x'] }, empty()), /SOCIAL_MIGRATION_REQUIRED/);
    assert.throws(() => perform('send', { ...empty(), friends: ['alice'] }, empty()), /SOCIAL_STATE_CONFLICT/);
    assert.throws(() => perform('send', { ...empty(), friends: ['charlie'], sentRequests: ['charlie'] }, empty()), /SOCIAL_STATE_CONFLICT/);
    assert.throws(() => perform('accept', { ...empty(), friendRequests: ['alice'] }, empty(), 'bob', 'alice'), /SOCIAL_STATE_CONFLICT/);
    assert.throws(() => perform('send', { ...empty(), friends: Array.from({length: 501}, (_, i) => 'u' + i) }, empty()), /SOCIAL_MIGRATION_REQUIRED/);
    const a = { ...empty(), friendRequests: ['bob'], sentRequests: ['bob'] };
    const b = { ...empty(), friendRequests: ['alice'], sentRequests: ['alice'] };
    assert.throws(() => perform('send', a, b), /SOCIAL_STATE_CONFLICT/);
});

test('trusted adapter reads both accounts and stages only social fields', async () => {
    const records = new Map([['alice', empty()], ['bob', empty()]]);
    const writes = [];
    const db = {
        collection(name) {
            assert.equal(name, 'users');
            return { doc(uid) { return { uid }; } };
        },
        async runTransaction(fn) {
            return fn({
                async get(ref) { return { exists: records.has(ref.uid), data: () => records.get(ref.uid) }; },
                update(ref, patch) { writes.push({ uid: ref.uid, patch }); }
            });
        }
    };
    assert.deepEqual(await updateFriendship(db, { operation: 'send', actorUid: 'alice', targetUid: 'bob' }),
        { status: 'updated' });
    assert.deepEqual(writes.map(w => w.uid), ['alice', 'bob']);
    for (const write of writes) {
        assert.deepEqual(Object.keys(write.patch).sort(), ['friendRequests', 'friends', 'sentRequests']);
        assert.ok(!JSON.stringify(write.patch).includes('secret@example.test'));
    }
    assert.equal(records.get('alice').coins, 500);
    assert.equal(records.get('bob').email, 'secret@example.test');
    await assert.rejects(updateFriendship(db, { operation: 'send', actorUid: 'alice', targetUid: 'alice' }), /INVALID_SOCIAL_TARGET/);
});
