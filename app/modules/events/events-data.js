export const ACTIVE_EVENTS = {
    daily: {
        id: 'daily_bonus',
        type: 'daily',
        nameRU: 'Ежедневный бонус',
        nameEN: 'Daily Bonus',
        descRU: 'Заходи каждый день и получай награды!',
        descEN: 'Log in every day and get rewards!',
        icon: '🎁',
        color: '#fbbf24',
        active: true,
        rewards: [
            { day: 1, coins: 10, icon: '🎁' },
            { day: 2, coins: 20, icon: '🪙' },
            { day: 3, coins: 30, icon: '💎' },
            { day: 4, coins: 50, icon: '🏆' },
            { day: 5, coins: 75, icon: '👑' },
            { day: 6, coins: 100, icon: '🌟' },
            { day: 7, coins: 200, icon: '🔥' }
        ]
    },
    
    active: [
        {
            id: 'xp_weekend',
            type: 'boost',
            nameRU: 'x2 Опыт на выходных!',
            nameEN: 'x2 XP Weekend!',
            descRU: 'Двойной опыт за все квизы в субботу и воскресенье',
            descEN: 'Double XP for all quizzes on Saturday and Sunday',
            icon: '⚡',
            color: '#a855f7',
            effect: 'xp_multiplier',
            multiplier: 2,
            startDate: '2024-01-01',
            endDate: '2099-12-31',
            daysOfWeek: [0, 6]
        },
        {
            id: 'happy_hour',
            type: 'boost',
            nameRU: 'Счастливый час!',
            nameEN: 'Happy Hour!',
            descRU: 'x1.5 монет с 18:00 до 21:00 каждый день',
            descEN: 'x1.5 coins from 18:00 to 21:00 every day',
            icon: '🪙',
            color: '#fbbf24',
            effect: 'coin_multiplier',
            multiplier: 1.5,
            startDate: '2024-01-01',
            endDate: '2099-12-31',
            hoursActive: [18, 19, 20]
        },
        {
            id: 'night_owl',
            type: 'boost',
            nameRU: 'Ночная сова 🦉',
            nameEN: 'Night Owl 🦉',
            descRU: 'x2 опыт за квизы с 00:00 до 06:00',
            descEN: 'x2 XP for quizzes from 00:00 to 06:00',
            icon: '🦉',
            color: '#6366f1',
            effect: 'xp_multiplier',
            multiplier: 2,
            startDate: '2024-01-01',
            endDate: '2099-12-31',
            hoursActive: [0, 1, 2, 3, 4, 5]
        },
        {
            id: 'monday_motivation',
            type: 'boost',
            nameRU: 'Мотивация понедельника 💪',
            nameEN: 'Monday Motivation 💪',
            descRU: 'x1.5 опыт по понедельникам',
            descEN: 'x1.5 XP on Mondays',
            icon: '💪',
            color: '#f87171',
            effect: 'xp_multiplier',
            multiplier: 1.5,
            startDate: '2024-01-01',
            endDate: '2099-12-31',
            daysOfWeek: [1]
        }
    ],
    
    tournaments: [
        {
            id: 'weekly_quiz_master',
            type: 'tournament',
            nameRU: 'Мастер квиза недели',
            nameEN: 'Weekly Quiz Master',
            descRU: 'Набери больше всех опыта за неделю и получи особую награду!',
            descEN: 'Earn the most XP this week and get a special reward!',
            icon: '🏆',
            color: '#ffd700',
            duration: 'weekly',
            rewards: {
                1: { coins: 1000, icon: '🥇', nameRU: '1 место', nameEN: '1st place' },
                2: { coins: 500, icon: '🥈', nameRU: '2 место', nameEN: '2nd place' },
                3: { coins: 250, icon: '🥉', nameRU: '3 место', nameEN: '3rd place' }
            },
            active: true
        },
        {
            id: 'weekend_warrior',
            type: 'tournament',
            nameRU: 'Воин выходных',
            nameEN: 'Weekend Warrior',
            descRU: 'Самый активный игрок выходных!',
            descEN: 'Most active weekend player!',
            icon: '⚔️',
            color: '#f87171',
            duration: 'weekend',
            rewards: {
                1: { coins: 500, icon: '🥇', nameRU: '1 место', nameEN: '1st place' },
                2: { coins: 250, icon: '🥈', nameRU: '2 место', nameEN: '2nd place' },
                3: { coins: 100, icon: '🥉', nameRU: '3 место', nameEN: '3rd place' }
            },
            active: true
        }
    ],
    
    holidays: [
        {
            id: 'new_year',
            type: 'holiday',
            nameRU: 'Новый год! 🎄',
            nameEN: 'New Year! 🎄',
            descRU: 'Все квизы дают x3 опыт и монеты!',
            descEN: 'All quizzes give x3 XP and coins!',
            icon: '🎄',
            color: '#4ade80',
            effect: 'all_multiplier',
            multiplier: 3,
            dateStart: '12-30',
            dateEnd: '01-05',
            active: false
        },
        {
            id: 'halloween',
            type: 'holiday',
            nameRU: 'Хэллоуин! 🎃',
            nameEN: 'Halloween! 🎃',
            descRU: 'Специальные вопросы и x2 награды!',
            descEN: 'Special questions and x2 rewards!',
            icon: '🎃',
            color: '#fb923c',
            effect: 'all_multiplier',
            multiplier: 2,
            dateStart: '10-28',
            dateEnd: '11-01',
            active: false
        },
        {
            id: 'valentine',
            type: 'holiday',
            nameRU: 'День Валентина! 💕',
            nameEN: 'Valentine\'s Day! 💕',
            descRU: 'x2 монеты за все квизы!',
            descEN: 'x2 coins for all quizzes!',
            icon: '💕',
            color: '#f472b6',
            effect: 'coin_multiplier',
            multiplier: 2,
            dateStart: '02-12',
            dateEnd: '02-15',
            active: false
        }
    ]
};

