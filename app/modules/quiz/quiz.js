import { getState } from '../../store/state.js';
import { getQuestions } from '../../data/questions/index.js';
import { ClassicMode } from './modes/classic.js';
import { SurvivalMode } from './modes/survival.js';
import { TimeTrialMode } from './modes/timetrial.js';
import { DuelMode } from './modes/duel.js';
import { DailyChallengeMode } from './modes/daily-challenge.js';
import { createDailyChallenge, getUtcDateKey } from './daily-challenge.js';

// Текущий активный режим
let currentMode = null;
let attachedMode = null;
let serverModePreviewActive = false;
let dailyChallengePreviewActive = false;

// ========== ФАБРИКА РЕЖИМОВ ==========
function createMode(modeType) {
    switch (modeType) {
        case 'classic':  return new ClassicMode();
        case 'survival': return new SurvivalMode();
        case 'time':     return new TimeTrialMode();
        case 'duel':     return new DuelMode();
        case 'daily':    return new DailyChallengeMode();
        default:         return new ClassicMode();
    }
}

// ========== ОТРИСОВКА КВИЗА ==========
export async function renderQuiz() {
    const settings = getState().gameSettings;
    if (!settings) {
        window.navigateTo('home');
        return '';
    }
    
    // Останавливаем таймер предыдущей игры перед повторным запуском.
    resetQuiz();

    // Explicit local-only opt-in: production UI remains on its existing path.
    const browserLocation = typeof window !== 'undefined' ? window.location : null;
    const previewParams = new URLSearchParams(browserLocation?.search || '');
    serverModePreviewActive = Boolean(browserLocation &&
        ['localhost', '127.0.0.1'].includes(browserLocation.hostname) &&
        previewParams.get('firebaseEmulator') === '1' &&
        previewParams.get('serverModePreview') === '1' &&
        ['classic', 'survival', 'duel', 'time'].includes(settings.mode));
    if (serverModePreviewActive) {
        const preview = await import('./server-mode-preview-screen.js');
        return preview.renderServerModePreview({ ...settings, language: getState().language });
    }


    
    dailyChallengePreviewActive = Boolean(browserLocation &&
        ['localhost', '127.0.0.1'].includes(browserLocation.hostname) &&
        previewParams.get('firebaseEmulator') === '1' &&
        previewParams.get('dailyChallengePreview') === '1' &&
        settings.mode === 'daily');
    if (dailyChallengePreviewActive) {
        const preview = await import('./daily-challenge-preview-screen.js');
        return preview.renderDailyChallengePreview({ ...settings, language: getState().language });
    }

    // Daily Challenge uses a UTC date key so every player receives the same set.
    const challenge = settings.mode === 'daily'
        ? createDailyChallenge(settings.challengeDate || getUtcDateKey())
        : null;
    const questions = challenge
        ? challenge.questions
        : getQuestions(settings.category, settings.difficulty);
    const modeSettings = challenge
        ? { ...settings, challengeDate: challenge.date }
        : settings;

    if (questions.length === 0) {
        return `
            <div class="quiz-container">
                <div class="quiz-result glass-card text-center animate-in">
                    <div class="result-icon">😕</div>
                    <h2 class="text-gradient fw-bold">Нет вопросов</h2>
                    <p class="text-secondary mt-2">
                        Для выбранной категории и сложности пока нет вопросов
                    </p>
                    <button class="btn-premium mt-3" onclick="window.navigateTo('home')">
                        ← Назад
                    </button>
                </div>
            </div>
        `;
    }
    
    // Создаём режим только после проверки наличия вопросов.
    const mode = createMode(settings.mode);
    currentMode = mode;
    
    // Инициализируем режим
    await mode.init(questions, modeSettings);
    // Ignore work belonging to an older navigation.
    if (currentMode !== mode || mode.isDisposed) return '';
    
    // Показываем первый вопрос
    return mode.renderQuestion(0);
}

// ========== ВЫБОР ОТВЕТА (обычные режимы) ==========
window.selectAnswer = (el) => {
    if (!currentMode) return;
    currentMode.handleAnswer(el);
};

// ========== СЛЕДУЮЩИЙ ВОПРОС ==========
window.nextQuestion = async () => {
    if (!currentMode) return;
    await currentMode.nextQuestion();
};

// ========== ОТВЕТ В ДУЭЛИ ==========
window.duelAnswer = (el) => {
    if (!currentMode || currentMode.type !== 'duel') return;
    currentMode.handlePlayerAnswer(el);
};

// ========== СБРОС РЕЖИМА ==========
export function resetQuiz() {
    // Завершаем режим и отменяем все его таймеры и отложенные действия.
    currentMode?.dispose?.();
    if (serverModePreviewActive) {
        serverModePreviewActive = false;
        import('./server-mode-preview-screen.js').then(module => module.resetServerModePreview());
    }
    if (dailyChallengePreviewActive) {
        dailyChallengePreviewActive = false;
        import('./daily-challenge-preview-screen.js').then(module => module.resetDailyChallengePreview());
    }
    currentMode = null;
    attachedMode = null;
}

// ========== ПОДКЛЮЧЕНИЕ ОБРАБОТЧИКОВ ==========
export function attachQuizListeners() {
    // Start first-question effects only after the markup is mounted.
    if (!currentMode) {
        if (serverModePreviewActive) {
            import('./server-mode-preview-screen.js').then(module => module.attachServerModePreviewListeners());
        } else if (dailyChallengePreviewActive) {
            import('./daily-challenge-preview-screen.js').then(module => module.attachDailyChallengePreviewListeners());
        }
        return;
    }
    if (attachedMode === currentMode) return;
    attachedMode = currentMode;
    currentMode.afterQuestionRendered?.();
}