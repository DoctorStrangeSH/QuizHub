import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadQuizModule(Mode, settings = { mode: 'classic', category: 'science', difficulty: 'easy' }) {
    const source = readFileSync(new URL('../app/modules/quiz/quiz.js', import.meta.url), 'utf8')
        .replace(/^import .*;\s*$/gm, '')
        .replace(/export (async function|function)/g, '$1');
    const win = {};
    return new Function('getState', 'getQuestions', 'ClassicMode', 'SurvivalMode',
        'TimeTrialMode', 'DuelMode', 'window',
        source + '\nreturn { renderQuiz, resetQuiz, attachQuizListeners };'
    )(() => ({ gameSettings: settings }), () => [{ questionRU: 'Test' }],
        Mode, Mode, Mode, Mode, win);
}

test('navigating away during async initialization never renders the disposed game', async () => {
    let completeInitialization;
    const gate = new Promise(resolve => { completeInitialization = resolve; });
    let renders = 0;
    class FakeMode {
        isDisposed = false;
        async init() { await gate; }
        renderQuestion() { renders++; return 'stale question'; }
        dispose() { this.isDisposed = true; }
    }
    const quiz = loadQuizModule(FakeMode);
    const pending = quiz.renderQuiz();
    quiz.resetQuiz();
    completeInitialization();
    assert.equal(await pending, '');
    assert.equal(renders, 0);
});

test('normal completed initialization still renders the question', async () => {
    class FakeMode {
        isDisposed = false;
        async init() {}
        renderQuestion(index) { return 'question ' + index; }
        dispose() { this.isDisposed = true; }
    }
    const quiz = loadQuizModule(FakeMode);
    assert.equal(await quiz.renderQuiz(), 'question 0');
    quiz.resetQuiz();
});
