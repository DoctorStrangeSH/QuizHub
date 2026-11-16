import { getState } from '../../store/state.js';
import { directoryCollection, profileCollectionForViewer } from '../profile/profile-read-source.js';
import { auth, db, doc, getDoc, updateDoc, collection, query, where, getDocs, arrayUnion, arrayRemove } from '../../firebase-config.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function renderFriends() {
    const t = getState().translations.friends || {};

    return `
        <div class="dashboard-layout">
            <div class="sidebar-overlay" id="sidebar-overlay" onclick="window.closeSidebar()"></div>
            <aside class="dashboard-sidebar glass-card" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo"><i class="bi bi-hexagon-fill" aria-hidden="true"></i></div>
                    <h3 class="sidebar-title text-gradient">QuizHub</h3>
                </div>
                <nav class="sidebar-nav">
                    <a class="sidebar-link" onclick="window.navigateTo('home'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-house-door-fill" aria-hidden="true"></i></span><span>Главная</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('chat'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-chat-dots-fill" aria-hidden="true"></i></span><span>Чат</span></a>
                    <a class="sidebar-link active" onclick="window.navigateTo('friends'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-people-fill" aria-hidden="true"></i></span><span>Друзья</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('leaderboard'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-trophy-fill" aria-hidden="true"></i></span><span>Лидеры</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('achievements'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-award-fill" aria-hidden="true"></i></span><span>Достижения</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('shop'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-bag-fill" aria-hidden="true"></i></span><span>Магазин</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('profile'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-person-circle" aria-hidden="true"></i></span><span>Профиль</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('events'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-calendar-event-fill" aria-hidden="true"></i></span><span>События</span></a>
                </nav>
                <div class="sidebar-footer">
                    <button class="sidebar-btn" onclick="window.toggleTheme()">${getState().theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}</button>
                    <button class="sidebar-btn" onclick="window.toggleLang()">${getState().language === 'ru' ? '🇬🇧 English' : '🇷🇺 Русский'}</button>
                </div>
            </aside>
            <main class="dashboard-main">
                <div class="dashboard-content-wrapper">
                    <header class="mobile-header glass-card">
                        <button class="burger-btn" onclick="window.toggleSidebar()">☰</button>
                        <span class="text-gradient fw-bold">QuizHub</span>
                        <div></div>
                    </header>
                    <div class="friends-header glass-card animate-in"><span class="friends-kicker">QUIZHUB / СОЦИАЛЬНЫЙ КЛУБ</span><h3 class="mb-0 fw-bold"><i class="bi bi-people-fill" aria-hidden="true"></i> ${escapeHtml(t.title || 'Друзья')}</h3><p class="friends-intro">Собирайте команду, принимайте приглашения и соревнуйтесь вместе.</p></div>
                    <div class="search-section glass-card animate-in animate-in-delay-1">
                        <div class="input-group-custom">
                            <input type="search" id="friend-search-input" class="input-glass" aria-label="Поиск игроков по имени" placeholder="${escapeHtml(t.searchPlaceholder || 'Найти игрока по нику...')}" autocomplete="off" />
                            <button id="search-friend-btn" class="btn-premium"><i class="bi bi-search" aria-hidden="true"></i> ${escapeHtml(t.search || 'Найти')}</button>
                        </div>
                        <div id="search-results" class="search-results mt-3" aria-live="polite"></div>
                    </div>
                    <div class="friends-tabs glass-card animate-in animate-in-delay-2">
                        <div class="tab-buttons" role="tablist" aria-label="Друзья и заявки">
                            <button type="button" role="tab" aria-selected="true" aria-controls="tab-content" class="tab-btn active" data-tab="friends">${escapeHtml(t.myFriends || 'Друзья')}</button>
                            <button type="button" role="tab" aria-selected="false" aria-controls="tab-content" class="tab-btn" data-tab="requests">${escapeHtml(t.requests || 'Заявки')}</button>
                            <button type="button" role="tab" aria-selected="false" aria-controls="tab-content" class="tab-btn" data-tab="sent">${escapeHtml(t.sent || 'Отправленные')}</button>
                        </div>
                        <div id="tab-content" class="tab-content mt-3" role="tabpanel" aria-live="polite"></div>
                    </div>
                </div>
            </main>
        </div>
    `;
}

