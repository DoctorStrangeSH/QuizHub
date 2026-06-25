// ============================================
// QuizHub — Управление экранами и UI v3.3
// ============================================

let selectedDifficulty = 'easy';
let selectedLanguage = localStorage.getItem('quizhub-language') || 'ru';
let isFirstLoad = true;

document.addEventListener('DOMContentLoaded', () => {
  // Показываем body
  document.body.classList.add('loaded');
  
  // Скрываем все экраны
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  
  createParticles();
  setupDifficultyButtons();
  setupStartButton();
  setupMobileMenu();
  initTheme();
  restoreScreenFromHash();
  
  const logo = document.querySelector('.logo');
  if (logo) logo.classList.add('logo-pulse');
});

// ========== ТЕМА ==========
function initTheme() {
  const saved = localStorage.getItem('quizhub-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const toggle = document.getElementById('theme-toggle-btn');
  if (toggle) toggle.classList.toggle('light', saved === 'light');
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
    toggle.querySelector('i').className = menu.classList.contains('show') ? 'bi bi-x-lg' : 'bi bi-list';
  });
  
  // Закрытие при клике на любой элемент меню
  menu.querySelectorAll('button, a, .theme-toggle-btn').forEach(item => {
    item.addEventListener('click', () => {
      menu.classList.remove('show');
      toggle.querySelector('i').className = 'bi bi-list';
    });
  });
  
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== toggle) {
      menu.classList.remove('show');
      toggle.querySelector('i').className = 'bi bi-list';
    }
  });
}

// ========== ЧАСТИЦЫ ==========
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const isMobile = window.innerWidth < 768;
  const count = isMobile ? 12 : 30;
  
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 5 + 2;
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 8}s;
      animation-duration: ${Math.random() * 6 + 6}s;
    `;
    container.appendChild(p);
  }
}

// ========== НАВИГАЦИЯ ==========
function showScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(`screen-${screenName}`);
  if (screen) {
    screen.classList.add('active');
    if (isFirstLoad) { screen.classList.add('no-animation'); isFirstLoad = false; }
    else { screen.style.animation = 'none'; screen.offsetHeight; screen.style.animation = 'screenFadeIn 0.5s ease'; }
  }
  
  if (history.pushState) { const url = new URL(window.location); url.hash = screenName; history.pushState({}, '', url); }
  else { window.location.hash = screenName; }
  
  if (screenName === 'achievements' && typeof renderAchievementsScreen === 'function') renderAchievementsScreen();
  if (screenName === 'leaderboard') loadLeaderboard();
  if (screenName === 'stats' && typeof renderStatsScreen === 'function') { renderStatsScreen(); setTimeout(() => { if(typeof renderScoreChart==='function')renderScoreChart(); if(typeof renderWeeklyChart==='function')renderWeeklyChart(); }, 300); }
  if (screenName === 'shop' && typeof renderShop === 'function') renderShop();
  if (screenName === 'friends' && typeof renderFriendsScreen === 'function') { const s = document.getElementById('screen-friends'); if (s) renderFriendsScreen(s); }
  if (screenName === 'team' && typeof showTeamScreen === 'function') showTeamScreen();
  if (screenName === 'tournament' && typeof showTournamentScreen === 'function') showTournamentScreen();
}

function restoreScreenFromHash() {
  const hash = window.location.hash.replace('#', '');
  
  if (hash === 'quiz') {
    if (typeof checkSavedQuiz === 'function') {
      const saved = typeof getQuizProgress === 'function' ? getQuizProgress() : null;
      if (saved && (Date.now() - saved.timestamp) / 1000 < 1800) {
        setTimeout(() => checkSavedQuiz(), 200);
        return;
      }
    }
    setTimeout(() => showScreen('home'), 100);
    return;
  }
  
  if (hash && document.getElementById(`screen-${hash}`)) {
    setTimeout(() => showScreen(hash), 100);
    return;
  }
  
  setTimeout(() => showScreen('home'), 50);
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(`screen-${hash}`)) showScreen(hash);
});

// ========== КНОПКИ ==========
function setupDifficultyButtons() {
  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-difficulty').forEach(b => b.classList.remove('active'));
      this.classList.add('active'); selectedDifficulty = this.dataset.difficulty;
    });
  });
}

function setupStartButton() {
  const startBtn = document.getElementById('start-quiz');
  if (!startBtn) return;
  startBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('player-name');
    if (!nameInput.value.trim()) { nameInput.focus(); showToast('Введи своё имя!', 'warning'); return; }
    if (document.activeElement) document.activeElement.blur();
    QUIZ_SETTINGS.totalQuestions = 10; QUIZ_SETTINGS.timePerQuestion = 15;
    startQuiz();
  });
}

// ========== ЛИДЕРЫ ==========
let leaderboardUnsubscribe = null;
let currentLeaderboardDifficulty = 'easy';

async function loadLeaderboard(difficulty) {
  if (difficulty) currentLeaderboardDifficulty = difficulty;
  const screen = document.getElementById('screen-leaderboard');
  if (!screen) return;
  screen.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-accent"></div></div>`;
  if (leaderboardUnsubscribe) { leaderboardUnsubscribe(); leaderboardUnsubscribe = null; }
  leaderboardUnsubscribe = onLeaderboardUpdate((leaders) => {
    const s = document.getElementById('screen-leaderboard');
    if (s?.classList.contains('active')) renderLeaderboardScreen(leaders, currentLeaderboardDifficulty);
  }, currentLeaderboardDifficulty, 20);
}

