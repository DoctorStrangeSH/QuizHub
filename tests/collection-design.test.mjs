import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shop = readFileSync(new URL('../app/modules/shop/shop.js', import.meta.url), 'utf8');
const achievements = readFileSync(new URL('../app/modules/achievements/achievements.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('collection screens use the shared brand and descriptive headings', () => {
  for (const module of [shop,achievements]) {
    assert.ok(module.includes('arcade-mark'));
    assert.ok(module.includes('QuizHub'));
    assert.ok(!module.includes('Quiz Empire'));
    assert.ok(module.includes('collection-eyebrow'));
    assert.ok(module.includes('collection-subtitle'));
  }
});

test('shop has responsive item cards with clear equipped, affordable and disabled states', () => {
  for (const selector of ['.shop-items { display: grid','.shop-item.equipped-item','.shop-btn.buy','.shop-btn.equip','.shop-btn.cant-buy:disabled']) {
    assert.ok(css.includes(selector), 'missing store treatment: ' + selector);
  }
  assert.ok(shop.includes("setAttribute('aria-selected', 'true')"));
  assert.ok(shop.includes('item.price'));
});

test('achievements distinguish unlocked and locked entries without exposing them as actions', () => {
  assert.ok(achievements.includes('isUnlocked'));
  assert.ok(achievements.includes('aria-label='));
  assert.ok(css.includes('.achievement-card.unlocked'));
  assert.ok(css.includes('.achievement-card.locked'));
  assert.match(css, /@media \(max-width: 540px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
