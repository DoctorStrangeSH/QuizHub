// ============================================
// QuizHub — Аутентификация Google
// ============================================

let currentUser = null;

// Отслеживаем состояние авторизации
auth.onAuthStateChanged(user => {
  currentUser = user;
  updateAuthUI(user);
  
  if (user) {
    const nameInput = document.getElementById('player-name');
    if (nameInput && !nameInput.dataset.manual) {
      nameInput.value = user.displayName || '';
    }
  }
});

// Вход через Google
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  
  auth.signInWithPopup(provider)
    .then(result => {
      showToast('Вход выполнен! 🎉', 'success');
    })
    .catch(error => {
      console.error('Ошибка входа:', error);
      showToast('Не удалось войти. Попробуй ещё раз.', 'danger');
    });
}

// Выход
function signOut() {
  auth.signOut()
    .then(() => {
      showToast('Ты вышел из аккаунта', 'info');
    })
    .catch(error => {
      console.error('Ошибка выхода:', error);
    });
}

// Обновление UI в зависимости от состояния авторизации
function updateAuthUI(user) {
  const authArea = document.getElementById('auth-area');
  if (!authArea) return;
  
  if (user) {
    authArea.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <img src="${user.photoURL || 'https://placehold.co/32x32/FF6B9D/white?text=U'}" 
             alt="${user.displayName}" 
             class="rounded-circle" width="32" height="32"
             style="border: 2px solid var(--accent);">
        <span class="d-none d-md-inline small fw-semibold">${user.displayName || 'Гость'}</span>
        <button class="btn btn-outline-accent btn-sm rounded-pill px-3 ms-2" onclick="signOut()">
          <i class="bi bi-box-arrow-right me-1"></i>Выйти
        </button>
      </div>
    `;
  } else {
    authArea.innerHTML = `
      <button class="btn btn-outline-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
        <i class="bi bi-google me-2"></i>Войти
      </button>
    `;
  }
}