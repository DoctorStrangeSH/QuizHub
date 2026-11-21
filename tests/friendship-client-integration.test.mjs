import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('friends UI uses the callable only behind explicit local emulator preview', () => {
    const source = readFileSync(new URL('../app/modules/friends/friends.js', import.meta.url), 'utf8');
    assert.match(source, /params\.get\('firebaseEmulator'\) === '1'/);
    assert.match(source, /params\.get\('friendshipPreview'\) === '1'/);
    assert.match(source, /performFriendship\('send', friendId\)/);
    assert.match(source, /performFriendship\('accept', friendId\)/);
    assert.match(source, /performFriendship\('decline', friendId\)/);
    assert.match(source, /performFriendship\('cancel', friendId\)/);
    assert.match(source, /performFriendship\('remove', friendId\)/);
    assert.match(source, /window\.cancelFriendRequest/);
    assert.match(source, /if \(friendshipPreviewClient\) return friendshipPreviewClient\.perform/);
});

test('browser Functions emulator is connected only with the Auth/Firestore local emulator switch', () => {
    const source = readFileSync(new URL('../app/firebase-config.js', import.meta.url), 'utf8');
    assert.match(source, /firebase-functions\.js/);
    assert.match(source, /if \(useLocalEmulators\)[\s\S]*connectFunctionsEmulator\(functions, '127\.0\.0\.1', 5001\)/);
    assert.match(source, /projectId: 'demo-quizhub'/);
});
