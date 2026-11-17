import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
    PUBLIC_PROFILE_READS_ENABLED,
    directoryCollection,
    profileCollectionForViewer
} from '../app/modules/profile/profile-read-source.js';

test('public-profile cutover stays disabled until privacy and backfill release gates pass', () => {
    assert.equal(PUBLIC_PROFILE_READS_ENABLED, false);
    assert.equal(directoryCollection(), 'users');
    assert.equal(profileCollectionForViewer('alice', 'alice'), 'users');
    assert.equal(profileCollectionForViewer('alice', 'bob'), 'users');
    assert.equal(profileCollectionForViewer(null, 'bob'), 'users');
});

test('directory consumers share a single migration gate', () => {
    const modules = [
        'app/modules/profile/profile.js',
        'app/modules/profile/public-profile.js',
        'app/modules/friends/friends.js',
        'app/modules/leaderboard/leaderboard.js'
    ];
    for (const file of modules) {
        const content = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
        assert.match(content, /profile-read-source\.js/);
    }
    const friendSource = readFileSync(new URL('../app/modules/friends/friends.js', import.meta.url), 'utf8');
    assert.match(friendSource, /collection\(db, directoryCollection\(\)\)/);
    assert.match(friendSource, /profileCollectionForViewer\(user\.uid, friendId\)/);
    const leaderboard = readFileSync(new URL('../app/modules/leaderboard/leaderboard.js', import.meta.url), 'utf8');
    assert.match(leaderboard, /const source = directoryCollection\(\)/);
    const publicProfile = readFileSync(new URL('../app/modules/profile/public-profile.js', import.meta.url), 'utf8');
    assert.match(publicProfile, /profileCollectionForViewer\(auth\.currentUser\?\.uid, userId\)/);
});
