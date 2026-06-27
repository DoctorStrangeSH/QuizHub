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
        } catch (e) {
            authArea.innerHTML = `
                <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                    <i class="bi bi-google me-2"></i>Войти
                </button>
            `;
        }
    } else {
        authArea.innerHTML = `
            <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                <i class="bi bi-google me-2"></i>Войти
            </button>
        `;
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
        currentUser = user;

        if (user) {
            console.log('👤 Пользователь:', user.displayName);

            // Сохраняем в кэш
            localStorage.setItem('quizhub-user-cache', JSON.stringify({
                displayName: user.displayName,
                photoURL: user.photoURL,
                uid: user.uid
            }));

            // Загружаем данные из Firestore
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

            // ПРИНУДИТЕЛЬНО обновляем UI после входа
            updateAuthUI(user);
        } else {
            // Пользователь вышел
            localStorage.removeItem('quizhub-user-cache');
            
            // ПРИНУДИТЕЛЬНО обновляем UI после выхода
            updateAuthUI(null);
        }
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
    // === ШАГ 1: Очищаем ВСЁ ДО выхода из Firebase ===
    
    // Полный список всех ключей, которые используются в приложении
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('quizhub-')) {
            allKeys.push(key);
        }
    }
    
    // Удаляем все ключи quizhub-*
    allKeys.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Не удалось удалить:', key);
        }
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
    
    // Обновляем отображение монет
    if (typeof updateCoinsDisplay === 'function') {
        updateCoinsDisplay();
    }
    
    // Обновляем магазин если открыт
    const shopScreen = document.getElementById('screen-shop');
    if (shopScreen?.classList.contains('active') && typeof renderShop === 'function') {
        renderShop();
    }
    
    // Обновляем достижения если открыты
    const achScreen = document.getElementById('screen-achievements');
    if (achScreen?.classList.contains('active') && typeof renderAchievementsScreen === 'function') {
        renderAchievementsScreen();
    }
    
    // === ШАГ 2: Выходим из Firebase ===
    try {
        if (typeof saveUserDataToFirestore === 'function') {
            // Сохраняем ПУСТЫЕ данные
            const authInstance = getAuth();
            if (authInstance && authInstance.currentUser) {
                const userRef = db.collection('users').doc(authInstance.currentUser.uid);
                await userRef.set({
                    coins: 0,
                    purchases: [],
                    achievements: [],
                    totalXP: 0,
                    bestScore: 0,
                    totalQuizzes: 0,
                    customTheme: null,
                    stats: {},
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
        }
        
        const authInstance = getAuth();
        if (authInstance) {
            await authInstance.signOut();
        }
    } catch (error) {
        console.error('Ошибка выхода из Firebase:', error);
    }
    
    // === ШАГ 3: Обновляем UI ===
    currentUser = null;
    
    const authArea = document.getElementById('auth-area');
    if (authArea) {
        authArea.innerHTML = `
            <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                <i class="bi bi-google me-2"></i>Войти
            </button>
        `;
        authArea.style.visibility = 'visible';
        authArea.removeAttribute('data-preloaded');
    }
    
    // Возвращаем на главную
    if (typeof showScreen === 'function') {
        showScreen('home');
    }
    
    console.log('👋 Полный выход выполнен');
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

        // Обновляем только если изменилось
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