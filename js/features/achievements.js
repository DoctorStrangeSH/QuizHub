// ============================================
// QuizHub — Система достижений v4.3
// ============================================

const ACHIEVEMENTS = [
    { id: 'first_blood', nameKey: 'ach_first_blood', descKey: 'ach_first_blood_desc', icon: '🎯', condition: (s) => s.totalQuizzes >= 1 },
    { id: 'quiz_5', nameKey: 'ach_quiz_5', descKey: 'ach_quiz_5_desc', icon: '🌟', condition: (s) => s.totalQuizzes >= 5 },
    { id: 'quiz_10', nameKey: 'ach_quiz_10', descKey: 'ach_quiz_10_desc', icon: '📚', condition: (s) => s.totalQuizzes >= 10 },
    { id: 'quiz_25', nameKey: 'ach_quiz_25', descKey: 'ach_quiz_25_desc', icon: '📖', condition: (s) => s.totalQuizzes >= 25 },
    { id: 'quiz_50', nameKey: 'ach_quiz_50', descKey: 'ach_quiz_50_desc', icon: '🎓', condition: (s) => s.totalQuizzes >= 50 },
    { id: 'quiz_100', nameKey: 'ach_quiz_100', descKey: 'ach_quiz_100_desc', icon: '🏆', condition: (s) => s.totalQuizzes >= 100 },
    { id: 'score_50', nameKey: 'ach_score_50', descKey: 'ach_score_50_desc', icon: '🎯', condition: (s) => s.bestScore >= 50 },
    { id: 'centurion', nameKey: 'ach_centurion', descKey: 'ach_centurion_desc', icon: '💎', condition: (s) => s.bestScore >= 100 },
    { id: 'score_150', nameKey: 'ach_score_150', descKey: 'ach_score_150_desc', icon: '👑', condition: (s) => s.bestScore >= 150 },
    { id: 'score_200', nameKey: 'ach_score_200', descKey: 'ach_score_200_desc', icon: '🌟', condition: (s) => s.bestScore >= 200 },
    { id: 'speed_demon', nameKey: 'ach_speed_demon', descKey: 'ach_speed_demon_desc', icon: '⚡', condition: (s) => s.fastestAnswer < 3 && s.fastestAnswer > 0 },
    { id: 'speedrun', nameKey: 'ach_speedrun', descKey: 'ach_speedrun_desc', icon: '⏱️', condition: (s) => s.fastestQuiz < 60 && s.fastestQuiz > 0 },
    { id: 'flash', nameKey: 'ach_flash', descKey: 'ach_flash_desc', icon: '💨', condition: (s) => s.fastestAnswer < 1.5 && s.fastestAnswer > 0 },
    { id: 'streak_3', nameKey: 'ach_streak_3', descKey: 'ach_streak_3_desc', icon: '🔥', condition: (s) => s.maxStreak >= 3 },
    { id: 'streak_5', nameKey: 'ach_streak_5', descKey: 'ach_streak_5_desc', icon: '💥', condition: (s) => s.maxStreak >= 5 },
    { id: 'streak_7', nameKey: 'ach_streak_7', descKey: 'ach_streak_7_desc', icon: '🚀', condition: (s) => s.maxStreak >= 7 },
    { id: 'streak_10', nameKey: 'ach_streak_10', descKey: 'ach_streak_10_desc', icon: '🌟', condition: (s) => s.maxStreak >= 10 },
    { id: 'perfect_10', nameKey: 'ach_perfect_10', descKey: 'ach_perfect_10_desc', icon: '💯', condition: (s) => s.correctAnswers === 10 },
    { id: 'perfect_5', nameKey: 'ach_perfect_5', descKey: 'ach_perfect_5_desc', icon: '⭐', condition: (s) => s.perfectQuizzes >= 5 },
    { id: 'perfect_10_count', nameKey: 'ach_perfect_10_count', descKey: 'ach_perfect_10_count_desc', icon: '🌟', condition: (s) => s.perfectQuizzes >= 10 },
    { id: 'night_owl', nameKey: 'ach_night_owl', descKey: 'ach_night_owl_desc', icon: '🦉', condition: () => { const h = new Date().getHours(); return h >= 0 && h < 6; } },
    { id: 'early_bird', nameKey: 'ach_early_bird', descKey: 'ach_early_bird_desc', icon: '🌅', condition: () => { const h = new Date().getHours(); return h >= 6 && h < 10; } },
    { id: 'afternoon', nameKey: 'ach_afternoon', descKey: 'ach_afternoon_desc', icon: '☀️', condition: () => { const h = new Date().getHours(); return h >= 12 && h < 16; } },
    { id: 'evening', nameKey: 'ach_evening', descKey: 'ach_evening_desc', icon: '🌆', condition: () => { const h = new Date().getHours(); return h >= 18 && h < 22; } },
    { id: 'hard_mode', nameKey: 'ach_hard_mode', descKey: 'ach_hard_mode_desc', icon: '💀', condition: (s) => s.hardCompleted >= 1 },
    { id: 'hard_5', nameKey: 'ach_hard_5', descKey: 'ach_hard_5_desc', icon: '☠️', condition: (s) => s.hardCompleted >= 5 },
    { id: 'hard_10', nameKey: 'ach_hard_10', descKey: 'ach_hard_10_desc', icon: '🤯', condition: (s) => s.hardCompleted >= 10 },
    { id: 'all_difficulties', nameKey: 'ach_all_difficulties', descKey: 'ach_all_difficulties_desc', icon: '🌈', condition: (s) => s.difficultiesCompleted >= 3 },
    { id: 'polyglot', nameKey: 'ach_polyglot', descKey: 'ach_polyglot_desc', icon: '🌍', condition: (s) => s.languagesUsed >= 2 },
    { id: 'english_5', nameKey: 'ach_english_5', descKey: 'ach_english_5_desc', icon: '🇬🇧', condition: (s) => s.englishQuizzes >= 5 },
    { id: 'russian_10', nameKey: 'ach_russian_10', descKey: 'ach_russian_10_desc', icon: '🇷🇺', condition: (s) => s.russianQuizzes >= 10 },
    { id: 'streak_3_days', nameKey: 'ach_streak_3_days', descKey: 'ach_streak_3_days_desc', icon: '📅', condition: (s) => s.dayStreak >= 3 },
    { id: 'streak_7_days', nameKey: 'ach_streak_7_days', descKey: 'ach_streak_7_days_desc', icon: '🗓️', condition: (s) => s.dayStreak >= 7 },
    { id: 'streak_14_days', nameKey: 'ach_streak_14_days', descKey: 'ach_streak_14_days_desc', icon: '⚙️', condition: (s) => s.dayStreak >= 14 },
    { id: 'streak_30_days', nameKey: 'ach_streak_30_days', descKey: 'ach_streak_30_days_desc', icon: '🏅', condition: (s) => s.dayStreak >= 30 },
    { id: 'survivor', nameKey: 'ach_survivor', descKey: 'ach_survivor_desc', icon: '💀', condition: (s) => s.survivalPlayed >= 1 },
    { id: 'survivor_50', nameKey: 'ach_survivor_50', descKey: 'ach_survivor_50_desc', icon: '🏹', condition: (s) => s.survivalMaxQuestions >= 50 },
    { id: 'timed_10', nameKey: 'ach_timed_10', descKey: 'ach_timed_10_desc', icon: '⏱️', condition: (s) => s.timedGames >= 10 },
    { id: 'duel_1', nameKey: 'ach_duel_1', descKey: 'ach_duel_1_desc', icon: '⚔️', condition: (s) => s.duelsPlayed >= 1 },
    { id: 'duel_10', nameKey: 'ach_duel_10', descKey: 'ach_duel_10_desc', icon: '🛡️', condition: (s) => s.duelsPlayed >= 10 },
    { id: 'all_categories', nameKey: 'ach_all_categories', descKey: 'ach_all_categories_desc', icon: '🎓', condition: (s) => s.categoriesCompleted >= 8 },
    { id: 'science_5', nameKey: 'ach_science_5', descKey: 'ach_science_5_desc', icon: '🔬', condition: (s) => s.scienceQuizzes >= 5 },
    { id: 'history_5', nameKey: 'ach_history_5', descKey: 'ach_history_5_desc', icon: '📜', condition: (s) => s.historyQuizzes >= 5 },
    { id: 'sport_5', nameKey: 'ach_sport_5', descKey: 'ach_sport_5_desc', icon: '⚽', condition: (s) => s.sportQuizzes >= 5 },
    { id: 'first_friend', nameKey: 'ach_first_friend', descKey: 'ach_first_friend_desc', icon: '🤝', condition: (s) => s.friendsCount >= 1 },
    { id: 'social_5', nameKey: 'ach_social_5', descKey: 'ach_social_5_desc', icon: '👥', condition: (s) => s.friendsCount >= 5 },
    { id: 'gift_5', nameKey: 'ach_gift_5', descKey: 'ach_gift_5_desc', icon: '🎁', condition: (s) => s.giftsSent >= 5 },
    { id: 'team_player', nameKey: 'ach_team_player', descKey: 'ach_team_player_desc', icon: '👥', condition: (s) => s.inTeam === true },
    { id: 'comeback', nameKey: 'ach_comeback', descKey: 'ach_comeback_desc', icon: '🔄', condition: (s) => s.improved === true },
    { id: 'marathon', nameKey: 'ach_marathon', descKey: 'ach_marathon_desc', icon: '🏃', condition: (s) => s.quizzesToday >= 5 },
    { id: 'lucky', nameKey: 'ach_lucky', descKey: 'ach_lucky_desc', icon: '🍀', condition: (s) => s.closeWin === true },
];

