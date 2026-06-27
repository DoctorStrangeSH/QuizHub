// ============================================
// QuizHub — Синхронизация через Firestore v2.4
// ============================================

async function saveUserDataToFirestore() {
    if (typeof currentUser === 'undefined' || !currentUser) return;

    const userRef = db.collection('users').doc(currentUser.uid);
    const data = {
        displayName: currentUser.displayName || 'Игрок',
        photoURL: currentUser.photoURL || null,
        email: currentUser.email || null,

        // Монеты
        coins: AppState.get('coins'),

        // Статистика (ВАЖНО — сохраняем весь объект)
        totalXP: AppState.get('stats').totalXP || 0,
        bestScore: AppState.get('stats').bestScore || 0,
        totalQuizzes: AppState.get('stats').totalQuizzes || 0,
        dayStreak: AppState.get('stats').dayStreak || 0,

        // Полная статистика
        stats: AppState.get('stats'),

        // Достижения
        achievements: AppState.get('unlockedAchievements'),

        // Покупки
        purchases: AppState.get('purchasedItems'),

        // Кастомная тема
        customTheme: AppState.get('activeCustomTheme'),

        // Задания
        questState: JSON.parse(localStorage.getItem('quizhub-quest-state') || '{}'),

        // Настройки
        settings: {
            theme: AppState.get('settings.theme'),
            locale: AppState.get('settings.locale'),
        },

        // Друзья
        friends: AppState.get('friendsList'),

        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
        const doc = await userRef.get();
        if (doc.exists) await userRef.update(data);
        else await userRef.set({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        console.log('💾 Данные сохранены в Firestore (монеты:', data.coins, ', квизов:', data.totalQuizzes, ')');
    } catch (error) { console.error('Ошибка сохранения:', error); }
}

async function loadUserDataFromFirestore() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    if (!localStorage.getItem('quizhub-user-cache')) return;

    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (!doc.exists) { await saveUserDataToFirestore(); return; }

        const data = doc.data();
        console.log('📥 Данные загружены из Firestore');

        // Монеты
        if (typeof data.coins === 'number') {
            const localCoins = AppState.get('coins');
            const bestCoins = Math.max(data.coins, localCoins);
            AppState.set('coins', bestCoins);
            if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();
        }

        // Статистика — ВАЖНО
        if (data.stats) {
            const localStats = AppState.get('stats');
            const mergedStats = {
                ...data.stats,
                ...localStats,
                bestScore: Math.max(data.stats.bestScore || 0, localStats.bestScore || 0),
                totalXP: Math.max(data.stats.totalXP || 0, localStats.totalXP || 0),
                totalQuizzes: Math.max(data.stats.totalQuizzes || 0, localStats.totalQuizzes || 0),
                dayStreak: Math.max(data.stats.dayStreak || 0, localStats.dayStreak || 0),
                fastestAnswer: Math.min(data.stats.fastestAnswer || 999, localStats.fastestAnswer || 999),
                fastestQuiz: Math.min(data.stats.fastestQuiz || 9999, localStats.fastestQuiz || 9999),
                maxStreak: Math.max(data.stats.maxStreak || 0, localStats.maxStreak || 0),
            };
            AppState.set('stats', mergedStats);
            console.log('📊 Статистика восстановлена:', mergedStats.totalQuizzes, 'квизов');
        }

        // Достижения
        if (data.achievements) {
            const localAch = AppState.get('unlockedAchievements');
            const merged = [...new Set([...localAch, ...data.achievements])];
            AppState.set('unlockedAchievements', merged);
        }

        // Покупки
        if (data.purchases) {
            const localPurchases = AppState.get('purchasedItems');
            const mergedPurchases = [...new Set([...localPurchases, ...data.purchases])];
            AppState.set('purchasedItems', mergedPurchases);
        }

        // Кастомная тема
        if (data.customTheme && !AppState.get('activeCustomTheme')) {
            AppState.set('activeCustomTheme', data.customTheme);
            if (typeof initCustomTheme === 'function') initCustomTheme();
        }

        // Задания
        if (data.questState?.dailyQuestDate) {
            const localQuest = JSON.parse(localStorage.getItem('quizhub-quest-state') || '{}');
            if (!localQuest.dailyQuestDate || data.questState.dailyQuestDate >= localQuest.dailyQuestDate) {
                localStorage.setItem('quizhub-quest-state', JSON.stringify(data.questState));
                if (typeof loadQuestState === 'function') loadQuestState();
            }
        }

        // Настройки
        if (data.settings?.theme && !AppState.get('settings.theme')) {
            AppState.set('settings.theme', data.settings.theme);
            if (typeof initTheme === 'function') initTheme();
        }
        if (data.settings?.locale && !AppState.get('settings.locale')) {
            AppState.set('settings.locale', data.settings.locale);
            if (typeof setLocale === 'function') setLocale(data.settings.locale);
        }

        // Друзья
        if (data.friends) {
            const localFriends = AppState.get('friendsList');
            const mergedFriends = [...new Set([...localFriends, ...data.friends])];
            AppState.set('friendsList', mergedFriends);
        }

        console.log('✅ Синхронизация завершена');
        setTimeout(() => saveUserDataToFirestore(), 2000);

    } catch (error) { console.error('Ошибка загрузки:', error); }
}

function listenToUserDataChanges() {
    if (typeof currentUser === 'undefined' || !currentUser) return;

    db.collection('users').doc(currentUser.uid).onSnapshot(doc => {
        if (!doc.exists) return;
        const data = doc.data();

        if (typeof data.coins === 'number') {
            const localCoins = parseInt(localStorage.getItem('quizhub-coins') || '0');
            if (data.coins > localCoins) {
                localStorage.setItem('quizhub-coins', data.coins.toString());
                if (typeof userCoins !== 'undefined') userCoins = data.coins;
                if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();
            }
        }

        if (data.purchases) {
            const localPurchases = JSON.parse(localStorage.getItem('quizhub-purchases') || '[]');
            const merged = [...new Set([...localPurchases, ...data.purchases])];
            if (merged.length > localPurchases.length) {
                localStorage.setItem('quizhub-purchases', JSON.stringify(merged));
                if (typeof purchasedItems !== 'undefined') purchasedItems = merged;
            }
        }

        if (data.achievements) {
            const local = JSON.parse(localStorage.getItem('quizhub-achievements') || '[]');
            const merged = [...new Set([...local, ...data.achievements])];
            if (merged.length > local.length) {
                localStorage.setItem('quizhub-achievements', JSON.stringify(merged));
                if (typeof unlockedAchievements !== 'undefined') unlockedAchievements = merged;
            }
        }

        // Задания в реальном времени
        if (data.questState) {
            const localQuest = JSON.parse(localStorage.getItem('quizhub-quest-state') || '{}');
            if (JSON.stringify(data.questState) !== JSON.stringify(localQuest)) {
                localStorage.setItem('quizhub-quest-state', JSON.stringify(data.questState));
                if (typeof loadQuestState === 'function') loadQuestState();
            }
        }
    });
}

setInterval(() => {
    if (typeof currentUser !== 'undefined' && currentUser) saveUserDataToFirestore();
}, 60000);

setTimeout(() => {
    if (typeof currentUser !== 'undefined' && currentUser) {
        loadUserDataFromFirestore().then(() => listenToUserDataChanges());
    }
}, 1000);

if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
        if (user) loadUserDataFromFirestore().then(() => listenToUserDataChanges());
    });
}