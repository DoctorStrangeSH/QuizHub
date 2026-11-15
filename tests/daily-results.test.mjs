import test from 'node:test';
import assert from 'node:assert/strict';
import { getDailyResultSummary } from '../app/modules/quiz/daily-results.js';

test('daily practice summary uses stable result tiers and correct percentages', () => {
    assert.deepEqual(
        [getDailyResultSummary(8, 10).tier, getDailyResultSummary(5, 10).tier, getDailyResultSummary(4, 10).tier],
        ['excellent', 'steady', 'learning']
    );
    assert.equal(getDailyResultSummary(7, 8).percent, 88);
    assert.equal(getDailyResultSummary(100, 10).correct, 10);
    assert.equal(getDailyResultSummary(-2, 10).correct, 0);
    assert.equal(getDailyResultSummary(0, 0).percent, 0);
    assert.equal(getDailyResultSummary(0, 0).tier, 'learning');
});

test('daily result copy is bilingual and makes no competitive promises', () => {
    const ru = getDailyResultSummary(9, 10, 'ru');
    const en = getDailyResultSummary(9, 10, 'en');
    assert.match(ru.title, /Блестяще/);
    assert.match(en.title, /Brilliant/);
    assert.equal(ru.percent, en.percent);
    assert.equal(ru.correct, en.correct);
});
