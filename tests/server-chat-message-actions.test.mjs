import test from 'node:test';
import assert from 'node:assert/strict';
import { directChatId } from '../server/chat-send.mjs';
import { createChatActionsCallableAdapter } from '../server/chat-message-actions-callable-adapter.mjs';

const chatId = directChatId('alice', 'bob');
const path = `chats/${chatId}/messages/m1`;

function fakeDb() {
    const data = new Map([
        [`chats/${chatId}`, { memberUids: ['alice', 'bob'] }],
        [path, { senderId: 'alice', text: 'hello', edited: false, reactions: {} }]
    ]);
    const ref = path => ({ path, collection: name => ({ doc: id => ref(`${path}/${name}/${id}`) }) });
    return {
        data,
        db: {
            collection: name => ({ doc: id => ref(`${name}/${id}`) }),
            async runTransaction(run) {
                const updates = [];
                const tx = {
                    get: async ref => ({ exists: data.has(ref.path), data: () => structuredClone(data.get(ref.path)) }),
                    update: (ref, fields) => updates.push([ref.path, fields])
                };
                const result = await run(tx);
                for (const [id, fields] of updates) data.set(id, { ...data.get(id), ...fields });
                return result;
            }
        }
    };
}

class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}
const call = (uid, data) => ({ auth: { uid, token: { firebase: { sign_in_provider: 'password' } } }, data });
const input = { chatId, messageId: 'm1' };

test('only sender edits or deletes; a member can react only under their own UID', async () => {
    const { db, data } = fakeDb();
    const handler = createChatActionsCallableAdapter({ db, HttpsError });
    await assert.rejects(handler(call('bob', { ...input, action: 'edit', text: 'forged' })),
        error => error.code === 'permission-denied');
    await assert.rejects(handler(call('charlie', { ...input, action: 'react', reaction: '❤️' })),
        error => error.code === 'permission-denied');
    assert.deepEqual(await handler(call('bob', { ...input, action: 'react', reaction: '❤️' })), { status: 'updated' });
    assert.deepEqual(data.get(path).reactions, { bob: '❤️' });
    await handler(call('alice', { ...input, action: 'edit', text: ' hello world ' }));
    assert.equal(data.get(path).text, 'hello world');
    assert.equal(data.get(path).edited, true);
    assert.deepEqual(data.get(path).reactions, { bob: '❤️' });
    await handler(call('bob', { ...input, action: 'react', reaction: '❤️' }));
    assert.deepEqual(data.get(path).reactions, {});
    await assert.rejects(handler(call('bob', { ...input, action: 'delete' })),
        error => error.code === 'permission-denied');
    await handler(call('alice', { ...input, action: 'delete' }));
    assert.equal(data.get(path).deleted, true);
    assert.deepEqual(data.get(path).reactions, {});
    assert.equal((await handler(call('alice', { ...input, action: 'delete' }))).status, 'unchanged');
    await assert.rejects(handler(call('alice', { ...input, action: 'edit', text: 'after delete' })),
        error => error.code === 'failed-precondition');
    await assert.rejects(handler(call('bob', { ...input, action: 'react', reaction: '👍' })),
        error => error.code === 'failed-precondition');
});

test('deletion scrubs existing reactions and rejected operations leave messages unchanged', async () => {
    const { db, data } = fakeDb();
    const handler = createChatActionsCallableAdapter({ db, HttpsError });
    data.set(path, { ...data.get(path), reactions: { alice: '👍', bob: '❤️' } });
    await assert.rejects(handler(call('bob', { ...input, action: 'delete' })),
        error => error.code === 'permission-denied');
    assert.deepEqual(data.get(path).reactions, { alice: '👍', bob: '❤️' });
    await handler(call('alice', { ...input, action: 'delete' }));
    assert.deepEqual(data.get(path), {
        senderId: 'alice', text: '🗑️ Сообщение удалено', edited: false,
        deleted: true, reactions: {}
    });
});

test('action callable refuses forged fields, guests, invalid reactions and corrupt membership', async () => {
    const { db, data } = fakeDb();
    const handler = createChatActionsCallableAdapter({ db, HttpsError });
    await assert.rejects(handler({ data: { ...input, action: 'delete' } }), e => e.code === 'unauthenticated');
    await assert.rejects(handler({ ...call('alice', { ...input, action: 'delete' }), auth: {
        uid: 'alice', token: { firebase: { sign_in_provider: 'anonymous' } }
    } }), e => e.code === 'unauthenticated');
    for (const data of [
        { ...input, action: 'delete', actorUid: 'alice' },
        { ...input, action: 'edit', text: 'x'.repeat(2001) },
        { ...input, action: 'react', reaction: '🔥' },
        { ...input, action: 'delete', messageId: '../other' },
        { ...input, action: 'edit', text: ' ' }
    ]) await assert.rejects(handler(call('alice', data)), e => e.code === 'invalid-argument');
    data.set(`chats/${chatId}`, { memberUids: ['alice', 'charlie'] });
    await assert.rejects(handler(call('alice', { ...input, action: 'delete' })),
        e => e.code === 'permission-denied');
});
