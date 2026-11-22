import { getState } from '../../store/state.js';
import { auth, db, doc, getDoc } from '../../firebase-config.js';
import { profileCollectionForViewer, projectProfileForViewer } from './profile-read-source.js';
import { isProfileTimeZonePreviewEnabled, renderProfileTimeZoneSettings } from './profile-timezone-settings.js';

// Достижения для отображения
const ALL_ACHIEVEMENTS = [
    { id: 'first_quiz', nameRU: 'Первый квиз', nameEN: 'First Quiz', descRU: 'Пройти первый квиз', descEN: 'Complete first quiz', icon: '🎯' },
    { id: 'ten_quizzes', nameRU: 'Знаток', nameEN: 'Expert', descRU: 'Пройти 10 квизов', descEN: 'Complete 10 quizzes', icon: '📚' },
    { id: 'fifty_quizzes', nameRU: 'Эрудит', nameEN: 'Scholar', descRU: 'Пройти 50 квизов', descEN: 'Complete 50 quizzes', icon: '🎓' },
    { id: 'hundred_quizzes', nameRU: 'Гений', nameEN: 'Genius', descRU: 'Пройти 100 квизов', descEN: 'Complete 100 quizzes', icon: '🧠' },
    { id: 'first_win', nameRU: 'Первая победа', nameEN: 'First Win', descRU: 'Выиграть квиз', descEN: 'Win a quiz', icon: '🏆' },
    { id: 'ten_wins', nameRU: 'Победитель', nameEN: 'Winner', descRU: 'Выиграть 10 квизов', descEN: 'Win 10 quizzes', icon: '🥇' },
    { id: 'perfect_score', nameRU: 'Идеально', nameEN: 'Perfect', descRU: '10/10 в квизе', descEN: '10/10 in a quiz', icon: '💯' },
    { id: 'fast_learner', nameRU: 'Быстрый ученик', nameEN: 'Fast Learner', descRU: 'Набрать 1000 XP', descEN: 'Earn 1000 XP', icon: '⚡' },
    { id: 'level_five', nameRU: '5 уровень', nameEN: 'Level 5', descRU: 'Достигнуть 5 уровня', descEN: 'Reach level 5', icon: '⭐' },
    { id: 'level_ten', nameRU: '10 уровень', nameEN: 'Level 10', descRU: 'Достигнуть 10 уровня', descEN: 'Reach level 10', icon: '🌟' },
    { id: 'social', nameRU: 'Душа компании', nameEN: 'Social', descRU: 'Добавить 5 друзей', descEN: 'Add 5 friends', icon: '👥' },
    { id: 'collector', nameRU: 'Коллекционер', nameEN: 'Collector', descRU: 'Накопить 1000 монет', descEN: 'Collect 1000 coins', icon: '💰' }
];

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

const FRAME_STYLES = {
    'frame_default': { border: '2px solid var(--border)', shadow: 'none' },
    'frame_gold': { border: '3px solid #fbbf24', shadow: '0 0 15px rgba(251, 191, 36, 0.5)' },
    'frame_diamond': { border: '3px solid #b8d4f0', shadow: '0 0 20px rgba(184, 212, 240, 0.6)' },
    'frame_fire': { border: '3px solid #f87171', shadow: '0 0 20px rgba(248, 113, 113, 0.5)' },
    'frame_galaxy': { border: '3px solid #c084fc', shadow: '0 0 25px rgba(192, 132, 252, 0.6)' }
};

