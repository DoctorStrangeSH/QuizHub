// ============================================
// QuizHub — Работа с Firestore v2.2
// ============================================

// Сохранение результата
async function saveResult(result) {
  try {
    const userId = result.userId || 'anonymous';
    const difficulty = result.difficulty || 'easy';
    
    const existingQuery = await db.collection('leaderboard')
      .where('userId', '==', userId)
      .where('difficulty', '==', difficulty)
      .get();
    
    if (!existingQuery.empty) {
      const existingDoc = existingQuery.docs[0];
      const existingData = existingDoc.data();
      
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
        showToast(`Новый рекорд: ${result.score} очков! 🎉`, 'success');
        return existingDoc.id;
      } else {
        console.log(`Результат не улучшен (${difficulty})`);
        showToast(`Рекорд ${existingData.score} очков не побит 😅`, 'info');
        return existingDoc.id;
      }
    } else {
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
      
      console.log('Новый результат:', docRef.id);
      return docRef.id;
    }
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    showToast('Не удалось сохранить результат 😢', 'danger');
    return null;
  }
}

// Получение лидеров (без составного индекса)
function getLeaderboard(difficulty = 'easy', limit = 20) {
  return db.collection('leaderboard')
    .where('difficulty', '==', difficulty)
    .get()
    .then(snapshot => {
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      
      results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.totalTime - b.totalTime;
      });
      
      return results.slice(0, limit);
    })
    .catch(error => {
      console.error('Ошибка загрузки:', error);
      return [];
    });
}

// Real-time подписка
function onLeaderboardUpdate(callback, difficulty = 'easy', limit = 20) {
  return db.collection('leaderboard')
    .where('difficulty', '==', difficulty)
    .onSnapshot(snapshot => {
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      
      results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.totalTime - b.totalTime;
      });
      
      callback(results.slice(0, limit));
    }, error => {
      console.error('Ошибка подписки:', error);
      callback([]);
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