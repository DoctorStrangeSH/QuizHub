// Глобальное состояние (react-like паттерн)
const state = {
    currentUser: null,
    language: localStorage.getItem('lang') || 'ru',
    theme: localStorage.getItem('theme') || 'dark',
    currentRoute: 'auth',
    authMode: 'login',
    translations: {},
    friends: [],
    profile: null
};


const listeners = [];

export function getState() { return { ...state }; }

export function setState(key, value) {
    state[key] = value;
    listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
    listeners.push(fn);
    return () => listeners.splice(listeners.indexOf(fn), 1);
}

export default state;