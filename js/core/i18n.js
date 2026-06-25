// ============================================
// QuizHub — Система переводов v2.5
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
    achievementsTitle: 'Достижения', statsTitle: 'Статистика',
    unlocked: 'Разблокировано', of: 'из',
    playerProgress: 'Прогресс игрока', level: 'Ур.',
    quizzes: 'Квизов', streak: 'Серия', record: 'Рекорд',
    dailyQuests: 'Ежедневные задания', weeklyQuests: 'Недельные задания', monthlyQuests: 'Месячные задания',
    allAchievements: 'Все достижения',
    chatTitle: 'Чат QuizHub', chatGlobal: '🌍 Общий', chatHelp: '❓ Помощь', chatLFG: '🎮 Поиск игры',
    chatInput: 'Напишите сообщение...',
    friendsTitle: 'Друзья', friendsCount: 'друзей', noFriends: 'У вас пока нет друзей',
    shopTitle: 'Магазин', shopBalance: 'Баланс', shopApply: 'Применить', shopReset: 'Сбросить',
    totalQuizzes: 'Всего квизов', bestScore: 'Лучший счёт', dayStreak: 'Серия дней',
    avgScore: 'Средний счёт', languages: 'Языки', fastestAnswer: 'Быстрейший ответ',
    bestStreak: 'Лучшая серия', totalXP: 'Всего XP',
    scoreProgress: 'Прогресс по очкам (последние 20 игр)', weekActivity: 'Активность по дням',
    details: 'Детали', yourPath: 'Твой путь к знаниям',
    resetDaily: 'Обновление: 00:00 МСК', resetWeekly: 'Обновление: понедельник 00:00 МСК', resetMonthly: 'Обновление: 1 число 00:00 МСК',
    noActiveQuests: 'Нет активных заданий', home: 'На главную',
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
    achievementsTitle: 'Achievements', statsTitle: 'Statistics',
    unlocked: 'Unlocked', of: 'of',
    playerProgress: 'Player Progress', level: 'Lvl.',
    quizzes: 'Quizzes', streak: 'Streak', record: 'Record',
    dailyQuests: 'Daily Quests', weeklyQuests: 'Weekly Quests', monthlyQuests: 'Monthly Quests',
    allAchievements: 'All Achievements',
    chatTitle: 'QuizHub Chat', chatGlobal: '🌍 Global', chatHelp: '❓ Help', chatLFG: '🎮 Find Game',
    chatInput: 'Type a message...',
    friendsTitle: 'Friends', friendsCount: 'friends', noFriends: 'No friends yet',
    shopTitle: 'Shop', shopBalance: 'Balance', shopApply: 'Apply', shopReset: 'Reset',
    totalQuizzes: 'Total quizzes', bestScore: 'Best score', dayStreak: 'Day streak',
    avgScore: 'Average score', languages: 'Languages', fastestAnswer: 'Fastest answer',
    bestStreak: 'Best streak', totalXP: 'Total XP',
    scoreProgress: 'Score progress (last 20 games)', weekActivity: 'Weekly activity',
    details: 'Details', yourPath: 'Your path to knowledge',
    resetDaily: 'Reset: 00:00 MSK', resetWeekly: 'Reset: Monday 00:00 MSK', resetMonthly: 'Reset: 1st day 00:00 MSK',
    noActiveQuests: 'No active quests', home: 'Home',
  }
};

function t(key) { return translations[currentLocale]?.[key] || translations['ru']?.[key] || key; }

function setLocale(locale) {
  currentLocale = locale; localStorage.setItem('quizhub-locale', locale);
  if (typeof selectedLanguage !== 'undefined') { selectedLanguage = locale; localStorage.setItem('quizhub-language', locale); }
  document.querySelectorAll('.btn-locale').forEach(btn => btn.classList.toggle('active', btn.dataset.locale === locale));
  updateAllTranslations();
}

function updateAllTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.dataset.i18n; const text = t(key); if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = text; else if (el.tagName === 'OPTION') el.textContent = text; else if (el.querySelector('i') && el.childNodes.length > 1) { const span = el.querySelector('span'); if (span) span.textContent = text; } else el.textContent = text; });
  const h1 = document.querySelector('#screen-home h1'); if (h1) h1.innerHTML = `${t('heroTitle')} <span class="text-accent">${t('heroSubtitle')}</span>`;
  const lead = document.querySelector('#screen-home .lead'); if (lead) lead.textContent = t('heroDesc');
  const startBtn = document.getElementById('start-quiz'); if (startBtn) startBtn.innerHTML = `<i class="bi bi-play-fill me-2"></i>${t('startQuiz')}`;
  const nameInput = document.getElementById('player-name'); if (nameInput) nameInput.placeholder = t('namePlaceholder');
  const labels = document.querySelectorAll('#screen-home .form-label'); if (labels[0]) labels[0].innerHTML = `<i class="bi bi-person me-1 text-accent"></i>${t('yourName')}`; if (labels[1]) labels[1].innerHTML = `<i class="bi bi-grid me-1 text-accent"></i>${t('category')}`; if (labels[2]) labels[2].innerHTML = `<i class="bi bi-speedometer2 me-1 text-accent"></i>${t('difficulty')}`;
  const diffLabels = { easy: t('easy'), medium: t('medium'), hard: t('hard') }; document.querySelectorAll('.btn-difficulty').forEach(btn => { const d = btn.dataset.difficulty; if (d && diffLabels[d]) btn.textContent = diffLabels[d]; });
  const stats = document.querySelectorAll('#screen-home .d-flex.gap-4 span'); if (stats[0]) stats[0].innerHTML = `📝 ${t('questionsCount')}`; if (stats[1]) stats[1].innerHTML = `⏰ ${t('timePerQuestion')}`; if (stats[2]) stats[2].innerHTML = `⭐ ${t('bonusSpeed')}`;
  const modes = document.querySelectorAll('#screen-home .d-flex.flex-wrap.gap-2 .btn-outline-accent'); if (modes[0]) modes[0].innerHTML = `💀 ${t('survival')}`; if (modes[1]) modes[1].innerHTML = `🤖 ${t('aiMode')}`; if (modes[2]) modes[2].innerHTML = `⏱ ${t('timed')}`;
  const catSelect = document.getElementById('quiz-category'); if (catSelect) { const catTrans = { any: t('anyCategory'), science: '🔬 '+t('science'), history: '📜 '+t('history'), geography: '🌍 '+t('geography'), sport: '⚽ '+t('sport'), cinema: '🎬 '+t('cinema'), art: '🎨 '+t('art'), music: '🎵 '+t('music'), it: '💻 '+t('it'), literature: '📚 '+t('literature'), food: '🍔 '+t('food'), animals: '🐾 '+t('animals'), space: '🚀 '+t('space') }; Array.from(catSelect.options).forEach(o => { if (catTrans[o.value]) o.textContent = catTrans[o.value]; }); }
  document.querySelectorAll('.header-actions-collapsible .btn span').forEach(span => { const txt = span.textContent.trim(); if (txt === 'Лидеры' || txt === 'Leaders') span.textContent = t('leaders'); if (txt === 'Ачивки' || txt === 'Achievements') span.textContent = t('achievements'); if (txt === 'Статистика' || txt === 'Stats') span.textContent = t('stats'); if (txt === 'Друзья' || txt === 'Friends') span.textContent = t('friends'); });
  const authBtn = document.querySelector('#auth-area .btn'); if (authBtn && typeof currentUser !== 'undefined' && !currentUser) { const span = authBtn.querySelector('span'); if (span) span.textContent = t('login'); else authBtn.innerHTML = `<i class="bi bi-google me-2"></i>${t('login')}`; }
  if (typeof renderAchievementsScreen === 'function') { const s = document.getElementById('screen-achievements'); if (s?.classList.contains('active')) renderAchievementsScreen(); }
  if (typeof renderStatsScreen === 'function') { const s = document.getElementById('screen-stats'); if (s?.classList.contains('active')) renderStatsScreen(); }
  if (typeof renderFriendsScreen === 'function') { const s = document.getElementById('screen-friends'); if (s?.classList.contains('active')) renderFriendsScreen(s); }
  if (typeof renderShop === 'function') { const s = document.getElementById('screen-shop'); if (s?.classList.contains('active')) renderShop(); }
  const chatHeader = document.querySelector('.chat-header-title'); if (chatHeader) chatHeader.textContent = t('chatTitle');
  document.querySelectorAll('.chat-tab').forEach(tab => { const room = tab.dataset.room; const labels = { global: t('chatGlobal'), help: t('chatHelp'), lfg: t('chatLFG') }; if (labels[room]) tab.textContent = labels[room]; });
  const chatInput = document.querySelector('.chat-input'); if (chatInput) chatInput.placeholder = t('chatInput');
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('quizhub-locale') || 'ru';
  if (typeof selectedLanguage !== 'undefined') { selectedLanguage = saved; localStorage.setItem('quizhub-language', saved); }
  setLocale(saved);
  document.querySelectorAll('.btn-locale').forEach(btn => btn.addEventListener('click', function() { setLocale(this.dataset.locale); }));
});