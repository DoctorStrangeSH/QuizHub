// ============================================
// QuizHub — Работа с Firestore
// ============================================

// Сохранение результата в Firestore
async function saveResult(result) {
  try {
    const docRef = await db.collection('leaderboard').add({
      playerName: result.playerName,
      score: result.score,
      totalTime: result.totalTime,
      correctAnswers: result.correctAnswers,
      difficulty: result.difficulty,
      category: result.category || 'Любая',
      date: firebase.firestore.FieldValue.serverTimestamp(),
      userId: result.userId || null,
      photoURL: currentUser ? currentUser.photoURL : null
    });
    
    console.log('Результат сохранён:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    showToast('Не удалось сохранить результат 😢', 'danger');
    return null;
  }
}

// Получение таблицы лидеров
function getLeaderboard(limit = 20) {
  return db.collection('leaderboard')
    .orderBy('score', 'desc')
    .orderBy('totalTime', 'asc')
    .limit(limit)
    .get()
    .then(snapshot => {
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    })
    .catch(error => {
      console.error('Ошибка загрузки лидеров:', error);
      return [];
    });
}

// Real-time подписка на таблицу лидеров
function onLeaderboardUpdate(callback, limit = 20) {
  return db.collection('leaderboard')
    .orderBy('score', 'desc')
    .orderBy('totalTime', 'asc')
    .limit(limit)
    .onSnapshot(snapshot => {
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      callback(results);
    }, error => {
      console.error('Ошибка подписки:', error);
    });
}