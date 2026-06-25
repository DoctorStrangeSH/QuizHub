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
  if (!nameInput?.value?.trim()) {
    nameInput?.focus();
    showToast('Введи своё имя!', 'warning');
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
  
  const data = typeof loadRussianQuestions === 'function' ? await loadRussianQuestions() : null;
  if (data?.questions) {
    quizQuestions = shuffleArray([...data.questions]).slice(0, 100);
  } else {
    quizQuestions = await fetchQuestions('any', 'any', 100);
  }
  
  if (quizQuestions.length === 0) { showToast('Не удалось загрузить вопросы', 'danger'); showScreen('home'); return; }
  
  currentQuestionIndex = 0;
  QUIZ_SETTINGS.totalQuestions = 999;
  QUIZ_SETTINGS.timePerQuestion = 15;
  
  showScreen('quiz');
  renderSurvivalScreen();
  startTimer();
  
  document.dispatchEvent(new CustomEvent('quiz-started'));
}

function renderSurvivalScreen() {
  const screen = document.getElementById('screen-quiz');
  if (!screen || quizQuestions.length === 0) return;
  
  const question = quizQuestions[currentQuestionIndex];
  const heartsStr = '❤️'.repeat(survivalLives) + '🖤'.repeat(survivalMaxLives - survivalLives);
  
  let diffColor = 'var(--success)';
  if (survivalDifficultyLevel >= 5) diffColor = 'var(--danger)';
  else if (survivalDifficultyLevel >= 3) diffColor = 'var(--warning)';
  
  screen.innerHTML = `
    <div class="row justify-content-center"><div class="col-lg-7">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <small class="text-muted">💀 Выживание #${survivalQuestionNumber + 1}</small>
        <div><span class="me-2">${heartsStr}</span><small class="text-muted">🏆 ${score}</small></div>
      </div>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <small style="color: ${diffColor}">⚡ Сложность: ${survivalDifficultyLevel}/10</small>
        <small class="text-muted">🔥 Комбо: x${survivalCombo}</small>
      </div>
      <div class="d-flex justify-content-center mb-4">${createCircularTimer(QUIZ_SETTINGS.timePerQuestion)}</div>
      <div class="bg-card rounded-4 p-4 p-md-5 mb-4">
        <span class="badge bg-accent bg-opacity-25 text-accent rounded-pill px-3 py-2 mb-3">
          ${typeof getCategoryName === 'function' ? getCategoryName(question.category) : question.category || 'Общие знания'} • ${getDifficultyLabel(question.difficulty)}
        </span>
        <h3 class="fw-bold mb-4">${question.question}</h3>
        <div class="d-grid gap-3" id="answers-container">
          ${question.answers.map((a,i) => `<button class="btn btn-answer rounded-4 p-3 text-start" data-index="${i}"><span class="answer-letter">${String.fromCharCode(65+i)}</span><span class="answer-text">${a}</span></button>`).join('')}
        </div>
      </div>
    </div></div>`;
  
  document.querySelectorAll('.btn-answer').forEach(btn => {
    btn.addEventListener('click', function() { handleSurvivalAnswer(parseInt(this.dataset.index)); });
  });
}

function handleSurvivalAnswer(selectedIndex) {
  clearInterval(timerInterval);
  
  const question = quizQuestions[currentQuestionIndex];
  const isCorrect = selectedIndex === question.correctIndex;
  
  document.querySelectorAll('.btn-answer').forEach((btn,i) => {
    btn.disabled = true;
    if (i === question.correctIndex) { btn.classList.add('correct'); if (typeof showCorrectGlow === 'function') showCorrectGlow(btn); }
    if (i === selectedIndex && !isCorrect) {
      btn.classList.add('wrong');
      if (typeof playWrongSound === 'function') playWrongSound();
    }
  });
  
  if (isCorrect) {
    survivalCombo++;
    if (survivalCombo > survivalBestCombo) survivalBestCombo = survivalCombo;
    
    const comboTimes = Math.floor(survivalCombo / 3) + 1;
    score += 10 * comboTimes * survivalDifficultyLevel;
    
    if (survivalCombo % 5 === 0 && survivalLives < survivalMaxLives) {
      survivalLives++;
      showToast('+1 ❤️!', 'success');
    }
    
    if (survivalCombo % 3 === 0) {
      survivalDifficultyLevel = Math.min(survivalDifficultyLevel + 1, 10);
      QUIZ_SETTINGS.timePerQuestion = Math.max(5, 15 - survivalDifficultyLevel);
    }
    
    if (typeof playCorrectSound === 'function') playCorrectSound();
  } else {
    survivalCombo = 0;
    survivalLives--;
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
    playerName: document.getElementById('player-name')?.value?.trim() || 'Гость',
    score: score,
    totalTime: 0,
    correctAnswers: survivalQuestionNumber - (3 - Math.max(0, survivalLives)),
    difficulty: 'survival',
    category: 'Выживание',
    date: new Date().toISOString(),
    userId: typeof currentUser !== 'undefined' ? currentUser?.uid : null
  };
  
  if (typeof isOnline !== 'undefined' && isOnline) {
    if (typeof saveResult === 'function') await saveResult(result);
  }
  
  const coins = Math.floor(score / 10);
  if (typeof addCoins === 'function') addCoins(coins);
  
  showScreen('result');
  
  const screen = document.getElementById('screen-result');
  if (screen) {
    screen.innerHTML = `
      <div class="row justify-content-center"><div class="col-lg-6 text-center py-5">
        <h2 class="fw-bold font-display mb-3">💀 Игра окончена!</h2>
        <div class="bg-card rounded-4 p-4 mb-4">
          <p class="display-3 fw-bold text-accent mb-0">${result.score}</p>
          <p class="text-muted">очков</p>
          <p class="text-muted">Вопросов: ${survivalQuestionNumber} | Лучшее комбо: x${survivalBestCombo}</p>
          <p class="text-success">+${coins} 🪙</p>
        </div>
        <button class="btn btn-accent rounded-pill px-4" onclick="startSurvivalMode()">🔄 Ещё раз</button>
        <button class="btn btn-outline-accent rounded-pill px-4 mt-2" onclick="showScreen('home')">🏠 На главную</button>
      </div></div>
    `;
  }
  
  document.dispatchEvent(new CustomEvent('quiz-finished', { detail: result }));
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}