// ============================================
// QuizHub — Логика квиза v4.2
// ============================================

let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 15;
let totalTimeSpent = 0;
let quizStartTime = 0;
let currentStreak = 0;
let maxStreak = 0;
let fastestAnswer = 999;
let timedMode = false;
let globalTimeLeft = 60;
let correctAnswersCount = 0;

const QUIZ_SETTINGS = { totalQuestions: 10, timePerQuestion: 15, maxScore: 100 };

async function fetchQuestions(category, difficulty, count = 10) {
    if (AppState.get('settings.locale') === 'en') {
        if (typeof fetchEnglishQuestions === 'function') return await fetchEnglishQuestions(category, difficulty);
    }
    if (typeof loadRussianQuestions === 'function') {
        const data = await loadRussianQuestions();
        if (data?.questions?.length > 0) {
            const q = typeof getLocalQuestionsFromJSON === 'function' ? getLocalQuestionsFromJSON(data, category, difficulty, count) : [];
            if (q.length > 0) return q;
        }
    }
    showToast('Ошибка загрузки вопросов', 'danger');
    return [];
}

async function startQuiz() {
    const category = AppState.get('settings.category');
    const difficulty = AppState.get('settings.difficulty');

    showLoadingScreen();

    QUIZ_SETTINGS.totalQuestions = 10;
    QUIZ_SETTINGS.timePerQuestion = 15;
    quizQuestions = await fetchQuestions(category, difficulty, 10);

    if (quizQuestions.length === 0) {
        showToast('Не удалось загрузить вопросы', 'danger');
        showScreen('home');
        return;
    }

    currentQuestionIndex = 0;
    score = 0;
    totalTimeSpent = 0;
    currentStreak = 0;
    maxStreak = 0;
    fastestAnswer = 999;
    timedMode = false;
    correctAnswersCount = 0;

    showScreen('quiz');
    renderQuizScreen();
    startTimer();
    quizStartTime = Date.now();

    EventBus.emit(EVENTS.QUIZ_STARTED);
}

function showLoadingScreen() {
    const screen = document.getElementById('screen-quiz');
    if (screen) {
        screen.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-accent mb-3" style="width:3rem;height:3rem;"></div><p class="text-muted">Загружаем вопросы...</p></div>`;
    }
    showScreen('quiz');
}

function renderQuizScreen() {
    const screen = document.getElementById('screen-quiz');
    if (!screen || quizQuestions.length === 0) return;

    const question = quizQuestions[currentQuestionIndex];
    screen.innerHTML = I18N_TEMPLATES.quizScreen(
        question, currentQuestionIndex, QUIZ_SETTINGS.totalQuestions,
        score, timeLeft, QUIZ_SETTINGS.timePerQuestion
    );

    document.querySelectorAll('.btn-answer').forEach(btn => {
        btn.addEventListener('click', function() { handleAnswer(parseInt(this.dataset.index)); });
    });
    document.getElementById('skip-question')?.addEventListener('click', skipQuestion);

    setTimeout(() => { if (typeof addVoiceButton === 'function') addVoiceButton(); }, 100);

    if (typeof saveQuizProgress === 'function') {
        saveQuizProgress({
            currentQuestionIndex, score, currentStreak, maxStreak,
            fastestAnswer, correctAnswersCount, timeLeft,
            difficulty: AppState.get('settings.difficulty'),
            category: AppState.get('settings.category'),
            questions: quizQuestions,
            totalQuestions: QUIZ_SETTINGS.totalQuestions,
            timestamp: Date.now()
        });
    }
}

function startTimer(initialTimeLeft) {
    if (typeof initialTimeLeft === 'number' && initialTimeLeft > 0) {
        timeLeft = initialTimeLeft;
    } else {
        timeLeft = QUIZ_SETTINGS.timePerQuestion;
    }
    updateTimerDisplay();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) { clearInterval(timerInterval); handleTimeout(); }
    }, 1000);
}

