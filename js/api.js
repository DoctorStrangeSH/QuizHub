// ============================================
// QuizHub — Работа с Firestore + загрузка вопросов из JSON
// ============================================

// ========== РАБОТА С FIRESTORE ==========

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
        showToast(`Новый рекорд: ${result.score} очков! 🎉`, 'success');
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
    .get()
    .then(snapshot => {
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      
      // Сортируем на клиенте
      results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.totalTime - b.totalTime;
      });
      
      return results.slice(0, limit);
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
    .onSnapshot(snapshot => {
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      
      // Сортируем на клиенте
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

// ========== ЗАГРУЗКА РУССКИХ ВОПРОСОВ ИЗ JSON ==========

let russianQuestionsData = null;

async function loadRussianQuestions() {
  if (russianQuestionsData) return russianQuestionsData;
  
  try {
    const response = await fetch('data/questions-ru.json');
    if (!response.ok) throw new Error('Файл не найден');
    russianQuestionsData = await response.json();
    console.log('Загружено русских вопросов:', russianQuestionsData.questions.length);
    return russianQuestionsData;
  } catch (error) {
    console.error('Ошибка загрузки вопросов:', error);
    return null;
  }
}

function getLocalQuestionsFromJSON(data, category, difficulty, count) {
  if (!data || !data.questions) return [];
  
  let pool = [...data.questions];
  
  // Фильтруем по категории
  if (category && category !== 'any') {
    pool = pool.filter(q => q.category === category);
  }
  
  // Фильтруем по сложности
  if (difficulty && difficulty !== 'any') {
    pool = pool.filter(q => q.difficulty === difficulty);
  }
  
  // Если не хватает вопросов, расширяем пул
  if (pool.length < count) {
    pool = [...data.questions];
    if (difficulty && difficulty !== 'any') {
      const diffPool = pool.filter(q => q.difficulty === difficulty);
      if (diffPool.length >= count) {
        pool = diffPool;
      }
    }
  }
  
  // Выбираем нужное количество
  const selected = shuffleArray(pool).slice(0, count);
  
  // Перемешиваем ответы
  return selected.map(q => {
    const answers = shuffleArray([...q.answers]);
    const correctAnswer = q.answers[q.correctIndex];
    return {
      ...q,
      answers: answers,
      correctIndex: answers.indexOf(correctAnswer)
    };
  });
}

// ========== ЗАГРУЗКА АНГЛИЙСКИХ ВОПРОСОВ ==========

async function fetchEnglishQuestions(category, difficulty) {
  try {
    const url = new URL('https://opentdb.com/api.php');
    url.searchParams.set('amount', 10);
    url.searchParams.set('type', 'multiple');
    
    if (category && category !== 'any') {
      url.searchParams.set('category', category);
    }
    if (difficulty && difficulty !== 'any') {
      url.searchParams.set('difficulty', difficulty);
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.response_code === 0 && data.results.length > 0) {
      return data.results.map(formatEnglishQuestion);
    }
  } catch (error) {
    console.log('API недоступен, переключаю на русскую базу');
    showToast('API недоступен. Загружаем русские вопросы.', 'warning');
  }
  
  // Fallback — русские вопросы
  const russianData = await loadRussianQuestions();
  return getLocalQuestionsFromJSON(russianData, category, difficulty, 10);
}

function formatEnglishQuestion(apiQuestion) {
  const decodeHTML = (html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };
  
  const answers = [
    ...apiQuestion.incorrect_answers.map(decodeHTML),
    decodeHTML(apiQuestion.correct_answer)
  ];
  
  const shuffled = shuffleArray(answers);
  
  return {
    question: decodeHTML(apiQuestion.question),
    answers: shuffled,
    correctIndex: shuffled.indexOf(decodeHTML(apiQuestion.correct_answer)),
    category: decodeHTML(apiQuestion.category),
    difficulty: apiQuestion.difficulty
  };
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}