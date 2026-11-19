import test from 'node:test';
import assert from 'node:assert/strict';
import { createFriendsAsyncGuard } from '../app/modules/friends/friends-async-guards.js';

const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
};

test('a slower earlier friend tab response loses ownership after switching tabs', () => {
    const guard = createFriendsAsyncGuard();
    const friends = guard.nextLoad();
    const sent = guard.nextLoad();
    assert.equal(guard.isCurrent(friends), false);
    assert.equal(guard.isCurrent(sent), true);
    const requests = guard.nextLoad();
    assert.equal(guard.isCurrent(sent), false);
    assert.equal(guard.isCurrent(requests), true);
});

test('repeated click while pending runs one action and releases lock afterward', async () => {
    const guard = createFriendsAsyncGuard();
    const wait = deferred();
    let calls = 0;
    const first = guard.runOnce('alice:send:bob', async () => { calls++; await wait.promise; });
    assert.equal(await guard.runOnce('alice:send:bob', async () => { calls++; }), false);
    assert.equal(calls, 1);
    assert.equal(await guard.runOnce('alice:send:charlie', async () => { calls++; }), true);
    wait.resolve();
    assert.equal(await first, true);
    assert.equal(await guard.runOnce('alice:send:bob', async () => { calls++; }), true);
    assert.equal(calls, 3);
});

test('a rejected action releases its lock for retry', async () => {
    const guard = createFriendsAsyncGuard();
    await assert.rejects(guard.runOnce('alice:accept:bob', async () => { throw new Error('network'); }));
    assert.equal(await guard.runOnce('alice:accept:bob', async () => {}), true);
});

test('typing a new nickname invalidates pending search responses independently of tabs', () => {
    const guard = createFriendsAsyncGuard();
    const firstSearch = guard.nextSearch();
    const friendsTab = guard.nextLoad();
    assert.equal(guard.isCurrentSearch(firstSearch), true);
    guard.nextSearch();
    assert.equal(guard.isCurrentSearch(firstSearch), false);
    assert.equal(guard.isCurrent(friendsTab), true);
});
