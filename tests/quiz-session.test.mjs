import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// BaseMode depends on browser Firebase URLs. Evaluate its actual class with
// minimal stubs so these state-machine tests remain offline and dependency-free.
const source = await readFile(resolve('app/modules/quiz/modes/base.js'), 'utf8');
const stripped = source
    .replace(/^import .*;\s*$/gm, '')
    .replace('export class BaseMode', 'class BaseMode');
const BaseMode = new Function(
    'getState', 'auth', 'db', 'doc', 'getDoc', 'updateDoc', 'increment', 'calculateQuizRewards',
    `${stripped}\nreturn BaseMode;`
)(
    () => ({ language: 'ru' }), { currentUser: null }, {}, () => {},
    async () => {}, async () => {}, value => value, () => ({ xp: 0, coins: 0 })
);

const makeQuestions = count => Array.from({ length: count }, (_, i) => ({
    questionRU: `Вопрос ${i}`,
    questionEN: `Question ${i}`,
    optionsRU: ['Да', 'Нет'],
    optionsEN: ['Yes', 'No'],
    correctIndex: 0,
    points: 10,
    category: 'science'
}));

test('new game resets score and answer state', async () => {
    const mode = new BaseMode();
    mode.score = 90;
    mode.hasAnswered = true;
    await mode.init(makeQuestions(2), {});
    assert.equal(mode.score, 0);
    assert.equal(mode.currentIndex, 0);
    assert.equal(mode.hasAnswered, false);
});

test('cannot advance without resolving an answer', async () => {
    const mode = new BaseMode();
    await mode.init(makeQuestions(1), {});
    await mode.nextQuestion();
    assert.equal(mode.currentIndex, 0);
    assert.equal(mode.isFinished, false);
});

test('finishing one-question quiz is idempotent', async () => {
    const mode = new BaseMode();
    await mode.init(makeQuestions(1), {});
    let finishes = 0;
    mode.finishQuiz = async () => { finishes++; };
    mode.hasAnswered = true;
    await mode.nextQuestion();
    await mode.nextQuestion();
    assert.equal(mode.currentIndex, 1);
    assert.equal(finishes, 1);
    assert.equal(mode.isFinished, true);
});

test('leaving a quiz cancels a queued question transition', async () => {
    const mode = new BaseMode();
    await mode.init(makeQuestions(2), {});
    let replacements = 0;
    const container = {
        isConnected: true,
        style: {},
        set outerHTML(value) { replacements++; }
    };
    const previousDocument = globalThis.document;
    globalThis.document = { querySelector: () => container };
    try {
        mode.hasAnswered = true;
        await mode.nextQuestion();
        assert.equal(mode.isTransitioning, true);
        mode.dispose();
        await new Promise(resolve => setTimeout(resolve, 350));
        assert.equal(replacements, 0);
        assert.equal(mode.isDisposed, true);
    } finally {
        globalThis.document = previousDocument;
        mode.dispose();
    }
});

test('failed reward write is reported without claiming saved coins', async () => {
    const FailingMode = new Function(
        'getState', 'auth', 'db', 'doc', 'getDoc', 'updateDoc', 'increment', 'calculateQuizRewards',
        `${stripped}\nreturn BaseMode;`
    )(
        () => ({ language: 'ru' }), { currentUser: { uid: 'test-player' } }, {},
        () => ({}), async () => ({ data: () => ({}) }),
        async () => { throw new Error('offline'); },
        value => value, () => ({ xp: 30, coins: 10 })
    );
    const mode = new FailingMode();
    await mode.init(makeQuestions(1), {});
    const oldError = console.error;
    console.error = () => {};
    try {
        assert.equal(await mode.saveResults(), false);
        assert.equal(mode.saveStatus, 'failed');
        assert.equal(mode.earnedXP, 0);
        assert.equal(mode.earnedCoins, 0);
        assert.match(mode.getSaveStatusHTML(), /Не удалось подтвердить награду/);
    } finally {
        console.error = oldError;
    }
});

test('successful reward write stays saved if profile follow-up fails', async () => {
    let rewardWrites = 0;
    const SuccessMode = new Function(
        'getState', 'auth', 'db', 'doc', 'getDoc', 'updateDoc', 'increment', 'calculateQuizRewards',
        `${stripped}\nreturn BaseMode;`
    )(
        () => ({ language: 'en' }), { currentUser: { uid: 'test-player' } }, {},
        () => ({}), async () => { throw new Error('profile read offline'); },
        async () => { rewardWrites++; }, value => value,
        () => ({ xp: 30, coins: 10 })
    );
    const mode = new SuccessMode();
    await mode.init(makeQuestions(1), {});
    const oldWarn = console.warn;
    console.warn = () => {};
    try {
        assert.equal(await mode.saveResults(), true);
        assert.equal(await mode.saveResults(), true);
        assert.equal(rewardWrites, 1);
        assert.equal(mode.saveStatus, 'saved');
        assert.equal(mode.earnedXP, 30);
        assert.equal(mode.earnedCoins, 10);
        assert.match(mode.getSaveStatusHTML(), /Rewards saved/);
    } finally {
        console.warn = oldWarn;
    }
});

test('reinitializing a mode cancels stale transitions from its previous game', async () => {
    const mode = new BaseMode();
    await mode.init(makeQuestions(2), {});
    let replacements = 0;
    const container = {
        isConnected: true,
        style: {},
        set outerHTML(value) { replacements++; }
    };
    const previousDocument = globalThis.document;
    globalThis.document = { querySelector: () => container };
    try {
        mode.hasAnswered = true;
        await mode.nextQuestion();
        assert.equal(mode.isTransitioning, true);
        await mode.init(makeQuestions(3), {});
        await new Promise(resolve => setTimeout(resolve, 350));
        assert.equal(replacements, 0);
        assert.equal(mode.currentIndex, 0);
        assert.equal(mode.isTransitioning, false);
        assert.equal(mode.questions.length, 3);
    } finally {
        globalThis.document = previousDocument;
        mode.dispose();
    }
});

test('reinitializing a mode clears any active mode-specific timer', async () => {
    const mode = new BaseMode();
    let calls = 0;
    mode.clearTimer = () => { calls++; };
    await mode.init(makeQuestions(1), {});
    assert.equal(calls, 1);
});
