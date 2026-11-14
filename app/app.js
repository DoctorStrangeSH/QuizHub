import { getState, setState } from './store/state.js';
import { auth, db, doc, getDoc, updateDoc } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

async function loadTranslations() {
    const language = getState().language === 'en' ? 'en' : 'ru';
    try {
        const response = await fetch(`app/locales/${language}.json`, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`Translations request failed: ${response.status}`);
        const translations = await response.json();
        setState('translations', translations);
        return true;
    } catch (error) {
        console.error('Не удалось загрузить переводы:', error);
        if (language !== 'ru') {
            try {
                const fallback = await fetch('app/locales/ru.json');
                if (fallback.ok) setState('translations', await fallback.json());
            } catch (fallbackError) {
                console.error('Не удалось загрузить резервные переводы:', fallbackError);
            }
        }
        return false;
    }
}

function applyTheme() {
    const theme = getState().theme === 'light' ? 'light' : 'dark';
    setState('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

async function checkUserProfile(user) {
    if (!user) return false;
    try {
        const snapshot = await getDoc(doc(db, 'users', user.uid));
        return snapshot.exists() && Boolean(snapshot.data()?.nickname);
    } catch (error) {
        console.error('Ошибка проверки профиля:', error);
        return false;
    }
}

async function checkWeeklyReset() {
    const lastReset = localStorage.getItem('lastWeeklyReset');
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    if (!lastReset || new Date(lastReset) < monday) {
        const user = auth.currentUser;
        if (user) {
            await updateDoc(doc(db, 'users', user.uid), { weeklyExperience: 0 });
            localStorage.setItem('lastWeeklyReset', now.toISOString());
        }
    }
}

function hideSplash() {
    const splash = document.getElementById('initial-splash');
    splash?.classList.add('hidden');
    document.body.style.overflow = '';
}

async function renderCurrentRoute() {
    const router = await import('./router.js');
    await router.default();
}

window.toggleTheme = async () => {
    setState('theme', getState().theme === 'dark' ? 'light' : 'dark');
    applyTheme();
    await renderCurrentRoute();
};

window.toggleLang = async () => {
    setState('language', getState().language === 'ru' ? 'en' : 'ru');
    localStorage.setItem('lang', getState().language);
    await loadTranslations();
    await renderCurrentRoute();
};

async function init() {
    try {
        await loadTranslations();
        applyTheme();

        onAuthStateChanged(auth, async (user) => {
            try {
                setState('currentUser', user);

                if (!user) {
                    setState('currentRoute', 'auth');
                } else {
                    const savedRoute = sessionStorage.getItem('lastRoute');
                    const hasProfile = await checkUserProfile(user);
                    const safeSavedRoute = hasProfile && savedRoute && !['auth', 'createProfile', 'quiz'].includes(savedRoute);

                    setState(
                        'currentRoute',
                        safeSavedRoute ? savedRoute : (hasProfile ? 'home' : 'createProfile')
                    );
                }

                await renderCurrentRoute();
            } catch (error) {
                console.error('Ошибка запуска интерфейса:', error);
                setState('currentRoute', user ? 'home' : 'auth');
                try {
                    await renderCurrentRoute();
                } catch (renderError) {
                    console.error('Не удалось отобразить приложение:', renderError);
                }
            } finally {
                hideSplash();
            }
        }, (error) => {
            console.error('Ошибка отслеживания авторизации:', error);
            setState('currentRoute', 'auth');
            renderCurrentRoute().finally(hideSplash);
        });
    } catch (error) {
        console.error('Критическая ошибка инициализации QuizHub:', error);
        hideSplash();
        const root = document.getElementById('app-root');
        if (root) {
            root.innerHTML = '<main class="container py-5 text-center"><h1>Не удалось запустить QuizHub</h1><p>Проверьте подключение к интернету и обновите страницу.</p><button class="btn-premium" onclick="location.reload()">Повторить</button></main>';
        }
    }
}

document.addEventListener('DOMContentLoaded', init, { once: true });
