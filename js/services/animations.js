// ============================================
// QuizHub — Анимации и визуальные эффекты
// ============================================

// ========== RIPPLE-ЭФФЕКТ ==========

function initRippleEffect() {
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-accent, .btn-outline-accent, .btn-answer');
    if (!btn || btn.disabled) return;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    btn.appendChild(ripple);
    
    ripple.addEventListener('animationend', () => ripple.remove());
  });
}

// ========== CANVAS КОНФЕТТИ ==========

let confettiCanvas = null;
let confettiCtx = null;
let confettiParticles = [];
let confettiAnimationId = null;

function initConfettiCanvas() {
  confettiCanvas = document.createElement('canvas');
  confettiCanvas.id = 'confetti-canvas';
  document.body.appendChild(confettiCanvas);
  
  confettiCtx = confettiCanvas.getContext('2d');
  
  window.addEventListener('resize', resizeConfettiCanvas);
  resizeConfettiCanvas();
}

function resizeConfettiCanvas() {
  if (!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function spawnConfettiAdvanced(count = 100) {
  if (!confettiCanvas) initConfettiCanvas();
  
  const colors = ['#FF6B9D', '#7B2FBE', '#FFD740', '#00E676', '#FF5252', '#40C4FF', '#FFD700'];
  
  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: -20,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      decay: Math.random() * 0.01 + 0.005,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    });
  }
  
  if (!confettiAnimationId) {
    animateConfetti();
  }
}

function animateConfetti() {
  if (!confettiCtx || !confettiCanvas) return;
  
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  
  confettiParticles = confettiParticles.filter(p => p.opacity > 0);
  
  confettiParticles.forEach(p => {
    confettiCtx.save();
    confettiCtx.globalAlpha = p.opacity;
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rotation * Math.PI / 180);
    confettiCtx.fillStyle = p.color;
    
    if (p.shape === 'circle') {
      confettiCtx.beginPath();
      confettiCtx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      confettiCtx.fill();
    } else {
      confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    
    confettiCtx.restore();
    
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // Гравитация
    p.rotation += p.rotationSpeed;
    p.opacity -= p.decay;
  });
  
  if (confettiParticles.length > 0) {
    confettiAnimationId = requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimationId = null;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// Переопределяем старую функцию
function spawnConfetti() {
  spawnConfettiAdvanced(80);
}

// ========== АНИМАЦИЯ ПЕРЕХОДА ВОПРОСОВ ==========

function animateQuestionTransition(callback) {
  const quizCard = document.querySelector('#screen-quiz .bg-card');
  if (!quizCard) {
    callback();
    return;
  }
  
  quizCard.classList.add('question-transition-out');
  
  quizCard.addEventListener('animationend', function handler() {
    quizCard.removeEventListener('animationend', handler);
    callback();
    quizCard.classList.remove('question-transition-out');
    quizCard.classList.add('question-transition-in');
    
    quizCard.addEventListener('animationend', function handler2() {
      quizCard.removeEventListener('animationend', handler2);
      quizCard.classList.remove('question-transition-in');
    });
  });
}

// ========== ЭФФЕКТ "РАЗБИТОГО СТЕКЛА" ==========

function showGlassBreakEffect(element) {
  element.classList.add('glass-break');
  element.addEventListener('animationend', function handler() {
    element.removeEventListener('animationend', handler);
    element.classList.remove('glass-break');
  });
}

// ========== ПРАВИЛЬНЫЙ ОТВЕТ — СВЕЧЕНИЕ ==========

function showCorrectGlow(element) {
  element.classList.add('correct-glow');
  element.addEventListener('animationend', function handler() {
    element.removeEventListener('animationend', handler);
    element.classList.remove('correct-glow');
  });
}

// ========== АНИМАЦИЯ СЧЁТА ==========

function animateScoreChange(element, oldScore, newScore) {
  const duration = 500;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(oldScore + (newScore - oldScore) * eased);
    
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  element.classList.add('score-counter');
  requestAnimationFrame(update);
  
  element.addEventListener('animationend', function handler() {
    element.removeEventListener('animationend', handler);
    element.classList.remove('score-counter');
  });
}

// ========== ПАРАЛЛАКС-ЭФФЕКТ ==========

function initParallax() {
  const isMobile = window.innerWidth < 768;
  if (isMobile) return; // Отключаем на мобилках
  
  const layers = document.querySelectorAll('.parallax-layer');
  
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    
    layers.forEach(layer => {
      const speed = parseFloat(layer.dataset.speed || 1);
      const tx = x * speed * 10;
      const ty = y * speed * 10;
      layer.style.transform = `translate(${tx}px, ${ty}px)`;
    });
  });
}

// ========== ПРОГРЕСС-БАР ТАЙМЕРА ==========

function createCircularTimer(totalSeconds) {
  const circumference = 2 * Math.PI * 36; // r=36
  
  return `
    <div class="timer-circle-advanced">
      <svg viewBox="0 0 80 80">
        <circle class="timer-circle-bg" cx="40" cy="40" r="36"/>
        <circle class="timer-circle-progress" id="timer-progress-circle" 
                cx="40" cy="40" r="36"
                stroke-dasharray="${circumference}" 
                stroke-dashoffset="0"/>
      </svg>
      <span class="timer-circle-text" id="timer-display">${totalSeconds}</span>
    </div>
  `;
}

function updateCircularTimer(timeLeft, totalTime) {
  const circle = document.getElementById('timer-progress-circle');
  const display = document.getElementById('timer-display');
  
  if (circle) {
    const circumference = 2 * Math.PI * 36;
    const offset = circumference * (1 - timeLeft / totalTime);
    circle.style.strokeDashoffset = offset;
    
    if (timeLeft <= 5) {
      circle.classList.add('danger');
    } else {
      circle.classList.remove('danger');
    }
  }
  
  if (display) {
    display.textContent = timeLeft;
  }
}

// ========== ЗВУК ДОСТИЖЕНИЯ ==========

function playAchievementSound() {
  if (!soundsEnabled || !audioCtx) return;
  
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99];
  
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, now + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.3);
  });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  initRippleEffect();
  initConfettiCanvas();
  initParallax();
  
  // Добавляем parallax-layer к иконке героя
  const heroIcon = document.querySelector('.hero-icon');
  if (heroIcon) {
    heroIcon.classList.add('parallax-layer');
    heroIcon.dataset.speed = '0.5';
  }
  
  // Пульсация логотипа
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.classList.add('logo-pulse');
  }
});