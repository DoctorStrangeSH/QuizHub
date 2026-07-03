import { getState, setState } from './store/state.js';
import { auth, db, doc, getDoc } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Загрузка переводов
async function loadTranslations() {
    const lang = getState().language;
    const response = await fetch(`app/locales/${lang}.json`);
    const translations = await response.json();
    setState('translations', translations);
}

// Применение темы
function applyTheme() {
    const theme = getState().theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Проверка наличия профиля
async function checkUserProfile(user) {
    if (!user) return false;
    try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() && docSnap.data().nickname;
    } catch (error) {
        console.error('Ошибка проверки профиля:', error);
        return false;
    }
}

// Глобальные функции
window.toggleTheme = () => {
    const current = getState().theme;
    setState('theme', current === 'dark' ? 'light' : 'dark');
    applyTheme();
    import('./router.js').then(module => module.default());
};

window.toggleLang = async () => {
    const current = getState().language;
    setState('language', current === 'ru' ? 'en' : 'ru');
    localStorage.setItem('lang', getState().language);
    await loadTranslations();
    import('./router.js').then(module => module.default());
};

// Старт приложения
async function init() {
    await loadTranslations();
    applyTheme();
    
    // Слушаем авторизацию
    onAuthStateChanged(auth, async (user) => {
        setState('currentUser', user);
        
        if (user) {
            // Проверяем профиль ПЕРЕД тем как показать страницу
            const hasProfile = await checkUserProfile(user);
            
            if (hasProfile) {
                setState('currentRoute', 'home');
            } else {
                setState('currentRoute', 'createProfile');
            }
        } else {
            setState('currentRoute', 'auth');
        }
        
        // Загружаем роутер
        import('./router.js').then(module => {
            module.default();
            
            // Скрываем splash
            const splash = document.getElementById('initial-splash');
            if (splash) {
                splash.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', init);