// ============================================
// QuizHub — Статистика и графики v2.3 (рефакторинг)
// ============================================

let statsChart = null;
let weeklyChart = null;

function renderStatsScreen() {
    const screen = document.getElementById('screen-stats');
    if (!screen) return;

    const stats = typeof AppState !== 'undefined' ? AppState.get('stats') : {};
    const achCount = typeof AppState !== 'undefined' ? AppState.get('unlockedAchievements').length : 0;
    const achTotal = typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS.length : 0;

    screen.innerHTML = `
        <div class="row justify-content-center"><div class="col-lg-8">
            ${I18N_TEMPLATES.statsHeader()}
            ${I18N_TEMPLATES.statsCards(stats, achCount, achTotal)}
            <div class="bg-card rounded-4 p-4 mb-4">
                <h5 class="fw-bold mb-3">📈 ${typeof t === 'function' ? t('scoreProgress') : 'Прогресс по очкам'}</h5>
                <div style="position: relative; height: 250px; width: 100%;">
                    <canvas id="scoreChart"></canvas>
                </div>
            </div>
            <div class="bg-card rounded-4 p-4 mb-4">
                <h5 class="fw-bold mb-3">📅 ${typeof t === 'function' ? t('weekActivity') : 'Активность по дням'}</h5>
                <div style="position: relative; height: 250px; width: 100%;">
                    <canvas id="weeklyChart"></canvas>
                </div>
            </div>
            <div class="bg-card rounded-4 p-4 mb-4">
                <h5 class="fw-bold mb-3">📋 ${typeof t === 'function' ? t('details') : 'Детали'}</h5>
                <div class="row g-3">
                    <div class="col-6"><p class="text-muted mb-1">${typeof t === 'function' ? t('avgScore') : 'Средний счёт'}</p><p class="fw-bold">${stats.totalQuizzes > 0 ? Math.round((stats.totalXP || 0) / stats.totalQuizzes) : 0}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${typeof t === 'function' ? t('languages') : 'Языки'}</p><p class="fw-bold">${(stats.languagesUsed || []).join(', ') || '—'}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${typeof t === 'function' ? t('fastestAnswer') : 'Быстрейший ответ'}</p><p class="fw-bold">${stats.fastestAnswer < 999 ? stats.fastestAnswer + ' ' + (typeof t === 'function' ? t('seconds') : 'сек') : '—'}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${typeof t === 'function' ? t('bestStreak') : 'Лучшая серия'}</p><p class="fw-bold">${stats.maxStreak || 0} ${typeof t === 'function' ? t('correctShort') : 'прав.'}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${typeof t === 'function' ? t('totalXP') : 'Всего XP'}</p><p class="fw-bold">${stats.totalXP || 0} XP</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${typeof t === 'function' ? t('level') : 'Уровень'}</p><p class="fw-bold">${typeof getLevelName === 'function' ? getLevelName(typeof getCurrentLevel === 'function' ? getCurrentLevel() : { nameKey: 'lvl_novice' }) : 'Новичок'}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${typeof t === 'function' ? t('fastestQuiz') : 'Быстрейший квиз'}</p><p class="fw-bold">${stats.fastestQuiz < 9999 ? formatTime(stats.fastestQuiz) : '—'}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${typeof t === 'function' ? t('perfectQuizzes') : 'Идеальных квизов'}</p><p class="fw-bold">${stats.perfectQuizzes || 0}</p></div>
                </div>
            </div>
            <div class="text-center mt-4">
                <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')"><i class="bi bi-play-fill me-2"></i>${typeof t === 'function' ? t('startQuiz') : 'НАЧАТЬ КВИЗ'}</button>
                <button class="btn btn-outline-accent rounded-pill px-4 ms-2" onclick="showScreen('achievements')"><i class="bi bi-award me-2"></i>${typeof t === 'function' ? t('achievements') : 'Ачивки'}</button>
            </div>
        </div></div>
    `;
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
            data: {
                labels: last20.map((_, i) => `#${i + 1}`),
                datasets: [{
                    label: typeof t === 'function' ? t('points') : 'Очки',
                    data: last20,
                    borderColor: '#FF6B9D',
                    backgroundColor: 'rgba(255, 107, 157, 0.1)',
                    fill: true, tension: 0.4, pointRadius: 4,
                    pointBackgroundColor: '#FF6B9D', borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 10 } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true, suggestedMax: Math.max(...last20, 10) + 20 }
                }
            }
        });
    } catch (error) { console.error('Ошибка графика:', error); }
}

function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }

    const ctx = canvas.getContext('2d');
    const dayNames = [
        typeof t === 'function' ? t('monday') : 'Пн',
        typeof t === 'function' ? t('tuesday') : 'Вт',
        typeof t === 'function' ? t('wednesday') : 'Ср',
        typeof t === 'function' ? t('thursday') : 'Чт',
        typeof t === 'function' ? t('friday') : 'Пт',
        typeof t === 'function' ? t('saturday') : 'Сб',
        typeof t === 'function' ? t('sunday') : 'Вс'
    ];
    const weeklyData = JSON.parse(localStorage.getItem('quizhub-weekly-activity') || '[0,0,0,0,0,0,0]');

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const textColor = isDark ? '#B0B0C0' : '#6B6B80';

    try {
        weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dayNames,
                datasets: [{
                    label: typeof t === 'function' ? t('quizzes') : 'Квизов',
                    data: weeklyData,
                    backgroundColor: [
                        'rgba(255,107,157,0.7)', 'rgba(123,47,190,0.7)', 'rgba(255,215,64,0.7)',
                        'rgba(0,230,118,0.7)', 'rgba(64,196,255,0.7)', 'rgba(255,107,157,0.7)', 'rgba(123,47,190,0.7)'
                    ],
                    borderRadius: 8, borderWidth: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: textColor } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1, callback: v => Math.floor(v) }, beginAtZero: true, suggestedMax: Math.max(...weeklyData, 3) }
                }
            }
        });
    } catch (error) { console.error('Ошибка графика:', error); }
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