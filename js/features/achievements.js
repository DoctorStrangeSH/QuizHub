// ============================================
// QuizHub — Система достижений v3.1
// ============================================

const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'Первый шаг', desc: 'Пройти первый квиз', icon: '🎯', condition: (s) => s.totalQuizzes >= 1 },
  { id: 'quiz_5', name: 'Новичок', desc: 'Пройти 5 квизов', icon: '🌟', condition: (s) => s.totalQuizzes >= 5 },
  { id: 'quiz_10', name: 'Любитель', desc: 'Пройти 10 квизов', icon: '📚', condition: (s) => s.totalQuizzes >= 10 },
  { id: 'quiz_25', name: 'Знаток', desc: 'Пройти 25 квизов', icon: '📖', condition: (s) => s.totalQuizzes >= 25 },
  { id: 'quiz_50', name: 'Эксперт', desc: 'Пройти 50 квизов', icon: '🎓', condition: (s) => s.totalQuizzes >= 50 },
  { id: 'quiz_100', name: 'Легенда', desc: 'Пройти 100 квизов', icon: '🏆', condition: (s) => s.totalQuizzes >= 100 },
  { id: 'score_50', name: 'Полтинник', desc: 'Набрать 50+ очков', icon: '🎯', condition: (s) => s.bestScore >= 50 },
  { id: 'centurion', name: 'Центурион', desc: 'Набрать 100+ очков', icon: '💎', condition: (s) => s.bestScore >= 100 },
  { id: 'score_150', name: 'Гроссмейстер', desc: 'Набрать 150+ очков', icon: '👑', condition: (s) => s.bestScore >= 150 },
  { id: 'score_200', name: 'Невозможное возможно', desc: 'Набрать 200+ очков', icon: '🌟', condition: (s) => s.bestScore >= 200 },
  { id: 'speed_demon', name: 'Молниеносный', desc: 'Ответить за <3 секунд', icon: '⚡', condition: (s) => s.fastestAnswer < 3 && s.fastestAnswer > 0 },
  { id: 'speedrun', name: 'Спидран', desc: 'Пройти квиз быстрее 60 секунд', icon: '⏱️', condition: (s) => s.fastestQuiz < 60 && s.fastestQuiz > 0 },
  { id: 'flash', name: 'Флэш', desc: 'Ответить за <1.5 секунд', icon: '💨', condition: (s) => s.fastestAnswer < 1.5 && s.fastestAnswer > 0 },
  { id: 'streak_3', name: 'Разогрев', desc: '3 правильных подряд', icon: '🔥', condition: (s) => s.maxStreak >= 3 },
  { id: 'streak_5', name: 'В ударе', desc: '5 правильных подряд', icon: '💥', condition: (s) => s.maxStreak >= 5 },
  { id: 'streak_7', name: 'Машина', desc: '7 правильных подряд', icon: '🚀', condition: (s) => s.maxStreak >= 7 },
  { id: 'streak_10', name: 'Неудержимый', desc: '10 правильных подряд', icon: '🌟', condition: (s) => s.maxStreak >= 10 },
  { id: 'perfect_10', name: 'Перфекционист', desc: '10/10 правильных', icon: '💯', condition: (s) => s.correctAnswers === 10 },
  { id: 'perfect_5', name: 'Пять из пяти', desc: '5 идеальных квизов', icon: '⭐', condition: (s) => s.perfectQuizzes >= 5 },
  { id: 'perfect_10_count', name: 'Идеальная десятка', desc: '10 идеальных квизов', icon: '🌟', condition: (s) => s.perfectQuizzes >= 10 },
  { id: 'night_owl', name: 'Полуночник', desc: 'Пройти квиз с 00:00 до 06:00', icon: '🦉', condition: () => { const h = new Date().getHours(); return h >= 0 && h < 6; } },
  { id: 'early_bird', name: 'Жаворонок', desc: 'Пройти квиз с 06:00 до 10:00', icon: '🌅', condition: () => { const h = new Date().getHours(); return h >= 6 && h < 10; } },
  { id: 'afternoon', name: 'Дневной', desc: 'Пройти квиз с 12:00 до 16:00', icon: '☀️', condition: () => { const h = new Date().getHours(); return h >= 12 && h < 16; } },
  { id: 'evening', name: 'Вечерний', desc: 'Пройти квиз с 18:00 до 22:00', icon: '🌆', condition: () => { const h = new Date().getHours(); return h >= 18 && h < 22; } },
  { id: 'hard_mode', name: 'Хардкор', desc: 'Пройти квиз на сложном', icon: '💀', condition: (s) => s.hardCompleted >= 1 },
  { id: 'hard_5', name: 'Хардкорщик', desc: '5 сложных квизов', icon: '☠️', condition: (s) => s.hardCompleted >= 5 },
  { id: 'hard_10', name: 'Безумец', desc: '10 сложных квизов', icon: '🤯', condition: (s) => s.hardCompleted >= 10 },
  { id: 'all_difficulties', name: 'Универсал', desc: 'Пройти на всех сложностях', icon: '🌈', condition: (s) => s.difficultiesCompleted >= 3 },
  { id: 'polyglot', name: 'Полиглот', desc: 'Пройти на обоих языках', icon: '🌍', condition: (s) => s.languagesUsed >= 2 },
  { id: 'english_5', name: 'Englishman', desc: '5 квизов на английском', icon: '🇬🇧', condition: (s) => s.englishQuizzes >= 5 },
  { id: 'russian_10', name: 'Русская душа', desc: '10 квизов на русском', icon: '🇷🇺', condition: (s) => s.russianQuizzes >= 10 },
  { id: 'streak_3_days', name: 'Постоянство', desc: 'Заходить 3 дня подряд', icon: '📅', condition: (s) => s.dayStreak >= 3 },
  { id: 'streak_7_days', name: 'Дисциплина', desc: 'Заходить 7 дней подряд', icon: '🗓️', condition: (s) => s.dayStreak >= 7 },
  { id: 'streak_14_days', name: 'Железная воля', desc: 'Заходить 14 дней подряд', icon: '⚙️', condition: (s) => s.dayStreak >= 14 },
  { id: 'streak_30_days', name: 'Месяц без перерыва', desc: 'Заходить 30 дней подряд', icon: '🏅', condition: (s) => s.dayStreak >= 30 },
  { id: 'survivor', name: 'Выживший', desc: 'Сыграть в режиме выживания', icon: '💀', condition: (s) => s.survivalPlayed >= 1 },
  { id: 'survivor_50', name: 'Охотник', desc: '50+ вопросов в выживании', icon: '🏹', condition: (s) => s.survivalMaxQuestions >= 50 },
  { id: 'timed_10', name: 'Гонщик', desc: '10 игр на время', icon: '⏱️', condition: (s) => s.timedGames >= 10 },
  { id: 'duel_1', name: 'Дуэлянт', desc: 'Сыграть дуэль', icon: '⚔️', condition: (s) => s.duelsPlayed >= 1 },
  { id: 'duel_10', name: 'Гладиатор', desc: '10 дуэлей', icon: '🛡️', condition: (s) => s.duelsPlayed >= 10 },
  { id: 'all_categories', name: 'Эрудит', desc: 'Пройти все категории', icon: '🎓', condition: (s) => s.categoriesCompleted >= 8 },
  { id: 'science_5', name: 'Учёный', desc: '5 квизов по науке', icon: '🔬', condition: (s) => s.scienceQuizzes >= 5 },
  { id: 'history_5', name: 'Историк', desc: '5 квизов по истории', icon: '📜', condition: (s) => s.historyQuizzes >= 5 },
  { id: 'sport_5', name: 'Атлет', desc: '5 квизов по спорту', icon: '⚽', condition: (s) => s.sportQuizzes >= 5 },
  { id: 'first_friend', name: 'Дружба', desc: 'Добавить друга', icon: '🤝', condition: (s) => s.friendsCount >= 1 },
  { id: 'social_5', name: 'Компания', desc: '5 друзей', icon: '👥', condition: (s) => s.friendsCount >= 5 },
  { id: 'gift_5', name: 'Щедрый', desc: 'Отправить 5 подарков', icon: '🎁', condition: (s) => s.giftsSent >= 5 },
  { id: 'team_player', name: 'Командный игрок', desc: 'Быть в команде', icon: '👥', condition: (s) => s.inTeam === true },
  { id: 'comeback', name: 'Камбэк', desc: 'Улучшить результат после неудачи', icon: '🔄', condition: (s) => s.improved === true },
  { id: 'marathon', name: 'Марафонец', desc: '5 квизов за день', icon: '🏃', condition: (s) => s.quizzesToday >= 5 },
  { id: 'lucky', name: 'Везунчик', desc: 'Выиграть дуэль с разницей в 1 очко', icon: '🍀', condition: (s) => s.closeWin === true },
];

