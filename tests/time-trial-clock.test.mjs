import test from 'node:test';
import assert from 'node:assert/strict';
import { getTimeTrialClock } from '../app/modules/quiz/time-trial-clock.js';

test('Time Trial clock formats remaining time and progress', () => {
    assert.deepEqual(getTimeTrialClock(16_000, 1_000), {
        remainingMs: 15_000, seconds: 15, display: '00:15',
        percent: 100, urgent: false, expired: false
    });
    const middle = getTimeTrialClock(9_500, 1_000);
    assert.equal(middle.display, '00:09');
    assert.equal(middle.percent, 56.666666666666664);
    assert.equal(middle.urgent, true);
});

test('Time Trial clock marks expired deadlines without negative values', () => {
    const clock = getTimeTrialClock(10_000, 10_001);
    assert.equal(clock.remainingMs, 0);
    assert.equal(clock.display, '00:00');
    assert.equal(clock.percent, 0);
    assert.equal(clock.expired, true);
});

test('Time Trial clock rejects invalid timestamps', () => {
    assert.throws(() => getTimeTrialClock(NaN, 1), /INVALID_TIME_TRIAL_CLOCK/);
    assert.throws(() => getTimeTrialClock(10, -1), /INVALID_TIME_TRIAL_CLOCK/);
});
