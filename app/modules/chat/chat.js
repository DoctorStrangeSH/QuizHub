import { getState } from '../../store/state.js';
import {
    auth, db, doc, getDoc, setDoc, updateDoc,
    collection, query, orderBy, limit, getDocs,
    addDoc, serverTimestamp, onSnapshot, arrayUnion, arrayRemove
} from '../../firebase-config.js';

let currentChatId = null;
let messagesUnsubscribe = null;
let chatFriend = null;
let currentUserProfile = null;
let replyMessageId = null;
let selectedMessageId = null;
let onlineUnsubscribes = [];
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

// ========== ОТРИСОВКА ==========
export function renderChat() {
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
                    <a class="sidebar-link active" onclick="window.navigateTo('chat'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-chat-dots-fill" aria-hidden="true"></i></span><span>Чат</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('friends'); window.closeSidebar();"><span class="sidebar-link-icon"><i class="bi bi-people-fill" aria-hidden="true"></i></span><span>Друзья</span></a>
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
                <div class="chat-layout">
                    <div class="chat-list-panel glass-card" id="chat-list-panel">
                        <div class="chat-list-header"><span class="chat-kicker">QUIZHUB / СООБЩЕНИЯ</span><h4><i class="bi bi-chat-dots-fill" aria-hidden="true"></i> Чаты</h4></div>
                        <div class="chat-friends-list" id="chat-friends-list"><div class="text-center py-3"><div class="loading-spinner"></div></div></div>
                    </div>
                    <div class="chat-window glass-card" id="chat-window">
                        <div class="chat-window-empty" id="chat-empty">
                            <span class="chat-empty-icon"><i class="bi bi-chat-heart-fill" aria-hidden="true"></i></span>
                            <h4>Выберите чат</h4>
                            <p class="text-secondary">Нажмите на друга, чтобы начать общение</p>
                        </div>
                        <div class="chat-window-active" id="chat-active" style="display:none;">
                            <div class="chat-header">
                                <button class="chat-back-btn" type="button" aria-label="Вернуться к списку чатов" onclick="window.closeChatWindow()"><i class="bi bi-arrow-left" aria-hidden="true"></i></button>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="avatar-circle small" id="chat-friend-avatar"><i class="bi bi-person-fill" aria-hidden="true"></i></div>
                                    <div><span class="fw-semibold" id="chat-friend-name">Друг</span><span class="online-status" id="chat-friend-status"></span></div>
                                </div>
                            </div>
                            <div class="chat-messages" id="chat-messages" role="log" aria-label="История сообщений" aria-live="polite" aria-relevant="additions"><div class="text-center py-3 text-secondary">Загрузка сообщений...</div></div>
                            <div class="chat-input-area">
                                <div class="chat-reply-preview" id="reply-preview" style="display:none;"><span id="reply-text"></span><button type="button" aria-label="Отменить ответ" onclick="window.cancelReply()">✕</button></div>
                                <form class="chat-input-form" id="chat-form">
                                    <input type="text" id="chat-input" class="chat-input" placeholder="Написать сообщение..." aria-label="Текст сообщения" maxlength="2000" autocomplete="off" />
                                    <button type="submit" class="chat-send-btn" aria-label="Отправить сообщение"><i class="bi bi-send-fill" aria-hidden="true"></i></button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
        <div class="context-menu" id="context-menu" style="display:none;">
            <button onclick="window.editMessage()">✏️ Редактировать</button>
            <button onclick="window.deleteMessage()">🗑️ Удалить</button>
            <button onclick="window.replyMessage()">↩️ Ответить</button>
        </div>
    `;
}

// ========== ЗАГРУЗКА ДРУЗЕЙ ==========
export async function loadChatFriends() {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return;
        currentUserProfile = { id: user.uid, ...userDoc.data() };
        const friends = userDoc.data().friends || [];
        const list = document.getElementById('chat-friends-list');
        if (!list) return;
        if (friends.length === 0) { list.innerHTML = '<div class="text-center py-3 text-secondary">Нет друзей для чата</div>'; return; }
        const friendsData = [];
        for (const friendId of friends) {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (friendDoc.exists()) friendsData.push({ id: friendId, ...friendDoc.data() });
        }
        onlineUnsubscribes.forEach(unsubscribe => unsubscribe());
        onlineUnsubscribes = [];
        list.innerHTML = friendsData.map((friend, index) => `
            <button type="button" class="chat-friend-item" data-chat-index="${index}" data-friend-id="${escapeHtml(friend.id)}">
                <span class="avatar-circle small"><i class="bi bi-person-fill" aria-hidden="true"></i></span>
                <span class="chat-friend-info"><span class="fw-semibold">${escapeHtml(friend.nickname || 'Игрок')}</span><span class="online-dot offline" id="online-${escapeHtml(friend.id)}"></span></span>
            </button>
        `).join('');
        list.onclick = event => {
            const button = event.target.closest('[data-chat-index]');
            if (!button || !list.contains(button)) return;
            const friend = friendsData[Number(button.dataset.chatIndex)];
            if (friend) window.openChat(friend.id, friend.nickname || 'Игрок');
        };
        friendsData.forEach(friend => watchOnlineStatus(friend.id));
    } catch (error) { console.error('Ошибка загрузки друзей:', error); }
}

function watchOnlineStatus(friendId) {
    const onlineRef = doc(db, 'online', friendId);
    const unsubscribe = onSnapshot(onlineRef, (snap) => {
        const dot = document.getElementById(`online-${friendId}`);
        if (!dot) return;
        dot.className = snap.exists() && snap.data().online ? 'online-dot online' : 'online-dot offline';
    });
    onlineUnsubscribes.push(unsubscribe);
}

async function setOnlineStatus() {
    const user = auth.currentUser;
    if (!user) return;
    try { await setDoc(doc(db, 'online', user.uid), { online: true, lastSeen: serverTimestamp() }); } catch (e) { }
}

// ========== ОТКРЫТИЕ ЧАТА ==========
window.openChat = async (friendId, friendName) => {
    const user = auth.currentUser;
    if (!user) return;
    if (messagesUnsubscribe) { messagesUnsubscribe(); messagesUnsubscribe = null; }
    currentChatId = [user.uid, friendId].sort().join('_');
    chatFriend = { id: friendId, name: friendName };
    document.getElementById('chat-empty').style.display = 'none';
    document.getElementById('chat-active').style.display = 'flex';
    document.getElementById('chat-friend-name').textContent = friendName;
    if (window.innerWidth <= 768) document.getElementById('chat-list-panel').classList.add('hidden');
    document.querySelectorAll('.chat-friend-item').forEach(el => el.classList.remove('active'));
    const activeItem = Array.from(document.querySelectorAll('.chat-friend-item')).find(el => el.dataset.friendId === friendId);
    if (activeItem) activeItem.classList.add('active');
    loadMessages();
};

window.closeChatWindow = () => {
    document.getElementById('chat-empty').style.display = 'flex';
    document.getElementById('chat-active').style.display = 'none';
    document.getElementById('chat-list-panel').classList.remove('hidden');
    if (messagesUnsubscribe) { messagesUnsubscribe(); messagesUnsubscribe = null; }
    currentChatId = null; chatFriend = null;
    document.querySelectorAll('.chat-friend-item').forEach(el => el.classList.remove('active'));
};

function loadMessages() {
    if (!currentChatId) return;
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '<div class="text-center py-3 text-secondary">Загрузка...</div>';
    const messagesRef = collection(db, 'chats', currentChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));
    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = '';
        if (snapshot.empty) { messagesContainer.innerHTML = '<div class="text-center py-4 text-secondary">Нет сообщений. Напишите первым! 👋</div>'; return; }
        snapshot.forEach(doc => renderMessage({ id: doc.id, ...doc.data() }, messagesContainer));
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

function renderMessage(msg, container) {
    const user = auth.currentUser;
    const isMine = msg.senderId === user.uid;
    const time = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgEl = document.createElement('div');
    msgEl.className = `message-wrapper ${isMine ? 'mine' : 'theirs'}`;
    msgEl.dataset.messageId = msg.id;
    let replyHTML = msg.replyTo ? `<div class="message-reply">↩️ ${escapeHtml(String(msg.replyTo.text ?? '...').substring(0, 50))}</div>` : '';
    let reactionsHTML = msg.reactions && Object.keys(msg.reactions).length > 0 ? `<div class="message-reactions">${Object.values(msg.reactions).map(escapeHtml).join(' ')}</div>` : '';
    const displayText = msg.deleted ? '🗑️ Сообщение удалено' : msg.text;
    msgEl.innerHTML = `
        <div class="message-bubble" oncontextmenu="window.showContextMenu(event, '${msg.id}', ${isMine})">
            ${replyHTML}
            <div class="message-text">${msg.edited ? '<span class="edited-label">(изм.)</span> ' : ''}${escapeHtml(displayText)}</div>
            <div class="message-time">${timeStr}</div>
            ${reactionsHTML}
        </div>
        <div class="message-actions">
            <button class="reaction-btn" onclick="window.addReaction('${msg.id}', '👍')">👍</button>
            <button class="reaction-btn" onclick="window.addReaction('${msg.id}', '❤️')">❤️</button>
            <button class="reaction-btn" onclick="window.addReaction('${msg.id}', '😂')">😂</button>
            <button class="reaction-btn" onclick="window.addReaction('${msg.id}', '😮')">😮</button>
            <button class="reaction-btn" onclick="window.addReaction('${msg.id}', '😢')">😢</button>
        </div>
    `;
    container.appendChild(msgEl);
}

// ========== ОТПРАВКА ==========
window.sendMessage = async (text, replyTo = null) => {
    if (!currentChatId || !text.trim()) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
        await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
            senderId: user.uid, senderName: currentUserProfile?.nickname || 'User',
            text: text.trim(), createdAt: serverTimestamp(), edited: false, replyTo, reactions: {}
        });
        document.getElementById('chat-input').value = '';
        window.cancelReply();
    } catch (error) { console.error('Ошибка отправки:', error); }
};

// ========== КОНТЕКСТНОЕ МЕНЮ ==========
window.showContextMenu = (e, messageId, isMine) => {
    e.preventDefault();
    selectedMessageId = messageId;
    const menu = document.getElementById('context-menu');
    menu.style.display = 'block';
    menu.style.left = Math.max(0, Math.min(e.clientX, window.innerWidth - 190)) + 'px';
    menu.style.top = Math.max(0, Math.min(e.clientY, window.innerHeight - 160)) + 'px';
    const buttons = menu.querySelectorAll('button');
    buttons[0].style.display = isMine ? 'block' : 'none';
    buttons[1].style.display = isMine ? 'block' : 'none';
};
document.addEventListener('click', () => { const menu = document.getElementById('context-menu'); if (menu) menu.style.display = 'none'; });

window.editMessage = () => {
    if (!selectedMessageId || !currentChatId) return;
    const newText = prompt('Редактировать сообщение:');
    if (!newText || !newText.trim()) return;
    updateDoc(doc(db, 'chats', currentChatId, 'messages', selectedMessageId), { text: newText.trim(), edited: true });
};
window.deleteMessage = () => {
    if (!selectedMessageId || !currentChatId) return;
    if (!confirm('Удалить сообщение?')) return;
    updateDoc(doc(db, 'chats', currentChatId, 'messages', selectedMessageId), { text: '🗑️ Сообщение удалено', deleted: true });
};
window.replyMessage = () => {
    replyMessageId = selectedMessageId;
    const msgEl = document.querySelector(`[data-message-id="${selectedMessageId}"] .message-text`);
    const text = msgEl ? msgEl.textContent.substring(0, 100) : '...';
    document.getElementById('reply-text').textContent = '↩️ ' + text;
    document.getElementById('reply-preview').style.display = 'flex';
    document.getElementById('chat-input').focus();
};
window.cancelReply = () => {
    replyMessageId = null;
    document.getElementById('reply-preview').style.display = 'none';
};

// ========== РЕАКЦИИ ==========
window.addReaction = async (messageId, reaction) => {
    const user = auth.currentUser;
    if (!user || !currentChatId) return;
    try {
        const msgRef = doc(db, 'chats', currentChatId, 'messages', messageId);
        const msgSnap = await getDoc(msgRef);
        const reactions = msgSnap.data()?.reactions || {};
        reactions[user.uid] = reactions[user.uid] === reaction ? null : reaction;
        if (!reactions[user.uid]) delete reactions[user.uid];
        await updateDoc(msgRef, { reactions });
    } catch (error) { console.error('Ошибка реакции:', error); }
};

// ========== ОБРАБОТЧИКИ ==========
export function attachChatListeners() {
    loadChatFriends();
    setOnlineStatus();
    const form = document.getElementById('chat-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const text = document.getElementById('chat-input').value;
            let replyTo = null;
            if (replyMessageId) {
                const replyEl = document.querySelector(`[data-message-id="${replyMessageId}"] .message-text`);
                replyTo = { id: replyMessageId, text: replyEl ? replyEl.textContent : '' };
            }
            window.sendMessage(text, replyTo);
        };
    }
    window.toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };
    window.closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); };
}