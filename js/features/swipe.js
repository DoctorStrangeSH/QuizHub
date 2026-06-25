// ============================================
// QuizHub — Жесты и свайпы
// ============================================

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let swipeEnabled = true;

// ========== ИНИЦИАЛИЗАЦИЯ ==========

function initSwipeGestures() {
  const quizScreen = document.getElementById('screen-quiz');
  
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  
  // Свайп для возврата на главную (глобально)
  document.addEventListener('swipe-right', () => {
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen && currentScreen.id !== 'screen-home' && currentScreen.id !== 'screen-quiz') {
      showScreen('home');
    }
  });
}

function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchStartTime = Date.now();
}

function handleTouchMove(e) {
  // Предотвращаем скролл при свайпе на экране квиза
  const quizScreen = document.getElementById('screen-quiz');
  if (quizScreen && quizScreen.classList.contains('active')) {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
    
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  }
}

function handleTouchEnd(e) {
  if (!swipeEnabled) return;
  
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const touchDuration = Date.now() - touchStartTime;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  
  // Минимальная дистанция для свайпа
  const minSwipeDistance = 50;
  const maxSwipeDuration = 500; // мс
  
  // Слишком медленно — не свайп
  if (touchDuration > maxSwipeDuration) return;
  
  // Горизонтальный свайп
  if (absX > absY && absX > minSwipeDistance) {
    if (deltaX > 0) {
      // Свайп вправо
      handleSwipeRight();
      document.dispatchEvent(new CustomEvent('swipe-right'));
    } else {
      // Свайп влево
      handleSwipeLeft();
      document.dispatchEvent(new CustomEvent('swipe-left'));
    }
  }
  
  // Вертикальный свайп
  if (absY > absX && absY > minSwipeDistance) {
    if (deltaY < 0) {
      // Свайп вверх
      handleSwipeUp();
      document.dispatchEvent(new CustomEvent('swipe-up'));
    } else {
      // Свайп вниз
      handleSwipeDown();
      document.dispatchEvent(new CustomEvent('swipe-down'));
    }
  }
}

// ========== ОБРАБОТЧИКИ СВАЙПОВ ==========

function handleSwipeRight() {
  const quizScreen = document.getElementById('screen-quiz');
  
  // На экране квиза — возврат на главную
  if (quizScreen && quizScreen.classList.contains('active')) {
    if (confirm('Вернуться на главную? Прогресс будет потерян.')) {
      clearInterval(timerInterval);
      showScreen('home');
      showToast('Квиз прерван', 'warning');
    }
    return;
  }
  
  // На других экранах — просто на главную
  const currentScreen = document.querySelector('.screen.active');
  if (currentScreen && currentScreen.id !== 'screen-home') {
    showScreen('home');
  }
}

function handleSwipeLeft() {
  const quizScreen = document.getElementById('screen-quiz');
  
  // На экране квиза — пропустить вопрос
  if (quizScreen && quizScreen.classList.contains('active')) {
    const skipBtn = document.getElementById('skip-question');
    if (skipBtn && !skipBtn.disabled) {
      skipBtn.click();
      showSwipeHint('⏭ Пропущено');
    }
    return;
  }
}

function handleSwipeUp() {
  const quizScreen = document.getElementById('screen-quiz');
  
  // На экране квиза — голосовой ввод
  if (quizScreen && quizScreen.classList.contains('active')) {
    if (typeof startListening === 'function') {
      startListening();
      showSwipeHint('🎤 Голосовой ввод');
    }
  }
}

function handleSwipeDown() {
  // Можно использовать для обновления таблицы лидеров
  const leaderboardScreen = document.getElementById('screen-leaderboard');
  if (leaderboardScreen && leaderboardScreen.classList.contains('active')) {
    loadLeaderboard();
    showSwipeHint('🔄 Обновлено');
  }
}

// ========== ВИЗУАЛЬНЫЙ ОТКЛИК ==========

function showSwipeHint(text) {
  // Удаляем старый хинт
  const oldHint = document.querySelector('.swipe-hint');
  if (oldHint) oldHint.remove();
  
  const hint = document.createElement('div');
  hint.className = 'swipe-hint';
  hint.textContent = text;
  document.body.appendChild(hint);
  
  setTimeout(() => hint.remove(), 1500);
}

// ========== ПОДСКАЗКИ ПРИ ПЕРВОМ ЗАПУСКЕ ==========

function showSwipeTutorial() {
  const seen = localStorage.getItem('quizhub-swipe-tutorial');
  if (seen) return;
  
  const quizScreen = document.getElementById('screen-quiz');
  if (!quizScreen || !quizScreen.classList.contains('active')) return;
  
  const hints = [
    { text: '👈 Свайп влево — пропустить вопрос', delay: 2000 },
    { text: '👉 Свайп вправо — выйти из квиза', delay: 4000 },
    { text: '👆 Свайп вверх — голосовой ответ', delay: 6000 }
  ];
  
  hints.forEach(({ text, delay }) => {
    setTimeout(() => showSwipeHint(text), delay);
  });
  
  localStorage.setItem('quizhub-swipe-tutorial', 'true');
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  initSwipeGestures();
  
  // Показываем подсказки при старте квиза
  const originalStartQuiz = startQuiz;
  if (typeof startQuiz === 'function') {
    startQuiz = async function() {
      await originalStartQuiz();
      setTimeout(showSwipeTutorial, 1000);
    };
  }
});