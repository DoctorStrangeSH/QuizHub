import { BaseMode } from './base.js';
import { increment } from '../../../firebase-config.js';

export class TimeTrialMode extends BaseMode {
    constructor() {
        super();
        this.type = 'time';
        this.totalQuestions = 10;
        this.timePerQuestion = 15; // секунд
        this.timeLeft = 15;
        this.timerInterval = null;
    }
    
    async init(allQuestions, settings) {
        await super.init(allQuestions, settings);
        this.questions = this.questions.slice(0, this.totalQuestions);
        this.timeLeft = this.timePerQuestion;
        this.startTimer();
    }
    
    startTimer() {
        this.clearTimer();
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.clearTimer();
                this.handleTimeout();
            }
        }, 1000);
    }
    
    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimerDisplay() {
        const timerEl = document.getElementById('timer-display');
        if (timerEl) {
            const urgent = this.timeLeft <= 5;
            timerEl.textContent = `⏱️ ${this.timeLeft}с`;
            timerEl.className = `timer-display ${urgent ? 'urgent' : ''}`;
        }
    }
    
    getProgressText() {
        return `Вопрос ${this.currentIndex + 1}/${this.totalQuestions}`;
    }
    
    renderProgressBar() {
        const progress = (this.currentIndex / this.totalQuestions) * 100;
        const timerProgress = (this.timeLeft / this.timePerQuestion) * 100;
        const urgent = this.timeLeft <= 5;
        
        return `
            <div class="d-flex align-items-center gap-3 mb-2">
                <div class="progress-bar-wrapper flex-grow-1">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
                <span id="timer-display" class="timer-display ${urgent ? 'urgent' : ''}">
                    ⏱️ ${this.timeLeft}с
                </span>
            </div>
            <div class="timer-bar-wrapper">
                <div class="timer-bar-fill ${urgent ? 'urgent' : ''}" 
                     style="width: ${timerProgress}%; transition: width 1s linear;">
                </div>
            </div>
        `;
    }
    
    renderModeSpecificHeader() {
        return `
            <div class="mode-badge time-badge">⏱️ На время</div>
        `;
    }
    
    getNextButtonText() {
        return this.currentIndex < this.totalQuestions - 1 ? 'Далее →' : 'Завершить 🏁';
    }
    
    onAnswer(isCorrect, points) {
        this.clearTimer();
        // Бонус за скорость
        if (isCorrect && this.timeLeft > 10) {
            this.score += 5; // бонус за быстрый ответ
        }
    }
    
    handleTimeout() {
        const container = document.getElementById('answers-container');
        if (!container) return;
        
        const allCards = container.querySelectorAll('.answer-card');
        allCards.forEach(c => {
            c.classList.add('answered');
            if (c.dataset.correct === 'true') {
                c.classList.add('correct');
                c.querySelector('.answer-icon').textContent = '✓';
            }
        });
        
        document.getElementById('next-btn-container').style.display = 'block';
    }
    
    shouldEnd() {
        return this.currentIndex >= this.totalQuestions;
    }
    
    async finishQuiz() {
        this.clearTimer();
        
        await this.saveResults({
            wins: increment(this.correctAnswers >= 7 ? 1 : 0),
            'stats.totalWins': increment(this.correctAnswers >= 7 ? 1 : 0)
        });
        
        this.showResults();
    }
    
    showResults() {
        const isWin = this.correctAnswers >= 7;
        const coinsEarned = Math.floor(this.score / 2);
        
        document.querySelector('.quiz-container').innerHTML = `
            <div class="quiz-result glass-card text-center animate-in">
                <div class="result-icon">${isWin ? '⚡' : '⏱️'}</div>
                <h2 class="text-gradient fw-bold mb-1">Время вышло!</h2>
                <p class="text-secondary mb-3">Правильно: ${this.correctAnswers}/10</p>
                <div class="result-stats">
                    <div class="row g-3">
                        <div class="col-4">
                            <div class="result-stat">
                                <span class="result-value text-gradient">${this.correctAnswers}/10</span>
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