export function attachFriendsListeners() {
    const user = auth.currentUser;
    if (!user) return;
    loadFriendsList(user);
    setupSearch(user);
    setupTabs(user);
    window.toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };
    window.closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); };
}

async function loadFriendsList(user) {
    const tabContent = document.getElementById('tab-content');
    if (!tabContent) return;
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return;
        const friends = userDoc.data().friends || [];
        if (friends.length === 0) { tabContent.innerHTML = '<div class="text-center py-4"><span class="empty-icon"><i class="bi bi-people" aria-hidden="true"></i></span><p class="text-secondary mt-2">У вас пока нет друзей</p></div>'; return; }
        const friendsData = [];
        for (const friendId of friends) {
            const friendDoc = await getDoc(doc(db, profileCollectionForViewer(user.uid, friendId), friendId));
            if (friendDoc.exists()) friendsData.push({ id: friendId, ...friendDoc.data() });
        }
        tabContent.innerHTML = friendsData.map(f => `
            <div class="friend-item glass-card">
                <div class="d-flex align-items-center gap-3"><div class="avatar-circle"><i class="bi bi-person-fill" aria-hidden="true"></i></div><div><span class="fw-semibold">${escapeHtml(f.nickname || 'Игрок')}</span><span class="text-secondary small ms-2">Ур. ${Number.isFinite(Number(f.level)) ? Math.max(1, Math.trunc(Number(f.level))) : 1}</span></div></div>
                <button class="btn-remove" onclick="window.removeFriend('${f.id}')">Удалить</button>
            </div>
        `).join('');
    } catch (error) { console.error('Ошибка загрузки друзей:', error); }
}

async function loadFriendRequests(user) {
    const tabContent = document.getElementById('tab-content');
    if (!tabContent) return;
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return;
        const requests = userDoc.data().friendRequests || [];
        if (requests.length === 0) { tabContent.innerHTML = '<div class="text-center py-4"><span class="empty-icon"><i class="bi bi-envelope-paper" aria-hidden="true"></i></span><p class="text-secondary mt-2">Нет входящих заявок</p></div>'; return; }
        const requestsData = [];
        for (const reqId of requests) {
            const reqDoc = await getDoc(doc(db, profileCollectionForViewer(user.uid, reqId), reqId));
            if (reqDoc.exists()) requestsData.push({ id: reqId, ...reqDoc.data() });
        }
        tabContent.innerHTML = requestsData.map(r => `
            <div class="friend-item glass-card">
                <div class="d-flex align-items-center gap-3"><div class="avatar-circle"><i class="bi bi-person-fill" aria-hidden="true"></i></div><div><span class="fw-semibold">${escapeHtml(r.nickname || 'Игрок')}</span><span class="text-secondary small ms-2">Ур. ${Number.isFinite(Number(r.level)) ? Math.max(1, Math.trunc(Number(r.level))) : 1}</span></div></div>
                <div class="d-flex gap-2"><button class="btn-accept" onclick="window.acceptRequest('${r.id}')">Принять</button><button class="btn-decline" onclick="window.declineRequest('${r.id}')">Отклонить</button></div>
            </div>
        `).join('');
    } catch (error) { console.error('Ошибка загрузки заявок:', error); }
}

async function loadSentRequests(user) {
    const tabContent = document.getElementById('tab-content');
    if (!tabContent) return;
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return;
        const sent = userDoc.data().sentRequests || [];
        if (sent.length === 0) { tabContent.innerHTML = '<div class="text-center py-4"><span class="empty-icon"><i class="bi bi-send" aria-hidden="true"></i></span><p class="text-secondary mt-2">Нет отправленных заявок</p></div>'; return; }
        const sentData = [];
        for (const sentId of sent) {
            const sentDoc = await getDoc(doc(db, profileCollectionForViewer(user.uid, sentId), sentId));
            if (sentDoc.exists()) sentData.push({ id: sentId, ...sentDoc.data() });
        }
        tabContent.innerHTML = sentData.map(s => `
            <div class="friend-item glass-card">
                <div class="d-flex align-items-center gap-3"><div class="avatar-circle"><i class="bi bi-person-fill" aria-hidden="true"></i></div><div><span class="fw-semibold">${escapeHtml(s.nickname || 'Игрок')}</span><span class="text-secondary small ms-2">Ур. ${Number.isFinite(Number(s.level)) ? Math.max(1, Math.trunc(Number(s.level))) : 1}</span></div></div>
                <span class="text-secondary small">Ожидает</span>
            </div>
        `).join('');
    } catch (error) { console.error('Ошибка загрузки отправленных:', error); }
}

