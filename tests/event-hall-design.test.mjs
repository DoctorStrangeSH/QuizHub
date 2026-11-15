import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const events = readFileSync(new URL('../app/modules/events/events.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('events hall is branded QuizHub, with localized hero and section headings', () => {
  assert.match(events, /QuizHub<\/h3>/);
  assert.doesNotMatch(events, /Quiz Empire/);
  assert.match(events, /events-eyebrow/);
  assert.match(events, /Events & tournaments/);
  assert.match(events, /Active events/);
});

test('event descriptions and tournament rewards are safely escaped', () => {
  assert.match(events, /const escapeHtml =/);
  for (const field of ['event.nameRU', 'event.descRU', 'tournament.nameRU', 'tournament.descRU', 'reward.nameRU']) {
    assert.ok(events.includes(field), 'expected ' + field);
  }
  assert.match(events, /escapeHtml\(isRU \? event\.nameRU/);
  assert.match(events, /escapeHtml\(isRU \? reward\.nameRU/);
});

test('daily reward list avoids inventing claim state', () => {
  assert.match(events, /first-day/);
  assert.doesNotMatch(events, /index === 0 \? 'today'/);
  assert.match(events, /Выделение не означает/);
});

test('event cards and rewards use responsive Midnight Arcade layouts', () => {
  for (const selector of ['.events-hero', '.event-card', '.daily-rewards-row', '.tournament-rewards', '.event-status']) {
    assert.ok(styles.includes(selector), 'missing ' + selector);
  }
  assert.match(styles, /@media \(max-width: 980px\)/);
  assert.match(styles, /@media \(max-width: 580px\)/);
});
