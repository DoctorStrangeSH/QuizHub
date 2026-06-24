// ============================================
// QuizHub — Логика квиза
// ============================================

let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 15;
let totalTimeSpent = 0;
let quizStartTime = 0;

// Настройки квиза
const QUIZ_SETTINGS = {
  totalQuestions: 10,
  timePerQuestion: 15,
  maxScore: 100
};

// ========== ЗАГРУЗКА ВОПРОСОВ ИЗ API ==========

async function fetchQuestions(category, difficulty) {
  const url = new URL('https://opentdb.com/api.php');
  url.searchParams.set('amount', QUIZ_SETTINGS.totalQuestions);
  url.searchParams.set('type', 'multiple');
  url.searchParams.set('language', 'ru');
  
  if (category && category !== 'any') {
    url.searchParams.set('category', category);
  }
  if (difficulty && difficulty !== 'any') {
    url.searchParams.set('difficulty', difficulty);
  }
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.response_code === 0) {
      return data.results.map(formatQuestion);
    } else {
      throw new Error('Не удалось загрузить вопросы');
    }
  } catch (error) {
    console.error('Ошибка загрузки вопросов:', error);
    return getFallbackQuestions();
  }
}

// Форматирование вопроса из API
function formatQuestion(apiQuestion) {
  // Декодируем HTML-сущности
  const decodeHTML = (html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };
  
  const answers = [
    ...apiQuestion.incorrect_answers.map(decodeHTML),
    decodeHTML(apiQuestion.correct_answer)
  ];
  
  // Перемешиваем ответы
  const shuffled = shuffleArray(answers);
  
  return {
    question: decodeHTML(apiQuestion.question),
    answers: shuffled,
    correctIndex: shuffled.indexOf(decodeHTML(apiQuestion.correct_answer)),
    category: decodeHTML(apiQuestion.category),
    difficulty: apiQuestion.difficulty
  };
}

// Перемешивание массива (Фишер-Йетс)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========== ЗАПАСНЫЕ ВОПРОСЫ ==========

function getFallbackQuestions() {
  return [
    {
      question: 'Какая планета самая большая в Солнечной системе?',
      answers: ['Земля', 'Юпитер', 'Сатурн', 'Марс'],
      correctIndex: 1,
      category: 'Наука',
      difficulty: 'easy'
    },
    {
      question: 'Сколько континентов на Земле?',
      answers: ['5', '6', '7', '8'],
      correctIndex: 2,
      category: 'География',
      difficulty: 'easy'
    },
    {
      question: 'Кто написал роман «Война и мир»?',
      answers: ['Достоевский', 'Толстой', 'Пушкин', 'Чехов'],
      correctIndex: 1,
      category: 'Литература',
      difficulty: 'easy'
    },
    {
      question: 'Какой химический элемент обозначается символом O?',
      answers: ['Золото', 'Кислород', 'Олово', 'Осмий'],
      correctIndex: 1,
      category: 'Химия',
      difficulty: 'easy'
    },
    {
      question: 'Сколько секунд в одном часе?',
      answers: ['3600', '600', '360', '60'],
      correctIndex: 0,
      category: 'Математика',
      difficulty: 'easy'
    },
    {
      question: 'Какая страна самая большая по площади?',
      answers: ['США', 'Китай', 'Россия', 'Канада'],
      correctIndex: 2,
      category: 'География',
      difficulty: 'easy'
    },
    {
      question: 'Кто изображён на логотипе Starbucks?',
      answers: ['Русалка', 'Сирена', 'Ангел', 'Фея'],
      correctIndex: 1,
      category: 'Бренды',
      difficulty: 'medium'
    },
    {
      question: 'Сколько цветов в радуге?',
      answers: ['5', '6', '7', '8'],
      correctIndex: 2,
      category: 'Общие знания',
      difficulty: 'easy'
    },
    {
      question: 'Какой язык программирования создал Брендан Айк?',
      answers: ['Python', 'Java', 'JavaScript', 'C++'],
      correctIndex: 2,
      category: 'IT',
      difficulty: 'medium'
    },
    {
      question: 'В каком году Юрий Гагарин полетел в космос?',
      answers: ['1957', '1961', '1965', '1969'],
      correctIndex: 1,
      category: 'История',
      difficulty: 'medium'
    }
  ].slice(0, QUIZ_SETTINGS.totalQuestions);
}


// ========== ЗАПУСК КВИЗА ==========

