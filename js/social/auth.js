// ============================================
// QuizHub — Аутентификация Google v2.0
// ============================================

let currentUser = null;

// Отслеживаем состояние авторизации
auth.onAuthStateChanged(async user => {
  const wasLoggedIn = !!currentUser;
  currentUser = user;
  
  if (user) {
    console.log('👤 Пользователь вошёл:', user.displayName);
    
    // Загружаем данные из Firestore
    if (typeof loadUserDataFromFirestore === 'function') {
      await loadUserDataFromFirestore();
    }
    
    // Слушаем изменения данных
    if (typeof listenToUserDataChanges === 'function') {
      listenToUserDataChanges();
    }
    
    // Настраиваем автосинхронизацию
    if (typeof setupAutoSync === 'function' && !wasLoggedIn) {
      setupAutoSync();
    }
    
    const nameInput = document.getElementById('player-name');
    if (nameInput && !nameInput.dataset.manual) {
      nameInput.value = user.displayName || '';
    }
  } else {
    console.log('👋 Пользователь вышел');
  }
  
  updateAuthUI(user);
});

// Вход через Google
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  auth.signInWithPopup(provider)
    .then(result => {
      showToast(`Добро пожаловать, ${result.user.displayName}! 🎉`, 'success');
    })
    .catch(error => {
      console.error('Ошибка входа:', error);
      
      let message = 'Не удалось войти. Попробуй ещё раз.';
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Окно входа было закрыто';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Разреши всплывающие окна для входа';
      }
      
      showToast(message, 'danger');
    });
}

// Выход
async function signOut() {
  try {
    // Сохраняем данные перед выходом
    if (typeof saveUserDataToFirestore === 'function') {
      await saveUserDataToFirestore();
    }
    
    await auth.signOut();
    showToast('Ты вышел из аккаунта. Данные сохранены ☁️', 'info');
  } catch (error) {
    console.error('Ошибка выхода:', error);
    showToast('Не удалось выйти', 'danger');
  }
}

// Обновление UI в зависимости от состояния авторизации
function updateAuthUI(user) {
  const authArea = document.getElementById('auth-area');
  if (!authArea) return;
  
  if (user) {
    const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=FF6B9D&color=fff&size=32`;
    
    authArea.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <div class="user-avatar-wrapper" title="${user.displayName || 'Пользователь'}">
          <img src="${photoURL}" 
               alt="${user.displayName || 'Пользователь'}" 
               class="rounded-circle" width="32" height="32"
               style="border: 2px solid var(--accent); object-fit: cover;"
               onerror="this.src='https://ui-avatars.com/api/?name=User&background=FF6B9D&color=fff&size=32'">
          <span class="user-online-dot"></span>
        </div>
        <span class="d-none d-lg-inline small fw-semibold user-name">${user.displayName || 'Гость'}</span>
        <button class="btn btn-outline-accent btn-sm rounded-pill px-3 ms-1" onclick="signOut()" title="Выйти">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    `;
  } else {
    authArea.innerHTML = `
      <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
        <i class="bi bi-google me-2"></i>Войти
      </button>
    `;
  }
}

// ========== СТИЛИ ДЛЯ АВАТАРА ==========

const authStyles = `
.user-avatar-wrapper {
    position: relative;
    flex-shrink: 0;
}

.user-online-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--success);
    border: 2px solid var(--bg-primary);
    animation: livePulse 2s infinite;
}

@keyframes livePulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.6); }
    50% { opacity: 0.5; box-shadow: 0 0 0 6px rgba(0, 230, 118, 0); }
}

.user-name {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
`;

// Добавляем стили
const styleEl = document.createElement('style');
styleEl.textContent = authStyles;
document.head.appendChild(styleEl);

// ========== ПРОВЕРКА СЕССИИ ==========

function checkSession() {
  const user = auth.currentUser;
  if (user) {
    console.log('✅ Сессия активна:', user.displayName);
  } else {
    console.log('❌ Нет активной сессии');
  }
}

// Проверяем при загрузке
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  
  // Обновляем UI каждые 30 минут (на случай истечения токена)
  setInterval(() => {
    const user = auth.currentUser;
    if (user) {
      user.getIdTokenResult().then(result => {
        const expiresAt = new Date(result.expirationTime);
        const now = new Date();
        const minutesLeft = Math.floor((expiresAt - now) / 60000);
        
        if (minutesLeft < 30) {
          console.log('🔄 Токен скоро истечёт, обновляем...');
          user.getIdToken(true);
        }
      }).catch(() => {});
    }
  }, 1800000); // 30 минут
});