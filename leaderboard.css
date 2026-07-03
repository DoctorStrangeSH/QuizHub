import { getState, setState } from '../../store/state.js';
import { auth } from '../../firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export function renderAuth() {
    const t = getState().translations.auth || {};
    const isLogin = getState().authMode !== 'register';
    
    return `
        <div class="auth-container">
            <div class="auth-card glass-card animate-in">
                <div class="auth-header">
                    <div class="auth-logo mb-3">
                        <span class="auth-logo-icon">👑</span>
                    </div>
                    <h1 class="text-gradient fw-bold mb-2">${t.title || 'Quiz Empire'}</h1>
                    <p class="text-secondary">${t.subtitle || ''}</p>
                </div>
                
                <form id="auth-form" class="auth-form">
                    <div class="mb-3">
                        <label class="form-label text-secondary small text-uppercase fw-semibold">${t.email || 'Email'}</label>
                        <input type="email" id="auth-email" class="input-glass" 
                               placeholder="you@example.com" required autocomplete="email" />
                    </div>
                    <div class="mb-4">
                        <label class="form-label text-secondary small text-uppercase fw-semibold">${t.password || 'Password'}</label>
                        <input type="password" id="auth-password" class="input-glass" 
                               placeholder="••••••••" required minlength="6" autocomplete="current-password" />
                    </div>
                    <button type="submit" class="btn-premium w-100 mb-3">
                        ${isLogin ? (t.login || 'Sign In') : (t.register || 'Create Account')}
                    </button>
                </form>
                
                <p class="text-center text-secondary mb-0">
                    ${isLogin ? (t.noAccount || "Don't have an account?") : (t.hasAccount || "Already have an account?")}
                    <button class="btn btn-link text-decoration-none p-0 ms-1 fw-semibold" 
                            style="color: var(--accent);" 
                            onclick="window.switchAuthMode()">
                        ${isLogin ? (t.register || 'Register') : (t.login || 'Login')}
                    </button>
                </p>
                
                <div class="auth-footer mt-4">
                    <button class="btn btn-sm btn-outline-secondary me-2" onclick="window.toggleLang()">
                        ${getState().language === 'ru' ? '🇬🇧 EN' : '🇷🇺 RU'}
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
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const isLogin = getState().authMode !== 'register';
        
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            // Красивое отображение ошибок (позже сделаем лучше)
            alert(error.message);
        }
    };
}

// Глобальные хелперы
window.switchAuthMode = () => {
    const current = getState().authMode;
    setState('authMode', current === 'register' ? 'login' : 'register');
    import('../../router.js').then(module => {
        module.default();
    });
};