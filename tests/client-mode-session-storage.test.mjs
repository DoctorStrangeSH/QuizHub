import test from 'node:test';
import assert from 'node:assert/strict';
import { createModeSessionStorage } from '../app/modules/quiz/mode-session-storage.js';

function memoryStorage() {
    const values = new Map();
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key)
    };
}

test('mode session storage persists independent mode session ids', () => {
    const storage = createModeSessionStorage(memoryStorage());
    storage.write('survival', 'survival-session');
    storage.write('duel', 'duel-session');
    assert.equal(storage.read('survival'), 'survival-session');
    assert.equal(storage.read('duel'), 'duel-session');
    assert.equal(storage.read('time'), null);
});

test('mode session storage clears a completed mode session', () => {
    const storage = createModeSessionStorage(memoryStorage());
    storage.write('time', 'time-session');
    storage.clear('time');
    assert.equal(storage.read('time'), null);
});

test('mode session storage rejects unsupported modes and invalid ids', () => {
    const storage = createModeSessionStorage(memoryStorage());
    assert.throws(() => storage.read('classic'), /UNSUPPORTED_QUIZ_MODE/);
    assert.throws(() => storage.write('survival', '  '), /INVALID_SESSION_ID/);
});
