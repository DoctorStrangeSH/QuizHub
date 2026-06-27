// ============================================
// QuizHub — Система квестов v2.0
// Модульная, настраиваемая, расширяемая
// ============================================

// ========== КОНФИГУРАЦИЯ КВЕСТОВ ==========
// Здесь ты настраиваешь все квесты

const QUESTS_CONFIG = {
    daily: {
        count: 3,                    // Сколько квестов в день
        resetHour: 0,                // Час сброса по МСК
        quests: [
            { id: 'dq_play_1',    name: 'Разминка',      desc: 'Пройти 1 квиз',              target: 1,  type: 'quizzes',       reward: { coins: 20 } },
            { id: 'dq_play_3',    name: 'Квиз-машина',   desc: 'Пройти 3 квиза',             target: 3,  type: 'quizzes',       reward: { coins: 40 } },
            { id: 'dq_score_50',  name: 'Пятьдесят+',    desc: 'Набрать 50+ очков',          target: 1,  type: 'score_50',      reward: { coins: 30 } },
            { id: 'dq_score_100', name: 'Сотка',         desc: 'Набрать 100+ очков',         target: 1,  type: 'score_100',     reward: { coins: 50 } },
            { id: 'dq_perfect',   name: 'Идеально',      desc: '10/10 правильных',           target: 1,  type: 'perfect',       reward: { coins: 60, xp: 20 } },
            { id: 'dq_hard',      name: 'Хардкор',       desc: 'Пройти на сложном',          target: 1,  type: 'hard_quiz',     reward: { coins: 45 } },
            { id: 'dq_streak',    name: 'В ударе',       desc: 'Серия из 5 правильных',      target: 1,  type: 'streak_5',      reward: { coins: 35 } },
            { id: 'dq_english',   name: 'English!',      desc: 'Пройти на английском',       target: 1,  type: 'english',       reward: { coins: 40 } },
            { id: 'dq_cinema',    name: 'Киноман',       desc: 'Пройти категорию Кино',      target: 1,  type: 'category_cinema', reward: { coins: 25 } },
            { id: 'dq_sport',     name: 'Спортсмен',     desc: 'Пройти категорию Спорт',     target: 1,  type: 'category_sport', reward: { coins: 25 } },
            { id: 'dq_science',   name: 'Учёный',        desc: 'Пройти категорию Наука',     target: 1,  type: 'category_science', reward: { coins: 25 } },
            { id: 'dq_fast',      name: 'Спидран',       desc: 'Квиз быстрее 60 секунд',     target: 1,  type: 'fast_quiz',     reward: { coins: 45 } },
        ]
    },
    weekly: {
        count: 3,
        resetDay: 1,                 // Понедельник
        quests: [
            { id: 'wq_quizzes',   name: 'Марафонец',      desc: 'Пройти 15 квизов',           target: 15, type: 'quizzes',       reward: { coins: 150 } },
            { id: 'wq_categories',name: 'Коллекционер',   desc: 'Пройти 8 категорий',         target: 8,  type: 'categories',    reward: { coins: 200 } },
            { id: 'wq_perfect',   name: 'Непревзойдённый', desc: '5 идеальных квизов',        target: 5,  type: 'perfect',       reward: { coins: 300, xp: 50 } },
            { id: 'wq_xp',        name: 'Охотник за XP',  desc: 'Заработать 500 XP',          target: 500, type: 'xp',           reward: { coins: 200 } },
            { id: 'wq_diff',      name: 'Разнообразие',   desc: 'Пройти на всех сложностях',  target: 3,  type: 'difficulties',  reward: { coins: 150 } },
        ]
    },
    monthly: {
        count: 3,
        resetDay: 1,                 // 1 число
        quests: [
            { id: 'mq_quizzes',   name: 'Легендарный марафон', desc: 'Пройти 50 квизов',      target: 50,  type: 'quizzes',    reward: { coins: 500 } },
            { id: 'mq_perfect',   name: 'Идеальный месяц',     desc: '15 идеальных квизов',    target: 15,  type: 'perfect',    reward: { coins: 800, xp: 100 } },
            { id: 'mq_xp',        name: 'XP-фермер',           desc: 'Заработать 2000 XP',     target: 2000, type: 'xp',        reward: { coins: 600 } },
            { id: 'mq_coins',     name: 'Богач',               desc: 'Накопить 1000 монет',    target: 1000, type: 'coins',     reward: { coins: 300 } },
        ]
    }
};

// ========== ХРАНИЛИЩЕ ==========

