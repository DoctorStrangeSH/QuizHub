import { getState } from '../../store/state.js';
import { ACTIVE_EVENTS, getActiveEvents } from './events-data.js';

export function renderEvents() {
    const lang = getState().language;
    const isRU = lang === 'ru';
    const activeEvents = getActiveEvents();

    const activeHTML = activeEvents.length > 0 ? activeEvents.map(event => `
        <div class="event-card glass-card animate-in" style="border-left: 4px solid ${event.color};">
            <div class="event-icon">${event.icon}</div>
            <div class="event-info">
                <h4 class="event-name" style="color: ${event.color};">${isRU ? event.nameRU : event.nameEN}</h4>
                <p class="event-desc">${isRU ? event.descRU : event.descEN}</p>
                ${event.timeLeft ? `<span class="event-time">⏱️ ${event.timeLeft}</span>` : ''}
            </div>
            <div class="event-status active"><span class="pulse-dot"></span> Активно</div>
        </div>
    `).join('') : `
        <div class="event-card glass-card animate-in"><div class="text-center py-3"><span class="event-empty-icon">📅</span><p class="text-secondary mt-2">Сейчас нет активных событий</p></div></div>
    `;

    const tournamentsHTML = ACTIVE_EVENTS.tournaments.filter(t => t.active).map(tournament => `
        <div class="event-card glass-card animate-in" style="border-left: 4px solid ${tournament.color};">
            <div class="event-icon">${tournament.icon}</div>
            <div class="event-info">
                <h4 class="event-name" style="color: ${tournament.color};">${isRU ? tournament.nameRU : tournament.nameEN}</h4>
                <p class="event-desc">${isRU ? tournament.descRU : tournament.descEN}</p>
                <div class="tournament-rewards">
                    ${Object.entries(tournament.rewards).map(([place, reward]) => `
                        <span class="reward-badge">${reward.icon} ${isRU ? reward.nameRU : reward.nameEN}: ${reward.coins} 🪙</span>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');

    const dailyHTML = ACTIVE_EVENTS.daily.rewards.map((reward, index) => `
        <div class="daily-reward-day glass-card ${index === 0 ? 'today' : ''}">
            <span class="daily-reward-icon">${reward.icon}</span>
            <span class="daily-reward-day-num">День ${reward.day}</span>
            <span class="daily-reward-coins">+${reward.coins} 🪙</span>
        </div>
    `).join('');

    return `
        <div class="dashboard-layout">
            <div class="sidebar-overlay" id="sidebar-overlay" onclick="window.closeSidebar()"></div>
            <aside class="dashboard-sidebar glass-card" id="sidebar">
                <div class="sidebar-header"><div class="sidebar-logo">👑</div><h3 class="sidebar-title text-gradient">Quiz Empire</h3></div>
                <nav class="sidebar-nav">
                    <a class="sidebar-link" onclick="window.navigateTo('home'); window.closeSidebar();"><span class="sidebar-link-icon">🏠</span><span>Главная</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('chat'); window.closeSidebar();"><span class="sidebar-link-icon">💬</span><span>Чат</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('friends'); window.closeSidebar();"><span class="sidebar-link-icon">👥</span><span>Друзья</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('leaderboard'); window.closeSidebar();"><span class="sidebar-link-icon">🏅</span><span>Лидеры</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('achievements'); window.closeSidebar();"><span class="sidebar-link-icon">🏆</span><span>Достижения</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('shop'); window.closeSidebar();"><span class="sidebar-link-icon">🛒</span><span>Магазин</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('profile'); window.closeSidebar();"><span class="sidebar-link-icon">👤</span><span>Профиль</span></a>
                    <a class="sidebar-link active" onclick="window.navigateTo('events'); window.closeSidebar();"><span class="sidebar-link-icon">📅</span><span>События</span></a>
                </nav>
                <div class="sidebar-footer">
                    <button class="sidebar-btn" onclick="window.toggleTheme()">${getState().theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}</button>
                    <button class="sidebar-btn" onclick="window.toggleLang()">${getState().language === 'ru' ? '🇬🇧 English' : '🇷🇺 Русский'}</button>
                </div>
            </aside>
            <main class="dashboard-main">
                <div class="events-page-wrapper">
                    <header class="mobile-header glass-card"><button class="burger-btn" onclick="window.toggleSidebar()">☰</button><span class="text-gradient fw-bold">Quiz Empire</span><div></div></header>
                    <h2 class="page-title animate-in">📅 События и турниры</h2>
                    <section class="events-section animate-in animate-in-delay-1"><h3 class="section-title">⚡ Активные события</h3>${activeHTML}</section>
                    <section class="events-section animate-in animate-in-delay-2"><h3 class="section-title">${ACTIVE_EVENTS.daily.icon} ${isRU ? ACTIVE_EVENTS.daily.nameRU : ACTIVE_EVENTS.daily.nameEN}</h3><div class="daily-rewards-row">${dailyHTML}</div></section>
                    <section class="events-section animate-in animate-in-delay-3"><h3 class="section-title">🏆 Турниры</h3>${tournamentsHTML || '<p class="text-secondary">Нет активных турниров</p>'}</section>
                </div>
            </main>
        </div>
    `;
}

export function attachEventsListeners() {
    window.toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };
    window.closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); };
}