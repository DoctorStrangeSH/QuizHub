import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chat = readFileSync(new URL('../app/modules/chat/chat.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('chat has QuizHub identity and accessible message controls', () => {
  assert.match(chat, /QuizHub<\/h3>/);
  assert.doesNotMatch(chat, /Quiz Empire/);
  assert.match(chat, /role="log"/);
  assert.match(chat, /aria-label="Отправить сообщение"/);
  assert.match(chat, /maxlength="2000"/);
});

test('friend picker does not embed user names in executable handlers', () => {
  assert.match(chat, /data-chat-index/);
  assert.match(chat, /list\.onclick = event =>/);
  assert.match(chat, /escapeHtml\(friend\.nickname/);
  assert.doesNotMatch(chat, /onclick="window\.openChat/);
});

test('message text, quotes and reactions are escaped', () => {
  assert.match(chat, /const escapeHtml =/);
  assert.match(chat, /escapeHtml\(displayText\)/);
  assert.match(chat, /escapeHtml\(String\(msg\.replyTo\.text/);
  assert.match(chat, /Object\.values\(msg\.reactions\)\.map\(escapeHtml\)/);
});

test('online status subscriptions and global menu listener are safe', () => {
  assert.match(chat, /onlineUnsubscribes\.forEach\(unsubscribe => unsubscribe\(\)\)/);
  assert.match(chat, /onlineUnsubscribes\.push\(unsubscribe\)/);
  assert.match(chat, /if \(menu\) menu\.style\.display/);
});

test('messenger uses responsive, reduced-motion-aware visual system', () => {
  for (const part of ['.chat-layout', '.chat-friend-item', '.message-bubble', '.chat-input-form', '.chat-send-btn']) {
    assert.ok(css.includes(part), 'missing style ' + part);
  }
  assert.match(css, /@media \(max-width: 768px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
