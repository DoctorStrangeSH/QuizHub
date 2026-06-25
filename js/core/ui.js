// ============================================
// QuizHub — Управление экранами и UI v3.0
// ============================================

let selectedDifficulty = 'easy';
let selectedLanguage = 'ru';
let isFirstLoad = true;

document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  setupDifficultyButtons();
  setupStartButton();
  setupMobileMenu();
  initTheme();
  restoreScreenFromHash();
  
  const savedLang = localStorage.getItem('quizhub-language');
  if (savedLang) {
    selectedLanguage = savedLang;
    document.querySelectorAll('.btn-language').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === savedLang);
    });
  }
  
  const logo = document.querySelector('.logo');
  if (logo) logo.classList.add('logo-pulse');
});

// ========== ТЕМА ==========

function initTheme() {
  const savedTheme = localStorage.getItem('quizhub-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const toggle = document.getElementById('theme-toggle-btn');
  if (toggle) toggle.classList.toggle('light', savedTheme === 'light');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('quizhub-theme', next);
  const toggle = document.getElementById('theme-toggle-btn');
  if (toggle) toggle.classList.toggle('light', next === 'light');
  setTimeout(() => {
    if (typeof renderScoreChart === 'function') renderScoreChart();
    if (typeof renderWeeklyChart === 'function') renderWeeklyChart();
  }, 500);
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
    icon.className = menu.classList.contains('show') ? 'bi bi-x-lg' : 'bi bi-list';
  });
  
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== toggle) {
      menu.classList.remove('show');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'bi bi-list';
    }
  });
}

// ========== ЧАСТИЦЫ ==========

function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const isMobile = window.innerWidth < 768;
  const particleCount = isMobile ? 10 : 25;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      width: ${Math.random() * 4 + 2}px; height: ${Math.random() * 4 + 2}px;
      left: ${Math.random() * 100}%; bottom: -20px;
      animation-delay: ${Math.random() * 6}s; animation-duration: ${Math.random() * 4 + 4}s;
    `;
    container.appendChild(particle);
  }
}

// ========== НАВИГАЦИЯ С СОХРАНЕНИЕМ В HASH ==========

function showScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(`screen-${screenName}`);
  if (screen) {
    screen.classList.add('active');
    
    if (isFirstLoad) {
      screen.classList.add('no-animation');
      isFirstLoad = false;
    } else {
      screen.style.animation = 'none';
      screen.offsetHeight;
      screen.style.animation = 'screenFadeIn 0.5s ease';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Сохраняем в hash
  if (history.pushState) {
    const url = new URL(window.location);
    url.hash = screenName;
    history.pushState({}, '', url);
  } else {
    window.location.hash = screenName;
  }
  
  // Рендерим экраны
  if (screenName === 'achievements' && typeof renderAchievementsScreen === 'function') {
    renderAchievementsScreen();
  }
  if (screenName === 'leaderboard') loadLeaderboard();
  if (screenName === 'stats' && typeof renderStatsScreen === 'function') {
    renderStatsScreen();
    setTimeout(() => {
      if (typeof renderScoreChart === 'function') renderScoreChart();
      if (typeof renderWeeklyChart === 'function') renderWeeklyChart();
    }, 300);
  }
}

function restoreScreenFromHash() {
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(`screen-${hash}`)) {
    setTimeout(() => showScreen(hash), 100);
  }
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(`screen-${hash}`)) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`screen-${hash}`);
    if (screen) {
      screen.classList.add('active');
      screen.style.animation = 'none';
      screen.offsetHeight;
      screen.style.animation = 'screenFadeIn 0.5s ease';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
});

// ========== КНОПКИ ==========

function setupDifficultyButtons() {
  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-difficulty').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedDifficulty = this.dataset.difficulty;
    });
  });
  
  document.querySelectorAll('.btn-language, .btn-locale').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.dataset.locale) {
        if (typeof setLocale === 'function') setLocale(this.dataset.locale);
      }
      if (this.dataset.lang) {
        document.querySelectorAll('.btn-language').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedLanguage = this.dataset.lang;
        localStorage.setItem('quizhub-language', selectedLanguage);
      }
    });
  });
}

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
      if (window.innerWidth < 768) nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { nameInput.style.borderColor = ''; }, 2000);
      return;
    }
    
    if (document.activeElement) document.activeElement.blur();
    
    if (typeof timedMode !== 'undefined') timedMode = false;
    if (typeof QUIZ_SETTINGS !== 'undefined') {
      QUIZ_SETTINGS.totalQuestions = 10;
      QUIZ_SETTINGS.timePerQuestion = 15;
    }
    
    if (typeof startQuiz === 'function') startQuiz();
  });
  
  const nameInput = document.getElementById('player-name');
  if (nameInput) {
    nameInput.addEventListener('input', () => { nameInput.dataset.manual = 'true'; });
  }
}

// ========== ЛИДЕРЫ ==========

let leaderboardUnsubscribe = null;
let currentLeaderboardDifficulty = 'easy';

async function loadLeaderboard(difficulty) {
  if (difficulty) currentLeaderboardDifficulty = difficulty;
  const screen = document.getElementById('screen-leaderboard');
  if (!screen) return;
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-8 text-center py-5">
        <div class="spinner-border text-accent mb-3" role="status"></div>
        <p class="text-muted">Загружаем таблицу лидеров...</p>
      </div>
    </div>`;
  
  if (leaderboardUnsubscribe) { leaderboardUnsubscribe(); leaderboardUnsubscribe = null; }
  
  if (typeof onLeaderboardUpdate === 'function') {
    leaderboardUnsubscribe = onLeaderboardUpdate((leaders) => {
      const currentScreen = document.getElementById('screen-leaderboard');
      if (currentScreen && currentScreen.classList.contains('active')) {
        renderLeaderboardScreen(leaders, currentLeaderboardDifficulty);
      }
    }, currentLeaderboardDifficulty, 20);
  }
}

