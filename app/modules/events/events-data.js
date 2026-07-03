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

// Проверка активных событий
export function getActiveEvents() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const active = [];
    
    for (const event of ACTIVE_EVENTS.active) {
        let isActive = false;
        if (event.daysOfWeek && event.daysOfWeek.includes(dayOfWeek)) isActive = true;
        if (event.hoursActive && event.hoursActive.includes(hour)) isActive = true;
        if (isActive) active.push({ ...event, timeLeft: getTimeLeft(event) });
    }
    
    for (const holiday of ACTIVE_EVENTS.holidays) {
        const startParts = holiday.dateStart.split('-');
        const endParts = holiday.dateEnd.split('-');
        const startMD = parseInt(startParts[0]) * 100 + parseInt(startParts[1]);
        const endMD = parseInt(endParts[0]) * 100 + parseInt(endParts[1]);
        const currentMD = parseInt(monthDay.split('-')[0]) * 100 + parseInt(monthDay.split('-')[1]);
        
        if (currentMD >= startMD && currentMD <= endMD) {
            active.push({ ...holiday, active: true, timeLeft: 'До конца праздника' });
        }
    }
    
    return active;
}

function getTimeLeft(event) {
    const now = new Date();
    
    if (event.hoursActive && event.hoursActive.length > 0) {
        const currentHour = now.getHours();
        const remainingHours = event.hoursActive.filter(h => h > currentHour);
        
        if (remainingHours.length > 0) {
            const nextHour = Math.min(...remainingHours);
            const endTime = new Date();
            endTime.setHours(nextHour, 0, 0, 0);
            const diff = endTime - now;
            
            if (diff > 0) {
                const hours = Math.floor(diff / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                return `Ещё ${hours}ч ${mins}м`;
            }
        } else {
            // Все часы прошли — показываем до конца последнего часа
            const lastHour = Math.max(...event.hoursActive);
            const endTime = new Date();
            endTime.setHours(lastHour + 1, 0, 0, 0);
            const diff = endTime - now;
            
            if (diff > 0 && diff < 3600000) {
                const mins = Math.floor(diff / 60000);
                return `Ещё ${mins}м`;
            }
        }
    }
    
    if (event.daysOfWeek && event.daysOfWeek.length > 0) {
        const currentDay = now.getDay();
        const remainingDays = event.daysOfWeek.filter(d => d >= currentDay);
        
        if (remainingDays.length > 0) {
            const nextDay = Math.min(...remainingDays);
            const daysUntil = nextDay - currentDay;
            
            if (daysUntil === 0) {
                // Сегодня — до конца дня
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);
                const diff = endOfDay - now;
                const hours = Math.floor(diff / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                return `Ещё ${hours}ч ${mins}м`;
            }
        }
    }
    
    return '';
}

// Получить множители для квиза
export function getMultipliers() {
    const active = getActiveEvents();
    let xpMultiplier = 1;
    let coinMultiplier = 1;
    
    for (const event of active) {
        if (event.effect === 'xp_multiplier') xpMultiplier = Math.max(xpMultiplier, event.multiplier);
        if (event.effect === 'coin_multiplier') coinMultiplier = Math.max(coinMultiplier, event.multiplier);
        if (event.effect === 'all_multiplier') {
            xpMultiplier = Math.max(xpMultiplier, event.multiplier);
            coinMultiplier = Math.max(coinMultiplier, event.multiplier);
        }
    }
    
    return { xpMultiplier, coinMultiplier };
}