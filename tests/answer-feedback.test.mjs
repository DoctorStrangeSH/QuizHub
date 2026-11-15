import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = readFileSync(new URL('../app/modules/quiz/modes/base.js', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('question markup includes a dedicated accessible answer outcome', () => {
  assert.match(base, /id="answer-feedback"[^>]*role="status"[^>]*aria-live="polite"[^>]*hidden/);
  assert.match(base, /data-live-score/);
  assert.match(base, /this\.showAnswerFeedback\(isCorrect, points\)/);
});

test('outcome text is localized and points are only celebrated for correct answers', () => {
  assert.match(base, /Верно! Отличный ход/);
  assert.match(base, /Correct! Great move/);
  assert.match(base, /Запомни правильный ответ/);
  assert.match(base, /Learn the right answer/);
  assert.match(base, /if \(isCorrect && Number\.isFinite\(points\) && points > 0\)/);
  assert.match(base, /feedback\.replaceChildren\(\)/);
  assert.match(base, /message\.textContent = isCorrect/);
});

test('feedback has distinct states and respects reduced-motion preferences', () => {
  assert.match(theme, /\.answer-feedback\[hidden\]/);
  assert.match(theme, /\.answer-feedback\[data-result="wrong"\]/);
  assert.match(theme, /@keyframes arcade-feedback-reveal/);
  assert.match(theme, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.answer-feedback \{ animation: none; \}/);
});
