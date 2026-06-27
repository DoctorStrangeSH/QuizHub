// ============================================
// QuizHub — Аутентификация Google v3.0 (StateManager + EventBus)
// ============================================

let currentUser = null;
let lastAuthUIState = null;
let authFirstCheck = true;

// ========== МГНОВЕННЫЙ ПОКАЗ ИЗ КЭША ==========

(function() {
    const authArea = document.getElementById('auth-area');
    if (!authArea) return;

    const savedUser = localStorage.getItem('quizhub-user-cache');

    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            authArea.innerHTML = I18N_TEMPLATES.authLoggedIn(user);
            lastAuthUIState = 'logged-in';
        } catch (e) {
            authArea.innerHTML = I18N_TEMPLATES.authLoggedOut();
            lastAuthUIState = 'logged-out';
        }
    } else {
        authArea.innerHTML = I18N_TEMPLATES.authLoggedOut();
        lastAuthUIState = 'logged-out';
    }

    authArea.classList.add('ready');
    authArea.style.visibility = 'visible';
})();

// ========== ОТСЛЕЖИВАНИЕ АВТОРИЗАЦИИ ==========

function getAuth() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        return firebase.auth();
    }
    console.error('Firebase auth не инициализирован');
    return null;
}

function initAuthListener() {
    const authInstance = getAuth();
    if (!authInstance) {
        setTimeout(initAuthListener, 500);
        return;
    }

    authInstance.onAuthStateChanged(async user => {
        if (authFirstCheck && !user && localStorage.getItem('quizhub-user-cache')) {
            authFirstCheck = false;
            return;
        }
        authFirstCheck = false;

        const newState = user ? 'logged-in' : 'logged-out';

        if (newState === lastAuthUIState && user === currentUser) {
            return;
        }

        lastAuthUIState = newState;
        currentUser = user;

        AppState.set('isLoggedIn', !!user);
        AppState.set('user', user);

        if (user) {
            localStorage.setItem('quizhub-user-cache', JSON.stringify({
                displayName: user.displayName,
                photoURL: user.photoURL,
                uid: user.uid
            }));

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

            EventBus.emit(EVENTS.AUTH_LOGIN, user);
        } else {
            localStorage.removeItem('quizhub-user-cache');
            EventBus.emit(EVENTS.AUTH_LOGOUT);
        }

        updateAuthUI(user);
    });
}

// ========== ВХОД ==========

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

// ========== ВЫХОД ==========

async function signOut() {
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('quizhub-')) {
            allKeys.push(key);
        }
    }
    allKeys.forEach(key => {
        try { localStorage.removeItem(key); } catch (e) {}
    });

    AppState.reset();
    document.documentElement.removeAttribute('data-custom-theme');

    if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();

    const authInstance = getAuth();
    if (authInstance) await authInstance.signOut();

    lastAuthUIState = 'logged-out';
    currentUser = null;

    const authArea = document.getElementById('auth-area');
    if (authArea) {
        authArea.innerHTML = I18N_TEMPLATES.authLoggedOut();
        authArea.classList.add('ready');
        authArea.style.visibility = 'visible';
    }

    if (typeof showScreen === 'function') showScreen('home');
    console.log('👋 Выход выполнен');
}

// ========== ОБНОВЛЕНИЕ UI ==========

function updateAuthUI(user) {
    const authArea = document.getElementById('auth-area');
    if (!authArea) return;

    const newHTML = user ? I18N_TEMPLATES.authLoggedIn(user) : I18N_TEMPLATES.authLoggedOut();

    if (authArea.innerHTML.trim() !== newHTML.trim()) {
        authArea.innerHTML = newHTML;
    }

    authArea.classList.add('ready');
    authArea.style.visibility = 'visible';
}

// ========== СТИЛИ ==========

const styleEl = document.createElement('style');
styleEl.textContent = `#auth-area { transition: opacity 0.15s ease; }`;
document.head.appendChild(styleEl);

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initAuthListener, 300);
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initAuthListener, 300);
}