function updateTimerDisplay() {
    const circle = document.getElementById('timer-progress-circle');
    const display = document.getElementById('timer-display');
    if (circle) {
        const c = 2 * Math.PI * 36;
        circle.style.strokeDashoffset = c * (1 - timeLeft / QUIZ_SETTINGS.timePerQuestion);
        circle.classList.toggle('danger', timeLeft <= 5);
    }
    if (display) display.textContent = timeLeft;
    if (timeLeft <= 5 && timeLeft > 0 && typeof playTickSound === 'function') playTickSound();
}

function handleTimeout() {
    const q = quizQuestions[currentQuestionIndex];
    document.querySelectorAll('.btn-answer').forEach((b, i) => { b.disabled = true; if (i === q.correctIndex) b.classList.add('correct'); });
    currentStreak = 0;
    setTimeout(goToNextQuestion, 2000);
}

function handleAnswer(selectedIndex) {
    clearInterval(timerInterval);
    const q = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === q.correctIndex;
    const answerTime = QUIZ_SETTINGS.timePerQuestion - timeLeft;

    document.querySelectorAll('.btn-answer').forEach((b, i) => {
        b.disabled = true;
        if (i === q.correctIndex) { b.classList.add('correct'); if (typeof showCorrectGlow === 'function') showCorrectGlow(b); }
        if (i === selectedIndex && !isCorrect) { b.classList.add('wrong'); if (typeof playWrongSound === 'function') playWrongSound(); if (typeof vibrateWrong === 'function') vibrateWrong(); }
    });

    if (isCorrect) {
        correctAnswersCount++;
        if (typeof playCorrectSound === 'function') playCorrectSound();
        if (typeof vibrateCorrect === 'function') vibrateCorrect();
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
        if (answerTime < fastestAnswer) fastestAnswer = answerTime;
        const tb = Math.floor(timeLeft / QUIZ_SETTINGS.timePerQuestion * 5);
        const m = { easy: 1, medium: 1.5, hard: 2 }[q.difficulty] || 1;
        score += Math.floor((10 + tb) * m);
    } else { currentStreak = 0; }

    totalTimeSpent += answerTime;
    setTimeout(goToNextQuestion, isCorrect ? 800 : 2000);
}

function skipQuestion() { clearInterval(timerInterval); currentStreak = 0; goToNextQuestion(); }
function goToNextQuestion() { currentQuestionIndex++; if (currentQuestionIndex < QUIZ_SETTINGS.totalQuestions) { renderQuizScreen(); startTimer(); } else { finishQuiz(); } }

