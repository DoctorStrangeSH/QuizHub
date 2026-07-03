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

// ========== ОТРИСОВКА ==========
export function renderChat() {
    return `
        <div class="dashboard-layout">
            <div class="sidebar-overlay" id="sidebar-overlay" onclick="window.closeSidebar()"></div>
            <aside class="dashboard-sidebar glass-card" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">👑</div>
                    <h3 class="sidebar-title text-gradient">Quiz Empire</h3>
                </div>
                <nav class="sidebar-nav">
                    <a class="sidebar-link" onclick="window.navigateTo('home'); window.closeSidebar();"><span class="sidebar-link-icon">🏠</span><span>Главная</span></a>
                    <a class="sidebar-link active" onclick="window.navigateTo('chat'); window.closeSidebar();"><span class="sidebar-link-icon">💬</span><span>Чат</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('friends'); window.closeSidebar();"><span class="sidebar-link-icon">👥</span><span>Друзья</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('leaderboard'); window.closeSidebar();"><span class="sidebar-link-icon">🏅</span><span>Лидеры</span></a>
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
                <div class="chat-layout">
                    <div class="chat-list-panel glass-card" id="chat-list-panel">
                        <div class="chat-list-header"><h4>💬 Чаты</h4></div>
                        <div class="chat-friends-list" id="chat-friends-list"><div class="text-center py-3"><div class="loading-spinner"></div></div></div>
                    </div>
                    <div class="chat-window glass-card" id="chat-window">
                        <div class="chat-window-empty" id="chat-empty">
                            <span class="chat-empty-icon">💬</span>
                            <h4>Выберите чат</h4>
                            <p class="text-secondary">Нажмите на друга, чтобы начать общение</p>
                        </div>
                        <div class="chat-window-active" id="chat-active" style="display:none;">
                            <div class="chat-header">
                                <button class="chat-back-btn" onclick="window.closeChatWindow()">←</button>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="avatar-circle small" id="chat-friend-avatar">👤</div>
                                    <div><span class="fw-semibold" id="chat-friend-name">Друг</span><span class="online-status" id="chat-friend-status"></span></div>
                                </div>
                            </div>
                            <div class="chat-messages" id="chat-messages"><div class="text-center py-3 text-secondary">Загрузка сообщений...</div></div>
                            <div class="chat-input-area">
                                <div class="chat-reply-preview" id="reply-preview" style="display:none;"><span id="reply-text"></span><button onclick="window.cancelReply()">✕</button></div>
                                <form class="chat-input-form" id="chat-form">
                                    <input type="text" id="chat-input" class="chat-input" placeholder="Сообщение..." autocomplete="off" />
                                    <button type="submit" class="chat-send-btn">📨</button>
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
        list.innerHTML = friendsData.map(f => `
            <div class="chat-friend-item" onclick="window.openChat('${f.id}', '${f.nickname}')" data-friend-id="${f.id}">
                <div class="avatar-circle small">👤</div>
                <div class="chat-friend-info"><span class="fw-semibold">${f.nickname}</span><span class="online-dot offline" id="online-${f.id}"></span></div>
            </div>
        `).join('');
        friendsData.forEach(f => watchOnlineStatus(f.id));
    } catch (error) { console.error('Ошибка загрузки друзей:', error); }
}

function watchOnlineStatus(friendId) {
    const onlineRef = doc(db, 'online', friendId);
    onSnapshot(onlineRef, (snap) => {
        const dot = document.getElementById(`online-${friendId}`);
        if (!dot) return;
        dot.className = snap.exists() && snap.data().online ? 'online-dot online' : 'online-dot offline';
    });
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
    const activeItem = document.querySelector(`[data-friend-id="${friendId}"]`);
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
    let replyHTML = msg.replyTo ? `<div class="message-reply">↩️ ${msg.replyTo.text?.substring(0, 50) || '...'}</div>` : '';
    let reactionsHTML = msg.reactions && Object.keys(msg.reactions).length > 0 ? `<div class="message-reactions">${Object.values(msg.reactions).join(' ')}</div>` : '';
    const displayText = msg.deleted ? '🗑️ Сообщение удалено' : msg.text;
    msgEl.innerHTML = `
        <div class="message-bubble" oncontextmenu="window.showContextMenu(event, '${msg.id}', ${isMine})">
            ${replyHTML}
            <div class="message-text">${msg.edited ? '<span class="edited-label">(изм.)</span> ' : ''}${displayText}</div>
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
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    const buttons = menu.querySelectorAll('button');
    buttons[0].style.display = isMine ? 'block' : 'none';
    buttons[1].style.display = isMine ? 'block' : 'none';
};
document.addEventListener('click', () => { document.getElementById('context-menu').style.display = 'none'; });

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