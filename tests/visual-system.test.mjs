import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const design = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('visual system loads after module styles to avoid accidental overrides', () => {
  const lastModule = html.indexOf('app/modules/loader/loader.css');
  const designLink = html.indexOf('app/styles/midnight-arcade.css');
  assert.ok(lastModule >= 0 && designLink > lastModule);
  assert.equal(html.match(/app\/styles\/midnight-arcade\.css/g)?.length, 1);
});

test('dark and light palettes provide complete key color tokens', () => {
  const lightStart = design.indexOf('[data-theme="light"]');
  const dark = design.slice(0, lightStart);
  const light = design.slice(lightStart, design.indexOf('html {', lightStart));
  for (const token of ['--bg-primary','--bg-glass','--text-primary','--text-secondary','--accent','--border','--border-glow']) {
    assert.ok(dark.includes(token + ':'), 'missing dark token: ' + token);
    assert.ok(light.includes(token + ':'), 'missing light token: ' + token);
  }
});

test('unified styles cover navigation, auth, quiz, calls to action and mobile accessibility', () => {
  for (const selector of ['.dashboard-sidebar','.sidebar-link.active','.auth-card','.quiz-question-card','.answer-card','.play-btn','.daily-challenge-card','.selector-btn.active']) {
    assert.ok(design.includes(selector), 'missing visual treatment: ' + selector);
  }
  assert.match(design, /:focus-visible/);
  assert.match(design, /prefers-reduced-motion: reduce/);
  assert.match(design, /max-width: 520px/);
});
