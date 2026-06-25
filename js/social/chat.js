// ============================================
// QuizHub — Чат и сообщества v2.0
// Сообщения хранятся в Firestore
// ============================================

let chatUnsubscribe = null;
let currentChatRoom = 'global';
let chatMessages = [];
const MAX_CHAT_MESSAGES = 100;

// ========== ОТКРЫТИЕ/ЗАКРЫТИЕ ==========

function openChat(room = 'global') {
  currentChatRoom = room;
  
  if (!document.getElementById('chat-widget')) {
    createChatWidget();
  }
  
  const widget = document.getElementById('chat-widget');
  widget.classList.add('open');
  
  // Обновляем активную вкладку
  document.querySelectorAll('.chat-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.room === room);
  });
  
  // Подписываемся на сообщения
  if (chatUnsubscribe) chatUnsubscribe();
  
  chatUnsubscribe = db.collection('chats')
    .doc(currentChatRoom)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(MAX_CHAT_MESSAGES)
    .onSnapshot(snapshot => {
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      chatMessages = messages.reverse();
      renderChatMessages();
    });
  
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

// ========== СОЗДАНИЕ ВИДЖЕТА ==========

function createChatWidget() {
  const widget = document.createElement('div');
  widget.id = 'chat-widget';
  widget.className = 'chat-widget';
  widget.innerHTML = `
    <!-- Заголовок -->
    <div class="chat-header">
      <div class="chat-header-left">
        <span class="chat-header-icon">💬</span>
        <div>
          <div class="chat-header-title">Чат QuizHub</div>
          <div class="chat-header-status">
            <span class="chat-online-dot"></span>
            <span id="chat-online-count">0 онлайн</span>
          </div>
        </div>
      </div>
      <button class="chat-close-btn" onclick="closeChat()">✕</button>
    </div>
    
    <!-- Вкладки -->
    <div class="chat-tabs">
      <button class="chat-tab active" data-room="global" onclick="switchChatRoom('global')">🌍 Общий</button>
      <button class="chat-tab" data-room="help" onclick="switchChatRoom('help')">❓ Помощь</button>
      <button class="chat-tab" data-room="lfg" onclick="switchChatRoom('lfg')">🎮 Поиск игры</button>
    </div>
    
    <!-- Сообщения -->
    <div class="chat-messages" id="chat-messages">
      <div class="text-center text-muted py-4">
        <i class="bi bi-chat-dots fs-3 d-block mb-2 opacity-50"></i>
        <small>Загрузка сообщений...</small>
      </div>
    </div>
    
    <!-- Ввод -->
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
  
  if (chatUnsubscribe) chatUnsubscribe();
  
  document.getElementById('chat-messages').innerHTML = `
    <div class="text-center text-muted py-4">
      <small>Загрузка...</small>
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
      chatMessages = messages.reverse();
      renderChatMessages();
    });
}

// ========== ОТПРАВКА ==========

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input?.value?.trim();
  
  if (!text) return;
  
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
}

function sanitizeText(text) {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .substring(0, 300);
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
  
  // Группируем сообщения по отправителю
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
  
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

// ========== ГДЕ ХРАНЯТСЯ СООБЩЕНИЯ ==========
// Firestore: chats/{room}/messages/{messageId}
// Структура документа:
// {
//   text: string,
//   uid: string,
//   displayName: string,
//   photoURL: string | null,
//   timestamp: serverTimestamp
// }
// Комнаты: global, help, lfg, duel_{duelId}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  // Создаём кнопку чата
  if (!document.getElementById('chat-toggle-btn')) {
    const chatToggle = document.createElement('button');
    chatToggle.id = 'chat-toggle-btn';
    chatToggle.className = 'chat-toggle-btn';
    chatToggle.innerHTML = '<i class="bi bi-chat-dots-fill"></i><span class="unread-badge" id="chat-unread"></span>';
    chatToggle.onclick = toggleChat;
    chatToggle.title = 'Чат';
    document.body.appendChild(chatToggle);
  }
  
  // Слушаем непрочитанные сообщения
  listenForUnreadMessages();
});

// ========== НЕПРОЧИТАННЫЕ ==========

function listenForUnreadMessages() {
  if (!currentUser) return;
  
  // Слушаем все комнаты на новые сообщения (упрощённо)
  const rooms = ['global', 'help', 'lfg'];
  const lastRead = JSON.parse(localStorage.getItem('quizhub-chat-last-read') || '{}');
  
  rooms.forEach(room => {
    db.collection('chats')
      .doc(room)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .onSnapshot(snapshot => {
        if (!snapshot.empty && !document.getElementById('chat-widget')?.classList.contains('open')) {
          const lastMsg = snapshot.docs[0].data();
          const lastTimestamp = lastMsg.timestamp?.toDate?.()?.getTime() || 0;
          
          if (lastTimestamp > (lastRead[room] || 0) && lastMsg.uid !== currentUser?.uid) {
            const badge = document.getElementById('chat-unread');
            if (badge) {
              badge.style.display = 'flex';
              badge.textContent = '!';
            }
          }
        }
      });
  });
}

// Сбрасываем непрочитанные при открытии чата
const originalOpenChat = openChat;
openChat = function(room) {
  const lastRead = JSON.parse(localStorage.getItem('quizhub-chat-last-read') || '{}');
  lastRead[room || 'global'] = Date.now();
  localStorage.setItem('quizhub-chat-last-read', JSON.stringify(lastRead));
  
  const badge = document.getElementById('chat-unread');
  if (badge) badge.style.display = 'none';
  
  originalOpenChat(room);
};