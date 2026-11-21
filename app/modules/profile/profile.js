import { getState, setState } from '../../store/state.js';
import { auth, db, doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from '../../firebase-config.js';
import { renderPublicProfile, loadProfile } from './public-profile.js';
import { directoryCollection } from './profile-read-source.js';
import { isProfileTimeZonePreviewEnabled, isValidIanaTimeZone, renderProfileTimeZoneSettings } from './profile-timezone-settings.js';

export function renderProfileCreate() {
    const t = getState().translations.profile || {};
    return `
        <div class="profile-create-wrapper">
            <div class="profile-bg-decoration">
                <div class="bg-circle bg-circle-1"></div>
                <div class="bg-circle bg-circle-2"></div>
                <div class="bg-circle bg-circle-3"></div>
            </div>
            <div class="profile-create-card glass-card animate-in">
                <div class="profile-icon-wrapper"><div class="profile-icon-glow"></div><span class="profile-icon" aria-hidden="true"><i class="bi bi-hexagon-fill"></i><b>Q</b></span></div>
                <div class="profile-header text-center"><h1 class="profile-title text-gradient">QuizHub</h1><p class="profile-subtitle">Создайте своё королевское имя</p></div>
                <form id="profile-form" class="profile-form">
                    <div class="nickname-input-wrapper">
                        <label class="nickname-label"><span class="label-icon">⚜️</span>Ваш никнейм</label>
                        <div class="nickname-input-group">
                            <span class="input-at">@</span>
                            <input type="text" id="nickname-input" class="nickname-input" placeholder="Например: DarkLord" minlength="3" maxlength="20" autocomplete="off" required />
                            <button type="button" id="check-nickname-btn" class="check-btn">
                                <span class="check-btn-text">Проверить</span>
                                <span class="check-btn-loading" style="display:none;"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span></span>
                            </button>
                        </div>
                        <div id="nickname-status" class="nickname-status"></div>
                        <div class="nickname-hints"><span class="hint">✓ 3-20 символов</span><span class="hint">✓ Буквы, цифры и _</span><span class="hint">✓ Уникальное имя</span></div>
                    </div>
                    <button type="submit" id="save-profile-btn" class="save-btn" disabled>
                        <span class="save-btn-text">⚡ Создать профиль</span>
                        <span class="save-btn-loading" style="display:none;">Создание...</span>
                    </button>
                </form>
                <p class="profile-footer-text">Это имя увидят другие игроки. Выбирайте с умом!</p>
            </div>
        </div>
    `;
}

export function attachProfileListeners() {
    const nicknameInput = document.getElementById('nickname-input');
    const checkBtn = document.getElementById('check-nickname-btn');
    const saveBtn = document.getElementById('save-profile-btn');
    const statusDiv = document.getElementById('nickname-status');
    const checkBtnText = document.querySelector('.check-btn-text');
    const checkBtnLoading = document.querySelector('.check-btn-loading');
    const saveBtnText = document.querySelector('.save-btn-text');
    const saveBtnLoading = document.querySelector('.save-btn-loading');
    let isNicknameValid = false;
    let isChecking = false;

    nicknameInput.addEventListener('input', () => {
        isNicknameValid = false;
        saveBtn.disabled = true;
        saveBtn.classList.remove('ready');
        statusDiv.className = 'nickname-status';
        statusDiv.innerHTML = '';
        const value = nicknameInput.value.trim();
        if (value.length > 0 && value.length < 3) { statusDiv.className = 'nickname-status error'; statusDiv.innerHTML = '⚠️ Минимум 3 символа'; }
        else if (value.length > 20) { statusDiv.className = 'nickname-status error'; statusDiv.innerHTML = '⚠️ Максимум 20 символов'; }
        else if (value.length > 0 && !/^[a-zA-Z0-9_]+$/.test(value)) { statusDiv.className = 'nickname-status error'; statusDiv.innerHTML = '⚠️ Только буквы, цифры и _'; }
    });

    checkBtn.addEventListener('click', async () => {
        if (isChecking) return;
        const nickname = nicknameInput.value.trim();
        if (nickname.length < 3) { statusDiv.className = 'nickname-status error'; statusDiv.innerHTML = '⚠️ Минимум 3 символа'; return; }
        if (!/^[a-zA-Z0-9_]+$/.test(nickname)) { statusDiv.className = 'nickname-status error'; statusDiv.innerHTML = '⚠️ Только буквы, цифры и _'; return; }
        isChecking = true;
        checkBtn.classList.add('loading');
        checkBtnText.style.display = 'none';
        checkBtnLoading.style.display = 'flex';
        statusDiv.className = 'nickname-status checking';
        statusDiv.innerHTML = '🔍 Проверяем...';
        try {
            const usersRef = collection(db, directoryCollection());
            const q = query(usersRef, where('nicknameLower', '==', nickname.toLowerCase()));
            const snap = await getDocs(q);
            if (snap.empty) {
                statusDiv.className = 'nickname-status success';
                statusDiv.innerHTML = '✅ Имя свободно! Отличный выбор!';
                isNicknameValid = true;
                saveBtn.disabled = false;
                saveBtn.classList.add('ready');
            } else {
                statusDiv.className = 'nickname-status error';
                statusDiv.innerHTML = '❌ Это имя уже занято';
                isNicknameValid = false;
                saveBtn.disabled = true;
                saveBtn.classList.remove('ready');
            }
        } catch (error) {
            statusDiv.className = 'nickname-status error';
            statusDiv.innerHTML = '❌ Ошибка проверки';
        } finally {
            isChecking = false;
            checkBtn.classList.remove('loading');
            checkBtnText.style.display = 'inline';
            checkBtnLoading.style.display = 'none';
        }
    });

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isNicknameValid) return;
        const user = auth.currentUser;
        if (!user) return;
        saveBtn.disabled = true;
        saveBtn.classList.add('saving');
        saveBtnText.style.display = 'none';
        saveBtnLoading.style.display = 'inline';
        try {
            const nickname = nicknameInput.value.trim();
            let timeZone = 'UTC';
            try {
                const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (typeof detectedTimeZone === 'string' && detectedTimeZone) timeZone = detectedTimeZone;
            } catch {
                // UTC is the documented fallback when the browser cannot expose an IANA timezone.
            }
            const params = new URLSearchParams(window.location.search);
            const profileCreatePreview = ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
                params.get('firebaseEmulator') === '1' &&
                params.get('profileCreatePreview') === '1';

            if (profileCreatePreview) {
                // Trusted local preview: server derives UID/email and atomically
                // creates private/public profile plus nickname claim.
                // Fail closed; never fall back to client setDoc on transport errors.
                const { createLocalFirebaseProfileCreateInvoker } = await import('./firebase-profile-create-preview.js');
                await createLocalFirebaseProfileCreateInvoker()(nickname, timeZone);
            } else {
                await setDoc(doc(db, 'users', user.uid), {
                nickname, nicknameLower: nickname.toLowerCase(), email: user.email, timeZone,
                createdAt: serverTimestamp(), level: 1, experience: 0, coins: 100,
                quizzesCompleted: 0, wins: 0, friends: [], friendRequests: [], sentRequests: [],
                achievements: [], dailyStreak: 0, lastDailyClaim: null,
                equippedTheme: 'theme_default', equippedFrame: 'frame_default', equippedParticles: 'particles_default',
                ownedThemes: ['theme_default', 'theme_light'], ownedFrames: ['frame_default'], ownedParticles: ['particles_default'],
                activeBonuses: {},
                stats: { totalGames: 0, totalWins: 0, totalQuestions: 0, correctAnswers: 0, bestStreak: 0 }
                });
            }
            setState('profile', { nickname, level: 1, experience: 0, coins: 100 });
            document.querySelector('.profile-create-card')?.classList.add('fade-out');
            setTimeout(() => window.navigateTo('home'), 400);
        } catch (error) {
            alert('Ошибка: ' + error.message);
            saveBtn.disabled = false;
            saveBtn.classList.remove('saving');
            saveBtnText.style.display = 'inline';
            saveBtnLoading.style.display = 'none';
        }
    });
    setTimeout(() => nicknameInput?.focus(), 600);
}

