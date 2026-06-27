// ============================================
// QuizHub — Управление экранами и UI v4.3
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    createParticles();
    setupDifficultyButtons();
    setupStartButton();
    setupMobileMenu();
    initTheme();
    restoreScreenFromHash();
    restoreCategory();
    restoreDifficulty();

    // Восстанавливаем позицию скролла
    restoreScrollPosition();

    // Показать/скрыть баннер при смене экрана
    EventBus.on(EVENTS.SCREEN_CHANGED, (screenName) => {
        const banner = document.getElementById('event-banner-container');
        if (banner) {
            banner.style.display = screenName === 'home' ? 'block' : 'none';
        }
    });

    // Показать баннер при загрузке
    const banner = document.getElementById('event-banner-container');
    if (banner && AppState.get('currentScreen') === 'home') {
        banner.style.display = 'block';
    }

    const logo = document.querySelector('.logo');
    if (logo) logo.classList.add('logo-pulse');
});

// ========== СОХРАНЕНИЕ ПОЗИЦИИ СКРОЛЛА ==========

function saveScrollPosition() {
    sessionStorage.setItem('quizhub-scroll-y', window.scrollY.toString());
}

function restoreScrollPosition() {
    const savedY = sessionStorage.getItem('quizhub-scroll-y');
    if (savedY) {
        setTimeout(() => {
            window.scrollTo({ top: parseInt(savedY), behavior: 'instant' });
        }, 150);
    }
}

// Сохраняем перед уходом
window.addEventListener('beforeunload', () => {
    saveScrollPosition();
});

// Сохраняем при скролле
let scrollSaveTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollSaveTimeout);
    scrollSaveTimeout = setTimeout(() => {
        sessionStorage.setItem('quizhub-scroll-y', window.scrollY.toString());
    }, 200);
}, { passive: true });

// ========== ТЕМА ==========
function initTheme() {
    const saved = AppState.get('settings.theme');
    document.documentElement.setAttribute('data-theme', saved);
    const toggle = document.getElementById('theme-toggle-btn');
    if (toggle) toggle.classList.toggle('light', saved === 'light');
}

function toggleTheme() {
    const current = AppState.get('settings.theme');
    const next = current === 'dark' ? 'light' : 'dark';
    AppState.set('settings.theme', next);
    document.documentElement.setAttribute('data-theme', next);
    const toggle = document.getElementById('theme-toggle-btn');
    if (toggle) toggle.classList.toggle('light', next === 'light');

    EventBus.emit(EVENTS.THEME_CHANGED, next);

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

    menu.querySelectorAll('button, a, .theme-toggle-btn').forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.closest('.theme-toggle-wrapper') || item.closest('#theme-toggle-btn') || item.id === 'theme-toggle-btn') {
                return;
            }
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

// ========== СОХРАНЕНИЕ КАТЕГОРИИ И СЛОЖНОСТИ ==========
function setupCategorySaver() {
    const catSelect = document.getElementById('quiz-category');
    if (!catSelect) return;
    catSelect.addEventListener('change', function() {
        AppState.set('settings.category', this.value);
    });
}

function restoreCategory() {
    const saved = AppState.get('settings.category');
    if (saved && saved !== 'any') {
        const catSelect = document.getElementById('quiz-category');
        if (catSelect) catSelect.value = saved;
    }
}

function restoreDifficulty() {
    const saved = AppState.get('settings.difficulty');
    if (saved && saved !== 'easy') {
        document.querySelectorAll('.btn-difficulty').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === saved);
        });
    }
}