const LEVELS = [
    { level: 1,  nameKey: 'lvl_novice',       icon: '🌱', xpRequired: 0,     color: '#00E676' },
    { level: 2,  nameKey: 'lvl_beginner',     icon: '🌿', xpRequired: 30,    color: '#40C4FF' },
    { level: 3,  nameKey: 'lvl_amateur',      icon: '📗', xpRequired: 80,    color: '#FFD740' },
    { level: 4,  nameKey: 'lvl_student',      icon: '📘', xpRequired: 150,   color: '#FFAB40' },
    { level: 5,  nameKey: 'lvl_expert',       icon: '📖', xpRequired: 250,   color: '#FF6B9D' },
    { level: 6,  nameKey: 'lvl_professional', icon: '🎯', xpRequired: 400,   color: '#7B2FBE' },
    { level: 7,  nameKey: 'lvl_master',       icon: '⚔️', xpRequired: 600,   color: '#E040FB' },
    { level: 8,  nameKey: 'lvl_grandmaster',  icon: '🛡️', xpRequired: 900,   color: '#FF5252' },
    { level: 9,  nameKey: 'lvl_elite',        icon: '💎', xpRequired: 1300,  color: '#00BCD4' },
    { level: 10, nameKey: 'lvl_champion',     icon: '🏆', xpRequired: 1800,  color: '#FFD700' },
    { level: 11, nameKey: 'lvl_legend',       icon: '👑', xpRequired: 2500,  color: '#FF9800' },
    { level: 12, nameKey: 'lvl_myth',         icon: '🌟', xpRequired: 3500,  color: '#FF4081' },
    { level: 13, nameKey: 'lvl_titan',        icon: '🔱', xpRequired: 5000,  color: '#7C4DFF' },
    { level: 14, nameKey: 'lvl_immortal',     icon: '💫', xpRequired: 7500,  color: '#FF6E40' },
    { level: 15, nameKey: 'lvl_divine',       icon: '✨', xpRequired: 10000, color: '#FFD740' },
];

