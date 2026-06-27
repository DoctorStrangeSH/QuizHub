// ============================================
// QuizHub — Система достижений v4.1
// ============================================

const ACHIEVEMENTS = [
    { id: 'first_blood', nameKey: 'ach_first_blood', descKey: 'ach_first_blood_desc', icon: '🎯', condition: (s) => s.totalQuizzes >= 1 },
    { id: 'quiz_5', nameKey: 'ach_quiz_5', descKey: 'ach_quiz_5_desc', icon: '🌟', condition: (s) => s.totalQuizzes >= 5 },
    { id: 'quiz_10', nameKey: 'ach_quiz_10', descKey: 'ach_quiz_10_desc', icon: '📚', condition: (s) => s.totalQuizzes >= 10 },
    { id: 'quiz_25', nameKey: 'ach_quiz_25', descKey: 'ach_quiz_25_desc', icon: '📖', condition: (s) => s.totalQuizzes >= 25 },
    { id: 'quiz_50', nameKey: 'ach_quiz_50', descKey: 'ach_quiz_50_desc', icon: '🎓', condition: (s) => s.totalQuizzes >= 50 },
    { id: 'quiz_100', nameKey: 'ach_quiz_100', descKey: 'ach_quiz_100_desc', icon: '🏆', condition: (s) => s.totalQuizzes >= 100 },
    { id: 'centurion', nameKey: 'ach_centurion', descKey: 'ach_centurion_desc', icon: '💎', condition: (s) => s.bestScore >= 100 },
    { id: 'speed_demon', nameKey: 'ach_speed_demon', descKey: 'ach_speed_demon_desc', icon: '⚡', condition: (s) => s.fastestAnswer < 3 && s.fastestAnswer > 0 },
    { id: 'perfect_10', nameKey: 'ach_perfect_10', descKey: 'ach_perfect_10_desc', icon: '💯', condition: (s) => s.correctAnswers === 10 },
    { id: 'night_owl', nameKey: 'ach_night_owl', descKey: 'ach_night_owl_desc', icon: '🦉', condition: () => { const h = new Date().getHours(); return h >= 0 && h < 6; } },
    { id: 'early_bird', nameKey: 'ach_early_bird', descKey: 'ach_early_bird_desc', icon: '🌅', condition: () => { const h = new Date().getHours(); return h >= 6 && h < 10; } },
    { id: 'hard_mode', nameKey: 'ach_hard_mode', descKey: 'ach_hard_mode_desc', icon: '💀', condition: (s) => s.hardCompleted >= 1 },
    { id: 'polyglot', nameKey: 'ach_polyglot', descKey: 'ach_polyglot_desc', icon: '🌍', condition: (s) => s.languagesUsed >= 2 },
    { id: 'streak_3_days', nameKey: 'ach_streak_3_days', descKey: 'ach_streak_3_days_desc', icon: '📅', condition: (s) => s.dayStreak >= 3 },
    { id: 'marathon', nameKey: 'ach_marathon', descKey: 'ach_marathon_desc', icon: '🏃', condition: (s) => s.quizzesToday >= 5 },
    { id: 'survivor', nameKey: 'ach_survivor', descKey: 'ach_survivor_desc', icon: '💀', condition: (s) => s.survivalPlayed >= 1 },
    { id: 'duel_1', nameKey: 'ach_duel_1', descKey: 'ach_duel_1_desc', icon: '⚔️', condition: (s) => s.duelsPlayed >= 1 },
    { id: 'first_friend', nameKey: 'ach_first_friend', descKey: 'ach_first_friend_desc', icon: '🤝', condition: (s) => s.friendsCount >= 1 },
    { id: 'team_player', nameKey: 'ach_team_player', descKey: 'ach_team_player_desc', icon: '👥', condition: (s) => s.inTeam === true },
    { id: 'comeback', nameKey: 'ach_comeback', descKey: 'ach_comeback_desc', icon: '🔄', condition: (s) => s.improved === true },
    { id: 'lucky', nameKey: 'ach_lucky', descKey: 'ach_lucky_desc', icon: '🍀', condition: (s) => s.closeWin === true },
];

const LEVELS = [
    { level: 1, nameKey: 'lvl_novice', icon: '🌱', xpRequired: 0, color: '#00E676' },
    { level: 2, nameKey: 'lvl_amateur', icon: '🌿', xpRequired: 100, color: '#40C4FF' },
    { level: 3, nameKey: 'lvl_expert', icon: '📖', xpRequired: 300, color: '#FFD740' },
    { level: 4, nameKey: 'lvl_master', icon: '🎯', xpRequired: 600, color: '#FF6B9D' },
    { level: 5, nameKey: 'lvl_grandmaster', icon: '⚔️', xpRequired: 1000, color: '#7B2FBE' },
    { level: 6, nameKey: 'lvl_legend', icon: '👑', xpRequired: 1500, color: '#FFD700' },
    { level: 7, nameKey: 'lvl_myth', icon: '🌟', xpRequired: 2500, color: '#FF5252' },
];

