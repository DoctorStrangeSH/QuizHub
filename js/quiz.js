// ============================================
// QuizHub — Логика квиза (рус/eng)
// ============================================

let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 15;
let totalTimeSpent = 0;
let quizStartTime = 0;
let currentStreak = 0;
let maxStreak = 0;
let fastestAnswer = 999;

const QUIZ_SETTINGS = {
  totalQuestions: 10,
  timePerQuestion: 15,
  maxScore: 100
};

// ========== БАЗА РУССКИХ ВОПРОСОВ ==========

const russianQuestions = {
  any: [
    { question: 'Сколько цветов в радуге?', answers: ['5', '6', '7', '8'], correctIndex: 2, category: 'Общие знания', difficulty: 'easy' },
    { question: 'Какой океан самый большой?', answers: ['Атлантический', 'Индийский', 'Тихий', 'Северный Ледовитый'], correctIndex: 2, category: 'Общие знания', difficulty: 'easy' },
    { question: 'Сколько секунд в одном часе?', answers: ['600', '360', '3600', '60'], correctIndex: 2, category: 'Общие знания', difficulty: 'easy' },
    { question: 'Как называется столица Франции?', answers: ['Лондон', 'Берлин', 'Мадрид', 'Париж'], correctIndex: 3, category: 'Общие знания', difficulty: 'easy' },
    { question: 'Сколько дней в високосном году?', answers: ['364', '365', '366', '367'], correctIndex: 2, category: 'Общие знания', difficulty: 'easy' },
    { question: 'Какой газ преобладает в атмосфере Земли?', answers: ['Кислород', 'Азот', 'Углекислый газ', 'Водород'], correctIndex: 1, category: 'Общие знания', difficulty: 'medium' },
    { question: 'Какая планета самая большая в Солнечной системе?', answers: ['Земля', 'Марс', 'Юпитер', 'Сатурн'], correctIndex: 2, category: 'Общие знания', difficulty: 'easy' },
    { question: 'Сколько континентов на Земле?', answers: ['5', '6', '7', '8'], correctIndex: 2, category: 'Общие знания', difficulty: 'easy' },
    { question: 'В каком году началась Вторая мировая война?', answers: ['1937', '1939', '1941', '1945'], correctIndex: 1, category: 'Общие знания', difficulty: 'medium' },
    { question: 'Кто написал картину «Мона Лиза»?', answers: ['Ван Гог', 'Пикассо', 'Леонардо да Винчи', 'Рембрандт'], correctIndex: 2, category: 'Общие знания', difficulty: 'easy' },
  ],
  science: [
    { question: 'Какой химический элемент обозначается символом O?', answers: ['Золото', 'Кислород', 'Олово', 'Осмий'], correctIndex: 1, category: 'Наука', difficulty: 'easy' },
    { question: 'Какая частица имеет положительный заряд?', answers: ['Электрон', 'Нейтрон', 'Протон', 'Фотон'], correctIndex: 2, category: 'Наука', difficulty: 'medium' },
    { question: 'Сколько костей в теле взрослого человека?', answers: ['186', '206', '226', '256'], correctIndex: 1, category: 'Наука', difficulty: 'medium' },
    { question: 'Как называется самая твёрдая ткань в организме человека?', answers: ['Кость', 'Ноготь', 'Эмаль зуба', 'Хрящ'], correctIndex: 2, category: 'Наука', difficulty: 'medium' },
    { question: 'Какая планета самая близкая к Солнцу?', answers: ['Венера', 'Земля', 'Меркурий', 'Марс'], correctIndex: 2, category: 'Наука', difficulty: 'easy' },
    { question: 'Что измеряется в Ньютонах?', answers: ['Масса', 'Сила', 'Давление', 'Скорость'], correctIndex: 1, category: 'Наука', difficulty: 'medium' },
    { question: 'Какой витамин вырабатывается под воздействием солнца?', answers: ['Витамин A', 'Витамин C', 'Витамин D', 'Витамин B12'], correctIndex: 2, category: 'Наука', difficulty: 'medium' },
    { question: 'Сколько хромосом у человека?', answers: ['23', '44', '46', '48'], correctIndex: 2, category: 'Наука', difficulty: 'hard' },
  ],
  history: [
    { question: 'В каком году Юрий Гагарин полетел в космос?', answers: ['1957', '1961', '1965', '1969'], correctIndex: 1, category: 'История', difficulty: 'medium' },
    { question: 'Кто был первым президентом России?', answers: ['Горбачёв', 'Ельцин', 'Путин', 'Медведев'], correctIndex: 1, category: 'История', difficulty: 'easy' },
    { question: 'В каком году распался СССР?', answers: ['1989', '1990', '1991', '1993'], correctIndex: 2, category: 'История', difficulty: 'medium' },
    { question: 'Кто основал Москву?', answers: ['Пётр I', 'Юрий Долгорукий', 'Иван Грозный', 'Александр Невский'], correctIndex: 1, category: 'История', difficulty: 'medium' },
    { question: 'Какая битва считается переломной в Великой Отечественной войне?', answers: ['Битва за Москву', 'Курская битва', 'Сталинградская битва', 'Битва за Берлин'], correctIndex: 2, category: 'История', difficulty: 'medium' },
    { question: 'В каком году отменили крепостное право в России?', answers: ['1801', '1825', '1861', '1905'], correctIndex: 2, category: 'История', difficulty: 'hard' },
  ],
  sport: [
    { question: 'Сколько игроков в футбольной команде на поле?', answers: ['9', '10', '11', '12'], correctIndex: 2, category: 'Спорт', difficulty: 'easy' },
    { question: 'Как часто проходят Олимпийские игры?', answers: ['Каждый год', 'Раз в 2 года', 'Раз в 4 года', 'Раз в 6 лет'], correctIndex: 2, category: 'Спорт', difficulty: 'easy' },
    { question: 'В каком виде спорта самый большой мяч?', answers: ['Футбол', 'Баскетбол', 'Волейбол', 'Регби'], correctIndex: 1, category: 'Спорт', difficulty: 'easy' },
    { question: 'Сколько колец в олимпийской эмблеме?', answers: ['3', '4', '5', '6'], correctIndex: 2, category: 'Спорт', difficulty: 'easy' },
    { question: 'Какая страна выиграла ЧМ-2022 по футболу?', answers: ['Франция', 'Бразилия', 'Аргентина', 'Германия'], correctIndex: 2, category: 'Спорт', difficulty: 'medium' },
    { question: 'Как называется хоккей на траве?', answers: ['Флорбол', 'Гандбол', 'Хоккей на траве', 'Поло'], correctIndex: 2, category: 'Спорт', difficulty: 'medium' },
  ],
  cinema: [
    { question: 'Кто снял фильм «Титаник»?', answers: ['Стивен Спилберг', 'Джеймс Кэмерон', 'Кристофер Нолан', 'Ридли Скотт'], correctIndex: 1, category: 'Кино', difficulty: 'easy' },
    { question: 'Как зовут главного героя «Гарри Поттера»?', answers: ['Рон', 'Гарри', 'Драко', 'Невилл'], correctIndex: 1, category: 'Кино', difficulty: 'easy' },
    { question: 'Какой фильм получил Оскар-2024 как лучший?', answers: ['Барби', 'Оппенгеймер', 'Убийцы цветочной луны', 'Бедные-несчастные'], correctIndex: 1, category: 'Кино', difficulty: 'hard' },
    { question: 'Кто сыграл Джокера в «Тёмном рыцаре»?', answers: ['Джек Николсон', 'Хоакин Феникс', 'Хит Леджер', 'Джаред Лето'], correctIndex: 2, category: 'Кино', difficulty: 'medium' },
    { question: 'Сколько фильмов в серии «Звёздные войны» (основная сага)?', answers: ['6', '7', '8', '9'], correctIndex: 3, category: 'Кино', difficulty: 'medium' },
  ],
  music: [
    { question: 'Сколько клавиш у стандартного пианино?', answers: ['76', '88', '96', '104'], correctIndex: 1, category: 'Музыка', difficulty: 'medium' },
    { question: 'Кто исполнитель песни «Shape of You»?', answers: ['Эд Ширан', 'Джастин Бибер', 'Бруно Марс', 'Дрейк'], correctIndex: 0, category: 'Музыка', difficulty: 'easy' },
    { question: 'Как называется самая популярная соцсеть для коротких видео?', answers: ['YouTube', 'Instagram', 'TikTok', 'VK Клипы'], correctIndex: 2, category: 'Музыка', difficulty: 'easy' },
    { question: 'Какой музыкальный инструмент у Страдивари?', answers: ['Фортепиано', 'Скрипка', 'Виолончель', 'Арфа'], correctIndex: 1, category: 'Музыка', difficulty: 'medium' },
  ],
  geography: [
    { question: 'Какая страна самая большая по площади?', answers: ['США', 'Китай', 'Россия', 'Канада'], correctIndex: 2, category: 'География', difficulty: 'easy' },
    { question: 'Столица Японии?', answers: ['Пекин', 'Сеул', 'Токио', 'Бангкок'], correctIndex: 2, category: 'География', difficulty: 'easy' },
    { question: 'Какая река самая длинная в мире?', answers: ['Амазонка', 'Нил', 'Миссисипи', 'Янцзы'], correctIndex: 1, category: 'География', difficulty: 'medium' },
    { question: 'Сколько стран граничат с Россией по суше?', answers: ['12', '14', '16', '18'], correctIndex: 2, category: 'География', difficulty: 'hard' },
    { question: 'Какое море самое солёное?', answers: ['Чёрное', 'Средиземное', 'Красное', 'Мёртвое'], correctIndex: 3, category: 'География', difficulty: 'medium' },
  ],
  it: [
    { question: 'Какой язык программирования создал Брендан Айк?', answers: ['Python', 'Java', 'JavaScript', 'C++'], correctIndex: 2, category: 'IT', difficulty: 'medium' },
    { question: 'Что означает аббревиатура HTML?', answers: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], correctIndex: 0, category: 'IT', difficulty: 'easy' },
    { question: 'Сколько бит в одном байте?', answers: ['4', '8', '16', '32'], correctIndex: 1, category: 'IT', difficulty: 'easy' },
    { question: 'В каком году основана компания Apple?', answers: ['1975', '1976', '1977', '1980'], correctIndex: 1, category: 'IT', difficulty: 'medium' },
    { question: 'Что такое API?', answers: ['Приложение', 'Интерфейс программирования', 'База данных', 'Язык программирования'], correctIndex: 1, category: 'IT', difficulty: 'medium' },
    { question: 'Какой протокол используется для передачи веб-страниц?', answers: ['FTP', 'SMTP', 'HTTP', 'TCP'], correctIndex: 2, category: 'IT', difficulty: 'easy' },
    { question: 'Что такое CSS?', answers: ['Язык программирования', 'Каскадные таблицы стилей', 'База данных', 'Фреймворк'], correctIndex: 1, category: 'IT', difficulty: 'easy' },
    { question: 'Кто создал Linux?', answers: ['Билл Гейтс', 'Стив Джобс', 'Линус Торвальдс', 'Марк Цукерберг'], correctIndex: 2, category: 'IT', difficulty: 'medium' },
  ]
};

