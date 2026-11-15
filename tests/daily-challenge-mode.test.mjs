import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createDailyChallenge, createSeededRandom } from '../app/modules/quiz/daily-challenge.js';

const source = (await readFile(resolve('app/modules/quiz/modes/daily-challenge.js'), 'utf8'))
    .replace(/^import .*;.*$/gm, '')
    .replace('export class DailyChallengeMode', 'class DailyChallengeMode');

class FakeClassicMode {
    constructor() {
        this.questions = [];
        this.settings = {};
        this.isFinished = false;
    }

    async init(questions, settings) {
        this.questions = this.shuffleArray([...questions]);
        this.settings = settings;
        this.isFinished = false;
    }

    shuffleArray(items) {
        const result = [...items];
        for (let index = result.length - 1; index > 0; index--) {
            const target = Math.floor(Math.random() * (index + 1));
            [result[index], result[target]] = [result[target], result[index]];
        }
        return result;
    }

    showResults() {
        this.didShowResults = true;
    }
}

let language = 'ru';
const DailyChallengeMode = new Function(
    'ClassicMode', 'getState', 'createSeededRandom', 'getUtcDateKey',
    source + String.fromCharCode(10) + 'return DailyChallengeMode;'
)(FakeClassicMode, () => ({ language }), createSeededRandom, () => '2026-11-15');

test('daily mode uses the same question and answer ordering for the same date', async () => {
    const questions = createDailyChallenge('2026-11-15').questions;
    const first = new DailyChallengeMode();
    const second = new DailyChallengeMode();

    await first.init(questions, { challengeDate: '2026-11-15' });
    await second.init(questions, { challengeDate: '2026-11-15' });

    assert.deepEqual(
        first.questions.map(question => question.difficulty),
        ['easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'hard']
    );
    assert.deepEqual(
        first.questions.map(question => question.dailyQuestionId),
        second.questions.map(question => question.dailyQuestionId)
    );
    assert.deepEqual(first.shuffleArray(['A', 'B', 'C', 'D']), second.shuffleArray(['A', 'B', 'C', 'D']));
});

test('daily mode never grants client-side one-time rewards before server verification', async () => {
    const mode = new DailyChallengeMode();
    await mode.init(createDailyChallenge('2026-11-15').questions, { challengeDate: '2026-11-15' });
    let rewardCalls = 0;
    mode.saveResults = async () => { rewardCalls++; };
    mode.showResults = () => { mode.didShowResults = true; };

    await mode.finishQuiz();

    assert.equal(rewardCalls, 0);
    assert.equal(mode.saveStatus, 'practice');
    assert.equal(mode.earnedCoins, 0);
    assert.equal(mode.earnedXP, 0);
    assert.equal(mode.didShowResults, true);
    await mode.finishQuiz();
    assert.equal(rewardCalls, 0);
});

test('daily mode explains the reward limitation in Russian and English', () => {
    const mode = new DailyChallengeMode();
    language = 'ru';
    assert.match(mode.getSaveStatusHTML(), /Предпросмотр ежедневного испытания/);
    language = 'en';
    assert.match(mode.getSaveStatusHTML(), /Daily challenge preview/);
});


test('daily results are shown even when the quiz engine has already marked the run finished', async () => {
    const mode = new DailyChallengeMode();
    await mode.init(createDailyChallenge('2026-11-15').questions, { challengeDate: '2026-11-15' });
    mode.isFinished = true;
    mode.showResults = () => { mode.didShowResults = true; };

    await mode.finishQuiz();

    assert.equal(mode.didShowResults, true);
    assert.equal(mode.resultsShown, true);
});
