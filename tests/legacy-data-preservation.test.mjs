import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyLegacyDataPreservation } from '../server/legacy-data-preservation.mjs';

const protectedCollections = [
    'users', 'friendships', 'chats', 'messages', 'quizResults'
];
function baseline() {
    return {
        users: [{ id: 'alice', data: {
            nickname: 'Alice', coins: 999, experience: 420, level: 8,
            achievements: ['first_win'], friends: ['bob'], ownedFrames: ['frame_gold'],
            email: 'private@example.test'
        } }],
        friendships: [{ id: 'alice_bob', data: { from: 'alice', to: 'bob', status: 'accepted' } }],
        chats: [{ id: 'alice_bob', data: { participants: ['alice', 'bob'], lastRead: 5 } }],
        messages: [{ id: 'message_1', data: { chatId: 'alice_bob', body: 'PRIVATE TEXT' } }],
        quizResults: [{ id: 'round_1', data: { uid: 'alice', score: 95, rewards: 15 } }]
    };
}
test('preservation gate accepts exact data even when record ordering changes', () => {
    const before = baseline();
    const after = structuredClone(before);
    after.users.push({ id: 'bob', data: { coins: 2 } });
    before.users.push({ id: 'bob', data: { coins: 2 } });
    after.users.reverse();
    const snapshot = structuredClone(before);
    const result = verifyLegacyDataPreservation(before, after, { protectedCollections });
    assert.equal(result.status, 'preserved');
    assert.equal(result.issueCount, 0);
    assert.deepEqual(before, snapshot);
    assert.ok(!JSON.stringify(result).includes('PRIVATE TEXT'));
    assert.ok(!JSON.stringify(result).includes('private@example.test'));
    assert.ok(!JSON.stringify(result).includes('999'));
});
test('changed balances, achievements, social links and message text block release', () => {
    const before = baseline();
    const after = structuredClone(before);
    after.users[0].data.coins++;
    after.users[0].data.achievements = [];
    after.friendships[0].data.status = 'blocked';
    after.messages[0].data.body = 'CHANGED';
    after.quizResults = [];
    const result = verifyLegacyDataPreservation(before, after, { protectedCollections });
    assert.equal(result.status, 'blocked');
    assert.equal(result.issueCount, 4);
    assert.ok(result.issues.some(x => x.collection === 'users' && x.code === 'DOCUMENT_CHANGED'));
    assert.ok(result.issues.some(x => x.collection === 'messages' && x.code === 'DOCUMENT_CHANGED'));
    assert.ok(result.issues.some(x => x.collection === 'quizResults' && x.code === 'DOCUMENT_MISSING'));
});
test('unexpected documents and incomplete or duplicate snapshots cannot pass', () => {
    const before = baseline();
    const after = structuredClone(before);
    after.messages.push({ id: 'intruder', data: { body: 'private' } });
    const result = verifyLegacyDataPreservation(before, after, { protectedCollections });
    assert.equal(result.status, 'blocked');
    assert.ok(result.issues.some(x => x.code === 'UNEXPECTED_DOCUMENT'));
    assert.throws(() => verifyLegacyDataPreservation(before, {}, { protectedCollections }), /COMPLETE_SNAPSHOTS_REQUIRED/);
    assert.throws(() => verifyLegacyDataPreservation(before, before), /EXPLICIT_PROTECTED_COLLECTIONS_REQUIRED/);
    const duplicate = structuredClone(before);
    duplicate.users.push({ id: 'alice', data: {} });
    assert.throws(() => verifyLegacyDataPreservation(duplicate, before, { protectedCollections }), /INVALID_OR_DUPLICATE_SNAPSHOT_RECORD/);
});
test('new allowed public projections never require changing preserved private data', () => {
    const before = baseline();
    const after = structuredClone(before);
    after.publicProfiles = [{ id: 'alice', data: { nickname: 'Alice', level: 8 } }];
    after.nicknameClaims = [{ id: 'alice', data: { uid: 'alice' } }];
    assert.equal(verifyLegacyDataPreservation(before, after, { protectedCollections }).status, 'preserved');
});
