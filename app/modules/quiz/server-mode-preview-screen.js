import { createModeSessionController } from './mode-session-controller.js';
import { createServerModeClient } from './server-mode-client.js';
import { createLocalFirebaseModeInvoker } from './firebase-mode-preview.js';
import { escapeHTML } from './escape-html.js';

let controller = null;
let settingsSnapshot = null;
let busy = false;
let lastResponse = null;

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
            answered: 'Questions answered'
        }
        : {
            title: 'Предпросмотр серверного режима', loading: 'Загружаем вопрос…',
            submit: 'Ответить', next: 'Следующий вопрос', claim: 'Забрать результат',
            menu: 'В меню', correct: 'Верно!', wrong: 'Неверно',
            points: 'очков', error: 'Не удалось выполнить запрос',
            complete: 'Забег завершён', saving: 'Сохраняем подтверждённый результат…',
            lives: 'Жизни', streak: 'Серия', score: 'Счёт',
            answered: 'Отвечено вопросов'
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
    const root = shell(`<div class="quiz-question-card glass-card">${labels(language).loading}</div>`, language);
    try {
        await controller.start({
            mode,
            category: settings.category || 'all',
            difficulty: settings.difficulty || 'easy',
            count: QUESTION_COUNTS[mode],
            language
        });
        busy = false;
        return renderActive(language);
    } catch (error) {
        controller = null;
        busy = false;
        return shell(`<div class="quiz-result glass-card" role="alert"><p>${text(labels(language).error)}</p><p class="text-secondary small">${text(error.message)}</p></div>`, language);
    }
}

export function attachServerModePreviewListeners(onExit = () => window.navigateTo('home')) {
    const root = document.querySelector('.server-mode-preview');
    if (!root || !controller) return;
    root.addEventListener('click', async event => {
        const menu = event.target.closest('[data-server-menu]');
        if (menu) {
            controller = null;
            onExit();
            return;
        }
        const answer = event.target.closest('[data-server-answer]');
        if (answer && !busy) {
            const index = Number(answer.dataset.serverAnswer);
            busy = true;
            root.querySelectorAll('[data-server-answer]').forEach(button => { button.disabled = true; });
            try {
                const result = await controller.answerDisplayed(index, { language: settingsSnapshot.language });
                lastResponse = result.response;
                const state = result.state;
                const l = labels(settingsSnapshot.language);
                const feedback = lastResponse.correct ? l.correct : l.wrong;
                const detail = Number.isFinite(lastResponse.points) ? ` · +${lastResponse.points} ${l.points}` : '';
                const next = state.status === 'ready_to_claim'
                    ? `<button type="button" class="btn-gold" data-server-claim>${l.claim}</button>`
                    : `<button type="button" class="btn-premium" data-server-next>${l.next}</button>`;
                root.innerHTML = `
                    <div class="quiz-progress glass-card"><strong>${l.title}</strong>
                        <span class="float-end">${l.answered}: ${state.answeredQuestions}/${state.totalQuestions}</span>
                    </div>
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
            root.outerHTML = renderActive(settingsSnapshot.language);
            attachServerModePreviewListeners(onExit);
            return;
        }
        if (event.target.closest('[data-server-claim]') && !busy) {
            busy = true;
            const l = labels(settingsSnapshot.language);
            root.innerHTML = `<div class="quiz-result glass-card text-center"><p>${l.saving}</p></div>`;
            try {
                const completed = await controller.claim();
                const receipt = completed.receipt || {};
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
    controller = null;
    settingsSnapshot = null;
    lastResponse = null;
    busy = false;
}