let unlockedAchievements = JSON.parse(localStorage.getItem('quizhub-achievements') || '[]');
let quizStats = JSON.parse(localStorage.getItem('quizhub-stats') || JSON.stringify({
    quizzesToday: 0, lastQuizDate: '', languagesUsed: [], bestScore: 0,
    fastestAnswer: 999, fastestQuiz: 9999, maxStreak: 0, improved: false,
    totalQuizzes: 0, totalXP: 0, hardCompleted: 0, difficultiesCompleted: [],
    dayStreak: 0, lastActiveDate: '', perfectQuizzes: 0,
    englishQuizzes: 0, russianQuizzes: 0, survivalPlayed: 0, survivalMaxQuestions: 0,
    timedGames: 0, duelsPlayed: 0, categoriesCompleted: [],
    scienceQuizzes: 0, historyQuizzes: 0, sportQuizzes: 0,
    friendsCount: 0, giftsSent: 0, inTeam: false, closeWin: false,
}));

function getAchievementName(ach) { return t(ach.nameKey) || ach.nameKey || 'Неизвестное достижение'; }
function getAchievementDesc(ach) { return t(ach.descKey) || ach.descKey || ''; }
function getLevelName(level) { return t(level.nameKey) || `Уровень ${level.level}`; }

function updateStats(result) {
    const today = new Date().toISOString().split('T')[0];
    if (quizStats.lastQuizDate !== today) { quizStats.quizzesToday = 0; quizStats.lastQuizDate = today; }
    updateDayStreak();
    quizStats.quizzesToday++;
    quizStats.totalQuizzes = (quizStats.totalQuizzes || 0) + 1;
    if (!quizStats.languagesUsed) quizStats.languagesUsed = [];
    const lang = (typeof selectedLanguage !== 'undefined') ? selectedLanguage : 'ru';
    if (!quizStats.languagesUsed.includes(lang)) quizStats.languagesUsed.push(lang);
    if (lang === 'en') quizStats.englishQuizzes = (quizStats.englishQuizzes || 0) + 1;
    if (lang === 'ru') quizStats.russianQuizzes = (quizStats.russianQuizzes || 0) + 1;
    if (!quizStats.difficultiesCompleted) quizStats.difficultiesCompleted = [];
    const diff = (typeof selectedDifficulty !== 'undefined') ? selectedDifficulty : 'easy';
    if (!quizStats.difficultiesCompleted.includes(diff)) quizStats.difficultiesCompleted.push(diff);
    if (diff === 'hard') quizStats.hardCompleted = (quizStats.hardCompleted || 0) + 1;
    quizStats.improved = (result.score > quizStats.bestScore && quizStats.bestScore > 0);
    if (result.score > quizStats.bestScore) quizStats.bestScore = result.score;
    if (result.totalTime < quizStats.fastestQuiz) quizStats.fastestQuiz = result.totalTime;
    if (result.correctAnswers === 10) quizStats.perfectQuizzes = (quizStats.perfectQuizzes || 0) + 1;
    addXP(calculateQuizXP(result));
    if (typeof awardQuizCoins === 'function' && typeof currentUser !== 'undefined' && currentUser) awardQuizCoins(result);
    localStorage.setItem('quizhub-stats', JSON.stringify(quizStats));
}

function updateDayStreak() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (quizStats.lastActiveDate === today) return;
    quizStats.dayStreak = (quizStats.lastActiveDate === yesterday) ? (quizStats.dayStreak || 0) + 1 : 1;
    quizStats.lastActiveDate = today;
    if (quizStats.dayStreak >= 7) addXP(Math.min(quizStats.dayStreak * 5, 100));
}

function calculateQuizXP(result) {
    let xp = 10 + Math.floor(result.score / 10);
    const diffBonus = { easy: 0, medium: 5, hard: 15, survival: 20, timed: 10 };
    xp += diffBonus[result.difficulty] || 0;
    if (result.correctAnswers === 10) xp += 20;
    else if (result.correctAnswers >= 7) xp += 10;
    return xp;
}

function addXP(amount) { quizStats.totalXP = (quizStats.totalXP || 0) + amount; localStorage.setItem('quizhub-stats', JSON.stringify(quizStats)); }

