import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = readFileSync(new URL('../app/firebase-config.js', import.meta.url), 'utf8');
const friends = readFileSync(new URL('../app/modules/friends/friends.js', import.meta.url), 'utf8');

test('friend callable is connected only to the explicit localhost emulator session', () => {
    assert.match(config, /\['localhost', '127\.0\.0\.1'\]\.includes\(location\.hostname\)/);
    assert.match(config, /get\('firebaseEmulator'\) === '1'/);
    assert.match(config, /friendPreviewEnabled = useLocalEmulators/);
    assert.match(config, /if \(!useLocalEmulators\) throw new Error\('FRIEND_PREVIEW_DISABLED'\)/);
    assert.match(config, /connectFunctionsEmulator\(functions, '127\.0\.0\.1', 5001\)/);
});

test('friend actions use the callable preview in emulator mode only', () => {
    for (const action of ['send', 'accept', 'decline', 'cancel', 'remove']) {
        assert.ok(friends.includes(`callFriendOperationPreview('${action}', friendId)`));
    }
    assert.equal((friends.match(/if \(friendPreviewEnabled\)/g) || []).length, 5);
    assert.match(friends, /window\.cancelFriendRequest\('\$\{s\.id\}'\)/);
    assert.match(friends, /sentRequests: arrayRemove\(friendId\)/);
    assert.match(friends, /await updateDoc\(doc\(db, 'users', friendId\)/);
});

test('out-of-order friend tab responses cannot overwrite the current tab', () => {
    assert.equal((friends.match(/const version = \+\+friendsLoadVersion/g) || []).length, 3);
    assert.equal((friends.match(/renderLatestFriends\(version, user, tabContent,/g) || []).length, 6);
    assert.match(friends, /version === friendsLoadVersion && container\.isConnected && auth\.currentUser\?\.uid === user\.uid/);
});

test('rapid repeated social clicks are coalesced per user, target and operation', () => {
    assert.match(friends, /if \(pendingFriendActions\.has\(key\)\) return/);
    assert.match(friends, /finally \{ pendingFriendActions\.delete\(key\); \}/);
    assert.equal((friends.match(/return runFriendActionOnce\(user, '/g) || []).length, 5);
});
