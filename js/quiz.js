// ============================================
// QuizHub — Логика квиза v3.0
// Вопросы загружаются из data/questions-ru.json
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
let timedMode = false;
let globalTimeLeft = 60;
let correctAnswersCount = 0;

const QUIZ_SETTINGS = {
  totalQuestions: 10,
  timePerQuestion: 15,
  maxScore: 100
};

// ========== ЗАГРУЗКА ВОПРОСОВ ==========

async function fetchQuestions(category, difficulty, count = 10) {
  if (selectedLanguage === 'en') {
    return await fetchEnglishQuestions(category, difficulty);
  }
  
  // Русские вопросы — из JSON
  const data = await loadRussianQuestions();
  if (data && data.questions && data.questions.length > 0) {
    const questions = getLocalQuestionsFromJSON(data, category, difficulty, count);
    if (questions.length > 0) {
      return questions;
    }
  }
  
  // Если JSON не загрузился — экстренный fallback
  console.error('Не удалось загрузить вопросы');
  showToast('Ошибка загрузки вопросов 😢', 'danger');
  return [];
}

// ========== ЗАПУСК КВИЗА ==========

async function startQuiz() {
  const category = document.getElementById('quiz-category').value;
  const difficulty = selectedDifficulty;
  
  showLoadingScreen();
  
  QUIZ_SETTINGS.totalQuestions = 10;
  quizQuestions = await fetchQuestions(category, difficulty, 10);
  
  if (quizQuestions.length === 0) {
    showToast('Не удалось загрузить вопросы. Попробуйте позже.', 'danger');
    showScreen('home');
    return;
  }
  
  currentQuestionIndex = 0;
  score = 0;
  totalTimeSpent = 0;
  currentStreak = 0;
  maxStreak = 0;
  fastestAnswer = 999;
  timedMode = false;
  correctAnswersCount = 0;
  
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
          ${createCircularTimer(QUIZ_SETTINGS.timePerQuestion)}
        </div>
        
        <div class="bg-card rounded-4 p-4 p-md-5 mb-4">
          <span class="badge bg-accent bg-opacity-25 text-accent rounded-pill px-3 py-2 mb-3">
            ${question.category || 'Общие знания'} • ${getDifficultyLabel(question.difficulty)}
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
        
        <div class="text-center d-flex justify-content-center gap-2">
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
  
  setTimeout(() => {
    if (typeof addVoiceButton === 'function') addVoiceButton();
  }, 100);
  
  if (typeof saveQuizProgress === 'function') {
    saveQuizProgress({
      currentQuestionIndex,
      score,
      currentStreak,
      maxStreak,
      fastestAnswer,
      difficulty: selectedDifficulty,
      category: document.getElementById('quiz-category')?.value
    });
  }
}

function createCircularTimer(totalSeconds) {
  const circumference = 2 * Math.PI * 36;
  
  return `
    <div class="timer-circle-advanced">
      <svg viewBox="0 0 80 80">
        <circle class="timer-circle-bg" cx="40" cy="40" r="36"/>
        <circle class="timer-circle-progress" id="timer-progress-circle" 
                cx="40" cy="40" r="36"
                stroke-dasharray="${circumference}" 
                stroke-dashoffset="0"/>
      </svg>
      <span class="timer-circle-text" id="timer-display">${totalSeconds}</span>
    </div>
  `;
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
  const circle = document.getElementById('timer-progress-circle');
  const display = document.getElementById('timer-display');
  
  if (circle) {
    const circumference = 2 * Math.PI * 36;
    const offset = circumference * (1 - timeLeft / QUIZ_SETTINGS.timePerQuestion);
    circle.style.strokeDashoffset = offset;
    circle.classList.toggle('danger', timeLeft <= 5);
  }
  
  if (display) display.textContent = timeLeft;
  
  if (timeLeft <= 5 && timeLeft > 0) {
    if (typeof playTickSound === 'function') playTickSound();
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
  
  const buttons = document.querySelectorAll('.btn-answer');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === question.correctIndex) {
      btn.classList.add('correct');
      if (typeof showCorrectGlow === 'function') showCorrectGlow(btn);
    }
    if (i === selectedIndex && !isCorrect) {
      btn.classList.add('wrong');
      if (typeof showGlassBreakEffect === 'function') showGlassBreakEffect(btn);
      if (typeof playWrongSound === 'function') playWrongSound();
      if (typeof vibrateWrong === 'function') vibrateWrong();
    }
  });
  
  if (isCorrect) {
    correctAnswersCount++;
    
    if (typeof playCorrectSound === 'function') playCorrectSound();
    if (typeof vibrateCorrect === 'function') vibrateCorrect();
    
    currentStreak++;
    if (currentStreak > maxStreak) maxStreak = currentStreak;
    if (answerTime < fastestAnswer) fastestAnswer = answerTime;
    if (answerTime < 3 && typeof quizStats !== 'undefined') {
      quizStats.fastAnswersCount = (quizStats.fastAnswersCount || 0) + 1;
    }
    
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
    if (typeof animateQuestionTransition === 'function') {
      animateQuestionTransition(() => {
        renderQuizScreen();
        startTimer();
      });
    } else {
      renderQuizScreen();
      startTimer();
    }
  } else {
    finishQuiz();
  }
}

