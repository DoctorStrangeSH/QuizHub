import test from 'node:test';
import assert from 'node:assert/strict';
import { markDirectChatRead } from '../server/chat-read-state.mjs';
import { createChatReadStateCallableAdapter } from '../server/chat-read-state-callable-adapter.mjs';
import { directChatId } from '../server/chat-send.mjs';

function database(initial = {}) {
    const docs = new Map(Object.entries(initial));
    const ref = path => ({
        path,
        collection: name => ({ doc: id => ref(`${path}/${name}/${id}`) })
    });
    const db = {
        collection: name => ({ doc: id => ref(`${name}/${id}`) }),
        async runTransaction(operation) {
            const writes = [];
            const tx = {
                get: async target => ({ exists: docs.has(target.path), data: () => structuredClone(docs.get(target.path)) }),
                set(target, value, options) {
                    writes.push([target.path, options?.merge ? { ...docs.get(target.path), ...structuredClone(value) } : structuredClone(value)]);
                }
            };
            const result = await operation(tx);
            for (const [path, value] of writes) docs.set(path, value);
            return result;
        }
    };
    return { db, docs };
}
class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }

const alice = 'alice';
const bob = 'bob';
const chatId = directChatId(alice, bob);
const earlier = new Date('2030-01-01T10:00:00.000Z');
const later = new Date('2030-01-01T10:01:00.000Z');
const seed = {
    [`chats/${chatId}`]: { memberUids: [alice, bob] },
    [`chats/${chatId}/messages/m_earlier`]: { senderId: bob, createdAt: earlier },
    [`chats/${chatId}/messages/m_later`]: { senderId: alice, createdAt: later },
    [`chats/${chatId}/messages/tie_a`]: { senderId: bob, createdAt: later },
    [`chats/${chatId}/messages/tie_b`]: { senderId: alice, createdAt: later }
};
const auth = data => ({ auth: { uid: alice, token: { firebase: { sign_in_provider: 'password' } } }, data });

test('read cursor is per-member and can advance monotonically', async () => {
    const { db, docs } = database(seed);
    const handler = createChatReadStateCallableAdapter({ db, HttpsError });
    assert.deepEqual(await handler(auth({ chatId, lastReadMessageId: 'm_earlier' })), {
        status: 'updated', chatId, lastReadMessageId: 'm_earlier'
    });
    assert.equal(docs.get(`chats/${chatId}/members/alice`).lastReadMessageId, 'm_earlier');
    assert.equal(docs.has(`chats/${chatId}/members/bob`), false);
    assert.equal((await handler(auth({ chatId, lastReadMessageId: 'm_later' }))).status, 'updated');
    assert.equal(docs.get(`chats/${chatId}/members/alice`).lastReadMessageId, 'm_later');
});

test('read cursor refuses to move backwards and is idempotent', async () => {
    const { db, docs } = database({
        ...seed,
        [`chats/${chatId}/members/alice`]: {
            uid: alice, lastReadMessageId: 'm_later', lastReadAt: later
        }
    });
    assert.equal((await markDirectChatRead(db, { actorUid: alice, chatId, lastReadMessageId: 'm_earlier' })).status, 'stale');
    assert.equal(docs.get(`chats/${chatId}/members/alice`).lastReadMessageId, 'm_later');
    assert.equal((await markDirectChatRead(db, { actorUid: alice, chatId, lastReadMessageId: 'm_later' })).status, 'unchanged');
});

test('advancing a partial read cursor never clears the independent unread counter', async () => {
    const { db, docs } = database({
        ...seed,
        [`chats/${chatId}/members/alice`]: {
            uid: alice, unreadCount: 4
        }
    });
    await markDirectChatRead(db, { actorUid: alice, chatId, lastReadMessageId: 'm_earlier' });
    const state = docs.get(`chats/${chatId}/members/alice`);
    assert.equal(state.lastReadMessageId, 'm_earlier');
    assert.equal(state.unreadCount, 4);
});

test('read cursor uses message ID as deterministic tie-breaker for equal timestamps', async () => {
    const { db, docs } = database(seed);
    await markDirectChatRead(db, { actorUid: alice, chatId, lastReadMessageId: 'tie_b' });
    const stale = await markDirectChatRead(db, { actorUid: alice, chatId, lastReadMessageId: 'tie_a' });
    assert.equal(stale.status, 'stale');
    assert.equal(docs.get(`chats/${chatId}/members/alice`).lastReadMessageId, 'tie_b');
});

test('outsiders and forged chat/message targets are rejected', async () => {
    const { db } = database(seed);
    await assert.rejects(markDirectChatRead(db, {
        actorUid: 'charlie', chatId, lastReadMessageId: 'm_later'
    }), /CHAT_MEMBER_REQUIRED/);
    await assert.rejects(markDirectChatRead(db, {
        actorUid: alice, chatId, lastReadMessageId: 'missing_1'
    }), /CHAT_READ_TARGET_NOT_FOUND/);
    await assert.rejects(markDirectChatRead(db, {
        actorUid: alice, chatId: 'legacy_chat', lastReadMessageId: 'm_later'
    }), /CHAT_MEMBER_REQUIRED|CHAT_READ_TARGET_NOT_FOUND/);
});

test('callable rejects unauthenticated, anonymous and extra client-controlled fields', async () => {
    const { db } = database(seed);
    const handler = createChatReadStateCallableAdapter({ db, HttpsError });
    await assert.rejects(handler({ data: { chatId, lastReadMessageId: 'm_later' } }), e => e.code === 'unauthenticated');
    await assert.rejects(handler({ ...auth({ chatId, lastReadMessageId: 'm_later' }), auth: {
        uid: alice, token: { firebase: { sign_in_provider: 'anonymous' } }
    } }), e => e.code === 'unauthenticated');
    await assert.rejects(handler(auth({ chatId, lastReadMessageId: 'm_later', uid: 'bob' })), e => e.code === 'invalid-argument');
});
