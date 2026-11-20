import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../app/modules/quiz/server-mode-preview-screen.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('Survival preview renders accessible server-owned hearts and streak', () => {
    assert.match(screen, /Number\.isFinite\(progress\.lives\)/);
    assert.match(screen, /class="survival-heart/);
    assert.match(screen, /aria-label="\$\{l\.lives\}: \$\{lives\} \/ \$\{totalLives\}"/);
    assert.match(screen, /class="survival-streak"/);
    assert.match(screen, /state\.progress\.lives < previousProgress\.lives/);
});

test('Survival life-loss feedback is localized and respects reduced motion', () => {
    assert.match(screen, /lifeLost: 'Life lost'/);
    assert.match(screen, /lifeLost: 'Потеряна жизнь'/);
    assert.match(styles, /\.survival-life-feedback/);
    assert.match(styles, /prefers-reduced-motion: reduce/);
});
