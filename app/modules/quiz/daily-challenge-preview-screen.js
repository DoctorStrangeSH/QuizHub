import { createDailyChallengeClient } from './daily-challenge-client.js';
import { createLocalFirebaseDailyChallengeInvoker } from './firebase-daily-challenge-preview.js';
import { escapeHTML } from './escape-html.js';

let client = null;
let state = null;
let language = 'ru';
let busy = false;
let lastAnswer = null;

const copy = {
    ru: {
        title: 'Ежедневное испытание', practice: 'Серверная тренировка',
        loading: 'Загружаем испытание…', question: 'Вопрос', answer: 'Ответить',
        next: 'Продолжить', finish: 'Завершить испытание', complete: 'Испытание завершено',
        correct: 'Верно!', wrong: 'Неверно', points: 'очков', progress: 'Отвечено',
        menu: 'В меню', score: 'Очки', correctCount: 'Правильных ответов',
        practiceOnly: 'Тренировочный результат. Рейтинг и награды пока отключены.',
        saving: 'Проверяем результат на сервере…', error: 'Не удалось выполнить испытание',
        retry: 'Повторить запрос'
    },
    en: {
        title: 'Daily Challenge', practice: 'Server-verified practice',
        loading: 'Loading challenge…', question: 'Question', answer: 'Answer',
        next: 'Continue', finish: 'Finish challenge', complete: 'Challenge complete',
        correct: 'Correct!', wrong: 'Not quite', points: 'points', progress: 'Answered',
        menu: 'Back to menu', score: 'Score', correctCount: 'Correct answers',
        practiceOnly: 'Practice result only. Rankings and rewards are not enabled yet.',
        saving: 'Verifying result with the server…', error: 'Could not complete the challenge',
        retry: 'Retry request'
    }
};

function t(value) { return escapeHTML(String(value ?? '')); }
function labels() { return copy[language] || copy.ru; }

function shell(content) {
    const l = labels();
    return `<section class="quiz-container server-daily-challenge-preview" aria-live="polite">
        <div class="quiz-progress glass-card d-flex justify-content-between flex-wrap gap-2">
            <strong>📅 ${l.title}</strong>
            <span>${l.practice}</span>
        </div>
        ${content}
        <div class="text-center mt-3">
            <button type="button" class="btn-premium" data-daily-menu>${l.menu}</button>
        </div>
    </section>`;
}

function progress() {
    const l = labels();
    return `<div class="quiz-progress glass-card d-flex justify-content-between">
        <span>${l.progress}</span>
        <strong>${state?.answeredQuestions ?? 0}/${state?.totalQuestions ?? 10}</strong>
    </div>`;
}

function renderQuestion() {
    const l = labels();
    const question = state?.question;
    if (!question) return shell(`<div class="quiz-question-card glass-card"><p>${l.loading}</p></div>`);
    const options = question.options.map((option, index) => `
        <button type="button" class="answer-card glass-card server-daily-answer"
            data-daily-answer="${index}" ${busy ? 'disabled' : ''}>
            <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
            <span class="answer-text">${t(option)}</span>
        </button>`).join('');
    return shell(`${progress()}
        <div class="quiz-question-card glass-card">
            <div class="mode-badge">${t(question.category)} · ${t(question.difficulty)}</div>
            <div class="quiz-question-kicker">${l.question} ${(state.answeredQuestions || 0) + 1}/10</div>
            <h3 class="question-text">${t(question.question)}</h3>
        </div>
        <div class="quiz-answers">${options}</div>`);
}

function renderFeedback() {
    const l = labels();
    const result = lastAnswer || {};
    const correct = result.correct === true;
    const ready = state?.status === 'ready_to_complete' || state?.status === 'expired';
    return shell(`${progress()}
        <div class="quiz-result glass-card text-center">
            <div class="result-icon">${correct ? '✓' : '↗'}</div>
            <h2>${correct ? l.correct : l.wrong}</h2>
            <p>${Number.isFinite(result.points) ? '+' + result.points + ' ' + l.points : ''}</p>
            <button type="button" class="btn-gold" data-daily-next>${ready ? l.finish : l.next}</button>
        </div>`);
}

function renderReady() {
    const l = labels();
    return shell(`${progress()}
        <div class="quiz-result glass-card text-center">
            <div class="result-icon">🏁</div>
            <h2>${l.complete}</h2>
            <p>${state.answeredQuestions}/${state.totalQuestions}</p>
            <button type="button" class="btn-gold" data-daily-complete>${l.finish}</button>
        </div>`);
}

