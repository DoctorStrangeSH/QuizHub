import { BaseMode } from './base.js';
import { getState } from '../../../store/state.js';

export class SurvivalMode extends BaseMode {
    constructor() {
        super();
        this.type = 'survival';
        this.lives = 3;
    }
    
    async init(allQuestions, settings) {
        await super.init(allQuestions, settings);
        this.lives = 3;
    }
    
    getProgressText() {
        return `❤️ Жизни: ${this.lives} | Счёт: ${this.score}`;
    }
    
    renderProgressBar() {
        const hearts = [];
        for (let i = 0; i < 3; i++) {
            hearts.push(i < this.lives ? '❤️' : '🖤');
        }
        return `
            <div class="lives-display">
                ${hearts.join(' ')}
            </div>
        `;
    }
    
    renderModeSpecificHeader() {
        return `
            <div class="mode-badge survival-badge">💀 Выживание</div>
        `;
    }
    
    onAnswer(isCorrect, points) {
        if (!isCorrect) {
            this.lives--;
        }
    }
    
    getNextButtonText() {
        return this.lives > 0 ? 'Далее →' : 'Завершить 🏁';
    }
    
    shouldEnd() {
        return this.lives <= 0 || this.currentIndex >= this.questions.length;
    }
    
    async finishQuiz() {
        await this.saveResults({
            'stats.bestStreak': increment(this.correctAnswers)
        });
        
        this.showResults();
    }
    
    showResults() {
        const coinsEarned = Math.floor(this.score / 2);
        const streak = this.correctAnswers;
        
        document.querySelector('.quiz-container').innerHTML = `
            <div class="quiz-result glass-card text-center animate-in">
                <div class="result-icon">${streak >= 20 ? '🔥' : streak >= 10 ? '💀' : '💪'}</div>
                <h2 class="text-gradient fw-bold mb-1">Выбывание!</h2>
                <p class="text-secondary mb-3">Вы ответили на ${streak} вопросов подряд</p>
                <div class="result-stats">
                    <div class="row g-3">
                        <div class="col-4">
                            <div class="result-stat">
                                <span class="result-value text-gradient">${streak}</span>
                                <span class="result-label">Серия</span>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="result-stat">
                                <span class="result-value text-gold">${this.score}</span>
                                <span class="result-label">Очки</span>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="result-stat">
                                <span class="result-value coin-color">+${coinsEarned}</span>
                                <span class="result-label">Монет</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4 d-flex justify-content-center gap-3 flex-wrap">
                    <button class="btn-premium" onclick="window.navigateTo('home')">← В меню</button>
                    <button class="btn-gold" onclick="window.navigateTo('quiz')">Играть снова 🔄</button>
                </div>
            </div>
        `;
    }
}