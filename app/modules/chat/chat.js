import { getState } from '../../store/state.js';
import { renderMessageReadState } from './chat-read-indicator.js';
import { createFirebaseChatTransport } from './firebase-chat-transport.js';
import { createDirectChatId, renderUnreadBadge } from './chat-unread-badges.js';
import { chatTimestampDate, normalizeChatHistoryPage, mergeChatHistoryMessages, latestIncomingMessageId, formatProjectedReactions, createChatMessageId } from './chat-preview-history.js';
import {
    auth, db, functions, httpsCallable, doc, getDoc, setDoc, updateDoc,
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
let chatLifecycle = 0;
let chatPreviewTransport = null;
let previewChatId = null;
let previewHistoryCursor = null;
let previewHasMore = false;
let previewMessages = [];
let previewLastMarkedReadId = null;
let previewRefreshTimer = null;
let previewLoadingToken = null;
let conversationToken = 0;
let chatFriendsCache = [];
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
                        <div class="chat-list-header"><span class="chat-kicker">QUIZHUB / СООБЩЕНИЯ</span><h4><i class="bi bi-chat-dots-fill" aria-hidden="true"></i> Чаты <span id="chat-total-unread" class="chat-unread-total" aria-label="Всего непрочитанных сообщений"></span></h4></div>
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

async function refreshUnreadBadges(friends, lifecycle) {
    const totalBadge = document.getElementById('chat-total-unread');
    if (!chatPreviewTransport || !totalBadge || !auth.currentUser) return;
    const results = await Promise.all(friends.map(async friend => {
        try {
            const chatId = await createDirectChatId(auth.currentUser.uid, friend.id);
            const result = await chatPreviewTransport.getUnreadCount({ chatId });
            const count = Number.isSafeInteger(result?.unreadCount) && result.unreadCount > 0 ? result.unreadCount : 0;
            return { friendId: friend.id, count };
        } catch { return { friendId: friend.id, count: 0 }; }
    }));
    if (lifecycle !== chatLifecycle || !document.getElementById('chat-friends-list')?.isConnected) return;
    let total = 0;
    for (const { friendId, count } of results) {
        total += count;
        const badge = Array.from(document.querySelectorAll('[data-unread-badge]')).find(node => node.dataset.unreadBadge === friendId);
        if (badge) badge.innerHTML = renderUnreadBadge(count, `Непрочитанных сообщений: ${count}`);
    }
    totalBadge.innerHTML = renderUnreadBadge(total, `Всего непрочитанных сообщений: ${total}`);
}

// ========== ЗАГРУЗКА ДРУЗЕЙ ==========
export async function loadChatFriends() {
    const lifecycle = chatLifecycle;
    const user = auth.currentUser;
    if (!user) return;
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return;
        currentUserProfile = { id: user.uid, ...userDoc.data() };
        const friends = userDoc.data().friends || [];
        const list = document.getElementById('chat-friends-list');
        if (!list || lifecycle !== chatLifecycle) return;
        if (friends.length === 0) { list.innerHTML = '<div class="text-center py-3 text-secondary">Нет друзей для чата</div>'; return; }
        const friendsData = [];
        for (const friendId of friends) {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (friendDoc.exists()) friendsData.push({ id: friendId, ...friendDoc.data() });
        }
        onlineUnsubscribes.forEach(unsubscribe => unsubscribe());
        onlineUnsubscribes = [];
        if (lifecycle !== chatLifecycle || !list.isConnected || auth.currentUser?.uid !== user.uid) return;
        chatFriendsCache = friendsData;
        list.innerHTML = friendsData.map((friend, index) => `
            <button type="button" class="chat-friend-item" data-chat-index="${index}" data-friend-id="${escapeHtml(friend.id)}">
                <span class="avatar-circle small"><i class="bi bi-person-fill" aria-hidden="true"></i></span>
                <span class="chat-friend-info"><span class="fw-semibold">${escapeHtml(friend.nickname || 'Игрок')}</span><span class="online-dot offline" id="online-${escapeHtml(friend.id)}"></span></span>
                <span class="chat-friend-unread" data-unread-badge="${escapeHtml(friend.id)}"></span>
            </button>
        `).join('');
        list.onclick = event => {
            const button = event.target.closest('[data-chat-index]');
            if (!button || !list.contains(button)) return;
            const friend = friendsData[Number(button.dataset.chatIndex)];
            if (friend) window.openChat(friend.id, friend.nickname || 'Игрок');
        };
        friendsData.forEach(friend => watchOnlineStatus(friend.id));
        refreshUnreadBadges(friendsData, lifecycle);
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
    if (previewRefreshTimer) { clearInterval(previewRefreshTimer); previewRefreshTimer = null; }
    const token = ++conversationToken;
    previewChatId = null; previewHistoryCursor = null; previewHasMore = false; previewMessages = []; previewLastMarkedReadId = null;
    currentChatId = [user.uid, friendId].sort().join('_');
    chatFriend = { id: friendId, name: friendName };
    document.getElementById('chat-empty').style.display = 'none';
    document.getElementById('chat-active').style.display = 'flex';
    document.getElementById('chat-friend-name').textContent = friendName;
    if (window.innerWidth <= 768) document.getElementById('chat-list-panel').classList.add('hidden');
    document.querySelectorAll('.chat-friend-item').forEach(el => el.classList.remove('active'));
    const activeItem = Array.from(document.querySelectorAll('.chat-friend-item')).find(el => el.dataset.friendId === friendId);
    if (activeItem) activeItem.classList.add('active');
    if (chatPreviewTransport) {
        try { previewChatId = await createDirectChatId(user.uid, friendId); }
        catch (error) { console.error('Не удалось подготовить безопасный ID чата:', error); }
        if (token !== conversationToken || auth.currentUser?.uid !== user.uid) return;
    }
    loadMessages();
    if (previewChatId) previewRefreshTimer = setInterval(() => { loadPreviewMessages(); }, 5000);
};

window.closeChatWindow = () => {
    conversationToken++;
    if (previewRefreshTimer) { clearInterval(previewRefreshTimer); previewRefreshTimer = null; }
    previewChatId = null; previewHistoryCursor = null; previewHasMore = false; previewMessages = []; previewLastMarkedReadId = null;
    document.getElementById('chat-empty').style.display = 'flex';
    document.getElementById('chat-active').style.display = 'none';
    document.getElementById('chat-list-panel').classList.remove('hidden');
    if (messagesUnsubscribe) { messagesUnsubscribe(); messagesUnsubscribe = null; }
    currentChatId = null; chatFriend = null;
    document.querySelectorAll('.chat-friend-item').forEach(el => el.classList.remove('active'));
};

function loadMessages() {
    if (!currentChatId) return;
    if (previewChatId && chatPreviewTransport) { loadPreviewMessages(); return; }
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


async function loadPreviewMessages({ older = false } = {}) {
    if (!previewChatId || !chatPreviewTransport) return;
    const chatId = previewChatId;
    const token = conversationToken;
    if (previewLoadingToken === token) return;
    previewLoadingToken = token;
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const previousHeight = container.scrollHeight;
    const previousTop = container.scrollTop;
    const wasNearBottom = previousHeight - previousTop - container.clientHeight < 80;
    previewLoadInFlight = true;
    try {
        const response = await chatPreviewTransport.readHistory({
            chatId, pageSize: 30,
            ...(older && previewHistoryCursor ? { cursorMessageId: previewHistoryCursor } : {})
        });
        if (token !== conversationToken || chatId !== previewChatId) return;
        const page = normalizeChatHistoryPage(response, chatId);
        previewMessages = mergeChatHistoryMessages(previewMessages, page.messages);
        previewHistoryCursor = older ? page.nextCursor : (previewHistoryCursor || page.nextCursor);
        previewHasMore = Boolean(page.nextCursor);
        container.innerHTML = '';
        if (previewHasMore) {
            const olderButton = document.createElement('button');
            olderButton.type = 'button'; olderButton.className = 'chat-load-older';
            olderButton.textContent = 'Загрузить предыдущие сообщения';
            olderButton.addEventListener('click', () => loadPreviewMessages({ older: true }));
            container.appendChild(olderButton);
        }
        if (!previewMessages.length) {
            const empty = document.createElement('div'); empty.className = 'text-center py-4 text-secondary';
            empty.textContent = 'Нет сообщений. Напишите первым! 👋'; container.appendChild(empty);
        } else {
            previewMessages.forEach(message => renderMessage(message, container));
        }
        if (older) container.scrollTop = previousTop + (container.scrollHeight - previousHeight);
        else if (wasNearBottom || previousHeight === 0) container.scrollTop = container.scrollHeight;
        else container.scrollTop = previousTop;
        const readTarget = latestIncomingMessageId(page.messages, auth.currentUser?.uid);
        if (readTarget && readTarget !== previewLastMarkedReadId) {
            await chatPreviewTransport.markRead({ chatId, upToMessageId: readTarget });
            if (token === conversationToken && chatId === previewChatId) {
                previewLastMarkedReadId = readTarget;
                await refreshUnreadBadges(chatFriendsCache, chatLifecycle);
            }
        }
        if (token === conversationToken) await refreshUnreadBadges(chatFriendsCache, chatLifecycle);
    } catch (error) {
        if (token === conversationToken) {
            console.error('Ошибка загрузки безопасной истории чата:', error);
            container.innerHTML = '<div class="text-center py-3 text-secondary">Не удалось загрузить сообщения. Попробуйте открыть чат ещё раз.</div>';
        }
    } finally { if (previewLoadingToken === token) previewLoadingToken = null; }
}
function renderMessage(msg, container) {
    const user = auth.currentUser;
    const isMine = msg.senderId === user.uid;
    const time = chatTimestampDate(msg.createdAt);
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgEl = document.createElement('div');
    msgEl.className = `message-wrapper ${isMine ? 'mine' : 'theirs'}`;
    msgEl.dataset.messageId = msg.id;
    let replyHTML = msg.replyTo ? `<div class="message-reply">↩️ ${escapeHtml(String(msg.replyTo.text ?? '...').substring(0, 50))}</div>` : '';
    const projectedReactionText = formatProjectedReactions(msg.reactions);
    let reactionsHTML = projectedReactionText ? `<div class="message-reactions">${escapeHtml(projectedReactionText)}</div>` :
        (msg.reactions && Object.keys(msg.reactions).length > 0 ? `<div class="message-reactions">${Object.values(msg.reactions).map(escapeHtml).join(' ')}</div>` : '');
    const readStateHTML = renderMessageReadState({ isMine, readByRecipient: msg.readByRecipient });
    const displayText = msg.deleted ? '🗑️ Сообщение удалено' : msg.text;
    msgEl.innerHTML = `
        <div class="message-bubble" oncontextmenu="window.showContextMenu(event, '${msg.id}', ${isMine})">
            ${replyHTML}
            <div class="message-text">${msg.edited ? '<span class="edited-label">(изм.)</span> ' : ''}${escapeHtml(displayText)}</div>
            <div class="message-time">${timeStr}${readStateHTML}</div>
            ${reactionsHTML}
        </div>
        <div class="message-actions">
            ${previewChatId ? `
                <button class="reaction-btn" aria-label="Нравится" onclick="window.addReaction('${msg.id}', 'like')">👍</button>
                <button class="reaction-btn" aria-label="Сердце" onclick="window.addReaction('${msg.id}', 'love')">❤️</button>
                <button class="reaction-btn" aria-label="Смех" onclick="window.addReaction('${msg.id}', 'laugh')">😂</button>
                <button class="reaction-btn" aria-label="Удивление" onclick="window.addReaction('${msg.id}', 'wow')">😮</button>
                <button class="reaction-btn" aria-label="Грусть" onclick="window.addReaction('${msg.id}', 'sad')">😢</button>
                <button class="reaction-btn" aria-label="Огонь" onclick="window.addReaction('${msg.id}', 'fire')">🔥</button>
            ` : `
                <button class="reaction-btn" onclick="window.addReaction('${msg.id}', '👍')">👍</button>
                <button class="reaction-btn" onclick="window.addReaction('${msg.id}', '❤️')">❤️</button>
                <button class="reaction-btn" onclick="window.addReaction('${msg.id}', '😂')">😂</button>
                <button class="reaction-btn" onclick="window.addReaction('${msg.id}', '😮')">😮</button>
                <button class="reaction-btn" onclick="window.addReaction('${msg.id}', '😢')">😢</button>
            `}
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
        if (previewChatId && chatPreviewTransport) {
            await chatPreviewTransport.sendMessage({ targetUid: chatFriend.id, messageId: createChatMessageId(), text: text.trim() });
            document.getElementById('chat-input').value = '';
            window.cancelReply();
            await loadPreviewMessages();
            return;
        }
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
    if (previewChatId && chatPreviewTransport) {
        chatPreviewTransport.mutateMessage({ operation: 'edit', chatId: previewChatId, messageId: selectedMessageId, text: newText.trim() })
            .then(() => loadPreviewMessages()).catch(error => console.error('Не удалось изменить сообщение:', error));
        return;
    }
    updateDoc(doc(db, 'chats', currentChatId, 'messages', selectedMessageId), { text: newText.trim(), edited: true });
};
window.deleteMessage = () => {
    if (!selectedMessageId || !currentChatId) return;
    if (!confirm('Удалить сообщение?')) return;
    if (previewChatId && chatPreviewTransport) {
        chatPreviewTransport.mutateMessage({ operation: 'delete', chatId: previewChatId, messageId: selectedMessageId })
            .then(() => loadPreviewMessages()).catch(error => console.error('Не удалось удалить сообщение:', error));
        return;
    }
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
        if (previewChatId && chatPreviewTransport) {
            const reactionType = ({ '👍': 'like', '❤️': 'love', '😂': 'laugh', '😮': 'wow', '😢': 'sad', '🔥': 'fire' })[reaction];
            if (!reactionType && !['like', 'love', 'laugh', 'wow', 'sad', 'fire'].includes(reaction)) return;
            await chatPreviewTransport.toggleReaction({ chatId: previewChatId, messageId, reactionType: reactionType || reaction });
            await loadPreviewMessages();
            return;
        }
        const msgRef = doc(db, 'chats', currentChatId, 'messages', messageId);
        const msgSnap = await getDoc(msgRef);
        const reactions = msgSnap.data()?.reactions || {};
        reactions[user.uid] = reactions[user.uid] === reaction ? null : reaction;
        if (!reactions[user.uid]) delete reactions[user.uid];
        await updateDoc(msgRef, { reactions });
    } catch (error) { console.error('Ошибка реакции:', error); }
};

// ========== ОБРАБОТЧИКИ ==========
export function cleanupChatListeners() {
    chatLifecycle++;
    if (messagesUnsubscribe) { messagesUnsubscribe(); messagesUnsubscribe = null; }
    if (previewRefreshTimer) { clearInterval(previewRefreshTimer); previewRefreshTimer = null; }
    conversationToken++; previewChatId = null; previewHistoryCursor = null; previewHasMore = false; previewMessages = []; previewLastMarkedReadId = null;
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
    chatPreviewTransport = null;
    const params = new URLSearchParams(location.search);
    if (['localhost', '127.0.0.1'].includes(location.hostname) &&
        params.get('firebaseEmulator') === '1' && params.get('chatPreview') === '1') {
        try {
            chatPreviewTransport = createFirebaseChatTransport({ auth, functions, httpsCallable, location });
        } catch (error) {
            console.warn('Chat preview transport is unavailable:', error.message);
        }
    }
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