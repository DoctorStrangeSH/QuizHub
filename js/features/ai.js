// ============================================
// QuizHub — AI-противник
// ============================================

const AI_PROFILES = {
  easy: {
    name: 'Новичок',
    icon: '🤖',
    accuracy: 0.4,      // 40% правильных
    speedMin: 5,        // мин. время ответа (сек)
    speedMax: 12,       // макс. время ответа
    mistakePattern: 'random'
  },
  medium: {
    name: 'Знаток',
    icon: '🧠',
    accuracy: 0.65,
    speedMin: 3,
    speedMax: 8,
    mistakePattern: 'random'
  },
  hard: {
    name: 'Эксперт',
    icon: '👾',
    accuracy: 0.85,
    speedMin: 1,
    speedMax: 5,
    mistakePattern: 'smart'
  },
  impossible: {
    name: 'Гроссмейстер',
    icon: '💀',
    accuracy: 0.95,
    speedMin: 0.5,
    speedMax: 3,
    mistakePattern: 'rare'
  }
};

let aiOpponent = null;
let aiScore = 0;
let aiCorrectCount = 0;
let aiDifficulty = 'medium';

function setAIDifficulty(difficulty) {
  aiDifficulty = difficulty;
  aiOpponent = AI_PROFILES[difficulty];
}

function startAIDuel() {
  const nameInput = document.getElementById('player-name');
  if (!nameInput.value.trim()) {
    nameInput.focus();
    showToast('Введи своё имя!', 'warning');
    return;
  }
  
  if (!aiOpponent) setAIDifficulty('medium');
  
  aiScore = 0;
  aiCorrectCount = 0;
  score = 0;
  correctAnswersCount = 0;
  currentQuestionIndex = 0;
  QUIZ_SETTINGS.totalQuestions = 10;
  
  // Загружаем вопросы
  startQuiz();
  
  // Меняем заголовок
  setTimeout(() => {
    const scoreEl = document.querySelector('#screen-quiz .d-flex.justify-content-between');
    if (scoreEl) {
      scoreEl.innerHTML = `
        <small class="text-muted">🤖 vs ${aiOpponent.icon} ${aiOpponent.name}</small>
        <small class="text-muted">Ты: <span class="text-accent">${score}</span> | ${aiOpponent.icon}: <span class="text-warning">${aiScore}</span></small>
      `;
    }
  }, 200);
}

function simulateAIAnswer(question) {
  const profile = aiOpponent;
  if (!profile) return;
  
  // Определяем, ответит ли AI правильно
  const roll = Math.random();
  const isCorrect = roll < profile.accuracy;
  
  // Время ответа
  const answerTime = profile.speedMin + Math.random() * (profile.speedMax - profile.speedMin);
  
  if (isCorrect) {
    aiCorrectCount++;
    const timeBonus = Math.floor((QUIZ_SETTINGS.timePerQuestion - answerTime) / QUIZ_SETTINGS.timePerQuestion * 5);
    const multiplier = { easy: 1, medium: 1.5, hard: 2 }[question.difficulty] || 1;
    aiScore += Math.floor((10 + timeBonus) * multiplier);
  }
  
  return { isCorrect, answerTime };
}

function updateAIScoreDisplay() {
  const scoreEl = document.querySelector('#screen-quiz .d-flex.justify-content-between');
  if (scoreEl && aiOpponent) {
    scoreEl.innerHTML = `
      <small class="text-muted">🤖 vs ${aiOpponent.icon} ${aiOpponent.name}</small>
      <small class="text-muted">Ты: <span class="text-accent">${score}</span> | ${aiOpponent.icon}: <span class="text-warning">${aiScore}</span></small>
    `;
  }
}

// Модифицируем finishQuiz для AI-дуэли
const originalFinishQuiz = finishQuiz;
finishQuiz = async function() {
  if (aiOpponent) {
    // Симулируем ответы AI на все оставшиеся вопросы
    for (let i = correctAnswersCount; i < QUIZ_SETTINGS.totalQuestions; i++) {
      if (quizQuestions[i]) {
        simulateAIAnswer(quizQuestions[i]);
      }
    }
    
    await originalFinishQuiz();
    
    // Показываем результат дуэли
    setTimeout(() => {
      const screen = document.getElementById('screen-result');
      if (screen) {
        const playerWon = score > aiScore;
        const tie = score === aiScore;
        
        const banner = document.createElement('div');
        banner.className = `alert ${playerWon ? 'alert-success' : tie ? 'alert-warning' : 'alert-danger'} text-center mb-4`;
        banner.innerHTML = playerWon 
          ? `🏆 Ты победил ${aiOpponent.icon} ${aiOpponent.name}!` 
          : tie 
            ? `🤝 Ничья с ${aiOpponent.icon} ${aiOpponent.name}!`
            : `😔 ${aiOpponent.icon} ${aiOpponent.name} победил!`;
        
        screen.querySelector('.col-lg-6')?.insertBefore(
          banner,
          screen.querySelector('.col-lg-6').firstChild
        );
      }
    }, 100);
    
    aiOpponent = null;
  } else {
    await originalFinishQuiz();
  }
};

// Обновляем moveToNextQuestion для AI
const originalMoveToNextQuestion = moveToNextQuestion;
moveToNextQuestion = function() {
  if (aiOpponent && quizQuestions[currentQuestionIndex]) {
    simulateAIAnswer(quizQuestions[currentQuestionIndex]);
    updateAIScoreDisplay();
  }
  originalMoveToNextQuestion();
};

function showAISelectScreen() {
  const screen = document.getElementById('screen-quiz');
  if (!screen) return;
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-6 text-center py-5">
        <h2 class="fw-bold font-display mb-4">🤖 Выбери противника</h2>
        
        <div class="row g-3 mb-4">
          ${Object.entries(AI_PROFILES).map(([key, profile]) => `
            <div class="col-6">
              <div class="bg-card rounded-4 p-4 cursor-pointer" 
                   onclick="setAIDifficulty('${key}'); startAIDuel();"
                   style="cursor:pointer; transition: all 0.3s ease;"
                   onmouseover="this.style.borderColor='var(--accent)'"
                   onmouseout="this.style.borderColor=''">
                <span class="fs-1">${profile.icon}</span>
                <h5 class="fw-bold mt-2">${profile.name}</h5>
                <small class="text-muted">Точность: ${Math.round(profile.accuracy * 100)}%</small>
              </div>
            </div>
          `).join('')}
        </div>
        
        <button class="btn btn-outline-accent rounded-pill px-4" onclick="showScreen('home')">
          🏠 На главную
        </button>
      </div>
    </div>
  `;
  
  showScreen('quiz');
}