// ============================================
// QuizHub — Ежедневные события v2.0
// Баннер только на главном экране
// ============================================

const WEEKLY_EVENTS = {
  1: { name: 'Научный понедельник', icon: '🔬', category: 'science', xpMultiplier: 2, coinMultiplier: 1.5, desc: 'Удвоенный XP за науку!', color: '#40C4FF' },
  3: { name: 'Безумная среда', icon: '🤪', category: 'hard', xpMultiplier: 3, coinMultiplier: 2, desc: 'Только сложные вопросы! Тройной XP!', color: '#FF5252' },
  4: { name: 'Киночетверг', icon: '🎬', category: 'cinema', xpMultiplier: 2, coinMultiplier: 2, desc: 'Вопросы про кино с двойными монетами!', color: '#FFD740' },
  5: { name: 'Блиц-пятница', icon: '⚡', category: 'speed', xpMultiplier: 1.5, coinMultiplier: 1.5, desc: 'Режим на время с бонусами!', color: '#FF6B9D' },
  6: { name: 'Спортивная суббота', icon: '⚽', category: 'sport', xpMultiplier: 2, coinMultiplier: 1.5, desc: 'Спортивные вопросы с бонусами!', color: '#00E676' },
  0: { name: 'Турнирное воскресенье', icon: '🏆', category: 'any', xpMultiplier: 2, coinMultiplier: 2, desc: 'Бесплатный вход в турниры!', color: '#FFD700' },
};

const SPECIAL_EVENTS = [
  { name: 'Новый год', icon: '🎄', datePattern: '12-31', xpMultiplier: 5, coinMultiplier: 5, desc: 'Праздничный квиз! Упятерённые награды!', color: '#FF5252' },
  { name: 'День знаний', icon: '📚', datePattern: '09-01', xpMultiplier: 3, coinMultiplier: 3, desc: 'Тройные награды в честь 1 сентября!', color: '#40C4FF' },
  { name: 'День космонавтики', icon: '🚀', datePattern: '04-12', xpMultiplier: 4, coinMultiplier: 4, desc: 'Космические награды!', color: '#7B2FBE' },
  { name: 'Хэллоуин', icon: '🎃', datePattern: '10-31', xpMultiplier: 3, coinMultiplier: 2, desc: 'Страшно высокие награды!', color: '#FF8F00' },
  { name: 'День Победы', icon: '⭐', datePattern: '05-09', xpMultiplier: 3, coinMultiplier: 3, desc: 'Праздничные награды!', color: '#FFD740' },
  { name: 'День России', icon: '🇷🇺', datePattern: '06-12', xpMultiplier: 3, coinMultiplier: 3, desc: 'Патриотический квиз!', color: '#40C4FF' },
];

let activeEvent = null;

function checkActiveEvent() {
  const now = new Date();
  const mskOffset = 3 * 60 * 60 * 1000;
  const mskTime = new Date(now.getTime() + mskOffset);
  const monthDay = mskTime.toISOString().split('T')[0].slice(5);
  
  for (const event of SPECIAL_EVENTS) {
    if (event.datePattern === monthDay) {
      activeEvent = event;
      return event;
    }
  }
  
  const dayOfWeek = mskTime.getDay();
  const weeklyEvent = WEEKLY_EVENTS[dayOfWeek];
  
  if (weeklyEvent) {
    activeEvent = { ...weeklyEvent, isWeekly: true };
    return activeEvent;
  }
  
  activeEvent = null;
  return null;
}

function getEventMultipliers() {
  const event = checkActiveEvent();
  return {
    xp: event?.xpMultiplier || 1,
    coins: event?.coinMultiplier || 1,
    event: event
  };
}

// ========== БАННЕР НА ГЛАВНОМ ЭКРАНЕ ==========

function renderEventBanner() {
  const event = checkActiveEvent();
  const container = document.getElementById('event-banner-container');
  if (!container) return;
  
  if (!event) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  const bgColor = event.color || 'var(--accent)';
  
  container.innerHTML = `
    <div class="event-banner-card" style="--event-color: ${bgColor};" onclick="handleEventClick('${event.category || 'any'}')">
      <div class="event-banner-icon">${event.icon}</div>
      <div class="event-banner-info">
        <div class="event-banner-title">${event.name}</div>
        <div class="event-banner-desc">${event.desc}</div>
        <div class="event-banner-bonuses">
          ${event.xpMultiplier > 1 ? `<span class="event-bonus">⚡ x${event.xpMultiplier} XP</span>` : ''}
          ${event.coinMultiplier > 1 ? `<span class="event-bonus">🪙 x${event.coinMultiplier} монет</span>` : ''}
        </div>
      </div>
      <div class="event-banner-arrow">→</div>
    </div>
  `;
}

function handleEventClick(category) {
  if (category === 'speed') {
    if (typeof startTimedMode === 'function') startTimedMode();
    return;
  }
  if (category === 'hard') {
    document.querySelectorAll('.btn-difficulty').forEach(b => {
      b.classList.toggle('active', b.dataset.difficulty === 'hard');
    });
    if (typeof selectedDifficulty !== 'undefined') selectedDifficulty = 'hard';
    showToast('Выбрана сложность: Сложно 🔴', 'success');
    return;
  }
  
  const catSelect = document.getElementById('quiz-category');
  if (catSelect && category !== 'any') {
    catSelect.value = category;
    showToast(`Выбрана категория: ${catSelect.options[catSelect.selectedIndex].text}`, 'success');
  }
}

// ========== ВСТРАИВАЕМ В ГЛАВНЫЙ ЭКРАН ==========

function injectEventBannerIntoHome() {
  const homeScreen = document.getElementById('screen-home');
  if (!homeScreen) return;
  
  const observer = new MutationObserver(() => {
    if (homeScreen.classList.contains('active')) {
      if (!document.getElementById('event-banner-container')) {
        const quizSetup = homeScreen.querySelector('.quiz-setup');
        if (quizSetup) {
          const bannerContainer = document.createElement('div');
          bannerContainer.id = 'event-banner-container';
          bannerContainer.style.display = 'none';
          quizSetup.parentNode.insertBefore(bannerContainer, quizSetup);
          renderEventBanner();
        }
      } else {
        renderEventBanner();
      }
    }
  });
  
  observer.observe(homeScreen, { attributes: true, attributeFilter: ['class'] });
  
  if (homeScreen.classList.contains('active')) {
    setTimeout(() => {
      if (!document.getElementById('event-banner-container')) {
        const quizSetup = homeScreen.querySelector('.quiz-setup');
        if (quizSetup) {
          const bannerContainer = document.createElement('div');
          bannerContainer.id = 'event-banner-container';
          bannerContainer.style.display = 'none';
          quizSetup.parentNode.insertBefore(bannerContainer, quizSetup);
          renderEventBanner();
        }
      } else {
        renderEventBanner();
      }
    }, 200);
  }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(injectEventBannerIntoHome, 500);
  
  const originalShowScreen = typeof showScreen === 'function' ? showScreen : null;
  if (originalShowScreen) {
    const decoratedShowScreen = function(screenName) {
      originalShowScreen(screenName);
      if (screenName === 'home') {
        setTimeout(renderEventBanner, 300);
      }
    };
    if (showScreen === originalShowScreen) {
      showScreen = decoratedShowScreen;
    }
  }
});