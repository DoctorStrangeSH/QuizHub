import { ClassicMode } from './classic.js';
import { getState } from '../../../store/state.js';
import { createSeededRandom, getUtcDateKey } from '../daily-challenge.js';

export class DailyChallengeMode extends ClassicMode {
    constructor() {
        super();
        this.type = 'daily';
        this.totalQuestions = 10;
        this.challengeDate = null;
        this.random = null;
    }

    async init(questions, settings = {}) {
        this.challengeDate = settings.challengeDate || getUtcDateKey();
        this.random = createSeededRandom(`${this.challengeDate}:daily-presentation`);
        await super.init(questions, settings);
        this.questions = this.questions.slice(0, 10);
        this.totalQuestions = this.questions.length;
    }

    shuffleArray(items) {
        if (!this.random) return super.shuffleArray(items);

        const result = [...items];
        for (let index = result.length - 1; index > 0; index--) {
            const target = Math.floor(this.random() * (index + 1));
            [result[index], result[target]] = [result[target], result[index]];
        }
        return result;
    }

    async finishQuiz() {
        if (this.isFinished) return;
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

        const isEN = this.settings?.language === 'en';
        const heading = result.querySelector('h2');
        if (heading) {
            heading.textContent = isEN
                ? 'Daily challenge complete!'
                : 'Ежедневное испытание завершено!';
        }

        const labels = result.querySelectorAll('.result-label');
        const values = result.querySelectorAll('.result-value');
        const lastLabel = labels[labels.length - 1];
        const lastValue = values[values.length - 1];
        if (lastLabel) lastLabel.textContent = isEN ? 'Daily bonus' : 'Дневной бонус';
        if (lastValue) lastValue.textContent = '—';
    }
}
