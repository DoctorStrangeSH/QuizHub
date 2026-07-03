import { getState } from '../../store/state.js';
import { auth, db, doc, getDoc, updateDoc } from '../../firebase-config.js';

// Все достижения
const ALL_ACHIEVEMENTS = [
    { id: 'first_quiz', nameRU: 'Первый квиз', nameEN: 'First Quiz', descRU: 'Пройти первый квиз', descEN: 'Complete your first quiz', icon: '🎯', condition: (stats) => stats.totalGames >= 1 },
    { id: 'ten_quizzes', nameRU: 'Знаток', nameEN: 'Expert', descRU: 'Пройти 10 квизов', descEN: 'Complete 10 quizzes', icon: '📚', condition: (stats) => stats.totalGames >= 10 },
    { id: 'fifty_quizzes', nameRU: 'Эрудит', nameEN: 'Scholar', descRU: 'Пройти 50 квизов', descEN: 'Complete 50 quizzes', icon: '🎓', condition: (stats) => stats.totalGames >= 50 },
    { id: 'hundred_quizzes', nameRU: 'Гений', nameEN: 'Genius', descRU: 'Пройти 100 квизов', descEN: 'Complete 100 quizzes', icon: '🧠', condition: (stats) => stats.totalGames >= 100 },
    { id: 'first_win', nameRU: 'Первая победа', nameEN: 'First Win', descRU: 'Выиграть квиз (7+ правильных)', descEN: 'Win a quiz (7+ correct)', icon: '🏆', condition: (stats) => stats.totalWins >= 1 },
    { id: 'ten_wins', nameRU: 'Победитель', nameEN: 'Winner', descRU: 'Выиграть 10 квизов', descEN: 'Win 10 quizzes', icon: '🥇', condition: (stats) => stats.totalWins >= 10 },
    { id: 'perfect_score', nameRU: 'Идеальный результат', nameEN: 'Perfect Score', descRU: 'Ответить на все 10 вопросов правильно', descEN: 'Answer all 10 questions correctly', icon: '💯', condition: (stats) => stats.bestStreak >= 10 },
    { id: 'fast_learner', nameRU: 'Быстрый ученик', nameEN: 'Fast Learner', descRU: 'Набрать 1000 опыта', descEN: 'Earn 1000 experience', icon: '⚡', condition: (stats, profile) => (profile?.experience || 0) >= 1000 },
    { id: 'level_five', nameRU: '5 уровень', nameEN: 'Level 5', descRU: 'Достигнуть 5 уровня', descEN: 'Reach level 5', icon: '⭐', condition: (stats, profile) => (profile?.level || 1) >= 5 },
    { id: 'level_ten', nameRU: '10 уровень', nameEN: 'Level 10', descRU: 'Достигнуть 10 уровня', descEN: 'Reach level 10', icon: '🌟', condition: (stats, profile) => (profile?.level || 1) >= 10 },
    { id: 'social', nameRU: 'Душа компании', nameEN: 'Social', descRU: 'Добавить 5 друзей', descEN: 'Add 5 friends', icon: '👥', condition: (stats, profile) => (profile?.friends?.length || 0) >= 5 },
    { id: 'collector', nameRU: 'Коллекционер', nameEN: 'Collector', descRU: 'Накопить 1000 монет', descEN: 'Collect 1000 coins', icon: '💰', condition: (stats, profile) => (profile?.coins || 0) >= 1000 }
];

export function renderAchievements() {
    const t = getState().translations.achievements || {};
    const lang = getState().language;
    const isRU = lang === 'ru';
    
    return `
        <div class="achievements-container">
            <div class="achievements-header glass-card animate-in">
                <button class="btn btn-icon glass-card" onclick="window.navigateTo('home')">←</button>
                <h3 class="mb-0 fw-bold">${t.title || 'Достижения'}</h3>
            </div>
            <div class="achievements-grid" id="achievements-grid">
                <div class="text-center py-4">
                    <div class="loading-spinner"></div>
                    <p class="text-secondary mt-2">Загрузка достижений...</p>
                </div>
            </div>
        </div>
    `;
}

export async function loadAchievements() {
    const user = auth.currentUser;
    if (!user) return;
    
    const lang = getState().language;
    const isRU = lang === 'ru';
    
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return;
        
        const profile = userDoc.data();
        const stats = profile.stats || {};
        const unlockedAchievements = profile.achievements || [];
        
        const grid = document.getElementById('achievements-grid');
        if (!grid) return;
        
        grid.innerHTML = ALL_ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlockedAchievements.includes(ach.id);
            const name = isRU ? ach.nameRU : ach.nameEN;
            const desc = isRU ? ach.descRU : ach.descEN;
            
            return `
                <div class="achievement-card glass-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon-wrapper">
                        <span class="achievement-icon">${ach.icon}</span>
                        ${isUnlocked ? '<span class="achievement-check">✓</span>' : '<span class="achievement-lock">🔒</span>'}
                    </div>
                    <div class="achievement-info">
                        <h4 class="achievement-name">${name}</h4>
                        <p class="achievement-desc">${desc}</p>
                    </div>
                    ${isUnlocked ? '<div class="achievement-glow"></div>' : ''}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки достижений:', error);
    }
}

// Проверка и выдача достижений после игры
export async function checkAchievements() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return;
        
        const profile = userDoc.data();
        const stats = profile.stats || {};
        const currentAchievements = profile.achievements || [];
        
        const newAchievements = [];
        
        for (const ach of ALL_ACHIEVEMENTS) {
            if (!currentAchievements.includes(ach.id)) {
                if (ach.condition(stats, profile)) {
                    newAchievements.push(ach);
                }
            }
        }
        
        if (newAchievements.length > 0) {
            const newIds = newAchievements.map(a => a.id);
            await updateDoc(doc(db, 'users', user.uid), {
                achievements: [...currentAchievements, ...newIds]
            });
            
            // Показываем уведомление
            showAchievementPopup(newAchievements);
        }
        
    } catch (error) {
        console.error('Ошибка проверки достижений:', error);
    }
}

function showAchievementPopup(achievements) {
    const lang = getState().language;
    const isRU = lang === 'ru';
    
    achievements.forEach((ach, i) => {
        setTimeout(() => {
            const popup = document.createElement('div');
            popup.className = 'achievement-popup glass-card';
            popup.innerHTML = `
                <span class="popup-icon">${ach.icon}</span>
                <div>
                    <strong>🏆 Достижение разблокировано!</strong>
                    <span>${isRU ? ach.nameRU : ach.nameEN}</span>
                </div>
            `;
            document.body.appendChild(popup);
            
            setTimeout(() => {
                popup.classList.add('show');
                setTimeout(() => {
                    popup.classList.remove('show');
                    setTimeout(() => popup.remove(), 400);
                }, 3000);
            }, 100);
        }, i * 3500);
    });
}

export function attachAchievementsListeners() {
    loadAchievements();
}