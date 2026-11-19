import { getState } from '../../store/state.js';
import { directoryCollection, projectDirectoryProfile } from '../profile/profile-read-source.js';
import { chatIdForUsers } from './chat-transport-gate.js';
import { toggleChatReaction } from './chat-reactions.js';
import { prepareChatMessageEdit, prepareChatMessageDelete } from './chat-message-edits.js';
import {
    auth, db, doc, getDoc, setDoc,
    collection, query, orderBy, limit,
    addDoc, serverTimestamp, onSnapshot, runTransaction
} from '../../firebase-config.js';

let currentChatId = null;
let messagesUnsubscribe = null;
let chatFriend = null;
let currentUserProfile = null;
let replyMessageId = null;
let selectedMessageId = null;
let formSubmitPending = false;
let formSubmitVersion = 0;
let onlineUnsubscribes = [];
let chatLifecycle = 0;
let friendsLoadRevision = 0;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function showChatFriendsError() {
    const list = document.getElementById('chat-friends-list');
    if (!list) return;
    list.innerHTML = '<div class="text-center py-3 text-secondary" role="alert">Не удалось загрузить список друзей.<br><button type="button" class="btn-premium btn-sm mt-2" id="retry-chat-friends">Повторить</button></div>';
    list.querySelector('#retry-chat-friends').addEventListener('click', () => loadChatFriends());
}

function setChatSendStatus(message) {
    const status = document.getElementById('chat-send-status');
    if (status) status.textContent = message;
}

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
                                <p class="chat-send-status" id="chat-send-status" role="status" aria-live="polite"></p>
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
    const lifecycle = chatLifecycle;
    const revision = ++friendsLoadRevision;
    const user = auth.currentUser;
    if (!user) return;
    const loadingList = document.getElementById('chat-friends-list');
    if (loadingList) loadingList.innerHTML = '<div class="text-center py-3"><div class="loading-spinner"></div></div>';
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (lifecycle !== chatLifecycle || revision !== friendsLoadRevision || auth.currentUser?.uid !== user.uid) return;
        if (!userDoc.exists()) {
            showChatFriendsError();
            return;
        }
        currentUserProfile = { nickname: userDoc.data().nickname };
        const friends = userDoc.data().friends || [];
        const list = document.getElementById('chat-friends-list');
        if (!list || lifecycle !== chatLifecycle) return;
        if (friends.length === 0) { list.innerHTML = '<div class="text-center py-3 text-secondary">Нет друзей для чата</div>'; return; }
        const friendsData = [];
        for (const friendId of friends) {
            if (lifecycle !== chatLifecycle || revision !== friendsLoadRevision || auth.currentUser?.uid !== user.uid) return;
            const friendDoc = await getDoc(doc(db, directoryCollection(), friendId));
            if (friendDoc.exists()) {
                try {
                    const publicFriend = projectDirectoryProfile(friendId, friendDoc.data());
                    friendsData.push({ id: publicFriend.uid, nickname: publicFriend.nickname });
                } catch (error) {
                    console.warn('Некорректный публичный профиль друга:', friendId, error);
                }
            }
        }
        onlineUnsubscribes.forEach(unsubscribe => unsubscribe());
        onlineUnsubscribes = [];
        if (lifecycle !== chatLifecycle || revision !== friendsLoadRevision || !list.isConnected || auth.currentUser?.uid !== user.uid) return;
        list.innerHTML = friendsData.length ? friendsData.map((friend, index) => `
            <button type="button" class="chat-friend-item" data-chat-index="${index}" data-friend-id="${escapeHtml(friend.id)}">
                <span class="avatar-circle small"><i class="bi bi-person-fill" aria-hidden="true"></i></span>
                <span class="chat-friend-info"><span class="fw-semibold">${escapeHtml(friend.nickname || 'Игрок')}</span><span class="online-dot offline" id="online-${escapeHtml(friend.id)}"></span></span>
            </button>
        `).join('') : '<div class="text-center py-3 text-secondary">Нет доступных друзей для чата</div>';
        list.onclick = event => {
            const button = event.target.closest('[data-chat-index]');
            if (!button || !list.contains(button)) return;
            const friend = friendsData[Number(button.dataset.chatIndex)];
            if (friend) window.openChat(friend.id, friend.nickname || 'Игрок');
        };
        friendsData.forEach(friend => watchOnlineStatus(friend.id));
    } catch (error) {
        console.error('Ошибка загрузки друзей:', error);
        if (lifecycle === chatLifecycle && revision === friendsLoadRevision && auth.currentUser?.uid === user.uid) showChatFriendsError();
    }
}