function switchLeaderboardDifficulty(difficulty) {
  loadLeaderboard(difficulty);
}

function renderLeaderboardScreen(leaders, difficulty) {
  const screen = document.getElementById('screen-leaderboard');
  if (!screen || !screen.classList.contains('active')) return;
  
  const labels = { 'easy': '🟢 Лёгкий', 'medium': '🟡 Средний', 'hard': '🔴 Сложный' };
  
  if (!leaders || leaders.length === 0) {
    screen.innerHTML = `
      <div class="row justify-content-center"><div class="col-lg-6 text-center py-5">
        <i class="bi bi-trophy fs-1 text-muted d-block mb-3"></i>
        <h3 class="fw-bold mb-2">Пока никого нет</h3>
        <p class="text-muted mb-4">Стань первым на уровне «${labels[difficulty]}»!</p>
        <div class="d-flex gap-2 justify-content-center mb-4">
          ${['easy','medium','hard'].map(d => `
            <button class="btn btn-difficulty rounded-pill px-4 ${currentLeaderboardDifficulty===d?'active':''}" onclick="switchLeaderboardDifficulty('${d}')">${labels[d]}</button>
          `).join('')}
        </div>
        <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">Пройти квиз</button>
      </div></div>`;
    return;
  }
  
  const medals = ['🥇','🥈','🥉'];
  
  screen.innerHTML = `
    <div class="row justify-content-center"><div class="col-lg-8">
      <div class="text-center mb-4"><h2 class="fw-bold font-display mb-2">🏆 Таблица лидеров</h2><p class="text-muted">${labels[difficulty]} <span class="live-dot"></span></p></div>
      <div class="d-flex gap-2 justify-content-center mb-4">
        ${['easy','medium','hard'].map(d => `
          <button class="btn btn-difficulty rounded-pill px-4 ${currentLeaderboardDifficulty===d?'active':''}" onclick="switchLeaderboardDifficulty('${d}')">${labels[d]}</button>
        `).join('')}
      </div>
      <div class="row g-3 mb-4">
        ${leaders.slice(0,3).map((l,i) => `
          <div class="col-md-4"><div class="bg-card rounded-4 p-4 text-center leader-card leader-top-${i+1}">
            <span class="fs-1">${medals[i]}</span><h5 class="fw-bold mb-1 text-truncate">${l.playerName}</h5>
            <p class="text-accent fw-bold fs-4 mb-1">${l.score}</p><small class="text-muted">${formatTime(l.totalTime)}</small>
          </div></div>
        `).join('')}
      </div>
      <div class="bg-card rounded-4 overflow-hidden"><div class="leaderboard-table-wrapper">
        <table class="table table-dark table-hover mb-0"><thead><tr><th class="ps-3">#</th><th>Игрок</th><th>Очки</th><th>Время</th><th class="text-end pe-3">Дата</th></tr></thead><tbody>
          ${leaders.map((l,i) => {
            const d = l.date?.seconds ? new Date(l.date.seconds*1000) : new Date();
            return `<tr class="${typeof currentUser!=='undefined' && currentUser && l.userId===currentUser.uid?'table-active-row':''}">
              <td class="ps-3 fw-bold">${i<3?medals[i]:i+1}</td>
              <td><span class="fw-semibold">${l.playerName}</span>${typeof currentUser!=='undefined' && currentUser && l.userId===currentUser.uid?' <small class="text-accent">(вы)</small>':''}</td>
              <td class="fw-bold">${l.score}</td><td class="text-muted">${formatTime(l.totalTime)}</td>
              <td class="text-end pe-3"><small class="text-muted">${d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}</small></td>
            </tr>`;
          }).join('')}
        </tbody></table>
      </div></div>
      <div class="text-center mt-4"><button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">Пройти квиз</button></div>
    </div></div>`;
}

// ========== ТОСТЫ ==========

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  const colors = { success: 'bg-success text-white', danger: 'bg-danger text-white', info: 'bg-accent', warning: 'bg-warning text-dark' };
  const icons = { success: 'check-circle-fill', danger: 'x-circle-fill', info: 'info-circle-fill', warning: 'exclamation-triangle-fill' };
  
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center border-0 shadow-lg ${colors[type] || colors.info}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = `<div class="d-flex"><div class="toast-body d-flex align-items-center gap-2"><i class="bi bi-${icons[type] || icons.info}"></i><span>${message}</span></div><button class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  
  container.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// ========== КОНФЕТТИ ==========

function spawnConfetti() {
  if (typeof spawnConfettiAdvanced === 'function') spawnConfettiAdvanced(80);
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========

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