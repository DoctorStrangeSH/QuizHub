// ============================================
// QuizHub — Режим "Выживание" v2.1 (рефакторинг)
// ============================================

let survivalLives = 3;
let survivalMaxLives = 5;
let survivalQuestionNumber = 0;
let survivalDifficultyLevel = 1;
let survivalMode = false;
let survivalCombo = 0;
let survivalBestCombo = 0;

async function startSurvivalMode() {
    const nameInput = document.getElementById('player-name');
    if (!nameInput?.value?.trim()) {
        nameInput?.focus();
        showToast('Введи своё имя!', 'warning');
        return;
    }

    survivalLives = 3;
    survivalQuestionNumber = 0;
    survivalDifficultyLevel = 1;
    survivalMode = true;
    survivalCombo = 0;
    survivalBestCombo = 0;
    correctAnswersCount = 0;
    score = 0;

    const data = typeof loadRussianQuestions === 'function' ? await loadRussianQuestions() : null;
    if (data?.questions) {
        quizQuestions = shuffleArray([...data.questions]).slice(0, 100);
    } else {
        quizQuestions = await fetchQuestions('any', 'any', 100);
    }

    if (quizQuestions.length === 0) {
        showToast('Не удалось загрузить вопросы', 'danger');
        showScreen('home');
        return;
    }

    currentQuestionIndex = 0;
    QUIZ_SETTINGS.totalQuestions = 999;
    QUIZ_SETTINGS.timePerQuestion = 15;

    showScreen('quiz');
    renderSurvivalScreen();
    startTimer();

    EventBus.emit(EVENTS.QUIZ_STARTED);
}

function renderSurvivalScreen() {
    const screen = document.getElementById('screen-quiz');
    if (!screen || quizQuestions.length === 0) return;

    const question = quizQuestions[currentQuestionIndex];
    screen.innerHTML = I18N_TEMPLATES.survivalScreen(
        question,
        survivalQuestionNumber,
        survivalLives,
        survivalMaxLives,
        survivalDifficultyLevel,
        survivalCombo,
        score,
        QUIZ_SETTINGS.timePerQuestion
    );

    document.querySelectorAll('.btn-answer').forEach(btn => {
        btn.addEventListener('click', function() { handleSurvivalAnswer(parseInt(this.dataset.index)); });
    });
}

function handleSurvivalAnswer(selectedIndex) {
    clearInterval(timerInterval);

    const question = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctIndex;

    document.querySelectorAll('.btn-answer').forEach((btn, i) => {
        btn.disabled = true;
        if (i === question.correctIndex) {
            btn.classList.add('correct');
            if (typeof showCorrectGlow === 'function') showCorrectGlow(btn);
        }
        if (i === selectedIndex && !isCorrect) {
            btn.classList.add('wrong');
            if (typeof playWrongSound === 'function') playWrongSound();
        }
    });

    if (isCorrect) {
        survivalCombo++;
        if (survivalCombo > survivalBestCombo) survivalBestCombo = survivalCombo;

        const comboTimes = Math.floor(survivalCombo / 3) + 1;
        score += 10 * comboTimes * survivalDifficultyLevel;

        if (survivalCombo % 5 === 0 && survivalLives < survivalMaxLives) {
            survivalLives++;
            showToast('+1 ❤️!', 'success');
        }

        if (survivalCombo % 3 === 0) {
            survivalDifficultyLevel = Math.min(survivalDifficultyLevel + 1, 10);
            QUIZ_SETTINGS.timePerQuestion = Math.max(5, 15 - survivalDifficultyLevel);
        }

        if (typeof playCorrectSound === 'function') playCorrectSound();
    } else {
        survivalCombo = 0;
        survivalLives--;
        survivalDifficultyLevel = Math.max(1, survivalDifficultyLevel - 1);
        QUIZ_SETTINGS.timePerQuestion = Math.max(5, 15 - survivalDifficultyLevel);

        if (survivalLives <= 0) {
            setTimeout(() => finishSurvivalMode(), 1000);
            return;
        }

        showToast(`${survivalLives} ❤️ осталось!`, 'warning');
    }

    survivalQuestionNumber++;

    setTimeout(() => {
        currentQuestionIndex++;
        renderSurvivalScreen();
        startTimer();
    }, isCorrect ? 600 : 1500);
}

async function finishSurvivalMode() {
    clearInterval(timerInterval);
    survivalMode = false;

    const result = {
        playerName: document.getElementById('player-name')?.value?.trim() || 'Гость',
        score: score,
        totalTime: 0,
        correctAnswers: survivalQuestionNumber - (3 - Math.max(0, survivalLives)),
        difficulty: 'survival',
        category: typeof t === 'function' ? t('survivalMode') : 'Выживание',
        date: new Date().toISOString(),
        userId: typeof currentUser !== 'undefined' ? currentUser?.uid : null
    };

    if (typeof isOnline !== 'undefined' && isOnline) {
        if (typeof saveResult === 'function') await saveResult(result);
    }

    const coins = Math.floor(score / 10);
    if (typeof addCoins === 'function') addCoins(coins);

    showScreen('result');

    const screen = document.getElementById('screen-result');
    if (screen) {
        screen.innerHTML = I18N_TEMPLATES.survivalResult(score, survivalQuestionNumber, survivalBestCombo, coins);
    }

    EventBus.emit(EVENTS.QUIZ_FINISHED, result);
}