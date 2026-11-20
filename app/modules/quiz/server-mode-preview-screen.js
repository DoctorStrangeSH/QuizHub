import { createModeSessionController } from './mode-session-controller.js';
import { createServerModeClient } from './server-mode-client.js';
import { createLocalFirebaseModeInvoker } from './firebase-mode-preview.js';
import { escapeHTML } from './escape-html.js';
import { createModeSessionStorage } from './mode-session-storage.js';
import { getTimeTrialClock } from './time-trial-clock.js';

let controller = null;
let settingsSnapshot = null;
let busy = false;
let lastResponse = null;
let sessionStorageAdapter = null;
let timerInterval = null;

const QUESTION_COUNTS = Object.freeze({ survival: 100, duel: 7, time: 10 });

function text(value) {
    return escapeHTML(String(value ?? ''));
}

function labels(language) {
    return language === 'en'
        ? {
            title: 'Server mode preview', loading: 'Loading question…',
            submit: 'Answer', next: 'Next question', claim: 'Claim result',
            menu: 'Back to menu', correct: 'Correct!', wrong: 'Not quite',
            points: 'points', error: 'Could not complete the request',
            complete: 'Run completed', saving: 'Saving verified result…',
            lives: 'Lives', streak: 'Streak', score: 'Score',
            answered: 'Questions answered', bestStreak: 'Best streak', playerScore: 'You', aiScore: 'Opponent', timeLeft: 'Time left', timeExpired: 'Time is up — submit to let the server verify the deadline',
        }
        : {
            title: 'Предпросмотр серверного режима', loading: 'Загружаем вопрос…',
            submit: 'Ответить', next: 'Следующий вопрос', claim: 'Забрать результат',
            menu: 'В меню', correct: 'Верно!', wrong: 'Неверно',
            points: 'очков', error: 'Не удалось выполнить запрос',
            complete: 'Забег завершён', saving: 'Сохраняем подтверждённый результат…',
            lives: 'Жизни', streak: 'Серия', score: 'Счёт',
            answered: 'Отвечено вопросов', bestStreak: 'Лучшая серия', playerScore: 'Вы', aiScore: 'Соперник', timeLeft: 'Осталось времени', timeExpired: 'Время вышло — отправьте ответ для проверки сервером',
        };
}

function questionMarkup(state, language) {
    const l = labels(language);
    const question = state.question;
    if (!question) return `<div class="quiz-question-card glass-card"><p>${l.loading}</p></div>`;
    const options = question.options.map((option, index) => `
        <button type="button" class="answer-card glass-card server-mode-answer"
            data-server-answer="${index}" ${busy ? 'disabled' : ''}>
            <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
            <span class="answer-text">${text(option)}</span>
        </button>`).join('');
    return `
        <div class="quiz-question-card glass-card">
            <div class="mode-badge">${l.title}</div>
            <h3 class="question-text">${text(question.text)}</h3>
        </div>
        <div class="quiz-answers">${options}</div>
    `;
}

function progressMarkup(language) {
    const progress = controller?.getState().progress;
    if (!progress) return '';
    const l = labels(language);
    const items = [];
    if (Number.isFinite(progress.lives)) items.push(`<span>${l.lives}: <strong>${progress.lives}</strong></span>`);
    if (Number.isFinite(progress.currentStreak)) items.push(`<span>${l.streak}: <strong>${progress.currentStreak}</strong></span>`);
    if (Number.isFinite(progress.bestStreak)) items.push(`<span>${l.bestStreak}: <strong>${progress.bestStreak}</strong></span>`);
    if (Number.isFinite(progress.score)) items.push(`<span>${l.score}: <strong>${progress.score}</strong></span>`);
    if (Number.isFinite(progress.playerScore)) items.push(`<span>${l.playerScore}: <strong>${progress.playerScore}</strong></span>`);
    if (Number.isFinite(progress.aiScore)) items.push(`<span>${l.aiScore}: <strong>${progress.aiScore}</strong></span>`);
    if (!items.length) return '';
    return `<div class="quiz-progress glass-card d-flex flex-wrap justify-content-around gap-2" aria-label="Game progress">${items.join('')}</div>`;
}

