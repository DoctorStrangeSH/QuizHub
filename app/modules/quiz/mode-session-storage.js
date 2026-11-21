const STORAGE_PREFIX = 'quizhub:server-mode-session:';

function keyFor(mode) {
    if (!['classic', 'survival', 'duel', 'time'].includes(mode)) throw new Error('UNSUPPORTED_QUIZ_MODE');
    return STORAGE_PREFIX + mode;
}

export function createModeSessionStorage(storage) {
    if (!storage || typeof storage.getItem !== 'function' ||
        typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
        throw new Error('INVALID_SESSION_STORAGE');
    }
    return Object.freeze({
        read(mode) {
            const value = storage.getItem(keyFor(mode));
            return typeof value === 'string' && value.trim() ? value : null;
        },
        write(mode, sessionId) {
            if (typeof sessionId !== 'string' || !sessionId.trim()) {
                throw new Error('INVALID_SESSION_ID');
            }
            storage.setItem(keyFor(mode), sessionId);
        },
        clear(mode) {
            storage.removeItem(keyFor(mode));
        }
    });
}