function getCurrentLevel() {
    const xp = quizStats.totalXP || 0;
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
    if (typeof friendsList !== 'undefined') quizStats.friendsCount = friendsList.length;
    if (typeof userTeam !== 'undefined') quizStats.inTeam = !!userTeam;
    const stats = {
        fastestAnswer: quizStats.fastestAnswer || 999, fastestQuiz: quizStats.fastestQuiz || 9999,
        maxStreak: quizStats.maxStreak || 0, correctAnswers: result.correctAnswers,
        languagesUsed: (quizStats.languagesUsed || []).length, improved: quizStats.improved || false,
        quizzesToday: quizStats.quizzesToday || 0, totalQuizzes: quizStats.totalQuizzes || 0,
        bestScore: quizStats.bestScore || 0, hardCompleted: quizStats.hardCompleted || 0,
        difficultiesCompleted: (quizStats.difficultiesCompleted || []).length,
        dayStreak: quizStats.dayStreak || 0, perfectQuizzes: quizStats.perfectQuizzes || 0,
        englishQuizzes: quizStats.englishQuizzes || 0, russianQuizzes: quizStats.russianQuizzes || 0,
        survivalPlayed: quizStats.survivalPlayed || 0, survivalMaxQuestions: quizStats.survivalMaxQuestions || 0,
        timedGames: quizStats.timedGames || 0, duelsPlayed: quizStats.duelsPlayed || 0,
        categoriesCompleted: (quizStats.categoriesCompleted || []).length,
        scienceQuizzes: quizStats.scienceQuizzes || 0, historyQuizzes: quizStats.historyQuizzes || 0,
        sportQuizzes: quizStats.sportQuizzes || 0, friendsCount: quizStats.friendsCount || 0,
        giftsSent: quizStats.giftsSent || 0, inTeam: quizStats.inTeam || false, closeWin: quizStats.closeWin || false,
    };
    const newAchievements = [];
    ACHIEVEMENTS.forEach(ach => {
        if (!unlockedAchievements.includes(ach.id)) {
            try { if (ach.condition(stats)) { unlockedAchievements.push(ach.id); newAchievements.push(ach); } }
            catch (e) { console.error(`Ошибка достижения ${ach.id}:`, e); }
        }
    });
    if (newAchievements.length > 0) {
        localStorage.setItem('quizhub-achievements', JSON.stringify(unlockedAchievements));
        showAchievements(newAchievements);
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
    const xp = quizStats?.totalXP || 0;
    let progress = 100, xpProgress = '';
    if (nextLevel) {
        const xpInLevel = xp - level.xpRequired;
        const xpNeeded = nextLevel.xpRequired - level.xpRequired;
        progress = Math.max(0, Math.floor((xpInLevel / xpNeeded) * 100));
        xpProgress = `${xpInLevel} / ${xpNeeded} XP`;
    } else {
        xpProgress = `${xp} XP (${t('max')})`;
    }

    screen.innerHTML = `
        <div class="row justify-content-center"><div class="col-lg-6">
            ${I18N_TEMPLATES.achievementsHeader(unlockedAchievements.length, ACHIEVEMENTS.length)}
            ${I18N_TEMPLATES.playerLevelCard(level, progress, xpProgress)}
            ${typeof renderQuestsHTML === 'function' ? renderQuestsHTML('daily') : ''}
            ${typeof renderQuestsHTML === 'function' ? renderQuestsHTML('weekly') : ''}
            ${typeof renderQuestsHTML === 'function' ? renderQuestsHTML('monthly') : ''}
            <h5 class="fw-bold mb-3 mt-4">🏆 ${t('allAchievements')} (${unlockedAchievements.length}/${ACHIEVEMENTS.length})</h5>
            <div class="d-grid gap-2">
                ${ACHIEVEMENTS.map(ach => {
                    const unlocked = unlockedAchievements.includes(ach.id);
                    return `
                        <div class="d-flex align-items-center gap-3 p-3 rounded-4 ${unlocked ? 'bg-card' : 'bg-card opacity-50'}">
                            <span class="fs-2 ${unlocked ? '' : 'grayscale'}">${ach.icon}</span>
                            <div class="flex-grow-1">
                                <p class="fw-bold mb-0 ${unlocked ? 'text-accent' : 'text-muted'}">${getAchievementName(ach)}</p>
                                <small class="text-muted">${getAchievementDesc(ach)}</small>
                            </div>
                            <span class="fs-4">${unlocked ? '✅' : '🔒'}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="text-center mt-4">
                <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">
                    <i class="bi bi-play-fill me-2"></i>${t('startQuiz')}
                </button>
            </div>
        </div></div>
    `;
}

function renderAchievementsList() { renderAchievementsScreen(); }

document.addEventListener('DOMContentLoaded', () => {
    console.log(`Достижения загружены: ${unlockedAchievements.length} из ${ACHIEVEMENTS.length}`);
});