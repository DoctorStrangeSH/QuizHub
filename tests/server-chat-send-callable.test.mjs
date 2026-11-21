import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatSendCallableAdapter } from '../server/chat-send-callable-adapter.mjs';

class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}
const request = data => ({
    auth: { uid: 'alice', token: { firebase: { sign_in_provider: 'password' } } },
    data
});
test('chat callable derives sender UID from verified Auth and accepts only the send contract', async () => {
    const calls = [];
    const handler = createChatSendCallableAdapter({
        HttpsError,
        send: async args => { calls.push(args); return { status: 'created', chatId: 'dm_abc', messageId: args.messageId }; }
    });
    const data = { targetUid: 'bob', messageId: 'message_1234567890abcd', text: 'Hello' };
    assert.deepEqual(await handler(request(data)), { status: 'created', chatId: 'dm_abc', messageId: data.messageId });
    assert.deepEqual(calls, [{ actorUid: 'alice', ...data }]);
    const replyData = { ...data, messageId: 'message_2234567890abcd', replyToMessageId: 'message_3234567890abcd' };
    await handler(request(replyData));
    assert.deepEqual(calls[1], { actorUid: 'alice', ...replyData });
    for (const payload of [
        { ...data, senderId: 'victim' },
        { ...data, targetUid: 'alice' },
        { ...data, targetUid: 'bad/id' },
        { ...data, messageId: 'short' },
        { ...data, text: ' ' },
        { ...data, text: 'x'.repeat(2001) },
        { ...data, extra: true },
        { ...data, replyToMessageId: 'short' },
        { ...data, replyToMessageId: data.messageId },
        ['bob', 'hello'],
        null
    ]) await assert.rejects(handler(request(payload)), e => e.code === 'invalid-argument');
    assert.equal(calls.length, 2);
});

test('chat callable rejects guests and hides unexpected backend errors', async () => {
    const handler = createChatSendCallableAdapter({
        HttpsError, send: async () => { throw new Error('private Firestore credentials leaked'); }
    });
    await assert.rejects(handler({ data: {} }), e => e.code === 'unauthenticated');
    await assert.rejects(handler({
        auth: { uid: 'guest', token: { firebase: { sign_in_provider: 'anonymous' } } },
        data: { targetUid: 'bob', messageId: 'message_1234567890abcd', text: 'Hi' }
    }), e => e.code === 'unauthenticated');
    await assert.rejects(handler(request({
        targetUid: 'bob', messageId: 'message_1234567890abcd', text: 'Hi'
    })), e => e.code === 'internal' && e.message === 'CHAT_SEND_FAILED');
    const membership = createChatSendCallableAdapter({
        HttpsError, send: async () => { throw new Error('CHAT_MEMBERSHIP_REQUIRED'); }
    });
    await assert.rejects(membership(request({
        targetUid: 'bob', messageId: 'message_1234567890abcd', text: 'Hi'
    })), e => e.code === 'permission-denied');
});