function getAchievementName(ach) { return t(ach.nameKey) || ach.nameKey || 'Неизвестное достижение'; }
function getAchievementDesc(ach) { return t(ach.descKey) || ach.descKey || ''; }
function getLevelName(level) { return t(level.nameKey) || `Уровень ${level.level}`; }

function updateStats(result) {
    if (typeof currentUser === 'undefined' || !currentUser) return;

    const stats = AppState.get('stats');
    const today = new Date().toISOString().split('T')[0];

    if (stats.lastQuizDate !== today) {
        stats.quizzesToday = 0;
        stats.lastQuizDate = today;
    }
    updateDayStreak();
    stats.quizzesToday++;
    stats.totalQuizzes = (stats.totalQuizzes || 0) + 1;

    if (!stats.languagesUsed) stats.languagesUsed = [];
    const lang = AppState.get('settings.locale');
    if (!stats.languagesUsed.includes(lang)) stats.languagesUsed.push(lang);

    if (!stats.difficultiesCompleted) stats.difficultiesCompleted = [];
    const diff = AppState.get('settings.difficulty');
    if (!stats.difficultiesCompleted.includes(diff)) stats.difficultiesCompleted.push(diff);
    if (diff === 'hard') stats.hardCompleted = (stats.hardCompleted || 0) + 1;

    stats.improved = (result.score > stats.bestScore && stats.bestScore > 0);
    if (result.score > stats.bestScore) stats.bestScore = result.score;
    if (result.totalTime < stats.fastestQuiz) stats.fastestQuiz = result.totalTime;
    if (result.correctAnswers === 10) stats.perfectQuizzes = (stats.perfectQuizzes || 0) + 1;

    addXP(calculateQuizXP(result));
    AppState.set('stats', stats);

    if (typeof awardQuizCoins === 'function') awardQuizCoins(result);
}

