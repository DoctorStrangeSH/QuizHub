// ============================================
// QuizHub — Firestore + загрузка вопросов v2.1
// ============================================

async function saveResult(result) {
  try {
    const userId = result.userId || 'anonymous';
    const difficulty = result.difficulty || 'easy';
    const existingQuery = await db.collection('leaderboard').where('userId', '==', userId).where('difficulty', '==', difficulty).get();

    if (!existingQuery.empty) {
      const doc = existingQuery.docs[0];
      const data = doc.data();
      if (result.score > data.score || (result.score === data.score && result.totalTime < data.totalTime)) {
        await db.collection('leaderboard').doc(doc.id).update({ score: result.score, totalTime: result.totalTime, correctAnswers: result.correctAnswers, category: result.category || 'Любая', date: firebase.firestore.FieldValue.serverTimestamp(), playerName: result.playerName, photoURL: typeof currentUser !== 'undefined' ? currentUser?.photoURL : null });
        showToast(`Новый рекорд: ${result.score} очков! 🎉`, 'success');
        return doc.id;
      } else { showToast(`Рекорд ${data.score} очков не побит 😅`, 'info'); return doc.id; }
    } else {
      const ref = await db.collection('leaderboard').add({ playerName: result.playerName, score: result.score, totalTime: result.totalTime, correctAnswers: result.correctAnswers, difficulty, category: result.category || 'Любая', date: firebase.firestore.FieldValue.serverTimestamp(), userId, photoURL: typeof currentUser !== 'undefined' ? currentUser?.photoURL : null });
      return ref.id;
    }
  } catch (e) { console.error(e); showToast('Не удалось сохранить результат', 'danger'); return null; }
}

function getLeaderboard(difficulty = 'easy', limit = 20) {
  return db.collection('leaderboard').where('difficulty', '==', difficulty).get().then(s => { const r = []; s.forEach(d => r.push({ id: d.id, ...d.data() })); r.sort((a, b) => b.score !== a.score ? b.score - a.score : a.totalTime - b.totalTime); return r.slice(0, limit); }).catch(() => []);
}

function onLeaderboardUpdate(callback, difficulty = 'easy', limit = 20) {
  return db.collection('leaderboard').where('difficulty', '==', difficulty).onSnapshot(s => { const r = []; s.forEach(d => r.push({ id: d.id, ...d.data() })); r.sort((a, b) => b.score !== a.score ? b.score - a.score : a.totalTime - b.totalTime); callback(r.slice(0, limit)); }, () => callback([]));
}

// ========== ВОПРОСЫ ==========

let russianQuestionsData = null;

async function loadRussianQuestions() {
  if (russianQuestionsData) return russianQuestionsData;
  try {
    const r = await fetch('data/questions-ru.json');
    if (!r.ok) throw new Error('Файл не найден');
    russianQuestionsData = await r.json();
    console.log('Загружено вопросов:', russianQuestionsData.questions.length);
    return russianQuestionsData;
  } catch (e) { console.error(e); return null; }
}

function getLocalQuestionsFromJSON(data, category, difficulty, count) {
  if (!data?.questions) return [];
  let pool = [...data.questions];

  // Фильтр по сложности
  if (difficulty && difficulty !== 'any') {
    const dp = pool.filter(q => q.difficulty === difficulty);
    if (dp.length >= count) pool = dp;
    else if (dp.length > 0) { const rest = pool.filter(q => q.difficulty !== difficulty); pool = [...dp, ...shuffleArray(rest).slice(0, count - dp.length)]; }
  }

  // Фильтр по категории
  if (category && category !== 'any') {
    const cp = pool.filter(q => q.category === category);
    console.log(`Категория: ${category}, найдено: ${cp.length} вопросов`);
    if (cp.length >= count) pool = cp;
    else if (cp.length > 0) { const rest = pool.filter(q => q.category !== category); pool = [...cp, ...shuffleArray(rest).slice(0, count - cp.length)]; }
  }

  // Поиск по ключевым словам
  const si = document.getElementById('search-keywords');
  if (si && si.value.trim().length >= 2) {
    const kw = si.value.trim().toLowerCase();
    const sp = pool.filter(q => q.question.toLowerCase().includes(kw) || q.answers.some(a => a.toLowerCase().includes(kw)) || (q.tags && q.tags.some(t => t.toLowerCase().includes(kw))) || (data.categories?.[q.category]?.toLowerCase().includes(kw)));
    if (sp.length > 0) pool = sp;
  }

  pool = pool.filter((q, i, self) => self.findIndex(t => t.question === q.question) === i);
  const selected = shuffleArray(pool).slice(0, Math.min(count, pool.length));
  console.log(`Выбрано ${selected.length} вопросов (сложность: ${difficulty}, категория: ${category})`);

  return selected.map(q => {
    const answers = shuffleArray([...q.answers]);
    const correctAnswer = q.answers[q.correctIndex];
    return { ...q, answers, correctIndex: answers.indexOf(correctAnswer) };
  });
}

async function fetchEnglishQuestions(category, difficulty) {
  try {
    const url = new URL('https://opentdb.com/api.php');
    url.searchParams.set('amount', '10'); url.searchParams.set('type', 'multiple');
    if (category && category !== 'any') url.searchParams.set('category', category);
    if (difficulty && difficulty !== 'any') url.searchParams.set('difficulty', difficulty);
    const r = await fetch(url); const d = await r.json();
    if (d.response_code === 0 && d.results.length > 0) return d.results.map(formatEnglishQuestion);
  } catch (e) { showToast('API недоступен. Загружаем русские вопросы.', 'warning'); }
  const rd = await loadRussianQuestions();
  return getLocalQuestionsFromJSON(rd, category, difficulty, 10);
}

function formatEnglishQuestion(q) {
  const dh = (h) => { const t = document.createElement('textarea'); t.innerHTML = h; return t.value; };
  const answers = [...q.incorrect_answers.map(dh), dh(q.correct_answer)];
  const shuffled = shuffleArray(answers);
  return { question: dh(q.question), answers: shuffled, correctIndex: shuffled.indexOf(dh(q.correct_answer)), category: dh(q.category), difficulty: q.difficulty };
}

function shuffleArray(array) { const a = [...array]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }