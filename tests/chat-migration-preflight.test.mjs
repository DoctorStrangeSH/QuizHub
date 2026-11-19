import test from 'node:test';
import assert from 'node:assert/strict';
import { planLegacyChatMigration } from '../server/chat-migration-preflight.mjs';
import { directChatId } from '../server/chat-send.mjs';

const users = [
    { uid: 'alice', friends: ['bob'] },
    { uid: 'bob', friends: ['alice'] },
    { uid: 'charlie', friends: [] }
];
const messages = [
    { chatId: 'alice_bob', messageId: 'm1', senderId: 'alice', text: 'private data!' },
    { chatId: 'alice_bob', messageId: 'm2', senderId: 'bob', text: 'more private data!' }
];

test('preflight maps mutual friends and message IDs without emitting bodies', () => {
    const plan = planLegacyChatMigration({ users, messages });
    assert.equal(plan.ready, true);
    assert.equal(plan.totalMessages, 2);
    assert.equal(plan.mappedMessages, 2);
    assert.deepEqual(plan.chats, [{
        legacyId: 'alice_bob', nextId: directChatId('alice', 'bob'),
        memberUids: ['alice', 'bob'], messageIds: ['m1', 'm2']
    }]);
    assert.equal(JSON.stringify(plan).includes('private data'), false);
});

test('preflight quarantines chats whose users are no longer mutual friends', () => {
    const plan = planLegacyChatMigration({
        users: [{ uid: 'alice', friends: ['bob'] }, { uid: 'bob', friends: [] }], messages
    });
    assert.equal(plan.ready, false);
    assert.deepEqual(plan.chats, []);
    assert.equal(plan.blockers[0].code, 'UNRESOLVED_LEGACY_CHAT');
});

test('preflight detects collisions in legacy underscore-joined IDs', () => {
    const plan = planLegacyChatMigration({
        users: [
            { uid: 'a_b', friends: ['c'] }, { uid: 'c', friends: ['a_b'] },
            { uid: 'a', friends: ['b_c'] }, { uid: 'b_c', friends: ['a'] }
        ],
        messages: [{ chatId: 'a_b_c', messageId: 'm1', senderId: 'a' }]
    });
    assert.equal(plan.ready, false);
    assert.ok(plan.blockers.some(blocker => blocker.code === 'AMBIGUOUS_LEGACY_CHAT_ID'));
});

test('preflight blocks a conversation larger than the copier transaction limit', () => {
    const oversized = Array.from({ length: 101 }, (_, index) => ({
        chatId: 'alice_bob', messageId: `message_${String(index).padStart(3, '0')}`,
        senderId: index % 2 ? 'bob' : 'alice'
    }));
    const plan = planLegacyChatMigration({ users, messages: oversized });
    assert.equal(plan.ready, false);
    assert.equal(plan.chats.length, 0);
    assert.ok(plan.blockers.some(blocker =>
        blocker.code === 'CHAT_EXCEEDS_SINGLE_TRANSACTION_LIMIT' &&
        blocker.messageCount === 101 && blocker.maximum === 100
    ));
});

test('preflight refuses existing destinations and forged senders', () => {
    const plan = planLegacyChatMigration({
        users, messages: [...messages, { chatId: 'alice_bob', messageId: 'm3', senderId: 'charlie' }],
        destinationChatIds: [directChatId('alice', 'bob')]
    });
    assert.equal(plan.ready, false);
    assert.ok(plan.blockers.some(blocker => blocker.code === 'DESTINATION_ALREADY_EXISTS'));
    assert.ok(plan.blockers.some(blocker => blocker.code === 'FORGED_OR_UNKNOWN_SENDER'));
});

test('preflight refuses duplicate paths, orphaned conversations and invalid snapshots', () => {
    const plan = planLegacyChatMigration({
        users, messages: [...messages, messages[0], { chatId: 'lost_chat', messageId: 'm1', senderId: 'alice' }]
    });
    assert.equal(plan.ready, false);
    assert.ok(plan.blockers.some(blocker => blocker.code === 'DUPLICATE_MESSAGE_PATH'));
    assert.ok(plan.blockers.some(blocker => blocker.code === 'UNRESOLVED_LEGACY_CHAT'));
    assert.throws(() => planLegacyChatMigration({ users: [{ uid: 'alice', friends: 'bob' }], messages: [] }),
        /INVALID_MIGRATION_ACCOUNT/);
});

test('preflight quarantines malformed, foreign and stale deleted-message reactions without leaking values', () => {
    const cases = [
        [{ alice: '🔥' }, false, 'INVALID_LEGACY_REACTIONS'],
        [['👍'], false, 'INVALID_LEGACY_REACTIONS'],
        [{ charlie: '❤️' }, false, 'NONMEMBER_LEGACY_REACTION'],
        [{ bob: '👍' }, true, 'DELETED_MESSAGE_REACTIONS_REMAIN']
    ];
    for (const [reactions, deleted, expected] of cases) {
        const result = planLegacyChatMigration({
            users, messages: [{ chatId: 'alice_bob', messageId: 'm1', senderId: 'alice',
                reactions, deleted, text: 'private secret' }]
        });
        assert.equal(result.ready, false);
        assert.equal(result.blockers[0].code, expected);
        assert.equal(result.mappedMessages, 0);
        assert.equal(JSON.stringify(result).includes('private secret'), false);
        assert.equal(JSON.stringify(result).includes('🔥'), false);
    }
    assert.equal(planLegacyChatMigration({ users, messages: [{ ...messages[0],
        reactions: { bob: '👍' } }] }).ready, true);
});
