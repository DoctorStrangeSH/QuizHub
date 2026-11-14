import { BaseMode } from './base.js';
import { increment } from '../../../firebase-config.js';

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
        await this.saveResults({
            wins: increment(this.correctAnswers >= Math.ceil(this.totalQuestions * 0.7) ? 1 : 0),
            'stats.totalWins': increment(this.correctAnswers >= Math.ceil(this.totalQuestions * 0.7) ? 1 : 0)
        });
        
        this.showResults();
    }
    
    showResults() {
        if (this.isDisposed) return;
        const resultContainer = document.querySelector('.quiz-container');
        if (!resultContainer) return;
        const isWin = this.correctAnswers >= Math.ceil(this.totalQuestions * 0.7);
        const coinsEarned = this.earnedCoins;
        
        let emoji, text;
        if (isWin) { emoji = '🏆'; text = 'Отличный результат!'; }
        else if (this.correctAnswers >= Math.ceil(this.totalQuestions * 0.5)) { emoji = '👍'; text = 'Неплохо!'; }
        else { emoji = '💪'; text = 'Попробуй ещё раз!'; }
        
        resultContainer.innerHTML = `
            <div class="quiz-result glass-card text-center animate-in">
                <div class="result-icon">${emoji}</div>
                <h2 class="text-gradient fw-bold mb-1">Квиз завершён!</h2>
                <p class="text-secondary mb-3">${text}</p>
                <div class="result-stats">
                    <div class="row g-3">
                        <div class="col-4">
                            <div class="result-stat">
                                <span class="result-value text-gradient">${this.correctAnswers}/${this.totalQuestions}</span>
                                <span class="result-label">Правильно</span>
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