// ============================================
// QuizHub — Система достижений v2.0
// ============================================

// ========== ДОСТИЖЕНИЯ ==========

const ACHIEVEMENTS = [
  // Базовые
  { id: 'first_blood', name: 'Первый шаг', desc: 'Пройти первый квиз', icon: '🎯', condition: (stats) => stats.totalQuizzes >= 1 },
  { id: 'speed_demon', name: 'Молниеносный', desc: 'Ответить за <3 секунд', icon: '⚡', condition: (stats) => stats.fastestAnswer < 3 },
  { id: 'streak_5', name: 'В ударе', desc: '5 правильных подряд', icon: '🔥', condition: (stats) => stats.maxStreak >= 5 },
  { id: 'streak_10', name: 'Неудержимый', desc: '10 правильных подряд', icon: '💥', condition: (stats) => stats.maxStreak >= 10 },
  { id: 'perfect_10', name: 'Перфекционист', desc: 'Все 10 правильных', icon: '💯', condition: (stats) => stats.correctAnswers === 10 },
  { id: 'centurion', name: 'Центурион', desc: 'Набрать 100+ очков', icon: '💎', condition: (stats) => stats.bestScore >= 100 },
  { id: 'score_150', name: 'Гроссмейстер', desc: 'Набрать 150+ очков', icon: '👑', condition: (stats) => stats.bestScore >= 150 },
  
  // Языковые
  { id: 'polyglot', name: 'Полиглот', desc: 'Пройти на обоих языках', icon: '🌍', condition: (stats) => stats.languagesUsed >= 2 },
  
  // Режимные
  { id: 'night_owl', name: 'Полуночник', desc: 'Пройти квиз после 00:00', icon: '🦉', condition: () => { const h = new Date().getHours(); return h >= 0 && h < 6; } },
  { id: 'early_bird', name: 'Ранняя пташка', desc: 'Пройти квиз до 7 утра', icon: '🌅', condition: () => { const h = new Date().getHours(); return h >= 6 && h < 7; } },
  { id: 'marathon', name: 'Марафонец', desc: 'Пройти 5 квизов за день', icon: '🏃', condition: (stats) => stats.quizzesToday >= 5 },
  
  // Сложность
  { id: 'hard_mode', name: 'Хардкор', desc: 'Пройти квиз на сложном', icon: '💀', condition: (stats) => stats.hardCompleted >= 1 },
  { id: 'all_difficulties', name: 'Универсал', desc: 'Пройти на всех сложностях', icon: '🌈', condition: (stats) => stats.difficultiesCompleted >= 3 },
  
  // Серии
  { id: 'streak_3_days', name: 'Постоянство', desc: 'Заходить 3 дня подряд', icon: '📅', condition: (stats) => stats.dayStreak >= 3 },
  { id: 'streak_7_days', name: 'Дисциплина', desc: 'Заходить 7 дней подряд', icon: '🗓️', condition: (stats) => stats.dayStreak >= 7 },
  
  // Суммарные
  { id: 'quiz_10', name: 'Любитель', desc: 'Пройти 10 квизов', icon: '📚', condition: (stats) => stats.totalQuizzes >= 10 },
  { id: 'quiz_50', name: 'Эксперт', desc: 'Пройти 50 квизов', icon: '🎓', condition: (stats) => stats.totalQuizzes >= 50 },
  { id: 'quiz_100', name: 'Легенда', desc: 'Пройти 100 квизов', icon: '🏆', condition: (stats) => stats.totalQuizzes >= 100 },
  
  // Секретные
  { id: 'comeback', name: 'Камбэк', desc: 'Улучшить результат после неудачи', icon: '🔄', condition: (stats) => stats.improved === true },
  { id: 'speedrun', name: 'Спидран', desc: 'Пройти квиз быстрее 60 секунд', icon: '⏱️', condition: (stats) => stats.fastestQuiz < 60 },
];

// ========== УРОВНИ ИГРОКА ==========

const LEVELS = [
  { level: 1, name: 'Новичок', xpRequired: 0, icon: '🌱', color: '#00E676' },
  { level: 2, name: 'Любитель', xpRequired: 100, icon: '🌿', color: '#40C4FF' },
  { level: 3, name: 'Знаток', xpRequired: 300, icon: '📖', color: '#FFD740' },
  { level: 4, name: 'Эксперт', xpRequired: 600, icon: '🎯', color: '#FF6B9D' },
  { level: 5, name: 'Мастер', xpRequired: 1000, icon: '⚔️', color: '#7B2FBE' },
  { level: 6, name: 'Грандмастер', xpRequired: 1500, icon: '👑', color: '#FFD700' },
  { level: 7, name: 'Легенда', xpRequired: 2500, icon: '🌟', color: '#FF5252' },
];

