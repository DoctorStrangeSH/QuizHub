// ============================================
// QuizHub — Система переводов v3.0
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
    theme: 'Тема',
    team: 'Команда',
    tournaments: 'Турниры',
    shop: 'Магазин',
    friends: 'Друзья',

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
    survival: 'Выживание',
    aiMode: 'vs AI',
    timed: 'На время',
    questionsCount: '10 вопросов',
    timePerQuestion: '15 сек / вопрос',
    bonusSpeed: 'Бонусы за скорость',
    loading: 'Загрузка...',
    home: 'На главную',

    // Категории
    science: 'Наука',
    history: 'История',
    geography: 'География',
    sport: 'Спорт',
    cinema: 'Кино',
    art: 'Искусство',
    music: 'Музыка',
    it: 'IT и технологии',
    literature: 'Литература',
    food: 'Еда',
    animals: 'Животные',
    space: 'Космос',

    // Достижения
    achievementsTitle: 'Достижения',
    unlocked: 'Разблокировано',
    of: 'из',
    playerProgress: 'Прогресс игрока',
    level: 'Ур.',
    quizzes: 'Квизов',
    streak: 'Серия',
    record: 'Рекорд',
    dailyQuests: 'Ежедневные задания',
    weeklyQuests: 'Недельные задания',
    monthlyQuests: 'Месячные задания',
    allAchievements: 'Все достижения',
    achievement_unlocked: 'Достижение разблокировано!',
    max: 'макс.',

    // Названия достижений
    ach_first_blood: 'Первый шаг',
    ach_quiz_5: 'Новичок',
    ach_quiz_10: 'Любитель',
    ach_quiz_25: 'Знаток',
    ach_quiz_50: 'Эксперт',
    ach_quiz_100: 'Легенда',
    ach_score_50: 'Полтинник',
    ach_centurion: 'Центурион',
    ach_score_150: 'Гроссмейстер',
    ach_score_200: 'Невозможное возможно',
    ach_speed_demon: 'Молниеносный',
    ach_speedrun: 'Спидран',
    ach_flash: 'Флэш',
    ach_streak_3: 'Разогрев',
    ach_streak_5: 'В ударе',
    ach_streak_7: 'Машина',
    ach_streak_10: 'Неудержимый',
    ach_perfect_10: 'Перфекционист',
    ach_perfect_5: 'Пять из пяти',
    ach_perfect_10_count: 'Идеальная десятка',
    ach_night_owl: 'Полуночник',
    ach_early_bird: 'Жаворонок',
    ach_afternoon: 'Дневной',
    ach_evening: 'Вечерний',
    ach_hard_mode: 'Хардкор',
    ach_hard_5: 'Хардкорщик',
    ach_hard_10: 'Безумец',
    ach_all_difficulties: 'Универсал',
    ach_polyglot: 'Полиглот',
    ach_english_5: 'Englishman',
    ach_russian_10: 'Русская душа',
    ach_streak_3_days: 'Постоянство',
    ach_streak_7_days: 'Дисциплина',
    ach_streak_14_days: 'Железная воля',
    ach_streak_30_days: 'Месяц без перерыва',
    ach_survivor: 'Выживший',
    ach_survivor_50: 'Охотник',
    ach_timed_10: 'Гонщик',
    ach_duel_1: 'Дуэлянт',
    ach_duel_10: 'Гладиатор',
    ach_all_categories: 'Эрудит',
    ach_science_5: 'Учёный',
    ach_history_5: 'Историк',
    ach_sport_5: 'Атлет',
    ach_first_friend: 'Дружба',
    ach_social_5: 'Компания',
    ach_gift_5: 'Щедрый',
    ach_team_player: 'Командный игрок',
    ach_comeback: 'Камбэк',
    ach_marathon: 'Марафонец',
    ach_lucky: 'Везунчик',

    // Описания достижений
    ach_first_blood_desc: 'Пройти первый квиз',
    ach_quiz_5_desc: 'Пройти 5 квизов',
    ach_quiz_10_desc: 'Пройти 10 квизов',
    ach_quiz_25_desc: 'Пройти 25 квизов',
    ach_quiz_50_desc: 'Пройти 50 квизов',
    ach_quiz_100_desc: 'Пройти 100 квизов',
    ach_score_50_desc: 'Набрать 50+ очков',
    ach_centurion_desc: 'Набрать 100+ очков',
    ach_score_150_desc: 'Набрать 150+ очков',
    ach_score_200_desc: 'Набрать 200+ очков',
    ach_speed_demon_desc: 'Ответить за <3 секунд',
    ach_speedrun_desc: 'Пройти квиз быстрее 60 секунд',
    ach_flash_desc: 'Ответить за <1.5 секунд',
    ach_streak_3_desc: '3 правильных подряд',
    ach_streak_5_desc: '5 правильных подряд',
    ach_streak_7_desc: '7 правильных подряд',
    ach_streak_10_desc: '10 правильных подряд',
    ach_perfect_10_desc: '10/10 правильных',
    ach_perfect_5_desc: '5 идеальных квизов',
    ach_perfect_10_count_desc: '10 идеальных квизов',
    ach_night_owl_desc: 'Пройти квиз с 00:00 до 06:00',
    ach_early_bird_desc: 'Пройти квиз с 06:00 до 10:00',
    ach_afternoon_desc: 'Пройти квиз с 12:00 до 16:00',
    ach_evening_desc: 'Пройти квиз с 18:00 до 22:00',
    ach_hard_mode_desc: 'Пройти квиз на сложном',
    ach_hard_5_desc: '5 сложных квизов',
    ach_hard_10_desc: '10 сложных квизов',
    ach_all_difficulties_desc: 'Пройти на всех сложностях',
    ach_polyglot_desc: 'Пройти на обоих языках',
    ach_english_5_desc: '5 квизов на английском',
    ach_russian_10_desc: '10 квизов на русском',
    ach_streak_3_days_desc: 'Заходить 3 дня подряд',
    ach_streak_7_days_desc: 'Заходить 7 дней подряд',
    ach_streak_14_days_desc: 'Заходить 14 дней подряд',
    ach_streak_30_days_desc: 'Заходить 30 дней подряд',
    ach_survivor_desc: 'Сыграть в режиме выживания',
    ach_survivor_50_desc: '50+ вопросов в выживании',
    ach_timed_10_desc: '10 игр на время',
    ach_duel_1_desc: 'Сыграть дуэль',
    ach_duel_10_desc: '10 дуэлей',
    ach_all_categories_desc: 'Пройти все категории',
    ach_science_5_desc: '5 квизов по науке',
    ach_history_5_desc: '5 квизов по истории',
    ach_sport_5_desc: '5 квизов по спорту',
    ach_first_friend_desc: 'Добавить друга',
    ach_social_5_desc: '5 друзей',
    ach_gift_5_desc: 'Отправить 5 подарков',
    ach_team_player_desc: 'Быть в команде',
    ach_comeback_desc: 'Улучшить результат после неудачи',
    ach_marathon_desc: '5 квизов за день',
    ach_lucky_desc: 'Выиграть дуэль с разницей в 1 очко',

    // Уровни
    lvl_novice: 'Новичок',
    lvl_amateur: 'Любитель',
    lvl_expert: 'Знаток',
    lvl_master: 'Мастер',
    lvl_grandmaster: 'Грандмастер',
    lvl_legend: 'Легенда',
    lvl_myth: 'Миф',

    // Статистика
    statsTitle: 'Статистика',
    yourPath: 'Твой путь к знаниям',
    totalQuizzes: 'Всего квизов',
    bestScore: 'Лучший счёт',
    dayStreak: 'Серия дней',
    avgScore: 'Средний счёт',
    languages: 'Языки',
    fastestAnswer: 'Быстрейший ответ',
    bestStreak: 'Лучшая серия',
    totalXP: 'Всего XP',
    scoreProgress: 'Прогресс по очкам (последние 20 игр)',
    weekActivity: 'Активность по дням',
    details: 'Детали',
    fastestQuiz: 'Быстрейший квиз',
    perfectQuizzes: 'Идеальных квизов',
    points: 'Очки',
    seconds: 'сек',
    correctShort: 'прав.',

    // Дни недели
    monday: 'Пн',
    tuesday: 'Вт',
    wednesday: 'Ср',
    thursday: 'Чт',
    friday: 'Пт',
    saturday: 'Сб',
    sunday: 'Вс',

    // Чат
    chatTitle: 'Чат QuizHub',
    chatGlobal: '🌍 Общий',
    chatHelp: '❓ Помощь',
    chatLFG: '🎮 Поиск игры',
    chatInput: 'Напишите сообщение...',

    // Друзья
    friendsTitle: 'Друзья',
    friendsCount: 'друзей',
    noFriends: 'У вас пока нет друзей',

    // Магазин
    shopTitle: 'Магазин',
    shopBalance: 'Баланс',
    shopApply: 'Применить',
    shopReset: 'Сбросить',

    // Задания
    noActiveQuests: 'Нет активных заданий',
    resetDaily: 'Обновление: 00:00 МСК',
    resetWeekly: 'Обновление: понедельник 00:00 МСК',
    resetMonthly: 'Обновление: 1 число 00:00 МСК',
  },

  en: {
    // Header
    leaders: 'Leaders',
    achievements: 'Achievements',
    stats: 'Stats',
    login: 'Sign In',
    logout: 'Sign Out',
    sound: 'Sound',
    theme: 'Theme',
    team: 'Team',
    tournaments: 'Tournaments',
    shop: 'Shop',
    friends: 'Friends',

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
    survival: 'Survival',
    aiMode: 'vs AI',
    timed: 'Timed',
    questionsCount: '10 questions',
    timePerQuestion: '15 sec / question',
    bonusSpeed: 'Speed bonuses',
    loading: 'Loading...',
    home: 'Home',

    // Categories
    science: 'Science',
    history: 'History',
    geography: 'Geography',
    sport: 'Sport',
    cinema: 'Cinema',
    art: 'Art',
    music: 'Music',
    it: 'IT & Tech',
    literature: 'Literature',
    food: 'Food',
    animals: 'Animals',
    space: 'Space',

    // Achievements
    achievementsTitle: 'Achievements',
    unlocked: 'Unlocked',
    of: 'of',
    playerProgress: 'Player Progress',
    level: 'Lvl.',
    quizzes: 'Quizzes',
    streak: 'Streak',
    record: 'Record',
    dailyQuests: 'Daily Quests',
    weeklyQuests: 'Weekly Quests',
    monthlyQuests: 'Monthly Quests',
    allAchievements: 'All Achievements',
    achievement_unlocked: 'Achievement unlocked!',
    max: 'max',

    // Achievement names
    ach_first_blood: 'First Step',
    ach_quiz_5: 'Newbie',
    ach_quiz_10: 'Amateur',
    ach_quiz_25: 'Scholar',
    ach_quiz_50: 'Expert',
    ach_quiz_100: 'Legend',
    ach_score_50: 'Fifty',
    ach_centurion: 'Centurion',
    ach_score_150: 'Grandmaster',
    ach_score_200: 'Impossible',
    ach_speed_demon: 'Lightning Fast',
    ach_speedrun: 'Speedrun',
    ach_flash: 'Flash',
    ach_streak_3: 'Warm Up',
    ach_streak_5: 'On Fire',
    ach_streak_7: 'Machine',
    ach_streak_10: 'Unstoppable',
    ach_perfect_10: 'Perfectionist',
    ach_perfect_5: 'Five of Five',
    ach_perfect_10_count: 'Perfect Ten',
    ach_night_owl: 'Night Owl',
    ach_early_bird: 'Early Bird',
    ach_afternoon: 'Afternoon',
    ach_evening: 'Evening',
    ach_hard_mode: 'Hardcore',
    ach_hard_5: 'Hardcore Fan',
    ach_hard_10: 'Insane',
    ach_all_difficulties: 'Universal',
    ach_polyglot: 'Polyglot',
    ach_english_5: 'Englishman',
    ach_russian_10: 'Russian Soul',
    ach_streak_3_days: 'Consistency',
    ach_streak_7_days: 'Discipline',
    ach_streak_14_days: 'Iron Will',
    ach_streak_30_days: 'Unbroken',
    ach_survivor: 'Survivor',
    ach_survivor_50: 'Hunter',
    ach_timed_10: 'Racer',
    ach_duel_1: 'Duelist',
    ach_duel_10: 'Gladiator',
    ach_all_categories: 'Erudite',
    ach_science_5: 'Scientist',
    ach_history_5: 'Historian',
    ach_sport_5: 'Athlete',
    ach_first_friend: 'Friendship',
    ach_social_5: 'Company',
    ach_gift_5: 'Generous',
    ach_team_player: 'Team Player',
    ach_comeback: 'Comeback',
    ach_marathon: 'Marathon Runner',
    ach_lucky: 'Lucky',

    // Achievement descriptions
    ach_first_blood_desc: 'Complete your first quiz',
    ach_quiz_5_desc: 'Complete 5 quizzes',
    ach_quiz_10_desc: 'Complete 10 quizzes',
    ach_quiz_25_desc: 'Complete 25 quizzes',
    ach_quiz_50_desc: 'Complete 50 quizzes',
    ach_quiz_100_desc: 'Complete 100 quizzes',
    ach_score_50_desc: 'Score 50+ points',
    ach_centurion_desc: 'Score 100+ points',
    ach_score_150_desc: 'Score 150+ points',
    ach_score_200_desc: 'Score 200+ points',
    ach_speed_demon_desc: 'Answer in <3 seconds',
    ach_speedrun_desc: 'Complete quiz in <60 seconds',
    ach_flash_desc: 'Answer in <1.5 seconds',
    ach_streak_3_desc: '3 correct in a row',
    ach_streak_5_desc: '5 correct in a row',
    ach_streak_7_desc: '7 correct in a row',
    ach_streak_10_desc: '10 correct in a row',
    ach_perfect_10_desc: 'Get 10/10 correct',
    ach_perfect_5_desc: '5 perfect quizzes',
    ach_perfect_10_count_desc: '10 perfect quizzes',
    ach_night_owl_desc: 'Play from 00:00 to 06:00',
    ach_early_bird_desc: 'Play from 06:00 to 10:00',
    ach_afternoon_desc: 'Play from 12:00 to 16:00',
    ach_evening_desc: 'Play from 18:00 to 22:00',
    ach_hard_mode_desc: 'Complete a hard quiz',
    ach_hard_5_desc: '5 hard quizzes',
    ach_hard_10_desc: '10 hard quizzes',
    ach_all_difficulties_desc: 'Play on all difficulties',
    ach_polyglot_desc: 'Play in both languages',
    ach_english_5_desc: '5 quizzes in English',
    ach_russian_10_desc: '10 quizzes in Russian',
    ach_streak_3_days_desc: 'Log in 3 days in a row',
    ach_streak_7_days_desc: 'Log in 7 days in a row',
    ach_streak_14_days_desc: 'Log in 14 days in a row',
    ach_streak_30_days_desc: 'Log in 30 days in a row',
    ach_survivor_desc: 'Play survival mode',
    ach_survivor_50_desc: '50+ questions in survival',
    ach_timed_10_desc: '10 timed games',
    ach_duel_1_desc: 'Play a duel',
    ach_duel_10_desc: '10 duels',
    ach_all_categories_desc: 'Play all categories',
    ach_science_5_desc: '5 science quizzes',
    ach_history_5_desc: '5 history quizzes',
    ach_sport_5_desc: '5 sport quizzes',
    ach_first_friend_desc: 'Add a friend',
    ach_social_5_desc: '5 friends',
    ach_gift_5_desc: 'Send 5 gifts',
    ach_team_player_desc: 'Be in a team',
    ach_comeback_desc: 'Improve after failure',
    ach_marathon_desc: '5 quizzes in a day',
    ach_lucky_desc: 'Win a duel by 1 point',

    // Levels
    lvl_novice: 'Novice',
    lvl_amateur: 'Amateur',
    lvl_expert: 'Expert',
    lvl_master: 'Master',
    lvl_grandmaster: 'Grandmaster',
    lvl_legend: 'Legend',
    lvl_myth: 'Myth',

    // Statistics
    statsTitle: 'Statistics',
    yourPath: 'Your path to knowledge',
    totalQuizzes: 'Total quizzes',
    bestScore: 'Best score',
    dayStreak: 'Day streak',
    avgScore: 'Average score',
    languages: 'Languages',
    fastestAnswer: 'Fastest answer',
    bestStreak: 'Best streak',
    totalXP: 'Total XP',
    scoreProgress: 'Score progress (last 20 games)',
    weekActivity: 'Weekly activity',
    details: 'Details',
    fastestQuiz: 'Fastest quiz',
    perfectQuizzes: 'Perfect quizzes',
    points: 'Points',
    seconds: 'sec',
    correctShort: 'corr.',

    // Days
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',

    // Chat
    chatTitle: 'QuizHub Chat',
    chatGlobal: '🌍 Global',
    chatHelp: '❓ Help',
    chatLFG: '🎮 Find Game',
    chatInput: 'Type a message...',

    // Friends
    friendsTitle: 'Friends',
    friendsCount: 'friends',
    noFriends: 'No friends yet',

    // Shop
    shopTitle: 'Shop',
    shopBalance: 'Balance',
    shopApply: 'Apply',
    shopReset: 'Reset',

    // Quests
    noActiveQuests: 'No active quests',
    resetDaily: 'Reset: 00:00 MSK',
    resetWeekly: 'Reset: Monday 00:00 MSK',
    resetMonthly: 'Reset: 1st day 00:00 MSK',
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
  // 1. data-i18n элементы
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = text;
    else if (el.tagName === 'OPTION') el.textContent = text;
    else if (el.querySelector('i') && el.childNodes.length > 1) {
      const span = el.querySelector('span');
      if (span) span.textContent = text;
    } else el.textContent = text;
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

  // 8. Статистика
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
      any: t('anyCategory'), science: '🔬 ' + t('science'), history: '📜 ' + t('history'),
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

  // 11. Хедер
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

  // 13. Перерендер активных экранов
  if (typeof renderAchievementsScreen === 'function') {
    const s = document.getElementById('screen-achievements');
    if (s?.classList.contains('active')) renderAchievementsScreen();
  }
  if (typeof renderStatsScreen === 'function') {
    const s = document.getElementById('screen-stats');
    if (s?.classList.contains('active')) renderStatsScreen();
  }
  if (typeof renderFriendsScreen === 'function') {
    const s = document.getElementById('screen-friends');
    if (s?.classList.contains('active')) renderFriendsScreen(s);
  }
  if (typeof renderShop === 'function') {
    const s = document.getElementById('screen-shop');
    if (s?.classList.contains('active')) renderShop();
  }

  // 14. Чат
  const chatHeader = document.querySelector('.chat-header-title');
  if (chatHeader) chatHeader.textContent = t('chatTitle');
  document.querySelectorAll('.chat-tab').forEach(tab => {
    const room = tab.dataset.room;
    const labels = { global: t('chatGlobal'), help: t('chatHelp'), lfg: t('chatLFG') };
    if (labels[room]) tab.textContent = labels[room];
  });
  const chatInput = document.querySelector('.chat-input');
  if (chatInput) chatInput.placeholder = t('chatInput');

  console.log('🌍 Интерфейс обновлён:', currentLocale);
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('quizhub-locale') || 'ru';
  if (typeof selectedLanguage !== 'undefined') {
    selectedLanguage = saved;
    localStorage.setItem('quizhub-language', saved);
  }
  setLocale(saved);
  document.querySelectorAll('.btn-locale').forEach(btn => {
    btn.addEventListener('click', function() { setLocale(this.dataset.locale); });
  });
});