export async function renderMyProfile() {
    const user = auth.currentUser;
    if (!user) { window.navigateTo('auth'); return ''; }
    const profile = await loadProfile(user.uid);
    if (!profile) { window.navigateTo('createProfile'); return ''; }
    return renderPublicProfile(profile, true);
}

export function attachMyProfileListeners() {
    window.toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };
    window.closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); };

    const timeZoneInput = document.getElementById('profile-timezone-input');
    const timeZoneSave = document.getElementById('profile-timezone-save');
    const timeZoneStatus = document.getElementById('profile-timezone-status');
    if (!timeZoneInput || !timeZoneSave || !timeZoneStatus) return;

    const isRU = getState().language !== 'en';
    const previewEnabled = isProfileTimeZonePreviewEnabled(window.location, auth);
    const messages = isRU ? {
        unchanged: 'Этот часовой пояс уже выбран.',
        invalid: 'Укажите корректный часовой пояс IANA, например Europe/Berlin.',
        confirm: 'Сохранить этот часовой пояс? Он будет использоваться для расчёта времени игровых событий.',
        cancelled: 'Изменение отменено.',
        saving: 'Сохраняем настройку…',
        saved: 'Часовой пояс сохранён. Новые расчёты событий будут использовать его.',
        failed: 'Не удалось сохранить часовой пояс. Попробуйте ещё раз.',
        changed: 'Есть несохранённое изменение.'
    } : {
        unchanged: 'This time zone is already selected.',
        invalid: 'Enter a valid IANA time zone, for example Europe/Berlin.',
        confirm: 'Save this time zone? It will be used to calculate game event times.',
        cancelled: 'Change cancelled.',
        saving: 'Saving preference…',
        saved: 'Time zone saved. New event calculations will use this preference.',
        failed: 'Could not save the time zone. Please try again.',
        changed: 'You have an unsaved change.'
    };
    let savedTimeZone = timeZoneInput.value.trim();
    timeZoneSave.disabled = !previewEnabled || timeZoneInput.value.trim() === savedTimeZone;

    timeZoneInput.addEventListener('input', () => {
        timeZoneSave.disabled = !previewEnabled || timeZoneInput.value.trim() === savedTimeZone;
        timeZoneStatus.textContent = timeZoneInput.value.trim() === savedTimeZone
            ? messages.unchanged
            : messages.changed;
        timeZoneStatus.classList.toggle('is-error', false);
        timeZoneStatus.classList.toggle('is-success', false);
    });

    timeZoneSave.addEventListener('click', async () => {
        const nextTimeZone = timeZoneInput.value.trim();
        if (!isValidIanaTimeZone(nextTimeZone)) {
            timeZoneStatus.textContent = messages.invalid;
            timeZoneStatus.classList.add('is-error');
            return;
        }
        if (nextTimeZone === savedTimeZone) {
            timeZoneStatus.textContent = messages.unchanged;
            return;
        }
        if (!window.confirm(messages.confirm)) {
            timeZoneStatus.textContent = messages.cancelled;
            return;
        }

        timeZoneSave.disabled = true;
        timeZoneInput.disabled = true;
        timeZoneStatus.classList.remove('is-error', 'is-success');
        timeZoneStatus.textContent = messages.saving;
        try {
            const { createLocalFirebaseProfileTimeZoneInvoker } = await import('./firebase-profile-timezone-invoker.js');
            const updateTimeZone = createLocalFirebaseProfileTimeZoneInvoker();
            await updateTimeZone(nextTimeZone);
            savedTimeZone = nextTimeZone;
            timeZoneStatus.textContent = messages.saved;
            timeZoneStatus.classList.add('is-success');
        } catch (error) {
            console.error('Timezone preference update failed:', error);
            timeZoneStatus.textContent = messages.failed;
            timeZoneStatus.classList.add('is-error');
            timeZoneSave.disabled = false;
        } finally {
            timeZoneInput.disabled = false;
        }
    });
}