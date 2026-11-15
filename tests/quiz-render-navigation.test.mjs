import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadQuizModule(Mode, settings = { mode: 'classic', category: 'science', difficulty: 'easy' }, questions = [{ questionRU: 'Test' }]) {
    const source = readFileSync(new URL('../app/modules/quiz/quiz.js', import.meta.url), 'utf8')
        .replace(/^import .*;\s*$/gm, '')
        .replace(/export (async function|function)/g, '$1');
    const win = {};
    let constructions = 0;
    class TrackedMode extends Mode {
        constructor() { super(); constructions++; }
    }
    const dailyChallenges = [];
    const quiz = new Function('getState', 'getQuestions', 'ClassicMode', 'SurvivalMode',
        'TimeTrialMode', 'DuelMode', 'DailyChallengeMode', 'createDailyChallenge',
        'getUtcDateKey', 'window',
        source + '\\nreturn { renderQuiz, resetQuiz, attachQuizListeners };'
    )(() => ({ gameSettings: settings }), () => questions,
        TrackedMode, TrackedMode, TrackedMode, TrackedMode, TrackedMode,
        date => {
            dailyChallenges.push(date);
            return { date, questions };
        },
        () => '2026-11-15', win);
    return {
        ...quiz,
        getConstructionCount: () => constructions,
        dailyChallenges
    };
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

test('empty question selection never instantiates or attaches a game mode', async () => {
    class FakeMode {
        afterQuestionRendered() { throw new Error('must not attach an empty quiz'); }
    }
    const quiz = loadQuizModule(FakeMode, { mode: 'time', category: 'empty', difficulty: 'easy' }, []);
    const html = await quiz.renderQuiz();
    assert.match(html, /Нет вопросов/);
    assert.equal(quiz.getConstructionCount(), 0);
    quiz.attachQuizListeners();
    quiz.resetQuiz();
});

test('attaching listeners repeatedly starts first-question effects exactly once', async () => {
    let attachments = 0;
    class FakeMode {
        async init() {}
        renderQuestion() { return 'question'; }
        afterQuestionRendered() { attachments++; }
        dispose() {}
    }
    const quiz = loadQuizModule(FakeMode);
    await quiz.renderQuiz();
    quiz.attachQuizListeners();
    quiz.attachQuizListeners();
    assert.equal(attachments, 1);
    await quiz.renderQuiz();
    quiz.attachQuizListeners();
    assert.equal(attachments, 2);
    quiz.resetQuiz();
});

test('older asynchronous quiz route cannot replace a newer quiz screen', async () => {
    const source = readFileSync(new URL('../app/router.js', import.meta.url), 'utf8')
        .replace(/^import .*;\s*$/gm, '')
        .replace('export default async function router()', 'async function router()')
        .replaceAll("await import('./modules/quiz/quiz.js')", 'await Promise.resolve(quizModule)');
    let currentRoute = 'quiz';
    const root = { innerHTML: '' };
    const waiting = [];
    let attachments = 0;
    const quizModule = {
        renderQuiz: () => new Promise(resolve => { waiting.push(resolve); }),
        attachQuizListeners: () => { attachments++; }
    };
    const router = new Function(
        'getState', 'setState', 'document', 'window', 'sessionStorage', 'quizModule',
        source + '\nreturn router;'
    )(() => ({ currentRoute }), (_, value) => { currentRoute = value; },
        { getElementById: () => root }, {}, { setItem: () => {} }, quizModule);
    const oldNavigation = router();
    await Promise.resolve();
    const newNavigation = router();
    await Promise.resolve();
    assert.equal(waiting.length, 2);
    waiting[1]('new question');
    await newNavigation;
    waiting[0]('old question');
    await oldNavigation;
    assert.equal(root.innerHTML, 'new question');
    assert.equal(attachments, 1);
});

test('slow dashboard render cannot overwrite quiz after route change', async () => {
    const source = readFileSync(new URL('../app/router.js', import.meta.url), 'utf8')
        .replace(/^import .*;\s*$/gm, '')
        .replace('export default async function router()', 'async function router()')
        .replaceAll("await import('./modules/dashboard/dashboard.js')", 'await Promise.resolve(dashboardModule)')
        .replaceAll("await import('./modules/quiz/quiz.js')", 'await Promise.resolve(quizModule)');
    let currentRoute = 'home';
    const root = { innerHTML: '' };
    let completeDashboard;
    let dashboardAttachments = 0;
    const dashboardModule = {
        renderDashboard: () => new Promise(resolve => { completeDashboard = resolve; }),
        attachDashboardListeners: () => { dashboardAttachments++; }
    };
    const quizModule = {
        renderQuiz: async () => '<div>Quiz</div>',
        attachQuizListeners: () => {}
    };
    const router = new Function(
        'getState', 'setState', 'document', 'window', 'sessionStorage',
        'dashboardModule', 'quizModule',
        source + '\nreturn router;'
    )(() => ({ currentRoute }), (_, value) => { currentRoute = value; },
        { getElementById: () => root }, {}, { setItem: () => {} },
        dashboardModule, quizModule);
    const pendingHome = router();
    await Promise.resolve();
    currentRoute = 'quiz';
    await router();
    completeDashboard('<div>Old dashboard</div>');
    await pendingHome;
    assert.equal(root.innerHTML, '<div>Quiz</div>');
    assert.equal(dashboardAttachments, 0);
});


test('daily challenge mode uses the UTC date challenge catalog', async () => {
    class FakeMode {
        isDisposed = false;
        async init(questions, settings) {
            this.questions = questions;
            this.settings = settings;
        }
        renderQuestion(index) { return `daily question ${index}`; }
        dispose() { this.isDisposed = true; }
    }

    const questions = Array.from({ length: 10 }, (_, index) => ({ questionRU: `Q${index}` }));
    const settings = {
        mode: 'daily',
        category: 'all',
        difficulty: 'mixed',
        challengeDate: '2026-11-15'
    };
    const quiz = loadQuizModule(FakeMode, settings, questions);

    assert.equal(await quiz.renderQuiz(), 'daily question 0');
    assert.deepEqual(quiz.dailyChallenges, ['2026-11-15']);
    assert.equal(quiz.getConstructionCount(), 1);
    quiz.resetQuiz();
});
