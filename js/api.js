// ============================================
// QuizHub — Работа с Firestore v2.0
// Лидеры по сложности, без повторов
// ============================================

// Сохранение результата в Firestore
async function saveResult(result) {
  try {
    const userId = result.userId || 'anonymous';
    const difficulty = result.difficulty || 'easy';
    
    // Ищем существующий результат этого пользователя на этой сложности
    const existingQuery = await db.collection('leaderboard')
      .where('userId', '==', userId)
      .where('difficulty', '==', difficulty)
      .get();
    
    if (!existingQuery.empty) {
      // Пользователь уже есть в этой категории сложности
      const existingDoc = existingQuery.docs[0];
      const existingData = existingDoc.data();
      
      // Обновляем ТОЛЬКО если новый результат ЛУЧШЕ
      if (result.score > existingData.score || 
          (result.score === existingData.score && result.totalTime < existingData.totalTime)) {
        
        await db.collection('leaderboard').doc(existingDoc.id).update({
          score: result.score,
          totalTime: result.totalTime,
          correctAnswers: result.correctAnswers,
          category: result.category || 'Любая',
          date: firebase.firestore.FieldValue.serverTimestamp(),
          playerName: result.playerName,
          photoURL: currentUser ? currentUser.photoURL : null
        });
        
        console.log(`Результат улучшен (${difficulty}):`, result.score);
        showToast(`Результат улучшен! 🎉`, 'success');
        return existingDoc.id;
      } else {
        console.log(`Результат не улучшен (${difficulty}), оставляем старый`);
        showToast(`Текущий рекорд: ${existingData.score} очков. Не побит 😅`, 'info');
        return existingDoc.id;
      }
    } else {
      // Новый пользователь в этой сложности
      const docRef = await db.collection('leaderboard').add({
        playerName: result.playerName,
        score: result.score,
        totalTime: result.totalTime,
        correctAnswers: result.correctAnswers,
        difficulty: difficulty,
        category: result.category || 'Любая',
        date: firebase.firestore.FieldValue.serverTimestamp(),
        userId: userId,
        photoURL: currentUser ? currentUser.photoURL : null
      });
      
      console.log('Новый результат сохранён:', docRef.id);
      return docRef.id;
    }
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    showToast('Не удалось сохранить результат 😢', 'danger');
    return null;
  }
}

// Получение таблицы лидеров по сложности
function getLeaderboard(difficulty = 'easy', limit = 20) {
  return db.collection('leaderboard')
    .where('difficulty', '==', difficulty)
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
function onLeaderboardUpdate(callback, difficulty = 'easy', limit = 20) {
  return db.collection('leaderboard')
    .where('difficulty', '==', difficulty)
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

// Удаление старых результатов пользователя (опционально)
async function cleanUserResults(userId) {
  try {
    const snapshot = await db.collection('leaderboard')
      .where('userId', '==', userId)
      .get();
    
    // Оставляем только лучший результат для каждой сложности
    const difficulties = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const diff = data.difficulty;
      
      if (!difficulties[diff] || data.score > difficulties[diff].score) {
        if (difficulties[diff]) {
          // Удаляем старый лучший результат
          difficulties[diff].ref.delete();
        }
        difficulties[diff] = { score: data.score, ref: doc.ref };
      } else {
        // Удаляем худший результат
        doc.ref.delete();
      }
    });
  } catch (error) {
    console.error('Ошибка очистки:', error);
  }
}