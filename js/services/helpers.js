// ============================================
// QuizHub — Общие хелперы
// ============================================

// Форматирование времени
function formatTime(seconds) {
    if (typeof seconds !== 'number' || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Перемешивание массива
function shuffleArray(array) {
    if (!Array.isArray(array)) return [];
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Метка сложности
function getDifficultyLabel(difficulty) {
    const labels = {
        easy: typeof t === 'function' ? t('easy') : 'Легко',
        medium: typeof t === 'function' ? t('medium') : 'Средне',
        hard: typeof t === 'function' ? t('hard') : 'Сложно'
    };
    return labels[difficulty] || difficulty;
}

// Оценка результата
function getGrade(score) {
    if (score >= 90) return { title: typeof t === 'function' ? t('legend') || 'Легенда!' : 'Легенда!', message: 'Потрясающий результат,', icon: 'trophy-fill', color: 'grade-gold' };
    if (score >= 70) return { title: typeof t === 'function' ? t('excellent') || 'Отлично!' : 'Отлично!', message: 'Ты настоящий знаток,', icon: 'star-fill', color: 'grade-silver' };
    if (score >= 50) return { title: typeof t === 'function' ? t('notBad') || 'Неплохо!' : 'Неплохо!', message: 'Хорошая попытка,', icon: 'hand-thumbs-up-fill', color: 'grade-bronze' };
    return { title: typeof t === 'function' ? t('tryAgain') || 'Попробуй ещё!' : 'Попробуй ещё!', message: 'Не расстраивайся,', icon: 'emoji-smile-fill', color: 'grade-default' };
}

// Имя категории
function getCategoryName(categoryKey) {
    const names = {
        'any': '📋 ' + (typeof t === 'function' ? t('anyCategory') || 'Общие знания' : 'Общие знания'),
        'science': '🔬 ' + (typeof t === 'function' ? t('science') : 'Наука'),
        'history': '📜 ' + (typeof t === 'function' ? t('history') : 'История'),
        'geography': '🌍 ' + (typeof t === 'function' ? t('geography') : 'География'),
        'sport': '⚽ ' + (typeof t === 'function' ? t('sport') : 'Спорт'),
        'cinema': '🎬 ' + (typeof t === 'function' ? t('cinema') : 'Кино'),
        'art': '🎨 ' + (typeof t === 'function' ? t('art') : 'Искусство'),
        'music': '🎵 ' + (typeof t === 'function' ? t('music') : 'Музыка'),
        'it': '💻 ' + (typeof t === 'function' ? t('it') : 'IT и технологии'),
        'literature': '📚 ' + (typeof t === 'function' ? t('literature') : 'Литература'),
        'food': '🍔 ' + (typeof t === 'function' ? t('food') : 'Еда'),
        'animals': '🐾 ' + (typeof t === 'function' ? t('animals') : 'Животные'),
        'space': '🚀 ' + (typeof t === 'function' ? t('space') : 'Космос'),
    };
    return names[categoryKey] || categoryKey || 'Общие знания';
}

// Круговой таймер
function createCircularTimer(totalSeconds) {
    const circumference = 2 * Math.PI * 36;
    return `
        <div class="timer-circle-advanced">
            <svg viewBox="0 0 80 80">
                <circle class="timer-circle-bg" cx="40" cy="40" r="36"/>
                <circle class="timer-circle-progress" id="timer-progress-circle"
                        cx="40" cy="40" r="36"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="0"/>
            </svg>
            <span class="timer-circle-text" id="timer-display">${totalSeconds}</span>
        </div>
    `;
}