function switchLeaderboardDifficulty(d) { loadLeaderboard(d); }

function renderLeaderboardScreen(leaders, difficulty) {
  const screen = document.getElementById('screen-leaderboard');
  if (!screen?.classList.contains('active')) return;
  const labels = {'easy':'🟢 Лёгкий','medium':'🟡 Средний','hard':'🔴 Сложный'};
  const medals = ['🥇','🥈','🥉'];
  
  screen.innerHTML = leaders.length === 0 ? `
    <div class="text-center py-5"><i class="bi bi-trophy fs-1 text-muted"></i><h3>Пока никого нет</h3>
    <div class="d-flex gap-2 justify-content-center my-3">${['easy','medium','hard'].map(d=>`<button class="btn btn-difficulty rounded-pill px-4 ${currentLeaderboardDifficulty===d?'active':''}" onclick="switchLeaderboardDifficulty('${d}')">${labels[d]}</button>`).join('')}</div>
    <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">Пройти квиз</button></div>` : `
    <div><div class="text-center mb-4"><h2 class="fw-bold font-display">🏆 Таблица лидеров</h2><p class="text-muted">${labels[difficulty]}</p></div>
    <div class="d-flex gap-2 justify-content-center mb-4">${['easy','medium','hard'].map(d=>`<button class="btn btn-difficulty rounded-pill px-4 ${currentLeaderboardDifficulty===d?'active':''}" onclick="switchLeaderboardDifficulty('${d}')">${labels[d]}</button>`).join('')}</div>
    <div class="row g-3 mb-4">${leaders.slice(0,3).map((l,i)=>`<div class="col-md-4"><div class="bg-card rounded-4 p-4 text-center leader-card"><span class="fs-1">${medals[i]}</span><h5>${l.playerName}</h5><p class="text-accent fw-bold fs-4">${l.score}</p></div></div>`).join('')}</div>
    <div class="bg-card rounded-4 overflow-hidden"><div class="leaderboard-table-wrapper"><table class="table table-dark table-hover mb-0"><thead><tr><th>#</th><th>Игрок</th><th>Очки</th><th>Время</th></tr></thead><tbody>${leaders.map((l,i)=>`<tr><td>${i<3?medals[i]:i+1}</td><td>${l.playerName}</td><td class="fw-bold">${l.score}</td><td class="text-muted">${formatTime(l.totalTime)}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="text-center mt-4"><button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">Пройти квиз</button></div></div>`;
}

// ========== ТОСТЫ ==========
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) { container = document.createElement('div'); container.id = 'toast-container'; container.className = 'toast-container position-fixed bottom-0 end-0 p-3'; container.style.zIndex = '9999'; document.body.appendChild(container); }
  const colors = { success: 'bg-success text-white', danger: 'bg-danger text-white', info: 'bg-accent', warning: 'bg-warning text-dark' };
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center border-0 shadow-lg ${colors[type]||colors.info}`;
  toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button class="btn-close me-2" data-bs-dismiss="toast"></button></div>`;
  container.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 }); toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

function spawnConfetti() { if (typeof spawnConfettiAdvanced === 'function') spawnConfettiAdvanced(80); }
function formatTime(s) { const m=Math.floor(s/60); const sec=s%60; return `${m}:${sec.toString().padStart(2,'0')}`; }
function getDifficultyLabel(d) { const l={easy:'🟢 Легко',medium:'🟡 Средне',hard:'🔴 Сложно'}; return l[d]||d; }
function getGrade(s) {
  if(s>=90)return{title:'Легенда!',message:'Потрясающий результат,',icon:'trophy-fill',color:'grade-gold'};
  if(s>=70)return{title:'Отлично!',message:'Ты настоящий знаток,',icon:'star-fill',color:'grade-silver'};
  if(s>=50)return{title:'Неплохо!',message:'Хорошая попытка,',icon:'hand-thumbs-up-fill',color:'grade-bronze'};
  return{title:'Попробуй ещё!',message:'Не расстраивайся,',icon:'emoji-smile-fill',color:'grade-default'};
}