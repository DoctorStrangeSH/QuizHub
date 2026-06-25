// ============================================
// QuizHub — Управление экранами и UI v2.0
// ============================================

let selectedDifficulty = 'easy';
let selectedLanguage = 'ru';

document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  setupDifficultyButtons();
  setupStartButton();
  setupMobileMenu();
  initTheme();
  
  // Восстановление сохранённого языка
  const savedLang = localStorage.getItem('quizhub-language');
  if (savedLang) {
    selectedLanguage = savedLang;
    document.querySelectorAll('.btn-language').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === savedLang);
    });
  }
  
  // Пульсация логотипа
  const logo = document.querySelector('.logo');
  if (logo) logo.classList.add('logo-pulse');
});

// ========== ТЕМА ==========

function initTheme() {
  const savedTheme = localStorage.getItem('quizhub-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.classList.toggle('light', savedTheme === 'light');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('quizhub-theme', next);
  
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.classList.toggle('light', next === 'light');
  }
  
  // Обновляем графики если они есть
  if (typeof renderScoreChart === 'function') renderScoreChart();
  if (typeof renderWeeklyChart === 'function') renderWeeklyChart();
}

// ========== МОБИЛЬНОЕ МЕНЮ ==========

function setupMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('header-actions');
  
  if (!toggle || !menu) return;
  
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('show');
    
    const icon = toggle.querySelector('i');
    if (menu.classList.contains('show')) {
      icon.className = 'bi bi-x-lg';
    } else {
      icon.className = 'bi bi-list';
    }
  });
  
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== toggle) {
      menu.classList.remove('show');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'bi bi-list';
    }
  });
  
  const originalShowScreen = showScreen;
  showScreen = function(screenName) {
    menu.classList.remove('show');
    const icon = toggle.querySelector('i');
    if (icon) icon.className = 'bi bi-list';
    originalShowScreen(screenName);
  };
}

// ========== ЧАСТИЦЫ ФОНА ==========

function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  
  const isMobile = window.innerWidth < 768;
  const particleCount = isMobile ? 15 : 30;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
    const delay = Math.random() * 6;
    const duration = Math.random() * 4 + 4;
    
    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      bottom: -20px;
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
    `;
    
    container.appendChild(particle);
  }
}

// ========== НАВИГАЦИЯ ==========

function showScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(`screen-${screenName}`);
  if (screen) {
    screen.classList.add('active');
    screen.style.animation = 'none';
    screen.offsetHeight;
    screen.style.animation = 'screenFadeIn 0.5s ease';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Рендерим содержимое экранов
  if (screenName === 'achievements') {
    // Используем функцию из achievements.js
    if (typeof renderAchievementsScreen === 'function') {
      renderAchievementsScreen();
    } else {
      // Fallback: рендерим базовую структуру
      const screen = document.getElementById('screen-achievements');
      if (screen) {
        screen.innerHTML = `
          <div class="row justify-content-center">
            <div class="col-lg-6">
              <div class="text-center mb-4">
                <h2 class="fw-bold font-display mb-2">🏆 Мои достижения</h2>
                <p class="text-muted">Разблокировано: <span id="ach-count">${unlockedAchievements?.length || 0}</span> из <span id="ach-total">${ACHIEVEMENTS?.length || 20}</span></p>
              </div>
              <div class="d-grid gap-2" id="achievements-list">
                <p class="text-muted text-center py-4">Загрузка достижений...</p>
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
    }
  }
  
  if (screenName === 'leaderboard') {
    loadLeaderboard();
  }
  
  if (screenName === 'stats') {
    if (typeof renderStatsScreen === 'function') {
      renderStatsScreen();
      setTimeout(() => {
        if (typeof renderScoreChart === 'function') renderScoreChart();
        if (typeof renderWeeklyChart === 'function') renderWeeklyChart();
      }, 300);
    }
  }
}

// ========== КНОПКИ СЛОЖНОСТИ И ЯЗЫКА ==========

function setupDifficultyButtons() {
  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-difficulty').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedDifficulty = this.dataset.difficulty;
    });
  });
  
  document.querySelectorAll('.btn-language').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-language').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedLanguage = this.dataset.lang;
      localStorage.setItem('quizhub-language', selectedLanguage);
    });
  });
}

