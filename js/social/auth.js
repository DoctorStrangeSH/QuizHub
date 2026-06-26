// ============================================
// QuizHub — Аутентификация Google v2.3
// ============================================

let currentUser = null;

// ========== МГНОВЕННЫЙ ПОКАЗ СОХРАНЁННОГО СОСТОЯНИЯ ==========
// Срабатывает ДО ответа от Firebase, чтобы кнопка не мерцала

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
                         alt="${user.displayName || 'User'}">
                    <span class="d-none d-lg-inline small fw-semibold user-name">${user.displayName || ''}</span>
                </div>
            `;
        } catch (e) {
            // Если кэш повреждён — показываем кнопку входа
            authArea.innerHTML = `
                <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                    <i class="bi bi-google me-2"></i>Войти
                </button>
            `;
        }
    } else {
        // Нет кэша — показываем кнопку входа
        authArea.innerHTML = `
            <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                <i class="bi bi-google me-2"></i>Войти
            </button>
        `;
    }

    // Делаем видимым сразу
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
        console.error('auth не доступен, повтор через 500мс');
        setTimeout(initAuthListener, 500);
        return;
    }

    authInstance.onAuthStateChanged(async user => {
        currentUser = user;

        if (user) {
            console.log('👤 Пользователь:', user.displayName);

            // Сохраняем в кэш для мгновенного показа при следующей загрузке
            localStorage.setItem('quizhub-user-cache', JSON.stringify({
                displayName: user.displayName,
                photoURL: user.photoURL,
                uid: user.uid
            }));

            // Загружаем данные из Firestore
            if (typeof loadUserDataFromFirestore === 'function') {
                await loadUserDataFromFirestore();
            }

            // Слушаем изменения данных
            if (typeof listenToUserDataChanges === 'function') {
                listenToUserDataChanges();
            }

            // Автозаполнение имени
            const nameInput = document.getElementById('player-name');
            if (nameInput && !nameInput.dataset.manual) {
                nameInput.value = user.displayName || '';
            }
        } else {
            console.log('👋 Пользователь вышел');

            // Удаляем кэш при выходе
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
    try {
        // Сохраняем данные перед выходом
        if (typeof saveUserDataToFirestore === 'function') {
            await saveUserDataToFirestore();
        }

        // Очищаем ВСЕ локальные данные
        localStorage.removeItem('quizhub-coins');
        localStorage.removeItem('quizhub-achievements');
        localStorage.removeItem('quizhub-stats');
        localStorage.removeItem('quizhub-purchases');
        localStorage.removeItem('quizhub-custom-theme');
        localStorage.removeItem('quizhub-user-cache');
        localStorage.removeItem('quizhub-quiz-progress');
        localStorage.removeItem('quizhub-score-history');
        localStorage.removeItem('quizhub-weekly-activity');
        localStorage.removeItem('quizhub-quest-state');

        // Сбрасываем глобальные переменные
        if (typeof userCoins !== 'undefined') userCoins = 0;
        if (typeof unlockedAchievements !== 'undefined') unlockedAchievements = [];
        if (typeof purchasedItems !== 'undefined') purchasedItems = [];
        if (typeof activeCustomTheme !== 'undefined') activeCustomTheme = null;

        // Сбрасываем кастомную тему
        document.documentElement.removeAttribute('data-custom-theme');

        // Обновляем отображение
        if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();

        const authInstance = getAuth();
        if (authInstance) {
            await authInstance.signOut();
        }

        // Возвращаем на главную
        if (typeof showScreen === 'function') showScreen('home');
        
        showToast('Данные очищены. Вы вышли из аккаунта.', 'info');
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
}

// ========== ОБНОВЛЕНИЕ UI ==========

function updateAuthUI(user) {
    const authArea = document.getElementById('auth-area');
    if (!authArea) return;

    authArea.style.visibility = 'visible';

    if (user) {
        const photoURL = user.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=FF6B9D&color=fff&size=32`;

        // Новый HTML
        const newHTML = `
            <div class="d-flex align-items-center gap-2">
                <div class="user-avatar-wrapper" title="${user.displayName || 'Пользователь'}">
                    <img src="${photoURL}" 
                         alt="${user.displayName || 'Пользователь'}" 
                         class="rounded-circle" width="32" height="32"
                         style="border: 2px solid var(--accent); object-fit: cover;"
                         onerror="this.src='https://ui-avatars.com/api/?name=U&background=FF6B9D&color=fff&size=32'">
                    <span class="user-online-dot"></span>
                </div>
                <span class="d-none d-lg-inline small fw-semibold user-name">${user.displayName || 'Гость'}</span>
                <button class="btn btn-outline-accent btn-sm rounded-pill px-3 ms-1" onclick="signOut()" title="Выйти">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            </div>
        `;

        // НЕ обновляем, если контент уже тот же
        if (authArea.innerHTML.trim() !== newHTML.trim()) {
            authArea.innerHTML = newHTML;
        }
    } else {
        const newHTML = `
            <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                <i class="bi bi-google me-2"></i>Войти
            </button>
        `;

        if (authArea.innerHTML.trim() !== newHTML.trim()) {
            authArea.innerHTML = newHTML;
        }
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

    #auth-area {
        transition: opacity 0.2s ease;
    }
`;

const styleEl = document.createElement('style');
styleEl.textContent = authStyles;
document.head.appendChild(styleEl);

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initAuthListener, 500);
});

// Резервный вариант — если DOMContentLoaded уже прошёл
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initAuthListener, 500);
}