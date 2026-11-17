import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
    PUBLIC_PROFILE_READS_ENABLED,
    directoryCollection,
    profileCollectionForViewer,
    projectProfileForViewer
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


test('foreign profile readers receive only the public allowlist even during legacy cutover', () => {
    const privateData = {
        uid: 'spoofed', nickname: 'Sherlock_7', nicknameLower: 'wrong',
        email: 'private@example.test', coins: 500, admin: true,
        friends: ['secret-user'], friendRequests: ['other'],
        level: 8, experience: 420, weeklyExperience: 100, wins: 15,
        equippedFrame: 'frame_gold'
    };
    const foreign = projectProfileForViewer('viewer', 'player', privateData);
    assert.deepEqual(foreign, {
        uid: 'player', nickname: 'Sherlock_7', nicknameLower: 'sherlock_7',
        level: 8, experience: 420, weeklyExperience: 100, wins: 15,
        equippedFrame: 'frame_gold'
    });
    assert.doesNotMatch(JSON.stringify(foreign), /private@example|coins|admin|secret-user|friendRequests/);
    const own = projectProfileForViewer('player', 'player', privateData);
    assert.equal(own.email, privateData.email);
    assert.equal(own.coins, 500);
    assert.equal(own.uid, 'spoofed'); // legacy own profile payload is preserved as before
    assert.throws(() => projectProfileForViewer(null, 'player', { nickname: '<script>' }), /nickname/);
    assert.throws(() => projectProfileForViewer('viewer', 'player', null), /INVALID_PROFILE_DATA/);
});

test('foreign public-card rendering cannot print the private coin badge', () => {
    const source = readFileSync(new URL('../app/modules/profile/public-profile.js', import.meta.url), 'utf8');
    assert.match(source, /projectProfileForViewer\(auth\.currentUser\?\.uid, userId, docSnap\.data\(\)\)/);
    assert.match(source, /isOwnProfile \? `<span class="profile-badge coins"/);
});

test('foreign cards show only public metrics, not fabricated private statistics', () => {
    const source = readFileSync(new URL('../app/modules/profile/public-profile.js', import.meta.url), 'utf8');
    assert.ok(source.includes('isOwnProfile ? `'));
    assert.ok(source.includes('p.wins'));
    assert.ok(source.includes('p.experience'));
    assert.ok(source.includes('isOwnProfile && recentAchievements.length > 0'));
    assert.ok(source.includes('isOwnProfile ? `\\n                    <div class="profile-footer-info'));
    assert.ok(!source.includes('${recentAchievements.length > 0 ? `'));
});
