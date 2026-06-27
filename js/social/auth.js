// ============================================
// QuizHub — Аутентификация Google v2.7
// Кнопка НИКОГДА не мигает
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
            const photoURL = user.photoURL || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=FF6B9D&color=fff&size=32`;
            
            authArea.innerHTML = `
                <div class="d-flex align-items-center gap-2">
                    <img src="${photoURL}" class="rounded-circle" width="32" height="32" 
                         style="border:2px solid var(--accent);object-fit:cover;"
                         alt="${user.displayName || 'User'}"
                         onerror="this.src='https://ui-avatars.com/api/?name=U&background=FF6B9D&color=fff&size=32'">
                    <span class="d-none d-lg-inline small fw-semibold user-name">${user.displayName || ''}</span>
                    <button class="btn btn-outline-accent btn-sm rounded-pill px-3 ms-1" onclick="signOut()" title="Выйти">
                        <i class="bi bi-box-arrow-right"></i>
                    </button>
                </div>
            `;
            lastAuthUIState = 'logged-in';
        } catch (e) {
            authArea.innerHTML = `
                <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                    <i class="bi bi-google me-2"></i>Войти
                </button>
            `;
            lastAuthUIState = 'logged-out';
        }
    } else {
        authArea.innerHTML = `
            <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                <i class="bi bi-google me-2"></i>Войти
            </button>
        `;
        lastAuthUIState = 'logged-out';
    }

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

        // Первый вызов: если пользователя нет, но в кэше есть — пропускаем
        if (authFirstCheck && !user && localStorage.getItem('quizhub-user-cache')) {
            authFirstCheck = false;
            return;
        }
        authFirstCheck = false;

        const newState = user ? 'logged-in' : 'logged-out';

        // Если состояние не изменилось и это тот же пользователь — пропускаем
        if (newState === lastAuthUIState && user === currentUser) {
            return;
        }

        lastAuthUIState = newState;
        currentUser = user;

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
        } else {
            localStorage.removeItem('quizhub-user-cache');
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
        .then(result => {
            console.log('✅ Вход:', result.user.displayName);
        })
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
    // Очищаем все локальные данные
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('quizhub-')) {
            allKeys.push(key);
        }
    }

    allKeys.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (e) {}
    });

    // Сбрасываем глобальные переменные
    if (typeof userCoins !== 'undefined') userCoins = 0;
    if (typeof unlockedAchievements !== 'undefined') unlockedAchievements = [];
    if (typeof purchasedItems !== 'undefined') purchasedItems = [];
    if (typeof activeCustomTheme !== 'undefined') activeCustomTheme = null;
    if (typeof quizStats !== 'undefined') {
        Object.keys(quizStats).forEach(key => delete quizStats[key]);
    }
    if (typeof friendsList !== 'undefined') friendsList = [];
    if (typeof userTeam !== 'undefined') userTeam = null;
    if (typeof selectedDifficulty !== 'undefined') selectedDifficulty = 'easy';

    // Сбрасываем кастомную тему
    document.documentElement.removeAttribute('data-custom-theme');

    // Обновляем отображение
    if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();

    // Выходим из Firebase (НЕ сохраняем данные)
    const authInstance = getAuth();
    if (authInstance) {
        await authInstance.signOut();
    }

    // Обновляем UI
    lastAuthUIState = 'logged-out';
    currentUser = null;

    const authArea = document.getElementById('auth-area');
    if (authArea) {
        authArea.innerHTML = `
            <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                <i class="bi bi-google me-2"></i>Войти
            </button>
        `;
        authArea.style.visibility = 'visible';
    }

    if (typeof showScreen === 'function') showScreen('home');
    console.log('👋 Выход выполнен');
}

// ========== ОБНОВЛЕНИЕ UI ==========

function updateAuthUI(user) {
    const authArea = document.getElementById('auth-area');
    if (!authArea) return;

    authArea.style.visibility = 'visible';

    if (user) {
        const photoURL = user.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=FF6B9D&color=fff&size=32`;

        const newHTML = `
            <div class="d-flex align-items-center gap-2">
                <img src="${photoURL}" 
                     class="rounded-circle" width="32" height="32" 
                     style="border:2px solid var(--accent);object-fit:cover;"
                     alt="${user.displayName || 'User'}"
                     onerror="this.src='https://ui-avatars.com/api/?name=U&background=FF6B9D&color=fff&size=32'">
                <span class="d-none d-lg-inline small fw-semibold user-name">${user.displayName || 'Гость'}</span>
                <button class="btn btn-outline-accent btn-sm rounded-pill px-3 ms-1" onclick="signOut()" title="Выйти">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            </div>
        `;

        // Обновляем только если содержимое изменилось
        if (authArea.innerHTML.trim() !== newHTML.trim()) {
            authArea.innerHTML = newHTML;
        }
    } else {
        const newHTML = `
            <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                <i class="bi bi-google me-2"></i>Войти
            </button>
        `;

        // Обновляем только если содержимое изменилось
        if (authArea.innerHTML.trim() !== newHTML.trim()) {
            authArea.innerHTML = newHTML;
        }
    }
}

// ========== СТИЛИ ==========

const styleEl = document.createElement('style');
styleEl.textContent = `
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
    #auth-area {
        transition: opacity 0.15s ease;
    }
`;
document.head.appendChild(styleEl);

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initAuthListener, 300);
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initAuthListener, 300);
}