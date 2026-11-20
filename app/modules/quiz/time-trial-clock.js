const QUESTION_TIME_MS = 15_000;

export function getTimeTrialClock(deadlineAt, now = Date.now()) {
    if (!Number.isSafeInteger(deadlineAt) || deadlineAt < 0 ||
        !Number.isSafeInteger(now) || now < 0) {
        throw new Error('INVALID_TIME_TRIAL_CLOCK');
    }
    const remainingMs = Math.max(0, deadlineAt - now);
    const seconds = Math.ceil(remainingMs / 1000);
    const minutesPart = Math.floor(seconds / 60);
    const secondsPart = seconds % 60;
    return Object.freeze({
        remainingMs,
        seconds,
        display: `${String(minutesPart).padStart(2, '0')}:${String(secondsPart).padStart(2, '0')}`,
        percent: Math.min(100, Math.max(0, remainingMs / QUESTION_TIME_MS * 100)),
        urgent: remainingMs > 0 && remainingMs <= 5_000,
        expired: remainingMs === 0
    });
}
