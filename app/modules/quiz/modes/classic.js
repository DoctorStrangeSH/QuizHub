import { BaseMode } from './base.js';
import { increment } from '../../../firebase-config.js';
import { getState } from '../../../store/state.js';

export class ClassicMode extends BaseMode {
    constructor() {
        super();
        this.type = 'classic';
        this.totalQuestions = 10;
    }
    
    async init(allQuestions, settings) {
        await super.init(allQuestions, settings);
        this.questions = this.questions.slice(0, this.totalQuestions);
        this.totalQuestions = this.questions.length;
    }
    
    getProgressText() {
        return `Вопрос ${this.currentIndex + 1}/${this.totalQuestions}`;
    }
    
    renderProgressBar() {
        const progress = (this.currentIndex / this.totalQuestions) * 100;
        return `
            <div class="progress-bar-wrapper">
                <div class="progress-bar-fill" style="width: ${progress}%"></div>
            </div>
        `;
    }
    
    getNextButtonText() {
        return this.currentIndex < this.totalQuestions - 1 ? 'Далее →' : 'Завершить 🏁';
    }
    
    shouldEnd() {
        return this.currentIndex >= this.totalQuestions;
    }
    
    async finishQuiz() {
        const saving = this.saveResults({
            wins: increment(this.correctAnswers >= Math.ceil(this.totalQuestions * 0.7) ? 1 : 0),
            'stats.totalWins': increment(this.correctAnswers >= Math.ceil(this.totalQuestions * 0.7) ? 1 : 0)
        });

        // Show the result immediately; a slow network must not freeze the game.
        this.showResults();
        await saving;
        // Update the reward status only if the player is still on this screen.
        this.showResults();
    }
    
    showResults() {
        if (this.isDisposed) return;
        const resultContainer = document.querySelector('.quiz-container');
        if (!resultContainer) return;
        const isEN = getState().language === 'en';
        const correct = Math.max(0, Math.min(this.correctAnswers, this.totalQuestions));
        const total = Math.max(1, this.totalQuestions);
        const accuracy = Math.round(correct / total * 100);
        const isWin = correct >= Math.ceil(total * 0.7);
        const isPractice = this.saveStatus === 'practice';
        const coinsEarned = this.saveStatus === 'saved' ? `+${this.earnedCoins}` : this.saveStatus === 'saving' ? '…' : '—';
        const xpEarned = this.saveStatus === 'saved' ? `+${this.earnedXP}` : this.saveStatus === 'saving' ? '…' : '—';

        const icon = isWin ? '🏆' : accuracy >= 50 ? '✨' : '💫';
        const headline = isWin
            ? (isEN ? 'Outstanding run!' : 'Великолепный забег!')
            : accuracy >= 50
                ? (isEN ? 'Keep the momentum!' : 'Продолжай в том же духе!')
                : (isEN ? 'Your next run will be stronger!' : 'Следующий забег будет лучше!');
        const eyebrow = isEN ? 'ROUND COMPLETE' : 'РАУНД ЗАВЕРШЁН';
        const accuracyLabel = isEN ? 'Accuracy' : 'Точность';
        const correctLabel = isEN ? 'Correct' : 'Правильно';
        const scoreLabel = isEN ? 'Score' : 'Очки';
        const coinsLabel = isEN ? 'Coins' : 'Монет';
        const xpLabel = isEN ? 'Experience' : 'Опыт';
        const homeLabel = isEN ? '← Home' : '← В меню';
        const replayLabel = isEN ? 'Play again ↻' : 'Играть снова ↻';

        resultContainer.innerHTML = `
            <div class="quiz-result arcade-result glass-card text-center animate-in">
                <div class="arcade-result-eyebrow">${eyebrow}</div>
                <div class="result-icon arcade-result-icon" aria-hidden="true">${icon}</div>
                <h2 class="text-gradient fw-bold mb-1">${isEN ? 'Quiz complete!' : 'Квиз завершён!'}</h2>
                <p class="text-secondary mb-3">${headline}</p>
                ${this.bestFeedbackStreak >= 2 ? `<div class="arcade-streak-summary">🔥 ${isEN ? 'Best streak' : 'Лучшая серия'}: ${this.bestFeedbackStreak}</div>` : ''}
                <section class="arcade-accuracy" aria-label="${accuracyLabel}">
                    <div class="arcade-accuracy-heading">
                        <span>${accuracyLabel}</span>
                        <strong>${accuracy}%</strong>
                    </div>
                    <div class="arcade-accuracy-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${accuracy}" aria-label="${accuracyLabel}">
                        <span class="arcade-accuracy-fill" style="width: ${accuracy}%"></span>
                    </div>
                </section>
                <div class="result-stats">
                    <div class="row g-3">
                        <div class="col-4">
                            <div class="result-stat">
                                <span class="result-value text-gradient">${correct}/${this.totalQuestions}</span>
                                <span class="result-label">${correctLabel}</span>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="result-stat">
                                <span class="result-value text-gold">${this.score}</span>
                                <span class="result-label">${scoreLabel}</span>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="result-stat">
                                <span class="result-value coin-color">${isPractice ? '—' : coinsEarned}</span>
                                <span class="result-label">${coinsLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>
                ${!isPractice ? `<div class="arcade-xp-reward" aria-label="${xpLabel}">
                    <span aria-hidden="true">✦</span><span>${xpLabel}</span><strong>${xpEarned}</strong>
                </div>` : ''}
                ${this.getSaveStatusHTML()}
                <div class="arcade-result-actions mt-4 d-flex justify-content-center gap-3 flex-wrap">
                    <button class="btn-premium" onclick="window.navigateTo('home')">${homeLabel}</button>
                    <button class="btn-gold" onclick="window.navigateTo('quiz')">${replayLabel}</button>
                </div>
            </div>
        `;
    }
}