// ========== ЕЖЕДНЕВНЫЕ ЗАДАНИЯ ==========

const DAILY_QUESTS_POOL = [
  { id: 'dq_score_50', name: 'Набрать 50+ очков', desc: 'Заработай 50+ очков за один квиз', target: 1, type: 'score_50', reward: 30, icon: '🎯' },
  { id: 'dq_score_100', name: 'Сотка', desc: 'Набрать 100+ очков за один квиз', target: 1, type: 'score_100', reward: 50, icon: '💯' },
  { id: 'dq_3_quizzes', name: 'Квиз-машина', desc: 'Пройти 3 квиза сегодня', target: 3, type: 'quizzes_today', reward: 40, icon: '🔄' },
  { id: 'dq_perfect', name: 'Идеальный раунд', desc: 'Ответить правильно на все вопросы', target: 1, type: 'perfect', reward: 60, icon: '⭐' },
  { id: 'dq_hard', name: 'Тяжело в учении', desc: 'Пройти квиз на сложном уровне', target: 1, type: 'hard_quiz', reward: 45, icon: '💀' },
  { id: 'dq_streak', name: 'Полоса удачи', desc: 'Достигнуть серии из 5 правильных', target: 1, type: 'streak_5', reward: 35, icon: '🔥' },
  { id: 'dq_english', name: 'English, please', desc: 'Пройти квиз на английском', target: 1, type: 'english', reward: 40, icon: '🇬🇧' },
  { id: 'dq_fast', name: 'Быстрые пальцы', desc: 'Ответить на вопрос быстрее 3 секунд', target: 3, type: 'fast_answers', reward: 35, icon: '⚡' },
];

// ========== СОСТОЯНИЕ ==========

let unlockedAchievements = JSON.parse(localStorage.getItem('quizhub-achievements') || '[]');
let quizStats = JSON.parse(localStorage.getItem('quizhub-stats') || JSON.stringify({
  quizzesToday: 0,
  lastQuizDate: '',
  languagesUsed: [],
  bestScore: 0,
  fastestAnswer: 999,
  fastestQuiz: 9999,
  maxStreak: 0,
  improved: false,
  totalQuizzes: 0,
  totalXP: 0,
  hardCompleted: 0,
  difficultiesCompleted: [],
  dayStreak: 0,
  lastActiveDate: '',
  fastAnswersCount: 0
}));

let dailyQuests = JSON.parse(localStorage.getItem('quizhub-daily-quests') || '[]');
let dailyQuestDate = localStorage.getItem('quizhub-daily-date') || '';
let dailyQuestProgress = JSON.parse(localStorage.getItem('quizhub-daily-progress') || '{}');

// ========== ГЕНЕРАЦИЯ ЕЖЕДНЕВНЫХ ЗАДАНИЙ ==========

function generateDailyQuests() {
  const today = new Date().toISOString().split('T')[0];
  
  if (dailyQuestDate === today && dailyQuests.length > 0) {
    return dailyQuests;
  }
  
  const shuffled = [...DAILY_QUESTS_POOL].sort(() => Math.random() - 0.5);
  dailyQuests = shuffled.slice(0, 3);
  dailyQuestDate = today;
  dailyQuestProgress = {};
  
  dailyQuests.forEach(q => {
    dailyQuestProgress[q.id] = 0;
  });
  
  localStorage.setItem('quizhub-daily-quests', JSON.stringify(dailyQuests));
  localStorage.setItem('quizhub-daily-date', dailyQuestDate);
  localStorage.setItem('quizhub-daily-progress', JSON.stringify(dailyQuestProgress));
  
  return dailyQuests;
}

// ========== СИСТЕМА XP И УРОВНЕЙ ==========

function addXP(amount) {
  quizStats.totalXP = (quizStats.totalXP || 0) + amount;
  localStorage.setItem('quizhub-stats', JSON.stringify(quizStats));
}

function getCurrentLevel() {
  const xp = quizStats.totalXP || 0;
  let currentLevel = LEVELS[0];
  
  for (const level of LEVELS) {
    if (xp >= level.xpRequired) {
      currentLevel = level;
    }
  }
  
  return currentLevel;
}

function getNextLevel() {
  const current = getCurrentLevel();
  const currentIndex = LEVELS.findIndex(l => l.level === current.level);
  return LEVELS[currentIndex + 1] || null;
}

// ========== ОБНОВЛЕНИЕ СТАТИСТИКИ ==========

