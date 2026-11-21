const EVENT_START = '2024-01-01';
const EVENT_END = '2099-12-31';

export function normalizeQuizTimeZone(value = 'UTC') {
    if (typeof value !== 'string' || value.length < 1 || value.length > 64) {
        throw new Error('INVALID_TIME_ZONE');
    }
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
        return value;
    } catch {
        throw new Error('INVALID_TIME_ZONE');
    }
}

function localParts(at, timeZone) {
    if (!Number.isSafeInteger(at) || at < 0) throw new Error('INVALID_SERVER_TIME');
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
        hour: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(new Date(at));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return {
        date: `${values.year}-${values.month}-${values.day}`,
        weekday: values.weekday,
        hour: Number(values.hour)
    };
}

/**
 * Resolves V1 reward events from trusted server time and the player's
 * validated IANA timezone stored on their profile. Client clocks and
 * client-supplied multipliers are never consulted.
 */
export function getServerQuizRewardMultipliers({ at, timeZone = 'UTC' } = {}) {
    const zone = normalizeQuizTimeZone(timeZone);
    const local = localParts(at, zone);
    if (local.date < EVENT_START || local.date > EVENT_END) {
        return { xpMultiplier: 1, coinMultiplier: 1, timeZone: zone, activeEventIds: [] };
    }

    const activeEventIds = [];
    let xpMultiplier = 1;
    let coinMultiplier = 1;

    if (local.weekday === 'Sat' || local.weekday === 'Sun') {
        xpMultiplier = Math.max(xpMultiplier, 2);
        activeEventIds.push('xp_weekend');
    }
    if ([18, 19, 20].includes(local.hour)) {
        coinMultiplier = Math.max(coinMultiplier, 1.5);
        activeEventIds.push('happy_hour');
    }
    if ([0, 1, 2, 3, 4, 5].includes(local.hour)) {
        xpMultiplier = Math.max(xpMultiplier, 2);
        activeEventIds.push('night_owl');
    }
    if (local.weekday === 'Mon') {
        xpMultiplier = Math.max(xpMultiplier, 1.5);
        activeEventIds.push('monday_motivation');
    }

    return { xpMultiplier, coinMultiplier, timeZone: zone, activeEventIds };
}
