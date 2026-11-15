import { getState } from '../../store/state.js';
import { auth, db, doc, getDoc, collection, query, orderBy, limit, getDocs } from '../../firebase-config.js';
import { buildPublicProfile } from '../profile/public-profile-data.js';

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

// Migration gate: enabled only after publicProfiles has been fully backfilled
// and its read rules have been verified. The legacy collection remains in use.
const PUBLIC_PROFILE_READS_ENABLED = false;


export function renderLeaderboard() {
    const t = getState().translations.leaderboard || {};
    return `
        <div class="dashboard-layout">
            <div class="sidebar-overlay" id="sidebar-overlay" onclick="window.closeSidebar()"></div>
            <aside class="dashboard-sidebar glass-card" id="sidebar">
                <div class="sidebar-header"><div class="sidebar-logo arcade-mark" aria-hidden="true"><i class="bi bi-hexagon-fill"></i><span>Q</span></div><h3 class="sidebar-title text-gradient">QuizHub</h3></div>
                <nav class="sidebar-nav">
                    <a class="sidebar-link" onclick="window.navigateTo('home'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-house-door-fill"></i></span><span>Главная</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('chat'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-chat-dots-fill"></i></span><span>Чат</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('friends'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-people-fill"></i></span><span>Друзья</span></a>
                    <a class="sidebar-link active" onclick="window.navigateTo('leaderboard'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-trophy-fill"></i></span><span>Лидеры</span></a>
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
                    <header class="mobile-header glass-card"><button class="burger-btn" type="button" aria-label="Открыть меню" aria-controls="sidebar" aria-expanded="false" onclick="window.toggleSidebar()"><i class="bi bi-list" aria-hidden="true"></i></button><span class="text-gradient fw-bold">QuizHub</span><div></div></header>
                    <div class="leaderboard-header glass-card animate-in"><div class="collection-eyebrow"><i class="bi bi-lightning-charge-fill" aria-hidden="true"></i> АРЕНА ЗНАНИЙ</div><h3 class="mb-0 fw-bold">${t.title || 'Таблица лидеров'}</h3><p class="collection-subtitle">Каждое правильное решение приближает к вершине.</p></div>
                    <div class="leaderboard-tabs glass-card animate-in animate-in-delay-1" role="tablist" aria-label="Период рейтинга">
                        <button class="lb-tab active" role="tab" aria-selected="true" data-tab="global" onclick="window.switchLeaderboard('global', this)">🌍 ${t.global || 'Глобальный'}</button>
                        <button class="lb-tab" role="tab" aria-selected="false" data-tab="weekly" onclick="window.switchLeaderboard('weekly', this)">📅 ${t.weekly || 'За неделю'}</button>
                    </div>
                    <div class="leaderboard-list glass-card animate-in animate-in-delay-2" id="leaderboard-list" role="tabpanel"><div class="text-center py-4"><div class="loading-spinner"></div></div></div>
                </div>
            </main>
        </div>
    `;
}

export async function loadLeaderboard(type = 'global') {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    try {
        const source = PUBLIC_PROFILE_READS_ENABLED ? 'publicProfiles' : 'users';
        const usersRef = collection(db, source);
        const scoreField = type === 'weekly' ? 'weeklyExperience' : 'experience';
        const snapshot = await getDocs(query(usersRef, orderBy(scoreField, 'desc'), limit(50)));
        const leaders = [];
        snapshot.forEach(userDoc => {
            try {
                const profile = buildPublicProfile(userDoc.id, userDoc.data());
                leaders.push({ id: profile.uid, ...profile });
            } catch (error) {
                console.warn('Пропускаем повреждённый публичный профиль:', userDoc.id);
            }
        });
        const currentUserId = auth.currentUser?.uid;
        list.innerHTML = leaders.map((leader, index) => {
            const rank = index + 1;
            const isCurrentUser = leader.id === currentUserId;
            const medal = rank <= 3 ? `<i class="bi bi-trophy-fill" aria-hidden="true"></i><span class="lb-rank-number">${rank}</span>` : rank;
            const displayXP = type === 'weekly' ? (leader.weeklyExperience || 0) : (leader.experience || 0);
            return `<div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''} ${rank <= 3 ? 'top-three' : ''} rank-${rank}" data-profile-id="${escapeHTML(leader.id)}" role="button" tabindex="0" aria-label="${escapeHTML(leader.nickname || 'Игрок')}"><div class="lb-rank">${medal}</div><div class="lb-avatar"><i class="bi bi-person-fill" aria-hidden="true"></i></div><div class="lb-info"><span class="lb-name">${escapeHTML(leader.nickname || 'Игрок')}</span><span class="lb-level">⭐ Ур. ${leader.level || 1}</span></div><div class="lb-stats"><span class="lb-xp">${displayXP} XP</span><span class="lb-wins">🏆 ${leader.wins || 0}</span></div></div>`;
        }).join('') || '<p class="text-center text-secondary py-4">Пока нет участников рейтинга</p>';
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
    window.switchLeaderboard = (type, el) => { document.querySelectorAll('.lb-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); }); el.classList.add('active'); el.setAttribute('aria-selected', 'true'); loadLeaderboard(type); };
    const list = document.getElementById('leaderboard-list');
    const openRankedProfile = (event) => {
        const item = event.target.closest?.('[data-profile-id]');
        if (!item || !list?.contains(item)) return;
        if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
        if (event.type === 'keydown') event.preventDefault();
        window.viewProfile(item.dataset.profileId);
    };
    list?.addEventListener('click', openRankedProfile);
    list?.addEventListener('keydown', openRankedProfile);
    window.toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };
    window.closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); };
}