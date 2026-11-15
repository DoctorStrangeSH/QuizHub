import { getState, setState } from './store/state.js';
import { renderAuth, attachAuthListeners } from './modules/auth/auth.js';

const appRoot = document.getElementById('app-root');
let renderRevision = 0;

const routes = {
    profileUnavailable: () => {
        const en = getState().language === 'en';
        const title = en ? 'Could not load your profile' : 'Не удалось загрузить профиль';
        const details = en
            ? 'Your account is safe. Check the connection and try again. Do not create another account.'
            : 'Ваш аккаунт сохранён. Проверьте подключение и повторите попытку. Создавать новый аккаунт не нужно.';
        const retry = en ? 'Try again' : 'Повторить';
        appRoot.innerHTML = `<main class="container py-5 text-center" role="alert">
            <h1>${title}</h1><p class="text-secondary">${details}</p>
            <button type="button" class="btn-premium" id="retry-profile">${retry}</button>
        </main>`;
        document.getElementById('retry-profile')?.addEventListener('click', () => location.reload());
    },
    auth: () => {
        appRoot.innerHTML = renderAuth();
        attachAuthListeners();
    },

    home: async (revision) => {
        const m = await import('./modules/dashboard/dashboard.js');
        if (revision !== renderRevision || getState().currentRoute !== 'home') return;
        const html = await m.renderDashboard();
        if (revision !== renderRevision || getState().currentRoute !== 'home') return;
        appRoot.innerHTML = html;
        m.attachDashboardListeners();
        checkDailyReward(revision);
    },

    createProfile: async (revision) => {
        const m = await import('./modules/profile/profile.js');
        if (revision !== renderRevision || getState().currentRoute !== 'createProfile') return;
        appRoot.innerHTML = m.renderProfileCreate();
        m.attachProfileListeners();
    },

    profile: async (revision) => {
        const m = await import('./modules/profile/profile.js');
        if (revision !== renderRevision || getState().currentRoute !== 'profile') return;
        const html = await m.renderMyProfile();
        if (revision !== renderRevision || getState().currentRoute !== 'profile') return;
        appRoot.innerHTML = html;
        m.attachMyProfileListeners();
    },

    friends: async (revision) => {
        const m = await import('./modules/friends/friends.js');
        if (revision !== renderRevision || getState().currentRoute !== 'friends') return;
        appRoot.innerHTML = m.renderFriends();
        m.attachFriendsListeners();
    },

    quiz: async (revision) => {
        const m = await import('./modules/quiz/quiz.js');
        if (revision !== renderRevision || getState().currentRoute !== 'quiz') return;
        const html = await m.renderQuiz();
        // An older render must never replace the screen selected afterward.
        if (revision !== renderRevision || getState().currentRoute !== 'quiz') return;
        appRoot.innerHTML = html;
        m.attachQuizListeners();
    },

    leaderboard: async (revision) => {
        const m = await import('./modules/leaderboard/leaderboard.js');
        if (revision !== renderRevision || getState().currentRoute !== 'leaderboard') return;
        appRoot.innerHTML = m.renderLeaderboard();
        m.attachLeaderboardListeners();
    },

    achievements: async (revision) => {
        const m = await import('./modules/achievements/achievements.js');
        if (revision !== renderRevision || getState().currentRoute !== 'achievements') return;
        appRoot.innerHTML = m.renderAchievements();
        m.attachAchievementsListeners();
    },

    shop: async (revision) => {
        const m = await import('./modules/shop/shop.js');
        if (revision !== renderRevision || getState().currentRoute !== 'shop') return;
        appRoot.innerHTML = m.renderShop();
        m.attachShopListeners();
    },

    chat: async (revision) => {
        const m = await import('./modules/chat/chat.js');
        if (revision !== renderRevision || getState().currentRoute !== 'chat') return;
        appRoot.innerHTML = m.renderChat();
        m.attachChatListeners();
    },

    events: async (revision) => {
        const m = await import('./modules/events/events.js');
        if (revision !== renderRevision || getState().currentRoute !== 'events') return;
        appRoot.innerHTML = m.renderEvents();
        m.attachEventsListeners();
    }
};

async function checkDailyReward(revision) {
    const ownerUid = getState().currentUser?.uid;
    if (!ownerUid) return;
    try {
        const m = await import('./modules/daily/daily.js');
        const rewardData = await m.checkDailyReward();
        if (revision !== renderRevision || getState().currentRoute !== 'home' ||
            getState().currentUser?.uid !== ownerUid) return;
        if (rewardData.canClaim) {
            const popupHTML = m.renderDailyPopup(rewardData);
            const container = document.createElement('div');
            container.id = 'daily-popup-container';
            container.innerHTML = popupHTML;
            container.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:500;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);';
            document.getElementById('daily-popup-container')?.remove();
            document.body.appendChild(container);

            window.claimAndClose = async () => {
                if (getState().currentUser?.uid !== ownerUid) return;
                const reward = await m.claimDailyReward();
                if (getState().currentUser?.uid !== ownerUid) return;
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
    setState('currentRoute', route);
    // Invalidate any in-flight render before awaiting the quiz cleanup import.
    const navigationRevision = ++renderRevision;
    if (previousRoute === 'quiz' && route !== 'quiz') {
        const quizModule = await import('./modules/quiz/quiz.js');
        quizModule.resetQuiz();
    }
    if (navigationRevision !== renderRevision) return;
    sessionStorage.setItem('lastRoute', route);
    await router();
};

export default async function router() {
    const revision = ++renderRevision;
    const route = getState().currentRoute;
    sessionStorage.setItem('lastRoute', route);
    if (Object.hasOwn(routes, route)) {
        await routes[route](revision);
    }
}