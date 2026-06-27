// ============================================
// QuizHub — Безопасность
// ============================================

// ========== ЗАЩИТА ОТ НАКРУТКИ ОЧКОВ ==========

const SCORE_VALIDATION = {
  maxScorePerQuiz: 200,
  maxScorePerQuestion: 25,
  minAnswerTime: 0.5, // секунд
  suspiciousPatterns: ['perfect_scores', 'instant_answers', 'same_time']
};

function validateQuizResult(result, questions, answerTimes) {
  const warnings = [];
  
  // Проверка максимального счёта
  if (result.score > SCORE_VALIDATION.maxScorePerQuiz) {
    warnings.push('Подозрительно высокий счёт');
    result.score = Math.min(result.score, SCORE_VALIDATION.maxScorePerQuiz);
  }
  
  // Проверка времени ответа
  if (answerTimes) {
    const tooFast = answerTimes.filter(t => t < SCORE_VALIDATION.minAnswerTime);
    if (tooFast.length > 3) {
      warnings.push('Слишком быстрые ответы');
    }
  }
  
  // Проверка на идеальные результаты подряд
  const recentResults = JSON.parse(localStorage.getItem('quizhub-recent-results') || '[]');
  const perfectCount = recentResults.filter(r => r.correctAnswers === 10).length;
  
  if (perfectCount >= 5 && result.correctAnswers === 10) {
    warnings.push('Много идеальных результатов подряд');
  }
  
  // Сохраняем результат для анализа
  recentResults.push({
    score: result.score,
    correctAnswers: result.correctAnswers,
    timestamp: Date.now()
  });
  
  if (recentResults.length > 20) recentResults.shift();
  localStorage.setItem('quizhub-recent-results', JSON.stringify(recentResults));
  
  if (warnings.length > 0) {
    console.warn('Предупреждения безопасности:', warnings);
    // Можно отправить на сервер для анализа
    logSecurityEvent('suspicious_score', { warnings, result });
  }
  
  return { valid: true, warnings, adjustedScore: result.score };
}

// ========== ВАЛИДАЦИЯ ОТВЕТОВ НА КЛИЕНТЕ ==========