// All event dates and hours are evaluated in the player's local time.
function localISODate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isWithinAnnualRange(today, start, end) {
    // Ranges crossing New Year (e.g. 12-30 through 01-05) wrap around.
    return start <= end
        ? today >= start && today <= end
        : today >= start || today <= end;
}

function isBoostActive(event, now) {
    if (event.active === false) return false;
    const today = localISODate(now);
    if (event.startDate && today < event.startDate) return false;
    if (event.endDate && today > event.endDate) return false;
    if (event.daysOfWeek && !event.daysOfWeek.includes(now.getDay())) return false;
    if (event.hoursActive && !event.hoursActive.includes(now.getHours())) return false;
    return true;
}

function getTimeLeft(event, now) {
    const end = new Date(now);
    if (event.hoursActive?.length) {
        // A boost ends when its current uninterrupted set of hours ends.
        let hour = now.getHours();
        while (hour < 24 && event.hoursActive.includes(hour)) hour++;
        end.setHours(hour, 0, 0, 0);
    } else if (event.daysOfWeek?.length) {
        end.setHours(24, 0, 0, 0);
    } else {
        return '';
    }

    const remaining = Math.max(0, end.getTime() - now.getTime());
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return `Ещё ${hours}ч ${minutes}м`;
}

export function getActiveEvents(now = new Date()) {
    const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const active = [];

    for (const event of ACTIVE_EVENTS.active) {
        if (isBoostActive(event, now)) {
            active.push({ ...event, timeLeft: getTimeLeft(event, now) });
        }
    }

    for (const holiday of ACTIVE_EVENTS.holidays) {
        if (holiday.active === false) continue;
        if (isWithinAnnualRange(monthDay, holiday.dateStart, holiday.dateEnd)) {
            active.push({ ...holiday, timeLeft: 'До конца праздника' });
        }
    }

    return active;
}

// Do not stack overlapping XP boosts; apply only the strongest active one.
export function getMultipliers(now = new Date()) {
    let xpMultiplier = 1;
    let coinMultiplier = 1;

    for (const event of getActiveEvents(now)) {
        if (event.effect === 'xp_multiplier') xpMultiplier = Math.max(xpMultiplier, event.multiplier);
        if (event.effect === 'coin_multiplier') coinMultiplier = Math.max(coinMultiplier, event.multiplier);
        if (event.effect === 'all_multiplier') {
            xpMultiplier = Math.max(xpMultiplier, event.multiplier);
            coinMultiplier = Math.max(coinMultiplier, event.multiplier);
        }
    }

    return { xpMultiplier, coinMultiplier };
}
