import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const profile = readFileSync(new URL('../app/modules/profile/public-profile.js', import.meta.url), 'utf8');
const create = readFileSync(new URL('../app/modules/profile/profile.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('both account creation and player profile share QuizHub identity', () => {
  assert.ok(profile.includes('QuizHub') && create.includes('QuizHub'));
  assert.ok(!profile.includes('Quiz Empire') && !create.includes('Quiz Empire'));
  assert.ok(profile.includes('profile-hero-eyebrow'));
  assert.ok(create.includes('bi-hexagon-fill'));
});

test('nickname is escaped before inserting into player profile markup', () => {
  assert.match(profile, /escapeHTML\(p\.nickname \|\| 'Игрок'\)/);
  assert.ok(profile.includes('&amp;'));
  assert.ok(profile.includes('&#39;'));
});

test('hero card, progression, stats and achievements are responsive', () => {
  for (const selector of ['.profile-header-card','.profile-avatar-frame','.exp-fill','.profile-stats-grid','.profile-ach-item']) {
    assert.ok(styles.includes(selector), 'missing profile styling: ' + selector);
  }
  assert.match(styles, /@media \(max-width: 520px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
