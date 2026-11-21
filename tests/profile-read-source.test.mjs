import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
    PUBLIC_PROFILE_READS_ENABLED,
    directoryCollection,
    profileCollectionForViewer,
    projectDirectoryProfile
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


test('foreign directory records are reduced to the public allowlist', () => {
    const raw = {
        uid: 'forged-uid', nickname: 'Player_7', nicknameLower: 'spoofed',
        email: 'private@example.test', coins: 9999, friends: ['secret-friend'],
        friendRequests: ['secret-request'], admin: true, level: 7,
        experience: 450, weeklyExperience: 80, wins: 12,
        equippedFrame: 'frame_gold', stats: { totalGames: 100 }
    };
    const projected = projectDirectoryProfile('real-player-id', raw);
    assert.deepEqual(projected, {
        uid: 'real-player-id', nickname: 'Player_7', nicknameLower: 'player_7',
        level: 7, experience: 450, weeklyExperience: 80, wins: 12,
        equippedFrame: 'frame_gold'
    });
    assert.doesNotMatch(JSON.stringify(projected), /private@example|coins|secret-friend|secret-request|admin|stats|forged-uid/);
    assert.throws(() => projectDirectoryProfile('player', null), /INVALID_PROFILE_DATA/);
    assert.throws(() => projectDirectoryProfile('player', { nickname: '<script>' }), /nickname/i);
});

test('friend list and request renderers use projected records', () => {
    const source = readFileSync(new URL('../app/modules/friends/friends.js', import.meta.url), 'utf8');
    assert.equal(source.split('projectDirectoryProfile(friendId, friendDoc.data())').length - 1, 1);
    assert.ok(source.includes('projectDirectoryProfile(reqId, reqDoc.data())'));
    assert.ok(source.includes('projectDirectoryProfile(sentId, sentDoc.data())'));
    assert.ok(source.includes('projectDirectoryProfile(docSnap.id, docSnap.data())'));
});
