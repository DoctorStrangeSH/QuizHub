import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const classic = readFileSync(new URL('../app/modules/quiz/modes/classic.js', import.meta.url), 'utf8');
const daily = readFileSync(new URL('../app/modules/quiz/modes/daily-challenge.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('finale derives accuracy from bounded correct answers and total questions', () => {
  assert.match(classic, /Math\.max\(0, Math\.min\(this\.correctAnswers, this\.totalQuestions\)\)/);
  assert.match(classic, /Math\.round\(correct \/ total \* 100\)/);
  assert.match(classic, /role="progressbar"[^>]+aria-valuenow="\$\{accuracy\}"/);
});

test('coins and experience are never marked earned until server save succeeds', () => {
  assert.match(classic, /this\.saveStatus === 'saved' \? `\+\$\{this\.earnedCoins\}`/);
  assert.match(classic, /this\.saveStatus === 'saved' \? `\+\$\{this\.earnedXP\}`/);
  assert.match(classic, /const isPractice = this\.saveStatus === 'practice'/);
  assert.match(classic, /\$\{!isPractice \?/);
});

test('daily practice retains compatibility with new finale selectors', () => {
  assert.match(classic, /class="result-icon arcade-result-icon"/);
  assert.match(classic, /class="text-secondary mb-3"/);
  assert.match(classic, /class="result-label"/);
  assert.match(daily, /super\.showResults\(\)/);
  assert.match(daily, /this\.saveStatus = 'practice'/);
});

test('finale supports mobile and reduced motion', () => {
  assert.match(css, /\.arcade-accuracy-track/);
  assert.match(css, /\.arcade-result-actions > button \{ flex: 1 1 100%; \}/);
  assert.match(css, /\.arcade-result-icon, \.arcade-accuracy-fill \{ animation: none; \}/);
});
