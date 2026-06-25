// ============================================
// QuizHub — Система переводов (i18n) v2.1
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
    team: 'Команда',
    tournaments: 'Турниры',
    shop: 'Магазин',
    heroTitle: 'Проверь свои',
    heroSubtitle: 'знания',
    heroDesc: 'Выбери категорию, пройди квиз и займи место в таблице лидеров!',
    yourName: 'Твоё имя',
    category: 'Категория',
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
    friends: 'Друзья',
    loading: 'Загрузка...',
  },
  en: {
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
    heroTitle: 'Test your',
    heroSubtitle: 'knowledge',
    heroDesc: 'Choose a category, take a quiz and get to the leaderboard!',
    yourName: 'Your name',
    category: 'Category',
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
    friends: 'Friends',
    loading: 'Loading...',
  }
};

function t(key) {
  return translations[currentLocale]?.[key] || translations['ru']?.[key] || key;
}

function setLocale(locale) {
  currentLocale = locale;
  localStorage.setItem('quizhub-locale', locale);
  
  // Обновляем глобальную переменную selectedLanguage
  if (typeof selectedLanguage !== 'undefined') {
    selectedLanguage = locale;
    localStorage.setItem('quizhub-language', locale);
  }
  
  // Обновляем кнопки
  document.querySelectorAll('.btn-locale').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.locale === locale);
  });
  
  // Обновляем весь текст на странице
  updateAllTranslations();
  
  console.log('🌍 Язык:', locale, '| selectedLanguage:', typeof selectedLanguage !== 'undefined' ? selectedLanguage : 'нет');
}

function updateAllTranslations() {
  // Проходим по всем элементам с data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = t(key);
    
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
    } else if (el.tagName === 'BUTTON' || el.tagName === 'SPAN' || el.tagName === 'P' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'LABEL' || el.tagName === 'SMALL' || el.tagName === 'OPTION') {
      // Для кнопок с иконками — не затираем иконку
      if (el.querySelector('i') && el.childNodes.length > 1) {
        // Находим текстовый узел и обновляем его
        for (const node of el.childNodes) {
          if (node.nodeType === 3 && node.textContent.trim()) {
            node.textContent = ' ' + text;
            break;
          }
        }
        // Или обновляем span внутри
        const span = el.querySelector('span');
        if (span) span.textContent = text;
      } else {
        el.textContent = text;
      }
    }
  });
  
  // Обновляем кнопки сложности
  const diffLabels = { easy: t('easy'), medium: t('medium'), hard: t('hard') };
  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    const diff = btn.dataset.difficulty;
    if (diff && diffLabels[diff]) {
      btn.textContent = diffLabels[diff];
    }
  });
  
  // Обновляем главный заголовок
  const heroTitle = document.querySelector('#screen-home h1');
  if (heroTitle) {
    heroTitle.innerHTML = `${t('heroTitle')} <span class="text-accent">${t('heroSubtitle')}</span>`;
  }
  
  // Обновляем описание
  const heroDesc = document.querySelector('#screen-home .lead');
  if (heroDesc) {
    heroDesc.textContent = t('heroDesc');
  }
  
  // Обновляем кнопку старта
  const startBtn = document.getElementById('start-quiz');
  if (startBtn) {
    startBtn.innerHTML = `<i class="bi bi-play-fill me-2"></i>${t('startQuiz')}`;
  }
  
  // Обновляем мини-статистику
  const statsSpans = document.querySelectorAll('#screen-home .d-flex.justify-content-center.gap-4 span');
  if (statsSpans.length >= 3) {
    statsSpans[0].innerHTML = `📝 ${t('questionsCount')}`;
    statsSpans[1].innerHTML = `⏰ ${t('timePerQuestion')}`;
    statsSpans[2].innerHTML = `⭐ ${t('bonusSpeed')}`;
  }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  const savedLocale = localStorage.getItem('quizhub-locale') || 'ru';
  
  // Синхронизируем selectedLanguage
  if (typeof selectedLanguage !== 'undefined') {
    selectedLanguage = savedLocale;
    localStorage.setItem('quizhub-language', savedLocale);
  }
  
  // Применяем локаль
  setLocale(savedLocale);
  
  // Настраиваем кнопки
  document.querySelectorAll('.btn-locale').forEach(btn => {
    btn.addEventListener('click', function() {
      setLocale(this.dataset.locale);
    });
  });
});