function updateDayStreak() {
    const stats = AppState.get('stats');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (stats.lastActiveDate === today) return;
    stats.dayStreak = (stats.lastActiveDate === yesterday) ? (stats.dayStreak || 0) + 1 : 1;
    stats.lastActiveDate = today;

    // Бонус за streak: 5 XP за день (было 5-100 XP)
    if (stats.dayStreak >= 7) {
        addXP(stats.dayStreak * 5); // Было Math.min(stats.dayStreak * 5, 100)
    }
    
    AppState.set('stats', stats);
}

function calculateQuizXP(result) {
    let xp = 5; // База (было 10)
    xp += Math.floor(result.score / 20); // Бонус за очки (было /10)
    
    const diffBonus = { easy: 0, medium: 3, hard: 8, survival: 10, timed: 5 }; // Уменьшено
    xp += diffBonus[result.difficulty] || 0;
    
    if (result.correctAnswers === 10) xp += 10; // Было 20
    else if (result.correctAnswers >= 7) xp += 5; // Было 10
    
    // Ограничение сверху
    return Math.min(xp, 50); // Было 100
}

function addXP(amount) {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    if (amount <= 0) return; // Не добавляем отрицательный или нулевой XP
    
    const stats = AppState.get('stats');
    stats.totalXP = (stats.totalXP || 0) + amount;
    AppState.set('stats', stats);
    
    console.log(`⚡ +${amount} XP (всего: ${stats.totalXP})`);
}

function getCurrentLevel() {
    const xp = AppState.get('stats').totalXP || 0;
    let current = LEVELS[0];
    for (const level of LEVELS) { if (xp >= level.xpRequired) current = level; }
    return current;
}

function getNextLevel() {
    const current = getCurrentLevel();
    const index = LEVELS.findIndex(l => l.level === current.level);
    return LEVELS[index + 1] || null;
}

function checkAchievements(result) {
    if (typeof currentUser === 'undefined' || !currentUser) return;

    const stats = AppState.get('stats');
    const unlocked = AppState.get('unlockedAchievements');

    if (typeof friendsList !== 'undefined') stats.friendsCount = friendsList.length;
    if (typeof userTeam !== 'undefined') stats.inTeam = !!userTeam;

    const checkStats = {
        fastestAnswer: stats.fastestAnswer || 999,
        maxStreak: stats.maxStreak || 0,
        correctAnswers: result.correctAnswers,
        languagesUsed: (stats.languagesUsed || []).length,
        improved: stats.improved || false,
        quizzesToday: stats.quizzesToday || 0,
        totalQuizzes: stats.totalQuizzes || 0,
        bestScore: stats.bestScore || 0,
        hardCompleted: stats.hardCompleted || 0,
        difficultiesCompleted: (stats.difficultiesCompleted || []).length,
        dayStreak: stats.dayStreak || 0,
        perfectQuizzes: stats.perfectQuizzes || 0,
        survivalPlayed: stats.survivalPlayed || 0,
        duelsPlayed: stats.duelsPlayed || 0,
        friendsCount: stats.friendsCount || 0,
        inTeam: stats.inTeam || false,
        closeWin: stats.closeWin || false,
    };

    const newAchievements = [];
    ACHIEVEMENTS.forEach(ach => {
        if (!unlocked.includes(ach.id)) {
            try {
                if (ach.condition(checkStats)) {
                    newAchievements.push(ach);
                }
            } catch (e) {
                console.error(`Ошибка достижения ${ach.id}:`, e);
            }
        }
    });

    if (newAchievements.length > 0) {
        AppState.set('unlockedAchievements', [...unlocked, ...newAchievements.map(a => a.id)]);
        showAchievements(newAchievements);
        EventBus.emit(EVENTS.ACHIEVEMENT_UNLOCKED, newAchievements);
    }
}

