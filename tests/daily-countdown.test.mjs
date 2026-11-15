import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyResetCountdown } from '../app/modules/quiz/daily-countdown.js';

test('counts down accurately to UTC midnight', () => {
    assert.deepEqual(dailyResetCountdown(new Date('2026-11-15T23:59:59.000Z')), {
        date: '2026-11-15', label: 'Новые вопросы через', time: '00:00:01'
    });
    assert.equal(dailyResetCountdown(new Date('2026-11-15T12:00:00.000Z')).time, '12:00:00');
});

test('rolls over to the next challenge exactly at midnight', () => {
    const previous = dailyResetCountdown(new Date('2026-11-15T23:59:59.999Z'));
    const next = dailyResetCountdown(new Date('2026-11-16T00:00:00.000Z'), 'en');
    assert.equal(previous.date, '2026-11-15');
    assert.equal(previous.time, '00:00:01');
    assert.equal(next.date, '2026-11-16');
    assert.equal(next.time, '24:00:00');
    assert.equal(next.label, 'New questions in');
});

test('rejects invalid dates', () => {
    assert.throws(() => dailyResetCountdown(new Date(NaN)), /valid Date/);
});
