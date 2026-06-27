// ============================================
// QuizHub — State Manager v1.0
// ============================================

const AppState = {
    // Приватное хранилище
    _state: {
        // Пользователь
        user: null,
        isLoggedIn: false,

        // Квиз
        quiz: {
            questions: [],
            currentIndex: 0,
            score: 0,
            timeLeft: 15,
            totalTime: 0,
            startTime: 0,
            currentStreak: 0,
            maxStreak: 0,
            fastestAnswer: 999,
            correctAnswersCount: 0,
            isActive: false,
            mode: 'normal', // 'normal', 'survival', 'timed', 'ai'
        },

        // Настройки
        settings: {
            theme: localStorage.getItem('quizhub-theme') || 'dark',
            locale: localStorage.getItem('quizhub-locale') || 'ru',
            difficulty: localStorage.getItem('quizhub-difficulty') || 'easy',
            category: localStorage.getItem('quizhub-category') || 'any',
            soundEnabled: true,
            animationType: localStorage.getItem('quizhub-animation') || 'flip',
        },

        // Экономика
        coins: parseInt(localStorage.getItem('quizhub-coins') || '0'),
        purchasedItems: [],
        activeCustomTheme: null,
        activeBoosters: [],

        // Статистика
        stats: {
            totalQuizzes: 0,
            bestScore: 0,
            totalXP: 0,
            dayStreak: 0,
            perfectQuizzes: 0,
        },

        // Достижения
        unlockedAchievements: [],

        // Социальное
        friendsList: [],
        userTeam: null,

        // UI
        currentScreen: 'home',
        isFirstLoad: true,
        isOnline: navigator.onLine,
    },

    // Подписчики на изменения
    _listeners: {},

    // Получить значение
    get(key) {
        const keys = key.split('.');
        let value = this._state;
        for (const k of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[k];
        }
        return value;
    },

    // Установить значение
    set(key, value) {
        const keys = key.split('.');
        let obj = this._state;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        const oldValue = obj[keys[keys.length - 1]];
        obj[keys[keys.length - 1]] = value;

        // Оповещаем подписчиков
        this._notify(key, value, oldValue);

        // Автосохранение в localStorage для важных ключей
        this._autoSave(key, value);
    },

    // Подписаться на изменения
    watch(key, callback) {
        if (!this._listeners[key]) {
            this._listeners[key] = [];
        }
        this._listeners[key].push(callback);
        return () => this.unwatch(key, callback);
    },

    // Отписаться
    unwatch(key, callback) {
        if (!this._listeners[key]) return;
        this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
    },

    // Оповестить подписчиков
    _notify(key, newValue, oldValue) {
        // Точный ключ
        if (this._listeners[key]) {
            this._listeners[key].forEach(cb => cb(newValue, oldValue));
        }
        // Родительские ключи
        const parts = key.split('.');
        for (let i = parts.length - 1; i >= 0; i--) {
            const parentKey = parts.slice(0, i).join('.');
            if (parentKey && this._listeners[parentKey]) {
                this._listeners[parentKey].forEach(cb => cb(this._state[parts[0]], oldValue));
            }
        }
    },

    // Автосохранение в localStorage
    _autoSave(key, value) {
        const saveMap = {
            'settings.theme': 'quizhub-theme',
            'settings.locale': 'quizhub-locale',
            'settings.difficulty': 'quizhub-difficulty',
            'settings.category': 'quizhub-category',
            'settings.animationType': 'quizhub-animation',
            'coins': 'quizhub-coins',
            'purchasedItems': 'quizhub-purchases',
            'activeCustomTheme': 'quizhub-custom-theme',
            'activeBoosters': 'quizhub-active-boosters',
            'unlockedAchievements': 'quizhub-achievements',
            'friendsList': 'quizhub-friends',
            'userTeam': 'quizhub-team',
        };

        const storageKey = saveMap[key];
        if (storageKey) {
            const valueToSave = typeof value === 'object' ? JSON.stringify(value) : value.toString();
            localStorage.setItem(storageKey, valueToSave);
        }
    },

    // Сбросить состояние (при выходе)
    reset() {
        this._state = {
            user: null,
            isLoggedIn: false,
            quiz: {
                questions: [],
                currentIndex: 0,
                score: 0,
                timeLeft: 15,
                totalTime: 0,
                startTime: 0,
                currentStreak: 0,
                maxStreak: 0,
                fastestAnswer: 999,
                correctAnswersCount: 0,
                isActive: false,
                mode: 'normal',
            },
            settings: {
                theme: 'dark',
                locale: 'ru',
                difficulty: 'easy',
                category: 'any',
                soundEnabled: true,
                animationType: 'flip',
            },
            coins: 0,
            purchasedItems: [],
            activeCustomTheme: null,
            activeBoosters: [],
            stats: {
                totalQuizzes: 0,
                bestScore: 0,
                totalXP: 0,
                dayStreak: 0,
                perfectQuizzes: 0,
            },
            unlockedAchievements: [],
            friendsList: [],
            userTeam: null,
            currentScreen: 'home',
            isFirstLoad: true,
            isOnline: navigator.onLine,
        };
    },

    // Получить всё состояние (для отладки)
    getAll() {
        return JSON.parse(JSON.stringify(this._state));
    },

    // Снимок состояния (для сохранения в Firestore)
    snapshot() {
        return {
            coins: this._state.coins,
            purchasedItems: this._state.purchasedItems,
            activeCustomTheme: this._state.activeCustomTheme,
            unlockedAchievements: this._state.unlockedAchievements,
            stats: this._state.stats,
            settings: this._state.settings,
            friendsList: this._state.friendsList,
        };
    },

    // Восстановить из снимка
    restore(snapshot) {
        if (snapshot.coins !== undefined) this.set('coins', snapshot.coins);
        if (snapshot.purchasedItems) this.set('purchasedItems', snapshot.purchasedItems);
        if (snapshot.activeCustomTheme !== undefined) this.set('activeCustomTheme', snapshot.activeCustomTheme);
        if (snapshot.unlockedAchievements) this.set('unlockedAchievements', snapshot.unlockedAchievements);
        if (snapshot.stats) this.set('stats', { ...this._state.stats, ...snapshot.stats });
        if (snapshot.settings) this.set('settings', { ...this._state.settings, ...snapshot.settings });
        if (snapshot.friendsList) this.set('friendsList', snapshot.friendsList);
    },
};

// Экспорт
window.AppState = AppState;

// Синхронизация с существующими глобальными переменными (временный мост)
function syncGlobalsToState() {
    AppState.set('coins', typeof userCoins !== 'undefined' ? userCoins : AppState.get('coins'));
    AppState.set('settings.difficulty', typeof selectedDifficulty !== 'undefined' ? selectedDifficulty : AppState.get('settings.difficulty'));
    AppState.set('settings.locale', typeof selectedLanguage !== 'undefined' ? selectedLanguage : AppState.get('settings.locale'));
}

// Слушаем изменения и обновляем глобальные переменные
AppState.watch('coins', (value) => {
    if (typeof userCoins !== 'undefined') userCoins = value;
    if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();
});

AppState.watch('settings.difficulty', (value) => {
    if (typeof selectedDifficulty !== 'undefined') selectedDifficulty = value;
});

AppState.watch('settings.locale', (value) => {
    if (typeof selectedLanguage !== 'undefined') selectedLanguage = value;
    if (typeof setLocale === 'function') setLocale(value);
});

console.log('📦 StateManager инициализирован');