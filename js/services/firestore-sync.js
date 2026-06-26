// ============================================
// QuizHub — Синхронизация через Firestore v2.2
// ============================================

async function saveUserDataToFirestore() {
  if (typeof currentUser === 'undefined' || !currentUser) return;
  
  const userRef = db.collection('users').doc(currentUser.uid);
  const data = {
    displayName: currentUser.displayName || 'Игрок',
    photoURL: currentUser.photoURL || null,
    email: currentUser.email || null,
    
    // Монеты — сохраняем актуальное значение
    coins: parseInt(localStorage.getItem('quizhub-coins') || '0'),
    
    // Статистика
    totalXP: (typeof quizStats !== 'undefined' ? quizStats.totalXP : 0) || 0,
    bestScore: (typeof quizStats !== 'undefined' ? quizStats.bestScore : 0) || 0,
    totalQuizzes: (typeof quizStats !== 'undefined' ? quizStats.totalQuizzes : 0) || 0,
    dayStreak: (typeof quizStats !== 'undefined' ? quizStats.dayStreak : 0) || 0,
    
    // Достижения
    achievements: JSON.parse(localStorage.getItem('quizhub-achievements') || '[]'),
    
    // Покупки
    purchases: JSON.parse(localStorage.getItem('quizhub-purchases') || '[]'),
    
    // Активная тема
    customTheme: localStorage.getItem('quizhub-custom-theme') || null,
    
    // Статистика
    stats: typeof quizStats !== 'undefined' ? quizStats : {},
    
    // Настройки
    settings: {
      theme: localStorage.getItem('quizhub-theme') || 'dark',
      locale: localStorage.getItem('quizhub-locale') || 'ru',
    },
    
    // Друзья
    friends: JSON.parse(localStorage.getItem('quizhub-friends') || '[]'),
    
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  
  try {
    const doc = await userRef.get();
    if (doc.exists) await userRef.update(data);
    else await userRef.set({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    console.log('💾 Данные сохранены в Firestore (монеты:', data.coins, ')');
  } catch (error) { console.error('Ошибка сохранения:', error); }
}

async function loadUserDataFromFirestore() {
  if (typeof currentUser === 'undefined' || !currentUser) return;
  
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (!doc.exists) { await saveUserDataToFirestore(); return; }
    
    const data = doc.data();
    console.log('📥 Данные загружены из Firestore');
    
    // === МОНЕТЫ (исправлено) ===
    if (typeof data.coins === 'number') {
      const localCoins = parseInt(localStorage.getItem('quizhub-coins') || '0');
      // Берём максимум — локальные могли измениться после покупки
      const bestCoins = Math.max(data.coins, localCoins);
      localStorage.setItem('quizhub-coins', bestCoins.toString());
      if (typeof userCoins !== 'undefined') userCoins = bestCoins;
      if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();
      console.log('🪙 Монеты:', { local: localCoins, cloud: data.coins, result: bestCoins });
    }
    
    // === ДОСТИЖЕНИЯ ===
    if (data.achievements) {
      const local = JSON.parse(localStorage.getItem('quizhub-achievements') || '[]');
      const merged = [...new Set([...local, ...data.achievements])];
      localStorage.setItem('quizhub-achievements', JSON.stringify(merged));
      if (typeof unlockedAchievements !== 'undefined') unlockedAchievements = merged;
    }
    
    // === ПОКУПКИ ===
    if (data.purchases) {
      const localPurchases = JSON.parse(localStorage.getItem('quizhub-purchases') || '[]');
      const mergedPurchases = [...new Set([...localPurchases, ...data.purchases])];
      localStorage.setItem('quizhub-purchases', JSON.stringify(mergedPurchases));
      if (typeof purchasedItems !== 'undefined') purchasedItems = mergedPurchases;
    }
    
    // === ТЕМА ===
    if (data.customTheme) {
      localStorage.setItem('quizhub-custom-theme', data.customTheme);
      if (typeof activeCustomTheme !== 'undefined') activeCustomTheme = data.customTheme;
      if (typeof initCustomTheme === 'function') initCustomTheme();
    }
    
    // === СТАТИСТИКА ===
    if (data.stats) {
      const localStats = JSON.parse(localStorage.getItem('quizhub-stats') || '{}');
      const merged = {
        ...data.stats, ...localStats,
        bestScore: Math.max(data.stats.bestScore || 0, localStats.bestScore || 0),
        totalXP: Math.max(data.stats.totalXP || 0, localStats.totalXP || 0),
        totalQuizzes: Math.max(data.stats.totalQuizzes || 0, localStats.totalQuizzes || 0),
        dayStreak: Math.max(data.stats.dayStreak || 0, localStats.dayStreak || 0),
      };
      localStorage.setItem('quizhub-stats', JSON.stringify(merged));
      if (typeof quizStats !== 'undefined') Object.assign(quizStats, merged);
    }
    
    // === НАСТРОЙКИ ===
    if (data.settings?.theme && !localStorage.getItem('quizhub-theme')) {
      localStorage.setItem('quizhub-theme', data.settings.theme);
      if (typeof initTheme === 'function') initTheme();
    }
    if (data.settings?.locale && !localStorage.getItem('quizhub-locale')) {
      localStorage.setItem('quizhub-locale', data.settings.locale);
      if (typeof setLocale === 'function') setLocale(data.settings.locale);
    }
    
    // === ДРУЗЬЯ ===
    if (data.friends) {
      const localFriends = JSON.parse(localStorage.getItem('quizhub-friends') || '[]');
      const mergedFriends = [...new Set([...localFriends, ...data.friends])];
      localStorage.setItem('quizhub-friends', JSON.stringify(mergedFriends));
      if (typeof friendsList !== 'undefined') friendsList = mergedFriends;
    }
    
    console.log('✅ Синхронизация завершена');
    
    // После загрузки — сохраняем локальное состояние в облако
    setTimeout(() => saveUserDataToFirestore(), 2000);
    
  } catch (error) { console.error('Ошибка загрузки:', error); }
}

function listenToUserDataChanges() {
  if (typeof currentUser === 'undefined' || !currentUser) return;
  
  db.collection('users').doc(currentUser.uid).onSnapshot(doc => {
    if (!doc.exists) return;
    const data = doc.data();
    
    // Монеты — только если в облаке больше
    if (typeof data.coins === 'number') {
      const localCoins = parseInt(localStorage.getItem('quizhub-coins') || '0');
      if (data.coins > localCoins) {
        localStorage.setItem('quizhub-coins', data.coins.toString());
        if (typeof userCoins !== 'undefined') userCoins = data.coins;
        if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();
      }
    }
    
    // Покупки
    if (data.purchases) {
      const localPurchases = JSON.parse(localStorage.getItem('quizhub-purchases') || '[]');
      const merged = [...new Set([...localPurchases, ...data.purchases])];
      if (merged.length > localPurchases.length) {
        localStorage.setItem('quizhub-purchases', JSON.stringify(merged));
        if (typeof purchasedItems !== 'undefined') purchasedItems = merged;
      }
    }
  });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

setTimeout(() => {
  if (typeof currentUser !== 'undefined' && currentUser) {
    loadUserDataFromFirestore().then(() => listenToUserDataChanges());
  }
}, 1000);

if (typeof auth !== 'undefined') {
  auth.onAuthStateChanged(user => {
    if (user) {
      loadUserDataFromFirestore().then(() => listenToUserDataChanges());
    }
  });
}