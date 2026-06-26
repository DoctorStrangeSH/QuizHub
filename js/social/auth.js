// ============================================
// QuizHub — Аутентификация Google v2.2
// ============================================

let currentUser = null;

// Ждём инициализации auth
function getAuth() {
  if (typeof firebase !== 'undefined' && firebase.auth) {
    return firebase.auth();
  }
  console.error('Firebase auth не инициализирован');
  return null;
}

// Отслеживаем состояние авторизации
function initAuthListener() {
  const authInstance = getAuth();
  if (!authInstance) {
    console.error('auth не доступен, повтор через 500мс');
    setTimeout(initAuthListener, 500);
    return;
  }

  authInstance.onAuthStateChanged(async user => {
    currentUser = user;

    if (user) {
      console.log('👤 Пользователь:', user.displayName);

      if (typeof loadUserDataFromFirestore === 'function') {
        await loadUserDataFromFirestore();
      }
      if (typeof listenToUserDataChanges === 'function') {
        listenToUserDataChanges();
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
}

function signInWithGoogle() {
  const authInstance = getAuth();
  if (!authInstance) {
    showToast('Ошибка авторизации. Обновите страницу.', 'danger');
    return;
  }

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  authInstance.signInWithPopup(provider)
    .then(result => console.log('✅ Вход:', result.user.displayName))
    .catch(error => {
      console.error('Ошибка входа:', error);
      let msg = 'Не удалось войти';
      if (error.code === 'auth/popup-closed-by-user') msg = 'Окно входа было закрыто';
      if (error.code === 'auth/popup-blocked') msg = 'Разрешите всплывающие окна';
      showToast(msg, 'danger');
    });
}

async function signOut() {
  try {
    if (typeof saveUserDataToFirestore === 'function') {
      await saveUserDataToFirestore();
    }

    const authInstance = getAuth();
    if (authInstance) {
      await authInstance.signOut();
    }
  } catch (error) {
    console.error('Ошибка выхода:', error);
  }
}

function updateAuthUI(user) {
  const authArea = document.getElementById('auth-area');
  if (!authArea) return;

  if (user) {
    const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=FF6B9D&color=fff&size=32`;
    authArea.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <img src="${photoURL}" class="rounded-circle" width="32" height="32" 
             style="border:2px solid var(--accent);object-fit:cover;" 
             onerror="this.src='https://ui-avatars.com/api/?name=U&background=FF6B9D&color=fff&size=32'"
             alt="${user.displayName || 'User'}">
        <span class="d-none d-lg-inline small fw-semibold user-name">${user.displayName || 'Гость'}</span>
        <button class="btn btn-outline-accent btn-sm rounded-pill px-3 ms-1" onclick="signOut()">
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

// ========== ИНИЦИАЛИЗАЦИЯ ==========

// Ждём загрузки Firebase
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initAuthListener, 1000);
});

// Резервный вариант — если DOMContentLoaded уже прошёл
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initAuthListener, 1000);
}