// ========== ОТРИСОВКА ПУБЛИЧНОГО ПРОФИЛЯ ==========
export function renderPublicProfile(profileData, isOwnProfile = false) {
    const t = getState().translations.profile || {};
    const lang = getState().language;
    const isRU = lang === 'ru';
    const p = isOwnProfile ? profileData : projectProfileForViewer(null, profileData?.uid, profileData);
    let detectedTimeZone = 'UTC';
    try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (typeof detected === 'string' && detected) detectedTimeZone = detected;
    } catch {
        // Keep UTC as a safe display fallback.
    }
    const timeZoneSettings = isOwnProfile ? renderProfileTimeZoneSettings({
        timeZone: p.timeZone || detectedTimeZone,
        savedTimeZone: p.timeZone || '',
        detectedTimeZone,
        language: lang,
        previewEnabled: isProfileTimeZonePreviewEnabled(window.location, auth)
    }) : '';
    
    const stats = p.stats || {};
    const achievements = p.achievements || [];
    const frameStyle = FRAME_STYLES[p.equippedFrame] || FRAME_STYLES.frame_default;
    
    const winRate = stats.totalGames > 0 ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0;
    const accuracy = stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0;
    const level = p.level || 1;
    const expProgress = ((p.experience || 0) % 100);
    const friendsCount = (p.friends || []).length;
    
    const unlockedAchievements = ALL_ACHIEVEMENTS.filter(a => achievements.includes(a.id));
    const recentAchievements = unlockedAchievements.slice(-5).reverse();
    
    const createdDate = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('ru-RU') : 'недавно';
    
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
                    <a class="sidebar-link" onclick="window.navigateTo('achievements'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-award-fill"></i></span><span>Достижения</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('shop'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-bag-fill"></i></span><span>Магазин</span></a>
                    <a class="sidebar-link active" onclick="window.navigateTo('profile'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-person-circle"></i></span><span>Профиль</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('events'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-calendar-event-fill"></i></span><span>События</span></a>
                </nav>
                <div class="sidebar-footer">
                    <button class="sidebar-btn" onclick="window.toggleTheme()">${getState().theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}</button>
                    <button class="sidebar-btn" onclick="window.toggleLang()">${getState().language === 'ru' ? '🇬🇧 English' : '🇷🇺 Русский'}</button>
                </div>
            </aside>
            
            <main class="dashboard-main">
                <div class="profile-page-wrapper">
                    <header class="mobile-header glass-card">
                        <button class="burger-btn" type="button" aria-label="Открыть меню" aria-controls="sidebar" aria-expanded="false" onclick="window.toggleSidebar()"><i class="bi bi-list" aria-hidden="true"></i></button>
                        <span class="text-gradient fw-bold">QuizHub</span>
                        <div></div>
                    </header>
                    
                    <div class="profile-header-card glass-card animate-in">
                        <div class="profile-hero-eyebrow"><i class="bi bi-stars" aria-hidden="true"></i> ${isRU ? 'КАРТОЧКА ИГРОКА' : 'PLAYER CARD'}</div>
                        <div class="profile-avatar-section">
                            <div class="profile-avatar-frame" style="border: ${frameStyle.border}; box-shadow: ${frameStyle.shadow};">
                                <span class="profile-avatar-emoji"><i class="bi bi-person-fill" aria-hidden="true"></i></span>
                            </div>
                            <div class="profile-name-section">
                                <h1 class="profile-nickname text-gradient">${escapeHTML(p.nickname || 'Игрок')}</h1>
                                <div class="profile-badges">
                                    <span class="profile-badge level">⭐ Ур. ${level}</span>
                                    ${isOwnProfile ? `<span class="profile-badge coins">🪙 ${p.coins || 0}</span>` : ''}
                                    ${isOwnProfile ? '<span class="profile-badge you">Это вы</span>' : `
                                        <button class="btn-premium btn-sm" onclick="window.sendFriendRequestFromProfile('${p.uid || ''}')">👥 Добавить</button>
                                    `}
                                </div>
                            </div>
                        </div>
                        
                        <div class="exp-bar-section">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-secondary small">Опыт</span>
                                <span class="text-gradient small fw-bold">${expProgress}/100 XP</span>
                            </div>
                            <div class="exp-bar">
                                <div class="exp-fill" style="width: ${expProgress}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    ${isOwnProfile ? `
                    <div class="profile-stats-grid animate-in animate-in-delay-1">
                        <div class="stat-box glass-card">
                            <span class="stat-icon">🎮</span>
                            <span class="stat-number">${stats.totalGames || 0}</span>
                            <span class="stat-text">Игр</span>
                        </div>
                        <div class="stat-box glass-card">
                            <span class="stat-icon">🏆</span>
                            <span class="stat-number">${stats.totalWins || 0}</span>
                            <span class="stat-text">Побед</span>
                        </div>
                        <div class="stat-box glass-card">
                            <span class="stat-icon">📊</span>
                            <span class="stat-number">${winRate}%</span>
                            <span class="stat-text">Побед %</span>
                        </div>
                        <div class="stat-box glass-card">
                            <span class="stat-icon">🎯</span>
                            <span class="stat-number">${accuracy}%</span>
                            <span class="stat-text">Точность</span>
                        </div>
                        <div class="stat-box glass-card">
                            <span class="stat-icon">❓</span>
                            <span class="stat-number">${stats.totalQuestions || 0}</span>
                            <span class="stat-text">Вопросов</span>
                        </div>
                        <div class="stat-box glass-card">
                            <span class="stat-icon">✅</span>
                            <span class="stat-number">${stats.correctAnswers || 0}</span>
                            <span class="stat-text">Правильно</span>
                        </div>
                        <div class="stat-box glass-card">
                            <span class="stat-icon">👥</span>
                            <span class="stat-number">${friendsCount}</span>
                            <span class="stat-text">Друзей</span>
                        </div>
                        <div class="stat-box glass-card">
                            <span class="stat-icon">🔥</span>
                            <span class="stat-number">${stats.bestStreak || 0}</span>
                            <span class="stat-text">Рекорд</span>
                        </div>
                    </div>
                    
                    ` : `
                    <div class="profile-stats-grid animate-in animate-in-delay-1">
                        <div class="stat-box glass-card">
                            <span class="stat-icon">🏆</span>
                            <span class="stat-number">${p.wins}</span>
                            <span class="stat-text">${isRU ? 'Побед' : 'Wins'}</span>
                        </div>
                        <div class="stat-box glass-card">
                            <span class="stat-icon">⚡</span>
                            <span class="stat-number">${p.experience}</span>
                            <span class="stat-text">${isRU ? 'Всего XP' : 'Total XP'}</span>
                        </div>
                    </div>
                    
                    `}
                    
                    ${isOwnProfile && recentAchievements.length > 0 ? `
                        <div class="profile-achievements glass-card animate-in animate-in-delay-2">
                            <h4 class="section-label">🏆 Последние достижения</h4>
                            <div class="profile-ach-list">
                                ${recentAchievements.map(a => `
                                    <div class="profile-ach-item">
                                        <span class="ach-icon">${a.icon}</span>
                                        <span class="ach-name">${isRU ? a.nameRU : a.nameEN}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${timeZoneSettings}

                    ${isOwnProfile ? `
                    <div class="profile-footer-info glass-card animate-in animate-in-delay-3">
                        <p class="text-secondary small mb-0">🗓️ На сайте с ${createdDate}</p>
                    </div>
                    ` : ''}
                </div>
            </main>
        </div>
    `;
}

// ========== ЗАГРУЗКА ПРОФИЛЯ ==========
export async function loadProfile(userId) {
    try {
        const docSnap = await getDoc(doc(db, profileCollectionForViewer(auth.currentUser?.uid, userId), userId));
        if (docSnap.exists()) {
            return projectProfileForViewer(auth.currentUser?.uid, userId, docSnap.data());
        }
        return null;
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        return null;
    }
}

// Карточка профиля может открываться до экрана друзей. Загружаем единый
// обработчик по требованию, не подменяя его устаревшей второй реализацией.
window.sendFriendRequestFromProfile = async (friendId) => {
    if (!auth.currentUser || !friendId) return;
    try {
        await import('../friends/friends.js');
        await window.sendFriendRequest(friendId);
    } catch (error) {
        console.error('Ошибка отправки заявки из профиля:', error);
        alert('Не удалось отправить заявку. Попробуйте ещё раз.');
    }
};