const LEVELS = [
  { level: 1, name: 'Новичок', xpRequired: 0, icon: '🌱', color: '#00E676' },
  { level: 2, name: 'Любитель', xpRequired: 100, icon: '🌿', color: '#40C4FF' },
  { level: 3, name: 'Знаток', xpRequired: 300, icon: '📖', color: '#FFD740' },
  { level: 4, name: 'Эксперт', xpRequired: 600, icon: '🎯', color: '#FF6B9D' },
  { level: 5, name: 'Мастер', xpRequired: 1000, icon: '⚔️', color: '#7B2FBE' },
  { level: 6, name: 'Грандмастер', xpRequired: 1500, icon: '👑', color: '#FFD700' },
  { level: 7, name: 'Легенда', xpRequired: 2500, icon: '🌟', color: '#FF5252' },
];

let unlockedAchievements = JSON.parse(localStorage.getItem('quizhub-achievements') || '[]');
let quizStats = JSON.parse(localStorage.getItem('quizhub-stats') || JSON.stringify({
  quizzesToday: 0, lastQuizDate: '', languagesUsed: [], bestScore: 0,
  fastestAnswer: 999, fastestQuiz: 9999, maxStreak: 0, improved: false,
  totalQuizzes: 0, totalXP: 0, hardCompleted: 0, difficultiesCompleted: [],
  dayStreak: 0, lastActiveDate: '', fastAnswersCount: 0, perfectQuizzes: 0,
  englishQuizzes: 0, russianQuizzes: 0, survivalPlayed: 0, survivalMaxQuestions: 0,
  timedGames: 0, duelsPlayed: 0, categoriesCompleted: [],
  scienceQuizzes: 0, historyQuizzes: 0, sportQuizzes: 0,
  friendsCount: 0, giftsSent: 0, inTeam: false, closeWin: false,
}));

