// ============================================
// QuizHub — Ежедневные награды v1.0
// ============================================

const DAILY_REWARDS = [
    { day: 1, coins: 10, icon: '🪙', label: '10 монет' },
    { day: 2, coins: 25, icon: '🪙', label: '25 монет' },
    { day: 3, coins: 50, icon: '🪙', label: '50 монет' },
    { day: 4, coins: 75, icon: '🪙', label: '75 монет' },
    { day: 5, coins: 100, icon: '🪙', label: '100 монет' },
    { day: 6, coins: 150, icon: '🪙', label: '150 монет' },
    { day: 7, coins: 300, icon: '🎁', label: '300 монет + бонус' },
];

const DAILY_BONUSES = {
    7: { xp: 100, achievement: null },
    14: { xp: 250, achievement: 'ach_streak_14_days' },
    30: { xp: 500, achievement: 'ach_streak_30_days' },
    60: { xp: 1000, achievement: null },
    90: { xp: 2000, achievement: null },
    180: { xp: 5000, achievement: null },
    365: { xp: 10000, achievement: null },
};

function getDailyRewardStatus() {
    const today = new Date().toISOString().split('T')[0];
    const lastClaim = localStorage.getItem('quizhub-daily-claim-date') || '';
    const streak = parseInt(localStorage.getItem('quizhub-daily-streak') || '0');

    if (lastClaim === today) {
        return { claimed: true, streak, day: Math.min(streak, 7) };
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = (lastClaim === yesterday) ? streak + 1 : 1;

    return { claimed: false, streak: newStreak, day: Math.min(newStreak, 7) };
}

function claimDailyReward() {
    const status = getDailyRewardStatus();

    if (status.claimed) {
        showToast('Ты уже получил награду сегодня! Возвращайся завтра 🎁', 'info');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const reward = DAILY_REWARDS[status.day - 1];

    // Начисляем монеты
    if (typeof addCoins === 'function') {
        addCoins(reward.coins);
    }

    // Проверяем бонусы за длительный streak
    if (DAILY_BONUSES[status.streak]) {
        const bonus = DAILY_BONUSES[status.streak];
        if (typeof addXP === 'function') {
            addXP(bonus.xp);
        }
        if (bonus.achievement && typeof unlockedAchievements !== 'undefined') {
            // Разблокируем достижение
            if (!AppState.get('unlockedAchievements').includes(bonus.achievement)) {
                const ach = ACHIEVEMENTS.find(a => a.id === bonus.achievement);
                if (ach) {
                    const unlocked = AppState.get('unlockedAchievements');
                    AppState.set('unlockedAchievements', [...unlocked, bonus.achievement]);
                    if (typeof showAchievements === 'function') {
                        showAchievements([ach]);
                    }
                }
            }
        }
    }

    // Сохраняем
    localStorage.setItem('quizhub-daily-claim-date', today);
    localStorage.setItem('quizhub-daily-streak', status.streak.toString());

    showToast(`🎉 День ${status.day}! Получено: ${reward.label}`, 'success');
    if (status.streak >= 7) {
        showToast(`🔥 Серия ${status.streak} дней! +${DAILY_BONUSES[status.streak]?.xp || 0} XP`, 'success');
    }

    renderDailyRewards();
}

function renderDailyRewards() {
    const container = document.getElementById('daily-rewards-container');
    if (!container) return;

    const status = getDailyRewardStatus();
    const dayIndex = status.claimed ? status.day - 1 : status.day - 1;

    container.innerHTML = `
        <div class="daily-rewards">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="fw-bold mb-0">🎁 ${typeof t === 'function' ? t('dailyRewards') || 'Ежедневные награды' : 'Ежедневные награды'}</h6>
                <span class="badge bg-accent">🔥 ${status.streak} ${typeof t === 'function' ? t('days') || 'дней' : 'дней'}</span>
            </div>
            <div class="daily-rewards-grid">
                ${DAILY_REWARDS.map((reward, i) => {
                    const isClaimed = status.claimed && i < status.day;
                    const isToday = i === dayIndex && !status.claimed;
                    const isFuture = i > dayIndex;
                    return `
                        <div class="daily-reward-item ${isClaimed ? 'claimed' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}">
                            <span class="daily-reward-icon">${reward.icon}</span>
                            <span class="daily-reward-day">${typeof t === 'function' ? t('day') || 'День' : 'День'} ${i + 1}</span>
                            <span class="daily-reward-label">${reward.label}</span>
                            ${isClaimed ? '<span class="daily-reward-check">✅</span>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            ${!status.claimed ? `
                <button class="btn btn-accent rounded-pill w-100 mt-3" onclick="claimDailyReward()">
                    🎁 ${typeof t === 'function' ? t('claimReward') || 'Забрать награду' : 'Забрать награду'}
                </button>
            ` : `
                <button class="btn btn-outline-accent rounded-pill w-100 mt-3" disabled>
                    ✅ ${typeof t === 'function' ? t('alreadyClaimed') || 'Уже получено' : 'Уже получено'}
                </button>
            `}
        </div>
    `;
}

// Встраиваем на главный экран
function injectDailyRewards() {
    const homeScreen = document.getElementById('screen-home');
    if (!homeScreen) return;

    // Ждём когда главный экран станет активным
    const observer = new MutationObserver(() => {
        if (homeScreen.classList.contains('active')) {
            if (!document.getElementById('daily-rewards-container')) {
                const quizSetup = homeScreen.querySelector('.quiz-setup');
                if (quizSetup) {
                    const container = document.createElement('div');
                    container.id = 'daily-rewards-container';
                    container.className = 'daily-rewards-wrapper mb-4';
                    quizSetup.parentNode.insertBefore(container, quizSetup);
                    renderDailyRewards();
                }
            } else {
                renderDailyRewards();
            }
        }
    });

    observer.observe(homeScreen, { attributes: true, attributeFilter: ['class'] });

    if (homeScreen.classList.contains('active')) {
        setTimeout(() => {
            if (!document.getElementById('daily-rewards-container')) {
                const quizSetup = homeScreen.querySelector('.quiz-setup');
                if (quizSetup) {
                    const container = document.createElement('div');
                    container.id = 'daily-rewards-container';
                    container.className = 'daily-rewards-wrapper mb-4';
                    quizSetup.parentNode.insertBefore(container, quizSetup);
                    renderDailyRewards();
                }
            }
        }, 200);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(injectDailyRewards, 500);

    // Обновляем при возврате на главную
    EventBus.on(EVENTS.SCREEN_CHANGED, (screenName) => {
        if (screenName === 'home') {
            setTimeout(renderDailyRewards, 300);
        }
    });
});