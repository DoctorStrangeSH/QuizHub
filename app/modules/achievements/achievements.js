import { getState } from '../../store/state.js';
import { auth, db, doc, getDoc, updateDoc } from '../../firebase-config.js';

const ALL_ACHIEVEMENTS = [
    { id: 'first_quiz', nameRU: 'Первый квиз', nameEN: 'First Quiz', descRU: 'Пройти первый квиз', descEN: 'Complete first quiz', icon: '🎯', condition: (s) => s.totalGames >= 1 },
    { id: 'ten_quizzes', nameRU: 'Знаток', nameEN: 'Expert', descRU: 'Пройти 10 квизов', descEN: 'Complete 10 quizzes', icon: '📚', condition: (s) => s.totalGames >= 10 },
    { id: 'fifty_quizzes', nameRU: 'Эрудит', nameEN: 'Scholar', descRU: 'Пройти 50 квизов', descEN: 'Complete 50 quizzes', icon: '🎓', condition: (s) => s.totalGames >= 50 },
    { id: 'hundred_quizzes', nameRU: 'Гений', nameEN: 'Genius', descRU: 'Пройти 100 квизов', descEN: 'Complete 100 quizzes', icon: '🧠', condition: (s) => s.totalGames >= 100 },
    { id: 'first_win', nameRU: 'Первая победа', nameEN: 'First Win', descRU: 'Выиграть квиз', descEN: 'Win a quiz', icon: '🏆', condition: (s) => s.totalWins >= 1 },
    { id: 'ten_wins', nameRU: 'Победитель', nameEN: 'Winner', descRU: 'Выиграть 10 квизов', descEN: 'Win 10 quizzes', icon: '🥇', condition: (s) => s.totalWins >= 10 },
    { id: 'perfect_score', nameRU: 'Идеально', nameEN: 'Perfect', descRU: '10/10 в квизе', descEN: '10/10 in quiz', icon: '💯', condition: (s) => s.bestStreak >= 10 },
    { id: 'fast_learner', nameRU: 'Быстрый ученик', nameEN: 'Fast Learner', descRU: 'Набрать 1000 XP', descEN: 'Earn 1000 XP', icon: '⚡', condition: (s, p) => (p?.experience || 0) >= 1000 },
    { id: 'level_five', nameRU: '5 уровень', nameEN: 'Level 5', descRU: 'Достигнуть 5 уровня', descEN: 'Reach level 5', icon: '⭐', condition: (s, p) => (p?.level || 1) >= 5 },
    { id: 'level_ten', nameRU: '10 уровень', nameEN: 'Level 10', descRU: 'Достигнуть 10 уровня', descEN: 'Reach level 10', icon: '🌟', condition: (s, p) => (p?.level || 1) >= 10 },
    { id: 'social', nameRU: 'Душа компании', nameEN: 'Social', descRU: 'Добавить 5 друзей', descEN: 'Add 5 friends', icon: '👥', condition: (s, p) => (p?.friends?.length || 0) >= 5 },
    { id: 'collector', nameRU: 'Коллекционер', nameEN: 'Collector', descRU: 'Накопить 1000 монет', descEN: 'Collect 1000 coins', icon: '💰', condition: (s, p) => (p?.coins || 0) >= 1000 }
];

export function renderAchievements() {
    const t = getState().translations.achievements || {};
    return `
        <div class="dashboard-layout">
            <div class="sidebar-overlay" id="sidebar-overlay" onclick="window.closeSidebar()"></div>
            <aside class="dashboard-sidebar glass-card" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo arcade-mark" aria-hidden="true"><i class="bi bi-hexagon-fill"></i><span>Q</span></div>
                    <h3 class="sidebar-title text-gradient">QuizHub</h3>
                </div>
                <nav class="sidebar-nav">
                    <a class="sidebar-link" onclick="window.navigateTo('home'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-house-door-fill"></i></span><span>Главная</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('chat'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-chat-dots-fill"></i></span><span>Чат</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('friends'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-people-fill"></i></span><span>Друзья</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('leaderboard'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-trophy-fill"></i></span><span>Лидеры</span></a>
                    <a class="sidebar-link active" onclick="window.navigateTo('achievements'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-award-fill"></i></span><span>Достижения</span></a>
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
                        <div></div>
                    </header>
                    <div class="achievements-header glass-card animate-in">
                        <div class="collection-eyebrow"><i class="bi bi-stars" aria-hidden="true"></i> ЗАЛ СЛАВЫ</div>
                        <h3 class="mb-0 fw-bold">${t.title || 'Достижения'}</h3>
                        <p class="collection-subtitle">Собирай знаки мастерства и открывай новые вершины.</p>
                    </div>
                    <div class="achievements-grid" id="achievements-grid">
                        <div class="text-center py-4" style="grid-column: 1 / -1;">
                            <div class="loading-spinner"></div>
                            <p class="text-secondary mt-2">Загрузка достижений...</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;
}

export async function loadAchievements() {
    const user = auth.currentUser;
    if (!user) return;
    const lang = getState().language;
    const isRU = lang === 'ru';
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return;
        const profile = userDoc.data();
        const unlocked = profile.achievements || [];
        const grid = document.getElementById('achievements-grid');
        if (!grid) return;
        grid.innerHTML = ALL_ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlocked.includes(ach.id);
            return `
                <div class="achievement-card glass-card ${isUnlocked ? 'unlocked' : 'locked'}" aria-label="${isUnlocked ? (isRU ? 'Получено' : 'Unlocked') : (isRU ? 'Пока закрыто' : 'Locked')}">
                    <div class="achievement-icon-wrapper">
                        <span class="achievement-icon">${ach.icon}</span>
                        ${isUnlocked ? '<span class="achievement-check">✓</span>' : '<span class="achievement-lock">🔒</span>'}
                    </div>
                    <div class="achievement-info">
                        <h4 class="achievement-name">${isRU ? ach.nameRU : ach.nameEN}</h4>
                        <p class="achievement-desc">${isRU ? ach.descRU : ach.descEN}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) { console.error('Ошибка загрузки достижений:', error); }
}

export async function checkAchievements() {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) return;
        const profile = userDoc.data();
        const stats = profile.stats || {};
        const current = profile.achievements || [];
        const newAch = [];
        for (const ach of ALL_ACHIEVEMENTS) {
            if (!current.includes(ach.id) && ach.condition(stats, profile)) {
                newAch.push(ach);
            }
        }
        if (newAch.length > 0) {
            await updateDoc(userRef, { achievements: [...current, ...newAch.map(a => a.id)] });
            showPopup(newAch);
        }
    } catch (error) { console.error('Ошибка проверки достижений:', error); }
}

function showPopup(achievements) {
    const lang = getState().language;
    const isRU = lang === 'ru';
    achievements.forEach((ach, i) => {
        setTimeout(() => {
            const popup = document.createElement('div');
            popup.className = 'achievement-popup glass-card';
            popup.innerHTML = `<span class="popup-icon">${ach.icon}</span><div><strong>🏆 Достижение!</strong><span>${isRU ? ach.nameRU : ach.nameEN}</span></div>`;
            document.body.appendChild(popup);
            setTimeout(() => popup.classList.add('show'), 100);
            setTimeout(() => { popup.classList.remove('show'); setTimeout(() => popup.remove(), 400); }, 3000);
        }, i * 3500);
    });
}

export function attachAchievementsListeners() {
    loadAchievements();
    window.toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };
    window.closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); };
}