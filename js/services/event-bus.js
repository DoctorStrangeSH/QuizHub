// ============================================
// QuizHub — Шина событий (EventBus)
// ============================================

const EventBus = {
    _events: {},

    // Подписаться на событие
    on(event, callback) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(callback);
        return () => this.off(event, callback);
    },

    // Отписаться
    off(event, callback) {
        if (!this._events[event]) return;
        this._events[event] = this._events[event].filter(cb => cb !== callback);
    },

    // Вызвать событие
    emit(event, data) {
        if (!this._events[event]) return;
        this._events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Ошибка в обработчике события "${event}":`, error);
            }
        });
    },

    // Подписаться один раз
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    },

    // Список всех событий (для отладки)
    listEvents() {
        return Object.keys(this._events).map(key => ({
            event: key,
            listeners: this._events[key].length
        }));
    },

    // Очистить все обработчики
    clear() {
        this._events = {};
    }
};

// Экспорт в глобальную область
window.EventBus = EventBus;

// События приложения (константы)
const EVENTS = {
    QUIZ_STARTED: 'quiz:started',
    QUIZ_FINISHED: 'quiz:finished',
    QUIZ_ANSWER: 'quiz:answer',
    QUIZ_TIMEOUT: 'quiz:timeout',
    AUTH_LOGIN: 'auth:login',
    AUTH_LOGOUT: 'auth:logout',
    COINS_CHANGED: 'coins:changed',
    ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
    QUEST_COMPLETED: 'quest:completed',
    THEME_CHANGED: 'theme:changed',
    LOCALE_CHANGED: 'locale:changed',
    SCREEN_CHANGED: 'screen:changed',
    LEADERBOARD_UPDATED: 'leaderboard:updated',
    TOURNAMENT_JOINED: 'tournament:joined',
    FRIEND_ADDED: 'friend:added',
    GIFT_RECEIVED: 'gift:received',
};

window.EVENTS = EVENTS;

console.log('📡 EventBus инициализирован');