async function finishQuiz() {
    clearInterval(timerInterval);

    if (!quizStartTime || quizStartTime === 0) quizStartTime = Date.now() - 30000;
    let totalTime = Math.floor((Date.now() - quizStartTime) / 1000);
    if (totalTime < 0) totalTime = 0;
    if (totalTime > 3600) totalTime = 60;

    const actualCorrect = correctAnswersCount;
    console.log(`📊 Квиз завершён: ${score} очков, ${actualCorrect}/${QUIZ_SETTINGS.totalQuestions} правильно, ${totalTime}с`);

    const category = document.getElementById('quiz-category');
    const categoryText = category?.options[category.selectedIndex]?.text || 'Любая';

    const result = {
        playerName: document.getElementById('player-name')?.value?.trim() || 'Гость',
        score: score, totalTime: totalTime, correctAnswers: actualCorrect,
        difficulty: AppState.get('settings.difficulty'), category: categoryText,
        date: new Date().toISOString(),
        userId: typeof currentUser !== 'undefined' ? currentUser?.uid : null
    };

    if (typeof isOnline !== 'undefined' && isOnline) { if (typeof saveResult === 'function') await saveResult(result); }
    else if (typeof saveResultOffline === 'function') await saveResultOffline(result);

    localStorage.removeItem('quizhub-quiz-progress');
    showScreen('result');
    renderResultScreen(result);
    EventBus.emit(EVENTS.QUIZ_FINISHED, result);

    if (typeof currentUser !== 'undefined' && currentUser) {
        if (typeof updateStats === 'function') updateStats(result);
        if (typeof checkAchievements === 'function') checkAchievements(result);
        if (typeof awardQuizCoins === 'function') awardQuizCoins(result);
        if (typeof saveUserDataToFirestore === 'function') saveUserDataToFirestore();
    }

    if (typeof saveScoreToHistory === 'function') saveScoreToHistory(result.score);

    // Новая система квестов
    if (typeof updateQuestProgress === 'function') {
        updateQuestProgress('quizzes', 1);
        if (result.score >= 50) updateQuestProgress('score_50');
        if (result.score >= 100) updateQuestProgress('score_100');
        if (actualCorrect === 10) updateQuestProgress('perfect');
        if (result.difficulty === 'hard') updateQuestProgress('hard_quiz');
        if (maxStreak >= 5) updateQuestProgress('streak_5');
        if (result.totalTime < 60) updateQuestProgress('fast_quiz');
        updateQuestProgress('xp', AppState.get('stats').totalXP || 0);
        updateQuestProgress('coins', AppState.get('coins'));
        updateQuestProgress('categories', 1);
        updateQuestProgress('difficulties', 1);
        if (typeof selectedLanguage !== 'undefined' && selectedLanguage === 'en') updateQuestProgress('english');
        const catValue = category?.value || '';
        if (catValue === 'cinema' || categoryText.includes('Кино')) updateQuestProgress('category_cinema');
        if (catValue === 'sport' || categoryText.includes('Спорт')) updateQuestProgress('category_sport');
        if (catValue === 'science' || categoryText.includes('Наука')) updateQuestProgress('category_science');
    }

    if (result.score >= 70 && typeof vibrateAchievement === 'function') vibrateAchievement();
}

function renderResultScreen(result) {
    const screen = document.getElementById('screen-result');
    if (!screen) return;
    const grade = getGrade(result.score);
    if (result.score >= 70) { if (typeof spawnConfettiAdvanced === 'function') spawnConfettiAdvanced(80); if (typeof playFanfareSound === 'function') playFanfareSound(); }
    screen.innerHTML = I18N_TEMPLATES.quizResult(result, grade);
    document.getElementById('view-leaderboard')?.addEventListener('click', () => { showScreen('leaderboard'); if (typeof loadLeaderboard === 'function') loadLeaderboard(); });
}

function checkSavedQuiz() {
    if (typeof getQuizProgress !== 'function') return;
    const saved = getQuizProgress();
    if (!saved) return;
    const age = (Date.now() - saved.timestamp) / 1000;
    if (age > 1800) { localStorage.removeItem('quizhub-quiz-progress'); return; }

    if (saved.questions && saved.questions.length > 0) {
        quizQuestions = saved.questions;
        currentQuestionIndex = saved.currentQuestionIndex || 0;
        score = saved.score || 0;
        currentStreak = saved.currentStreak || 0;
        maxStreak = saved.maxStreak || 0;
        fastestAnswer = saved.fastestAnswer || 999;
        correctAnswersCount = saved.correctAnswersCount || 0;
        timeLeft = Math.max(1, (saved.timeLeft || 15) - Math.floor(age));
        QUIZ_SETTINGS.totalQuestions = saved.totalQuestions || quizQuestions.length;
        QUIZ_SETTINGS.timePerQuestion = 15;
        showScreen('quiz'); renderQuizScreen(); startTimer();
        if (typeof saveQuizProgress === 'function') {
            saveQuizProgress({
                currentQuestionIndex, score, currentStreak, maxStreak,
                fastestAnswer, correctAnswersCount, timeLeft,
                difficulty: AppState.get('settings.difficulty'),
                category: AppState.get('settings.category'),
                questions: quizQuestions,
                totalQuestions: QUIZ_SETTINGS.totalQuestions,
                timestamp: Date.now()
            });
        }
        return;
    }

    currentQuestionIndex = saved.currentQuestionIndex || 0;
    score = saved.score || 0;
    currentStreak = saved.currentStreak || 0;
    maxStreak = saved.maxStreak || 0;
    fastestAnswer = saved.fastestAnswer || 999;
    correctAnswersCount = saved.correctAnswersCount || 0;
    timeLeft = Math.max(1, (saved.timeLeft || 15) - Math.floor(age));
    fetchQuestions(saved.category || 'any', saved.difficulty || 'easy', 10).then(qs => {
        if (qs.length > 0) { quizQuestions = qs; QUIZ_SETTINGS.totalQuestions = 10; QUIZ_SETTINGS.timePerQuestion = 15; showScreen('quiz'); renderQuizScreen(); startTimer(); }
    });
}

