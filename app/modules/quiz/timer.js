// Elapsed-time based countdown. setInterval may be throttled in background tabs.
export function remainingSeconds(deadlineAt, now = Date.now()) {
    if (!Number.isFinite(deadlineAt) || !Number.isFinite(now)) {
        throw new Error('INVALID_TIMER_TIME');
    }
    return Math.max(0, Math.ceil((deadlineAt - now) / 1000));
}
