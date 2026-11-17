import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVE_EVENTS, getActiveEvents, getMultipliers } from '../app/modules/events/events-data.js';

const at = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour);

test('weekend XP and happy-hour coins activate together, without stacking XP', () => {
    const events = getActiveEvents(at(2026, 11, 14, 19)).map(event => event.id);
    assert.ok(events.includes('xp_weekend'));
    assert.ok(events.includes('happy_hour'));
    assert.deepEqual(getMultipliers(at(2026, 11, 14, 19)), {
        xpMultiplier: 2, coinMultiplier: 1.5
    });
});

test('Monday XP bonus does not activate during unrelated weekdays or hours', () => {
    assert.deepEqual(getMultipliers(at(2026, 11, 16, 13)), {
        xpMultiplier: 1.5, coinMultiplier: 1
    });
    assert.deepEqual(getMultipliers(at(2026, 11, 17, 13)), {
        xpMultiplier: 1, coinMultiplier: 1
    });
});

test('disabled holidays never grant a multiplier', () => {
    assert.equal(ACTIVE_EVENTS.holidays.find(event => event.id === 'new_year').active, false);
    assert.equal(getActiveEvents(at(2026, 12, 31, 13)).some(event => event.id === 'new_year'), false);
});

test('enabled New Year event crosses the December-January boundary', () => {
    const holiday = ACTIVE_EVENTS.holidays.find(event => event.id === 'new_year');
    const previous = holiday.active;
    holiday.active = true;
    try {
        for (const date of [at(2026, 12, 30), at(2026, 12, 31), at(2027, 1, 1), at(2027, 1, 5)]) {
            assert.ok(getActiveEvents(date).some(event => event.id === 'new_year'));
            assert.deepEqual(getMultipliers(date), { xpMultiplier: 3, coinMultiplier: 3 });
        }
        for (const date of [at(2026, 12, 29), at(2027, 1, 6)]) {
            assert.ok(!getActiveEvents(date).some(event => event.id === 'new_year'));
        }
    } finally {
        holiday.active = previous;
    }
});

test('boost windows respect their explicit start/end dates and active toggle', () => {
    const event = ACTIVE_EVENTS.active.find(event => event.id === 'happy_hour');
    const old = { active: event.active, startDate: event.startDate, endDate: event.endDate };
    try {
        event.startDate = '2026-11-15';
        event.endDate = '2026-11-17';
        assert.equal(getActiveEvents(at(2026, 11, 14, 19)).some(e => e.id === event.id), false);
        assert.equal(getActiveEvents(at(2026, 11, 16, 19)).some(e => e.id === event.id), true);
        assert.equal(getActiveEvents(at(2026, 11, 18, 19)).some(e => e.id === event.id), false);
        event.active = false;
        assert.equal(getActiveEvents(at(2026, 11, 16, 19)).some(e => e.id === event.id), false);
    } finally {
        Object.assign(event, old);
        if (old.active === undefined) delete event.active;
    }
});

test('hourly countdown reaches the end of the current event window', () => {
    const happyHour = getActiveEvents(at(2026, 11, 16, 18)).find(e => e.id === 'happy_hour');
    assert.equal(happyHour.timeLeft, 'Ещё 3ч 0м');
    const nightOwl = getActiveEvents(at(2026, 11, 16, 1)).find(e => e.id === 'night_owl');
    assert.equal(nightOwl.timeLeft, 'Ещё 5ч 0м');
});
