import test from 'node:test';
import assert from 'node:assert/strict';
import { directChatId, sendDirectMessage } from '../server/chat-messages.mjs';

function fixture() {
    const records = new Map();
    const ref = path => ({
        path,
        id: path.split('/').at(-1),
        collection(name) { return { doc(id) { return ref(path + '/' + name + '/' + id); } }; }
    });
    const db = {
        collection(name) { return { doc(id) { return ref(name + '/' + id); } }; },
        async runTransaction(callback) {
            const writes = [];
            const tx = {
                async get(reference) {
                    const value = records.get(reference.path);
                    return { id: reference.id, exists: value !== undefined, data: () => value };
                },
                create(reference, value) {
                    if (records.has(reference.path)) throw new Error('ALREADY_EXISTS');
                    writes.push([reference.path, value, 'create']);
                },
                update(reference, patch) {
                    const value = records.get(reference.path);
                    if (!value) throw new Error('MISSING_DOC');
                    writes.push([reference.path, { ...value, ...patch }, 'update']);
                }
            };
            const result = await callback(tx);
            for (const [path, value] of writes) records.set(path, value);
            return result;
        }
    };
    return { db, records };
}
const users = () => ({
    alice: { friends: ['bob'], coins: 100, email: 'alice-private@example.test' },
    bob: { friends: ['alice'], coins: 200, email: 'bob-private@example.test' }
});
const send = (db, overrides = {}) => sendDirectMessage(db, {
    actorUid: 'alice', targetUid: 'bob',
    messageId: 'message_1234567890abcd', text: '  Hello, Bob!  ', ...overrides
});

test('direct chat ID is deterministic, order-independent and collision-resistant for underscore UIDs', () => {
    assert.equal(directChatId('alice', 'bob'), directChatId('bob', 'alice'));
    assert.notEqual(directChatId('a_b', 'c'), directChatId('a', 'b_c'));
    assert.throws(() => directChatId('same', 'same'), /INVALID_CHAT_PARTICIPANTS/);
});

test('send creates a member-only chat and message while preserving user profiles', async () => {
    const { db, records } = fixture();
    for (const [uid, profile] of Object.entries(users())) records.set('users/' + uid, profile);
    const result = await send(db);
    assert.equal(result.status, 'created');
    const chat = records.get('chats/' + result.chatId);
    assert.deepEqual(chat.participants, ['alice', 'bob']);
    assert.equal(chat.lastMessagePreview, 'Hello, Bob!');
    const message = records.get('chats/' + result.chatId + '/messages/' + result.messageId);
    assert.equal(message.senderId, 'alice');
    assert.equal(message.recipientId, 'bob');
    assert.equal(message.text, 'Hello, Bob!');
    assert.equal(message.edited, false);
    assert.equal(records.get('users/alice').coins, 100);
    assert.equal(records.get('users/bob').coins, 200);
    assert.equal(records.get('users/alice').email, 'alice-private@example.test');
});

test('exact retry is idempotent and reusing message ID with changed content conflicts', async () => {
    const { db, records } = fixture();
    for (const [uid, profile] of Object.entries(users())) records.set('users/' + uid, profile);
    const first = await send(db);
    assert.equal((await send(db)).status, 'unchanged');
    await assert.rejects(send(db, { text: 'Different content' }), /MESSAGE_ID_CONFLICT/);
    const chatMessages = [...records.keys()].filter(path => path.startsWith('chats/' + first.chatId + '/messages/'));
    assert.equal(chatMessages.length, 1);
});

test('non-friends, one-sided friendships, missing users and malformed inputs are rejected', async () => {
    const { db, records } = fixture();
    for (const [uid, profile] of Object.entries(users())) records.set('users/' + uid, profile);
    records.set('users/charlie', { friends: [] });
    await assert.rejects(send(db, { targetUid: 'charlie' }), /CHAT_MEMBERSHIP_REQUIRED/);
    records.set('users/bob', { friends: [] });
    await assert.rejects(send(db), /CHAT_MEMBERSHIP_REQUIRED/);
    records.delete('users/bob');
    await assert.rejects(send(db), /PROFILE_NOT_FOUND/);
    await assert.rejects(send(db, { messageId: 'short' }), /INVALID_MESSAGE_ID/);
    await assert.rejects(send(db, { text: '   ' }), /INVALID_MESSAGE_TEXT/);
    await assert.rejects(send(db, { text: 'x'.repeat(2001) }), /INVALID_MESSAGE_TEXT/);
    await assert.rejects(send(db, { targetUid: 'alice' }), /INVALID_CHAT_PARTICIPANTS/);
});

test('reply targets must be existing messages in the same direct conversation', async () => {
    const { db, records } = fixture();
    for (const [uid, profile] of Object.entries(users())) records.set('users/' + uid, profile);
    const original = await send(db);
    const replyId = 'message_2234567890abcd';
    const reply = await sendDirectMessage(db, {
        actorUid: 'bob', targetUid: 'alice', messageId: replyId,
        text: 'A reply', replyToMessageId: original.messageId
    });
    assert.equal(reply.status, 'created');
    const stored = records.get('chats/' + original.chatId + '/messages/' + replyId);
    assert.deepEqual(stored.replyTo, {
        id: original.messageId, senderId: 'alice', text: 'Hello, Bob!'
    });
    assert.equal((await sendDirectMessage(db, {
        actorUid: 'bob', targetUid: 'alice', messageId: replyId,
        text: 'A reply', replyToMessageId: original.messageId
    })).status, 'unchanged');
    await assert.rejects(sendDirectMessage(db, {
        actorUid: 'bob', targetUid: 'alice', messageId: 'message_3234567890abcd',
        text: 'Missing target', replyToMessageId: 'message_4234567890abcd'
    }), /REPLY_TARGET_NOT_FOUND/);
    await assert.rejects(send(db, { replyToMessageId: 'short' }), /INVALID_REPLY_TARGET/);
});

test('pre-existing chat with mismatched participants is rejected without writing', async () => {
    const { db, records } = fixture();
    for (const [uid, profile] of Object.entries(users())) records.set('users/' + uid, profile);
    const chatId = directChatId('alice', 'bob');
    records.set('chats/' + chatId, { participants: ['alice', 'charlie'] });
    await assert.rejects(send(db), /CHAT_STATE_CONFLICT/);
    assert.equal([...records.keys()].filter(path => path.includes('/messages/')).length, 0);
});
