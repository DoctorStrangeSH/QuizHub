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
