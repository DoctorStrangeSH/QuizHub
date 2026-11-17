import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dashboard = readFileSync(new URL('../app/modules/dashboard/dashboard.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('lobby has one QuizHub identity and consistent icon set', () => {
  assert.ok(!dashboard.includes('Quiz Empire'));
  assert.match(dashboard, /arcade-mark/);
  for (const icon of ['bi-house-door-fill','bi-chat-dots-fill','bi-people-fill','bi-trophy-fill','bi-bag-fill','bi-person-circle']) {
    assert.ok(dashboard.includes(icon), 'missing icon ' + icon);
  }
  assert.match(styles, /\.arcade-mark/);
});

test('choosing a game mode cannot clear the selected difficulty button', () => {
  assert.ok(dashboard.includes("document.querySelectorAll('[data-mode].selector-btn')"));
  assert.ok(dashboard.includes("document.querySelectorAll('.diff-btn')"));
  assert.ok(!dashboard.includes("document.querySelectorAll('.selector-btn').forEach"));
  assert.match(dashboard, /setAttribute\('aria-pressed', 'true'\)/);
});

test('mobile navigation reports expanded state and nickname is escaped', () => {
  assert.match(dashboard, /aria-controls="sidebar" aria-expanded="false"/);
  assert.match(dashboard, /setAttribute\('aria-expanded', String\(opened\)\)/);
  assert.match(dashboard, /setAttribute\('aria-expanded', 'false'\)/);
  assert.match(dashboard, /&#39;/);
});


test('category picker is a modal grid of keyboard-operable buttons', () => {
  assert.match(dashboard, /role="dialog" aria-modal="true"/);
  assert.match(dashboard, /aria-labelledby="category-modal-title"/);
  assert.match(dashboard, /<button type="button" class="sidebar-cat-item/);
  assert.match(dashboard, /setAttribute\('aria-hidden', 'false'\)/);
  assert.match(dashboard, /event.key === 'Escape'/);
  assert.match(dashboard, /event.key !== 'Tab'/);
  assert.match(dashboard, /categoryReturnFocus\?\.focus/);
  assert.match(styles, /\.category-modal-body \{ display: grid/);
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});