function showAchievements(achievements) {
    const container = document.getElementById('achievements-popup');
    if (!container) return;

    achievements.forEach((ach, i) => {
        setTimeout(() => {
            container.innerHTML = `
                <div class="achievement-toast bg-card border border-accent rounded-4 p-3 shadow-lg">
                    <div class="d-flex align-items-center gap-3">
                        <span class="fs-1">${ach.icon}</span>
                        <div>
                            <p class="fw-bold text-accent mb-0">${t('achievement_unlocked')}</p>
                            <p class="fw-bold mb-0">${getAchievementName(ach)}</p>
                            <small class="text-muted">${getAchievementDesc(ach)}</small>
                        </div>
                    </div>
                </div>
            `;
            container.style.display = 'block';
            if (typeof playAchievementSound === 'function') playAchievementSound();
            if (typeof vibrateAchievement === 'function') vibrateAchievement();
            setTimeout(() => { container.style.display = 'none'; }, 3500);
        }, i * 3500);
    });
}

function renderAchievementsScreen() {
    const screen = document.getElementById('screen-achievements');
    if (!screen) return;

    const level = getCurrentLevel();
    const nextLevel = getNextLevel();
    const stats = AppState.get('stats');
    const xp = stats.totalXP || 0;
    const unlocked = AppState.get('unlockedAchievements');

    let progress = 100;
    let xpProgress = '';

    if (nextLevel) {
        const xpInLevel = xp - level.xpRequired;
        const xpNeeded = nextLevel.xpRequired - level.xpRequired;
        progress = Math.max(0, Math.floor((xpInLevel / xpNeeded) * 100));
        xpProgress = `${xpInLevel} / ${xpNeeded} XP`;
    } else {
        xpProgress = `${xp} XP (${t('max')})`;
    }

    screen.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-lg-6">
                ${I18N_TEMPLATES.achievementsHeader(unlocked.length, ACHIEVEMENTS.length)}
                ${I18N_TEMPLATES.playerLevelCard(level, progress, xpProgress)}
                ${typeof renderQuestsHTML === 'function' ? renderQuestsHTML('daily') : ''}
                ${typeof renderQuestsHTML === 'function' ? renderQuestsHTML('weekly') : ''}
                ${typeof renderQuestsHTML === 'function' ? renderQuestsHTML('monthly') : ''}
                <h5 class="fw-bold mb-3 mt-4">🏆 ${t('allAchievements')} (${unlocked.length}/${ACHIEVEMENTS.length})</h5>
                <div class="d-grid gap-2">
                    ${ACHIEVEMENTS.map(ach => {
                        const isUnlocked = unlocked.includes(ach.id);
                        return `
                            <div class="d-flex align-items-center gap-3 p-3 rounded-4 ${isUnlocked ? 'bg-card' : 'bg-card opacity-50'}">
                                <span class="fs-2 ${isUnlocked ? '' : 'grayscale'}">${ach.icon}</span>
                                <div class="flex-grow-1">
                                    <p class="fw-bold mb-0 ${isUnlocked ? 'text-accent' : 'text-muted'}">${getAchievementName(ach)}</p>
                                    <small class="text-muted">${getAchievementDesc(ach)}</small>
                                </div>
                                <span class="fs-4">${isUnlocked ? '✅' : '🔒'}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="text-center mt-4">
                    <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">
                        <i class="bi bi-play-fill me-2"></i>${t('startQuiz')}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderAchievementsList() { renderAchievementsScreen(); }

document.addEventListener('DOMContentLoaded', () => {
    console.log(`Достижения загружены: ${AppState.get('unlockedAchievements').length} из ${ACHIEVEMENTS.length}`);
});