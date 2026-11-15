import { getUtcDateKey } from './daily-challenge.js';

export function dailyResetCountdown(now = new Date(), language = 'ru') {
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
        throw new TypeError('A valid Date is required.');
    }
    const nextMidnight = Date.parse(getUtcDateKey(now) + 'T00:00:00.000Z') + 86400000;
    const seconds = Math.max(0, Math.ceil((nextMidnight - now.getTime()) / 1000));
    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return {
        date: getUtcDateKey(now),
        label: language === 'en' ? 'New questions in' : 'Новые вопросы через',
        time: hh + ':' + mm + ':' + ss
    };
}
