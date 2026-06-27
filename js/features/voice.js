// ============================================
// QuizHub — Голосовой ввод v2.0
// ============================================

let recognition = null;
let isListening = false;

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.log('Speech Recognition не поддерживается');
        return false;
    }

    recognition = new SpeechRecognition();
    const lang = typeof AppState !== 'undefined' ? AppState.get('settings.locale') : 'ru';
    recognition.lang = lang === 'en' ? 'en-US' : 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        const confidence = event.results[0][0].confidence;

        console.log(`Распознано: "${transcript}" (${Math.round(confidence * 100)}%)`);

        const question = typeof quizQuestions !== 'undefined' ? quizQuestions[currentQuestionIndex] : null;
        if (!question) return;

        const buttons = document.querySelectorAll('.btn-answer:not(:disabled)');
        let bestMatch = -1;
        let bestScore = 0;

        buttons.forEach((btn, i) => {
            const answerText = btn.querySelector('.answer-text')?.textContent.toLowerCase().trim() || '';
            const score = calculateMatchScore(transcript, answerText);

            if (score > bestScore && score > 0.3) {
                bestScore = score;
                bestMatch = i;
            }
        });

        if (bestMatch >= 0) {
            buttons[bestMatch].style.borderColor = 'var(--accent)';
            buttons[bestMatch].style.boxShadow = '0 0 20px var(--accent-glow)';

            setTimeout(() => {
                if (typeof handleAnswer === 'function') handleAnswer(bestMatch);
            }, 500);

            showToast(`🎤 Выбран ответ ${String.fromCharCode(65 + bestMatch)}`, 'info');
        } else {
            showToast('🎤 Не удалось распознать ответ. Попробуйте ещё раз.', 'warning');
        }

        stopListening();
    };

    recognition.onerror = (event) => {
        console.error('Ошибка распознавания:', event.error);
        stopListening();
    };

    recognition.onend = () => {
        stopListening();
    };

    return true;
}

function calculateMatchScore(spoken, target) {
    if (spoken === target) return 1.0;
    if (target.includes(spoken)) return 0.8;
    if (spoken.includes(target)) return 0.7;

    const spokenWords = spoken.split(/\s+/);
    const targetWords = target.split(/\s+/);

    let matches = 0;
    spokenWords.forEach(word => {
        if (targetWords.some(tw => tw.includes(word) || word.includes(tw))) {
            matches++;
        }
    });

    return matches / Math.max(spokenWords.length, targetWords.length);
}

function startListening() {
    if (!recognition && !initSpeechRecognition()) {
        showToast('🎤 Голосовой ввод не поддерживается в вашем браузере', 'warning');
        return;
    }

    if (isListening) {
        stopListening();
        return;
    }

    const lang = typeof AppState !== 'undefined' ? AppState.get('settings.locale') : 'ru';
    recognition.lang = lang === 'en' ? 'en-US' : 'ru-RU';

    try {
        recognition.start();
        isListening = true;

        const btn = document.getElementById('voice-btn');
        if (btn) {
            btn.classList.add('listening');
            btn.innerHTML = '<i class="bi bi-mic-fill pulse-animation"></i>';
            btn.title = 'Слушаю...';
        }

        showToast('🎤 Говорите...', 'info');
    } catch (error) {
        console.error('Ошибка старта:', error);
        stopListening();
    }
}

function stopListening() {
    if (recognition && isListening) {
        try { recognition.stop(); } catch (e) {}
    }

    isListening = false;

    const btn = document.getElementById('voice-btn');
    if (btn) {
        btn.classList.remove('listening');
        btn.innerHTML = '<i class="bi bi-mic"></i>';
        btn.title = 'Голосовой ответ';
    }
}

function addVoiceButton() {
    const skipBtn = document.getElementById('skip-question');
    if (!skipBtn) return;

    if (document.getElementById('voice-btn')) return;

    const voiceBtn = document.createElement('button');
    voiceBtn.id = 'voice-btn';
    voiceBtn.className = 'btn btn-outline-accent rounded-pill px-3 ms-2';
    voiceBtn.innerHTML = '<i class="bi bi-mic"></i>';
    voiceBtn.title = 'Голосовой ответ';
    voiceBtn.onclick = startListening;

    skipBtn.parentNode.appendChild(voiceBtn);
    initSpeechRecognition();
}