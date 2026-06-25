// ============================================
// QuizHub — Чат и сообщества v2.1
// Сообщения хранятся в Firestore
// ============================================

let chatUnsubscribe = null;
let currentChatRoom = 'global';
let chatMessages = [];
let isSendingMessage = false;
const MAX_CHAT_MESSAGES = 100;

// ========== ОТКРЫТИЕ/ЗАКРЫТИЕ ==========

function openChat(room = 'global') {
  currentChatRoom = room;
  
  if (!document.getElementById('chat-widget')) {
    createChatWidget();
  }
  
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
  if (chatUnsubscribe) {
    chatUnsubscribe();
    chatUnsubscribe = null;
  }
}

function toggleChat() {
  const widget = document.getElementById('chat-widget');
  if (widget?.classList.contains('open')) {
    closeChat();
  } else {
    openChat();
  }
}

// ========== ПОДПИСКА НА КОМНАТУ ==========

function subscribeToRoom(room) {
  if (chatUnsubscribe) chatUnsubscribe();
  
  document.getElementById('chat-messages').innerHTML = `
    <div class="text-center text-muted py-4">
      <i class="bi bi-chat-dots fs-3 d-block mb-2 opacity-50"></i>
      <small>Загрузка сообщений...</small>
    </div>`;
  
  chatUnsubscribe = db.collection('chats')
    .doc(room)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(MAX_CHAT_MESSAGES)
    .onSnapshot(snapshot => {
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      
      // Только если сообщения действительно изменились
      const newMessages = messages.reverse();
      if (JSON.stringify(newMessages.map(m => m.id)) !== JSON.stringify(chatMessages.map(m => m.id))) {
        chatMessages = newMessages;
        renderChatMessages();
      }
    }, error => {
      console.error('Ошибка чата:', error);
    });
}

// ========== СОЗДАНИЕ ВИДЖЕТА ==========

function createChatWidget() {
  const widget = document.createElement('div');
  widget.id = 'chat-widget';
  widget.className = 'chat-widget';
  widget.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-left">
        <span class="chat-header-icon">💬</span>
        <div>
          <div class="chat-header-title">Чат QuizHub</div>
          <div class="chat-header-status">
            <span class="chat-online-dot"></span>
            <span>Онлайн</span>
          </div>
        </div>
      </div>
      <button class="chat-close-btn" onclick="closeChat()">✕</button>
    </div>
    
    <div class="chat-tabs">
      <button class="chat-tab active" data-room="global" onclick="switchChatRoom('global')">🌍 Общий</button>
      <button class="chat-tab" data-room="help" onclick="switchChatRoom('help')">❓ Помощь</button>
      <button class="chat-tab" data-room="lfg" onclick="switchChatRoom('lfg')">🎮 Поиск игры</button>
    </div>
    
    <div class="chat-messages" id="chat-messages">
      <div class="text-center text-muted py-4">
        <i class="bi bi-chat-dots fs-3 d-block mb-2 opacity-50"></i>
        <small>Нет сообщений. Будьте первым!</small>
      </div>
    </div>
    
    <div class="chat-input-area">
      <input type="text" class="chat-input" id="chat-input" 
             placeholder="Напишите сообщение..." maxlength="300"
             onkeypress="if(event.key==='Enter') sendMessage()">
      <button class="chat-send-btn" onclick="sendMessage()">
        <i class="bi bi-send-fill"></i>
      </button>
    </div>
  `;
  
  document.body.appendChild(widget);
}

// ========== ПЕРЕКЛЮЧЕНИЕ КОМНАТ ==========

function switchChatRoom(room) {
  currentChatRoom = room;
  
  document.querySelectorAll('.chat-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.room === room);
  });
  
  subscribeToRoom(room);
}

// ========== ОТПРАВКА ==========

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input?.value?.trim();
  
  if (!text || isSendingMessage) return;
  
  if (!currentUser) {
    showToast('Войдите в аккаунт для отправки сообщений', 'warning');
    return;
  }
  
  // Анти-спам
  const recentMessages = chatMessages.filter(m => 
    m.uid === currentUser.uid && 
    Date.now() - (m.timestamp?.toDate?.() || m.timestamp) < 3000
  );
  
  if (recentMessages.length >= 3) {
    showToast('Слишком быстро! Подождите немного.', 'warning');
    return;
  }
  
  isSendingMessage = true;
  
  try {
    await db.collection('chats')
      .doc(currentChatRoom)
      .collection('messages')
      .add({
        text: sanitizeText(text),
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Гость',
        photoURL: currentUser.photoURL || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    
    input.value = '';
    input.focus();
  } catch (error) {
    console.error('Ошибка отправки:', error);
    showToast('Не удалось отправить сообщение', 'danger');
  }
  
  isSendingMessage = false;
}

function sanitizeText(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 300);
}

// ========== ОТОБРАЖЕНИЕ ==========

function renderChatMessages() {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  
  if (chatMessages.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-chat-dots fs-3 d-block mb-2 opacity-50"></i>
        <small>Нет сообщений. Будьте первым!</small>
      </div>`;
    return;
  }
  
  let html = '';
  let lastUid = null;
  
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
            ${msg.photoURL 
              ? `<img src="${msg.photoURL}" alt="${msg.displayName}">`
              : `<div class="chat-avatar-placeholder">${(msg.displayName || 'Г')[0].toUpperCase()}</div>`
            }
          </div>
        ` : (!isOwn ? '<div class="chat-avatar" style="visibility:hidden;"></div>' : '')}
        <div class="chat-bubble ${isOwn ? 'own' : ''}">
          ${!isOwn && showAvatar ? `<div class="chat-name">${sanitizeText(msg.displayName || 'Гость')}</div>` : ''}
          <div class="chat-text">${sanitizeText(msg.text)}</div>
          <div class="chat-time">${timeStr}</div>
        </div>
      </div>`;
  });
  
  // Не обновляем DOM если контент не изменился
  if (container.innerHTML !== html) {
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

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