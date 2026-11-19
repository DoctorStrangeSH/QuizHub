import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chat = readFileSync(new URL('../app/modules/chat/chat.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');
const router = readFileSync(new URL('../app/router.js', import.meta.url), 'utf8');

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

test('leaving chat releases Firestore message and online listeners', () => {
  assert.match(chat, /export function cleanupChatListeners\(\)/);
  assert.match(chat, /if \(messagesUnsubscribe\) \{ messagesUnsubscribe\(\)/);
  assert.match(chat, /onlineUnsubscribes\.forEach\(unsubscribe => unsubscribe\(\)\)/);
  assert.match(router, /lastRenderedRoute === 'chat' && route !== 'chat'/);
  assert.match(router, /chatModule\.cleanupChatListeners\(\)/);
});

test('stale friend data cannot reattach listeners after chat route closes', () => {
  assert.match(chat, /const lifecycle = chatLifecycle/);
  assert.match(chat, /lifecycle !== chatLifecycle/);
  assert.match(chat, /!list\.isConnected/);
  assert.match(chat, /auth\.currentUser\?\.uid !== user\.uid/);
});

test('old realtime callbacks and slow sends cannot overwrite a newer chat or draft', () => {
  assert.match(chat, /lifecycle !== chatLifecycle \|\| currentChatId !== chatId \|\| auth\.currentUser\?\.uid !== viewerUid \|\| !messagesContainer\.isConnected/);
  assert.match(chat, /lifecycle !== chatLifecycle \|\| auth\.currentUser\?\.uid !== viewerUid/);
  assert.match(chat, /await addDoc\(collection\(db, 'chats', chatId, 'messages'\)/);
  assert.match(chat, /currentChatId !== chatId \|\| auth\.currentUser\?\.uid !== user\.uid/);
  assert.match(chat, /if \(input\?\.value === text\)/);
});

test('chat switching clears reply context and pending submissions are scoped to a chat', () => {
  assert.match(chat, /window\.openChat = async[\s\S]*?replyMessageId = null;[\s\S]*?selectedMessageId = null;/);
  assert.match(chat, /window\.closeChatWindow = \(\) => \{[\s\S]*?replyMessageId = null;[\s\S]*?selectedMessageId = null;/);
  assert.match(chat, /if \(formSubmitPending\) return;/);
  assert.match(chat, /const submitVersion = \+\+formSubmitVersion/);
  assert.match(chat, /submitVersion === formSubmitVersion\) formSubmitPending = false/);
});

test('failed friend loading exposes a retry control without reviving obsolete responses', () => {
  assert.match(chat, /function showChatFriendsError\(\)/);
  assert.match(chat, /id="retry-chat-friends"/);
  assert.match(chat, /addEventListener\('click', \(\) => loadChatFriends\(\)\)/);
  assert.match(chat, /const revision = \+\+friendsLoadRevision/);
  assert.match(chat, /revision === friendsLoadRevision && auth\.currentUser\?\.uid === user\.uid\) showChatFriendsError/);
  assert.match(chat, /friendsLoadRevision\+\+;/);
});

test('send errors are visible and never replace the next chat status', () => {
  assert.match(chat, /id="chat-send-status" role="status" aria-live="polite"/);
  assert.match(chat, /function setChatSendStatus\(message\)/);
  assert.match(chat, /Не удалось отправить сообщение\. Текст сохранён/);
  assert.match(chat, /lifecycle === chatLifecycle && currentChatId === chatId && auth\.currentUser\?\.uid === user\.uid/);
  assert.match(css, /\.chat-send-status:empty \{ display: none; \}/);
});