// ========== ЗАГРУЗКА ВОПРОСОВ ==========

async function fetchQuestions(category, difficulty) {
  if (selectedLanguage === 'en') {
    return await fetchEnglishQuestions(category, difficulty);
  }
  return getLocalQuestions(category, difficulty);
}

async function fetchEnglishQuestions(category, difficulty) {
  try {
    const url = new URL('https://opentdb.com/api.php');
    url.searchParams.set('amount', QUIZ_SETTINGS.totalQuestions);
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
  
  return getLocalQuestions(category, difficulty);
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

function getLocalQuestions(category, difficulty) {
  let pool = [];
  
  if (category && category !== 'any' && russianQuestions[category]) {
    pool = [...russianQuestions[category]];
  } else {
    Object.values(russianQuestions).forEach(arr => pool.push(...arr));
  }
  
  if (difficulty && difficulty !== 'any') {
    pool = pool.filter(q => q.difficulty === difficulty);
  }
  
  if (pool.length < QUIZ_SETTINGS.totalQuestions) {
    Object.values(russianQuestions).forEach(arr => pool.push(...arr));
    pool = pool.filter((q, i, self) => self.findIndex(t => t.question === q.question) === i);
  }
  
  const selected = shuffleArray(pool).slice(0, QUIZ_SETTINGS.totalQuestions);
  
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

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========== ЗАПУСК КВИЗА ==========

async function startQuiz() {
  const category = document.getElementById('quiz-category').value;
  const difficulty = selectedDifficulty;
  
  showLoadingScreen();
  
  quizQuestions = await fetchQuestions(category, difficulty);
  
  currentQuestionIndex = 0;
  score = 0;
  totalTimeSpent = 0;
  currentStreak = 0;
  maxStreak = 0;
  fastestAnswer = 999;
  
  showScreen('quiz');
  renderQuizScreen();
  startTimer();
  
  quizStartTime = Date.now();
}

function showLoadingScreen() {
  const quizScreen = document.getElementById('screen-quiz');
  if (quizScreen) {
    quizScreen.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-accent mb-3" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Загрузка...</span>
        </div>
        <p class="text-muted">Загружаем вопросы...</p>
      </div>
    `;
  }
  showScreen('quiz');
}

// ========== РЕНДЕРИНГ ЭКРАНА КВИЗА ==========

function renderQuizScreen() {
  const screen = document.getElementById('screen-quiz');
  if (!screen || quizQuestions.length === 0) return;
  
  const question = quizQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUIZ_SETTINGS.totalQuestions) * 100;
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-7">
        
        <div class="d-flex justify-content-between align-items-center mb-3">
          <small class="text-muted">Вопрос ${currentQuestionIndex + 1} из ${QUIZ_SETTINGS.totalQuestions}</small>
          <small class="text-muted">🏆 ${score} очков</small>
        </div>
        <div class="progress mb-4" style="height: 6px;">
          <div class="progress-bar bg-accent progress-animated" style="width: ${progress}%;"></div>
        </div>
        
        <div class="d-flex justify-content-center mb-4">
          <div class="timer-circle ${timeLeft <= 5 ? 'timer-danger' : ''}">
            <span class="timer-text" id="timer-display">${timeLeft}</span>
          </div>
        </div>
        
        <div class="bg-card rounded-4 p-4 p-md-5 mb-4">
          <span class="badge bg-accent bg-opacity-25 text-accent rounded-pill px-3 py-2 mb-3">
            ${question.category} • ${getDifficultyLabel(question.difficulty)}
          </span>
          <h3 class="fw-bold mb-4">${question.question}</h3>
          
          <div class="d-grid gap-3" id="answers-container">
            ${question.answers.map((answer, i) => `
              <button class="btn btn-answer rounded-4 p-3 text-start" data-index="${i}">
                <span class="answer-letter">${String.fromCharCode(65 + i)}</span>
                <span class="answer-text">${answer}</span>
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="text-center">
          <button class="btn btn-outline-accent rounded-pill px-4" id="skip-question">
            <i class="bi bi-skip-forward me-2"></i>Пропустить
          </button>
        </div>
        
      </div>
    </div>
  `;
  
  document.querySelectorAll('.btn-answer').forEach(btn => {
    btn.addEventListener('click', function() {
      const selectedIndex = parseInt(this.dataset.index);
      handleAnswer(selectedIndex);
    });
  });
  
  document.getElementById('skip-question')?.addEventListener('click', skipQuestion);
}

function getDifficultyLabel(difficulty) {
  const labels = { easy: '🟢 Легко', medium: '🟡 Средне', hard: '🔴 Сложно' };
  return labels[difficulty] || difficulty;
}

// ========== ТАЙМЕР ==========

function startTimer() {
  timeLeft = QUIZ_SETTINGS.timePerQuestion;
  updateTimerDisplay();
  
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const display = document.getElementById('timer-display');
  const circle = document.querySelector('.timer-circle');
  
  if (display) display.textContent = timeLeft;
  if (circle) {
    circle.classList.toggle('timer-danger', timeLeft <= 5);
    if (timeLeft <= 5 && timeLeft > 0) {
      playTickSound();
    }
  }
}

function handleTimeout() {
  const question = quizQuestions[currentQuestionIndex];
  document.querySelectorAll('.btn-answer').forEach((btn, i) => {
    btn.disabled = true;
    if (i === question.correctIndex) btn.classList.add('correct');
  });
  
  currentStreak = 0;
  setTimeout(() => moveToNextQuestion(), 2000);
}

// ========== ОБРАБОТКА ОТВЕТА ==========

function handleAnswer(selectedIndex) {
  clearInterval(timerInterval);
  
  const question = quizQuestions[currentQuestionIndex];
  const isCorrect = selectedIndex === question.correctIndex;
  const answerTime = QUIZ_SETTINGS.timePerQuestion - timeLeft;
  
  document.querySelectorAll('.btn-answer').forEach((btn, i) => {
    btn.disabled = true;
    if (i === question.correctIndex) btn.classList.add('correct');
    if (i === selectedIndex && !isCorrect) {
      btn.classList.add('wrong');
      playWrongSound();
    }
  });
  
  if (isCorrect) {
    playCorrectSound();
    
    currentStreak++;
    if (currentStreak > maxStreak) maxStreak = currentStreak;
    if (answerTime < fastestAnswer) fastestAnswer = answerTime;
    
    const timeBonus = Math.floor(timeLeft / QUIZ_SETTINGS.timePerQuestion * 5);
    const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 };
    const multiplier = difficultyMultiplier[question.difficulty] || 1;
    score += Math.floor((10 + timeBonus) * multiplier);
  } else {
    currentStreak = 0;
  }
  
  totalTimeSpent += answerTime;
  
  setTimeout(() => moveToNextQuestion(), isCorrect ? 800 : 2000);
}

function skipQuestion() {
  clearInterval(timerInterval);
  totalTimeSpent += (QUIZ_SETTINGS.timePerQuestion - timeLeft);
  currentStreak = 0;
  moveToNextQuestion();
}

function moveToNextQuestion() {
  currentQuestionIndex++;
  
  if (currentQuestionIndex < QUIZ_SETTINGS.totalQuestions) {
    renderQuizScreen();
    startTimer();
  } else {
    finishQuiz();
  }
}

// ========== ЗАВЕРШЕНИЕ КВИЗА ==========

async function finishQuiz() {
  clearInterval(timerInterval);
  const totalTime = Math.floor((Date.now() - quizStartTime) / 1000);
  
  const maxPossibleScore = QUIZ_SETTINGS.totalQuestions * 15;
  const correctAnswers = Math.round((score / maxPossibleScore) * QUIZ_SETTINGS.totalQuestions);
  const actualCorrect = Math.min(correctAnswers, QUIZ_SETTINGS.totalQuestions);
  
  const category = document.getElementById('quiz-category');
  const categoryText = category ? category.options[category.selectedIndex].text : 'Любая';
  
  const result = {
    playerName: document.getElementById('player-name').value.trim() || 'Гость',
    score: score,
    totalTime: totalTime,
    correctAnswers: actualCorrect,
    difficulty: selectedDifficulty,
    category: categoryText,
    date: new Date().toISOString(),
    userId: currentUser ? currentUser.uid : null
  };
  
  await saveResult(result);
  
  showScreen('result');
  renderResultScreen(result);
  
  // Статистика и ачивки
  updateStats(result);
  quizStats.maxStreak = maxStreak;
  quizStats.fastestAnswer = fastestAnswer;
  checkAchievements(result);
}

// ========== ЭКРАН РЕЗУЛЬТАТА ==========

function renderResultScreen(result) {
  const screen = document.getElementById('screen-result');
  if (!screen) return;
  
  const grade = getGrade(result.score);
  
  if (result.score >= 70) {
    spawnConfetti();
    playFanfareSound();
  }
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-6 text-center">
        
        <div class="result-icon mb-4 ${grade.color}">
          <i class="bi bi-${grade.icon} fs-1"></i>
        </div>
        
        <h2 class="fw-bold font-display mb-2">${grade.title}</h2>
        <p class="text-muted mb-4">${grade.message} ${result.playerName}!</p>
        
        <div class="row g-3 mb-4">
          <div class="col-4">
            <div class="bg-card rounded-4 p-3">
              <p class="display-6 fw-bold text-accent mb-0">${result.score}</p>
              <small class="text-muted">Очков</small>
            </div>
          </div>
          <div class="col-4">
            <div class="bg-card rounded-4 p-3">
              <p class="display-6 fw-bold text-success mb-0">${result.correctAnswers}/${QUIZ_SETTINGS.totalQuestions}</p>
              <small class="text-muted">Правильно</small>
            </div>
          </div>
          <div class="col-4">
            <div class="bg-card rounded-4 p-3">
              <p class="display-6 fw-bold text-warning mb-0">${formatTime(result.totalTime)}</p>
              <small class="text-muted">Время</small>
            </div>
          </div>
        </div>
        
        <div class="d-flex flex-wrap justify-content-center gap-3">
          <button class="btn btn-accent btn-lg rounded-pill px-4" onclick="startQuiz()">
            <i class="bi bi-arrow-repeat me-2"></i>Пройти ещё раз
          </button>
          <button class="btn btn-outline-accent btn-lg rounded-pill px-4" onclick="showScreen('home')">
            <i class="bi bi-house me-2"></i>На главную
          </button>
          <button class="btn btn-outline-accent btn-lg rounded-pill px-4" id="view-leaderboard">
            <i class="bi bi-trophy me-2"></i>Таблица лидеров
          </button>
        </div>
        
      </div>
    </div>
  `;
  
  document.getElementById('view-leaderboard')?.addEventListener('click', () => {
    showScreen('leaderboard');
    loadLeaderboard();
  });
}

function getGrade(score) {
  if (score >= 90) return { title: 'Легенда!', message: 'Потрясающий результат,', icon: 'trophy-fill', color: 'grade-gold' };
  if (score >= 70) return { title: 'Отлично!', message: 'Ты настоящий знаток,', icon: 'star-fill', color: 'grade-silver' };
  if (score >= 50) return { title: 'Неплохо!', message: 'Хорошая попытка,', icon: 'hand-thumbs-up-fill', color: 'grade-bronze' };
  return { title: 'Попробуй ещё!', message: 'Не расстраивайся,', icon: 'emoji-smile-fill', color: 'grade-default' };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}