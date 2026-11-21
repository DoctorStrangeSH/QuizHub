const FALLBACK_TIME_ZONES = [
    'UTC', 'Europe/Berlin', 'Europe/London', 'Europe/Paris', 'Europe/Moscow',
    'Europe/Warsaw', 'Europe/Kyiv', 'Europe/Istanbul', 'America/New_York',
    'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto',
    'America/Sao_Paulo', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok',
    'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai',
    'Australia/Sydney', 'Pacific/Auckland'
];

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

export function isValidIanaTimeZone(value) {
    if (typeof value !== 'string' || value.length < 1 || value.length > 64) return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
        return true;
    } catch {
        return false;
    }
}

export function getSupportedTimeZones() {
    let zones = FALLBACK_TIME_ZONES;
    try {
        if (typeof Intl.supportedValuesOf === 'function') {
            zones = Intl.supportedValuesOf('timeZone');
        }
    } catch {
        // Older browsers use the compact fallback list.
    }
    return [...new Set(['UTC', ...zones])].sort((a, b) => a === 'UTC' ? -1 : b === 'UTC' ? 1 : a.localeCompare(b));
}

export function isProfileTimeZonePreviewEnabled(location, auth) {
    if (!location || !auth?.currentUser || auth.currentUser.isAnonymous) return false;
    const params = new URLSearchParams(location.search || '');
    return ['localhost', '127.0.0.1'].includes(location.hostname) &&
        params.get('firebaseEmulator') === '1' &&
        params.get('profileTimeZonePreview') === '1' &&
        auth.app?.options?.projectId === 'demo-quizhub';
}

export function renderProfileTimeZoneSettings({
    timeZone = 'UTC',
    language = 'ru',
    previewEnabled = false,
    detectedTimeZone = 'UTC'
} = {}) {
    const isRU = language !== 'en';
    const selected = isValidIanaTimeZone(timeZone) ? timeZone :
        (isValidIanaTimeZone(detectedTimeZone) ? detectedTimeZone : 'UTC');
    const zones = getSupportedTimeZones();
    if (!zones.includes(selected)) zones.unshift(selected);
    const options = zones.map(zone => `<option value="${escapeHTML(zone)}"></option>`).join('');
    const copy = isRU ? {
        title: 'Часовой пояс',
        description: 'События и бонусы будут рассчитываться по выбранному местному времени.',
        label: 'Ваш часовой пояс',
        placeholder: 'Например, Europe/Berlin',
        detected: 'Предложено браузером',
        save: 'Сохранить часовой пояс',
        disabled: 'Изменение появится после безопасного серверного выпуска. Сейчас доступен только локальный тест.',
        ready: 'Изменения пока не сохранены.',
        confirm: 'Сохранить этот часовой пояс? Он будет использоваться для расчёта времени игровых событий.',
        cancel: 'Изменение отменено.'
    } : {
        title: 'Time zone',
        description: 'Events and bonuses will follow the selected local time.',
        label: 'Your time zone',
        placeholder: 'For example, Europe/Berlin',
        detected: 'Suggested by your browser',
        save: 'Save time zone',
        disabled: 'Editing will be available after the secure server release. Local preview only for now.',
        ready: 'Your change has not been saved yet.',
        confirm: 'Save this time zone? It will be used to calculate game event times.',
        cancel: 'Change cancelled.'
    };

    return `
        <section class="profile-timezone-card glass-card animate-in animate-in-delay-2" aria-labelledby="profile-timezone-title">
            <div class="profile-timezone-heading">
                <span class="profile-timezone-icon" aria-hidden="true"><i class="bi bi-globe2"></i></span>
                <div>
                    <h2 id="profile-timezone-title">${copy.title}</h2>
                    <p>${copy.description}</p>
                </div>
            </div>
            <label class="profile-timezone-label" for="profile-timezone-input">${copy.label}</label>
            <input id="profile-timezone-input" class="profile-timezone-input" type="text"
                list="profile-timezone-options" value="${escapeHTML(selected)}"
                placeholder="${copy.placeholder}" autocomplete="off" maxlength="64"
                aria-describedby="profile-timezone-status" />
            <datalist id="profile-timezone-options">${options}</datalist>
            <p class="profile-timezone-hint">${copy.detected}: ${escapeHTML(detectedTimeZone)}</p>
            <div class="profile-timezone-actions">
                <button type="button" id="profile-timezone-save" class="btn-premium" ${previewEnabled ? '' : 'disabled'}>
                    <i class="bi bi-check2-circle" aria-hidden="true"></i> ${copy.save}
                </button>
                <span id="profile-timezone-status" class="profile-timezone-status" role="status" aria-live="polite">${previewEnabled ? copy.ready : copy.disabled}</span>
            </div>
        </section>
    `;
}
