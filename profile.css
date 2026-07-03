import { getState } from '../../store/state.js';
import { auth, db, doc, getDoc, updateDoc, increment, serverTimestamp } from '../../firebase-config.js';

const DAILY_REWARDS = [
    { day: 1, coins: 10, icon: '🎁' },
    { day: 2, coins: 20, icon: '🪙' },
    { day: 3, coins: 30, icon: '💎' },
    { day: 4, coins: 50, icon: '🏆' },
    { day: 5, coins: 75, icon: '👑' },
    { day: 6, coins: 100, icon: '🌟' },
    { day: 7, coins: 200, icon: '🔥' }
];

export async function checkDailyReward() {
    const user = auth.currentUser;
    if (!user) return { canClaim: false };
    
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return { canClaim: false };
        
        const data = userDoc.data();
        const lastClaim = data.lastDailyClaim?.toDate?.() || null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let canClaim = true;
        
        if (lastClaim) {
            const lastDate = new Date(lastClaim);
            lastDate.setHours(0, 0, 0, 0);
            
            if (lastDate.getTime() === today.getTime()) {
                canClaim = false;
            }
        }
        
        const streak = data.dailyStreak || 0;
        
        return {
            canClaim,
            streak,
            reward: DAILY_REWARDS[Math.min(streak, 6)],
            allRewards: DAILY_REWARDS
        };
        
    } catch (error) {
        console.error('Ошибка проверки наград:', error);
        return { canClaim: false };
    }
}

export async function claimDailyReward() {
    const user = auth.currentUser;
    if (!user) return false;
    
    try {
        const check = await checkDailyReward();
        if (!check.canClaim) return false;
        
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            coins: increment(check.reward.coins),
            dailyStreak: increment(1),
            lastDailyClaim: serverTimestamp()
        });
        
        return check.reward;
    } catch (error) {
        console.error('Ошибка получения награды:', error);
        return false;
    }
}

export function renderDailyPopup(rewardData) {
    if (!rewardData) return '';
    
    return `
        <div class="daily-popup glass-card animate-in">
            <div class="daily-popup-header">
                <h3>🎁 Ежедневная награда</h3>
                <p class="text-secondary">Заходи каждый день и получай призы!</p>
            </div>
            <div class="daily-streak-row">
                ${rewardData.allRewards.map((r, i) => `
                    <div class="daily-day ${i < rewardData.streak ? 'claimed' : ''} ${i === rewardData.streak ? 'current' : ''}">
                        <span class="daily-day-icon">${r.icon}</span>
                        <span class="daily-day-num">День ${r.day}</span>
                        <span class="daily-day-coins">+${r.coins}</span>
                    </div>
                `).join('')}
            </div>
            <button class="btn-gold w-100 mt-3" onclick="window.claimAndClose()">
                🎁 Забрать +${rewardData.reward.coins} монет
            </button>
        </div>
    `;
}