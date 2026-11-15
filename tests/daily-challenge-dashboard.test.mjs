import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dashboard = await readFile(resolve('app/modules/dashboard/dashboard.js'), 'utf8');
const dashboardStyles = await readFile(resolve('app/modules/dashboard/dashboard.css'), 'utf8');
const quizStyles = await readFile(resolve('app/modules/quiz/quiz.css'), 'utf8');

test('dashboard exposes a bilingual daily challenge card with its displayed UTC date', () => {
    assert.match(dashboard, /daily-challenge-card/);
    assert.match(dashboard, /DAILY CHALLENGE/);
    assert.match(dashboard, /ЕЖЕДНЕВНОЕ ИСПЫТАНИЕ/);
    assert.match(dashboard, /window\.startDailyChallenge\('\$\{dailyDate\}'\)/);
});

test('daily challenge launcher keeps the displayed date and selects the daily quiz mode', () => {
    assert.match(dashboard, /window\.startDailyChallenge = \(dateKey\) =>/);
    assert.match(dashboard, /const challengeDate = dateKey \|\| getUtcDateKey\(\)/);
    assert.match(dashboard, /mode: 'daily'/);
    assert.match(dashboard, /challengeDate/);
    assert.match(dashboard, /window\.startGame\(\)/);
});

test('dashboard updates reset countdown and date without leaking timers', () => {
    assert.match(dashboard, /daily-challenge-reset/);
    assert.match(dashboard, /dailyResetCountdown/);
    assert.match(dashboard, /clearInterval\\(window\\.__dailyChallengeTimer\\)/);
    assert.match(dashboard, /setInterval\\(refreshDailyCountdown, 1000\\)/);
});

test('daily challenge dashboard card and quiz badge have responsive visual styles', () => {
    assert.match(dashboardStyles, /\.daily-challenge-card/);
    assert.match(dashboardStyles, /@media \(max-width: 520px\)/);
    assert.match(quizStyles, /\.daily-challenge-badge/);
});