function setupSearch(user) {
    const searchBtn = document.getElementById('search-friend-btn');
    const searchInput = document.getElementById('friend-search-input');
    const resultsDiv = document.getElementById('search-results');
    if (!searchBtn || !searchInput || !resultsDiv) return;
    searchInput.addEventListener('keydown', event => { if (event.key === 'Enter') searchBtn.click(); });
    searchBtn.onclick = async () => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) return;
        resultsDiv.innerHTML = '<p class="text-secondary small">Поиск...</p>';
        const usersRef = collection(db, directoryCollection());
        const qQuery = query(usersRef, where('nicknameLower', '>=', q), where('nicknameLower', '<=', q + '\uf8ff'));
        let snapshot;
        try { snapshot = await getDocs(qQuery); }
        catch (error) { console.error('Ошибка поиска игроков:', error); resultsDiv.innerHTML = '<p class="text-secondary small">Не удалось выполнить поиск. Попробуйте ещё раз.</p>'; return; }
        if (snapshot.empty) { resultsDiv.innerHTML = '<p class="text-secondary small">Никого не найдено</p>'; return; }
        resultsDiv.innerHTML = '';
        snapshot.forEach(docSnap => {
            if (docSnap.id !== user.uid) {
                const data = docSnap.data();
                resultsDiv.innerHTML += `<div class="search-result-item glass-card"><div class="d-flex align-items-center gap-2"><span class="fw-semibold">${escapeHtml(data.nickname || 'Игрок')}</span><span class="text-secondary small">Ур. ${Number.isFinite(Number(data.level)) ? Math.max(1, Math.trunc(Number(data.level))) : 1}</span></div><button class="btn-premium btn-sm" onclick="window.sendFriendRequest('${docSnap.id}')">Добавить</button></div>`;
            }
        });
    };
}

function setupTabs(user) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
            const tabName = tab.dataset.tab;
            if (tabName === 'friends') loadFriendsList(user);
            else if (tabName === 'requests') loadFriendRequests(user);
            else loadSentRequests(user);
        };
    });
}

window.sendFriendRequest = async (friendId) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await updateDoc(doc(db, 'users', friendId), { friendRequests: arrayUnion(user.uid) });
        await updateDoc(doc(db, 'users', user.uid), { sentRequests: arrayUnion(friendId) });
        alert('Заявка отправлена!');
    } catch (error) { alert('Ошибка: ' + error.message); }
};
window.acceptRequest = async (friendId) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await updateDoc(doc(db, 'users', user.uid), { friends: arrayUnion(friendId), friendRequests: arrayRemove(friendId) });
        await updateDoc(doc(db, 'users', friendId), { friends: arrayUnion(user.uid), sentRequests: arrayRemove(user.uid) });
        loadFriendRequests(user);
    } catch (error) { alert('Ошибка: ' + error.message); }
};
window.declineRequest = async (friendId) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await updateDoc(doc(db, 'users', user.uid), { friendRequests: arrayRemove(friendId) });
        await updateDoc(doc(db, 'users', friendId), { sentRequests: arrayRemove(user.uid) });
        loadFriendRequests(user);
    } catch (error) { alert('Ошибка: ' + error.message); }
};
window.removeFriend = async (friendId) => {
    const user = auth.currentUser;
    if (!user || !confirm('Удалить из друзей?')) return;
    try {
        await updateDoc(doc(db, 'users', user.uid), { friends: arrayRemove(friendId) });
        await updateDoc(doc(db, 'users', friendId), { friends: arrayRemove(user.uid) });
        loadFriendsList(user);
    } catch (error) { alert('Ошибка: ' + error.message); }
};