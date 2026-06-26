// ============================================
// QuizHub — Firestore + загрузка вопросов v3.0
// ============================================

// ========== FIRESTORE: ЛИДЕРБОРД ==========

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
          photoURL: typeof currentUser !== 'undefined' ? currentUser?.photoURL : null
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
        photoURL: typeof currentUser !== 'undefined' ? currentUser?.photoURL : null
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

function getLeaderboard(difficulty = 'easy', limit = 20) {
  return db.collection('leaderboard')
    .where('difficulty', '==', difficulty)
    .get()
    .then(snapshot => {
      const results = [];
      snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
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

function onLeaderboardUpdate(callback, difficulty = 'easy', limit = 20) {
  return db.collection('leaderboard')
    .where('difficulty', '==', difficulty)
    .onSnapshot(snapshot => {
      const results = [];
      snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
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

// ========== ЗАГРУЗКА ВОПРОСОВ ИЗ JSON-ФАЙЛОВ ==========

let questionsCache = {};
let russianQuestionsData = null;

async function loadQuestionsByCategory(category) {
  if (questionsCache[category]) {
    return questionsCache[category];
  }

  try {
    const response = await fetch(`data/questions/${category}.json`);
    if (!response.ok) throw new Error(`Файл ${category}.json не найден`);
    const data = await response.json();

    data.questions = data.questions.map(q => ({
      ...q,
      category: q.category || data.category || category
    }));

    questionsCache[category] = data;
    console.log(`Загружено вопросов категории "${category}": ${data.questions.length}`);
    return data;
  } catch (error) {
    console.error(`Ошибка загрузки категории "${category}":`, error);
    return { category, questions: [] };
  }
}

async function loadAllQuestions() {
  try {
    const response = await fetch('data/questions/index.json');
    if (!response.ok) throw new Error('index.json не найден');
    const index = await response.json();

    const categories = Object.keys(index.categories);
    const allQuestions = [];

    const results = await Promise.all(
      categories.map(cat => loadQuestionsByCategory(cat))
    );

    results.forEach(data => {
      allQuestions.push(...data.questions);
    });

    console.log(`Всего загружено вопросов: ${allQuestions.length}`);

    return {
      categories: index.categories,
      questions: allQuestions
    };
  } catch (error) {
    console.error('Ошибка загрузки вопросов:', error);
    return null;
  }
}

async function loadRussianQuestions() {
  if (russianQuestionsData) return russianQuestionsData;

  russianQuestionsData = await loadAllQuestions();

  if (russianQuestionsData && russianQuestionsData.questions.length > 0) {
    console.log(`Всего загружено вопросов: ${russianQuestionsData.questions.length}`);
  }

  return russianQuestionsData;
}

function getLocalQuestionsFromJSON(data, category, difficulty, count) {
  if (!data || !data.questions) return [];

  let pool = [...data.questions];

  // 1. Фильтр по сложности
  if (difficulty && difficulty !== 'any') {
    const diffPool = pool.filter(q => q.difficulty === difficulty);
    if (diffPool.length >= count) {
      pool = diffPool;
    } else if (diffPool.length > 0) {
      const remaining = pool.filter(q => q.difficulty !== difficulty);
      pool = [...diffPool, ...shuffleArray(remaining).slice(0, count - diffPool.length)];
    }
  }

  // 2. Фильтр по категории
  if (category && category !== 'any') {
    const catPool = pool.filter(q => q.category === category);
    console.log(`Категория: ${category}, найдено: ${catPool.length} вопросов`);
    if (catPool.length >= count) {
      pool = catPool;
    } else if (catPool.length > 0) {
      const remaining = pool.filter(q => q.category !== category);
      pool = [...catPool, ...shuffleArray(remaining).slice(0, count - catPool.length)];
    }
  }

  // 3. Поиск по ключевым словам
  const searchInput = document.getElementById('search-keywords');
  if (searchInput && searchInput.value.trim().length >= 2) {
    const keyword = searchInput.value.trim().toLowerCase();
    const searchPool = pool.filter(q => {
      if (q.question.toLowerCase().includes(keyword)) return true;
      if (q.answers.some(a => a.toLowerCase().includes(keyword))) return true;
      if (q.tags && q.tags.some(t => t.toLowerCase().includes(keyword))) return true;
      if (q.category && data.categories && data.categories[q.category]?.toLowerCase().includes(keyword)) return true;
      return false;
    });
    if (searchPool.length > 0) pool = searchPool;
  }

  // Убираем дубликаты
  pool = pool.filter((q, i, self) => self.findIndex(t => t.question === q.question) === i);

  // Берём нужное количество
  const selected = shuffleArray(pool).slice(0, Math.min(count, pool.length));

  console.log(`Выбрано ${selected.length} вопросов (сложность: ${difficulty}, категория: ${category})`);

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

// ========== АНГЛИЙСКИЕ ВОПРОСЫ ==========

async function fetchEnglishQuestions(category, difficulty) {
  try {
    const url = new URL('https://opentdb.com/api.php');
    url.searchParams.set('amount', '10');
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

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}