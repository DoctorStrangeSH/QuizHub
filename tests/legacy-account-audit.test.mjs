import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicProfile } from '../app/modules/profile/public-profile-data.js';
import { auditLegacyAccountMigration } from '../server/legacy-account-audit.mjs';

const user = (uid, nickname, extra = {}) => ({
    uid, data: {
        nickname, nicknameLower: nickname.toLowerCase(),
        level: 7, experience: 1234, weeklyExperience: 30, wins: 4,
        coins: 9999, email: 'private@example.test',
        achievements: ['first_win'], friends: ['friend_uid'],
        friendRequests: ['friend_uid'], sentRequests: [],
        ownedFrames: ['frame_default', 'frame_special'], ...extra
    }
});
const input = (...players) => ({
    users: players,
    authUids: players.map(p => p.uid),
    claims: players.map(p => ({ normalized: p.data.nicknameLower, uid: p.uid })),
    publicProfiles: players.map(p => ({
        uid: p.uid, data: buildPublicProfile(p.uid, p.data)
    }))
});

test('complete consistent legacy snapshots are safe to plan, without mutation or private values', () => {
    const snapshot = input(user('alice', 'Alice_1'), user('bob', 'Bob_1'));
    const before = structuredClone(snapshot);
    const report = auditLegacyAccountMigration(snapshot);
    assert.equal(report.status, 'ready');
    assert.deepEqual(report.counts, {
        users: 2, authIdentities: 2, publicProfiles: 2, claims: 2,
        blockerCount: 0, reviewCount: 0, backfillCount: 0
    });
    assert.deepEqual(snapshot, before);
    assert.ok(!JSON.stringify(report).includes('private@example.test'));
    assert.ok(!JSON.stringify(report).includes('9999'));
    assert.ok(!JSON.stringify(report).includes('first_win'));
});

test('missing claim and public projection are safely classified as backfill work', () => {
    const snapshot = input(user('alice', 'Alice_1'));
    snapshot.claims = [];
    snapshot.publicProfiles = [];
    const report = auditLegacyAccountMigration(snapshot);
    assert.equal(report.status, 'needs_backfill');
    assert.equal(report.counts.backfillCount, 2);
    assert.deepEqual(report.issues.map(x => x.code).sort(), [
        'NICKNAME_CLAIM_MISSING', 'PUBLIC_PROFILE_MISSING'
    ]);
});

test('collisions, wrong owners and private public-profile leaks block migration', () => {
    const snapshot = input(user('alice', 'Sherlock'), user('bob', 'SHERLOCK'));
    snapshot.claims = [{ normalized: 'sherlock', uid: 'outsider' }];
    snapshot.publicProfiles[0].data.email = 'danger@example.test';
    const report = auditLegacyAccountMigration(snapshot);
    assert.equal(report.status, 'blocked');
    assert.equal(report.issues.filter(x => x.code === 'DUPLICATE_NICKNAME').length, 2);
    assert.ok(report.issues.some(x => x.code === 'NICKNAME_CLAIM_WRONG_OWNER'));
    assert.ok(report.issues.some(x => x.code === 'PUBLIC_PROFILE_MISMATCH_OR_PRIVATE_FIELDS'));
    assert.ok(report.issues.some(x => x.code === 'ORPHAN_OR_STALE_CLAIM'));
    assert.ok(!JSON.stringify(report).includes('danger@example.test'));
});

test('auth omissions, orphan records and malformed legacy fields cannot be marked ready', () => {
    const snapshot = input(user('alice', 'Alice_1', { nicknameLower: 'wrong' }));
    snapshot.authUids = ['unprofiled'];
    snapshot.publicProfiles.push({
        uid: 'orphan', data: { nickname: 'Orphan', email: 'secret@example.test' }
    });
    snapshot.claims.push({ normalized: 'wrong', uid: 'other' });
    const report = auditLegacyAccountMigration(snapshot);
    assert.equal(report.status, 'blocked');
    for (const code of [
        'AUTH_IDENTITY_MISSING', 'AUTH_WITHOUT_PROFILE',
        'INVALID_LEGACY_NICKNAME', 'ORPHAN_PUBLIC_PROFILE',
        'INVALID_OR_DUPLICATE_CLAIM'
    ]) assert.ok(report.issues.some(x => x.code === code), code);
    assert.throws(() => auditLegacyAccountMigration({
        users: snapshot.users, claims: [], publicProfiles: []
    }), /COMPLETE_SNAPSHOTS_REQUIRED/);
});

test('duplicate identifiers and stale claim owners are quarantined', () => {
    const snapshot = input(user('alice', 'Alice_1'));
    snapshot.users.push(user('alice', 'Other_1'));
    snapshot.authUids.push('alice');
    snapshot.claims.push({ normalized: 'stale_1', uid: 'alice' });
    const report = auditLegacyAccountMigration(snapshot);
    assert.equal(report.status, 'blocked');
    assert.ok(report.issues.some(x => x.code === 'INVALID_OR_DUPLICATE_USER'));
    assert.ok(report.issues.some(x => x.code === 'INVALID_OR_DUPLICATE_AUTH_UID'));
    assert.ok(report.issues.some(x => x.code === 'ORPHAN_OR_STALE_CLAIM'));
});
