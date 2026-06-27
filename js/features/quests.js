// ============================================
// QuizHub — Система заданий v3.4
// ============================================

const DAILY_QUESTS_POOL = [
    { id: 'dq_1', name: 'Разминка', desc: 'Пройти 1 квиз', target: 1, type: 'quizzes_today', reward: 20, icon: '🎯', rarity: 'common' },
    { id: 'dq_2', name: 'Квиз-машина', desc: 'Пройти 3 квиза', target: 3, type: 'quizzes_today', reward: 40, icon: '🔄', rarity: 'common' },
    { id: 'dq_3', name: 'Пятьдесят+', desc: 'Набрать 50+ очков за квиз', target: 1, type: 'score_50', reward: 30, icon: '🎯', rarity: 'common' },
    { id: 'dq_4', name: 'Сотка', desc: 'Набрать 100+ очков за квиз', target: 1, type: 'score_100', reward: 50, icon: '💯', rarity: 'uncommon' },
    { id: 'dq_5', name: 'Идеально', desc: '10/10 правильных ответов', target: 1, type: 'perfect', reward: 60, icon: '⭐', rarity: 'rare' },
    { id: 'dq_6', name: 'Хардкор', desc: 'Пройти квиз на сложном уровне', target: 1, type: 'hard_quiz', reward: 45, icon: '💀', rarity: 'uncommon' },
    { id: 'dq_7', name: 'В ударе', desc: 'Серия из 5 правильных', target: 1, type: 'streak_5', reward: 35, icon: '🔥', rarity: 'common' },
    { id: 'dq_8', name: 'English, please', desc: 'Пройти квиз на английском', target: 1, type: 'english', reward: 40, icon: '🇬🇧', rarity: 'uncommon' },
    { id: 'dq_9', name: 'Быстрые пальцы', desc: 'Ответить за <3 секунд (3 раза)', target: 3, type: 'fast_answers', reward: 35, icon: '⚡', rarity: 'uncommon' },
    { id: 'dq_10', name: 'Киноман', desc: 'Пройти квиз категории Кино', target: 1, type: 'category_cinema', reward: 25, icon: '🎬', rarity: 'common' },
    { id: 'dq_11', name: 'Спортсмен', desc: 'Пройти квиз категории Спорт', target: 1, type: 'category_sport', reward: 25, icon: '⚽', rarity: 'common' },
    { id: 'dq_12', name: 'Учёный', desc: 'Пройти квиз категории Наука', target: 1, type: 'category_science', reward: 25, icon: '🔬', rarity: 'common' },
    { id: 'dq_13', name: 'Дуэлянт', desc: 'Сыграть дуэль', target: 1, type: 'duel_played', reward: 50, icon: '⚔️', rarity: 'rare' },
    { id: 'dq_14', name: 'Выживший', desc: 'Набрать 100+ в режиме выживания', target: 1, type: 'survival_100', reward: 55, icon: '💀', rarity: 'rare' },
    { id: 'dq_15', name: 'Спидран', desc: 'Пройти квиз быстрее 60 секунд', target: 1, type: 'fast_quiz', reward: 45, icon: '⏱️', rarity: 'uncommon' },
];

