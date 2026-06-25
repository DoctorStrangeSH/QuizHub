// ============================================
// QuizHub — Система переводов (i18n)
// ============================================

let currentLocale = localStorage.getItem('quizhub-locale') || 'ru';

const translations = {
  ru: {
    // Хедер
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
    
    // Главный экран
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
    
    // Квиз
    question: 'Вопрос',
    of: 'из',
    points: 'очков',
    skip: 'Пропустить',
    loadingQuestions: 'Загружаем вопросы...',
    
    // Результат
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
    
    // Лидеры
    leaderboardTitle: 'Таблица лидеров',
    bestOfBest: 'Лучшие из лучших',
    nobodyHere: 'Пока никого нет',
    beFirst: 'Стань первым в таблице лидеров!',
    
    // Ачивки
    achievementsTitle: 'Мои достижения',
    unlocked: 'Разблокировано',
    playerProgress: 'Прогресс игрока',
    quizzes: 'Квизов',
    streak: 'Серия',
    record: 'Рекорд',
    dailyQuests: 'Ежедневные задания',
    allAchievements: 'Все достижения',
    loadingAchievements: 'Загрузка достижений...',
    
    // Статистика
    statsTitle: 'Моя статистика',
    yourPath: 'Твой путь к знаниям',
    totalQuizzes: 'Всего квизов',
    bestScore: 'Лучший счёт',
    dayStreak: 'Серия дней',
    avgScore: 'Средний счёт',
    languages: 'Языки',
    fastestAnswer: 'Быстрейший ответ',
    bestStreak: 'Лучшая серия',
    totalXP: 'Всего XP',
    level: 'Уровень',
    
    // Турниры
    tournamentTitle: 'Турниры',
    daily: 'Ежедневный',
    weekly: 'Еженедельный',
    blitz: 'Блиц-турнир',
    participate: 'Участвовать',
    free: 'Бесплатно',
    fee: 'Взнос',
    
    // Магазин
    shopTitle: 'Магазин',
    balance: 'Твой баланс',
    purchased: 'Куплено',
    
    // Выживание
    survival: 'Выживание',
    lives: 'Жизни',
    
    // Общее
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    cancel: 'Отмена',
    save: 'Сохранить',
    delete: 'Удалить',
    edit: 'Редактировать',
    close: 'Закрыть',
  },
  
  en: {
    // Header
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
    
    // Main screen
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
    
    // Quiz
    question: 'Question',
    of: 'of',
    points: 'points',
    skip: 'Skip',
    loadingQuestions: 'Loading questions...',
    
    // Result
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
    
    // Leaders
    leaderboardTitle: 'Leaderboard',
    bestOfBest: 'Best of the best',
    nobodyHere: 'Nobody here yet',
    beFirst: 'Be the first on the leaderboard!',
    
    // Achievements
    achievementsTitle: 'My Achievements',
    unlocked: 'Unlocked',
    playerProgress: 'Player Progress',
    quizzes: 'Quizzes',
    streak: 'Streak',
    record: 'Record',
    dailyQuests: 'Daily Quests',
    allAchievements: 'All Achievements',
    loadingAchievements: 'Loading achievements...',
    
    // Statistics
    statsTitle: 'My Statistics',
    yourPath: 'Your path to knowledge',
    totalQuizzes: 'Total quizzes',
    bestScore: 'Best score',
    dayStreak: 'Day streak',
    avgScore: 'Average score',
    languages: 'Languages',
    fastestAnswer: 'Fastest answer',
    bestStreak: 'Best streak',
    totalXP: 'Total XP',
    level: 'Level',
    
    // Tournaments
    tournamentTitle: 'Tournaments',
    daily: 'Daily',
    weekly: 'Weekly',
    blitz: 'Blitz',
    participate: 'Join',
    free: 'Free',
    fee: 'Entry fee',
    
    // Shop
    shopTitle: 'Shop',
    balance: 'Your balance',
    purchased: 'Purchased',
    
    // Survival
    survival: 'Survival',
    lives: 'Lives',
    
    // General
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
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
  
  // Обновляем весь интерфейс
  updateAllTranslations();
  
  // Обновляем кнопки языка
  document.querySelectorAll('.btn-locale').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.locale === locale);
  });
}

function updateAllTranslations() {
  // Обновляем все элементы с data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const translated = t(key);
    
    if (el.tagName === 'INPUT' && el.type === 'text') {
      el.placeholder = translated;
    } else if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
      // Не меняем value для input/select
    } else {
      el.textContent = translated;
    }
  });
  
  // Обновляем текущий экран
  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen) {
    const screenId = activeScreen.id;
    if (screenId === 'screen-achievements' && typeof renderAchievementsScreen === 'function') {
      renderAchievementsScreen();
    }
  }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  // Загружаем сохранённую локаль
  const savedLocale = localStorage.getItem('quizhub-locale') || 'ru';
  setLocale(savedLocale);
  
  // Синхронизируем selectedLanguage
  if (typeof selectedLanguage !== 'undefined') {
    selectedLanguage = savedLocale;
  }
  
  // Настраиваем кнопки языка
  document.querySelectorAll('.btn-locale').forEach(btn => {
    btn.addEventListener('click', function() {
      setLocale(this.dataset.locale);
    });
  });
});