// ============================================
// QuizHub — Статистика и графики v2.2
// ============================================

let statsChart = null;
let weeklyChart = null;

function renderStatsScreen() {
    const screen = document.getElementById('screen-stats');
    if (!screen) return;

    const stats = (typeof quizStats !== 'undefined') ? quizStats : {};
    const achCount = (typeof unlockedAchievements !== 'undefined') ? unlockedAchievements.length : 0;
    const achTotal = (typeof ACHIEVEMENTS !== 'undefined') ? ACHIEVEMENTS.length : 0;
    const level = typeof getCurrentLevel === 'function' ? getCurrentLevel() : { level: 1, nameKey: 'lvl_novice', icon: '🌱', color: '#00E676' };

    screen.innerHTML = `
        <div class="row justify-content-center"><div class="col-lg-8">
            ${I18N_TEMPLATES.statsHeader()}
            ${I18N_TEMPLATES.statsCards(stats, achCount, achTotal)}
            <div class="bg-card rounded-4 p-4 mb-4">
                <h5 class="fw-bold mb-3">📈 ${t('scoreProgress')}</h5>
                <div style="position: relative; height: 250px; width: 100%;">
                    <canvas id="scoreChart"></canvas>
                </div>
            </div>
            <div class="bg-card rounded-4 p-4 mb-4">
                <h5 class="fw-bold mb-3">📅 ${t('weekActivity')}</h5>
                <div style="position: relative; height: 250px; width: 100%;">
                    <canvas id="weeklyChart"></canvas>
                </div>
            </div>
            <div class="bg-card rounded-4 p-4 mb-4">
                <h5 class="fw-bold mb-3">📋 ${t('details')}</h5>
                <div class="row g-3">
                    <div class="col-6"><p class="text-muted mb-1">${t('avgScore')}</p><p class="fw-bold">${stats.totalQuizzes > 0 ? Math.round((stats.totalXP || 0) / stats.totalQuizzes) : 0}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${t('languages')}</p><p class="fw-bold">${(stats.languagesUsed || []).join(', ') || '—'}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${t('fastestAnswer')}</p><p class="fw-bold">${stats.fastestAnswer < 999 ? stats.fastestAnswer + ' ' + t('seconds') : '—'}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${t('bestStreak')}</p><p class="fw-bold">${stats.maxStreak || 0} ${t('correctShort')}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${t('totalXP')}</p><p class="fw-bold">${stats.totalXP || 0} XP</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${t('level')}</p><p class="fw-bold">${typeof getLevelName === 'function' ? getLevelName(level) : t('lvl_novice')}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${t('fastestQuiz')}</p><p class="fw-bold">${stats.fastestQuiz < 9999 ? formatTime(stats.fastestQuiz) : '—'}</p></div>
                    <div class="col-6"><p class="text-muted mb-1">${t('perfectQuizzes')}</p><p class="fw-bold">${stats.perfectQuizzes || 0}</p></div>
                </div>
            </div>
            <div class="text-center mt-4">
                <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')"><i class="bi bi-play-fill me-2"></i>${t('startQuiz')}</button>
                <button class="btn btn-outline-accent rounded-pill px-4 ms-2" onclick="showScreen('achievements')"><i class="bi bi-award me-2"></i>${t('achievements')}</button>
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
                    label: t('points'),
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
    const dayNames = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')];
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
                    label: t('quizzes'),
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

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}