const WEEKLY_QUESTS_POOL = [
    { id: 'wq_1', name: 'Марафонец', desc: 'Пройти 15 квизов за неделю', target: 15, type: 'quizzes_week', reward: 150, icon: '🏃', rarity: 'common' },
    { id: 'wq_2', name: 'Коллекционер', desc: 'Пройти квизы во всех категориях', target: 8, type: 'categories_week', reward: 200, icon: '📚', rarity: 'rare' },
    { id: 'wq_3', name: 'Непревзойдённый', desc: '5 идеальных квизов за неделю', target: 5, type: 'perfect_week', reward: 300, icon: '👑', rarity: 'legendary' },
    { id: 'wq_4', name: 'Турнирный боец', desc: 'Поучаствовать в 3 турнирах', target: 3, type: 'tournaments_week', reward: 180, icon: '🏆', rarity: 'uncommon' },
    { id: 'wq_5', name: 'Дуэльный мастер', desc: 'Выиграть 5 дуэлей', target: 5, type: 'duel_wins_week', reward: 250, icon: '⚔️', rarity: 'rare' },
    { id: 'wq_6', name: 'Социальный', desc: 'Отправить 10 подарков друзьям', target: 10, type: 'gifts_week', reward: 120, icon: '🎁', rarity: 'common' },
    { id: 'wq_7', name: 'Разнообразие', desc: 'Пройти на всех сложностях', target: 3, type: 'difficulties_week', reward: 150, icon: '🌈', rarity: 'uncommon' },
    { id: 'wq_8', name: 'Охотник за XP', desc: 'Заработать 500 XP за неделю', target: 500, type: 'xp_week', reward: 200, icon: '⚡', rarity: 'uncommon' },
    { id: 'wq_9', name: 'Выживальщик', desc: 'Сыграть 10 игр в режиме выживания', target: 10, type: 'survival_week', reward: 250, icon: '💀', rarity: 'rare' },
    { id: 'wq_10', name: 'Командный игрок', desc: 'Заработать 300 очков для команды', target: 300, type: 'team_score_week', reward: 200, icon: '👥', rarity: 'uncommon' },
];

const MONTHLY_QUESTS_POOL = [
    { id: 'mq_1', name: 'Легендарный марафон', desc: 'Пройти 50 квизов за месяц', target: 50, type: 'quizzes_month', reward: 500, icon: '🏃', rarity: 'common' },
    { id: 'mq_2', name: 'Идеальный месяц', desc: '15 идеальных квизов', target: 15, type: 'perfect_month', reward: 800, icon: '💎', rarity: 'legendary' },
    { id: 'mq_3', name: 'Турнирный чемпион', desc: 'Занять 1 место в 5 турнирах', target: 5, type: 'tournament_wins_month', reward: 1000, icon: '🏆', rarity: 'legendary' },
    { id: 'mq_4', name: 'Король дуэлей', desc: 'Выиграть 20 дуэлей', target: 20, type: 'duel_wins_month', reward: 800, icon: '👑', rarity: 'rare' },
    { id: 'mq_5', name: 'Социальный гигант', desc: 'Пригласить 3 друзей', target: 3, type: 'referrals_month', reward: 500, icon: '📢', rarity: 'uncommon' },
    { id: 'mq_6', name: 'XP-фермер', desc: 'Заработать 2000 XP', target: 2000, type: 'xp_month', reward: 600, icon: '⚡', rarity: 'uncommon' },
    { id: 'mq_7', name: 'Богач', desc: 'Накопить 1000 монет', target: 1000, type: 'coins_month', reward: 300, icon: '🪙', rarity: 'rare' },
    { id: 'mq_8', name: 'Командный дух', desc: 'Заработать 1000 очков для команды', target: 1000, type: 'team_score_month', reward: 700, icon: '👥', rarity: 'rare' },
    { id: 'mq_9', name: 'Выживший герой', desc: 'Набрать 5000 очков в режиме выживания', target: 5000, type: 'survival_score_month', reward: 800, icon: '💀', rarity: 'legendary' },
    { id: 'mq_10', name: 'Полиглот', desc: 'Пройти по 25 квизов на каждом языке', target: 50, type: 'bilingual_month', reward: 600, icon: '🌍', rarity: 'rare' },
];

let dailyQuests = [];
let weeklyQuests = [];
let monthlyQuests = [];
let dailyQuestDate = '';
let weeklyQuestWeek = '';
let monthlyQuestMonth = '';
let dailyProgress = {};
let weeklyProgress = {};
let monthlyProgress = {};

