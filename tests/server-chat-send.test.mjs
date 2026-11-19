import test from 'node:test';
import assert from 'node:assert/strict';
import { directChatId, sendDirectMessage } from '../server/chat-send.mjs';
import { createChatSendCallableAdapter } from '../server/chat-send-callable-adapter.mjs';

function database(initial = {}) {
    const docs = new Map(Object.entries(initial));
    const ref = path => ({ path, collection: sub => ({ doc: id => ref(`${path}/${sub}/${id}`) }) });
    const db = {
        collection: name => ({ doc: id => ref(`${name}/${id}`) }),
        async runTransaction(operation) {
            const pending = [];
            const tx = {
                get: async r => ({ exists: docs.has(r.path), data: () => structuredClone(docs.get(r.path)) }),
                create(r, data) { pending.push([r.path, structuredClone(data), false]); },
                set(r, data, options) { pending.push([r.path, structuredClone(data), Boolean(options?.merge)]); }
            };
            const result = await operation(tx);
            for (const [path, data, merge] of pending) {
                if (!merge && docs.has(path)) throw new Error('already-exists');
                docs.set(path, merge ? { ...docs.get(path), ...data } : data);
            }
            return result;
        }
    };
    return { db, docs };
}

class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}
const alice = 'alice';
const bob = 'bob';
const valid = { recipientUid: bob, text: ' Привет, Боб! ', clientMessageId: 'client_12345' };
const authenticated = data => ({ auth: { uid: alice, token: { firebase: { sign_in_provider: 'password' } } }, data });

test('chat IDs are symmetric and never collide on underscore-separated user IDs', () => {
    assert.equal(directChatId('alice', 'bob'), directChatId('bob', 'alice'));
    assert.notEqual(directChatId('a_b', 'c'), directChatId('a', 'b_c'));
    assert.throws(() => directChatId('bob', 'bob'), /INVALID_CHAT_PARTICIPANTS/);
});

test('trusted send requires mutual friendship, sets immutable members, and is retry-idempotent', async () => {
    const { db, docs } = database({
        'users/alice': { friends: ['bob'], email: 'private@alice.test' },
        'users/bob': { friends: ['alice'], coins: 99 }
    });
    const handler = createChatSendCallableAdapter({ db, HttpsError });
    const result = await handler(authenticated(valid));
    assert.equal(result.status, 'sent');
    const chat = docs.get(`chats/${result.chatId}`);
    assert.deepEqual(chat.memberUids, ['alice', 'bob']);
    assert.deepEqual(docs.get(`chats/${result.chatId}/messages/${result.messageId}`), {
        senderId: 'alice', text: 'Привет, Боб!', createdAt: docs.get(`chats/${result.chatId}/messages/${result.messageId}`).createdAt,
        edited: false, replyTo: null, reactions: {}
    });
    assert.equal(docs.size, 4);
    assert.equal((await handler(authenticated(valid))).status, 'unchanged');
    assert.equal(docs.size, 4);
    await assert.rejects(handler(authenticated({ ...valid, text: 'Other message' })), e =>
        e.code === 'already-exists');
    assert.equal(docs.size, 4);
});

test('message creation increments only recipient unread count and retries do not increment twice', async () => {
    const { db, docs } = database({
        'users/alice': { friends: ['bob'] },
        'users/bob': { friends: ['alice'] }
    });
    const handler = createChatSendCallableAdapter({ db, HttpsError });
    const sent = await handler(authenticated(valid));
    assert.equal(sent.status, 'sent');
    const recipientState = docs.get(`chats/${sent.chatId}/members/bob`);
    assert.equal(recipientState.uid, 'bob');
    assert.equal(recipientState.unreadCount, 1);
    assert.equal(docs.has(`chats/${sent.chatId}/members/alice`), false);

    assert.equal((await handler(authenticated(valid))).status, 'unchanged');
    assert.equal(docs.get(`chats/${sent.chatId}/members/bob`).unreadCount, 1);
});

test('malformed unread state blocks message creation rather than silently resetting the counter', async () => {
    const chatId = directChatId(alice, bob);
    const { db, docs } = database({
        'users/alice': { friends: ['bob'] },
        'users/bob': { friends: ['alice'] },
        [`chats/${chatId}`]: { memberUids: [alice, bob].sort() },
        [`chats/${chatId}/members/bob`]: { uid: bob, unreadCount: -1 }
    });
    await assert.rejects(sendDirectMessage(db, { senderUid: alice, ...valid }), /CHAT_UNREAD_STATE_INVALID/);
    assert.equal(docs.has(`chats/${chatId}/messages/5_alice_client_12345`), false);
    assert.equal(docs.get(`chats/${chatId}/members/bob`).unreadCount, -1);
});

test('unilateral friendship and missing accounts cannot send or create chats', async () => {
    const { db, docs } = database({ 'users/alice': { friends: ['bob'] }, 'users/bob': { friends: [] } });
    const handler = createChatSendCallableAdapter({ db, HttpsError });
    await assert.rejects(handler(authenticated(valid)), e => e.code === 'permission-denied');
    assert.equal(docs.size, 2);
    docs.delete('users/bob');
    await assert.rejects(handler(authenticated(valid)), e => e.code === 'not-found');
    assert.equal(docs.size, 1);
});

test('callable refuses unauthenticated, forged and oversized message requests', async () => {
    const { db, docs } = database();
    const handler = createChatSendCallableAdapter({ db, HttpsError });
    await assert.rejects(handler({ data: valid }), e => e.code === 'unauthenticated');
    await assert.rejects(handler({ ...authenticated(valid), auth: {
        uid: 'alice', token: { firebase: { sign_in_provider: 'anonymous' } }
    } }), e => e.code === 'unauthenticated');
    for (const data of [
        { ...valid, senderUid: 'bob' }, { ...valid, recipientUid: 'alice' },
        { ...valid, recipientUid: '../bob' }, { ...valid, text: ' ' },
        { ...valid, text: 'x'.repeat(2001) }, { ...valid, text: 'a\u0000b' },
        { ...valid, clientMessageId: 'short' }, { ...valid, clientMessageId: '../forged' },
        null, ['bob'], { ...valid, role: 'admin' }
    ]) await assert.rejects(handler(authenticated(data)), e => e.code === 'invalid-argument');
    assert.equal(docs.size, 0);
});

test('existing chat with unexpected membership is never overwritten', async () => {
    const id = directChatId(alice, bob);
    const { db, docs } = database({
        'users/alice': { friends: ['bob'] }, 'users/bob': { friends: ['alice'] },
        [`chats/${id}`]: { memberUids: ['alice', 'charlie'] }
    });
    const handler = createChatSendCallableAdapter({ db, HttpsError });
    await assert.rejects(handler(authenticated(valid)), e => e.code === 'failed-precondition');
    assert.deepEqual(docs.get(`chats/${id}`).memberUids, ['alice', 'charlie']);
    assert.equal(docs.size, 3);
});
