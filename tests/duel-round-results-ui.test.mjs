import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../app/modules/quiz/server-mode-preview-screen.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('Duel preview renders both server-owned scores and round count', () => {
    assert.match(screen, /Number\.isFinite\(progress\.playerScore\) && Number\.isFinite\(progress\.aiScore\)/);
    assert.match(screen, /class="duel-scoreboard"/);
    assert.match(screen, /progress\.answeredQuestions\}\/\$\{progress\.totalQuestions/);
});

test('Duel round feedback uses server-reported player and opponent outcomes', () => {
    assert.match(screen, /lastResponse\.aiCorrect/);
    assert.match(screen, /class="duel-round-feedback"/);
    assert.match(screen, /round: 'Раунд'/);
    assert.match(screen, /round: 'Round'/);
});

test('Duel final receipt displays server outcome and both final scores', () => {
    assert.match(screen, /receipt\.outcome === 'win'/);
    assert.match(screen, /receipt\.outcome === 'loss'/);
    assert.match(screen, /class="duel-final-score"/);
    assert.match(styles, /\.duel-scoreboard/);
    assert.match(styles, /\.duel-final-score/);
});
