// ============================================
// QuizHub — Система переводов (i18n) v2.0
// ============================================

let currentLocale = localStorage.getItem('quizhub-locale') || 'ru';

const translations = {
  ru: {
    leaders: 'Лидеры',
    achievements: 'Ачивки',
    stats: 'Статистика',
    login: 'Войти',
    logout: 'Выйти',
    sound: 'Звук',
    theme: 'Переключить тему',
    install: 'Установить',
    team: 'Команда',
    tournaments: 'Турниры',
    shop: 'Магазин',
    heroTitle: 'Проверь свои',
    heroSubtitle: 'знания',
    heroDesc: 'Выбери категорию, пройди квиз и займи место в таблице лидеров!',
    yourName: 'Твоё имя',
    namePlaceholder: 'Владислав',
    category: 'Категория',
    anyCategory: 'Любая категория',
    difficulty: 'Сложность',
    easy: '🟢 Легко',
    medium: '🟡 Средне',
    hard: '🔴 Сложно',
    startQuiz: 'НАЧАТЬ КВИЗ',
    duel: 'Дуэль',
    joinCode: 'Код',
    timed: 'На время',
    questionsCount: '10 вопросов',
    timePerQuestion: '15 сек / вопрос',
    bonusSpeed: 'Бонусы за скорость',
    search: 'Поиск по вопросам',
    searchPlaceholder: 'Например: космос, Пушкин, футбол...',
    question: 'Вопрос',
    of: 'из',
    points: 'очков',
    skip: 'Пропустить',
    loadingQuestions: 'Загружаем вопросы...',
    legend: 'Легенда!',
    excellent: 'Отлично!',
    notBad: 'Неплохо!',
    tryAgain: 'Попробуй ещё!',
    amazingResult: 'Потрясающий результат,',
    trueExpert: 'Ты настоящий знаток,',
    goodTry: 'Хорошая попытка,',
    dontWorry: 'Не расстраивайся,',
    scoreLabel: 'Очков',
    correctLabel: 'Правильно',
    timeLabel: 'Время',
    playAgain: 'Пройти ещё раз',
    home: 'На главную',
    leaderboard: 'Таблица лидеров',
    leaderboardTitle: 'Таблица лидеров',
    bestOfBest: 'Лучшие из лучших',
    nobodyHere: 'Пока никого нет',
    beFirst: 'Стань первым в таблице лидеров!',
    achievementsTitle: 'Мои достижения',
    unlocked: 'Разблокировано',
    playerProgress: 'Прогресс игрока',
    quizzes: 'Квизов',
    streak: 'Серия',
    record: 'Рекорд',
    dailyQuests: 'Ежедневные задания',
    allAchievements: 'Все достижения',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    cancel: 'Отмена',
    close: 'Закрыть',
    survival: 'Выживание',
    friends: 'Друзья',
  },
  
  en: {
    leaders: 'Leaders',
    achievements: 'Achievements',
    stats: 'Statistics',
    login: 'Sign In',
    logout: 'Sign Out',
    sound: 'Sound',
    theme: 'Toggle theme',
    install: 'Install',
    team: 'Team',
    tournaments: 'Tournaments',
    shop: 'Shop',
    heroTitle: 'Test your',
    heroSubtitle: 'knowledge',
    heroDesc: 'Choose a category, take a quiz and get to the leaderboard!',
    yourName: 'Your name',
    namePlaceholder: 'John',
    category: 'Category',
    anyCategory: 'Any category',
    difficulty: 'Difficulty',
    easy: '🟢 Easy',
    medium: '🟡 Medium',
    hard: '🔴 Hard',
    startQuiz: 'START QUIZ',
    duel: 'Duel',
    joinCode: 'Code',
    timed: 'Timed',
    questionsCount: '10 questions',
    timePerQuestion: '15 sec / question',
    bonusSpeed: 'Speed bonuses',
    search: 'Search questions',
    searchPlaceholder: 'e.g. space, Shakespeare, football...',
    question: 'Question',
    of: 'of',
    points: 'points',
    skip: 'Skip',
    loadingQuestions: 'Loading questions...',
    legend: 'Legend!',
    excellent: 'Excellent!',
    notBad: 'Not bad!',
    tryAgain: 'Try again!',
    amazingResult: 'Amazing result,',
    trueExpert: 'You are a true expert,',
    goodTry: 'Good try,',
    dontWorry: 'Don\'t worry,',
    scoreLabel: 'Score',
    correctLabel: 'Correct',
    timeLabel: 'Time',
    playAgain: 'Play again',
    home: 'Home',
    leaderboard: 'Leaderboard',
    leaderboardTitle: 'Leaderboard',
    bestOfBest: 'Best of the best',
    nobodyHere: 'Nobody here yet',
    beFirst: 'Be the first on the leaderboard!',
    achievementsTitle: 'My Achievements',
    unlocked: 'Unlocked',
    playerProgress: 'Player Progress',
    quizzes: 'Quizzes',
    streak: 'Streak',
    record: 'Record',
    dailyQuests: 'Daily Quests',
    allAchievements: 'All Achievements',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    close: 'Close',
    survival: 'Survival',
    friends: 'Friends',
  }
};

// ========== ФУНКЦИИ ПЕРЕВОДА ==========

function t(key) {
  const locale = currentLocale;
  return translations[locale]?.[key] || translations['ru']?.[key] || key;
}

function setLocale(locale) {
  currentLocale = locale;
  localStorage.setItem('quizhub-locale', locale);
  
  // Обновляем selectedLanguage для квиза
  if (typeof selectedLanguage !== 'undefined') {
    selectedLanguage = locale;
    localStorage.setItem('quizhub-language', locale);
  }
  
  // Обновляем кнопки языка
  document.querySelectorAll('.btn-locale').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.locale === locale);
  });
  
  // Обновляем весь интерфейс
  updateAllTranslations();
  
  console.log('🌍 Язык изменён на:', locale, '| selectedLanguage:', typeof selectedLanguage !== 'undefined' ? selectedLanguage : 'не определена');
}

function updateAllTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const translated = t(key);
    
    if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
      el.placeholder = translated;
    } else {
      el.textContent = translated;
    }
  });
  
  // Обновляем активный экран если нужно
  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen?.id === 'screen-achievements' && typeof renderAchievementsScreen === 'function') {
    renderAchievementsScreen();
  }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  const savedLocale = localStorage.getItem('quizhub-locale') || 'ru';
  setLocale(savedLocale);
  
  // Синхронизируем selectedLanguage
  if (typeof selectedLanguage !== 'undefined') {
    selectedLanguage = savedLocale;
  }
  
  // Настраиваем кнопки языка
  document.querySelectorAll('.btn-locale').forEach(btn => {
    btn.addEventListener('click', function() {
      const locale = this.dataset.locale;
      setLocale(locale);
    });
  });
});