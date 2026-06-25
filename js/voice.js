// ============================================
// QuizHub — Голосовой ввод ответов
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
  recognition.lang = selectedLanguage === 'en' ? 'en-US' : 'ru-RU';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
    const confidence = event.results[0][0].confidence;
    
    console.log(`Распознано: "${transcript}" (${Math.round(confidence * 100)}%)`);
    
    // Ищем совпадение с вариантами ответов
    const question = quizQuestions[currentQuestionIndex];
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
    
    // Также пробуем найти по номеру/букве
    if (bestMatch === -1) {
      const letterMatch = transcript.match(/^[а-яa-d]$/i);
      if (letterMatch) {
        const letter = letterMatch[0].toUpperCase();
        const index = letter.charCodeAt(0) - 'A'.charCodeAt(0);
        if (index >= 0 && index < question.answers.length) {
          bestMatch = index;
        }
      }
    }
    
    if (bestMatch >= 0) {
      // Подсвечиваем выбранный ответ
      buttons[bestMatch].style.borderColor = 'var(--accent)';
      buttons[bestMatch].style.boxShadow = '0 0 20px var(--accent-glow)';
      
      setTimeout(() => {
        handleAnswer(bestMatch);
      }, 500);
      
      showToast(`🎤 Выбран ответ ${String.fromCharCode(65 + bestMatch)}`, 'info');
    } else {
      showToast('🎤 Не удалось распознать ответ. Попробуйте ещё раз.', 'warning');
      vibrate([100, 50, 100]);
    }
    
    stopListening();
  };
  
  recognition.onerror = (event) => {
    console.error('Ошибка распознавания:', event.error);
    stopListening();
    
    switch (event.error) {
      case 'not-allowed':
        showToast('🎤 Доступ к микрофону запрещён', 'danger');
        break;
      case 'no-speech':
        showToast('🎤 Речь не обнаружена', 'warning');
        break;
      default:
        showToast('🎤 Ошибка распознавания', 'warning');
    }
  };
  
  recognition.onend = () => {
    stopListening();
  };
  
  return true;
}

function calculateMatchScore(spoken, target) {
  // Простое сравнение
  if (spoken === target) return 1.0;
  if (target.includes(spoken)) return 0.8;
  if (spoken.includes(target)) return 0.7;
  
  // По словам
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
  
  // Обновляем язык
  recognition.lang = selectedLanguage === 'en' ? 'en-US' : 'ru-RU';
  
  try {
    recognition.start();
    isListening = true;
    
    // Обновляем кнопку
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
    try {
      recognition.stop();
    } catch (e) {}
  }
  
  isListening = false;
  
  const btn = document.getElementById('voice-btn');
  if (btn) {
    btn.classList.remove('listening');
    btn.innerHTML = '<i class="bi bi-mic"></i>';
    btn.title = 'Голосовой ответ';
  }
}

// Добавляем кнопку голосового ввода на экран квиза
function addVoiceButton() {
  const skipBtn = document.getElementById('skip-question');
  if (!skipBtn) return;
  
  const voiceBtn = document.createElement('button');
  voiceBtn.id = 'voice-btn';
  voiceBtn.className = 'btn btn-outline-accent rounded-pill px-3 ms-2';
  voiceBtn.innerHTML = '<i class="bi bi-mic"></i>';
  voiceBtn.title = 'Голосовой ответ';
  voiceBtn.onclick = startListening;
  
  skipBtn.parentNode.appendChild(voiceBtn);
  
  // Инициализируем распознавание
  initSpeechRecognition();
}