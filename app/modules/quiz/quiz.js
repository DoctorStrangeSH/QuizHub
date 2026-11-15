import { getState } from '../../store/state.js';
import { getQuestions } from '../../data/questions/index.js';
import { ClassicMode } from './modes/classic.js';
import { SurvivalMode } from './modes/survival.js';
import { TimeTrialMode } from './modes/timetrial.js';
import { DuelMode } from './modes/duel.js';

// Текущий активный режим
let currentMode = null;
let attachedMode = null;

// ========== ФАБРИКА РЕЖИМОВ ==========
function createMode(modeType) {
    switch (modeType) {
        case 'classic':  return new ClassicMode();
        case 'survival': return new SurvivalMode();
        case 'time':     return new TimeTrialMode();
        case 'duel':     return new DuelMode();
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

    
    // Загружаем вопросы
    const questions = getQuestions(settings.category, settings.difficulty);
    
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
    await mode.init(questions, settings);
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
    currentMode = null;
    attachedMode = null;
}

// ========== ПОДКЛЮЧЕНИЕ ОБРАБОТЧИКОВ ==========
export function attachQuizListeners() {
    // Start first-question effects only after the markup is mounted.
    if (!currentMode || attachedMode === currentMode) return;
    attachedMode = currentMode;
    currentMode.afterQuestionRendered?.();
}