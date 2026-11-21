import test from 'node:test';
import assert from 'node:assert/strict';
import {
    chatTimestampMillis, normalizeChatHistoryPage, mergeChatHistoryMessages,
    latestIncomingMessageId, formatProjectedReactions, createChatMessageId
} from '../app/modules/chat/chat-preview-history.js';

const chatId = 'dm_' + 'a'.repeat(48);
const stamp = seconds => ({ seconds, nanoseconds: 0 });
const message = (id, senderId, recipientId, seconds, extra = {}) => ({
    id, senderId, recipientId, createdAt: stamp(seconds), text: id, deleted: false, edited: false, ...extra
});

test('history response validates and sorts newest-first server pages for chronological UI', () => {
    const page = normalizeChatHistoryPage({
        chatId, nextCursor: 'message_00000000000001',
        messages: [message('message_00000000000002', 'bob', 'alice', 2), message('message_00000000000001', 'alice', 'bob', 1)]
    }, chatId);
    assert.deepEqual(page.messages.map(item => item.id), ['message_00000000000001', 'message_00000000000002']);
    assert.equal(chatTimestampMillis(page.messages[0].createdAt), 1000);
});

test('history response rejects wrong chat, duplicate IDs and malformed read states', () => {
    assert.throws(() => normalizeChatHistoryPage({ chatId: 'wrong', messages: [], nextCursor: null }, chatId), /INVALID_CHAT_HISTORY_RESPONSE/);
    const duplicate = message('message_00000000000001', 'alice', 'bob', 1);
    assert.throws(() => normalizeChatHistoryPage({ chatId, messages: [duplicate, duplicate], nextCursor: null }, chatId), /INVALID_CHAT_HISTORY_MESSAGE/);
    assert.throws(() => normalizeChatHistoryPage({ chatId, messages: [{ ...duplicate, readByRecipient: 'yes' }], nextCursor: null }, chatId), /INVALID_CHAT_HISTORY_MESSAGE/);
});

test('older history pages merge without duplicates and remain chronological', () => {
    const newer = message('message_00000000000002', 'bob', 'alice', 2);
    const older = message('message_00000000000001', 'alice', 'bob', 1);
    assert.deepEqual(mergeChatHistoryMessages([newer], [older, newer]).map(item => item.id), [older.id, newer.id]);
});

test('read cursor targets newest incoming message, not the newest outgoing message', () => {
    const items = [message('message_00000000000001', 'bob', 'alice', 1),
        message('message_00000000000002', 'alice', 'bob', 2),
        message('message_00000000000003', 'bob', 'alice', 3)];
    assert.equal(latestIncomingMessageId(items, 'alice'), 'message_00000000000003');
    assert.equal(latestIncomingMessageId(items.slice(1, 2), 'alice'), null);
});

test('projected reactions are rendered from allowlisted counts only', () => {
    assert.equal(formatProjectedReactions({ like: { count: 2, reactedByMe: true }, fire: { count: 1, reactedByMe: false }, rogue: { count: 4 } }), '👍 2 🔥');
    assert.equal(formatProjectedReactions({ like: { count: -1 } }), '');
});

test('message IDs use secure UUIDs and match server validation shape', () => {
    const id = createChatMessageId({ randomUUID: () => '12345678-1234-4234-8234-123456789abc' });
    assert.match(id, /^msg_[a-f0-9]{32}$/);
    assert.throws(() => createChatMessageId({}), /SECURE_RANDOM_REQUIRED/);
});