// ============================================
// QuizHub — Ядро переводов v3.0 (модульное)
// ============================================

let currentLocale = localStorage.getItem('quizhub-locale') || 'ru';

// Все переводы собираются в один объект
const translations = {};

// Функция для регистрации переводов из модулей
function registerTranslations(module_ru, module_en) {
    for (const [key, value] of Object.entries(module_ru)) {
        if (!translations.ru) translations.ru = {};
        translations.ru[key] = value;
    }
    for (const [key, value] of Object.entries(module_en)) {
        if (!translations.en) translations.en = {};
        translations.en[key] = value;
    }
}

// Регистрируем все модули
registerTranslations(translations_ru, translations_en);
registerTranslations(achievements_ru, achievements_en);
registerTranslations(leaderboard_ru, leaderboard_en);
registerTranslations(chat_ru, chat_en);
registerTranslations(shop_ru, shop_en);
registerTranslations(friends_ru, friends_en);
registerTranslations(stats_ru, stats_en);
registerTranslations(events_ru, events_en);

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

    // 13. Чат
    const chatHeader = document.querySelector('.chat-header-title');
    if (chatHeader) chatHeader.textContent = t('chatTitle');
    document.querySelectorAll('.chat-tab').forEach(tab => {
        const room = tab.dataset.room;
        const labels = { global: t('chatGlobal'), help: t('chatHelp'), lfg: t('chatLFG') };
        if (labels[room]) tab.textContent = labels[room];
    });
    const chatInput = document.querySelector('.chat-input');
    if (chatInput) chatInput.placeholder = t('chatInput');

    // 14. Футер
    const footer = document.querySelector('.app-footer small');
    if (footer) {
        footer.innerHTML = t('footer_text');
    }

    // 15. Баннер событий
    if (typeof renderEventBanner === 'function') {
        renderEventBanner();
    }

    // 16. Перерендер активных экранов
    if (typeof renderAchievementsScreen === 'function') {
        const ach = document.getElementById('screen-achievements');
        if (ach?.classList.contains('active')) renderAchievementsScreen();
    }
    if (typeof renderStatsScreen === 'function') {
        const st = document.getElementById('screen-stats');
        if (st?.classList.contains('active')) {
            renderStatsScreen();
            setTimeout(() => {
                if (typeof renderScoreChart === 'function') renderScoreChart();
                if (typeof renderWeeklyChart === 'function') renderWeeklyChart();
            }, 300);
        }
    }
    if (typeof renderShop === 'function') {
        const shop = document.getElementById('screen-shop');
        if (shop?.classList.contains('active')) renderShop();
    }
    if (typeof renderFriendsScreen === 'function') {
        const fr = document.getElementById('screen-friends');
        if (fr?.classList.contains('active')) renderFriendsScreen(fr);
    }
    if (typeof loadLeaderboard === 'function') {
        const lb = document.getElementById('screen-leaderboard');
        if (lb?.classList.contains('active')) loadLeaderboard();
    }

    // 17. Команда
    if (typeof renderTeamScreen === 'function') {
        const team = document.getElementById('screen-team');
        if (team?.classList.contains('active')) renderTeamScreen();
    }

    // 18. Турниры
    if (typeof renderTournamentScreen === 'function') {
        const tournament = document.getElementById('screen-tournament');
        if (tournament?.classList.contains('active')) renderTournamentScreen();
    }

    // 19. AI (только если не идёт игра)
    if (typeof showAISelectScreen === 'function') {
        const quizScreen = document.getElementById('screen-quiz');
        if (quizScreen?.classList.contains('active') && 
            typeof quizQuestions !== 'undefined' && 
            (!quizQuestions || quizQuestions.length === 0) &&
            !document.querySelector('#screen-quiz .btn-answer')) {
            showAISelectScreen();
        }
    }

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
        btn.addEventListener('click', function () { setLocale(this.dataset.locale); });
    });
});