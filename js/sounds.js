// ============================================
// QuizHub — Звуковые эффекты (Web Audio API)
// ============================================

let audioCtx = null;
let soundsEnabled = true;

function initAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API не поддерживается');
    }
  }
}

function toggleSound() {
  soundsEnabled = !soundsEnabled;
  const btn = document.getElementById('sound-toggle');
  if (btn) {
    btn.innerHTML = soundsEnabled 
      ? '<i class="bi bi-volume-up-fill"></i>' 
      : '<i class="bi bi-volume-mute-fill"></i>';
  }
  return soundsEnabled;
}

// Правильный ответ — приятный «дзынь»
function playCorrectSound() {
  if (!soundsEnabled || !audioCtx) return;
  
  const now = audioCtx.currentTime;
  
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.3);
  });
}

// Неправильный ответ — глухой «бум»
function playWrongSound() {
  if (!soundsEnabled || !audioCtx) return;
  
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.4);
}

// Таймер <5 сек — тиканье
function playTickSound() {
  if (!soundsEnabled || !audioCtx) return;
  
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.value = 800;
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

// Конфетти/уровень — фанфары
function playFanfareSound() {
  if (!soundsEnabled || !audioCtx) return;
  
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.4);
  });
}

// Достижение — особый звук
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

// Инициализация при первом клике
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });