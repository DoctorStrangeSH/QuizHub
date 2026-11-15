import { getState, setState } from '../../store/state.js';
import { auth } from '../../firebase-config.js';
import {
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const labels = {
    ru: {
        google: 'Продолжить с Google',
        or: 'или через электронную почту',
        reset: 'Забыли пароль?',
        working: 'Подождите...',
        resetSent: 'Если адрес зарегистрирован, проверьте почту для восстановления пароля.',
        emailRequired: 'Введите адрес электронной почты.',
        unknown: 'Не удалось выполнить вход. Попробуйте ещё раз.',
        'auth/invalid-email': 'Проверьте адрес электронной почты.',
        'auth/invalid-credential': 'Неверный адрес или пароль.',
        'auth/wrong-password': 'Неверный адрес или пароль.',
        'auth/user-not-found': 'Неверный адрес или пароль.',
        'auth/email-already-in-use': 'Такой адрес уже зарегистрирован. Попробуйте войти.',
        'auth/weak-password': 'Придумайте пароль не короче 6 символов.',
        'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже.',
        'auth/network-request-failed': 'Нет соединения. Проверьте интернет.',
        'auth/popup-blocked': 'Браузер заблокировал окно Google. Разрешите всплывающие окна.',
        'auth/popup-closed-by-user': 'Окно входа Google было закрыто.',
        'auth/cancelled-popup-request': 'Вход через Google был отменён.',
        'auth/account-exists-with-different-credential': 'Этот адрес уже используется другим способом входа. Войдите через почту, затем свяжите способы входа в настройках аккаунта.',
        'auth/unauthorized-domain': 'Адрес сайта ещё не разрешён в Firebase Authentication.',
        'auth/operation-not-allowed': 'Этот способ входа пока не включён в Firebase.'
    },
    en: {
        google: 'Continue with Google',
        or: 'or use your email',
        reset: 'Forgot password?',
        working: 'Please wait...',
        resetSent: 'If the email is registered, check your inbox for a reset link.',
        emailRequired: 'Enter your email address.',
        unknown: 'Sign-in failed. Please try again.',
        'auth/invalid-email': 'Check your email address.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/wrong-password': 'Incorrect email or password.',
        'auth/user-not-found': 'Incorrect email or password.',
        'auth/email-already-in-use': 'This email is already registered. Try signing in.',
        'auth/weak-password': 'Use a password with at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/network-request-failed': 'Connection failed. Check your internet.',
        'auth/popup-blocked': 'Your browser blocked the Google pop-up. Allow pop-ups.',
        'auth/popup-closed-by-user': 'The Google sign-in window was closed.',
        'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
        'auth/account-exists-with-different-credential': 'This email uses a different sign-in method. Sign in with email first and link providers in account settings.',
        'auth/unauthorized-domain': 'This domain is not authorized for Firebase Authentication yet.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase yet.'
    }
};

export function authText(language, key) {
    const catalog = labels[language === 'en' ? 'en' : 'ru'];
    return catalog[key] || catalog.unknown;
}

function showFeedback(message, type = 'error') {
    const node = document.getElementById('auth-feedback');
    if (!node) return;
    node.textContent = message;
    node.className = 'auth-feedback ' + (type === 'success' ? 'auth-feedback--success' : 'auth-feedback--error');
    node.hidden = false;
}

function lockButtons(locked) {
    const form = document.getElementById('auth-form');
    const google = document.getElementById('auth-google');
    const reset = document.getElementById('auth-reset');
    for (const button of [form?.querySelector('[type="submit"]'), google, reset]) {
        if (button) button.disabled = locked;
    }
}

async function withBusyState(action) {
    lockButtons(true);
    const feedback = document.getElementById('auth-feedback');
    if (feedback) feedback.hidden = true;
    try {
        await action();
    } catch (error) {
        showFeedback(authText(getState().language, error?.code || 'unknown'));
    } finally {
        lockButtons(false);
    }
}

export function renderAuth() {
    const t = getState().translations.auth || {};
    const isLogin = getState().authMode !== 'register';
    const language = getState().language;
    return `
        <div class="auth-container">
            <div class="auth-card glass-card animate-in">
                <div class="auth-header">
                    <div class="auth-logo mb-3"><span class="auth-logo-icon">👑</span></div>
                    <h1 class="text-gradient fw-bold mb-2">${t.title || 'Quiz Empire'}</h1>
                    <p class="text-secondary">${t.subtitle || ''}</p>
                </div>

                <div id="auth-feedback" class="auth-feedback" role="status" aria-live="polite" hidden></div>

                <button type="button" id="auth-google" class="auth-google-btn w-100 mb-3">
                    <span aria-hidden="true" class="auth-google-icon">G</span>
                    ${authText(language, 'google')}
                </button>
                <div class="auth-divider mb-3"><span>${authText(language, 'or')}</span></div>

                <form id="auth-form" class="auth-form">
                    <div class="mb-3">
                        <label for="auth-email" class="form-label text-secondary small text-uppercase fw-semibold">${t.email || 'Email'}</label>
                        <input type="email" id="auth-email" class="input-glass"
                               placeholder="you@example.com" required autocomplete="email" />
                    </div>
                    <div class="mb-3">
                        <label for="auth-password" class="form-label text-secondary small text-uppercase fw-semibold">${t.password || 'Password'}</label>
                        <input type="password" id="auth-password" class="input-glass"
                               placeholder="••••••••" required minlength="6"
                               autocomplete="${isLogin ? 'current-password' : 'new-password'}" />
                    </div>
                    <button type="submit" class="btn-premium w-100 mb-2">
                        ${isLogin ? (t.login || 'Sign In') : (t.register || 'Create Account')}
                    </button>
                </form>
                ${isLogin ? `<button type="button" id="auth-reset" class="auth-reset-btn mb-3">${authText(language, 'reset')}</button>` : ''}

                <p class="text-center text-secondary mb-0">
                    ${isLogin ? (t.noAccount || "Don't have an account?") : (t.hasAccount || "Already have an account?")}
                    <button class="btn btn-link text-decoration-none p-0 ms-1 fw-semibold"
                            style="color: var(--accent);" onclick="window.switchAuthMode()">
                        ${isLogin ? (t.register || 'Register') : (t.login || 'Login')}
                    </button>
                </p>

                <div class="auth-footer mt-4">
                    <button class="btn btn-sm btn-outline-secondary me-2" onclick="window.toggleLang()">
                        ${language === 'ru' ? '🇬🇧 EN' : '🇷🇺 RU'}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="window.toggleTheme()">
                        ${getState().theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function attachAuthListeners() {
    const form = document.getElementById('auth-form');
    if (!form) return;

    form.onsubmit = (event) => {
        event.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const isLogin = getState().authMode !== 'register';
        return withBusyState(async () => {
            await setPersistence(auth, browserLocalPersistence);
            if (isLogin) await signInWithEmailAndPassword(auth, email, password);
            else await createUserWithEmailAndPassword(auth, email, password);
        });
    };

    document.getElementById('auth-google')?.addEventListener('click', () => withBusyState(async () => {
        await setPersistence(auth, browserLocalPersistence);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        // Existing Firebase users retain their UID, profile and progress.
        await signInWithPopup(auth, provider);
    }));

    document.getElementById('auth-reset')?.addEventListener('click', () => withBusyState(async () => {
        const email = document.getElementById('auth-email').value.trim();
        if (!email) {
            showFeedback(authText(getState().language, 'emailRequired'));
            return;
        }
        await sendPasswordResetEmail(auth, email);
        showFeedback(authText(getState().language, 'resetSent'), 'success');
    }));
}

window.switchAuthMode = () => {
    setState('authMode', getState().authMode === 'register' ? 'login' : 'register');
    import('../../router.js').then(module => module.default());
};