// ========== ЗАВЕРШЕНИЕ КВИЗА ==========

async function finishQuiz() {
  clearInterval(timerInterval);
  const totalTime = Math.floor((Date.now() - quizStartTime) / 1000);
  
  const actualCorrect = correctAnswersCount;
  
  console.log(`Правильных ответов: ${correctAnswersCount} из ${QUIZ_SETTINGS.totalQuestions}`);
  
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
  
  // Сохраняем результат
  if (typeof isOnline !== 'undefined' && isOnline) {
    await saveResult(result);
  } else if (typeof saveResultOffline === 'function') {
    await saveResultOffline(result);
  } else {
    await saveResult(result);
  }
  
  localStorage.removeItem('quizhub-quiz-progress');
  
  showScreen('result');
  renderResultScreen(result);
  
  // Статистика и ачивки
  if (typeof updateStats === 'function') updateStats(result);
  if (typeof quizStats !== 'undefined') {
    quizStats.maxStreak = maxStreak;
    quizStats.fastestAnswer = fastestAnswer;
    localStorage.setItem('quizhub-stats', JSON.stringify(quizStats));
  }
  if (typeof checkAchievements === 'function') checkAchievements(result);
  if (typeof saveScoreToHistory === 'function') saveScoreToHistory(result.score);
  
  // Ежедневные задания
  if (typeof updateDailyQuestProgress === 'function') {
    updateDailyQuestProgress('quizzes_today', 1);
    if (result.score >= 50) updateDailyQuestProgress('score_50');
    if (result.score >= 100) updateDailyQuestProgress('score_100');
    if (actualCorrect === 10) updateDailyQuestProgress('perfect');
    if (selectedDifficulty === 'hard') updateDailyQuestProgress('hard_quiz');
    if (typeof selectedLanguage !== 'undefined' && selectedLanguage === 'en') updateDailyQuestProgress('english');
    if (maxStreak >= 5) updateDailyQuestProgress('streak_5');
    if ((quizStats?.fastAnswersCount || 0) >= 3) updateDailyQuestProgress('fast_answers', quizStats.fastAnswersCount || 0);
  }
  
  if (result.score >= 70 && typeof vibrateAchievement === 'function') {
    vibrateAchievement();
  }
}

// ========== ЭКРАН РЕЗУЛЬТАТА ==========

