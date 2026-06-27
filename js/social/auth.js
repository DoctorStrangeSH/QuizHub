// ============================================
// QuizHub — Аутентификация Google v2.4
// Кнопка НИКОГДА не исчезает при обновлении
// ============================================

let currentUser = null;
let authStateResolved = false;

// ========== МГНОВЕННЫЙ ПОКАЗ СОХРАНЁННОГО СОСТОЯНИЯ ==========

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
                <div class="d-flex align-items-center gap-2" id="auth-logged-in">
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
            // Сразу делаем видимым
            authArea.style.visibility = 'visible';
            // Блокируем повторное обновление
            authArea.dataset.loaded = 'true';
        } catch (e) {
            authArea.innerHTML = `
                <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                    <i class="bi bi-google me-2"></i>Войти
                </button>
            `;
            authArea.style.visibility = 'visible';
        }
    } else {
        authArea.innerHTML = `
            <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                <i class="bi bi-google me-2"></i>Войти
            </button>
        `;
        authArea.style.visibility = 'visible';
    }
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
        currentUser = user;
        authStateResolved = true;

        if (user) {
            console.log('👤 Пользователь:', user.displayName);

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

        // Обновляем UI только после того как точно узнали состояние
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
    try {
        // Сохраняем данные перед выходом (на всякий случай)
        if (typeof saveUserDataToFirestore === 'function') {
            await saveUserDataToFirestore();
        }

        // === ОЧИЩАЕМ АБСОЛЮТНО ВСЁ ===
        
        // Монеты
        localStorage.removeItem('quizhub-coins');
        if (typeof userCoins !== 'undefined') userCoins = 0;
        
        // Достижения
        localStorage.removeItem('quizhub-achievements');
        if (typeof unlockedAchievements !== 'undefined') unlockedAchievements = [];
        
        // Статистика
        localStorage.removeItem('quizhub-stats');
        if (typeof quizStats !== 'undefined') {
            Object.keys(quizStats).forEach(key => delete quizStats[key]);
        }
        
        // Покупки
        localStorage.removeItem('quizhub-purchases');
        if (typeof purchasedItems !== 'undefined') purchasedItems = [];
        
        // Кастомная тема
        localStorage.removeItem('quizhub-custom-theme');
        if (typeof activeCustomTheme !== 'undefined') activeCustomTheme = null;
        document.documentElement.removeAttribute('data-custom-theme');
        
        // Бустеры
        localStorage.removeItem('quizhub-active-boosters');
        
        // Прогресс квиза
        localStorage.removeItem('quizhub-quiz-progress');
        
        // История очков
        localStorage.removeItem('quizhub-score-history');
        localStorage.removeItem('quizhub-weekly-activity');
        
        // Задания
        localStorage.removeItem('quizhub-quest-state');
        
        // Кэш пользователя
        localStorage.removeItem('quizhub-user-cache');
        
        // Друзья
        localStorage.removeItem('quizhub-friends');
        
        // Команда
        localStorage.removeItem('quizhub-team');
        
        // Рефералы
        localStorage.removeItem('quizhub-sent-gifts');
        localStorage.removeItem('quizhub-referral-code');
        localStorage.removeItem('quizhub-used-referral');
        
        // Настройки темы
        localStorage.removeItem('quizhub-theme-settings');
        
        // === ОБНОВЛЯЕМ ОТОБРАЖЕНИЕ ===
        
        // Монеты
        if (typeof updateCoinsDisplay === 'function') {
            updateCoinsDisplay();
        }
        
        // Магазин (если открыт)
        const shopScreen = document.getElementById('screen-shop');
        if (shopScreen?.classList.contains('active') && typeof renderShop === 'function') {
            renderShop();
        }
        
        // Достижения (если открыты)
        const achScreen = document.getElementById('screen-achievements');
        if (achScreen?.classList.contains('active') && typeof renderAchievementsScreen === 'function') {
            renderAchievementsScreen();
        }

        // Выходим из Firebase
        const authInstance = getAuth();
        if (authInstance) {
            await authInstance.signOut();
        }

        // Возвращаем на главную
        if (typeof showScreen === 'function') {
            showScreen('home');
        }

        showToast('Вы вышли из аккаунта. Данные очищены.', 'info');
        
    } catch (error) {
        console.error('Ошибка выхода:', error);
        showToast('Ошибка при выходе', 'danger');
    }
}

// ========== ОБНОВЛЕНИЕ UI ==========

function updateAuthUI(user) {
    const authArea = document.getElementById('auth-area');
    if (!authArea) return;

    // Если уже загружено из кэша и состояние не изменилось — не трогаем
    if (authArea.dataset.loaded === 'true' && user) {
        // Пользователь уже вошёл, UI уже показан — не перерисовываем
        authArea.style.visibility = 'visible';
        return;
    }

    authArea.style.visibility = 'visible';
    authArea.dataset.loaded = 'true';

    if (user) {
        const photoURL = user.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=FF6B9D&color=fff&size=32`;

        const newHTML = `
            <div class="d-flex align-items-center gap-2" id="auth-logged-in">
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

        if (authArea.innerHTML.trim() !== newHTML.trim()) {
            authArea.innerHTML = newHTML;
        }
    } else {
        const newHTML = `
            <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                <i class="bi bi-google me-2"></i>Войти
            </button>
        `;
        authArea.innerHTML = newHTML;
    }
}


// ========== СТИЛИ ==========

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

    #auth-area {
        transition: opacity 0.15s ease;
    }
`;

const styleEl = document.createElement('style');
styleEl.textContent = authStyles;
document.head.appendChild(styleEl);

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initAuthListener, 300);
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initAuthListener, 300);
}