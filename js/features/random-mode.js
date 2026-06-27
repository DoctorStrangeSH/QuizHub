// ============================================
// QuizHub — Случайный режим v1.0
// ============================================

const RANDOM_MODE_BONUSES = {
    coins: { min: 1.2, max: 2.5 },
    xp: { min: 1.2, max: 2.5 },
};

function getRandomBonus() {
    const coinMultiplier = (Math.random() * (RANDOM_MODE_BONUSES.coins.max - RANDOM_MODE_BONUSES.coins.min) + RANDOM_MODE_BONUSES.coins.min).toFixed(1);
    const xpMultiplier = (Math.random() * (RANDOM_MODE_BONUSES.xp.max - RANDOM_MODE_BONUSES.xp.min) + RANDOM_MODE_BONUSES.xp.min).toFixed(1);
    return {
        coins: parseFloat(coinMultiplier),
        xp: parseFloat(xpMultiplier),
    };
}

function getRandomCategory() {
    const categories = ['any', 'science', 'history', 'geography', 'sport', 'cinema', 'art', 'music', 'it', 'literature', 'food', 'animals', 'space'];
    return categories[Math.floor(Math.random() * categories.length)];
}

function getRandomDifficulty() {
    const difficulties = ['easy', 'medium', 'hard'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
}

let randomModeBonus = null;

async function startRandomMode() {
    const nameInput = document.getElementById('player-name');
    if (!nameInput?.value?.trim()) {
        nameInput?.focus();
        showToast('Введи своё имя!', 'warning');
        return;
    }

    // Генерируем случайные параметры
    const category = getRandomCategory();
    const difficulty = getRandomDifficulty();
    randomModeBonus = getRandomBonus();

    // Устанавливаем в AppState
    AppState.set('settings.category', category);
    AppState.set('settings.difficulty', difficulty);

    // Обновляем UI
    const catSelect = document.getElementById('quiz-category');
    if (catSelect) catSelect.value = category;

    document.querySelectorAll('.btn-difficulty').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });

    // Показываем баннер с информацией
    showRandomModeBanner(category, difficulty);

    // Запускаем квиз
    await startQuiz();

    // Применяем бонусы к наградам
    if (randomModeBonus && typeof currentUser !== 'undefined' && currentUser) {
        applyRandomModeBonus();
    }
}

function showRandomModeBanner(category, difficulty) {
    const catName = typeof getCategoryName === 'function' ? getCategoryName(category) : category;
    const diffName = typeof getDifficultyLabel === 'function' ? getDifficultyLabel(difficulty) : difficulty;

    const container = document.getElementById('event-banner-container');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = `
        <div class="random-mode-banner" style="--event-color: #FF6B9D;">
            <div class="event-banner-icon">🎲</div>
            <div class="event-banner-info">
                <div class="event-banner-title">${typeof t === 'function' ? t('randomMode') || 'Случайный режим' : 'Случайный режим'}</div>
                <div class="event-banner-desc">
                    ${catName} • ${diffName}
                </div>
                <div class="event-banner-bonuses">
                    <span class="event-bonus">🪙 x${randomModeBonus.coins}</span>
                    <span class="event-bonus">⚡ x${randomModeBonus.xp} XP</span>
                </div>
            </div>
            <div class="event-banner-arrow">🎯</div>
        </div>
    `;

    // Скрываем баннер через 5 секунд
    setTimeout(() => {
        if (container.querySelector('.random-mode-banner')) {
            container.style.display = 'none';
            if (typeof renderEventBanner === 'function') renderEventBanner();
        }
    }, 5000);
}

function applyRandomModeBonus() {
    if (!randomModeBonus) return;

    // Бонусные монеты
    const bonusCoins = Math.floor((randomModeBonus.coins - 1) * 20);
    if (bonusCoins > 0 && typeof addCoins === 'function') {
        addCoins(bonusCoins);
        showToast(`🎲 Случайный бонус: +${bonusCoins} 🪙`, 'success');
    }

    // Бонусный XP
    const bonusXP = Math.floor((randomModeBonus.xp - 1) * 30);
    if (bonusXP > 0 && typeof addXP === 'function') {
        addXP(bonusXP);
        showToast(`🎲 Случайный бонус: +${bonusXP} XP`, 'success');
    }

    randomModeBonus = null;
}

// Добавляем кнопку на главный экран
function injectRandomModeButton() {
    const modesContainer = document.querySelector('#screen-home .d-flex.flex-wrap.gap-2');
    if (!modesContainer) return;

    // Проверяем, нет ли уже кнопки
    if (document.getElementById('random-mode-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'random-mode-btn';
    btn.className = 'btn btn-outline-accent rounded-pill px-4';
    btn.onclick = startRandomMode;
    btn.innerHTML = `🎲 <span data-i18n="randomMode">${typeof t === 'function' ? t('randomMode') || 'Случайный' : 'Случайный'}</span>`;

    modesContainer.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(injectRandomModeButton, 300);

    // Обновляем кнопку при смене языка
    EventBus.on(EVENTS.LOCALE_CHANGED, () => {
        const btn = document.getElementById('random-mode-btn');
        if (btn) {
            btn.innerHTML = `🎲 <span data-i18n="randomMode">${typeof t === 'function' ? t('randomMode') || 'Случайный' : 'Случайный'}</span>`;
        }
    });
});