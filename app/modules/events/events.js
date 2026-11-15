import { getState } from '../../store/state.js';
import { ACTIVE_EVENTS, getActiveEvents } from './events-data.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function renderEvents() {
    const lang = getState().language;
    const isRU = lang === 'ru';
    const activeEvents = getActiveEvents();

    const activeHTML = activeEvents.length > 0 ? activeEvents.map(event => `
        <div class="event-card glass-card animate-in" style="border-left: 4px solid ${event.color};">
            <div class="event-icon">${event.icon}</div>
            <div class="event-info">
                <h4 class="event-name" style="color: ${event.color};">${escapeHtml(isRU ? event.nameRU : event.nameEN)}</h4>
                <p class="event-desc">${escapeHtml(isRU ? event.descRU : event.descEN)}</p>
                ${event.timeLeft ? `<span class="event-time">⏱️ ${escapeHtml(event.timeLeft)}</span>` : ''}
            </div>
            <div class="event-status active"><span class="pulse-dot" aria-hidden="true"></span> ${isRU ? 'Активно' : 'Live'}</div>
        </div>
    `).join('') : `
        <div class="event-card glass-card animate-in"><div class="text-center py-3"><span class="event-empty-icon">📅</span><p class="text-secondary mt-2">Сейчас нет активных событий</p></div></div>
    `;

    const tournamentsHTML = ACTIVE_EVENTS.tournaments.filter(t => t.active).map(tournament => `
        <div class="event-card glass-card animate-in" style="border-left: 4px solid ${tournament.color};">
            <div class="event-icon">${tournament.icon}</div>
            <div class="event-info">
                <h4 class="event-name" style="color: ${tournament.color};">${escapeHtml(isRU ? tournament.nameRU : tournament.nameEN)}</h4>
                <p class="event-desc">${escapeHtml(isRU ? tournament.descRU : tournament.descEN)}</p>
                <div class="tournament-rewards">
                    ${Object.entries(tournament.rewards).map(([place, reward]) => `
                        <span class="reward-badge">${reward.icon} ${escapeHtml(isRU ? reward.nameRU : reward.nameEN)}: ${reward.coins} 🪙</span>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');

    const dailyHTML = ACTIVE_EVENTS.daily.rewards.map((reward, index) => `
        <div class="daily-reward-day glass-card ${index === 0 ? 'first-day' : ''}">
            <span class="daily-reward-icon">${reward.icon}</span>
            <span class="daily-reward-day-num">${isRU ? 'День' : 'Day'} ${reward.day}</span>
            <span class="daily-reward-coins">+${reward.coins} 🪙</span>
        </div>
    `).join('');

    return `
        <div class="dashboard-layout">
            <div class="sidebar-overlay" id="sidebar-overlay" onclick="window.closeSidebar()"></div>
            <aside class="dashboard-sidebar glass-card" id="sidebar">
                <div class="sidebar-header"><div class="sidebar-logo"><i class="bi bi-hexagon-fill" aria-hidden="true"></i></div><h3 class="sidebar-title text-gradient">QuizHub</h3></div>
                <nav class="sidebar-nav">
                    <a class="sidebar-link" onclick="window.navigateTo('home'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-house-door-fill" aria-hidden="true"></i></span><span>Главная</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('chat'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-chat-dots-fill" aria-hidden="true"></i></span><span>Чат</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('friends'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-people-fill" aria-hidden="true"></i></span><span>Друзья</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('leaderboard'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-trophy-fill" aria-hidden="true"></i></span><span>Лидеры</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('achievements'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-award-fill" aria-hidden="true"></i></span><span>Достижения</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('shop'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-bag-fill" aria-hidden="true"></i></span><span>Магазин</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('profile'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-person-circle" aria-hidden="true"></i></span><span>Профиль</span></a>
                    <a class="sidebar-link active" onclick="window.navigateTo('events'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-calendar-event-fill" aria-hidden="true"></i></span><span>События</span></a>
                </nav>
                <div class="sidebar-footer">
                    <button class="sidebar-btn" onclick="window.toggleTheme()">${getState().theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}</button>
                    <button class="sidebar-btn" onclick="window.toggleLang()">${getState().language === 'ru' ? '🇬🇧 English' : '🇷🇺 Русский'}</button>
                </div>
            </aside>
            <main class="dashboard-main">
                <div class="events-page-wrapper">
                    <header class="mobile-header glass-card"><button class="burger-btn" onclick="window.toggleSidebar()">☰</button><span class="text-gradient fw-bold">QuizHub</span><div></div></header>
                    <header class="events-hero glass-card animate-in"><span class="events-eyebrow">QUIZHUB / ИСПЫТАНИЯ</span><h2 class="page-title"><i class="bi bi-stars" aria-hidden="true"></i> ${isRU ? 'События и турниры' : 'Events & tournaments'}</h2><p>${isRU ? 'Временные усиления, серии наград и соревнования сообщества.' : 'Limited-time boosts, rewards, and community challenges.'}</p></header>
                    <section class="events-section animate-in animate-in-delay-1"><h3 class="section-title"><i class="bi bi-lightning-charge-fill" aria-hidden="true"></i> ${isRU ? 'Активные события' : 'Active events'}</h3>${activeHTML}</section>
                    <section class="events-section animate-in animate-in-delay-2"><h3 class="section-title">${ACTIVE_EVENTS.daily.icon} ${isRU ? ACTIVE_EVENTS.daily.nameRU : ACTIVE_EVENTS.daily.nameEN}</h3><p class="event-section-hint">${isRU ? 'Награды за последовательные дни. Выделение не означает, что бонус уже получен.' : 'Consecutive-day rewards. Highlighting does not mean the bonus was claimed.'}</p><div class="daily-rewards-row">${dailyHTML}</div></section>
                    <section class="events-section animate-in animate-in-delay-3"><h3 class="section-title"><i class="bi bi-trophy-fill" aria-hidden="true"></i> ${isRU ? 'Турниры' : 'Tournaments'}</h3>${tournamentsHTML || '<p class="text-secondary">Нет активных турниров</p>'}</section>
                </div>
            </main>
        </div>
    `;
}

export function attachEventsListeners() {
    window.toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };
    window.closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); };
}