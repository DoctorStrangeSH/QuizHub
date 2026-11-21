const DAY_MS = 86_400_000;

export function toValidDate(value) {
    try {
        if (value instanceof Date) {
            return Number.isFinite(value.getTime()) ? new Date(value.getTime()) : null;
        }
        if (value && typeof value.toDate === 'function') {
            const date = value.toDate();
            return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
        }
        if (value && typeof value.toMillis === 'function') {
            const millis = value.toMillis();
            return Number.isSafeInteger(millis) && millis >= 0 ? new Date(millis) : null;
        }
        if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
            const date = new Date(value);
            return Number.isFinite(date.getTime()) ? date : null;
        }
    } catch {
        return null;
    }
    return null;
}

export function utcDateKey(value) {
    const date = toValidDate(value);
    return date ? date.toISOString().slice(0, 10) : null;
}

// Daily-login server claims are keyed by UTC date. The UI must use the same
// boundary rather than the browser's local midnight, which differs by timezone.
export function canClaimOnUtcDate(lastClaim, now = new Date()) {
    const today = utcDateKey(now);
    if (!today) return false;
    return utcDateKey(lastClaim) !== today;
}

export function millisecondsUntilNextUtcDay(now = new Date()) {
    const date = toValidDate(now);
    if (!date) return 0;
    const next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
    return Math.max(0, next - date.getTime());
}

export const UTC_DAY_MS = DAY_MS;
