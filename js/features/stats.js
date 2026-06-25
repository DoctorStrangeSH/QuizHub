// ============================================
// QuizHub — Статистика и графики v2.0
// ============================================

let statsChart = null;
let weeklyChart = null;

function renderStatsScreen() {
  const screen = document.getElementById('screen-stats');
  if (!screen) return;
  const stats = (typeof quizStats !== 'undefined') ? quizStats : {};
  const totalQuizzes = stats.totalQuizzes || 0;
  const bestScore = stats.bestScore || 0;
  const dayStreak = stats.dayStreak || 0;
  const totalXP = stats.totalXP || 0;
  const avgScore = totalQuizzes > 0 ? Math.round(totalXP / totalQuizzes) : 0;
  const achCount = (typeof unlockedAchievements !== 'undefined') ? unlockedAchievements.length : 0;
  const achTotal = (typeof ACHIEVEMENTS !== 'undefined') ? ACHIEVEMENTS.length : 0;

  screen.innerHTML = `
    <div class="row justify-content-center"><div class="col-lg-8">
      <div class="text-center mb-4"><h2 class="fw-bold font-display mb-2">📊 ${t('statsTitle')}</h2><p class="text-muted">${t('yourPath')}</p></div>
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3"><div class="bg-card rounded-4 p-3 text-center"><p class="display-6 fw-bold text-accent mb-0">${totalQuizzes}</p><small class="text-muted">${t('totalQuizzes')}</small></div></div>
        <div class="col-6 col-md-3"><div class="bg-card rounded-4 p-3 text-center"><p class="display-6 fw-bold text-warning mb-0">${bestScore}</p><small class="text-muted">${t('bestScore')}</small></div></div>
        <div class="col-6 col-md-3"><div class="bg-card rounded-4 p-3 text-center"><p class="display-6 fw-bold text-success mb-0">${dayStreak} дн.</p><small class="text-muted">${t('dayStreak')}</small></div></div>
        <div class="col-6 col-md-3"><div class="bg-card rounded-4 p-3 text-center"><p class="display-6 fw-bold text-info mb-0">${achCount}/${achTotal}</p><small class="text-muted">${t('achievements')}</small></div></div>
      </div>
      <div class="bg-card rounded-4 p-4 mb-4"><h5 class="fw-bold mb-3">📈 ${t('scoreProgress')}</h5><div style="position:relative;height:250px;width:100%;"><canvas id="scoreChart"></canvas></div></div>
      <div class="bg-card rounded-4 p-4 mb-4"><h5 class="fw-bold mb-3">📅 ${t('weekActivity')}</h5><div style="position:relative;height:250px;width:100%;"><canvas id="weeklyChart"></canvas></div></div>
      <div class="bg-card rounded-4 p-4 mb-4"><h5 class="fw-bold mb-3">📋 ${t('details')}</h5>
        <div class="row g-3">
          <div class="col-6"><p class="text-muted mb-1">${t('avgScore')}</p><p class="fw-bold">${avgScore}</p></div>
          <div class="col-6"><p class="text-muted mb-1">${t('languages')}</p><p class="fw-bold">${(stats.languagesUsed || []).join(', ') || '—'}</p></div>
          <div class="col-6"><p class="text-muted mb-1">${t('fastestAnswer')}</p><p class="fw-bold">${stats.fastestAnswer < 999 ? stats.fastestAnswer + ' сек' : '—'}</p></div>
          <div class="col-6"><p class="text-muted mb-1">${t('bestStreak')}</p><p class="fw-bold">${stats.maxStreak || 0} прав.</p></div>
          <div class="col-6"><p class="text-muted mb-1">${t('totalXP')}</p><p class="fw-bold">${totalXP}</p></div>
          <div class="col-6"><p class="text-muted mb-1">${t('level')}</p><p class="fw-bold">${typeof getCurrentLevel === 'function' ? getCurrentLevel().name : 'Новичок'}</p></div>
        </div>
      </div>
      <div class="text-center mt-4"><button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')"><i class="bi bi-play-fill me-2"></i>${t('startQuiz')}</button></div>
    </div></div>`;
}

function renderScoreChart() {
  const canvas = document.getElementById('scoreChart');
  if (!canvas || typeof Chart === 'undefined') return;
  if (statsChart) { statsChart.destroy(); statsChart = null; }
  const ctx = canvas.getContext('2d');
  const scoreHistory = JSON.parse(localStorage.getItem('quizhub-score-history') || '[]');
  const last20 = scoreHistory.slice(-20);
  if (last20.length === 0) last20.push(0);
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = isDark ? '#B0B0C0' : '#6B6B80';
  try {
    statsChart = new Chart(ctx, {
      type: 'line',
      data: { labels: last20.map((_, i) => `Игра ${i+1}`), datasets: [{ label: 'Очки', data: last20, borderColor: '#FF6B9D', backgroundColor: 'rgba(255,107,157,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#FF6B9D', borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 10 } }, y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true } } }
    });
  } catch (e) { console.error('Ошибка графика:', e); }
}

function renderWeeklyChart() {
  const canvas = document.getElementById('weeklyChart');
  if (!canvas || typeof Chart === 'undefined') return;
  if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }
  const ctx = canvas.getContext('2d');
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const weeklyData = JSON.parse(localStorage.getItem('quizhub-weekly-activity') || '[0,0,0,0,0,0,0]');
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = isDark ? '#B0B0C0' : '#6B6B80';
  try {
    weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: { labels: days, datasets: [{ label: 'Квизов', data: weeklyData, backgroundColor: ['rgba(255,107,157,0.7)','rgba(123,47,190,0.7)','rgba(255,215,64,0.7)','rgba(0,230,118,0.7)','rgba(64,196,255,0.7)','rgba(255,107,157,0.7)','rgba(123,47,190,0.7)'], borderRadius: 8, borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 }, beginAtZero: true } } }
    });
  } catch (e) { console.error('Ошибка графика:', e); }
}

function saveScoreToHistory(score) {
  const history = JSON.parse(localStorage.getItem('quizhub-score-history') || '[]');
  history.push(score);
  if (history.length > 50) history.shift();
  localStorage.setItem('quizhub-score-history', JSON.stringify(history));
  const dayOfWeek = new Date().getDay();
  const weeklyData = JSON.parse(localStorage.getItem('quizhub-weekly-activity') || '[0,0,0,0,0,0,0]');
  const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weeklyData[index] = (weeklyData[index] || 0) + 1;
  localStorage.setItem('quizhub-weekly-activity', JSON.stringify(weeklyData));
}