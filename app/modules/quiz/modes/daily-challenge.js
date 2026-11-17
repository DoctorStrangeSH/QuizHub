import { ClassicMode } from './classic.js';
import { getState } from '../../../store/state.js';
import { createSeededRandom, getUtcDateKey } from '../daily-challenge.js';
import { getDailyResultSummary } from '../daily-results.js';

export class DailyChallengeMode extends ClassicMode {
    constructor() {
        super();
        this.type = 'daily';
        this.totalQuestions = 10;
        this.challengeDate = null;
        this.random = null;
        this.preserveQuestionOrder = false;
        this.resultsShown = false;
    }

    async init(questions, settings = {}) {
        this.challengeDate = settings.challengeDate || getUtcDateKey();
        this.random = createSeededRandom(`${this.challengeDate}:daily-presentation`);
        this.preserveQuestionOrder = true;
        this.resultsShown = false;
        await super.init(questions, settings);
        this.questions = this.questions.slice(0, 10);
        this.totalQuestions = this.questions.length;
    }

    shuffleArray(items) {
        if (this.preserveQuestionOrder) {
            this.preserveQuestionOrder = false;
            return [...items];
        }
        if (!this.random) return super.shuffleArray(items);

        const result = [...items];
        for (let index = result.length - 1; index > 0; index--) {
            const target = Math.floor(this.random() * (index + 1));
            [result[index], result[target]] = [result[target], result[index]];
        }
        return result;
    }

    getProgressText() {
        const isEN = getState().language === 'en';
        const label = isEN ? 'Question' : 'Вопрос';
        return `${label} ${this.currentIndex + 1}/${this.totalQuestions}`;
    }

    getNextButtonText() {
        const isEN = getState().language === 'en';
        const isLastQuestion = this.currentIndex >= this.totalQuestions - 1;
        if (isLastQuestion) return isEN ? 'Finish 🏁' : 'Завершить 🏁';
        return isEN ? 'Next →' : 'Далее →';
    }

    renderModeSpecificHeader() {
        const isEN = getState().language === 'en';
        const label = isEN ? 'DAILY CHALLENGE' : 'ЕЖЕДНЕВНОЕ ИСПЫТАНИЕ';
        return `<div class="mode-badge daily-challenge-badge">📅 ${label} · ${this.challengeDate}</div>`;
    }

    async finishQuiz() {
        if (this.resultsShown) return;
        this.resultsShown = true;
        this.isFinished = true;

        // Daily attempts are practice-only until a server-authoritative,
        // once-per-day reward endpoint is deployed and tested.
        this.saveStatus = 'practice';
        this.earnedCoins = 0;
        this.earnedXP = 0;
        this.showResults();
    }

    getSaveStatusHTML() {
        const isEN = getState().language === 'en';
        const message = isEN
            ? '🎯 Daily challenge preview: verified daily rewards will unlock after server validation is deployed.'
            : '🎯 Предпросмотр ежедневного испытания: награды появятся после подключения серверной проверки.';
        return `<p class="text-secondary small mt-3" role="status">${message}</p>`;
    }

    showResults() {
        super.showResults();

        const result = document.querySelector('.quiz-result');
        if (!result) return;

        const isEN = getState().language === 'en';
        const summary = getDailyResultSummary(this.correctAnswers, this.totalQuestions, isEN ? 'en' : 'ru');
        result.classList.add('daily-challenge-result');
        const icon = result.querySelector('.result-icon');
        if (icon) icon.textContent = summary.icon;
        const heading = result.querySelector('h2');
        if (heading) {
            heading.textContent = isEN
                ? 'Daily challenge complete!'
                : 'Ежедневное испытание завершено!';
        }

        const feedback = result.querySelector('p.text-secondary.mb-3');
        if (feedback) {
            feedback.textContent = isEN
                ? summary.detail
                : summary.detail;
        }

        const labels = result.querySelectorAll('.result-label');
        const values = result.querySelectorAll('.result-value');
        const translatedLabels = isEN ? ['Correct', 'Score', 'Daily bonus'] : ['Правильно', 'Очки', 'Дневной бонус'];
        labels.forEach((label, index) => {
            if (translatedLabels[index]) label.textContent = translatedLabels[index];
        });
        const lastValue = values[values.length - 1];
        if (lastValue) lastValue.textContent = '—';

        // Build a read-only breakdown from the local practice outcome; no leaderboard claims.
        const breakdown = document.createElement('section');
        breakdown.className = 'daily-result-breakdown';
        breakdown.setAttribute('aria-label', isEN ? 'Daily answer breakdown' : 'Итоги ответов');
        const caption = document.createElement('div');
        caption.className = 'daily-result-caption';
        const eyebrow = document.createElement('span');
        eyebrow.className = 'daily-result-eyebrow';
        eyebrow.textContent = (isEN ? 'PRACTICE · ' : 'ТРЕНИРОВКА · ') + (this.challengeDate || getUtcDateKey());
        const title = document.createElement('strong');
        title.textContent = summary.title;
        const ratio = document.createElement('span');
        ratio.className = 'daily-result-percent';
        ratio.textContent = summary.percent + '%';
        caption.append(eyebrow, title, ratio);
        const segments = document.createElement('div');
        segments.className = 'daily-result-segments';
        segments.setAttribute('role', 'img');
        segments.setAttribute('aria-label', isEN
            ? `${summary.correct} correct out of ${summary.total}`
            : `${summary.correct} правильных из ${summary.total}`);
        for (let index = 0; index < summary.total; index++) {
            const segment = document.createElement('span');
            segment.className = index < summary.correct ? 'daily-result-segment is-correct' : 'daily-result-segment';
            segment.setAttribute('aria-hidden', 'true');
            segments.append(segment);
        }
        const hint = document.createElement('p');
        hint.className = 'daily-result-hint';
        hint.textContent = isEN
            ? 'Practice result only · Not included in rankings or prize claims.'
            : 'Только тренировочный результат · Не влияет на рейтинг и награды.';
        breakdown.append(caption, segments, hint);
        const stats = result.querySelector('.result-stats');
        if (stats) stats.insertAdjacentElement('beforebegin', breakdown);

        const buttons = result.querySelectorAll('button');
        if (buttons[0]) buttons[0].textContent = isEN ? '← Home' : '← В меню';
        if (buttons[1]) buttons[1].textContent = isEN ? 'Play again 🔄' : 'Играть снова 🔄';
    }
}
