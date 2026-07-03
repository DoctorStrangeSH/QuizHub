import { getState } from '../../../store/state.js';
import { auth, db, doc, getDoc, updateDoc, increment } from '../../../firebase-config.js';

const CATEGORY_NAMES = {
    science: { ru: 'Наука', en: 'Science' },
    history: { ru: 'История', en: 'History' },
    sports: { ru: 'Спорт', en: 'Sports' },
    movies: { ru: 'Кино', en: 'Movies' },
    geography: { ru: 'География', en: 'Geography' },
    technology: { ru: 'Технологии', en: 'Technology' },
    art: { ru: 'Искусство', en: 'Art' },
    music: { ru: 'Музыка', en: 'Music' },
    it: { ru: 'IT', en: 'IT' },
    literature: { ru: 'Литература', en: 'Literature' },
    food: { ru: 'Еда', en: 'Food' },
    animals: { ru: 'Животные', en: 'Animals' },
    space: { ru: 'Космос', en: 'Space' }
};

const CATEGORY_ICONS = {
    science: '🔬', history: '📜', sports: '⚽', movies: '🎬',
    geography: '🌍', technology: '💻', art: '🎨', music: '🎵',
    it: '🖥️', literature: '📖', food: '🍕', animals: '🦁', space: '🚀'
};

export class BaseMode {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.isFinished = false;
        this.type = 'base';
    }

    async init(allQuestions, settings) {
        this.questions = this.shuffleArray([...allQuestions]);
        this.settings = settings;
        this.currentIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.isFinished = false;
    }

    shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    getCategoryName(cat, lang) {
        return CATEGORY_NAMES[cat]?.[lang] || cat;
    }

    getCategoryIcon(cat) {
        return CATEGORY_ICONS[cat] || '📚';
    }

    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }

    renderQuestion(index) {
        const question = this.questions[index];
        const lang = getState().language;
        const isRU = lang === 'ru';

        const qText = isRU ? question.questionRU : question.questionEN;
        const options = isRU ? question.optionsRU : question.optionsEN;

        const shuffled = this.shuffleArray(
            options.map((text, i) => ({ text, isCorrect: i === question.correctIndex }))
        );

        const catName = this.getCategoryName(question.category, lang);
        const catIcon = this.getCategoryIcon(question.category);

        return `
            <div class="quiz-container">
                <div class="quiz-progress glass-card animate-in">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="text-secondary">${this.getProgressText()}</span>
                        <div class="d-flex align-items-center gap-3">
                            <span class="text-secondary small">${catIcon} ${catName}</span>
                            <span class="text-gradient fw-bold">${this.score} очков</span>
                        </div>
                    </div>
                    ${this.renderProgressBar()}
                </div>
                
                <div class="quiz-question-card glass-card animate-in animate-in-delay-1">
                    ${this.renderModeSpecificHeader()}
                    <h3 class="question-text">${qText}</h3>
                </div>
                
                <div class="quiz-answers animate-in animate-in-delay-2" id="answers-container">
                    ${shuffled.map((opt, i) => `
                        <div class="answer-card glass-card" data-index="${i}" data-correct="${opt.isCorrect}" onclick="window.${this.getAnswerHandler()}">
                            <span class="answer-letter">${String.fromCharCode(65 + i)}</span>
                            <span class="answer-text">${opt.text}</span>
                            <span class="answer-icon"></span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="text-center mt-4" id="next-btn-container" style="display:none;">
                    <button class="btn-premium btn-next" onclick="window.nextQuestion()">${this.getNextButtonText()}</button>
                </div>
            </div>
        `;
    }

    getProgressText() { return `Вопрос ${this.currentIndex + 1}`; }
    renderProgressBar() { return ''; }
    renderModeSpecificHeader() { return ''; }
    getAnswerHandler() { return 'selectAnswer(this)'; }
    getNextButtonText() { return 'Далее →'; }

    handleAnswer(el) {
        if (el.classList.contains('answered')) return;

        const container = document.getElementById('answers-container');
        const allCards = container.querySelectorAll('.answer-card');

        allCards.forEach(c => c.classList.add('answered'));
        el.classList.add('selected');

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

        const isCorrect = el.dataset.correct === 'true';
        const points = this.questions[this.currentIndex].points;

        if (isCorrect) {
            this.score += points;
            this.correctAnswers++;
        }

        this.onAnswer(isCorrect, points);

        document.getElementById('next-btn-container').style.display = 'block';
        document.getElementById('next-btn-container').classList.add('animate-in');
    }

    onAnswer(isCorrect, points) { }

    async nextQuestion() {
        if (this.isFinished) return;
        this.currentIndex++;

        if (this.shouldEnd()) {
            await this.finishQuiz();
            return;
        }

        const quizContainer = document.querySelector('.quiz-container');
        quizContainer.style.opacity = '0';
        quizContainer.style.transform = 'translateY(20px)';
        quizContainer.style.transition = 'all 0.3s ease';

        setTimeout(() => {
            quizContainer.innerHTML = this.renderQuestion(this.currentIndex);
            quizContainer.style.opacity = '1';
            quizContainer.style.transform = 'translateY(0)';
        }, 300);
    }

    shouldEnd() {
        return this.currentIndex >= this.questions.length;
    }

    async finishQuiz() {
        this.isFinished = true;
    }

    async saveResults(extraData = {}) {
        const user = auth.currentUser;
        if (!user) return;

        let xpMultiplier = 1;
        let coinMultiplier = 1;
        try {
            const eventsModule = await import('../../events/events-data.js');
            const multipliers = eventsModule.getMultipliers();
            xpMultiplier = multipliers.xpMultiplier;
            coinMultiplier = multipliers.coinMultiplier;
        } catch (e) { }

        const totalXP = Math.floor(this.score * xpMultiplier);
        const totalCoins = Math.floor((this.score / 2) * coinMultiplier);

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                experience: increment(totalXP),
                weeklyExperience: increment(totalXP),  // 🔥 ДОБАВЛЕНО
                coins: increment(totalCoins),
                quizzesCompleted: increment(1),
                'stats.totalGames': increment(1),
                'stats.totalQuestions': increment(this.correctAnswers + (this.currentIndex + 1 - this.correctAnswers)),
                'stats.correctAnswers': increment(this.correctAnswers),
                ...extraData
            });

            const userDoc = await getDoc(userRef);
            const data = userDoc.data();
            const newLevel = Math.floor((data.experience || 0) / 100) + 1;
            if (newLevel > (data.level || 1)) {
                await updateDoc(userRef, { level: newLevel });
            }

            try {
                const achModule = await import('../../achievements/achievements.js');
                await achModule.checkAchievements();
            } catch (e) { }

        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }
}