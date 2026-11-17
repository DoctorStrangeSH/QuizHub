import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const friends = readFileSync(new URL('../app/modules/friends/friends.js', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('friends social club matches QuizHub identity', () => {
  assert.match(friends, /<h3 class="sidebar-title text-gradient">QuizHub<\/h3>/);
  assert.match(friends, /friends-kicker/);
  assert.match(friends, /bi-people-fill/);
  assert.doesNotMatch(friends, /Quiz Empire/);
});

test('player names are escaped in social lists and discovery', () => {
  assert.match(friends, /const escapeHtml =/);
  for (const expression of ['f.nickname', 'r.nickname', 's.nickname', 'data.nickname']) {
    assert.ok(friends.includes('escapeHtml(' + expression), 'must escape ' + expression);
  }
  assert.doesNotMatch(friends, /\$\{(?:f|r|s|data)\.nickname\}/);
});

test('friends tabs communicate selection to assistive technology', () => {
  assert.match(friends, /role="tablist"/);
  assert.match(friends, /role="tab"/);
  assert.match(friends, /aria-selected/);
  assert.match(friends, /setAttribute\('aria-selected'/);
  assert.match(friends, /role="tabpanel"/);
});

test('search supports keyboard submit and handles lookup errors', () => {
  assert.match(friends, /searchInput\.addEventListener\('keydown'/);
  assert.match(friends, /if \(event\.key === 'Enter'\) searchBtn\.click\(\)/);
  assert.match(friends, /catch \(error\) \{ console\.error\('Ошибка поиска игроков:'/);
});

test('Midnight Arcade social screens adapt to small screens', () => {
  for (const selector of ['.friends-header', '.search-result-item', '.friend-item', '.friends-tabs .tab-btn']) {
    assert.ok(theme.includes(selector), 'missing social selector ' + selector);
  }
  assert.match(theme, /@media \(max-width: 600px\)/);
  assert.match(theme, /@media \(prefers-reduced-motion: reduce\)/);
});
