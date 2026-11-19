import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHAT_SERVER_TRANSPORT_ENABLED, chatIdForUsers, chatTransportMode } from '../app/modules/chat/chat-transport-gate.js';

const chat = readFileSync(new URL('../app/modules/chat/chat.js', import.meta.url), 'utf8');

test('chat transport cutover stays disabled until the protected server path is ready', () => {
    assert.equal(CHAT_SERVER_TRANSPORT_ENABLED, false);
    assert.equal(chatTransportMode(), 'legacy');
    assert.equal(chatIdForUsers('bob', 'alice'), 'alice_bob');
    assert.equal(chatIdForUsers('alice', 'bob'), 'alice_bob');
    assert.match(chat, /currentChatId = chatIdForUsers\(user\.uid, friendId\)/);
    assert.match(chat, /await addDoc\(collection\(db, 'chats', chatId, 'messages'\)/);
    assert.throws(() => chatIdForUsers('a/b', 'bob'), /INVALID_CHAT_PARTICIPANTS/);
    assert.throws(() => chatIdForUsers('alice', 'alice'), /INVALID_CHAT_PARTICIPANTS/);
});

test('legacy chat editing and deletion failures are visible and scoped to active conversation', () => {
    assert.match(chat, /window\.editMessage = async/);
    assert.match(chat, /window\.deleteMessage = async/);
    assert.match(chat, /prepareChatMessageEdit\(snapshot\.exists\(\) \? snapshot\.data\(\) : null, userUid, newText\)/);
    assert.match(chat, /prepareChatMessageDelete\(snapshot\.exists\(\) \? snapshot\.data\(\) : null, userUid\)/);
    assert.match(chat, /await runTransaction\(db, async transaction =>/);
    assert.match(chat, /Не удалось изменить сообщение/);
    assert.match(chat, /Не удалось удалить сообщение/);
    assert.match(chat, /lifecycle === chatLifecycle && currentChatId === chatId && auth\.currentUser\?\.uid === userUid/);
});
