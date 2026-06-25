// ============================================
// QuizHub — Статистика и графики
// ============================================

let statsChart = null;
let weeklyChart = null;

function renderStatsScreen() {
  const screen = document.getElementById('screen-stats');
  if (!screen) return;
  
  // Безопасно получаем данные
  const stats = (typeof quizStats !== 'undefined') ? quizStats : {};
  const totalQuizzes = stats.totalQuizzes || 0;
  const bestScore = stats.bestScore || 0;
  const dayStreak = stats.dayStreak || 0;
  const totalXP = stats.totalXP || 0;
  const avgScore = totalQuizzes > 0 ? Math.round(totalXP / totalQuizzes) : 0;
  const achievementsCount = (typeof unlockedAchievements !== 'undefined') ? unlockedAchievements.length : 0;
  const totalAchievements = (typeof ACHIEVEMENTS !== 'undefined') ? ACHIEVEMENTS.length : 20;
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-8">
        
        <div class="text-center mb-4">
          <h2 class="fw-bold font-display mb-2">📊 Моя статистика</h2>
          <p class="text-muted">Твой путь к знаниям</p>
        </div>
        
        <!-- Карточки статистики -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <div class="bg-card rounded-4 p-3 text-center">
              <p class="display-6 fw-bold text-accent mb-0">${totalQuizzes}</p>
              <small class="text-muted">Всего квизов</small>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="bg-card rounded-4 p-3 text-center">
              <p class="display-6 fw-bold text-warning mb-0">${bestScore}</p>
              <small class="text-muted">Лучший счёт</small>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="bg-card rounded-4 p-3 text-center">
              <p class="display-6 fw-bold text-success mb-0">${dayStreak} дн.</p>
              <small class="text-muted">Серия дней</small>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="bg-card rounded-4 p-3 text-center">
              <p class="display-6 fw-bold text-info mb-0">${achievementsCount}/${totalAchievements}</p>
              <small class="text-muted">Достижений</small>
            </div>
          </div>
        </div>
        
        <!-- График прогресса -->
        <div class="bg-card rounded-4 p-4 mb-4">
          <h5 class="fw-bold mb-3">📈 Прогресс по очкам (последние 20 игр)</h5>
          <div style="position: relative; height: 250px; width: 100%;">
            <canvas id="scoreChart"></canvas>
          </div>
        </div>
        
        <!-- График по дням недели -->
        <div class="bg-card rounded-4 p-4 mb-4">
          <h5 class="fw-bold mb-3">📅 Активность по дням</h5>
          <div style="position: relative; height: 250px; width: 100%;">
            <canvas id="weeklyChart"></canvas>
          </div>
        </div>
        
        <!-- Детальная статистика -->
        <div class="bg-card rounded-4 p-4 mb-4">
          <h5 class="fw-bold mb-3">📋 Детали</h5>
          <div class="row g-3">
            <div class="col-6">
              <p class="text-muted mb-1">Средний счёт</p>
              <p class="fw-bold">${avgScore}</p>
            </div>
            <div class="col-6">
              <p class="text-muted mb-1">Языки</p>
              <p class="fw-bold">${(stats.languagesUsed || []).join(', ') || '—'}</p>
            </div>
            <div class="col-6">
              <p class="text-muted mb-1">Быстрейший ответ</p>
              <p class="fw-bold">${stats.fastestAnswer < 999 ? stats.fastestAnswer + ' сек' : '—'}</p>
            </div>
            <div class="col-6">
              <p class="text-muted mb-1">Лучшая серия</p>
              <p class="fw-bold">${stats.maxStreak || 0} правильных</p>
            </div>
            <div class="col-6">
              <p class="text-muted mb-1">Всего XP</p>
              <p class="fw-bold">${totalXP}</p>
            </div>
            <div class="col-6">
              <p class="text-muted mb-1">Уровень</p>
              <p class="fw-bold">${typeof getCurrentLevel === 'function' ? getCurrentLevel().name : 'Новичок'}</p>
            </div>
          </div>
        </div>
        
        <div class="text-center mt-4">
          <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">
            <i class="bi bi-play-fill me-2"></i>Пройти квиз
          </button>
        </div>
        
      </div>
    </div>
  `;
}

function renderScoreChart() {
  const canvas = document.getElementById('scoreChart');
  if (!canvas || typeof Chart === 'undefined') {
    console.warn('Canvas или Chart.js не найдены');
    return;
  }
  
  // Уничтожаем старый график
  if (statsChart) {
    statsChart.destroy();
    statsChart = null;
  }
  
  const ctx = canvas.getContext('2d');
  
  // Получаем историю очков
  const scoreHistory = JSON.parse(localStorage.getItem('quizhub-score-history') || '[]');
  const last20 = scoreHistory.slice(-20);
  
  // Если нет данных — показываем заглушку
  if (last20.length === 0) {
    last20.push(0);
  }
  
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = isDark ? '#B0B0C0' : '#6B6B80';
  
  try {
    statsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last20.map((_, i) => `Игра ${i + 1}`),
        datasets: [{
          label: 'Очки',
          data: last20,
          borderColor: '#FF6B9D',
          backgroundColor: 'rgba(255, 107, 157, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#FF6B9D',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, maxTicksLimit: 10 }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor },
            beginAtZero: true,
            suggestedMax: Math.max(...last20) + 20
          }
        }
      }
    });
  } catch (error) {
    console.error('Ошибка создания графика:', error);
  }
}

function renderWeeklyChart() {
  const canvas = document.getElementById('weeklyChart');
  if (!canvas || typeof Chart === 'undefined') {
    console.warn('Canvas или Chart.js не найдены');
    return;
  }
  
  // Уничтожаем старый график
  if (weeklyChart) {
    weeklyChart.destroy();
    weeklyChart = null;
  }
  
  const ctx = canvas.getContext('2d');
  
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const weeklyData = JSON.parse(localStorage.getItem('quizhub-weekly-activity') || '[0,0,0,0,0,0,0]');
  
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = isDark ? '#B0B0C0' : '#6B6B80';
  
  try {
    weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Квизов',
          data: weeklyData,
          backgroundColor: [
            'rgba(255, 107, 157, 0.7)',
            'rgba(123, 47, 190, 0.7)',
            'rgba(255, 215, 64, 0.7)',
            'rgba(0, 230, 118, 0.7)',
            'rgba(64, 196, 255, 0.7)',
            'rgba(255, 107, 157, 0.7)',
            'rgba(123, 47, 190, 0.7)'
          ],
          borderRadius: 8,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor }
          },
          y: {
            grid: { color: gridColor },
            ticks: { 
              color: textColor, 
              stepSize: 1,
              callback: function(value) {
                return Math.floor(value);
              }
            },
            beginAtZero: true,
            suggestedMax: Math.max(...weeklyData, 3)
          }
        }
      }
    });
  } catch (error) {
    console.error('Ошибка создания графика:', error);
  }
}

// Сохранение истории очков
function saveScoreToHistory(score) {
  const history = JSON.parse(localStorage.getItem('quizhub-score-history') || '[]');
  history.push(score);
  
  // Храним только последние 50 результатов
  if (history.length > 50) history.shift();
  
  localStorage.setItem('quizhub-score-history', JSON.stringify(history));
  
  // Обновляем активность по дням
  const dayOfWeek = new Date().getDay(); // 0 = Вс
  const weeklyData = JSON.parse(localStorage.getItem('quizhub-weekly-activity') || '[0,0,0,0,0,0,0]');
  const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weeklyData[index] = (weeklyData[index] || 0) + 1;
  localStorage.setItem('quizhub-weekly-activity', JSON.stringify(weeklyData));
}