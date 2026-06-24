// ============================================
// QuizHub — Система достижений
// ============================================

const ACHIEVEMENTS = [
  { id: 'speed_demon', name: 'Молниеносный', desc: 'Ответить за <3 секунд', icon: '⚡', condition: (stats) => stats.fastestAnswer < 3 },
  { id: 'streak_5', name: 'В ударе', desc: '5 правильных подряд', icon: '🔥', condition: (stats) => stats.maxStreak >= 5 },
  { id: 'perfect_10', name: 'Перфекционист', desc: 'Все 10 правильных', icon: '💯', condition: (stats) => stats.correctAnswers === 10 },
  { id: 'polyglot', name: 'Полиглот', desc: 'Пройти на обоих языках', icon: '🌍', condition: (stats) => stats.languagesUsed >= 2 },
  { id: 'champion', name: 'Чемпион', desc: 'Занять 1 место', icon: '👑', condition: (stats) => stats.rank === 1 },
  { id: 'comeback', name: 'Камбэк', desc: 'Улучшить результат после неудачи', icon: '🔄', condition: (stats) => stats.improved === true },
  { id: 'night_owl', name: 'Полуночник', desc: 'Пройти квиз после 00:00', icon: '🦉', condition: () => { const h = new Date().getHours(); return h < 6 || h >= 0; } },
  { id: 'marathon', name: 'Марафонец', desc: 'Пройти 5 квизов за день', icon: '🏃', condition: (stats) => stats.quizzesToday >= 5 }
];

let unlockedAchievements = JSON.parse(localStorage.getItem('quizhub-achievements') || '[]');
let quizStats = JSON.parse(localStorage.getItem('quizhub-stats') || '{"quizzesToday":0,"lastQuizDate":"","languagesUsed":[],"bestScore":0,"fastestAnswer":999,"maxStreak":0,"improved":false}');

function updateStats(result) {
  const today = new Date().toISOString().split('T')[0];
  
  if (quizStats.lastQuizDate !== today) {
    quizStats.quizzesToday = 0;
    quizStats.lastQuizDate = today;
  }
  
  quizStats.quizzesToday++;
  quizStats.correctAnswers = result.correctAnswers;
  
  if (!quizStats.languagesUsed) quizStats.languagesUsed = [];
  if (!quizStats.languagesUsed.includes(selectedLanguage)) {
    quizStats.languagesUsed.push(selectedLanguage);
  }
  
  if (result.score > quizStats.bestScore && quizStats.bestScore > 0) {
    quizStats.improved = true;
  } else {
    quizStats.improved = false;
  }
  
  if (result.score > quizStats.bestScore) {
    quizStats.bestScore = result.score;
  }
  
  localStorage.setItem('quizhub-stats', JSON.stringify(quizStats));
}

function checkAchievements(result) {
  const stats = {
    fastestAnswer: quizStats.fastestAnswer || 999,
    maxStreak: quizStats.maxStreak || 0,
    correctAnswers: result.correctAnswers,
    languagesUsed: (quizStats.languagesUsed || []).length,
    rank: 1,
    improved: quizStats.improved || false,
    quizzesToday: quizStats.quizzesToday || 0
  };
  
  const newAchievements = [];
  
  ACHIEVEMENTS.forEach(ach => {
    if (!unlockedAchievements.includes(ach.id) && ach.condition(stats)) {
      unlockedAchievements.push(ach.id);
      newAchievements.push(ach);
    }
  });
  
  if (newAchievements.length > 0) {
    localStorage.setItem('quizhub-achievements', JSON.stringify(unlockedAchievements));
    showAchievements(newAchievements);
  }
}

function showAchievements(achievements) {
  const container = document.getElementById('achievements-popup');
  if (!container) return;
  
  achievements.forEach((ach, i) => {
    setTimeout(() => {
      container.innerHTML = `
        <div class="achievement-toast bg-card border border-accent rounded-4 p-3 shadow-lg">
          <div class="d-flex align-items-center gap-3">
            <span class="fs-1">${ach.icon}</span>
            <div>
              <p class="fw-bold text-accent mb-0">Достижение разблокировано!</p>
              <p class="fw-bold mb-0">${ach.name}</p>
              <small class="text-muted">${ach.desc}</small>
            </div>
          </div>
        </div>
      `;
      container.style.display = 'block';
      
      setTimeout(() => {
        container.style.display = 'none';
      }, 3000);
    }, i * 3500);
  });
}

function renderAchievementsList() {
  const container = document.getElementById('achievements-list');
  if (!container) return;
  
  const countEl = document.getElementById('ach-count');
  if (countEl) {
    countEl.textContent = unlockedAchievements.length;
  }
  
  container.innerHTML = ACHIEVEMENTS.map(ach => {
    const unlocked = unlockedAchievements.includes(ach.id);
    return `
      <div class="d-flex align-items-center gap-3 p-3 rounded-4 ${unlocked ? 'bg-card' : 'bg-card opacity-50'}">
        <span class="fs-2 ${unlocked ? '' : 'grayscale'}">${ach.icon}</span>
        <div class="flex-grow-1">
          <p class="fw-bold mb-0 ${unlocked ? 'text-accent' : 'text-muted'}">${ach.name}</p>
          <small class="text-muted">${ach.desc}</small>
        </div>
        <span class="fs-4">${unlocked ? '✅' : '🔒'}</span>
      </div>
    `;
  }).join('');
}