function updateStats(result) {
  const today = new Date().toISOString().split('T')[0];
  if (quizStats.lastQuizDate !== today) { quizStats.quizzesToday = 0; quizStats.lastQuizDate = today; quizStats.fastAnswersCount = 0; }
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
  if (!quizStats.categoriesCompleted) quizStats.categoriesCompleted = [];
  const category = result.category || 'any';
  if (category !== 'any' && !quizStats.categoriesCompleted.includes(category)) quizStats.categoriesCompleted.push(category);
  if (category === 'science') quizStats.scienceQuizzes = (quizStats.scienceQuizzes || 0) + 1;
  if (category === 'history') quizStats.historyQuizzes = (quizStats.historyQuizzes || 0) + 1;
  if (category === 'sport') quizStats.sportQuizzes = (quizStats.sportQuizzes || 0) + 1;
  if (result.score > quizStats.bestScore && quizStats.bestScore > 0) quizStats.improved = true;
  else quizStats.improved = false;
  if (result.score > quizStats.bestScore) quizStats.bestScore = result.score;
  if (result.totalTime < quizStats.fastestQuiz) quizStats.fastestQuiz = result.totalTime;
  if (result.correctAnswers === 10) quizStats.perfectQuizzes = (quizStats.perfectQuizzes || 0) + 1;
  if (result.difficulty === 'survival') { quizStats.survivalPlayed = (quizStats.survivalPlayed || 0) + 1; if (typeof survivalQuestionNumber !== 'undefined' && survivalQuestionNumber > quizStats.survivalMaxQuestions) quizStats.survivalMaxQuestions = survivalQuestionNumber; }
  if (result.difficulty === 'timed') quizStats.timedGames = (quizStats.timedGames || 0) + 1;
  if (result.difficulty === 'duel') quizStats.duelsPlayed = (quizStats.duelsPlayed || 0) + 1;
  const xpEarned = calculateQuizXP(result);
  addXP(xpEarned);
  if (typeof awardQuizCoins === 'function') awardQuizCoins(result);
  localStorage.setItem('quizhub-stats', JSON.stringify(quizStats));
}

function updateDayStreak() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (quizStats.lastActiveDate === today) return;
  if (quizStats.lastActiveDate === yesterday) quizStats.dayStreak = (quizStats.dayStreak || 0) + 1;
  else if (quizStats.lastActiveDate !== today) quizStats.dayStreak = 1;
  quizStats.lastActiveDate = today;
  if (quizStats.dayStreak >= 7) { const bonus = Math.min(quizStats.dayStreak * 5, 100); addXP(bonus); }
}

function calculateQuizXP(result) {
  let xp = 10;
  xp += Math.floor(result.score / 10);
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
  if (newAchievements.length > 0) { localStorage.setItem('quizhub-achievements', JSON.stringify(unlockedAchievements)); showAchievements(newAchievements); }
}

