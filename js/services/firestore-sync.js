// ============================================
// QuizHub — Синхронизация через Firestore v2.0
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
    stats: typeof quizStats !== 'undefined' ? quizStats : {},
    settings: {
      theme: localStorage.getItem('quizhub-theme') || 'dark',
      locale: localStorage.getItem('quizhub-locale') || 'ru',
    },
    purchases: JSON.parse(localStorage.getItem('quizhub-purchases') || '[]'),
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
  
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (!doc.exists) { await saveUserDataToFirestore(); return; }
    
    const data = doc.data();
    console.log('📥 Данные загружены из Firestore');
    
    if (typeof data.coins === 'number') {
      localStorage.setItem('quizhub-coins', data.coins.toString());
      if (typeof userCoins !== 'undefined') userCoins = data.coins;
      if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();
    }
    
    if (data.achievements) {
      const local = JSON.parse(localStorage.getItem('quizhub-achievements') || '[]');
      const merged = [...new Set([...local, ...data.achievements])];
      localStorage.setItem('quizhub-achievements', JSON.stringify(merged));
      if (typeof unlockedAchievements !== 'undefined') unlockedAchievements = merged;
    }
    
    if (data.stats) {
      const localStats = JSON.parse(localStorage.getItem('quizhub-stats') || '{}');
      const merged = { ...data.stats, ...localStats, bestScore: Math.max(data.stats.bestScore||0, localStats.bestScore||0), totalXP: Math.max(data.stats.totalXP||0, localStats.totalXP||0) };
      localStorage.setItem('quizhub-stats', JSON.stringify(merged));
      if (typeof quizStats !== 'undefined') Object.assign(quizStats, merged);
    }
    
    if (data.settings?.theme) { localStorage.setItem('quizhub-theme', data.settings.theme); if (typeof initTheme === 'function') initTheme(); }
    if (data.settings?.locale) { localStorage.setItem('quizhub-locale', data.settings.locale); if (typeof setLocale === 'function') setLocale(data.settings.locale); }
    if (data.purchases) { localStorage.setItem('quizhub-purchases', JSON.stringify(data.purchases)); }
    if (data.friends) { localStorage.setItem('quizhub-friends', JSON.stringify(data.friends)); if (typeof friendsList !== 'undefined') friendsList = data.friends; }
    
  } catch (error) { console.error('Ошибка загрузки:', error); }
}

function listenToUserDataChanges() {
  if (typeof currentUser === 'undefined' || !currentUser) return;
  db.collection('users').doc(currentUser.uid).onSnapshot(doc => {
    if (!doc.exists) return;
    const data = doc.data();
    if (typeof data.coins === 'number' && data.coins !== parseInt(localStorage.getItem('quizhub-coins')||'0')) {
      localStorage.setItem('quizhub-coins', data.coins.toString());
      if (typeof userCoins !== 'undefined') userCoins = data.coins;
      if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();
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
    if (user) { loadUserDataFromFirestore().then(() => listenToUserDataChanges()); }
  });
}