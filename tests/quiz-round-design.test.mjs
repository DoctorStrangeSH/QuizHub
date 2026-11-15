import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mode = readFileSync(new URL('../app/modules/quiz/modes/base.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('quiz question has a localized non-interactive kicker and escaped question', () => {
  assert.match(mode, /quiz-question-kicker/);
  assert.match(mode, /ВОПРОС РАУНДА/);
  assert.match(mode, /ROUND QUESTION/);
  assert.match(mode, /escapeHTML\(qText\)/);
});

test('answer gallery includes mobile layout and distinct correct/wrong states', () => {
  assert.match(css, /\.quiz-answers \{ display: grid; grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /\.quiz-answers \.answer-card\.correct/);
  assert.match(css, /\.quiz-answers \.answer-card\.wrong/);
  assert.match(css, /\.quiz-answers \.answer-card:hover:not\(\.answered\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('progress, explanation and victory panel are themed without touching rewards', () => {
  for (const selector of ['.quiz-progress', '.quiz-question-card', '#answer-explanation', '.quiz-result', '.timer-display']) {
    assert.ok(css.includes(selector), 'missing styling for ' + selector);
  }
  assert.match(mode, /this\.showAnswerExplanation\(\)/);
  assert.match(mode, /this\.saveStatus/);
});
