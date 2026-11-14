import { getState, setState } from './store/state.js';
import { renderAuth, attachAuthListeners } from './modules/auth/auth.js';

const appRoot = document.getElementById('app-root');

const routes = {
    auth: () => {
        appRoot.innerHTML = renderAuth();
        attachAuthListeners();
    },

    home: async () => {
        const m = await import('./modules/dashboard/dashboard.js');
        appRoot.innerHTML = await m.renderDashboard();
        m.attachDashboardListeners();
        checkDailyReward();
    },

    createProfile: async () => {
        const m = await import('./modules/profile/profile.js');
        appRoot.innerHTML = m.renderProfileCreate();
        m.attachProfileListeners();
    },

    profile: async () => {
        const m = await import('./modules/profile/profile.js');
        appRoot.innerHTML = await m.renderMyProfile();
        m.attachMyProfileListeners();
    },

    friends: async () => {
        const m = await import('./modules/friends/friends.js');
        appRoot.innerHTML = m.renderFriends();
        m.attachFriendsListeners();
    },

    quiz: async () => {
        const m = await import('./modules/quiz/quiz.js');
        appRoot.innerHTML = await m.renderQuiz();
        m.attachQuizListeners();
    },

    leaderboard: async () => {
        const m = await import('./modules/leaderboard/leaderboard.js');
        appRoot.innerHTML = m.renderLeaderboard();
        m.attachLeaderboardListeners();
    },

    achievements: async () => {
        const m = await import('./modules/achievements/achievements.js');
        appRoot.innerHTML = m.renderAchievements();
        m.attachAchievementsListeners();
    },

    shop: async () => {
        const m = await import('./modules/shop/shop.js');
        appRoot.innerHTML = m.renderShop();
        m.attachShopListeners();
    },

    chat: async () => {
        const m = await import('./modules/chat/chat.js');
        appRoot.innerHTML = m.renderChat();
        m.attachChatListeners();
    },

    events: async () => {
        const m = await import('./modules/events/events.js');
        appRoot.innerHTML = m.renderEvents();
        m.attachEventsListeners();
    }
};

async function checkDailyReward() {
    try {
        const m = await import('./modules/daily/daily.js');
        const rewardData = await m.checkDailyReward();
        if (rewardData.canClaim) {
            const popupHTML = m.renderDailyPopup(rewardData);
            const container = document.createElement('div');
            container.id = 'daily-popup-container';
            container.innerHTML = popupHTML;
            container.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:500;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);';
            document.body.appendChild(container);

            window.claimAndClose = async () => {
                const reward = await m.claimDailyReward();
                if (reward) {
                    container.innerHTML = `<div class="daily-popup glass-card animate-in text-center"><div class="result-icon">🎉</div><h3>Получено!</h3><p class="text-gold fw-bold">+${reward.coins} монет</p><button class="btn-premium mt-3" onclick="document.getElementById('daily-popup-container').remove()">Отлично!</button></div>`;
                }
            };
            window.closeDailyPopup = () => container.remove();
        }
    } catch (e) { }
}

window.navigateTo = async (route) => {
    if (!Object.hasOwn(routes, route)) return;
    const previousRoute = getState().currentRoute;
    if (previousRoute === 'quiz' && route !== 'quiz') {
        const quizModule = await import('./modules/quiz/quiz.js');
        quizModule.resetQuiz();
    }
    setState('currentRoute', route);
    sessionStorage.setItem('lastRoute', route);
    await router();
};

export default async function router() {
    const route = getState().currentRoute;
    sessionStorage.setItem('lastRoute', route);
    if (Object.hasOwn(routes, route)) {
        await routes[route]();
    }
}