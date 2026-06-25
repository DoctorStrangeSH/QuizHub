// ============================================
// QuizHub — Система переводов v2.3
// ============================================

let currentLocale = localStorage.getItem('quizhub-locale') || 'ru';

const translations = {
  ru: {
    leaders: 'Лидеры', achievements: 'Ачивки', stats: 'Статистика',
    login: 'Войти', logout: 'Выйти', sound: 'Звук', theme: 'Тема',
    team: 'Команда', tournaments: 'Турниры', shop: 'Магазин',
    heroTitle: 'Проверь свои', heroSubtitle: 'знания',
    heroDesc: 'Выбери категорию, пройди квиз и займи место в таблице лидеров!',
    yourName: 'Твоё имя', namePlaceholder: 'Владислав',
    category: 'Категория', anyCategory: 'Любая категория',
    difficulty: 'Сложность', easy: '🟢 Легко', medium: '🟡 Средне', hard: '🔴 Сложно',
    startQuiz: 'НАЧАТЬ КВИЗ', survival: 'Выживание', aiMode: 'vs AI', timed: 'На время',
    questionsCount: '10 вопросов', timePerQuestion: '15 сек / вопрос', bonusSpeed: 'Бонусы за скорость',
    friends: 'Друзья', loading: 'Загрузка...',
    science: 'Наука', history: 'История', geography: 'География', sport: 'Спорт',
    cinema: 'Кино', art: 'Искусство', music: 'Музыка', it: 'IT и технологии',
    literature: 'Литература', food: 'Еда', animals: 'Животные', space: 'Космос',
  },
  en: {
    leaders: 'Leaders', achievements: 'Achievements', stats: 'Stats',
    login: 'Sign In', logout: 'Sign Out', sound: 'Sound', theme: 'Theme',
    team: 'Team', tournaments: 'Tournaments', shop: 'Shop',
    heroTitle: 'Test your', heroSubtitle: 'knowledge',
    heroDesc: 'Choose a category, take a quiz and get to the leaderboard!',
    yourName: 'Your name', namePlaceholder: 'John',
    category: 'Category', anyCategory: 'Any category',
    difficulty: 'Difficulty', easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard',
    startQuiz: 'START QUIZ', survival: 'Survival', aiMode: 'vs AI', timed: 'Timed',
    questionsCount: '10 questions', timePerQuestion: '15 sec / question', bonusSpeed: 'Speed bonuses',
    friends: 'Friends', loading: 'Loading...',
    science: 'Science', history: 'History', geography: 'Geography', sport: 'Sport',
    cinema: 'Cinema', art: 'Art', music: 'Music', it: 'IT & Tech',
    literature: 'Literature', food: 'Food', animals: 'Animals', space: 'Space',
  }
};

function t(key) {
  return translations[currentLocale]?.[key] || translations['ru']?.[key] || key;
}

function setLocale(locale) {
  currentLocale = locale;
  localStorage.setItem('quizhub-locale', locale);
  
  if (typeof selectedLanguage !== 'undefined') {
    selectedLanguage = locale;
    localStorage.setItem('quizhub-language', locale);
  }
  
  document.querySelectorAll('.btn-locale').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.locale === locale);
  });
  
  updateAllTranslations();
  console.log('🌍 Язык:', locale);
}

