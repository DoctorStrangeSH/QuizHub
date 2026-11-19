import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareChatMessageEdit, prepareChatMessageDelete } from '../app/modules/chat/chat-message-edits.js';

const message = { senderId: 'alice', text: 'Привет', reactions: { bob: '👍' } };
const chat = readFileSync(new URL('../app/modules/chat/chat.js', import.meta.url), 'utf8');

test('sender can edit active message while preserving unrelated message fields', () => {
    assert.deepEqual(prepareChatMessageEdit(message, 'alice', '  Новый текст  '), { text: 'Новый текст', edited: true });
    assert.deepEqual(message, { senderId: 'alice', text: 'Привет', reactions: { bob: '👍' } });
});

test('deleting clears existing reactions and prevents later edits or deletion', () => {
    assert.deepEqual(prepareChatMessageDelete(message, 'alice'), {
        text: '🗑️ Сообщение удалено', deleted: true, reactions: {}
    });
    assert.throws(() => prepareChatMessageEdit({ ...message, deleted: true }, 'alice', 'Oops'), /MESSAGE_UNAVAILABLE/);
    assert.throws(() => prepareChatMessageDelete({ ...message, deleted: true }, 'alice'), /MESSAGE_UNAVAILABLE/);
    assert.match(chat, /msg\.deleted \? '' : `<div class="message-actions">/);
});

test('client refuses editing another sender or invalid content', () => {
    assert.throws(() => prepareChatMessageEdit(message, 'bob', 'Tamper'), /NOT_MESSAGE_SENDER/);
    assert.throws(() => prepareChatMessageDelete(message, 'bob'), /NOT_MESSAGE_SENDER/);
    assert.throws(() => prepareChatMessageEdit(message, 'alice', ' '), /INVALID_MESSAGE_TEXT/);
    assert.throws(() => prepareChatMessageEdit(message, 'alice', 'a'.repeat(2001)), /INVALID_MESSAGE_TEXT/);
    assert.throws(() => prepareChatMessageEdit(null, 'alice', 'hello'), /MESSAGE_UNAVAILABLE/);
});