function validateAnswerIntegrity(question, selectedIndex, correctIndex) {
  // Проверяем, что вопрос не был изменён
  const questionHash = hashString(question.question + question.answers.join(''));
  const savedHash = question._hash;
  
  if (savedHash && questionHash !== savedHash) {
    console.error('Вопрос был изменён!');
    logSecurityEvent('question_tampered', { question });
    return false;
  }
  
  // Сохраняем хеш для следующей проверки
  question._hash = questionHash;
  
  return true;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

// ========== RATE LIMITING (клиентская часть) ==========

const RATE_LIMITS = {
  quizStart: { max: 10, window: 60000 },    // 10 квизов в минуту
  scoreSubmit: { max: 30, window: 60000 },  // 30 отправок в минуту
  teamCreate: { max: 3, window: 3600000 },   // 3 команды в час
};

const rateLimitStorage = {};

function checkRateLimit(action) {
  const limit = RATE_LIMITS[action];
  if (!limit) return true;
  
  const now = Date.now();
  const key = `${action}_${currentUser?.uid || 'anonymous'}`;
  
  if (!rateLimitStorage[key]) {
    rateLimitStorage[key] = [];
  }
  
  // Очищаем старые записи
  rateLimitStorage[key] = rateLimitStorage[key].filter(t => now - t < limit.window);
  
  if (rateLimitStorage[key].length >= limit.max) {
    console.warn(`Rate limit exceeded: ${action}`);
    showToast('Слишком много запросов. Подождите немного.', 'warning');
    return false;
  }
  
  rateLimitStorage[key].push(now);
  return true;
}

// ========== ЗАЩИТА ОТ XSS ==========

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// ========== БЕЗОПАСНОЕ ХРАНЕНИЕ ДАННЫХ ==========

function secureStore(key, value) {
  try {
    // Шифруем чувствительные данные (базовая обфускация)
    const stringValue = JSON.stringify(value);
    const encoded = btoa(unescape(encodeURIComponent(stringValue)));
    localStorage.setItem(`secure_${key}`, encoded);
  } catch (e) {
    console.error('Ошибка сохранения:', e);
  }
}

function secureRetrieve(key) {
  try {
    const encoded = localStorage.getItem(`secure_${key}`);
    if (!encoded) return null;
    
    const stringValue = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(stringValue);
  } catch (e) {
    console.error('Ошибка чтения:', e);
    return null;
  }
}

// ========== ПРОВЕРКА ЦЕЛОСТНОСТИ ДАННЫХ ==========

function verifyDataIntegrity() {
  const checks = [];
  
  // Проверяем localStorage на неожиданные изменения
  const stats = JSON.parse(localStorage.getItem('quizhub-stats') || '{}');
  
  if (stats.totalXP < 0) {
    console.error('Обнаружено отрицательное XP');
    stats.totalXP = 0;
    localStorage.setItem('quizhub-stats', JSON.stringify(stats));
    checks.push('fixed_negative_xp');
  }
  
  if (stats.totalQuizzes < 0) {
    console.error('Обнаружено отрицательное количество квизов');
    stats.totalQuizzes = 0;
    localStorage.setItem('quizhub-stats', JSON.stringify(stats));
    checks.push('fixed_negative_quizzes');
  }
  
  // Проверяем монеты
  const coins = parseInt(localStorage.getItem('quizhub-coins') || '0');
  if (coins < 0 || coins > 999999) {
    console.error('Подозрительное количество монет');
    localStorage.setItem('quizhub-coins', '0');
    checks.push('fixed_coins');
  }
  
  return checks;
}

// ========== ЛОГИРОВАНИЕ БЕЗОПАСНОСТИ ==========

function logSecurityEvent(eventType, data) {
  const event = {
    type: eventType,
    timestamp: Date.now(),
    userId: currentUser?.uid || 'anonymous',
    userAgent: navigator.userAgent,
    data: data
  };
  
  // Сохраняем локально
  const events = JSON.parse(localStorage.getItem('quizhub-security-log') || '[]');
  events.push(event);
  
  if (events.length > 100) events.shift();
  localStorage.setItem('quizhub-security-log', JSON.stringify(events));
  
  // Отправляем на сервер если онлайн
  if (navigator.onLine && typeof db !== 'undefined') {
    try {
      db.collection('security_logs').add(event).catch(() => {});
    } catch (e) {}
  }
}

// ========== БЕЗОПАСНАЯ РАБОТА С FIREBASE ==========

function getSafeFirestoreRules() {
  return `
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Таблица лидеров — только чтение и создание своих результатов
        match /leaderboard/{document} {
          allow read: if true;
          allow create: if request.auth != null 
            && request.resource.data.userId == request.auth.uid
            && request.resource.data.score <= 200
            && request.resource.data.difficulty in ['easy', 'medium', 'hard', 'timed', 'survival'];
          allow update: if request.auth != null 
            && resource.data.userId == request.auth.uid
            && request.resource.data.score > resource.data.score;
          allow delete: if false;
        }
        
        // Команды
        match /teams/{document} {
          allow read: if true;
          allow create: if request.auth != null;
          allow update: if request.auth != null 
            && request.auth.uid == resource.data.captain;
        }
        
        // Турниры
        match /tournaments/{document} {
          allow read: if true;
          allow write: if request.auth != null;
        }
        
        // Логи безопасности — только создание
        match /security_logs/{document} {
          allow read: if false;
          allow create: if true;
        }
      }
    }
  `;
}

// ========== CSRF ЗАЩИТА ==========

function generateCSRFToken() {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem('quizhub-csrf-token', token);
  return token;
}

function getCSRFToken() {
  return localStorage.getItem('quizhub-csrf-token') || generateCSRFToken();
}

function validateCSRFToken(token) {
  const stored = getCSRFToken();
  return token === stored;
}

// ========== ПРОВЕРКА ПАРОЛЕЙ (для будущей email-регистрации) ==========

function validatePasswordStrength(password) {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    valid: score >= 4,
    score,
    checks,
    message: score < 4 ? 'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и спецсимволы' : ''
  };
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  // Проверяем целостность данных
  const integrityChecks = verifyDataIntegrity();
  if (integrityChecks.length > 0) {
    console.warn('Исправлены нарушения целостности:', integrityChecks);
  }
  
  // Генерируем CSRF токен
  generateCSRFToken();
  
  // Проверяем безопасность хранилища
  try {
    localStorage.setItem('security_test', '1');
    localStorage.removeItem('security_test');
  } catch (e) {
    console.error('localStorage недоступен!');
  }
  
  // Защита от перехвата console
  const noop = () => {};
  if (typeof console === 'undefined') {
    window.console = { log: noop, warn: noop, error: noop };
  }
  
  console.log('Система безопасности активирована');
});

// Экспортируем в глобальную область
window.QuizHubSecurity = {
  validateQuizResult,
  sanitizeInput,
  sanitizeHTML,
  checkRateLimit,
  secureStore,
  secureRetrieve,
  logSecurityEvent,
  getCSRFToken,
  validateCSRFToken,
  validatePasswordStrength,
  getSafeFirestoreRules
};