function updateAllTranslations() {
  // 1. Все элементы с data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
    } else if (el.tagName === 'OPTION') {
      el.textContent = text;
    } else if (el.querySelector('i') && el.childNodes.length > 1) {
      const span = el.querySelector('span');
      if (span) span.textContent = text;
    } else {
      el.textContent = text;
    }
  });
  
  // 2. Заголовок
  const h1 = document.querySelector('#screen-home h1');
  if (h1) h1.innerHTML = `${t('heroTitle')} <span class="text-accent">${t('heroSubtitle')}</span>`;
  
  // 3. Описание
  const lead = document.querySelector('#screen-home .lead');
  if (lead) lead.textContent = t('heroDesc');
  
  // 4. Кнопка старта
  const startBtn = document.getElementById('start-quiz');
  if (startBtn) startBtn.innerHTML = `<i class="bi bi-play-fill me-2"></i>${t('startQuiz')}`;
  
  // 5. Поле имени
  const nameInput = document.getElementById('player-name');
  if (nameInput) nameInput.placeholder = t('namePlaceholder');
  
  // 6. Лейблы
  const labels = document.querySelectorAll('#screen-home .form-label');
  if (labels[0]) labels[0].innerHTML = `<i class="bi bi-person me-1 text-accent"></i>${t('yourName')}`;
  if (labels[1]) labels[1].innerHTML = `<i class="bi bi-grid me-1 text-accent"></i>${t('category')}`;
  if (labels[2]) labels[2].innerHTML = `<i class="bi bi-speedometer2 me-1 text-accent"></i>${t('difficulty')}`;
  
  // 7. Кнопки сложности
  const diffLabels = { easy: t('easy'), medium: t('medium'), hard: t('hard') };
  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    const d = btn.dataset.difficulty;
    if (d && diffLabels[d]) btn.textContent = diffLabels[d];
  });
  
  // 8. Мини-статистика
  const stats = document.querySelectorAll('#screen-home .d-flex.gap-4 span');
  if (stats[0]) stats[0].innerHTML = `📝 ${t('questionsCount')}`;
  if (stats[1]) stats[1].innerHTML = `⏰ ${t('timePerQuestion')}`;
  if (stats[2]) stats[2].innerHTML = `⭐ ${t('bonusSpeed')}`;
  
  // 9. Режимы
  const modes = document.querySelectorAll('#screen-home .d-flex.flex-wrap.gap-2 .btn-outline-accent');
  if (modes[0]) modes[0].innerHTML = `💀 ${t('survival')}`;
  if (modes[1]) modes[1].innerHTML = `🤖 ${t('aiMode')}`;
  if (modes[2]) modes[2].innerHTML = `⏱ ${t('timed')}`;
  
  // 10. Категории в select
  const catSelect = document.getElementById('quiz-category');
  if (catSelect) {
    const catTrans = {
      any: t('anyCategory'),
      science: '🔬 ' + t('science'), history: '📜 ' + t('history'),
      geography: '🌍 ' + t('geography'), sport: '⚽ ' + t('sport'),
      cinema: '🎬 ' + t('cinema'), art: '🎨 ' + t('art'),
      music: '🎵 ' + t('music'), it: '💻 ' + t('it'),
      literature: '📚 ' + t('literature'), food: '🍔 ' + t('food'),
      animals: '🐾 ' + t('animals'), space: '🚀 ' + t('space')
    };
    Array.from(catSelect.options).forEach(o => {
      if (catTrans[o.value]) o.textContent = catTrans[o.value];
    });
  }
  
  // 11. Хедер — кнопки
  document.querySelectorAll('.header-actions-collapsible .btn span').forEach(span => {
    const txt = span.textContent.trim();
    if (txt === 'Лидеры' || txt === 'Leaders') span.textContent = t('leaders');
    if (txt === 'Ачивки' || txt === 'Achievements') span.textContent = t('achievements');
    if (txt === 'Статистика' || txt === 'Stats') span.textContent = t('stats');
    if (txt === 'Друзья' || txt === 'Friends') span.textContent = t('friends');
  });
  
  // 12. Кнопка входа
  const authBtn = document.querySelector('#auth-area .btn');
  if (authBtn && typeof currentUser !== 'undefined' && !currentUser) {
    const span = authBtn.querySelector('span');
    if (span) span.textContent = t('login');
    else authBtn.innerHTML = `<i class="bi bi-google me-2"></i>${t('login')}`;
  }
  
  console.log('🌍 Интерфейс обновлён:', currentLocale);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('quizhub-locale') || 'ru';
  
  if (typeof selectedLanguage !== 'undefined') {
    selectedLanguage = saved;
    localStorage.setItem('quizhub-language', saved);
  }
  
  setLocale(saved);
  
  document.querySelectorAll('.btn-locale').forEach(btn => {
    btn.addEventListener('click', function() {
      setLocale(this.dataset.locale);
    });
  });
});