function watchOnlineStatus(friendId) {
    const lifecycle = chatLifecycle;
    const viewerUid = auth.currentUser?.uid;
    const onlineRef = doc(db, 'online', friendId);
    const unsubscribe = onSnapshot(onlineRef, (snap) => {
        if (lifecycle !== chatLifecycle || auth.currentUser?.uid !== viewerUid) return;
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
    formSubmitPending = false;
    formSubmitVersion++;
    setChatSendStatus('');
    replyMessageId = null;
    selectedMessageId = null;
    document.getElementById('reply-preview')?.style.setProperty('display', 'none');
    currentChatId = chatIdForUsers(user.uid, friendId);
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
    formSubmitPending = false;
    formSubmitVersion++;
    setChatSendStatus('');
    replyMessageId = null;
    selectedMessageId = null;
    document.getElementById('reply-preview')?.style.setProperty('display', 'none');
    document.getElementById('chat-empty').style.display = 'flex';
    document.getElementById('chat-active').style.display = 'none';
    document.getElementById('chat-list-panel').classList.remove('hidden');
    if (messagesUnsubscribe) { messagesUnsubscribe(); messagesUnsubscribe = null; }
    currentChatId = null; chatFriend = null;
    document.querySelectorAll('.chat-friend-item').forEach(el => el.classList.remove('active'));
};

function loadMessages() {
    if (!currentChatId) return;
    const chatId = currentChatId;
    const lifecycle = chatLifecycle;
    const viewerUid = auth.currentUser?.uid;
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '<div class="text-center py-3 text-secondary">Загрузка...</div>';
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    // Fetch the newest page, then render it oldest-to-newest for chat chronology.
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));
    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        if (lifecycle !== chatLifecycle || currentChatId !== chatId || auth.currentUser?.uid !== viewerUid || !messagesContainer.isConnected) return;
        messagesContainer.innerHTML = '';
        if (snapshot.empty) { messagesContainer.innerHTML = '<div class="text-center py-4 text-secondary">Нет сообщений. Напишите первым! 👋</div>'; return; }
        snapshot.docs.slice().reverse().forEach(messageDoc => {
            renderMessage({ id: messageDoc.id, ...messageDoc.data() }, messagesContainer);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, (error) => {
        console.error('Ошибка подписки на историю сообщений:', error);
        if (lifecycle !== chatLifecycle || currentChatId !== chatId || auth.currentUser?.uid !== viewerUid || !messagesContainer.isConnected) return;
        messagesContainer.innerHTML = '<div class="text-center py-4 text-secondary" role="alert">Не удалось загрузить сообщения.<br><button type="button" class="btn-premium btn-sm mt-2" id="retry-chat-messages">Повторить</button></div>';
        messagesContainer.querySelector('#retry-chat-messages').addEventListener('click', () => {
            if (lifecycle !== chatLifecycle || currentChatId !== chatId || auth.currentUser?.uid !== viewerUid) return;
            if (messagesUnsubscribe) { messagesUnsubscribe(); messagesUnsubscribe = null; }
            loadMessages();
        });
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
        <div class="message-bubble" ${msg.deleted ? '' : `oncontextmenu="window.showContextMenu(event, '${msg.id}', ${isMine})"`}>
            ${replyHTML}
            <div class="message-text">${msg.edited ? '<span class="edited-label">(изм.)</span> ' : ''}${escapeHtml(displayText)}</div>
            <div class="message-time">${timeStr}</div>
            ${reactionsHTML}
        </div>
        ${msg.deleted ? '' : `<div class="message-actions">
            <button type="button" class="reaction-btn" aria-label="Нравится" onclick="window.addReaction('${msg.id}', '👍')">👍</button>
            <button type="button" class="reaction-btn" aria-label="Сердце" onclick="window.addReaction('${msg.id}', '❤️')">❤️</button>
            <button type="button" class="reaction-btn" aria-label="Смешно" onclick="window.addReaction('${msg.id}', '😂')">😂</button>
            <button type="button" class="reaction-btn" aria-label="Удивление" onclick="window.addReaction('${msg.id}', '😮')">😮</button>
            <button type="button" class="reaction-btn" aria-label="Грусть" onclick="window.addReaction('${msg.id}', '😢')">😢</button>
            <button type="button" class="message-more-btn" aria-label="Действия с сообщением" onclick="window.showContextMenu(event, '${msg.id}', ${isMine})">⋯</button>
        </div>`}
    `;
    container.appendChild(msgEl);
}

// ========== ОТПРАВКА ==========
window.sendMessage = async (text, replyTo = null) => {
    if (!currentChatId || !text.trim()) return;
    const user = auth.currentUser;
    if (!user) return;
    const chatId = currentChatId;
    const lifecycle = chatLifecycle;
    setChatSendStatus('');
    try {
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            senderId: user.uid, senderName: currentUserProfile?.nickname || 'User',
            text: text.trim(), createdAt: serverTimestamp(), edited: false, replyTo, reactions: {}
        });
        if (lifecycle !== chatLifecycle || currentChatId !== chatId || auth.currentUser?.uid !== user.uid) return;
        const input = document.getElementById('chat-input');
        // A slow send must not erase a newer draft typed while it was pending.
        if (input?.value === text) {
            input.value = '';
            window.cancelReply();
        }
    } catch (error) {
        console.error('Ошибка отправки:', error);
        if (lifecycle === chatLifecycle && currentChatId === chatId && auth.currentUser?.uid === user.uid) {
            setChatSendStatus('Не удалось отправить сообщение. Текст сохранён — попробуйте ещё раз.');
        }
    }
};

// ========== КОНТЕКСТНОЕ МЕНЮ ==========
window.showContextMenu = (e, messageId, isMine) => {
    e.preventDefault();
    e.stopPropagation();
    selectedMessageId = messageId;
    const menu = document.getElementById('context-menu');
    menu.style.display = 'block';
    menu.style.left = Math.max(0, Math.min(e.clientX, window.innerWidth - 190)) + 'px';
    menu.style.top = Math.max(0, Math.min(e.clientY, window.innerHeight - 160)) + 'px';
    const buttons = menu.querySelectorAll('button');
    buttons[0].style.display = isMine ? 'block' : 'none';
    buttons[1].style.display = isMine ? 'block' : 'none';
    Array.from(buttons).find(button => button.style.display !== 'none')?.focus();
};
document.addEventListener('click', () => { const menu = document.getElementById('context-menu'); if (menu) menu.style.display = 'none'; });
document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const menu = document.getElementById('context-menu');
    if (menu) menu.style.display = 'none';
});

window.editMessage = async () => {
    if (!selectedMessageId || !currentChatId) return;
    const newText = prompt('Редактировать сообщение:');
    if (!newText || !newText.trim()) return;
    if (newText.trim().length > 2000) {
        setChatSendStatus('Сообщение не может быть длиннее 2000 символов.');
        return;
    }
    const chatId = currentChatId;
    const lifecycle = chatLifecycle;
    const userUid = auth.currentUser?.uid;
    const messageId = selectedMessageId;
    try {
        const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
        await runTransaction(db, async transaction => {
            const snapshot = await transaction.get(msgRef);
            const change = prepareChatMessageEdit(snapshot.exists() ? snapshot.data() : null, userUid, newText);
            transaction.update(msgRef, change);
        });
        if (lifecycle === chatLifecycle && currentChatId === chatId && auth.currentUser?.uid === userUid) setChatSendStatus('');
    } catch (error) {
        console.error('Ошибка редактирования сообщения:', error);
        if (lifecycle === chatLifecycle && currentChatId === chatId && auth.currentUser?.uid === userUid) {
            setChatSendStatus('Не удалось изменить сообщение. Попробуйте ещё раз.');
        }
    }
};
window.deleteMessage = async () => {
    if (!selectedMessageId || !currentChatId) return;
    if (!confirm('Удалить сообщение?')) return;
    const chatId = currentChatId;
    const lifecycle = chatLifecycle;
    const userUid = auth.currentUser?.uid;
    const messageId = selectedMessageId;
    try {
        const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
        await runTransaction(db, async transaction => {
            const snapshot = await transaction.get(msgRef);
            const change = prepareChatMessageDelete(snapshot.exists() ? snapshot.data() : null, userUid);
            transaction.update(msgRef, change);
        });
        if (lifecycle === chatLifecycle && currentChatId === chatId && auth.currentUser?.uid === userUid) setChatSendStatus('');
    } catch (error) {
        console.error('Ошибка удаления сообщения:', error);
        if (lifecycle === chatLifecycle && currentChatId === chatId && auth.currentUser?.uid === userUid) {
            setChatSendStatus('Не удалось удалить сообщение. Попробуйте ещё раз.');
        }
    }
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
    const chatId = currentChatId;
    const lifecycle = chatLifecycle;
    try {
        const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
        await runTransaction(db, async transaction => {
            const msgSnap = await transaction.get(msgRef);
            if (!msgSnap.exists() || msgSnap.data().deleted) throw new Error('MESSAGE_UNAVAILABLE');
            const reactions = toggleChatReaction(msgSnap.data().reactions, user.uid, reaction);
            transaction.update(msgRef, { reactions });
        });
        if (lifecycle === chatLifecycle && currentChatId === chatId && auth.currentUser?.uid === user.uid) setChatSendStatus('');
    } catch (error) {
        console.error('Ошибка реакции:', error);
        if (lifecycle === chatLifecycle && currentChatId === chatId && auth.currentUser?.uid === user.uid) {
            setChatSendStatus('Не удалось изменить реакцию. Попробуйте ещё раз.');
        }
    }
};

// ========== ОБРАБОТЧИКИ ==========
export function cleanupChatListeners() {
    chatLifecycle++;
    friendsLoadRevision++;
    formSubmitPending = false;
    formSubmitVersion++;
    if (messagesUnsubscribe) { messagesUnsubscribe(); messagesUnsubscribe = null; }
    onlineUnsubscribes.forEach(unsubscribe => unsubscribe());
    onlineUnsubscribes = [];
    currentChatId = null;
    chatFriend = null;
    currentUserProfile = null;
    replyMessageId = null;
    selectedMessageId = null;
}

export function attachChatListeners() {
    cleanupChatListeners();
    loadChatFriends();
    setOnlineStatus();
    const form = document.getElementById('chat-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            if (formSubmitPending) return;
            const text = document.getElementById('chat-input').value;
            if (!text.trim()) return;
            let replyTo = null;
            if (replyMessageId) {
                const replyEl = document.querySelector(`[data-message-id="${replyMessageId}"] .message-text`);
                replyTo = { id: replyMessageId, text: replyEl ? replyEl.textContent : '' };
            }
            formSubmitPending = true;
            const lifecycle = chatLifecycle;
            const submitVersion = ++formSubmitVersion;
            Promise.resolve(window.sendMessage(text, replyTo)).finally(() => {
                if (lifecycle === chatLifecycle && submitVersion === formSubmitVersion) formSubmitPending = false;
            });
        };
    }
    window.toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };
    window.closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); };
}
