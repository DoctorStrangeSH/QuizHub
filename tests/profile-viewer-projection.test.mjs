import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
    PUBLIC_PROFILE_READS_ENABLED,
    directoryCollection,
    profileCollectionForViewer,
    projectProfileForViewer
} from '../app/modules/profile/profile-read-source.js';

test('public-profile read cutover remains disabled until release gates pass', () => {
    assert.equal(PUBLIC_PROFILE_READS_ENABLED, false);
    assert.equal(directoryCollection(), 'users');
    assert.equal(profileCollectionForViewer('alice', 'alice'), 'users');
    assert.equal(profileCollectionForViewer('alice', 'bob'), 'users');
});

test('foreign viewers receive only the public allowlist and document-owned identity', () => {
    const privateProfile = {
        uid: 'forged-uid',
        nickname: 'Player_7',
        nicknameLower: 'forged',
        email: 'private@example.test',
        coins: 9000,
        friends: ['secret-user'],
        friendRequests: ['other-user'],
        admin: true,
        level: 8,
        experience: 420,
        weeklyExperience: 100,
        wins: 15,
        equippedFrame: 'frame_gold',
        stats: { totalGames: 99 },
        achievements: ['secret-achievement']
    };

    const projected = projectProfileForViewer('viewer', 'actual-player-uid', privateProfile);
    assert.deepEqual(projected, {
        uid: 'actual-player-uid',
        nickname: 'Player_7',
        nicknameLower: 'player_7',
        level: 8,
        experience: 420,
        weeklyExperience: 100,
        wins: 15,
        equippedFrame: 'frame_gold'
    });
    assert.doesNotMatch(JSON.stringify(projected), /private@example|coins|secret-user|friendRequests|admin|stats|achievements|forged-uid/);
});

test('owner retains private profile fields but cannot spoof document identity', () => {
    const privateProfile = {
        uid: 'forged-uid',
        nickname: 'Player_7',
        email: 'owner@example.test',
        coins: 250,
        level: 4
    };
    const own = projectProfileForViewer('same-user', 'same-user', privateProfile);
    assert.equal(own.uid, 'same-user');
    assert.equal(own.email, 'owner@example.test');
    assert.equal(own.coins, 250);
});

test('invalid foreign profiles fail closed', () => {
    assert.throws(() => projectProfileForViewer('viewer', 'player', null), /INVALID_PROFILE_DATA/);
    assert.throws(() => projectProfileForViewer('viewer', 'player', { nickname: '<script>' }), /nickname/i);
});

test('foreign profile card hides private balance and owner-only statistics', () => {
    const source = readFileSync(new URL('../app/modules/profile/public-profile.js', import.meta.url), 'utf8');
    assert.match(source, /isOwnProfile \? `<span class="profile-badge coins"/);
    assert.match(source, /isOwnProfile \? `/);
    assert.match(source, /isOwnProfile && recentAchievements\.length > 0/);
    assert.match(source, /projectProfileForViewer\(auth\.currentUser\?\.uid, userId, docSnap\.data\(\)\)/);
    assert.doesNotMatch(source, /updateDoc\(doc\(db, 'users', friendId\)/);
});