// ========== НАВИГАЦИЯ ==========
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`screen-${screenName}`);
    if (screen) {
        screen.classList.add('active');
        if (AppState.get('isFirstLoad')) {
            screen.classList.add('no-animation');
            AppState.set('isFirstLoad', false);
        } else {
            screen.style.animation = 'none';
            screen.offsetHeight;
            screen.style.animation = 'screenFadeIn 0.5s ease';
        }
    }

    AppState.set('currentScreen', screenName);

    if (history.pushState) {
        const url = new URL(window.location);
        url.hash = screenName;
        history.pushState({}, '', url);
    } else {
        window.location.hash = screenName;
    }

    EventBus.emit(EVENTS.SCREEN_CHANGED, screenName);

    if (screenName === 'achievements' && typeof renderAchievementsScreen === 'function') {
        renderAchievementsScreen();
    }
    if (screenName === 'leaderboard' && typeof loadLeaderboard === 'function') {
        loadLeaderboard();
    }
    if (screenName === 'stats' && typeof renderStatsScreen === 'function') {
        renderStatsScreen();
        setTimeout(() => {
            if (typeof renderScoreChart === 'function') renderScoreChart();
            if (typeof renderWeeklyChart === 'function') renderWeeklyChart();
        }, 300);
    }
    if (screenName === 'shop' && typeof renderShop === 'function') {
        renderShop();
    }
    if (screenName === 'friends' && typeof renderFriendsScreen === 'function') {
        const s = document.getElementById('screen-friends');
        if (s) renderFriendsScreen(s);
    }
    if (screenName === 'team' && typeof renderTeamScreen === 'function') {
        renderTeamScreen();
    }
    if (screenName === 'tournament' && typeof renderTournamentScreen === 'function') {
        renderTournamentScreen();
    }
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
            this.classList.add('active');
            AppState.set('settings.difficulty', this.dataset.difficulty);
        });
    });
    setupCategorySaver();
}

function setupStartButton() {
    const startBtn = document.getElementById('start-quiz');
    if (!startBtn) return;
    startBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('player-name');
        if (!nameInput.value.trim()) {
            nameInput.focus();
            showToast('Введи своё имя!', 'warning');
            return;
        }
        if (document.activeElement) document.activeElement.blur();
        QUIZ_SETTINGS.totalQuestions = 10;
        QUIZ_SETTINGS.timePerQuestion = 15;
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
    if (typeof onLeaderboardUpdate === 'function') {
        leaderboardUnsubscribe = onLeaderboardUpdate((leaders) => {
            const s = document.getElementById('screen-leaderboard');
            if (s?.classList.contains('active')) renderLeaderboardScreen(leaders, currentLeaderboardDifficulty);
        }, currentLeaderboardDifficulty, 20);
    }
}

function switchLeaderboardDifficulty(d) { loadLeaderboard(d); }

function renderLeaderboardScreen(leaders, difficulty) {
    const screen = document.getElementById('screen-leaderboard');
    if (!screen?.classList.contains('active')) return;
    const medals = ['🥇', '🥈', '🥉'];

    if (leaders.length === 0) {
        screen.innerHTML = I18N_TEMPLATES.leaderboardEmpty(difficulty);
        return;
    }

    screen.innerHTML = `
        <div class="row justify-content-center"><div class="col-lg-8">
            ${I18N_TEMPLATES.leaderboardHeader(difficulty)}
            <div class="d-flex gap-2 justify-content-center mb-4">${I18N_TEMPLATES.leaderboardTabs()}</div>
            <div class="row g-3 mb-4">
                ${leaders.slice(0, 3).map((l, i) => `
                    <div class="col-md-4">
                        <div class="bg-card rounded-4 p-4 text-center leader-card leader-top-${i + 1}">
                            <span class="fs-1">${medals[i]}</span>
                            <h5 class="fw-bold mb-1 text-truncate">${l.playerName}</h5>
                            <p class="text-accent fw-bold fs-4 mb-1">${l.score}</p>
                            <small class="text-muted">${formatTime(l.totalTime)}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="bg-card rounded-4 overflow-hidden">
                <div class="leaderboard-table-wrapper">
                    <table class="table table-dark table-hover mb-0">
                        <thead>
                            <tr>
                                <th class="ps-3">#</th>
                                <th>${t('player')}</th>
                                <th>${t('score')}</th>
                                <th>${t('time')}</th>
                            </tr>
                        </thead>
                        <tbody>${I18N_TEMPLATES.leaderboardTable(leaders)}</tbody>
                    </table>
                </div>
            </div>
            <div class="text-center mt-4">
                <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">${t('startQuiz')}</button>
            </div>
        </div></div>
    `;
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
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center border-0 shadow-lg ${colors[type] || colors.info}`;
    toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button class="btn-close me-2" data-bs-dismiss="toast"></button></div>`;
    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

function spawnConfetti() {
    if (typeof spawnConfettiAdvanced === 'function') spawnConfettiAdvanced(80);
}