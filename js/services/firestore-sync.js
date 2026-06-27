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
        coins: parseInt(localStorage.getItem('quizhub-coins') || '0'),
        totalXP: (typeof quizStats !== 'undefined' ? quizStats.totalXP : 0) || 0,
        bestScore: (typeof quizStats !== 'undefined' ? quizStats.bestScore : 0) || 0,
        totalQuizzes: (typeof quizStats !== 'undefined' ? quizStats.totalQuizzes : 0) || 0,
        dayStreak: (typeof quizStats !== 'undefined' ? quizStats.dayStreak : 0) || 0,
        achievements: JSON.parse(localStorage.getItem('quizhub-achievements') || '[]'),
        purchases: JSON.parse(localStorage.getItem('quizhub-purchases') || '[]'),
        customTheme: localStorage.getItem('quizhub-custom-theme') || null,
        stats: typeof quizStats !== 'undefined' ? quizStats : {},
        questState: JSON.parse(localStorage.getItem('quizhub-quest-state') || '{}'),
        settings: {
            theme: localStorage.getItem('quizhub-theme') || 'dark',
            locale: localStorage.getItem('quizhub-locale') || 'ru',
        },
        friends: JSON.parse(localStorage.getItem('quizhub-friends') || '[]'),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
        const doc = await userRef.get();
        if (doc.exists) await userRef.update(data);
        else await userRef.set({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        console.log('💾 Данные сохранены в Firestore');
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
            const localCoins = parseInt(localStorage.getItem('quizhub-coins') || '0');
            const bestCoins = Math.max(data.coins, localCoins);
            localStorage.setItem('quizhub-coins', bestCoins.toString());
            if (typeof userCoins !== 'undefined') userCoins = bestCoins;
            if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();
        }

        // Достижения
        if (data.achievements) {
            const local = JSON.parse(localStorage.getItem('quizhub-achievements') || '[]');
            const merged = [...new Set([...local, ...data.achievements])];
            localStorage.setItem('quizhub-achievements', JSON.stringify(merged));
            if (typeof unlockedAchievements !== 'undefined') unlockedAchievements = merged;
        }

        // Покупки
        if (data.purchases) {
            const localPurchases = JSON.parse(localStorage.getItem('quizhub-purchases') || '[]');
            const mergedPurchases = [...new Set([...localPurchases, ...data.purchases])];
            localStorage.setItem('quizhub-purchases', JSON.stringify(mergedPurchases));
            if (typeof purchasedItems !== 'undefined') purchasedItems = mergedPurchases;
        }

        // Тема
        if (data.customTheme && !localStorage.getItem('quizhub-custom-theme')) {
            localStorage.setItem('quizhub-custom-theme', data.customTheme);
            if (typeof activeCustomTheme !== 'undefined') activeCustomTheme = data.customTheme;
            if (typeof initCustomTheme === 'function') initCustomTheme();
        }

        // Статистика
        if (data.stats) {
            const localStats = JSON.parse(localStorage.getItem('quizhub-stats') || '{}');
            const merged = { ...data.stats, ...localStats, bestScore: Math.max(data.stats.bestScore||0, localStats.bestScore||0), totalXP: Math.max(data.stats.totalXP||0, localStats.totalXP||0), totalQuizzes: Math.max(data.stats.totalQuizzes||0, localStats.totalQuizzes||0), dayStreak: Math.max(data.stats.dayStreak||0, localStats.dayStreak||0) };
            localStorage.setItem('quizhub-stats', JSON.stringify(merged));
            if (typeof quizStats !== 'undefined') Object.assign(quizStats, merged);
        }

        // === ЗАДАНИЯ ===
        if (data.questState && data.questState.dailyQuestDate) {
            const localQuest = JSON.parse(localStorage.getItem('quizhub-quest-state') || '{}');
            if (!localQuest.dailyQuestDate || data.questState.dailyQuestDate >= localQuest.dailyQuestDate) {
                localStorage.setItem('quizhub-quest-state', JSON.stringify(data.questState));
                if (typeof loadQuestState === 'function') loadQuestState();
                console.log('📋 Задания синхронизированы из облака');
            }
        }

        // Настройки
        if (data.settings?.theme && !localStorage.getItem('quizhub-theme')) {
            localStorage.setItem('quizhub-theme', data.settings.theme);
            if (typeof initTheme === 'function') initTheme();
        }
        if (data.settings?.locale && !localStorage.getItem('quizhub-locale')) {
            localStorage.setItem('quizhub-locale', data.settings.locale);
            if (typeof setLocale === 'function') setLocale(data.settings.locale);
        }

        // Друзья
        if (data.friends) {
            const localFriends = JSON.parse(localStorage.getItem('quizhub-friends') || '[]');
            const mergedFriends = [...new Set([...localFriends, ...data.friends])];
            localStorage.setItem('quizhub-friends', JSON.stringify(mergedFriends));
            if (typeof friendsList !== 'undefined') friendsList = mergedFriends;
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