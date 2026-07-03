import { getState } from '../../store/state.js';
import { auth, db, doc, getDoc, collection, query, orderBy, limit, getDocs } from '../../firebase-config.js';

export function renderLeaderboard() {
    const t = getState().translations.leaderboard || {};
    return `
        <div class="dashboard-layout">
            <div class="sidebar-overlay" id="sidebar-overlay" onclick="window.closeSidebar()"></div>
            <aside class="dashboard-sidebar glass-card" id="sidebar">
                <div class="sidebar-header"><div class="sidebar-logo">👑</div><h3 class="sidebar-title text-gradient">Quiz Empire</h3></div>
                <nav class="sidebar-nav">
                    <a class="sidebar-link" onclick="window.navigateTo('home'); window.closeSidebar();"><span class="sidebar-link-icon">🏠</span><span>Главная</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('chat'); window.closeSidebar();"><span class="sidebar-link-icon">💬</span><span>Чат</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('friends'); window.closeSidebar();"><span class="sidebar-link-icon">👥</span><span>Друзья</span></a>
                    <a class="sidebar-link active" onclick="window.navigateTo('leaderboard'); window.closeSidebar();"><span class="sidebar-link-icon">🏅</span><span>Лидеры</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('achievements'); window.closeSidebar();"><span class="sidebar-link-icon">🏆</span><span>Достижения</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('shop'); window.closeSidebar();"><span class="sidebar-link-icon">🛒</span><span>Магазин</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('profile'); window.closeSidebar();"><span class="sidebar-link-icon">👤</span><span>Профиль</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('events'); window.closeSidebar();"><span class="sidebar-link-icon">📅</span><span>События</span></a>
                </nav>
                <div class="sidebar-footer">
                    <button class="sidebar-btn" onclick="window.toggleTheme()">${getState().theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}</button>
                    <button class="sidebar-btn" onclick="window.toggleLang()">${getState().language === 'ru' ? '🇬🇧 English' : '🇷🇺 Русский'}</button>
                </div>
            </aside>
            <main class="dashboard-main">
                <div class="dashboard-content-wrapper">
                    <header class="mobile-header glass-card"><button class="burger-btn" onclick="window.toggleSidebar()">☰</button><span class="text-gradient fw-bold">Quiz Empire</span><div></div></header>
                    <div class="leaderboard-header glass-card animate-in"><h3 class="mb-0 fw-bold">${t.title || 'Таблица лидеров'}</h3></div>
                    <div class="leaderboard-tabs glass-card animate-in animate-in-delay-1">
                        <button class="lb-tab active" data-tab="global" onclick="window.switchLeaderboard('global', this)">🌍 ${t.global || 'Глобальный'}</button>
                        <button class="lb-tab" data-tab="weekly" onclick="window.switchLeaderboard('weekly', this)">📅 ${t.weekly || 'За неделю'}</button>
                    </div>
                    <div class="leaderboard-list glass-card animate-in animate-in-delay-2" id="leaderboard-list"><div class="text-center py-4"><div class="loading-spinner"></div></div></div>
                </div>
            </main>
        </div>
    `;
}

export async function loadLeaderboard(type = 'global') {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    try {
        const usersRef = collection(db, 'users');
        let q;
        if (type === 'weekly') {
            q = query(usersRef, orderBy('weeklyExperience', 'desc'), limit(50));
        } else {
            q = query(usersRef, orderBy('experience', 'desc'), limit(50));
        }
        const snapshot = await getDocs(q);
        const leaders = [];
        snapshot.forEach(doc => leaders.push({ id: doc.id, ...doc.data() }));
        const currentUserId = auth.currentUser?.uid;
        list.innerHTML = leaders.map((leader, index) => {
            const rank = index + 1;
            const isCurrentUser = leader.id === currentUserId;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
            const displayXP = type === 'weekly' ? (leader.weeklyExperience || 0) : (leader.experience || 0);
            return `<div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''} ${rank <= 3 ? 'top-three' : ''}" onclick="window.viewProfile('${leader.id}')" style="cursor:pointer;"><div class="lb-rank">${medal}</div><div class="lb-avatar">👤</div><div class="lb-info"><span class="lb-name">${leader.nickname || 'Игрок'}</span><span class="lb-level">⭐ Ур. ${leader.level || 1}</span></div><div class="lb-stats"><span class="lb-xp">${displayXP} XP</span><span class="lb-wins">🏆 ${leader.wins || 0}</span></div></div>`;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки лидеров:', error);
        list.innerHTML = '<p class="text-center text-secondary py-4">Ошибка загрузки</p>';
    }
}

window.viewProfile = async (userId) => {
    if (userId === auth.currentUser?.uid) { window.navigateTo('profile'); }
    else { const { loadProfile, renderPublicProfile } = await import('../profile/public-profile.js'); const profile = await loadProfile(userId); if (profile) document.getElementById('app-root').innerHTML = renderPublicProfile(profile, false); }
};

export function attachLeaderboardListeners() {
    loadLeaderboard('global');
    window.switchLeaderboard = (type, el) => { document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active')); el.classList.add('active'); loadLeaderboard(type); };
    window.toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };
    window.closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); };
}