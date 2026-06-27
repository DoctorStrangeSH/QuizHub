// ============================================
// QuizHub — Чат и сообщества v3.0 (StateManager + EventBus)
// ============================================

let chatUnsubscribe = null;
let currentChatRoom = 'global';
let chatMessages = [];
let isSendingMessage = false;
const MAX_CHAT_MESSAGES = 100;

function openChat(room = 'global') {
    currentChatRoom = room;
    if (!document.getElementById('chat-widget')) createChatWidget();
    const widget = document.getElementById('chat-widget');
    widget.classList.add('open');
    document.querySelectorAll('.chat-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.room === room);
    });
    subscribeToRoom(room);
    document.getElementById('chat-input')?.focus();
}

function closeChat() {
    document.getElementById('chat-widget')?.classList.remove('open');
    if (chatUnsubscribe) { chatUnsubscribe(); chatUnsubscribe = null; }
}

function toggleChat() {
    const widget = document.getElementById('chat-widget');
    widget?.classList.contains('open') ? closeChat() : openChat();
}

function subscribeToRoom(room) {
    if (chatUnsubscribe) chatUnsubscribe();
    document.getElementById('chat-messages').innerHTML = I18N_TEMPLATES.chatLoading();
    chatUnsubscribe = db.collection('chats').doc(room).collection('messages')
        .orderBy('timestamp', 'desc').limit(MAX_CHAT_MESSAGES)
        .onSnapshot(snapshot => {
            const messages = [];
            snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
            const newMessages = messages.reverse();
            if (JSON.stringify(newMessages.map(m => m.id)) !== JSON.stringify(chatMessages.map(m => m.id))) {
                chatMessages = newMessages;
                renderChatMessages();
            }
        }, error => console.error('Ошибка чата:', error));
}

function createChatWidget() {
    const widget = document.createElement('div');
    widget.id = 'chat-widget';
    widget.className = 'chat-widget';
    widget.innerHTML = `
        ${I18N_TEMPLATES.chatHeader()}
        <div class="chat-tabs">${I18N_TEMPLATES.chatTabs()}</div>
        <div class="chat-messages" id="chat-messages">${I18N_TEMPLATES.chatEmpty()}</div>
        <div class="chat-input-area">
            <input type="text" class="chat-input" id="chat-input" placeholder="${t('chatInput')}" maxlength="300" onkeypress="if(event.key==='Enter') sendMessage()">
            <button class="chat-send-btn" onclick="sendMessage()"><i class="bi bi-send-fill"></i></button>
        </div>
    `;
    document.body.appendChild(widget);
}

function switchChatRoom(room) {
    currentChatRoom = room;
    document.querySelectorAll('.chat-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.room === room));
    subscribeToRoom(room);
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input?.value?.trim();
    if (!text || isSendingMessage) return;
    if (!currentUser) { showToast('Войдите в аккаунт для отправки сообщений', 'warning'); return; }
    isSendingMessage = true;
    try {
        await db.collection('chats').doc(currentChatRoom).collection('messages').add({
            text: text.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 300),
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Гость',
            photoURL: currentUser.photoURL || null,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        input.value = ''; input.focus();
    } catch (error) { showToast('Не удалось отправить сообщение', 'danger'); }
    isSendingMessage = false;
}

function renderChatMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    if (chatMessages.length === 0) { container.innerHTML = I18N_TEMPLATES.chatEmpty(); return; }

    let html = '', lastUid = null;
    chatMessages.forEach(msg => {
        const isOwn = currentUser && msg.uid === currentUser.uid;
        const time = msg.timestamp?.toDate?.() || new Date();
        const timeStr = time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const showAvatar = msg.uid !== lastUid;
        lastUid = msg.uid;

        html += `
            <div class="chat-message ${isOwn ? 'own' : ''}">
                ${!isOwn && showAvatar ? `
                    <div class="chat-avatar">
                        ${msg.photoURL ? `<img src="${msg.photoURL}" alt="${msg.displayName}">` : `<div class="chat-avatar-placeholder">${(msg.displayName || 'Г')[0].toUpperCase()}</div>`}
                    </div>
                ` : (!isOwn ? '<div class="chat-avatar" style="visibility:hidden;"></div>' : '')}
                <div class="chat-bubble ${isOwn ? 'own' : ''}">
                    ${!isOwn && showAvatar ? `<div class="chat-name">${msg.displayName || 'Гость'}</div>` : ''}
                    <div class="chat-text">${msg.text}</div>
                    <div class="chat-time">${timeStr}</div>
                </div>
            </div>
        `;
    });

    if (container.innerHTML !== html) { container.innerHTML = html; container.scrollTop = container.scrollHeight; }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('chat-toggle-btn')) {
        const chatToggle = document.createElement('button');
        chatToggle.id = 'chat-toggle-btn';
        chatToggle.className = 'chat-toggle-btn';
        chatToggle.innerHTML = '<i class="bi bi-chat-dots-fill"></i>';
        chatToggle.onclick = toggleChat;
        chatToggle.title = 'Чат';
        document.body.appendChild(chatToggle);
    }
});