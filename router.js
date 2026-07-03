import { getState } from '../../store/state.js';
import { auth, db, doc, getDoc, collection, query, orderBy, limit, getDocs } from '../../firebase-config.js';

export function renderLeaderboard() {
    const t = getState().translations.leaderboard || {};
    
    return `
        <div class="leaderboard-container">
            <div class="leaderboard-header glass-card animate-in">
                <button class="btn btn-icon glass-card" onclick="window.navigateTo('home')">←</button>
                <h3 class="mb-0 fw-bold">${t.title || 'Таблица лидеров'}</h3>
            </div>
            
            <!-- Вкладки -->
            <div class="leaderboard-tabs glass-card animate-in animate-in-delay-1">
                <button class="lb-tab active" data-tab="global" onclick="window.switchLeaderboard('global', this)">
                    🌍 ${t.global || 'Глобальный'}
                </button>
                <button class="lb-tab" data-tab="weekly" onclick="window.switchLeaderboard('weekly', this)">
                    📅 ${t.weekly || 'За неделю'}
                </button>
            </div>
            
            <!-- Список -->
            <div class="leaderboard-list glass-card animate-in animate-in-delay-2" id="leaderboard-list">
                <div class="text-center py-4">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        </div>
    `;
}

export async function loadLeaderboard(type = 'global') {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    
    try {
        const usersRef = collection(db, 'users');
        let q;
        
        if (type === 'weekly') {
            q = query(usersRef, orderBy('weeklyExperience', 'desc'), limit(50));
        } else {
            q = query(usersRef, orderBy('experience', 'desc'), limit(50));
        }
        
        const snapshot = await getDocs(q);
        const leaders = [];
        
        snapshot.forEach(doc => {
            leaders.push({ id: doc.id, ...doc.data() });
        });
        
        const currentUserId = auth.currentUser?.uid;
        
        list.innerHTML = leaders.map((leader, index) => {
            const rank = index + 1;
            const isCurrentUser = leader.id === currentUserId;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
            
            return `
                <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''} ${rank <= 3 ? 'top-three' : ''}">
                    <div class="lb-rank">${medal}</div>
                    <div class="lb-avatar">👤</div>
                    <div class="lb-info">
                        <span class="lb-name">${leader.nickname || 'Игрок'}</span>
                        <span class="lb-level">⭐ Ур. ${leader.level || 1}</span>
                    </div>
                    <div class="lb-stats">
                        <span class="lb-xp">${leader.experience || 0} XP</span>
                        <span class="lb-wins">🏆 ${leader.wins || 0}</span>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки лидеров:', error);
        list.innerHTML = '<p class="text-center text-secondary py-4">Ошибка загрузки</p>';
    }
}

export function attachLeaderboardListeners() {
    loadLeaderboard('global');
    
    window.switchLeaderboard = (type, el) => {
        document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        loadLeaderboard(type);
    };
}