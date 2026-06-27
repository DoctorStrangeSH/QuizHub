// ============================================
// QuizHub — State Manager v1.1
// ============================================

const AppState = {
    _state: {
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
            theme: localStorage.getItem('quizhub-theme') || 'dark',
            locale: localStorage.getItem('quizhub-locale') || 'ru',
            difficulty: localStorage.getItem('quizhub-difficulty') || 'easy',
            category: localStorage.getItem('quizhub-category') || 'any',
            soundEnabled: true,
            animationType: localStorage.getItem('quizhub-animation') || 'flip',
        },

        coins: parseInt(localStorage.getItem('quizhub-coins') || '0'),
        purchasedItems: JSON.parse(localStorage.getItem('quizhub-purchases') || '[]'),
        activeCustomTheme: localStorage.getItem('quizhub-custom-theme') || null,
        activeBoosters: JSON.parse(localStorage.getItem('quizhub-active-boosters') || '[]'),

        stats: JSON.parse(localStorage.getItem('quizhub-stats') || JSON.stringify({
            totalQuizzes: 0, bestScore: 0, totalXP: 0, dayStreak: 0, perfectQuizzes: 0,
            lastQuizDate: '', lastActiveDate: '', languagesUsed: [], difficultiesCompleted: [],
            hardCompleted: 0, fastestAnswer: 999, fastestQuiz: 9999, maxStreak: 0,
            improved: false, survivalPlayed: 0, survivalMaxQuestions: 0,
            timedGames: 0, duelsPlayed: 0, categoriesCompleted: [],
            scienceQuizzes: 0, historyQuizzes: 0, sportQuizzes: 0,
            friendsCount: 0, giftsSent: 0, inTeam: false, closeWin: false,
            perfectQuizzes: 0, englishQuizzes: 0, russianQuizzes: 0,
            quizzesToday: 0, fastAnswersCount: 0,
        })),

        unlockedAchievements: JSON.parse(localStorage.getItem('quizhub-achievements') || '[]'),
        friendsList: JSON.parse(localStorage.getItem('quizhub-friends') || '[]'),
        userTeam: JSON.parse(localStorage.getItem('quizhub-team') || 'null'),

        currentScreen: 'home',
        isFirstLoad: true,
        isOnline: navigator.onLine,
    },

    _listeners: {},

    get(key) {
        const keys = key.split('.');
        let value = this._state;
        for (const k of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[k];
        }
        return value;
    },

    set(key, value) {
        const keys = key.split('.');
        let obj = this._state;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        const oldValue = obj[keys[keys.length - 1]];
        obj[keys[keys.length - 1]] = value;

        this._notify(key, value, oldValue);
        this._autoSave(key, value);
    },

    watch(key, callback) {
        if (!this._listeners[key]) this._listeners[key] = [];
        this._listeners[key].push(callback);
        return () => this.unwatch(key, callback);
    },

    unwatch(key, callback) {
        if (!this._listeners[key]) return;
        this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
    },

    _notify(key, newValue, oldValue) {
        if (this._listeners[key]) {
            this._listeners[key].forEach(cb => cb(newValue, oldValue));
        }
    },

    _autoSave(key, value) {
        if (value === null || value === undefined) return;

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
            'stats': 'quizhub-stats',
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

    reset() {
        this._state = {
            user: null, isLoggedIn: false,
            quiz: { questions: [], currentIndex: 0, score: 0, timeLeft: 15, totalTime: 0, startTime: 0, currentStreak: 0, maxStreak: 0, fastestAnswer: 999, correctAnswersCount: 0, isActive: false, mode: 'normal' },
            settings: { theme: 'dark', locale: 'ru', difficulty: 'easy', category: 'any', soundEnabled: true, animationType: 'flip' },
            coins: 0, purchasedItems: [], activeCustomTheme: null, activeBoosters: [],
            stats: { totalQuizzes: 0, bestScore: 0, totalXP: 0, dayStreak: 0, perfectQuizzes: 0 },
            unlockedAchievements: [], friendsList: [], userTeam: null,
            currentScreen: 'home', isFirstLoad: true, isOnline: navigator.onLine,
        };
    },

    getAll() { return JSON.parse(JSON.stringify(this._state)); },

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

window.AppState = AppState;

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