function updateStats(result) {
  const today = new Date().toISOString().split('T')[0];
  
  if (quizStats.lastQuizDate !== today) {
    quizStats.quizzesToday = 0;
    quizStats.lastQuizDate = today;
    quizStats.fastAnswersCount = 0;
  }
  
  quizStats.quizzesToday++;
  quizStats.totalQuizzes = (quizStats.totalQuizzes || 0) + 1;
  quizStats.correctAnswers = result.correctAnswers;
  
  if (!quizStats.languagesUsed) quizStats.languagesUsed = [];
  if (!quizStats.languagesUsed.includes(selectedLanguage)) {
    quizStats.languagesUsed.push(selectedLanguage);
  }
  
  if (!quizStats.difficultiesCompleted) quizStats.difficultiesCompleted = [];
  if (!quizStats.difficultiesCompleted.includes(selectedDifficulty)) {
    quizStats.difficultiesCompleted.push(selectedDifficulty);
  }
  
  if (result.score > quizStats.bestScore && quizStats.bestScore > 0) {
    quizStats.improved = true;
  } else {
    quizStats.improved = false;
  }
  
  if (result.score > quizStats.bestScore) {
    quizStats.bestScore = result.score;
  }
  
  if (result.totalTime < quizStats.fastestQuiz) {
    quizStats.fastestQuiz = result.totalTime;
  }
  
  if (selectedDifficulty === 'hard') {
    quizStats.hardCompleted = (quizStats.hardCompleted || 0) + 1;
  }
  
  const xpEarned = calculateQuizXP(result);
  addXP(xpEarned);
  
  localStorage.setItem('quizhub-stats', JSON.stringify(quizStats));
}

function calculateQuizXP(result) {
  let xp = 10;
  xp += Math.floor(result.score / 10);
  const diffBonus = { easy: 0, medium: 5, hard: 15 };
  xp += diffBonus[selectedDifficulty] || 0;
  if (result.correctAnswers === 10) xp += 20;
  else if (result.correctAnswers >= 7) xp += 10;
  return xp;
}

// ========== ПРОВЕРКА ДОСТИЖЕНИЙ ==========