function timerMarkup(language) {
    if (settingsSnapshot?.mode !== 'time') return '';
    const deadlineAt = controller?.getState().questionDeadlineAt;
    if (!Number.isSafeInteger(deadlineAt)) return '';
    const clock = getTimeTrialClock(deadlineAt, Date.now());
    const l = labels(language);
    return \`
        <div class="time-trial-clock glass-card" data-time-trial-timer role="timer" aria-live="off">
            <div class="d-flex justify-content-between align-items-center gap-2">
                <span>\${l.timeLeft}</span>
                <strong data-time-trial-value>\${clock.display}</strong>
            </div>
            <div class="timer-bar-wrapper mt-2">
                <div class="timer-bar-fill\${clock.expired ? ' urgent' : ''}" data-time-trial-fill style="width:\${clock.percent}%"></div>
            </div>
            <p class="small text-secondary mt-2 mb-0" data-time-trial-status>\${clock.expired ? l.timeExpired : ''}</p>
        </div>\`;
}

function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer(root, language) {
    const timer = root.querySelector('[data-time-trial-timer]');
    if (!timer) return;
    const deadlineAt = controller?.getState().questionDeadlineAt;
    if (!Number.isSafeInteger(deadlineAt)) return;
    const clock = getTimeTrialClock(deadlineAt, Date.now());
    const value = timer.querySelector('[data-time-trial-value]');
    const fill = timer.querySelector('[data-time-trial-fill]');
    const status = timer.querySelector('[data-time-trial-status]');
    if (value) value.textContent = clock.display;
    if (fill) {
        fill.style.width = \`\${clock.percent}%\`;
        fill.classList.toggle('urgent', clock.urgent || clock.expired);
    }
    if (value) value.classList.toggle('urgent', clock.urgent || clock.expired);
    if (status) status.textContent = clock.expired ? labels(language).timeExpired : '';
}

function shell(body, language) {
    const l = labels(language);
    return `
        <section class="quiz-container server-mode-preview" aria-live="polite">
            <div class="quiz-progress glass-card">
                <div class="d-flex justify-content-between flex-wrap gap-2">
                    <strong>${l.title}</strong>
                    <span>${l.answered}: ${controller?.getState().answeredQuestions ?? 0}/${controller?.getState().totalQuestions ?? 0}</span>
                </div>
            </div>
            ${progressMarkup(language)}
            ${timerMarkup(language)}
            ${body}
            <div class="text-center mt-3">
                <button type="button" class="btn-premium" data-server-menu>${l.menu}</button>
            </div>
        </section>`;
}

function renderActive(language) {
    const state = controller.getState();
    return shell(questionMarkup(state, language), language);
}

function renderReadyToClaim(state, language) {
    const l = labels(language);
    return shell(`
        <div class="quiz-result glass-card text-center">
            <div class="result-icon">🏁</div>
            <h2>${l.complete}</h2>
            <p>${l.answered}: ${state.answeredQuestions}/${state.totalQuestions}</p>
            <button type="button" class="btn-gold" data-server-claim>${l.claim}</button>
        </div>`, language);
}

function renderCompleted(state, language) {
    const l = labels(language);
    const receipt = state.receipt || state.result || {};
    return shell(`
        <div class="quiz-result glass-card text-center">
            <div class="result-icon">🏆</div>
            <h2>${l.complete}</h2>
            <p>${l.score}: ${text(receipt.score ?? '—')}</p>
            <p class="text-secondary small">${text(receipt.status || 'Server receipt confirmed')}</p>
            <button type="button" class="btn-premium" data-server-menu>${l.menu}</button>
        </div>`, language);
}

function renderSessionState(state, language) {
    if (state.status === 'in_progress') return renderActive(language);
    if (state.status === 'ready_to_complete' || state.status === 'ready_to_claim' || state.status === 'expired') {
        return renderReadyToClaim(state, language);
    }
    if (state.status === 'completed') return renderCompleted(state, language);
    throw new Error('UNSUPPORTED_SESSION_STATE');
}

export async function renderServerModePreview(settings) {
    const language = settings.language || 'ru';
    const mode = settings.mode;
    if (!Object.hasOwn(QUESTION_COUNTS, mode)) throw new Error('UNSUPPORTED_QUIZ_MODE');
    controller = null;
    lastResponse = null;
    busy = true;
    settingsSnapshot = { ...settings, language };
    const invoke = createLocalFirebaseModeInvoker();
    const client = createServerModeClient({ invoke });
    controller = createModeSessionController({ client });
    try {
        sessionStorageAdapter = createModeSessionStorage(window.sessionStorage);
        const previousSessionId = sessionStorageAdapter.read(mode);
        let state = null;
        if (previousSessionId) {
            try {
                state = await controller.resume({ sessionId: previousSessionId, language });
            } catch (error) {
                if (!['SESSION_NOT_FOUND', 'NOT_SESSION_OWNER'].includes(error.message)) throw error;
                sessionStorageAdapter.clear(mode);
            }
        }
        if (!state) {
            state = await controller.start({
                mode,
                category: settings.category || 'all',
                difficulty: settings.difficulty || 'easy',
                count: QUESTION_COUNTS[mode],
                language
            });
            sessionStorageAdapter.write(mode, state.sessionId);
        }
        busy = false;
        return renderSessionState(state, language);
    } catch (error) {
        controller = null;
        busy = false;
        return shell(`<div class="quiz-result glass-card" role="alert"><p>${text(labels(language).error)}</p><p class="text-secondary small">${text(error.message)}</p></div>`, language);
    }
}

export function attachServerModePreviewListeners(onExit = () => window.navigateTo('home')) {
    const root = document.querySelector('.server-mode-preview');
    if (!root || !controller) return;
    stopTimer();
    if (settingsSnapshot?.mode === 'time') {
        updateTimer(root, settingsSnapshot.language);
        timerInterval = setInterval(() => updateTimer(root, settingsSnapshot.language), 200);
    }
    root.addEventListener('click', async event => {
        const menu = event.target.closest('[data-server-menu]');
        if (menu) {
            stopTimer();
            controller = null;
            onExit();
            return;
        }
        const answer = event.target.closest('[data-server-answer]');
        if (answer && !busy) {
            stopTimer();
            const index = Number(answer.dataset.serverAnswer);
            busy = true;
            root.querySelectorAll('[data-server-answer]').forEach(button => { button.disabled = true; });
            try {
                const result = await controller.answerDisplayed(index, { language: settingsSnapshot.language });
                lastResponse = result.response;
                const state = result.state;
                const l = labels(settingsSnapshot.language);
                const feedback = lastResponse.correct ? l.correct : l.wrong;
                const progress = progressMarkup(settingsSnapshot.language);
                const detail = Number.isFinite(lastResponse.points) ? ` · +${lastResponse.points} ${l.points}` : '';
                const next = state.status === 'ready_to_claim'
                    ? `<button type="button" class="btn-gold" data-server-claim>${l.claim}</button>`
                    : `<button type="button" class="btn-premium" data-server-next>${l.next}</button>`;
                root.innerHTML = `
                    <div class="quiz-progress glass-card"><strong>${l.title}</strong>
                        <span class="float-end">${l.answered}: ${state.answeredQuestions}/${state.totalQuestions}</span>
                    </div>
                    ${progress}
                    <div class="quiz-result glass-card text-center">
                        <div class="result-icon">${lastResponse.correct ? '✓' : '↗'}</div>
                        <h2>${feedback}</h2><p>${text(detail)}</p>
                        ${next}
                    </div>
                    <div class="text-center mt-3"><button type="button" class="btn-premium" data-server-menu>${l.menu}</button></div>`;
            } catch (error) {
                const l = labels(settingsSnapshot.language);
                root.insertAdjacentHTML('afterbegin', `<p class="answer-feedback" role="alert">${text(l.error)}: ${text(error.message)}</p>`);
                root.querySelectorAll('[data-server-answer]').forEach(button => { button.disabled = false; });
            } finally {
                busy = false;
            }
            return;
        }
        if (event.target.closest('[data-server-next]') && !busy) {
            stopTimer();
            root.outerHTML = renderActive(settingsSnapshot.language);
            attachServerModePreviewListeners(onExit);
            return;
        }
        if (event.target.closest('[data-server-claim]') && !busy) {
            stopTimer();
            busy = true;
            const l = labels(settingsSnapshot.language);
            root.innerHTML = `<div class="quiz-result glass-card text-center"><p>${l.saving}</p></div>`;
            try {
                const completed = await controller.claim();
                const receipt = completed.receipt || {};
                sessionStorageAdapter?.clear(settingsSnapshot.mode);
                root.innerHTML = `
                    <div class="quiz-result glass-card text-center animate-in">
                        <div class="result-icon">🏆</div><h2>${l.complete}</h2>
                        <p>${l.score}: ${text(receipt.score ?? lastResponse?.score ?? '—')}</p>
                        <p class="text-secondary small">${text(receipt.status || 'Server receipt confirmed')}</p>
                        <button type="button" class="btn-premium" data-server-menu>${l.menu}</button>
                    </div>`;
            } catch (error) {
                root.innerHTML = `<div class="quiz-result glass-card" role="alert"><p>${text(l.error)}: ${text(error.message)}</p><button type="button" class="btn-premium" data-server-claim>${l.claim}</button></div>`;
            } finally {
                busy = false;
            }
        }
    });
}

export function resetServerModePreview() {
    stopTimer();
    controller = null;
    settingsSnapshot = null;
    lastResponse = null;
    sessionStorageAdapter = null;
    busy = false;
}
