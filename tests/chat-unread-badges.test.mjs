import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createDirectChatId, renderUnreadBadge } from '../app/modules/chat/chat-unread-badges.js';

test('direct chat ID matches the trusted server SHA-256 derivation', async () => {
    const forward = await createDirectChatId('alice', 'bob', webcrypto);
    const reverse = await createDirectChatId('bob', 'alice', webcrypto);
    assert.equal(forward, reverse);
    assert.match(forward, /^dm_[a-f0-9]{48}$/);
    const expected = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(['alice', 'bob'].join('\0')));
    const hex = Array.from(new Uint8Array(expected), b => b.toString(16).padStart(2, '0')).join('');
    assert.equal(forward, 'dm_' + hex.slice(0, 48));
});

test('direct chat ID rejects invalid or identical participants and missing Web Crypto', async () => {
    await assert.rejects(createDirectChatId('alice', 'alice', webcrypto), /INVALID_CHAT_PARTICIPANTS/);
    await assert.rejects(createDirectChatId('../alice', 'bob', webcrypto), /INVALID_CHAT_PARTICIPANTS/);
    await assert.rejects(createDirectChatId('alice', 'bob', {}), /WEB_CRYPTO_REQUIRED/);
});

test('unread badge hides zero, caps at 99+ and escapes accessible labels', () => {
    assert.equal(renderUnreadBadge(0), '');
    assert.equal(renderUnreadBadge(-1), '');
    assert.ok(renderUnreadBadge(1, 'Новое').includes('aria-label="Новое">1</span>'));
    const large = renderUnreadBadge(100, '<img onerror=alert(1)>');
    assert.ok(large.includes('>99+</span>'));
    assert.ok(large.includes('&lt;img onerror=alert(1)&gt;'));
});