async function startTimedMode() { const n = document.getElementById('player-name')?.value?.trim(); if (!n) { showToast('Введи имя!', 'warning'); return; } timedMode = true; correctAnswersCount = 0; QUIZ_SETTINGS.totalQuestions = 999; QUIZ_SETTINGS.timePerQuestion = 999; globalTimeLeft = 60; quizQuestions = await fetchQuestions('any', 'any', 100); if (quizQuestions.length === 0) { showScreen('home'); return; } currentQuestionIndex = 0; score = 0; maxStreak = 0; showScreen('quiz'); renderTimedModeScreen(); startGlobalTimer(); quizStartTime = Date.now(); }
function renderTimedModeScreen() { const s = document.getElementById('screen-quiz'); if (!s || quizQuestions.length === 0) return; const q = quizQuestions[currentQuestionIndex]; s.innerHTML = I18N_TEMPLATES.timedScreen(q, currentQuestionIndex, score, globalTimeLeft); document.querySelectorAll('.btn-answer').forEach(b => b.addEventListener('click', function() { handleTimedAnswer(parseInt(this.dataset.index)); })); }
function startGlobalTimer() { updateGlobalTimerDisplay(); clearInterval(timerInterval); timerInterval = setInterval(() => { globalTimeLeft--; updateGlobalTimerDisplay(); if (globalTimeLeft <= 0) { clearInterval(timerInterval); finishTimedMode(); } }, 1000); }
function updateGlobalTimerDisplay() { const d = document.getElementById('global-timer'), c = document.querySelector('.timer-circle'); if (d) d.textContent = globalTimeLeft; if (c) c.classList.toggle('timer-danger', globalTimeLeft <= 10); }
function handleTimedAnswer(i) { const q = quizQuestions[currentQuestionIndex]; const ok = i === q.correctIndex; document.querySelectorAll('.btn-answer').forEach((b, j) => { b.disabled = true; if (j === q.correctIndex) { b.classList.add('correct'); if (typeof showCorrectGlow === 'function') showCorrectGlow(b); } if (j === i && !ok) { b.classList.add('wrong'); if (typeof playWrongSound === 'function') playWrongSound(); } }); if (ok) { correctAnswersCount++; if (typeof playCorrectSound === 'function') playCorrectSound(); score += 10; } setTimeout(() => { currentQuestionIndex++; renderTimedModeScreen(); }, ok ? 500 : 1000); }
async function finishTimedMode() { clearInterval(timerInterval); timedMode = false; const r = { playerName: document.getElementById('player-name')?.value?.trim() || 'Гость', score, totalTime: 60, correctAnswers: correctAnswersCount, difficulty: 'timed', category: typeof t === 'function' ? t('timedMode') : 'На время', date: new Date().toISOString(), userId: typeof currentUser !== 'undefined' ? currentUser?.uid : null }; if (typeof isOnline !== 'undefined' && isOnline) { if (typeof saveResult === 'function') await saveResult(r); } showScreen('result'); const s = document.getElementById('screen-result'); if (s) s.innerHTML = I18N_TEMPLATES.timedResult(r.score); }