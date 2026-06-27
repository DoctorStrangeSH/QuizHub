// ============================================
// QuizHub — AI-противник v2.0
// Использует события вместо переопределения функций
// ============================================

const AI_PROFILES = {
  easy:   { name: 'Новичок', icon: '🤖', accuracy: 0.4,  speedMin: 5,  speedMax: 12 },
  medium: { name: 'Знаток',  icon: '🧠', accuracy: 0.65, speedMin: 3,  speedMax: 8  },
  hard:   { name: 'Эксперт', icon: '👾', accuracy: 0.85, speedMin: 1,  speedMax: 5  },
  impossible: { name: 'Гроссмейстер', icon: '💀', accuracy: 0.95, speedMin: 0.5, speedMax: 3 },
};

let aiOpponent = null;
let aiScore = 0;
let aiCorrectCount = 0;
let aiDifficulty = 'medium';
let aiActive = false;

function setAIDifficulty(difficulty) {
  aiDifficulty = difficulty;
  aiOpponent = AI_PROFILES[difficulty];
}

function startAIDuel() {
  const nameInput = document.getElementById('player-name');
  if (!nameInput?.value?.trim()) {
    nameInput?.focus();
    showToast('Введи своё имя!', 'warning');
    return;
  }
  
  if (!aiOpponent) setAIDifficulty('medium');
  
  aiScore = 0;
  aiCorrectCount = 0;
  aiActive = true;
  
  // Запускаем обычный квиз
  if (typeof startQuiz === 'function') {
    startQuiz();
  }
}

function simulateAIAnswer(question) {
  const profile = aiOpponent;
  if (!profile) return;
  
  const isCorrect = Math.random() < profile.accuracy;
  const answerTime = profile.speedMin + Math.random() * (profile.speedMax - profile.speedMin);
  
  if (isCorrect) {
    aiCorrectCount++;
    const timeBonus = Math.floor((QUIZ_SETTINGS.timePerQuestion - answerTime) / QUIZ_SETTINGS.timePerQuestion * 5);
    const multiplier = { easy: 1, medium: 1.5, hard: 2 }[question.difficulty] || 1;
    aiScore += Math.floor((10 + timeBonus) * multiplier);
  }
  
  updateAIScoreDisplay();
}

function updateAIScoreDisplay() {
  if (!aiActive || !aiOpponent) return;
  
  const scoreEl = document.querySelector('#screen-quiz .d-flex.justify-content-between');
  if (scoreEl) {
    scoreEl.innerHTML = `
      <small class="text-muted">🤖 vs ${aiOpponent.icon} ${aiOpponent.name}</small>
      <small class="text-muted">Ты: <span class="text-accent">${typeof score !== 'undefined' ? score : 0}</span> | ${aiOpponent.icon}: <span class="text-warning">${aiScore}</span></small>
    `;
  }
}

// Слушаем завершение квиза
EventBus.on(EVENTS.QUIZ_FINISHED, (result) => {
  if (!aiActive) return;
  
  const result = e.detail;
  
  // Симулируем ответы AI на оставшиеся вопросы
  for (let i = result.correctAnswers; i < QUIZ_SETTINGS.totalQuestions; i++) {
    if (typeof quizQuestions !== 'undefined' && quizQuestions[i]) {
      simulateAIAnswer(quizQuestions[i]);
    }
  }
  
  // Показываем результат дуэли
  setTimeout(() => {
    const screen = document.getElementById('screen-result');
    if (screen) {
      const playerScore = result.score;
      const playerWon = playerScore > aiScore;
      const tie = playerScore === aiScore;
      
      const banner = document.createElement('div');
      banner.className = `alert ${playerWon ? 'alert-success' : tie ? 'alert-warning' : 'alert-danger'} text-center mb-4`;
      banner.innerHTML = playerWon 
        ? `🏆 Ты победил ${aiOpponent.icon} ${aiOpponent.name}!` 
        : tie 
          ? `🤝 Ничья с ${aiOpponent.icon} ${aiOpponent.name}!`
          : `😔 ${aiOpponent.icon} ${aiOpponent.name} победил!`;
      
      screen.querySelector('.col-lg-6')?.insertBefore(banner, screen.querySelector('.col-lg-6').firstChild);
    }
    
    aiActive = false;
  }, 100);
});

// Слушаем смену вопроса (для обновления счёта AI)
document.addEventListener('quiz-started', () => {
  if (aiActive) {
    updateAIScoreDisplay();
  }
});

function showAISelectScreen() {
    const screen = document.getElementById('screen-quiz');
    if (!screen) return;

    const profiles = {
        easy:   { name: t('aiNovice'), icon: '🤖', accuracy: 0.4 },
        medium: { name: t('aiExpert'), icon: '🧠', accuracy: 0.65 },
        hard:   { name: t('aiExpert'), icon: '👾', accuracy: 0.85 },
        impossible: { name: t('aiGrandmaster'), icon: '💀', accuracy: 0.95 },
    };

    screen.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-lg-6 text-center py-5">
                <h2 class="fw-bold font-display mb-4">🤖 ${t('aiTitle')}</h2>
                <div class="row g-3 mb-4">
                    ${Object.entries(profiles).map(([key, profile]) => `
                        <div class="col-6">
                            <div class="bg-card rounded-4 p-4" onclick="setAIDifficulty('${key}'); startAIDuel();" style="cursor:pointer;">
                                <span class="fs-1">${profile.icon}</span>
                                <h5 class="fw-bold mt-2">${profile.name}</h5>
                                <small class="text-muted">${t('aiAccuracy')}: ${Math.round(profile.accuracy * 100)}%</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-outline-accent rounded-pill px-4" onclick="showScreen('home')">🏠 ${t('home')}</button>
            </div>
        </div>
    `;

    showScreen('quiz');
}