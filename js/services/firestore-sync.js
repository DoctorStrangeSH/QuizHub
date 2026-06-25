// ============================================
// QuizHub — Синхронизация данных через Firestore
// Все достижения, монеты, прогресс — в облаке
// ============================================

// ========== СТРУКТУРА ДАННЫХ В FIRESTORE ==========
// users/{uid}
// {
//   displayName: string,
//   photoURL: string,
//   email: string,
//   coins: number,
//   totalXP: number,
//   bestScore: number,
//   totalQuizzes: number,
//   dayStreak: number,
//   lastActiveDate: string,
//   achievements: [string],  // массив id достижений
//   stats: { ... },          // вся статистика
//   settings: {
//     theme: 'dark',
//     locale: 'ru',
//     soundEnabled: true,
//     animationType: 'flip'
//   },
//   createdAt: timestamp,
//   updatedAt: timestamp
// }

// ========== СОХРАНЕНИЕ ДАННЫХ В FIRESTORE ==========

async function saveUserDataToFirestore() {
  if (!currentUser) return;
  
  const userRef = db.collection('users').doc(currentUser.uid);
  
  const data = {
    displayName: currentUser.displayName || 'Игрок',
    photoURL: currentUser.photoURL || null,
    email: currentUser.email || null,
    
    // Игровые данные
    coins: parseInt(localStorage.getItem('quizhub-coins') || '0'),
    totalXP: (typeof quizStats !== 'undefined' ? quizStats.totalXP : 0) || 0,
    bestScore: (typeof quizStats !== 'undefined' ? quizStats.bestScore : 0) || 0,
    totalQuizzes: (typeof quizStats !== 'undefined' ? quizStats.totalQuizzes : 0) || 0,
    dayStreak: (typeof quizStats !== 'undefined' ? quizStats.dayStreak : 0) || 0,
    lastActiveDate: (typeof quizStats !== 'undefined' ? quizStats.lastActiveDate : '') || '',
    
    // Достижения
    achievements: JSON.parse(localStorage.getItem('quizhub-achievements') || '[]'),
    
    // Полная статистика
    stats: typeof quizStats !== 'undefined' ? quizStats : {},
    
    // Настройки
    settings: {
      theme: localStorage.getItem('quizhub-theme') || 'dark',
      locale: localStorage.getItem('quizhub-locale') || 'ru',
      soundEnabled: typeof soundsEnabled !== 'undefined' ? soundsEnabled : true,
      animationType: localStorage.getItem('quizhub-animation') || 'flip',
    },
    
    // Покупки
    purchases: JSON.parse(localStorage.getItem('quizhub-purchases') || '[]'),
    
    // Команда
    team: JSON.parse(localStorage.getItem('quizhub-team') || 'null'),
    
    // Друзья
    friends: JSON.parse(localStorage.getItem('quizhub-friends') || '[]'),
    
    // Мета
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  
  // Создаём или обновляем
  try {
    const doc = await userRef.get();
    if (doc.exists) {
      await userRef.update(data);
    } else {
      await userRef.set({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
    console.log('💾 Данные сохранены в Firestore');
  } catch (error) {
    console.error('Ошибка сохранения в Firestore:', error);
  }
}

// ========== ЗАГРУЗКА ДАННЫХ ИЗ FIRESTORE ==========

async function loadUserDataFromFirestore() {
  if (!currentUser) return;
  
  const userRef = db.collection('users').doc(currentUser.uid);
  
  try {
    const doc = await userRef.get();
    
    if (!doc.exists) {
      console.log('📄 Новый пользователь, сохраняем локальные данные');
      await saveUserDataToFirestore();
      return;
    }
    
    const data = doc.data();
    console.log('📥 Данные загружены из Firestore');
    
    // Восстанавливаем монеты
    if (typeof data.coins === 'number') {
      localStorage.setItem('quizhub-coins', data.coins.toString());
      if (typeof userCoins !== 'undefined') userCoins = data.coins;
      if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();
    }
    
    // Восстанавливаем достижения
    if (data.achievements) {
      const localAchievements = JSON.parse(localStorage.getItem('quizhub-achievements') || '[]');
      // Объединяем локальные и облачные
      const merged = [...new Set([...localAchievements, ...data.achievements])];
      localStorage.setItem('quizhub-achievements', JSON.stringify(merged));
      if (typeof unlockedAchievements !== 'undefined') unlockedAchievements = merged;
    }
    
    // Восстанавливаем статистику (сохраняем лучшие значения)
    if (data.stats) {
      const localStats = JSON.parse(localStorage.getItem('quizhub-stats') || '{}');
      const mergedStats = {
        ...data.stats,
        ...localStats,
        // Берем лучшие значения
        bestScore: Math.max(data.stats.bestScore || 0, localStats.bestScore || 0),
        totalQuizzes: Math.max(data.stats.totalQuizzes || 0, localStats.totalQuizzes || 0),
        totalXP: Math.max(data.stats.totalXP || 0, localStats.totalXP || 0),
        fastestAnswer: Math.min(data.stats.fastestAnswer || 999, localStats.fastestAnswer || 999),
        maxStreak: Math.max(data.stats.maxStreak || 0, localStats.maxStreak || 0),
      };
      localStorage.setItem('quizhub-stats', JSON.stringify(mergedStats));
      if (typeof quizStats !== 'undefined') Object.assign(quizStats, mergedStats);
    }
    
    // Восстанавливаем настройки
    if (data.settings) {
      if (data.settings.theme && !localStorage.getItem('quizhub-theme')) {
        localStorage.setItem('quizhub-theme', data.settings.theme);
        if (typeof initTheme === 'function') initTheme();
      }
      if (data.settings.locale && !localStorage.getItem('quizhub-locale')) {
        localStorage.setItem('quizhub-locale', data.settings.locale);
        if (typeof setLocale === 'function') setLocale(data.settings.locale);
      }
      if (typeof data.settings.soundEnabled === 'boolean' && typeof soundsEnabled !== 'undefined') {
        soundsEnabled = data.settings.soundEnabled;
      }
      if (data.settings.animationType) {
        localStorage.setItem('quizhub-animation', data.settings.animationType);
        if (typeof animationType !== 'undefined') animationType = data.settings.animationType;
      }
    }
    
    // Восстанавливаем покупки
    if (data.purchases) {
      const localPurchases = JSON.parse(localStorage.getItem('quizhub-purchases') || '[]');
      const mergedPurchases = [...new Set([...localPurchases, ...data.purchases])];
      localStorage.setItem('quizhub-purchases', JSON.stringify(mergedPurchases));
    }
    
    // Восстанавливаем команду
    if (data.team) {
      localStorage.setItem('quizhub-team', JSON.stringify(data.team));
      if (typeof userTeam !== 'undefined') userTeam = data.team;
    }
    
    // Восстанавливаем друзей
    if (data.friends) {
      const localFriends = JSON.parse(localStorage.getItem('quizhub-friends') || '[]');
      const mergedFriends = [...new Set([...localFriends, ...data.friends])];
      localStorage.setItem('quizhub-friends', JSON.stringify(mergedFriends));
      if (typeof friendsList !== 'undefined') friendsList = mergedFriends;
    }
    
    // Обновляем отображение
    if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();
    if (typeof renderAchievementsScreen === 'function') {
      const screen = document.getElementById('screen-achievements');
      if (screen?.classList.contains('active')) renderAchievementsScreen();
    }
    
    showToast('Данные синхронизированы! ☁️', 'success');
    
  } catch (error) {
    console.error('Ошибка загрузки из Firestore:', error);
  }
}

// ========== АВТОСИНХРОНИЗАЦИЯ ==========

// Сохраняем при важных событиях
function setupAutoSync() {
  // После каждого квиза
  const originalFinishQuiz = typeof finishQuiz === 'function' ? finishQuiz : null;
  if (originalFinishQuiz) {
    finishQuiz = async function() {
      await originalFinishQuiz();
      await saveUserDataToFirestore();
    };
  }
  
  // При изменении монет
  const originalAddCoins = typeof addCoins === 'function' ? addCoins : null;
  if (originalAddCoins) {
    addCoins = function(amount) {
      originalAddCoins(amount);
      // Сохраняем с задержкой (debounce)
      if (addCoins._timeout) clearTimeout(addCoins._timeout);
      addCoins._timeout = setTimeout(() => saveUserDataToFirestore(), 2000);
    };
  }
  
  // При разблокировке достижения
  const originalShowAchievements = typeof showAchievements === 'function' ? showAchievements : null;
  if (originalShowAchievements) {
    showAchievements = function(achievements) {
      originalShowAchievements(achievements);
      saveUserDataToFirestore();
    };
  }
  
  // При смене темы
  const originalToggleTheme = typeof toggleTheme === 'function' ? toggleTheme : null;
  if (originalToggleTheme) {
    toggleTheme = function() {
      originalToggleTheme();
      saveUserDataToFirestore();
    };
  }
  
  // При смене языка
  const originalSetLocale = typeof setLocale === 'function' ? setLocale : null;
  if (originalSetLocale) {
    setLocale = function(locale) {
      originalSetLocale(locale);
      saveUserDataToFirestore();
    };
  }
  
  // Периодическое сохранение (каждые 5 минут)
  setInterval(() => {
    if (currentUser) saveUserDataToFirestore();
  }, 300000);
}

// ========== РЕАЛЬНОЕ ВРЕМЯ: СЛУШАЕМ ИЗМЕНЕНИЯ ==========

function listenToUserDataChanges() {
  if (!currentUser) return;
  
  db.collection('users').doc(currentUser.uid)
    .onSnapshot(doc => {
      if (!doc.exists) return;
      
      const data = doc.data();
      
      // Обновляем монеты в реальном времени (если изменились на другом устройстве)
      if (typeof data.coins === 'number') {
        const localCoins = parseInt(localStorage.getItem('quizhub-coins') || '0');
        if (data.coins !== localCoins) {
          localStorage.setItem('quizhub-coins', data.coins.toString());
          if (typeof userCoins !== 'undefined') userCoins = data.coins;
          if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();
          console.log('🔄 Монеты обновлены из облака:', data.coins);
        }
      }
      
      // Обновляем достижения
      if (data.achievements) {
        const localAchievements = JSON.parse(localStorage.getItem('quizhub-achievements') || '[]');
        if (data.achievements.length > localAchievements.length) {
          const merged = [...new Set([...localAchievements, ...data.achievements])];
          localStorage.setItem('quizhub-achievements', JSON.stringify(merged));
          if (typeof unlockedAchievements !== 'undefined') unlockedAchievements = merged;
        }
      }
    }, error => {
      console.error('Ошибка слушателя:', error);
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  // Ждём авторизации
  const checkAuth = setInterval(() => {
    if (typeof currentUser !== 'undefined' && currentUser) {
      clearInterval(checkAuth);
      loadUserDataFromFirestore().then(() => {
        listenToUserDataChanges();
        setupAutoSync();
      });
    }
  }, 500);
  
  // Останавливаем проверку через 10 секунд
  setTimeout(() => clearInterval(checkAuth), 10000);
});

// Слушаем изменения авторизации
if (typeof auth !== 'undefined') {
  auth.onAuthStateChanged(user => {
    if (user) {
      loadUserDataFromFirestore().then(() => {
        listenToUserDataChanges();
        setupAutoSync();
      });
    }
  });
}