function renderResultScreen(result) {
  const screen = document.getElementById('screen-result');
  if (!screen) return;
  
  const grade = getGrade(result.score);
  
  if (result.score >= 70) {
    if (typeof spawnConfettiAdvanced === 'function') {
      spawnConfettiAdvanced(80);
    } else if (typeof spawnConfetti === 'function') {
      spawnConfetti();
    }
    if (typeof playFanfareSound === 'function') playFanfareSound();
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

// ========== РЕЖИМ "НА ВРЕМЯ" ==========

async function startTimedMode() {
  const nameInput = document.getElementById('player-name');
  const name = nameInput.value.trim();
  
  if (!name) {
    nameInput.focus();
    showToast('Введи своё имя перед стартом!', 'warning');
    return;
  }
  
  timedMode = true;
  correctAnswersCount = 0;
  QUIZ_SETTINGS.totalQuestions = 999;
  QUIZ_SETTINGS.timePerQuestion = 999;
  globalTimeLeft = 60;
  
  const category = document.getElementById('quiz-category').value;
  quizQuestions = await fetchQuestions(category, 'any', 100);
  
  if (quizQuestions.length === 0) {
    showToast('Не удалось загрузить вопросы', 'danger');
    showScreen('home');
    return;
  }
  
  currentQuestionIndex = 0;
  score = 0;
  maxStreak = 0;
  fastestAnswer = 999;
  
  showScreen('quiz');
  renderTimedModeScreen();
  startGlobalTimer();
  
  quizStartTime = Date.now();
}

function renderTimedModeScreen() {
  const screen = document.getElementById('screen-quiz');
  if (!screen || quizQuestions.length === 0) return;
  
  const question = quizQuestions[currentQuestionIndex];
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-7">
        
        <div class="d-flex justify-content-between align-items-center mb-3">
          <small class="text-muted">⏱ Режим на время</small>
          <small class="text-muted">🏆 ${score} очков</small>
        </div>
        
        <div class="d-flex justify-content-center mb-4">
          <div class="timer-circle ${globalTimeLeft <= 10 ? 'timer-danger' : ''}">
            <span class="timer-text" id="global-timer">${globalTimeLeft}</span>
          </div>
        </div>
        
        <div class="bg-card rounded-4 p-4 p-md-5 mb-4">
          <span class="badge bg-accent bg-opacity-25 text-accent rounded-pill px-3 py-2 mb-3">
            ${question.category || 'Общие знания'} • Вопрос ${currentQuestionIndex + 1}
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
        
      </div>
    </div>
  `;
  
  document.querySelectorAll('.btn-answer').forEach(btn => {
    btn.addEventListener('click', function() {
      handleTimedAnswer(parseInt(this.dataset.index));
    });
  });
  
  if (typeof addVoiceButton === 'function') addVoiceButton();
}

function startGlobalTimer() {
  updateGlobalTimerDisplay();
  
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    globalTimeLeft--;
    updateGlobalTimerDisplay();
    
    if (globalTimeLeft <= 0) {
      clearInterval(timerInterval);
      finishTimedMode();
    }
  }, 1000);
}

function updateGlobalTimerDisplay() {
  const display = document.getElementById('global-timer');
  const circle = document.querySelector('.timer-circle');
  
  if (display) display.textContent = globalTimeLeft;
  if (circle) circle.classList.toggle('timer-danger', globalTimeLeft <= 10);
}

function handleTimedAnswer(selectedIndex) {
  const question = quizQuestions[currentQuestionIndex];
  const isCorrect = selectedIndex === question.correctIndex;
  
  document.querySelectorAll('.btn-answer').forEach((btn, i) => {
    btn.disabled = true;
    if (i === question.correctIndex) {
      btn.classList.add('correct');
      if (typeof showCorrectGlow === 'function') showCorrectGlow(btn);
    }
    if (i === selectedIndex && !isCorrect) {
      btn.classList.add('wrong');
      if (typeof showGlassBreakEffect === 'function') showGlassBreakEffect(btn);
      if (typeof playWrongSound === 'function') playWrongSound();
    }
  });
  
  if (isCorrect) {
    correctAnswersCount++;
    if (typeof playCorrectSound === 'function') playCorrectSound();
    if (typeof vibrateCorrect === 'function') vibrateCorrect();
    score += 10;
  } else {
    if (typeof vibrateWrong === 'function') vibrateWrong();
  }
  
  setTimeout(() => {
    currentQuestionIndex++;
    renderTimedModeScreen();
  }, isCorrect ? 500 : 1000);
}

async function finishTimedMode() {
  clearInterval(timerInterval);
  timedMode = false;
  
  const result = {
    playerName: document.getElementById('player-name').value.trim() || 'Гость',
    score: score,
    totalTime: 60,
    correctAnswers: correctAnswersCount,
    difficulty: 'timed',
    category: 'На время',
    date: new Date().toISOString(),
    userId: currentUser ? currentUser.uid : null
  };
  
  if (typeof isOnline !== 'undefined' && isOnline) {
    await saveResult(result);
  } else if (typeof saveResultOffline === 'function') {
    await saveResultOffline(result);
  }
  
  showScreen('result');
  
  const screen = document.getElementById('screen-result');
  if (screen) {
    screen.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-lg-6 text-center py-5">
          <h2 class="fw-bold font-display mb-3">⏱ Время вышло!</h2>
          <div class="bg-card rounded-4 p-4 mb-4">
            <p class="display-3 fw-bold text-accent mb-0">${result.score}</p>
            <p class="text-muted">очков за 60 секунд</p>
          </div>
          <button class="btn btn-accent rounded-pill px-4" onclick="startTimedMode()">
            <i class="bi bi-arrow-repeat me-2"></i>Ещё раз
          </button>
          <button class="btn btn-outline-accent rounded-pill px-4 mt-2" onclick="showScreen('home')">
            <i class="bi bi-house me-2"></i>На главную
          </button>
        </div>
      </div>
    `;
  }
  
  if (typeof saveScoreToHistory === 'function') saveScoreToHistory(result.score);
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getDifficultyLabel(difficulty) {
  const labels = { easy: '🟢 Легко', medium: '🟡 Средне', hard: '🔴 Сложно' };
  return labels[difficulty] || difficulty;
}

function getGrade(score) {
  if (score >= 90) return { title: 'Легенда!', message: 'Потрясающий результат,', icon: 'trophy-fill', color: 'grade-gold' };
  if (score >= 70) return { title: 'Отлично!', message: 'Ты настоящий знаток,', icon: 'star-fill', color: 'grade-silver' };
  if (score >= 50) return { title: 'Неплохо!', message: 'Хорошая попытка,', icon: 'hand-thumbs-up-fill', color: 'grade-bronze' };
  return { title: 'Попробуй ещё!', message: 'Не расстраивайся,', icon: 'emoji-smile-fill', color: 'grade-default' };
}