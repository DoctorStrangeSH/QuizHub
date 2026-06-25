// ============================================
// QuizHub — Жесты и свайпы v2.0
// Только на мобильных устройствах
// ============================================

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let swipeEnabled = true;
let isMobileDevice = false;

// ========== ОПРЕДЕЛЕНИЕ МОБИЛЬНОГО УСТРОЙСТВА ==========

function detectMobile() {
  isMobileDevice = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || 
                   ('ontouchstart' in window && window.innerWidth < 1024);
  return isMobileDevice;
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

function initSwipeGestures() {
  if (!detectMobile()) {
    console.log('💻 Десктоп — жесты отключены');
    return;
  }
  
  console.log('📱 Мобильное устройство — жесты включены');
  
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  // Свайп для возврата на главную
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

function handleTouchEnd(e) {
  if (!swipeEnabled) return;
  
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const touchDuration = Date.now() - touchStartTime;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  
  const minSwipeDistance = 50;
  const maxSwipeDuration = 500;
  
  if (touchDuration > maxSwipeDuration) return;
  
  // Горизонтальный свайп
  if (absX > absY && absX > minSwipeDistance) {
    if (deltaX > 0) {
      handleSwipeRight();
      document.dispatchEvent(new CustomEvent('swipe-right'));
    } else {
      handleSwipeLeft();
      document.dispatchEvent(new CustomEvent('swipe-left'));
    }
  }
  
  // Вертикальный свайп
  if (absY > absX && absY > minSwipeDistance) {
    if (deltaY < 0) {
      handleSwipeUp();
      document.dispatchEvent(new CustomEvent('swipe-up'));
    } else {
      handleSwipeDown();
      document.dispatchEvent(new CustomEvent('swipe-down'));
    }
  }
}

// ========== ОБРАБОТЧИКИ ==========

function handleSwipeRight() {
  const quizScreen = document.getElementById('screen-quiz');
  
  if (quizScreen && quizScreen.classList.contains('active')) {
    if (confirm('Вернуться на главную? Прогресс будет потерян.')) {
      if (typeof timerInterval !== 'undefined') clearInterval(timerInterval);
      showScreen('home');
      showToast('Квиз прерван', 'warning');
    }
    return;
  }
  
  const currentScreen = document.querySelector('.screen.active');
  if (currentScreen && currentScreen.id !== 'screen-home') {
    showScreen('home');
  }
}

function handleSwipeLeft() {
  const quizScreen = document.getElementById('screen-quiz');
  
  if (quizScreen && quizScreen.classList.contains('active')) {
    const skipBtn = document.getElementById('skip-question');
    if (skipBtn && !skipBtn.disabled) {
      skipBtn.click();
      showSwipeHint('⏭ Пропущено');
    }
  }
}

function handleSwipeUp() {
  const quizScreen = document.getElementById('screen-quiz');
  
  if (quizScreen && quizScreen.classList.contains('active')) {
    if (typeof startListening === 'function') {
      startListening();
      showSwipeHint('🎤 Голосовой ввод');
    }
  }
}

function handleSwipeDown() {
  const leaderboardScreen = document.getElementById('screen-leaderboard');
  if (leaderboardScreen && leaderboardScreen.classList.contains('active')) {
    if (typeof loadLeaderboard === 'function') loadLeaderboard();
    showSwipeHint('🔄 Обновлено');
  }
}

// ========== ВИЗУАЛЬНЫЙ ОТКЛИК ==========

function showSwipeHint(text) {
  const oldHint = document.querySelector('.swipe-hint');
  if (oldHint) oldHint.remove();
  
  const hint = document.createElement('div');
  hint.className = 'swipe-hint';
  hint.textContent = text;
  document.body.appendChild(hint);
  
  setTimeout(() => hint.remove(), 1500);
}

// ========== ПОДСКАЗКИ ПРИ ПЕРВОМ ЗАПУСКЕ (только на мобильных) ==========

function showSwipeTutorial() {
  if (!isMobileDevice) return;
  
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
  
  // Слушаем событие начала квиза для показа подсказок
  document.addEventListener('quiz-started', () => {
    setTimeout(showSwipeTutorial, 1000);
  });
});