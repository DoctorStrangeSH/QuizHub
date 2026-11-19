// Keep network responses and clicks scoped to the current friends view.
export function createFriendsAsyncGuard() {
    let loadVersion = 0;
    const pending = new Set();
    return {
        nextLoad() { return ++loadVersion; },
        isCurrent(version) { return version === loadVersion; },
        async runOnce(key, operation) {
            if (pending.has(key)) return false;
            pending.add(key);
            try { await operation(); return true; }
            finally { pending.delete(key); }
        }
    };
}
