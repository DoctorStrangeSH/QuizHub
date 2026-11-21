import test from 'node:test';
import assert from 'node:assert/strict';
import {
    canClaimOnUtcDate,
    toValidDate,
    utcDateKey
} from '../app/modules/daily/daily-login-date.js';

test('daily login availability uses the server UTC date, not browser-local midnight', () => {
    const lastClaim = new Date('2026-11-20T23:30:00.000Z');
    const beforeUtcRollover = new Date('2026-11-20T23:59:59.999Z');
    const afterUtcRollover = new Date('2026-11-21T00:00:00.000Z');

    assert.equal(canClaimOnUtcDate(lastClaim, beforeUtcRollover), false);
    assert.equal(canClaimOnUtcDate(lastClaim, afterUtcRollover), true);
    assert.equal(utcDateKey(lastClaim), '2026-11-20');
    assert.equal(utcDateKey(afterUtcRollover), '2026-11-21');
});

test('accepts Firestore Timestamp-like values and numeric legacy timestamps', () => {
    const millis = Date.parse('2026-11-20T12:00:00.000Z');
    const timestamp = { toMillis: () => millis };
    const timestampWithDate = { toDate: () => new Date(millis) };

    assert.equal(utcDateKey(timestamp), '2026-11-20');
    assert.equal(utcDateKey(timestampWithDate), '2026-11-20');
    assert.equal(utcDateKey(millis), '2026-11-20');
    assert.equal(toValidDate(timestamp).getTime(), millis);
});

test('invalid timestamps fail closed instead of accidentally enabling a claim', () => {
    assert.equal(toValidDate(null), null);
    assert.equal(toValidDate(new Date(NaN)), null);
    assert.equal(toValidDate({ toMillis: () => NaN }), null);
    assert.equal(toValidDate({ toMillis: () => Number.MAX_SAFE_INTEGER }), null);
    assert.equal(canClaimOnUtcDate(null, new Date(NaN)), false);
});
