import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
const mark = readFileSync(new URL('../app/assets/quizhub-mark.svg', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('installable identity uses original QuizHub art consistently', () => {
  assert.equal(manifest.icons[0].src, './app/assets/quizhub-mark.svg');
  assert.equal(manifest.theme_color, '#080d19');
  assert.match(html, /rel="icon" type="image\/svg\+xml" href="\.\/app\/assets\/quizhub-mark\.svg"/);
  assert.match(html, /class="splash-logo" src="\.\/app\/assets\/quizhub-mark\.svg"/);
  assert.doesNotMatch(html, /class="splash-logo"[^>]*>🧠/);
});

test('icon contains scalable vector geometry and distinct contrast', () => {
  assert.match(mark, /<svg[^>]*viewBox="0 0 512 512"/);
  assert.match(mark, /#b8fa55/);
  assert.match(mark, /#a89bff/);
  assert.match(mark, /<title[^>]*>QuizHub<\/title>/);
});

test('offline app shell caches the new icon and Midnight Arcade stylesheet', () => {
  assert.match(worker, /quizhub-v6/);
  assert.match(worker, /app\/assets\/quizhub-mark\.svg/);
  assert.match(worker, /app\/styles\/midnight-arcade\.css/);
});

test('guest authentication screen uses the QuizHub brand in both languages', () => {
  const auth = readFileSync(new URL('../app/modules/auth/auth.js', import.meta.url), 'utf8');
  const russian = JSON.parse(readFileSync(new URL('../app/locales/ru.json', import.meta.url), 'utf8'));
  const english = JSON.parse(readFileSync(new URL('../app/locales/en.json', import.meta.url), 'utf8'));

  assert.match(auth, /class="auth-logo-image" src="\.\/app\/assets\/quizhub-mark\.svg"/);
  assert.equal(russian.auth.title, 'QuizHub');
  assert.equal(english.auth.title, 'QuizHub');
  assert.doesNotMatch(russian.auth.subtitle, /Quiz Empire/i);
  assert.doesNotMatch(english.auth.subtitle, /Quiz Empire/i);
});