let questState = {
    daily:    { date: '',   quests: [], progress: {} },
    weekly:   { week: '',   quests: [], progress: {} },
    monthly:  { month: '',  quests: [], progress: {} },
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========

function initQuests() {
    const saved = JSON.parse(localStorage.getItem('quizhub-quests-v2') || '{}');
    if (saved.daily) questState = saved;
    generateAllQuests();
}

function generateAllQuests() {
    ['daily', 'weekly', 'monthly'].forEach(type => {
        const config = QUESTS_CONFIG[type];
        const now = getMskTime();
        
        let needsReset = false;
        
        if (type === 'daily') {
            const today = now.toISOString().split('T')[0];
            needsReset = questState.daily.date !== today;
            if (needsReset) questState.daily.date = today;
        } else if (type === 'weekly') {
            const week = getWeekNumber(now);
            needsReset = questState.weekly.week !== week;
            if (needsReset) questState.weekly.week = week;
        } else {
            const month = `${now.getFullYear()}-${now.getMonth() + 1}`;
            needsReset = questState.monthly.month !== month;
            if (needsReset) questState.monthly.month = month;
        }
        
        if (needsReset || questState[type].quests.length === 0) {
            const pool = shuffleArray([...config.quests]);
            questState[type].quests = pool.slice(0, config.count);
            questState[type].progress = {};
            questState[type].quests.forEach(q => {
                questState[type].progress[q.id] = 0;
            });
        }
    });
    
    saveQuestState();
}

// ========== ОБНОВЛЕНИЕ ПРОГРЕССА ==========

function updateQuestProgress(eventType, value = 1) {
    generateAllQuests();
    
    ['daily', 'weekly', 'monthly'].forEach(type => {
        questState[type].quests.forEach(quest => {
            const progress = questState[type].progress;
            
            // Пропускаем выполненные
            if (progress[quest.id + '_done']) return;
            
            if (quest.type === eventType) {
                if (eventType === 'xp' || eventType === 'coins') {
                    // Абсолютное значение
                    progress[quest.id] = value;
                } else {
                    // Прибавляем
                    progress[quest.id] = (progress[quest.id] || 0) + value;
                }
                
                if (progress[quest.id] >= quest.target && !progress[quest.id + '_done']) {
                    completeQuest(quest, type);
                }
            }
        });
    });
    
    saveQuestState();
}

// ========== ВЫПОЛНЕНИЕ КВЕСТА ==========

function completeQuest(quest, type) {
    questState[type].progress[quest.id + '_done'] = true;
    
    // Награды
    if (quest.reward.coins && typeof addCoins === 'function') {
        addCoins(quest.reward.coins);
    }
    if (quest.reward.xp && typeof addXP === 'function') {
        addXP(quest.reward.xp);
    }
    
    showQuestCompleteNotification(quest);
    saveQuestState();
    EventBus.emit(EVENTS.QUEST_COMPLETED, quest);
}

// ========== ОТОБРАЖЕНИЕ ==========

function renderQuestsHTML(type) {
    const data = questState[type];
    if (!data.quests.length) return '';
    
    const titles = { daily: '📋 Ежедневные', weekly: '📅 Недельные', monthly: '🗓️ Месячные' };
    const resets = { daily: '00:00 МСК', weekly: 'Пн 00:00 МСК', monthly: '1 число 00:00 МСК' };
    
    return `
        <div class="quests-v2-section">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold mb-0">${titles[type]}</h6>
                <small class="text-muted">Сброс: ${resets[type]}</small>
            </div>
            <div class="d-grid gap-2">
                ${data.quests.map(q => {
                    const p = data.progress[q.id] || 0;
                    const done = data.progress[q.id + '_done'] || false;
                    const pct = Math.min((p / q.target) * 100, 100);
                    const rewardText = [];
                    if (q.reward.coins) rewardText.push(`🪙 ${q.reward.coins}`);
                    if (q.reward.xp) rewardText.push(`⚡ ${q.reward.xp} XP`);
                    
                    return `
                        <div class="quests-v2-item ${done ? 'done' : ''}">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="fw-semibold ${done ? 'text-success' : ''}">${q.name}</span>
                                <small class="text-muted">${rewardText.join(' + ')}</small>
                            </div>
                            <div class="progress mt-1" style="height:5px;">
                                <div class="progress-bar ${done ? 'bg-success' : 'bg-accent'}" style="width:${pct}%"></div>
                            </div>
                            <small class="text-muted">${p}/${q.target} • ${q.desc}</small>
                            ${done ? '<span class="quests-v2-check">✅</span>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========

function getMskTime() {
    return new Date(new Date().getTime() + 3 * 60 * 60 * 1000);
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function saveQuestState() {
    localStorage.setItem('quizhub-quests-v2', JSON.stringify(questState));
}

function showQuestCompleteNotification(quest) {
    const container = document.getElementById('achievements-popup');
    if (!container) return;
    
    const rewardText = [];
    if (quest.reward.coins) rewardText.push(`🪙 ${quest.reward.coins}`);
    if (quest.reward.xp) rewardText.push(`⚡ ${quest.reward.xp} XP`);
    
    container.innerHTML = `
        <div class="achievement-toast bg-card border border-warning rounded-4 p-3 shadow-lg">
            <div class="d-flex align-items-center gap-3">
                <span class="fs-1">✅</span>
                <div>
                    <p class="fw-bold text-warning mb-0">Квест выполнен!</p>
                    <p class="fw-bold mb-0">${quest.name}</p>
                    <small class="text-muted">${rewardText.join(' + ')}</small>
                </div>
            </div>
        </div>
    `;
    container.style.display = 'block';
    setTimeout(() => { container.style.display = 'none'; }, 4000);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
    initQuests();
});