// ========== КНОПКА СТАРТА ==========

function setupStartButton() {
  const startBtn = document.getElementById('start-quiz');
  if (!startBtn) return;
  
  startBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim();
    
    if (!name) {
      nameInput.focus();
      nameInput.style.borderColor = 'var(--danger)';
      showToast('Введи своё имя перед стартом!', 'warning');
      
      if (window.innerWidth < 768) {
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      setTimeout(() => { nameInput.style.borderColor = ''; }, 2000);
      return;
    }
    
    if (document.activeElement) {
      document.activeElement.blur();
    }
    
    // Сбрасываем режимы
    timedMode = false;
    QUIZ_SETTINGS.totalQuestions = 10;
    QUIZ_SETTINGS.timePerQuestion = 15;
    
    startQuiz();
  });
  
  const nameInput = document.getElementById('player-name');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      nameInput.dataset.manual = 'true';
    });
  }
}

// ========== ТАБЛИЦА ЛИДЕРОВ (с фильтром по сложности) ==========

let leaderboardUnsubscribe = null;
let currentLeaderboardDifficulty = 'easy';

async function loadLeaderboard(difficulty = 'easy') {
  const screen = document.getElementById('screen-leaderboard');
  if (!screen) return;
  
  currentLeaderboardDifficulty = difficulty;
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-8 text-center py-5">
        <div class="spinner-border text-accent mb-3" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
        <p class="text-muted">Загружаем таблицу лидеров...</p>
      </div>
    </div>
  `;
  
  if (leaderboardUnsubscribe) leaderboardUnsubscribe();
  
  leaderboardUnsubscribe = onLeaderboardUpdate(leaders => {
    renderLeaderboardScreen(leaders, difficulty);
  }, difficulty, 20);
}

function renderLeaderboardScreen(leaders, difficulty) {
  const screen = document.getElementById('screen-leaderboard');
  if (!screen || !screen.classList.contains('active')) return;
  
  const difficultyLabels = {
    'easy': '🟢 Лёгкий',
    'medium': '🟡 Средний',
    'hard': '🔴 Сложный'
  };
  
  if (leaders.length === 0) {
    screen.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-lg-6 text-center py-5">
          <i class="bi bi-trophy fs-1 text-muted d-block mb-3"></i>
          <h3 class="fw-bold mb-2">Пока никого нет</h3>
          <p class="text-muted mb-4">Стань первым в таблице лидеров!</p>
          <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">
            <i class="bi bi-play-fill me-2"></i>Пройти квиз
          </button>
        </div>
      </div>
    `;
    return;
  }
  
  const medals = ['🥇', '🥈', '🥉'];
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-8">
        
        <div class="text-center mb-4">
          <h2 class="fw-bold font-display mb-2">🏆 Таблица лидеров</h2>
          <p class="text-muted">Лучшие из лучших <span class="live-dot"></span></p>
        </div>
        
        <!-- Табы сложности -->
        <div class="d-flex gap-2 justify-content-center mb-4">
          <button class="btn btn-difficulty rounded-pill px-4 ${currentLeaderboardDifficulty === 'easy' ? 'active' : ''}" 
                  onclick="switchLeaderboardDifficulty('easy')">
            🟢 Лёгкий
          </button>
          <button class="btn btn-difficulty rounded-pill px-4 ${currentLeaderboardDifficulty === 'medium' ? 'active' : ''}" 
                  onclick="switchLeaderboardDifficulty('medium')">
            🟡 Средний
          </button>
          <button class="btn btn-difficulty rounded-pill px-4 ${currentLeaderboardDifficulty === 'hard' ? 'active' : ''}" 
                  onclick="switchLeaderboardDifficulty('hard')">
            🔴 Сложный
          </button>
        </div>
        
        <!-- Топ-3 -->
        <div class="row g-3 mb-4">
          ${leaders.slice(0, 3).map((leader, i) => `
            <div class="col-md-4">
              <div class="bg-card rounded-4 p-4 text-center leader-card leader-top-${i + 1}">
                <div class="leader-avatar mx-auto mb-2">
                  ${leader.photoURL 
                    ? `<img src="${leader.photoURL}" alt="${leader.playerName}" class="rounded-circle" width="60" height="60" style="border: 3px solid var(--accent); object-fit: cover;">`
                    : `<div class="bg-accent bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mx-auto" style="width: 60px; height: 60px; border: 3px solid var(--accent);">
                        <span class="fw-bold text-accent fs-5">${leader.playerName.charAt(0).toUpperCase()}</span>
                      </div>`
                  }
                </div>
                <span class="fs-1">${medals[i]}</span>
                <h5 class="fw-bold mb-1 text-truncate">${leader.playerName}</h5>
                <p class="text-accent fw-bold fs-4 mb-1">${leader.score}</p>
                <small class="text-muted">${formatTime(leader.totalTime)}</small>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Полная таблица -->
        <div class="bg-card rounded-4 overflow-hidden">
          <div class="leaderboard-table-wrapper">
            <table class="table table-dark table-hover mb-0">
              <thead>
                <tr>
                  <th class="ps-3">#</th>
                  <th>Игрок</th>
                  <th>Очки</th>
                  <th>Время</th>
                  <th>Категория</th>
                  <th class="text-end pe-3">Дата</th>
                </tr>
              </thead>
              <tbody>
                ${leaders.map((leader, i) => {
                  const date = leader.date ? new Date(leader.date.seconds * 1000) : new Date();
                  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                  
                  return `
                  <tr class="${currentUser && leader.userId === currentUser.uid ? 'table-active-row' : ''}">
                    <td class="ps-3 fw-bold">${i < 3 ? medals[i] : i + 1}</td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        ${leader.photoURL 
                          ? `<img src="${leader.photoURL}" width="28" height="28" class="rounded-circle flex-shrink-0" style="object-fit: cover;">`
                          : `<div class="bg-accent bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 28px; height: 28px;">
                              <small class="text-accent fw-bold">${leader.playerName.charAt(0)}</small></div>`
                        }
                        <span class="fw-semibold text-truncate" style="max-width: 100px;">${leader.playerName}</span>
                        ${currentUser && leader.userId === currentUser.uid ? '<small class="text-accent">(вы)</small>' : ''}
                      </div>
                    </td>
                    <td class="fw-bold">${leader.score}</td>
                    <td class="text-muted">${formatTime(leader.totalTime)}</td>
                    <td><span class="badge bg-accent bg-opacity-25 text-accent rounded-pill">${leader.category || 'Любая'}</span></td>
                    <td class="text-end pe-3"><small class="text-muted">${dateStr}</small></td>
                  </tr>
                `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="text-center mt-4">
          <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">
            <i class="bi bi-play-fill me-2"></i>Пройти квиз
          </button>
        </div>
        
      </div>
    </div>
  `;
}

function switchLeaderboardDifficulty(difficulty) {
  currentLeaderboardDifficulty = difficulty;
  loadLeaderboard(difficulty);
}

// ========== ЭКРАН АЧИВОК ==========

function renderAchievementsScreen() {
  const screen = document.getElementById('screen-achievements');
  if (!screen) return;
  
  const level = typeof getCurrentLevel === 'function' ? getCurrentLevel() : { level: 1, name: 'Новичок', icon: '🌱', color: '#00E676' };
  const nextLevel = typeof getNextLevel === 'function' ? getNextLevel() : null;
  const xp = quizStats?.totalXP || 0;
  
  let progress = 100;
  let xpProgress = '';
  
  if (nextLevel) {
    const xpInLevel = xp - level.xpRequired;
    const xpNeeded = nextLevel.xpRequired - level.xpRequired;
    progress = Math.floor((xpInLevel / xpNeeded) * 100);
    xpProgress = `${xpInLevel} / ${xpNeeded} XP`;
  } else {
    xpProgress = `${xp} XP (макс.)`;
  }
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-6">
        
        <div class="text-center mb-4">
          <h2 class="fw-bold font-display mb-2">🏆 Достижения</h2>
          <p class="text-muted">Разблокировано: <span id="ach-count">${unlockedAchievements?.length || 0}</span> из <span id="ach-total">${ACHIEVEMENTS?.length || 0}</span></p>
        </div>
        
        <!-- Карточка уровня -->
        <div class="bg-card rounded-4 p-4 mb-4">
          <h5 class="fw-bold mb-3">🎮 Прогресс игрока</h5>
          <div id="player-level">
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
          </div>
          <div class="row g-2 mt-3">
            <div class="col-4">
              <div class="bg-card-hover rounded-3 p-2 text-center">
                <p class="fw-bold text-accent mb-0">${quizStats?.totalQuizzes || 0}</p>
                <small class="text-muted">Квизов</small>
              </div>
            </div>
            <div class="col-4">
              <div class="bg-card-hover rounded-3 p-2 text-center">
                <p class="fw-bold text-warning mb-0">${quizStats?.dayStreak || 0} дн.</p>
                <small class="text-muted">Серия</small>
              </div>
            </div>
            <div class="col-4">
              <div class="bg-card-hover rounded-3 p-2 text-center">
                <p class="fw-bold text-success mb-0">${quizStats?.bestScore || 0}</p>
                <small class="text-muted">Рекорд</small>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Ежедневные задания -->
        ${typeof getDailyQuestsHTML === 'function' ? getDailyQuestsHTML() : ''}
        
        <!-- Все достижения -->
        <h5 class="fw-bold mb-3 mt-4">🏆 Все достижения</h5>
        <div class="d-grid gap-2" id="achievements-list">
          ${ACHIEVEMENTS ? ACHIEVEMENTS.map(ach => {
            const unlocked = unlockedAchievements?.includes(ach.id);
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
          }).join('') : '<p class="text-muted text-center">Загрузка...</p>'}
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

function getDailyQuestsHTML() {
  if (typeof dailyQuestDate === 'undefined' || typeof dailyQuests === 'undefined') return '';
  
  const today = new Date().toISOString().split('T')[0];
  if (dailyQuestDate !== today && typeof generateDailyQuests === 'function') generateDailyQuests();
  
  if (!dailyQuests || dailyQuests.length === 0) return '';
  
  return `
    <div class="bg-card rounded-4 p-4 mb-4">
      <h5 class="fw-bold mb-3">📋 Ежедневные задания</h5>
      <div class="d-grid gap-2">
        ${dailyQuests.map(q => {
          const progress = dailyQuestProgress?.[q.id] || 0;
          const done = dailyQuestProgress?.[q.id + '_done'] || false;
          const pct = Math.min((progress / q.target) * 100, 100);
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
                <small class="text-muted">${progress}/${q.target} • ${q.desc}</small>
              </div>
              ${done ? '<span class="fs-5">✅</span>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ========== ТОСТ-УВЕДОМЛЕНИЯ ==========

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  const colors = {
    success: 'bg-success text-white',
    danger: 'bg-danger text-white',
    info: 'bg-accent',
    warning: 'bg-warning text-dark'
  };
  
  const icons = {
    success: 'check-circle-fill',
    danger: 'x-circle-fill',
    info: 'info-circle-fill',
    warning: 'exclamation-triangle-fill'
  };
  
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center border-0 shadow-lg ${colors[type] || colors.info}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi bi-${icons[type] || icons.info}"></i><span>${message}</span>
      </div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Закрыть"></button>
    </div>
  `;
  
  container.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// ========== КОНФЕТТИ (заглушка, основная в animations.js) ==========

function spawnConfetti() {
  if (typeof spawnConfettiAdvanced === 'function') {
    spawnConfettiAdvanced(80);
  }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getDifficultyLabel(difficulty) {
  const labels = { easy: '🟢 Легко', medium: '🟡 Средне', hard: '🔴 Сложно' };
  return labels[difficulty] || difficulty;
}

function getGrade(score) {
  if (score >= 90) return { title: 'Легенда!', message: 'Потрясающий результат,', icon: 'trophy-fill', color: 'grade-gold' };
  if (score >= 70) return { title: 'Отлично!', message: 'Ты настоящий знаток,', icon: 'star-fill', color: 'grade-silver' };
  if (score >= 50) return { title: 'Неплохо!', message: 'Хорошая попытка,', icon: 'hand-thumbs-up-fill', color: 'grade-bronze' };
  return { title: 'Попробуй ещё!', message: 'Не расстраивайся,', icon: 'emoji-smile-fill', color: 'grade-default' };
}