import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PUBLIC_PROFILE_READS_ENABLED } from '../app/modules/profile/profile-read-source.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('unmigrated foreign reads and social writes force public-profile cutover to remain off', () => {
    const chat = source('app/modules/chat/chat.js');
    const profile = source('app/modules/profile/public-profile.js');
    const weekly = source('app/modules/reset-weekly.js');
    const unresolved = [
        /getDoc\(doc\(db, 'users', friendId\)\)/.test(chat),
        /updateDoc\(doc\(db, 'users', friendId\)/.test(profile),
        /collection\(db, 'users'\)/.test(weekly)
    ];
    if (unresolved.some(Boolean)) {
        assert.equal(PUBLIC_PROFILE_READS_ENABLED, false, 'Unsafe to cut over while legacy foreign access exists');
    }
    assert.match(source('docs/FIRESTORE_PROFILE_CUTOVER.md'), /NOT READY/);
});

test('public player card delegates friend requests to the single guarded friends handler', () => {
    const profile = source('app/modules/profile/public-profile.js');
    const friends = source('app/modules/friends/friends.js');
    assert.match(profile, /onclick="window\.sendFriendRequestFromProfile/);
    assert.match(profile, /await import\('\.\.\/friends\/friends\.js'\)/);
    assert.match(profile, /await window\.sendFriendRequest\(friendId\)/);
    assert.doesNotMatch(profile, /window\.sendFriendRequest\s*=/);
    assert.doesNotMatch(profile, /updateDoc\(/);
    assert.match(friends, /window\.sendFriendRequest = async/);
    assert.match(friends, /runFriendActionOnce\(user, 'send', friendId/);
});

test('chat friend list retains only projected public identity fields', () => {
    const chat = source('app/modules/chat/chat.js');
    assert.match(chat, /getDoc\(doc\(db, directoryCollection\(\), friendId\)\)/);
    assert.doesNotMatch(chat, /getDoc\(doc\(db, 'users', friendId\)\)/);
    assert.match(chat, /projectDirectoryProfile\(friendId, friendDoc\.data\(\)\)/);
    assert.match(chat, /friendsData\.push\(\{ id: publicFriend\.uid, nickname: publicFriend\.nickname \}\)/);
    assert.doesNotMatch(chat, /\.\.\.friendDoc\.data\(\)/);
    assert.doesNotMatch(chat, /\.\.\.userDoc\.data\(\)/);
    assert.match(chat, /lifecycle !== chatLifecycle \|\| revision !== friendsLoadRevision \|\| auth\.currentUser\?\.uid !== user\.uid/);
});