async function startQuiz() {
  const category = document.getElementById('quiz-category').value;
  const difficulty = selectedDifficulty;
  
  // Показываем экран загрузки
  showLoadingScreen();
  
  // Загружаем вопросы
  quizQuestions = await fetchQuestions(category, difficulty);
  
  // Сбрасываем состояние
  currentQuestionIndex = 0;
  score = 0;
  totalTimeSpent = 0;
  
  // Показываем экран квиза
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
        
        <!-- Прогресс-бар -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <small class="text-muted">Вопрос ${currentQuestionIndex + 1} из ${QUIZ_SETTINGS.totalQuestions}</small>
          <small class="text-muted">🏆 ${score} очков</small>
        </div>
        <div class="progress mb-4" style="height: 6px;">
          <div class="progress-bar bg-accent progress-animated" style="width: ${progress}%;"></div>
        </div>
        
        <!-- Таймер -->
        <div class="d-flex justify-content-center mb-4">
          <div class="timer-circle ${timeLeft <= 5 ? 'timer-danger' : ''}">
            <span class="timer-text" id="timer-display">${timeLeft}</span>
          </div>
        </div>
        
        <!-- Вопрос -->
        <div class="bg-card rounded-4 p-4 p-md-5 mb-4">
          <span class="badge bg-accent bg-opacity-25 text-accent rounded-pill px-3 py-2 mb-3">
            ${question.category} • ${getDifficultyLabel(question.difficulty)}
          </span>
          <h3 class="fw-bold mb-4">${question.question}</h3>
          
          <!-- Варианты ответов -->
          <div class="d-grid gap-3" id="answers-container">
            ${question.answers.map((answer, i) => `
              <button class="btn btn-answer rounded-4 p-3 text-start" data-index="${i}">
                <span class="answer-letter">${String.fromCharCode(65 + i)}</span>
                <span class="answer-text">${answer}</span>
              </button>
            `).join('')}
          </div>
        </div>
        
        <!-- Кнопка пропуска -->
        <div class="text-center">
          <button class="btn btn-outline-accent rounded-pill px-4" id="skip-question">
            <i class="bi bi-skip-forward me-2"></i>Пропустить
          </button>
        </div>
        
      </div>
    </div>
  `;
  
  // Обработчики ответов
  document.querySelectorAll('.btn-answer').forEach(btn => {
    btn.addEventListener('click', function() {
      const selectedIndex = parseInt(this.dataset.index);
      handleAnswer(selectedIndex);
    });
  });
  
  // Кнопка пропуска
  document.getElementById('skip-question')?.addEventListener('click', skipQuestion);
}

function getDifficultyLabel(difficulty) {
  const labels = { 
    easy: '🟢 Легко', 
    medium: '🟡 Средне', 
    hard: '🔴 Сложно' 
  };
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
  
  if (display) {
    display.textContent = timeLeft;
  }
  
  if (circle) {
    if (timeLeft <= 5) {
      circle.classList.add('timer-danger');
    } else {
      circle.classList.remove('timer-danger');
    }
  }
}

function handleTimeout() {
  // Подсвечиваем правильный ответ
  const question = quizQuestions[currentQuestionIndex];
  document.querySelectorAll('.btn-answer').forEach((btn, i) => {
    btn.disabled = true;
    if (i === question.correctIndex) {
      btn.classList.add('correct');
    }
  });
  
  // Переход к следующему вопросу через 2 секунды
  setTimeout(() => {
    moveToNextQuestion();
  }, 2000);
}

// ========== ОБРАБОТКА ОТВЕТА ==========

function handleAnswer(selectedIndex) {
  clearInterval(timerInterval);
  
  const question = quizQuestions[currentQuestionIndex];
  const isCorrect = selectedIndex === question.correctIndex;
  
  // Блокируем все кнопки
  document.querySelectorAll('.btn-answer').forEach((btn, i) => {
    btn.disabled = true;
    if (i === question.correctIndex) {
      btn.classList.add('correct');
    }
    if (i === selectedIndex && !isCorrect) {
      btn.classList.add('wrong');
    }
  });
  
  // Начисляем очки
  if (isCorrect) {
    const timeBonus = Math.floor(timeLeft / QUIZ_SETTINGS.timePerQuestion * 5);
    const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 };
    const multiplier = difficultyMultiplier[question.difficulty] || 1;
    const pointsEarned = Math.floor((10 + timeBonus) * multiplier);
    score += pointsEarned;
  }
  
  totalTimeSpent += (QUIZ_SETTINGS.timePerQuestion - timeLeft);
  
  // Обновляем счёт
  const scoreEl = document.querySelector('.text-muted:last-child');
  if (scoreEl) {
    scoreEl.innerHTML = `🏆 ${score} очков`;
  }
  
  // Переход к следующему вопросу
  setTimeout(() => {
    moveToNextQuestion();
  }, isCorrect ? 800 : 2000);
}

function skipQuestion() {
  clearInterval(timerInterval);
  totalTimeSpent += (QUIZ_SETTINGS.timePerQuestion - timeLeft);
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
  
  // Подсчитываем правильные ответы
  const maxPossibleScore = QUIZ_SETTINGS.totalQuestions * 15; // примерно
  const correctAnswers = Math.round((score / maxPossibleScore) * QUIZ_SETTINGS.totalQuestions);
  const actualCorrect = Math.min(correctAnswers, QUIZ_SETTINGS.totalQuestions);
  
  const category = document.getElementById('quiz-category');
  const categoryText = category ? category.options[category.selectedIndex].text : 'Любая';
  
  // Сохраняем результат
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
  
  // Сохраняем в Firestore (если есть интернет)
  const savedId = await saveResult(result);
  result.firestoreId = savedId;
  
  // Показываем экран результата
  showScreen('result');
  renderResultScreen(result);
  
  // Если таблица лидеров открыта — обновляем
  if (document.getElementById('screen-leaderboard').classList.contains('active')) {
    loadLeaderboard();
  }
}


// ========== ЭКРАН РЕЗУЛЬТАТА ==========

function renderResultScreen(result) {
  const screen = document.getElementById('screen-result');
  if (!screen) return;
  
  const grade = getGrade(result.score);
  
  // Конфетти при отличном результате!
  if (result.score >= 70) {
    spawnConfetti();
  }
  
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-6 text-center">
        
        <!-- Иконка результата -->
        <div class="result-icon mb-4 ${grade.color}">
          <i class="bi bi-${grade.icon} fs-1"></i>
        </div>
        
        <h2 class="fw-bold font-display mb-2">${grade.title}</h2>
        <p class="text-muted mb-4">${grade.message} ${result.playerName}!</p>
        
        <!-- Статистика -->
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
        
        <!-- Кнопки -->
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