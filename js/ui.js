// ============================================
// QuizHub — Управление экранами и UI
// ============================================

let selectedDifficulty = 'easy';
let selectedLanguage = 'ru';

document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  setupNavigation();
  setupDifficultyButtons();
  setupStartButton();
  setupLeaderboardButton();
});

// ========== ЧАСТИЦЫ ФОНА ==========

function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  
  for (let i = 0; i < 30; i++) {
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

function setupNavigation() {
  document.querySelector('.logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('home');
  });
}

function showScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(`screen-${screenName}`);
  if (screen) {
    screen.classList.add('active');
    screen.style.animation = 'none';
    screen.offsetHeight;
    screen.style.animation = 'screenFadeIn 0.5s ease';
  }
}

// ========== КНОПКИ СЛОЖНОСТИ И ЯЗЫКА ==========

function setupDifficultyButtons() {
  // Сложность
  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-difficulty').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedDifficulty = this.dataset.difficulty;
    });
  });
  
  // Язык
  document.querySelectorAll('.btn-language').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-language').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedLanguage = this.dataset.lang;
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
      setTimeout(() => {
        nameInput.style.borderColor = '';
      }, 2000);
      return;
    }
    
    startQuiz();
  });
  
  const nameInput = document.getElementById('player-name');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      nameInput.dataset.manual = 'true';
    });
  }
}

// ========== ТАБЛИЦА ЛИДЕРОВ ==========

let leaderboardUnsubscribe = null;

function setupLeaderboardButton() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-screen="leaderboard"]') || e.target.closest('#view-leaderboard')) {
      showScreen('leaderboard');
      loadLeaderboard();
    }
  });
}

async function loadLeaderboard() {
  const screen = document.getElementById('screen-leaderboard');
  if (!screen) return;
  
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
  
  if (leaderboardUnsubscribe) {
    leaderboardUnsubscribe();
  }
  
  leaderboardUnsubscribe = onLeaderboardUpdate(leaders => {
    renderLeaderboardScreen(leaders);
  }, 20);
}

function renderLeaderboardScreen(leaders) {
  const screen = document.getElementById('screen-leaderboard');
  if (!screen || !screen.classList.contains('active')) return;
  
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
          <p class="text-muted">Лучшие из лучших</p>
        </div>
        
        <div class="row g-3 mb-4">
          ${leaders.slice(0, 3).map((leader, i) => `
            <div class="col-md-4">
              <div class="bg-card rounded-4 p-4 text-center leader-card leader-top-${i + 1}">
                <div class="leader-avatar mx-auto mb-2">
                  ${leader.photoURL 
                    ? `<img src="${leader.photoURL}" alt="${leader.playerName}" class="rounded-circle" width="60" height="60" style="border: 3px solid var(--accent);">`
                    : `<div class="bg-accent bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mx-auto" style="width: 60px; height: 60px; border: 3px solid var(--accent);">
                        <span class="fw-bold text-accent fs-5">${leader.playerName.charAt(0).toUpperCase()}</span>
                      </div>`
                  }
                </div>
                <span class="fs-1">${medals[i]}</span>
                <h5 class="fw-bold mb-1">${leader.playerName}</h5>
                <p class="text-accent fw-bold fs-4 mb-1">${leader.score}</p>
                <small class="text-muted">${formatTime(leader.totalTime)} • ${leader.difficulty === 'easy' ? '🟢' : leader.difficulty === 'medium' ? '🟡' : '🔴'}</small>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="bg-card rounded-4 overflow-hidden">
          <div class="table-responsive">
            <table class="table table-dark table-hover mb-0">
              <thead>
                <tr>
                  <th class="ps-4">#</th>
                  <th>Игрок</th>
                  <th>Очки</th>
                  <th>Время</th>
                  <th class="text-end pe-4">Сложность</th>
                </tr>
              </thead>
              <tbody>
                ${leaders.map((leader, i) => `
                  <tr class="${currentUser && leader.userId === currentUser.uid ? 'table-active-row' : ''}">
                    <td class="ps-4 fw-bold">${i + 1}</td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        ${leader.photoURL 
                          ? `<img src="${leader.photoURL}" width="28" height="28" class="rounded-circle">`
                          : `<div class="bg-accent bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;">
                              <small class="text-accent fw-bold">${leader.playerName.charAt(0)}</small>
                            </div>`
                        }
                        <span class="fw-semibold">${leader.playerName}</span>
                      </div>
                    </td>
                    <td class="fw-bold">${leader.score}</td>
                    <td class="text-muted">${formatTime(leader.totalTime)}</td>
                    <td class="text-end pe-4">
                      <span>${leader.difficulty === 'easy' ? '🟢' : leader.difficulty === 'medium' ? '🟡' : '🔴'}</span>
                    </td>
                  </tr>
                `).join('')}
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
        <i class="bi bi-${icons[type] || icons.info}"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Закрыть"></button>
    </div>
  `;
  
  container.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();
  
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// ========== КОНФЕТТИ ==========

function spawnConfetti() {
  const colors = ['#FF6B9D', '#7B2FBE', '#FFD740', '#00E676', '#FF5252', '#40C4FF'];
  
  for (let i = 0; i < 80; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const duration = Math.random() * 2 + 2;
    const size = Math.random() * 10 + 5;
    
    confetti.style.cssText = `
      position: fixed;
      top: -20px;
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      z-index: 9999;
      pointer-events: none;
      animation: confettiFall ${duration}s ease-in ${delay}s forwards;
    `;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), (duration + delay) * 1000 + 500);
  }
}