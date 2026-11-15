import { getState } from '../../store/state.js';
import { auth, db, doc, getDoc } from '../../firebase-config.js';
import { getCategoriesList } from '../../data/questions/index.js';
import { getUtcDateKey } from '../quiz/daily-challenge.js';
import { dailyResetCountdown } from '../quiz/daily-countdown.js';

export async function renderDashboard() {
    const t = getState().translations.dashboard || {};
    const user = getState().currentUser;
    if (!user) return '';
    
    let profile = null;
    try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) profile = docSnap.data();
    } catch (error) { console.error('Ошибка загрузки профиля:', error); }
    
    const nickname = String(profile?.nickname || user.email || 'Игрок').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    const level = profile?.level || 1;
    const coins = profile?.coins || 0;
    const quizzesCompleted = profile?.quizzesCompleted || 0;
    const wins = profile?.wins || 0;
    const friendsCount = (profile?.friends || []).length;
    
    const categories = getCategoriesList(getState().language);
    const isEN = getState().language === 'en';
    const dailyDate = getUtcDateKey();
    const dailyCountdown = dailyResetCountdown(new Date(), getState().language);
    
    const categoriesModalHTML = categories.map(cat => `
        <button type="button" class="sidebar-cat-item ${window.gameSettings?.category === cat.id ? 'active' : (cat.id === 'science' && !window.gameSettings?.category ? 'active' : '')}" 
             data-category="${cat.id}" aria-pressed="${window.gameSettings?.category === cat.id || (cat.id === 'science' && !window.gameSettings?.category)}" onclick="window.selectCategorySidebar('${cat.id}', this)">
            <span class="sidebar-cat-icon">${cat.icon}</span>
            <span class="sidebar-cat-name">${cat.name}</span>
            <span class="sidebar-cat-check" aria-hidden="true">✓</span>
        </button>
    `).join('');
    
    return `
        <div class="dashboard-layout">
            <div class="sidebar-overlay" id="sidebar-overlay" onclick="window.closeSidebar()"></div>
            <aside class="dashboard-sidebar glass-card" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo arcade-mark" aria-hidden="true"><i class="bi bi-hexagon-fill"></i><span>Q</span></div>
                    <h3 class="sidebar-title text-gradient">QuizHub</h3>
                </div>
                <nav class="sidebar-nav">
                    <a class="sidebar-link active" onclick="window.navigateTo('home'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-house-door-fill"></i></span><span>Главная</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('chat'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-chat-dots-fill"></i></span><span>Чат</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('friends'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-people-fill"></i></span><span>Друзья</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('leaderboard'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-trophy-fill"></i></span><span>Лидеры</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('achievements'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-award-fill"></i></span><span>Достижения</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('shop'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-bag-fill"></i></span><span>Магазин</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('profile'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-person-circle"></i></span><span>Профиль</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('events'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-calendar-event-fill"></i></span><span>События</span></a>
                </nav>
                <div class="sidebar-footer">
                    <button class="sidebar-btn" onclick="window.toggleTheme()">${getState().theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}</button>
                    <button class="sidebar-btn" onclick="window.toggleLang()">${getState().language === 'ru' ? '🇬🇧 English' : '🇷🇺 Русский'}</button>
                </div>
            </aside>
            <main class="dashboard-main">
                <div class="dashboard-content-wrapper">
                    <header class="mobile-header glass-card">
                        <button class="burger-btn" type="button" aria-label="Открыть меню" aria-controls="sidebar" aria-expanded="false" onclick="window.toggleSidebar()"><i class="bi bi-list" aria-hidden="true"></i></button>
                        <span class="text-gradient fw-bold">QuizHub</span>
                        <div class="d-flex align-items-center gap-2">
                            <span class="level-badge">⭐ ${level}</span>
                            <span class="coins-badge">🪙 ${coins}</span>
                        </div>
                    </header>
                    <section class="welcome-section glass-card animate-in">
                        <div class="welcome-content">
                            <div>
                                <h1 class="welcome-title">С возвращением, <span class="text-gradient">${nickname}</span>!</h1>
                                <p class="welcome-subtitle">Готов доказать свои знания?</p>
                            </div>
                            <div class="welcome-stats">
                                <div class="mini-stat"><span class="mini-stat-value">⭐ ${level}</span><span class="mini-stat-label">Уровень</span></div>
                                <div class="mini-stat"><span class="mini-stat-value">🪙 ${coins}</span><span class="mini-stat-label">Монет</span></div>
                            </div>
                        </div>
                    </section>
                    <section class="daily-challenge-card glass-card animate-in" aria-labelledby="daily-challenge-title">
                        <div class="daily-challenge-art" aria-hidden="true"><i class="bi bi-calendar2-week"></i></div>
                        <div class="daily-challenge-content">
                            <div class="daily-challenge-meta">${isEN ? 'DAILY CHALLENGE' : 'ЕЖЕДНЕВНОЕ ИСПЫТАНИЕ'} <span id="daily-challenge-date">${dailyDate}</span></div>
                            <h2 id="daily-challenge-title">${isEN ? 'A new challenge every day' : 'Новое испытание каждый день'}</h2>
                            <p>${isEN ? '10 questions · 3 easy · 3 medium · 4 hard. The same set for everyone.' : '10 вопросов · 3 лёгких · 3 средних · 4 сложных. Одинаковый набор для всех.'}</p>
                            <div class="daily-challenge-reset" id="daily-challenge-reset" role="timer" aria-live="off">${dailyCountdown.label}: <time>${dailyCountdown.time}</time> UTC</div>
                            <button class="btn-premium daily-challenge-button" type="button" onclick="window.startDailyChallenge()">${isEN ? 'Play today’s challenge' : 'Пройти испытание'} <span aria-hidden="true">→</span></button>
                            <small>${isEN ? 'Preview mode: special rewards will be enabled after server verification.' : 'Предпросмотр: особые награды появятся после подключения серверной проверки.'}</small>
                        </div>
                    </section>
                    <section class="game-section">
                        <h2 class="section-heading"><i class="bi bi-controller" aria-hidden="true"></i> Новая игра</h2>
                        <div class="selector-row glass-card">
                            <div class="selector-label">Режим</div>
                            <div class="selector-options">
                                <button class="selector-btn active" data-mode="classic" onclick="window.selectMode(this)">🎯 Классика</button>
                                <button class="selector-btn" data-mode="survival" onclick="window.selectMode(this)">💀 Выживание</button>
                                <button class="selector-btn" data-mode="time" onclick="window.selectMode(this)">⏱️ На время</button>
                                <button class="selector-btn" data-mode="duel" onclick="window.selectMode(this)">⚔️ Дуэль</button>
                            </div>
                        </div>
                        <div class="selector-row glass-card">
                            <div class="selector-label">Сложность</div>
                            <div class="selector-options">
                                <button class="selector-btn diff-btn active" data-difficulty="easy" onclick="window.selectDifficulty(this)">🟢 Лёгкий</button>
                                <button class="selector-btn diff-btn" data-difficulty="medium" onclick="window.selectDifficulty(this)">🟡 Средний</button>
                                <button class="selector-btn diff-btn" data-difficulty="hard" onclick="window.selectDifficulty(this)">🔴 Сложный</button>
                            </div>
                        </div>
                        <div class="selector-row glass-card">
                            <div class="selector-label">Категория</div>
                            <div class="category-display">
                                <button class="category-trigger" type="button" aria-haspopup="dialog" aria-controls="category-modal" onclick="window.openCategoryModal()">
                                    <span id="selected-category-display">🔬 Наука</span>
                                    <span class="category-arrow">▾</span>
                                </button>
                            </div>
                        </div>
                        <button class="play-btn" type="button" onclick="window.startGame()"><i class="bi bi-play-fill" aria-hidden="true"></i> ИГРАТЬ <span class="play-btn-arrow" aria-hidden="true">↗</span></button>
                        <div class="quick-stats">
                            <div class="row g-3">
                                <div class="col-6 col-md-3"><div class="stat-mini-card glass-card text-center"><span class="stat-mini-value text-gradient">${quizzesCompleted}</span><span class="stat-mini-label">Квизов</span></div></div>
                                <div class="col-6 col-md-3"><div class="stat-mini-card glass-card text-center"><span class="stat-mini-value text-gold">${wins}</span><span class="stat-mini-label">Побед</span></div></div>
                                <div class="col-6 col-md-3"><div class="stat-mini-card glass-card text-center"><span class="stat-mini-value text-gradient">${level}</span><span class="stat-mini-label">Уровень</span></div></div>
                                <div class="col-6 col-md-3"><div class="stat-mini-card glass-card text-center"><span class="stat-mini-value text-gold">${friendsCount}</span><span class="stat-mini-label">Друзей</span></div></div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
        <div class="category-modal" id="category-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title" aria-hidden="true">
            <div class="category-modal-backdrop" aria-hidden="true" onclick="window.closeCategoryModal()"></div>
            <div class="category-modal-content glass-card">
                <div class="category-modal-header">
                    <h3 id="category-modal-title"><i class="bi bi-grid-3x3-gap-fill" aria-hidden="true"></i> Выберите категорию</h3>
                    <button class="modal-close-btn" type="button" aria-label="Закрыть выбор категории" onclick="window.closeCategoryModal()">✕</button>
                </div>
                <div class="category-modal-body">
                    ${categoriesModalHTML}
                    <button type="button" class="sidebar-cat-item ${window.gameSettings?.category === 'all' ? 'active' : ''}" data-category="all" aria-pressed="${window.gameSettings?.category === 'all'}" onclick="window.selectCategorySidebar('all', this)">
                        <span class="sidebar-cat-icon">🎲</span>
                        <span class="sidebar-cat-name">${getState().language === 'ru' ? 'Всё сразу' : 'All'}</span>
                        <span class="sidebar-cat-check" aria-hidden="true">✓</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function attachDashboardListeners() {
    if (!window.gameSettings) window.gameSettings = { mode: 'classic', difficulty: 'easy', category: 'science' };

    if (window.__dailyChallengeTimer) clearInterval(window.__dailyChallengeTimer);
    const refreshDailyCountdown = () => {
        const timer = document.getElementById('daily-challenge-reset');
        const dateLabel = document.getElementById('daily-challenge-date');
        if (!timer || !dateLabel) {
            clearInterval(window.__dailyChallengeTimer);
            window.__dailyChallengeTimer = null;
            return;
        }
        const countdown = dailyResetCountdown(new Date(), getState().language);
        dateLabel.textContent = countdown.date;
        timer.textContent = `${countdown.label}: ${countdown.time} UTC`;
    };
    refreshDailyCountdown();
    window.__dailyChallengeTimer = setInterval(refreshDailyCountdown, 1000);
    
    window.selectMode = (el) => {
        document.querySelectorAll('[data-mode].selector-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        el.classList.add('active');
        el.setAttribute('aria-pressed', 'true');
        window.gameSettings.mode = el.dataset.mode;
    };
    window.selectDifficulty = (el) => {
        document.querySelectorAll('.diff-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        el.classList.add('active');
        el.setAttribute('aria-pressed', 'true');
        window.gameSettings.difficulty = el.dataset.difficulty;
    };
    let categoryReturnFocus = null;
    window.openCategoryModal = () => {
        const modal = document.getElementById('category-modal');
        categoryReturnFocus = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        modal.querySelector('.sidebar-cat-item.active, .sidebar-cat-item, .modal-close-btn')?.focus();
    };
    window.closeCategoryModal = () => {
        const modal = document.getElementById('category-modal');
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        categoryReturnFocus?.focus?.();
        categoryReturnFocus = null;
    };
    const categoryModal = document.getElementById('category-modal');
    categoryModal?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { event.preventDefault(); window.closeCategoryModal(); return; }
        if (event.key !== 'Tab') return;
        const focusable = [...categoryModal.querySelectorAll('button:not(:disabled)')];
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    window.selectCategorySidebar = (cat, el) => {
        document.querySelectorAll('.sidebar-cat-item').forEach(i => { i.classList.remove('active'); i.setAttribute('aria-pressed', 'false'); });
        el.classList.add('active');
        el.setAttribute('aria-pressed', 'true');
        window.gameSettings.category = cat;
        const icon = el.querySelector('.sidebar-cat-icon').textContent;
        const name = el.querySelector('.sidebar-cat-name').textContent;
        document.getElementById('selected-category-display').textContent = `${icon} ${name}`;
        setTimeout(() => window.closeCategoryModal(), 150);
    };
    window.startDailyChallenge = (dateKey) => {
        // Always take today's UTC date on click; a dashboard can cross midnight.
        const challengeDate = getUtcDateKey();
        window.gameSettings = {
            mode: 'daily',
            category: 'all',
            difficulty: 'mixed',
            challengeDate
        };
        window.startGame();
    };

    window.startGame = () => {
        const settings = window.gameSettings;
        import('../../store/state.js').then(m => {
            m.setState('gameSettings', settings);
            m.setState('currentRoute', 'quiz');
            import('../../router.js').then(r => r.default());
        });
    };
    window.toggleSidebar = () => { const opened = document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open', opened); document.querySelector('.burger-btn')?.setAttribute('aria-expanded', String(opened)); };
    window.closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); document.querySelector('.burger-btn')?.setAttribute('aria-expanded', 'false'); };
    
    const activeCat = document.querySelector('.sidebar-cat-item.active');
    if (activeCat) {
        const icon = activeCat.querySelector('.sidebar-cat-icon')?.textContent || '🔬';
        const name = activeCat.querySelector('.sidebar-cat-name')?.textContent || 'Наука';
        const display = document.getElementById('selected-category-display');
        if (display) display.textContent = `${icon} ${name}`;
    }
}