function showAchievements(achievements) {
  const container = document.getElementById('achievements-popup');
  if (!container) return;
  achievements.forEach((ach, i) => {
    setTimeout(() => {
      container.innerHTML = `<div class="achievement-toast bg-card border border-accent rounded-4 p-3 shadow-lg"><div class="d-flex align-items-center gap-3"><span class="fs-1">${ach.icon}</span><div><p class="fw-bold text-accent mb-0">Достижение разблокировано!</p><p class="fw-bold mb-0">${ach.name}</p><small class="text-muted">${ach.desc}</small></div></div></div>`;
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
  let progress = 100;
  let xpProgress = '';
  if (nextLevel) { const xpInLevel = xp - level.xpRequired; const xpNeeded = nextLevel.xpRequired - level.xpRequired; progress = Math.max(0, Math.floor((xpInLevel / xpNeeded) * 100)); xpProgress = `${xpInLevel} / ${xpNeeded} XP`; }
  else { xpProgress = `${xp} XP (макс.)`; }

  screen.innerHTML = `
    <div class="row justify-content-center"><div class="col-lg-6">
      <div class="text-center mb-4"><h2 class="fw-bold font-display mb-2">🏆 ${t('achievementsTitle')}</h2><p class="text-muted">${t('unlocked')}: ${unlockedAchievements.length} ${t('of')} ${ACHIEVEMENTS.length}</p></div>
      <div class="bg-card rounded-4 p-4 mb-4">
        <h5 class="fw-bold mb-3">🎮 ${t('playerProgress')}</h5>
        <div class="d-flex align-items-center gap-2 mb-2"><span class="fs-4">${level.icon}</span><span class="fw-bold" style="color:${level.color}">${level.name}</span><small class="text-muted ms-2">${t('level')} ${level.level}</small></div>
        <div class="progress" style="height:6px;"><div class="progress-bar" style="width:${progress}%;background:${level.color};"></div></div>
        <small class="text-muted">${xpProgress}</small>
        <div class="row g-2 mt-3">
          <div class="col-4"><div class="bg-card-hover rounded-3 p-2 text-center"><p class="fw-bold text-accent mb-0">${quizStats?.totalQuizzes || 0}</p><small class="text-muted">${t('quizzes')}</small></div></div>
          <div class="col-4"><div class="bg-card-hover rounded-3 p-2 text-center"><p class="fw-bold text-warning mb-0">${quizStats?.dayStreak || 0} ${t('streak').toLowerCase()}</p><small class="text-muted">${t('streak')}</small></div></div>
          <div class="col-4"><div class="bg-card-hover rounded-3 p-2 text-center"><p class="fw-bold text-success mb-0">${quizStats?.bestScore || 0}</p><small class="text-muted">${t('record')}</small></div></div>
        </div>
      </div>
      ${typeof renderQuestsHTML === 'function' ? renderQuestsHTML('daily') : ''}
      ${typeof renderQuestsHTML === 'function' ? renderQuestsHTML('weekly') : ''}
      ${typeof renderQuestsHTML === 'function' ? renderQuestsHTML('monthly') : ''}
      <h5 class="fw-bold mb-3 mt-4">🏆 ${t('allAchievements')} (${unlockedAchievements.length}/${ACHIEVEMENTS.length})</h5>
      <div class="d-grid gap-2">
        ${ACHIEVEMENTS.map(ach => {
          const unlocked = unlockedAchievements.includes(ach.id);
          return `<div class="d-flex align-items-center gap-3 p-3 rounded-4 ${unlocked ? 'bg-card' : 'bg-card opacity-50'}"><span class="fs-2 ${unlocked ? '' : 'grayscale'}">${ach.icon}</span><div class="flex-grow-1"><p class="fw-bold mb-0 ${unlocked ? 'text-accent' : 'text-muted'}">${ach.name}</p><small class="text-muted">${ach.desc}</small></div><span class="fs-4">${unlocked ? '✅' : '🔒'}</span></div>`;
        }).join('')}
      </div>
      <div class="text-center mt-4"><button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')"><i class="bi bi-play-fill me-2"></i>${t('startQuiz')}</button></div>
    </div></div>`;
}

function renderAchievementsList() { renderAchievementsScreen(); }

document.addEventListener('DOMContentLoaded', () => {
  console.log(`Достижения: ${unlockedAchievements.length} из ${ACHIEVEMENTS.length}`);
});