function renderCompleted() {
    const l = labels();
    const receipt = state.receipt || {};
    return shell(`
        <div class="quiz-result glass-card text-center">
            <div class="result-icon">🏆</div>
            <h2>${l.complete}</h2>
            <div class="result-stats">
                <div class="row g-3">
                    <div class="col-6"><div class="result-stat">
                        <span class="result-value text-gradient">${t(receipt.correctAnswers ?? 0)}/10</span>
                        <span class="result-label">${l.correctCount}</span>
                    </div></div>
                    <div class="col-6"><div class="result-stat">
                        <span class="result-value text-gold">${t(receipt.score ?? 0)}</span>
                        <span class="result-label">${l.score}</span>
                    </div></div>
                </div>
            </div>
            <p class="text-secondary small mt-3" role="status">${l.practiceOnly}</p>
        </div>`);
}

function renderError(error) {
    const l = labels();
    return shell(`<div class="quiz-result glass-card" role="alert">
        <h2>${l.error}</h2><p class="text-secondary small">${t(error?.message || 'UNKNOWN_ERROR')}</p>
        <button type="button" class="btn-premium" data-daily-retry>${l.retry}</button>
    </div>`);
}

export async function renderDailyChallengePreview(settings = {}) {
    language = settings.language === 'en' ? 'en' : 'ru';
    client = null;
    state = null;
    lastAnswer = null;
    busy = true;
    try {
        client = createDailyChallengeClient({ invoke: createLocalFirebaseDailyChallengeInvoker() });
        state = await client.start({ language });
        busy = false;
        if (state.status === 'completed') return renderCompleted();
        if (state.status === 'ready_to_complete' || state.status === 'expired') return renderReady();
        return renderQuestion();
    } catch (error) {
        busy = false;
        return renderError(error);
    }
}

export function attachDailyChallengePreviewListeners(onExit = () => window.navigateTo('home')) {
    const root = document.querySelector('.server-daily-challenge-preview');
    if (!root || !client) return;
    root.addEventListener('click', async event => {
        if (event.target.closest('[data-daily-menu]')) {
            resetDailyChallengePreview();
            onExit();
            return;
        }
        if (event.target.closest('[data-daily-retry]')) {
            const markup = await renderDailyChallengePreview({ language });
            const current = document.querySelector('.server-daily-challenge-preview');
            if (current) current.outerHTML = markup;
            attachDailyChallengePreviewListeners(onExit);
            return;
        }
        if (event.target.closest('[data-daily-answer]') && !busy) {
            const button = event.target.closest('[data-daily-answer]');
            busy = true;
            root.querySelectorAll('[data-daily-answer]').forEach(item => { item.disabled = true; });
            try {
                const questionId = state.question.id;
                const response = await client.answer({
                    date: state.date, questionId,
                    answerIndex: Number(button.dataset.dailyAnswer), language
                });
                state = response;
                lastAnswer = response.answerResult || null;
                root.outerHTML = renderFeedback();
                attachDailyChallengePreviewListeners(onExit);
            } catch (error) {
                busy = false;
                root.insertAdjacentHTML('afterbegin', `<p class="answer-feedback" role="alert">${t(error.message)}</p>`);
                root.querySelectorAll('[data-daily-answer]').forEach(item => { item.disabled = false; });
            } finally {
                busy = false;
            }
            return;
        }
        if (event.target.closest('[data-daily-next]') && !busy) {
            const ready = state.status === 'ready_to_complete' || state.status === 'expired';
            const markup = ready ? renderReady() : renderQuestion();
            root.outerHTML = markup;
            attachDailyChallengePreviewListeners(onExit);
            return;
        }
        if (event.target.closest('[data-daily-complete]') && !busy) {
            busy = true;
            root.innerHTML = `<div class="quiz-result glass-card text-center"><p>${labels().saving}</p></div>`;
            try {
                const receipt = await client.complete({ date: state.date });
                state = { ...state, status: 'completed', receipt };
                root.outerHTML = renderCompleted();
                attachDailyChallengePreviewListeners(onExit);
            } catch (error) {
                root.outerHTML = renderError(error);
                attachDailyChallengePreviewListeners(onExit);
            } finally {
                busy = false;
            }
        }
    });
}

export function resetDailyChallengePreview() {
    client = null;
    state = null;
    lastAnswer = null;
    busy = false;
}
