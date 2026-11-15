import { BaseMode } from './base.js';
import { auth, db, doc, runTransaction } from '../../../firebase-config.js';

export class SurvivalMode extends BaseMode {
    constructor() {
        super();
        this.type = 'survival';
        this.lives = 3;
        this.currentStreak = 0;
        this.bestStreak = 0;
    }
    
    async init(allQuestions, settings) {
        await super.init(allQuestions, settings);
        this.lives = 3;
        this.currentStreak = 0;
        this.bestStreak = 0;
    }
    
    getProgressText() {
        return `❤️ Жизни: ${this.lives} | 🔥 Серия: ${this.currentStreak} | Счёт: ${this.score}`;
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
        if (isCorrect) {
            this.currentStreak++;
            this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
        } else {
            this.currentStreak = 0;
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
        // Preserve the owner of this run across the asynchronous reward save.
        // The signed-in account may change before that request completes.
        const user = auth.currentUser;
        await this.saveResults();

        // A record is a maximum, not an accumulated number of correct answers.
        // Transaction keeps concurrent sessions from overwriting a better record.
        if (user && this.bestStreak > 0) {
            try {
                const userRef = doc(db, 'users', user.uid);
                await runTransaction(db, async transaction => {
                    const snapshot = await transaction.get(userRef);
                    if (!snapshot.exists()) return;
                    const previousBest = Number(snapshot.data()?.stats?.bestStreak) || 0;
                    if (this.bestStreak > previousBest) {
                        transaction.update(userRef, { 'stats.bestStreak': this.bestStreak });
                    }
                });
            } catch (error) {
                console.error('Не удалось сохранить рекорд серии:', error);
            }
        }

        this.showResults();
    }
    
    showResults() {
        if (this.isDisposed) return;
        const resultContainer = document.querySelector('.quiz-container');
        if (!resultContainer) return;
        const coinsEarned = this.earnedCoins;
        const streak = this.bestStreak;
        
        resultContainer.innerHTML = `
            <div class="quiz-result glass-card text-center animate-in">
                <div class="result-icon">${streak >= 20 ? '🔥' : streak >= 10 ? '💀' : '💪'}</div>
                <h2 class="text-gradient fw-bold mb-1">Выживание завершено!</h2>
                <p class="text-secondary mb-3">Лучшая серия: ${streak} подряд · Всего верных ответов: ${this.correctAnswers}/${Math.min(this.currentIndex, this.questions.length)}</p>
                <div class="result-stats">
                    <div class="row g-3">
                        <div class="col-4">
                            <div class="result-stat">
                                <span class="result-value text-gradient">${streak}</span>
                                <span class="result-label">Лучшая серия</span>
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
                ${this.getSaveStatusHTML()}
                <div class="mt-4 d-flex justify-content-center gap-3 flex-wrap">
                    <button class="btn-premium" onclick="window.navigateTo('home')">← В меню</button>
                    <button class="btn-gold" onclick="window.navigateTo('quiz')">Играть снова 🔄</button>
                </div>
            </div>
        `;
    }
}