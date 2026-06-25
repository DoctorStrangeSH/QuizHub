// ============================================
// QuizHub — Режим "Выживание"
// ============================================

let survivalLives = 3;
let survivalMaxLives = 5;
let survivalQuestionNumber = 0;
let survivalDifficultyLevel = 1;
let survivalMode = false;
let survivalCombo = 0;
let survivalBestCombo = 0;

async function startSurvivalMode() {
  const nameInput = document.getElementById('player-name');
  if (!nameInput.value.trim()) {
    nameInput.focus();
    showToast(currentLocale === 'en' ? 'Enter your name!' : 'Введи своё имя!', 'warning');
    return;
  }
  
  survivalLives = 3;
  survivalQuestionNumber = 0;
  survivalDifficultyLevel = 1;
  survivalMode = true;
  survivalCombo = 0;
  survivalBestCombo = 0;
  correctAnswersCount = 0;
  score = 0;
  
  // Загружаем 100 вопросов
  const data = await loadRussianQuestions();
  quizQuestions = shuffleArray([...data.questions]).slice(0, 100);
  currentQuestionIndex = 0;
  
  QUIZ_SETTINGS.totalQuestions = 999;
  QUIZ_SETTINGS.timePerQuestion = 15;
  
  showScreen('quiz');
  renderSurvivalScreen();
  startTimer();
}

function renderSurvivalScreen() {
  const screen = document.getElementById('screen-quiz');
  if (!screen || quizQuestions.length === 0) return;
  
  const question = quizQuestions[currentQuestionIndex];
  
  // Цвет сложности
  let diffColor = 'var(--success)';
  if (survivalDifficultyLevel >= 5) diffColor = 'var(--danger)';
  else if (survivalDifficultyLevel >= 3) diffColor = 'var(--warning)';
  
  // Строка жизней
  const heartsStr = '❤️'.repeat(survivalLives) + '🖤'.repeat(survivalMaxLives - survivalLives);
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-7">
        
        <div class="d-flex justify-content-between align-items-center mb-3">
          <small class="text-muted">💀 ${t('survival')} #${survivalQuestionNumber + 1}</small>
          <div>
            <span class="me-2">${heartsStr}</span>
            <small class="text-muted">🏆 ${score}</small>
          </div>
        </div>
        
        <div class="d-flex justify-content-between align-items-center mb-3">
          <small style="color: ${diffColor}">⚡ Сложность: ${survivalDifficultyLevel}/10</small>
          <small class="text-muted">🔥 Комбо: x${survivalCombo}</small>
        </div>
        
        <div class="d-flex justify-content-center mb-4">
          ${createCircularTimer(QUIZ_SETTINGS.timePerQuestion)}
        </div>
        
        <div class="question-card-wrapper">
          <div class="question-card-inner scale-in">
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
          </div>
        </div>
        
      </div>
    </div>
  `;
  
  document.querySelectorAll('.btn-answer').forEach(btn => {
    btn.addEventListener('click', function() {
      handleSurvivalAnswer(parseInt(this.dataset.index));
    });
  });
}

function handleSurvivalAnswer(selectedIndex) {
  clearInterval(timerInterval);
  
  const question = quizQuestions[currentQuestionIndex];
  const isCorrect = selectedIndex === question.correctIndex;
  
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
    }
  });
  
  if (isCorrect) {
    survivalCombo++;
    if (survivalCombo > survivalBestCombo) survivalBestCombo = survivalCombo;
    
    // Очки с учётом комбо и сложности
    const comboTimes = Math.floor(survivalCombo / 3) + 1;
    score += 10 * comboTimes * survivalDifficultyLevel;
    
    // Восстанавливаем жизнь за каждые 5 правильных
    if (survivalCombo % 5 === 0 && survivalLives < survivalMaxLives) {
      survivalLives++;
      showToast('+1 ❤️!', 'success');
    }
    
    // Повышаем сложность
    if (survivalCombo % 3 === 0) {
      survivalDifficultyLevel = Math.min(survivalDifficultyLevel + 1, 10);
      QUIZ_SETTINGS.timePerQuestion = Math.max(5, 15 - survivalDifficultyLevel);
    }
    
    if (typeof playCorrectSound === 'function') playCorrectSound();
  } else {
    survivalCombo = 0;
    survivalLives--;
    
    // Снижаем сложность
    survivalDifficultyLevel = Math.max(1, survivalDifficultyLevel - 1);
    QUIZ_SETTINGS.timePerQuestion = Math.max(5, 15 - survivalDifficultyLevel);
    
    if (survivalLives <= 0) {
      setTimeout(() => finishSurvivalMode(), 1000);
      return;
    }
    
    showToast(`${survivalLives} ❤️ осталось!`, 'warning');
  }
  
  survivalQuestionNumber++;
  
  setTimeout(() => {
    currentQuestionIndex++;
    renderSurvivalScreen();
    startTimer();
  }, isCorrect ? 600 : 1500);
}

async function finishSurvivalMode() {
  clearInterval(timerInterval);
  survivalMode = false;
  
  const result = {
    playerName: document.getElementById('player-name').value.trim() || 'Гость',
    score: score,
    totalTime: 0,
    correctAnswers: survivalQuestionNumber - (3 - survivalLives),
    difficulty: 'survival',
    category: 'Выживание',
    date: new Date().toISOString(),
    userId: currentUser ? currentUser.uid : null
  };
  
  if (typeof isOnline !== 'undefined' && isOnline) {
    await saveResult(result);
  }
  
  // Монеты
  const coins = Math.floor(score / 10);
  addCoins(coins);
  
  showScreen('result');
  
  const screen = document.getElementById('screen-result');
  if (screen) {
    screen.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-lg-6 text-center py-5">
          <h2 class="fw-bold font-display mb-3">💀 Игра окончена!</h2>
          <div class="bg-card rounded-4 p-4 mb-4">
            <p class="display-3 fw-bold text-accent mb-0">${result.score}</p>
            <p class="text-muted">очков</p>
            <p class="text-muted">Вопросов: ${survivalQuestionNumber} | Лучшее комбо: x${survivalBestCombo}</p>
            <p class="text-success">+${coins} 🪙</p>
          </div>
          <button class="btn btn-accent rounded-pill px-4" onclick="startSurvivalMode()">
            🔄 Ещё раз
          </button>
          <button class="btn btn-outline-accent rounded-pill px-4 mt-2" onclick="showScreen('home')">
            🏠 На главную
          </button>
        </div>
      </div>
    `;
  }
}