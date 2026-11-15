import { getState } from '../../../store/state.js';
import { calculateQuizRewards } from '../rewards.js';
import { escapeHTML } from '../escape-html.js';
import { auth, db, doc, getDoc, updateDoc, increment } from '../../../firebase-config.js';

const CATEGORY_NAMES = {
    science: { ru: 'Наука', en: 'Science' },
    history: { ru: 'История', en: 'History' },
    sports: { ru: 'Спорт', en: 'Sports' },
    movies: { ru: 'Кино', en: 'Movies' },
    gaming: { ru: 'Видеоигры', en: 'Video Games' },
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
    science: '🔬', history: '📜', sports: '⚽', movies: '🎬', gaming: '🎮',
    geography: '🌍', technology: '💻', art: '🎨', music: '🎵',
    it: '🖥️', literature: '📖', food: '🍕', animals: '🦁', space: '🚀'
};

export class BaseMode {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
        this.score = 0;
        this.earnedCoins = 0;
        this.earnedXP = 0;
        this.saveStatus = 'pending';
        this.correctAnswers = 0;
        this.hasAnswered = false;
        this.isFinished = false;
        this.isDisposed = false;
        this.isTransitioning = false;
        this.resultsPromise = null;
        this.pendingTransition = null;
        this.type = 'base';
    }

    async init(allQuestions, settings) {
        // A reused mode must not receive callbacks from the previous run.
        if (this.pendingTransition !== null) {
            clearTimeout(this.pendingTransition);
            this.pendingTransition = null;
        }
        this.clearTimer?.();
        this.questions = this.shuffleArray([...allQuestions]);
        this.settings = settings;
        this.currentIndex = 0;
        this.score = 0;
        this.earnedCoins = 0;
        this.earnedXP = 0;
        this.saveStatus = 'pending';
        this.correctAnswers = 0;
        this.hasAnswered = false;
        this.isFinished = false;
        this.isDisposed = false;
        this.isTransitioning = false;
        this.resultsPromise = null;
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
                            <span class="text-secondary small">${catIcon} ${escapeHTML(catName)}</span>
                            <span class="text-gradient fw-bold">${this.score} очков</span>
                        </div>
                    </div>
                    ${this.renderProgressBar()}
                </div>
                
                <div class="quiz-question-card glass-card animate-in animate-in-delay-1">
                    ${this.renderModeSpecificHeader()}
                    <div class="quiz-question-kicker"><span class="quiz-kicker-dot" aria-hidden="true"></span>${isRU ? 'ВОПРОС РАУНДА' : 'ROUND QUESTION'}</div>
                    <h3 class="question-text">${escapeHTML(qText)}</h3>
                </div>
                
                <div class="quiz-answers animate-in animate-in-delay-2" id="answers-container">
                    ${shuffled.map((opt, i) => `
                        <div class="answer-card glass-card" role="button" tabindex="0" aria-pressed="false" data-index="${i}" data-correct="${opt.isCorrect}" onclick="window.${this.getAnswerHandler()}" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();window.${this.getAnswerHandler()}}">
                            <span class="answer-letter">${String.fromCharCode(65 + i)}</span>
                            <span class="answer-text">${escapeHTML(opt.text)}</span>
                            <span class="answer-icon"></span>
                        </div>
                    `).join('')}
                </div>
                
                <div id="answer-explanation" class="glass-card mt-3 animate-in" role="status" aria-live="polite" style="display:none;"></div>

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
        const container = document.getElementById('answers-container');
        // An old answer element can still dispatch a click after navigation.
        if (!el || !container?.contains(el)) return;
        if (this.isFinished || this.isTransitioning || this.hasAnswered || el.classList.contains('answered')) return;
        this.hasAnswered = true;
        const allCards = container.querySelectorAll('.answer-card');

        allCards.forEach(c => {
            c.classList.add('answered');
            c.setAttribute('aria-disabled', 'true');
        });
        el.classList.add('selected');
        el.setAttribute('aria-pressed', 'true');

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
        this.showAnswerExplanation();

        document.getElementById('next-btn-container').style.display = 'block';
        document.getElementById('next-btn-container').classList.add('animate-in');
    }

    onAnswer(isCorrect, points) { }

    showAnswerExplanation() {
        const panel = document.getElementById('answer-explanation');
        const question = this.getCurrentQuestion();
        if (!panel || !question) return;

        const isRU = getState().language !== 'en';
        const correctOption = (isRU ? question.optionsRU : question.optionsEN)?.[question.correctIndex];
        const explanation = isRU ? question.explanationRU : question.explanationEN;
        const title = isRU ? '💡 Разбор ответа' : '💡 Answer explained';
        const answerLabel = isRU ? 'Правильный ответ:' : 'Correct answer:';

        // Text content avoids interpreting question data as HTML.
        panel.replaceChildren();
        const heading = document.createElement('strong');
        heading.textContent = title;
        const answer = document.createElement('p');
        answer.className = 'mb-1 mt-2';
        answer.textContent = `${answerLabel} ${correctOption ?? ''}`;
        panel.append(heading, answer);
        if (explanation) {
            const detail = document.createElement('p');
            detail.className = 'text-secondary mb-0';
            detail.textContent = explanation;
            panel.append(detail);
        }
        panel.style.display = 'block';
    }

    async nextQuestion() {
        if (this.isFinished || this.isTransitioning || !this.hasAnswered) return;
        this.isTransitioning = true;
        this.currentIndex++;

        if (this.shouldEnd()) {
            this.isFinished = true;
            await this.finishQuiz();
            return;
        }

        const quizContainer = document.querySelector('.quiz-container');
        if (!quizContainer) return;
        quizContainer.style.opacity = '0';
        quizContainer.style.transform = 'translateY(20px)';
        quizContainer.style.transition = 'all 0.3s ease';

        this.pendingTransition = setTimeout(() => {
            this.pendingTransition = null;
            if (!quizContainer.isConnected || this.isFinished) return;
            // renderQuestion returns a whole .quiz-container; replace, do not nest it.
            quizContainer.outerHTML = this.renderQuestion(this.currentIndex);
            this.hasAnswered = false;
            this.isTransitioning = false;
            this.afterQuestionRendered();
        }, 300);
    }

    afterQuestionRendered() { }

    dispose() {
        this.isDisposed = true;
        this.isFinished = true;
        if (this.pendingTransition !== null) {
            clearTimeout(this.pendingTransition);
            this.pendingTransition = null;
        }
        this.clearTimer?.();
    }

    shouldEnd() {
        return this.currentIndex >= this.questions.length;
    }

    async finishQuiz() {
        this.isFinished = true;
    }

    getSaveStatusHTML() {
        const isEN = getState().language === 'en';
        const statuses = {
            saved: isEN ? '✅ Rewards saved to your profile.' : '✅ Награды сохранены в профиле.',
            failed: isEN ? '⚠️ Could not confirm the reward. Check your connection and profile before playing again.' : '⚠️ Не удалось подтвердить награду. Проверь соединение и профиль перед новой игрой.',
            guest: isEN ? 'ℹ️ Sign in to save rewards.' : 'ℹ️ Войди в аккаунт, чтобы сохранять награды.',
            saving: isEN ? '⏳ Saving rewards…' : '⏳ Сохраняем награды…'
        };
        const message = statuses[this.saveStatus] || '';
        return message ? `<p class="text-secondary small mt-3" role="status">${message}</p>` : '';
    }

    async saveResults(extraData = {}) {
        if (this.resultsPromise) return this.resultsPromise;
        this.resultsPromise = this.persistResults(extraData);
        return this.resultsPromise;
    }

    async persistResults(extraData = {}) {
        const user = auth.currentUser;
        if (!user) {
            this.saveStatus = 'guest';
            return false;
        }

        this.saveStatus = 'saving';
        let xpMultiplier = 1;
        let coinMultiplier = 1;
        try {
            const eventsModule = await import('../../events/events-data.js');
            const multipliers = eventsModule.getMultipliers();
            xpMultiplier = multipliers.xpMultiplier;
            coinMultiplier = multipliers.coinMultiplier;
        } catch (error) {
            console.warn('Не удалось загрузить бонусы событий:', error);
        }

        const { xp: totalXP, coins: totalCoins } = calculateQuizRewards(this.score, {
            xpMultiplier, coinMultiplier
        });
        const userRef = doc(db, 'users', user.uid);

        // Keep a single, non-retried write per session. A client-side retry of
        // increment() can duplicate rewards if the first request did commit.
        try {
            await updateDoc(userRef, {
                experience: increment(totalXP),
                weeklyExperience: increment(totalXP),
                coins: increment(totalCoins),
                quizzesCompleted: increment(1),
                'stats.totalGames': increment(1),
                'stats.totalQuestions': increment(Math.min(this.currentIndex, this.questions.length)),
                'stats.correctAnswers': increment(this.correctAnswers),
                ...extraData
            });
        } catch (error) {
            this.saveStatus = 'failed';
            console.error('Не удалось подтвердить сохранение награды:', error);
            return false;
        }

        // A successful reward write remains successful even when secondary
        // profile-level calculations or achievements fail.
        this.earnedXP = totalXP;
        this.earnedCoins = totalCoins;
        this.saveStatus = 'saved';

        try {
            const userDoc = await getDoc(userRef);
            const data = userDoc.data() || {};
            const newLevel = Math.floor((data.experience || 0) / 100) + 1;
            if (newLevel > (data.level || 1)) {
                await updateDoc(userRef, { level: newLevel });
            }
        } catch (error) {
            console.warn('Награда сохранена, но уровень не обновлён:', error);
        }

        try {
            const achModule = await import('../../achievements/achievements.js');
            await achModule.checkAchievements();
        } catch (error) {
            console.warn('Награда сохранена, но достижения не проверены:', error);
        }

        return true;
    }
}