function checkAchievements(result) {
  const stats = {
    fastestAnswer: quizStats.fastestAnswer || 999,
    fastestQuiz: quizStats.fastestQuiz || 9999,
    maxStreak: quizStats.maxStreak || 0,
    correctAnswers: result.correctAnswers,
    languagesUsed: (quizStats.languagesUsed || []).length,
    improved: quizStats.improved || false,
    quizzesToday: quizStats.quizzesToday || 0,
    totalQuizzes: quizStats.totalQuizzes || 0,
    bestScore: quizStats.bestScore || 0,
    hardCompleted: quizStats.hardCompleted || 0,
    difficultiesCompleted: (quizStats.difficultiesCompleted || []).length,
    dayStreak: quizStats.dayStreak || 0,
  };
  
  const newAchievements = [];
  
  ACHIEVEMENTS.forEach(ach => {
    if (!unlockedAchievements.includes(ach.id) && ach.condition(stats)) {
      unlockedAchievements.push(ach.id);
      newAchievements.push(ach);
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
              <p class="fw-bold text-accent mb-0">Достижение разблокировано!</p>
              <p class="fw-bold mb-0">${ach.name}</p>
              <small class="text-muted">${ach.desc}</small>
            </div>
          </div>
        </div>
      `;
      container.style.display = 'block';
      
      if (typeof playCorrectSound === 'function') playCorrectSound();
      
      setTimeout(() => {
        container.style.display = 'none';
      }, 3000);
    }, i * 3500);
  });
}

// ========== РЕНДЕРИНГ ЭКРАНА АЧИВОК ==========

function renderAchievementsScreen() {
  const screen = document.getElementById('screen-achievements');
  if (!screen) {
    console.warn('Экран ачивок не найден');
    return;
  }
  
  const level = getCurrentLevel();
  const nextLevel = getNextLevel();
  const xp = quizStats.totalXP || 0;
  
  let progress = 100;
  let xpProgress = '';
  
  if (nextLevel) {
    const xpInLevel = xp - level.xpRequired;
    const xpNeeded = nextLevel.xpRequired - level.xpRequired;
    progress = Math.max(0, Math.floor((xpInLevel / xpNeeded) * 100));
    xpProgress = `${xpInLevel} / ${xpNeeded} XP`;
  } else {
    xpProgress = `${xp} XP (макс.)`;
  }
  
  // Генерируем ежедневные задания если нужно
  generateDailyQuests();
  
  // HTML для ежедневных заданий
  let dailyHTML = '';
  if (dailyQuests && dailyQuests.length > 0) {
    dailyHTML = `
      <div class="bg-card rounded-4 p-4 mb-4">
        <h5 class="fw-bold mb-3">📋 Ежедневные задания</h5>
        <div class="d-grid gap-2">
          ${dailyQuests.map(q => {
            const progressVal = dailyQuestProgress?.[q.id] || 0;
            const done = dailyQuestProgress?.[q.id + '_done'] || false;
            const pct = Math.min((progressVal / q.target) * 100, 100);
            return `
              <div class="d-flex align-items-center gap-3 p-2 rounded-3 ${done ? 'bg-success bg-opacity-10' : ''}">
                <span class="fs-4">${q.icon}</span>
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between">
                    <span class="fw-semibold ${done ? 'text-success' : ''}">${q.name}</span>
                    <small class="text-muted">+${q.reward} XP</small>
                  </div>
                  <div class="progress mt-1" style="height: 4px;">
                    <div class="progress-bar ${done ? 'bg-success' : 'bg-accent'}" style="width: ${pct}%;"></div>
                  </div>
                  <small class="text-muted">${progressVal}/${q.target} • ${q.desc}</small>
                </div>
                ${done ? '<span class="fs-5">✅</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  // HTML для списка достижений
  const achievementsHTML = ACHIEVEMENTS.map(ach => {
    const unlocked = unlockedAchievements.includes(ach.id);
    return `
      <div class="d-flex align-items-center gap-3 p-3 rounded-4 ${unlocked ? 'bg-card' : 'bg-card opacity-50'}">
        <span class="fs-2 ${unlocked ? '' : 'grayscale'}">${ach.icon}</span>
        <div class="flex-grow-1">
          <p class="fw-bold mb-0 ${unlocked ? 'text-accent' : 'text-muted'}">${ach.name}</p>
          <small class="text-muted">${ach.desc}</small>
        </div>
        <span class="fs-4">${unlocked ? '✅' : '🔒'}</span>
      </div>
    `;
  }).join('');
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-6">
        
        <div class="text-center mb-4">
          <h2 class="fw-bold font-display mb-2">🏆 Достижения</h2>
          <p class="text-muted">Разблокировано: <span id="ach-count">${unlockedAchievements.length}</span> из <span id="ach-total">${ACHIEVEMENTS.length}</span></p>
        </div>
        
        <!-- Карточка уровня -->
        <div class="bg-card rounded-4 p-4 mb-4">
          <h5 class="fw-bold mb-3">🎮 Прогресс игрока</h5>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="fs-4">${level.icon}</span>
            <div>
              <span class="fw-bold" style="color: ${level.color}">${level.name}</span>
              <small class="text-muted ms-2">Ур. ${level.level}</small>
            </div>
          </div>
          <div class="progress" style="height: 6px;">
            <div class="progress-bar" style="width: ${progress}%; background: ${level.color};"></div>
          </div>
          <small class="text-muted">${xpProgress}</small>
          
          <div class="row g-2 mt-3">
            <div class="col-4">
              <div class="bg-card-hover rounded-3 p-2 text-center">
                <p class="fw-bold text-accent mb-0">${quizStats.totalQuizzes || 0}</p>
                <small class="text-muted">Квизов</small>
              </div>
            </div>
            <div class="col-4">
              <div class="bg-card-hover rounded-3 p-2 text-center">
                <p class="fw-bold text-warning mb-0">${quizStats.dayStreak || 0} дн.</p>
                <small class="text-muted">Серия</small>
              </div>
            </div>
            <div class="col-4">
              <div class="bg-card-hover rounded-3 p-2 text-center">
                <p class="fw-bold text-success mb-0">${quizStats.bestScore || 0}</p>
                <small class="text-muted">Рекорд</small>
              </div>
            </div>
          </div>
        </div>
        
        ${dailyHTML}
        
        <h5 class="fw-bold mb-3 mt-4">🏆 Все достижения (${unlockedAchievements.length}/${ACHIEVEMENTS.length})</h5>
        <div class="d-grid gap-2">
          ${achievementsHTML}
        </div>
        
        <div class="text-center mt-4">
          <button type="button" class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">
            <i class="bi bi-play-fill me-2"></i>Пройти квиз
          </button>
        </div>
        
      </div>
    </div>
  `;
}

function renderAchievementsList() {
  renderAchievementsScreen();
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  generateDailyQuests();
  console.log('Достижения загружены:', unlockedAchievements.length, 'из', ACHIEVEMENTS.length);
});