function getRandomQuests(pool, count) {
    const common = pool.filter(q => q.rarity === 'common');
    const uncommon = pool.filter(q => q.rarity === 'uncommon');
    const rare = pool.filter(q => q.rarity === 'rare');
    const legendary = pool.filter(q => q.rarity === 'legendary');

    let selected = [];
    if (common.length > 0) selected.push(common[Math.floor(Math.random() * common.length)]);

    const shuffledUncommon = shuffleArray([...uncommon]);
    selected = [...selected, ...shuffledUncommon.slice(0, Math.min(2, count - selected.length))];

    if (legendary.length > 0 && Math.random() < 0.2 && selected.length < count) {
        selected.push(legendary[Math.floor(Math.random() * legendary.length)]);
    }

    const shuffledRare = shuffleArray([...rare]);
    while (selected.length < count && shuffledRare.length > 0) {
        const pick = shuffledRare.shift();
        if (!selected.find(s => s.id === pick.id)) selected.push(pick);
    }

    const remaining = shuffleArray([...pool].filter(q => !selected.find(s => s.id === q.id)));
    while (selected.length < count && remaining.length > 0) selected.push(remaining.shift());

    return shuffleArray(selected).slice(0, count);
}

function generateQuests(type) {
    const now = new Date();
    const mskOffset = 3 * 60 * 60 * 1000;
    const mskTime = new Date(now.getTime() + mskOffset);

    if (type === 'daily') {
        const today = mskTime.toISOString().split('T')[0];
        if (dailyQuestDate === today && dailyQuests.length > 0) return dailyQuests;
        dailyQuests = getRandomQuests(DAILY_QUESTS_POOL, 3);
        dailyQuestDate = today;
        dailyProgress = {};
        dailyQuests.forEach(q => { dailyProgress[q.id] = 0; });
        saveQuestState('daily');
        console.log('📋 Новые ежедневные задания:', dailyQuests.map(q => q.name).join(', '));
        return dailyQuests;
    }

    if (type === 'weekly') {
        const weekNumber = getWeekNumber(mskTime);
        if (weeklyQuestWeek === weekNumber && weeklyQuests.length > 0) return weeklyQuests;
        weeklyQuests = getRandomQuests(WEEKLY_QUESTS_POOL, 3);
        weeklyQuestWeek = weekNumber;
        weeklyProgress = {};
        weeklyQuests.forEach(q => { weeklyProgress[q.id] = 0; });
        saveQuestState('weekly');
        console.log('📅 Новые недельные задания:', weeklyQuests.map(q => q.name).join(', '));
        return weeklyQuests;
    }

    if (type === 'monthly') {
        const monthKey = `${mskTime.getFullYear()}-${mskTime.getMonth() + 1}`;
        if (monthlyQuestMonth === monthKey && monthlyQuests.length > 0) return monthlyQuests;
        monthlyQuests = getRandomQuests(MONTHLY_QUESTS_POOL, 3);
        monthlyQuestMonth = monthKey;
        monthlyProgress = {};
        monthlyQuests.forEach(q => { monthlyProgress[q.id] = 0; });
        saveQuestState('monthly');
        console.log('🗓️ Новые месячные задания:', monthlyQuests.map(q => q.name).join(', '));
        return monthlyQuests;
    }

    return [];
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function saveQuestState(type) {
    const data = {
        dailyQuestDate, weeklyQuestWeek, monthlyQuestMonth,
        dailyProgress, weeklyProgress, monthlyProgress,
        dailyQuests, weeklyQuests, monthlyQuests
    };
    localStorage.setItem('quizhub-quest-state', JSON.stringify(data));
}

function loadQuestState() {
    try {
        const saved = JSON.parse(localStorage.getItem('quizhub-quest-state') || '{}');
        dailyQuestDate = saved.dailyQuestDate || '';
        weeklyQuestWeek = saved.weeklyQuestWeek || '';
        monthlyQuestMonth = saved.monthlyQuestMonth || '';
        dailyProgress = saved.dailyProgress || {};
        weeklyProgress = saved.weeklyProgress || {};
        monthlyProgress = saved.monthlyProgress || {};

        const now = new Date();
        const mskOffset = 3 * 60 * 60 * 1000;
        const mskTime = new Date(now.getTime() + mskOffset);

        const today = mskTime.toISOString().split('T')[0];
        if (dailyQuestDate !== today) {
            generateQuests('daily');
        } else if (saved.dailyQuests) {
            dailyQuests = saved.dailyQuests;
        }

        const weekNumber = getWeekNumber(mskTime);
        if (weeklyQuestWeek !== weekNumber) {
            generateQuests('weekly');
        } else if (saved.weeklyQuests) {
            weeklyQuests = saved.weeklyQuests;
        }

        const monthKey = `${mskTime.getFullYear()}-${mskTime.getMonth() + 1}`;
        if (monthlyQuestMonth !== monthKey) {
            generateQuests('monthly');
        } else if (saved.monthlyQuests) {
            monthlyQuests = saved.monthlyQuests;
        }
    } catch (e) {
        console.error('Ошибка загрузки заданий:', e);
    }
}

function updateQuestProgressByType(eventType, value = 1) {
    // Сначала генерируем задания если нужно
    generateQuests('daily');
    generateQuests('weekly');
    generateQuests('monthly');

    console.log(`📊 Обновление заданий: тип=${eventType}, значение=${value}`);

    [dailyQuests, weeklyQuests, monthlyQuests].forEach((quests, i) => {
        const type = ['daily', 'weekly', 'monthly'][i];
        const progress = type === 'daily' ? dailyProgress : type === 'weekly' ? weeklyProgress : monthlyProgress;

        quests.forEach(quest => {
            if (quest.type === eventType && !progress[quest.id + '_done']) {
                // Для XP и монет — устанавливаем абсолютное значение
                if (eventType === 'xp_week' || eventType === 'xp_month' || eventType === 'coins_month') {
                    progress[quest.id] = value;
                } else {
                    // Для остальных — прибавляем
                    progress[quest.id] = (progress[quest.id] || 0) + value;
                }

                console.log(`  📝 ${quest.name}: ${progress[quest.id]}/${quest.target}`);

                if (progress[quest.id] >= quest.target) {
                    completeQuest(quest, type);
                }
            }
        });
    });

    saveQuestState('daily');
    saveQuestState('weekly');
    saveQuestState('monthly');
}

function completeQuest(quest, type) {
    const progress = type === 'daily' ? dailyProgress : type === 'weekly' ? weeklyProgress : monthlyProgress;
    if (progress[quest.id + '_done']) return;

    progress[quest.id + '_done'] = true;
    console.log(`✅ Задание выполнено: ${quest.name}`);

    if (typeof addCoins === 'function') addCoins(quest.reward);
    if (typeof addXP === 'function') addXP(quest.reward * 2);

    showQuestComplete(quest);
    saveQuestState(type);
}

function showQuestComplete(quest) {
    const container = document.getElementById('achievements-popup');
    if (!container) return;

    container.innerHTML = `
        <div class="achievement-toast bg-card border border-warning rounded-4 p-3 shadow-lg">
            <div class="d-flex align-items-center gap-3">
                <span class="fs-1">${quest.icon}</span>
                <div>
                    <p class="fw-bold text-warning mb-0">Задание выполнено!</p>
                    <p class="fw-bold mb-0">${quest.name}</p>
                    <small class="text-muted">+${quest.reward} 🪙 +${quest.reward * 2} XP</small>
                </div>
            </div>
        </div>
    `;
    container.style.display = 'block';

    if (typeof playAchievementSound === 'function') playAchievementSound();
    setTimeout(() => { container.style.display = 'none'; }, 4000);
}

function renderQuestsHTML(type) {
    generateQuests(type);

    const quests = type === 'daily' ? dailyQuests : type === 'weekly' ? weeklyQuests : monthlyQuests;
    const progress = type === 'daily' ? dailyProgress : type === 'weekly' ? weeklyProgress : monthlyProgress;

    if (!quests || quests.length === 0) return `<p class="text-muted">${typeof t === 'function' ? t('noActiveQuests') : 'Нет активных заданий'}</p>`;

    const section = I18N_TEMPLATES.questsSection(type);

    return `
        <div class="quests-section">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold mb-0">${section.title}</h6>
                <small class="text-muted">${section.reset}</small>
            </div>
            <div class="d-grid gap-2">
                ${quests.map(q => {
                    const p = progress[q.id] || 0;
                    const done = progress[q.id + '_done'] || false;
                    return I18N_TEMPLATES.questItem(q, p, done);
                }).join('')}
            </div>
        </div>
    `;
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

document.addEventListener('DOMContentLoaded', () => {
    loadQuestState();
});