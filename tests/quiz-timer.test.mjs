import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { remainingSeconds } from '../app/modules/quiz/timer.js';

test('countdown reflects elapsed wall-clock time, including skipped callbacks', () => {
    const deadline = 15000;
    assert.equal(remainingSeconds(deadline, 0), 15);
    assert.equal(remainingSeconds(deadline, 1001), 14);
    assert.equal(remainingSeconds(deadline, 10000), 5);
    assert.equal(remainingSeconds(deadline, 14999), 1);
    assert.equal(remainingSeconds(deadline, 15000), 0);
    assert.equal(remainingSeconds(deadline, 60000), 0);
});

test('countdown handles invalid timestamps and never becomes negative', () => {
    assert.throws(() => remainingSeconds(NaN, 100), /INVALID_TIMER_TIME/);
    assert.throws(() => remainingSeconds(1000, Infinity), /INVALID_TIMER_TIME/);
    assert.equal(remainingSeconds(1000, 1200), 0);
});

test('time trial checks deadline on clicks and updates the visual timer bar', () => {
    const source = readFileSync(new URL('../app/modules/quiz/modes/timetrial.js', import.meta.url), 'utf8');
    assert.match(source, /this\.deadlineAt = Date\.now\(\) \+ this\.timePerQuestion \* 1000/);
    assert.match(source, /remainingSeconds\(this\.deadlineAt\)/);
    assert.match(source, /handleAnswer\(el\)/);
    assert.match(source, /bar\.style\.width/);
});
