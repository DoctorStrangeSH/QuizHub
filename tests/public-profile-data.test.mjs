import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPublicProfile, publicProfileFields } from '../app/modules/profile/public-profile-data.js';

test('public profile projection excludes account secrets, email, friends and balances', () => {
    const privateProfile = {
        nickname: 'Sherlock_7', nicknameLower: 'spoofed', email: 'secret@example.test',
        coins: 9000, level: 3, experience: 130, weeklyExperience: 20, wins: 8,
        equippedFrame: 'frame_gold', friends: ['user-two'], friendRequests: ['user-three'],
        admin: true, refreshToken: 'top-secret', stats: { totalGames: 12 }
    };
    const publicProfile = buildPublicProfile('user-one', privateProfile);
    assert.deepEqual(Object.keys(publicProfile).sort(), publicProfileFields().sort());
    assert.deepEqual(publicProfile, {
        uid: 'user-one', nickname: 'Sherlock_7', nicknameLower: 'sherlock_7',
        level: 3, experience: 130, weeklyExperience: 20, wins: 8,
        equippedFrame: 'frame_gold'
    });
    assert.doesNotMatch(JSON.stringify(publicProfile), /secret|email|coins|friends|admin|token/i);
});

test('public profile refuses invalid identity fields', () => {
    assert.throws(() => buildPublicProfile('../invalid', { nickname: 'Player_7' }), /UID/);
    assert.throws(() => buildPublicProfile('user-one', { nickname: '<script>' }), /nickname/);
    assert.throws(() => buildPublicProfile('user-one', { nickname: 'ab' }), /nickname/);
});

test('public profile normalizes corrupt counters and unsafe decoration', () => {
    const result = buildPublicProfile('user-one', {
        nickname: 'Player_7', level: -20, experience: Infinity,
        weeklyExperience: 2.5, wins: '400', equippedFrame: 'url(javascript:alert(1))'
    });
    assert.equal(result.level, 1);
    assert.equal(result.experience, 0);
    assert.equal(result.weeklyExperience, 0);
    assert.equal(result.wins, 0);
    assert.equal(result.equippedFrame, 'frame_default');
});
