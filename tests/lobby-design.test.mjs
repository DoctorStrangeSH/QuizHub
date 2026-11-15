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
