import { BaseMode } from './base.js';
import { getState } from '../../../store/state.js';
import { increment } from '../../../firebase-config.js';

export class DuelMode extends BaseMode {
    constructor() {
        super();
        this.type = 'duel';
        this.totalQuestions = 7;
        this.playerScore = 0;
        this.aiScore = 0;
        this.playerCorrect = 0;
        this.aiCorrect = 0;
        this.currentRound = 0;
    }
    
    async init(allQuestions, settings) {
        await super.init(allQuestions, settings);
        this.questions = this.questions.slice(0, this.totalQuestions);
        this.totalQuestions = this.questions.length;
        this.playerScore = 0;
        this.aiScore = 0;
        this.playerCorrect = 0;
        this.aiCorrect = 0;
        this.currentRound = 0;
    }
    
    getAnswerHandler() {
        return 'duelAnswer(this)';
    }
    
    getProgressText() {
        return `⚔️ Раунд ${this.currentRound + 1}/${this.totalQuestions}`;
    }
    
    renderProgressBar() {
        return `
            <div class="duel-score-bar">
                <div class="duel-player">
                    <span>😎 Вы</span>
                    <span class="duel-score">${this.playerScore}</span>
                </div>
                <div class="duel-vs">VS</div>
                <div class="duel-ai">
                    <span>🤖 ИИ</span>
                    <span class="duel-score">${this.aiScore}</span>
                </div>
            </div>
        `;
    }
    
    renderModeSpecificHeader() {
        return `
            <div class="mode-badge duel-badge">⚔️ Дуэль с ИИ</div>
        `;
    }
    
    getNextButtonText() {
        return this.currentRound < this.totalQuestions - 1 ? 'Следующий раунд →' : 'Завершить дуэль 🏁';
    }
    
    handlePlayerAnswer(el) {
        if (this.isFinished || this.isTransitioning || this.hasAnswered || el.classList.contains('answered')) return;
        this.hasAnswered = true;
        
        const container = document.getElementById('answers-container');
        const allCards = container.querySelectorAll('.answer-card');
        
        allCards.forEach(c => c.classList.add('answered'));
        el.classList.add('selected');
        
        // Показываем правильный ответ
        allCards.forEach(c => {
            const icon = c.querySelector('.answer-icon');
            if (c.dataset.correct === 'true') {
                c.classList.add('correct');
                icon.textContent = '✓';
            } else if (c === el && c.dataset.correct !== 'true') {
                c.classList.add('wrong');
                icon.textContent = '✗';
            }
        });
        
        this.showAnswerExplanation();

        // Игрок ответил
        const playerCorrect = el.dataset.correct === 'true';
        const points = this.questions[this.currentRound].points;
        
        if (playerCorrect) {
            this.playerScore += points;
            this.playerCorrect++;
        }
        
        // ИИ отвечает (с заданной вероятностью)
        const difficulty = getState().gameSettings?.difficulty || 'easy';
        const aiChance = difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.6 : 0.8;
        const aiCorrect = Math.random() < aiChance;
        
        if (aiCorrect) {
            this.aiScore += points;
            this.aiCorrect++;
        }
        
        // Avoid orphaned callbacks after leaving the quiz.
        this.roundResultTimeout = setTimeout(() => {
            this.roundResultTimeout = null;
            if (!this.isFinished && document.getElementById('answers-container')) {
                this.showRoundResult(playerCorrect, aiCorrect);
            }
        }, 500);
    }
    
    showRoundResult(playerCorrect, aiCorrect) {
        const nextContainer = document.getElementById('next-btn-container');
        nextContainer.style.display = 'block';
        nextContainer.classList.add('animate-in');
        
        // Показываем результат раунда
        const resultDiv = document.createElement('div');
        resultDiv.className = 'duel-round-result glass-card animate-in mt-3';
        resultDiv.innerHTML = `
            <div class="d-flex justify-content-around align-items-center">
                <div class="text-center">
                    <span class="duel-result-icon">😎</span>
                    <span class="d-block ${playerCorrect ? 'text-success' : 'text-danger'}">
                        ${playerCorrect ? '✓ Верно' : '✗ Мимо'}
                    </span>
                </div>
                <span class="text-secondary">VS</span>
                <div class="text-center">
                    <span class="duel-result-icon">🤖</span>
                    <span class="d-block ${aiCorrect ? 'text-success' : 'text-danger'}">
                        ${aiCorrect ? '✓ Верно' : '✗ Мимо'}
                    </span>
                </div>
            </div>
        `;
        
        document.getElementById('answers-container').after(resultDiv);
    }
    
    dispose() {
        super.dispose();
        if (this.roundResultTimeout) clearTimeout(this.roundResultTimeout);
    }

    async nextQuestion() {
        if (this.isFinished || this.isTransitioning || !this.hasAnswered) return;
        this.currentRound = this.currentIndex + 1;
        await super.nextQuestion();
    }

    shouldEnd() {
        return this.currentIndex >= this.questions.length;
    }
    
    async finishQuiz() {
        const playerWon = this.playerScore > this.aiScore;
        const isDraw = this.playerScore === this.aiScore;
        
        // Награды и статистика в BaseMode используют общие поля score/correctAnswers.
        this.score = this.playerScore;
        this.correctAnswers = this.playerCorrect;

        await this.saveResults({
            wins: increment(playerWon ? 1 : 0),
            'stats.totalWins': increment(playerWon ? 1 : 0)
        });
        
        this.showResults(playerWon, isDraw);
    }
    
    showResults(playerWon, isDraw) {
        if (this.isDisposed) return;
        const resultContainer = document.querySelector('.quiz-container');
        if (!resultContainer) return;
        const coinsEarned = Math.floor((this.playerScore) / 2);
        
        let emoji, title;
        if (isDraw) { emoji = '🤝'; title = 'Ничья!'; }
        else if (playerWon) { emoji = '🏆'; title = 'Победа!'; }
        else { emoji = '🤖'; title = 'ИИ победил!'; }
        
        resultContainer.innerHTML = `
            <div class="quiz-result glass-card text-center animate-in">
                <div class="result-icon">${emoji}</div>
                <h2 class="text-gradient fw-bold mb-1">${title}</h2>
                <div class="duel-final-score mt-3">
                    <div class="d-flex justify-content-center align-items-center gap-4">
                        <div class="text-center">
                            <span class="fs-3">😎</span>
                            <h3 class="text-gradient">${this.playerScore}</h3>
                            <span class="text-secondary small">Вы (${this.playerCorrect}/${this.totalQuestions})</span>
                        </div>
                        <span class="fs-3 text-secondary">:</span>
                        <div class="text-center">
                            <span class="fs-3">🤖</span>
                            <h3 class="text-gold">${this.aiScore}</h3>
                            <span class="text-secondary small">ИИ (${this.aiCorrect}/${this.totalQuestions})</span>
                        </div>
                    </div>
                </div>
                <p class="mt-3">+${coinsEarned} 🪙</p>
                <div class="mt-4 d-flex justify-content-center gap-3 flex-wrap">
                    <button class="btn-premium" onclick="window.navigateTo('home')">← В меню</button>
                    <button class="btn-gold" onclick="window.navigateTo('quiz')">Реванш 🔄</button>
                </div>
            </div>
        `;
    }
}