import { getState } from '../../store/state.js';
import { auth, functions, httpsCallable } from '../../firebase-config.js';
import { createFirebaseAccountLedgerHistoryInvoker } from './firebase-account-ledger-history-invoker.js';

const PAGE_SIZE = 20;
const FILTERS = ['all', 'quiz_reward', 'daily_login_reward', 'shop_purchase', 'shop_refund', 'achievement_unlock'];

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

function copy(language) {
    return language === 'en' ? {
        title: 'Activity history',
        subtitle: 'A clear record of rewards, purchases and progress.',
        verified: 'Verified server events',
        disabled: 'Your verified activity history will be available after the secure server release. No unverified legacy records are shown here.',
        loading: 'Loading activity…',
        empty: 'No operations yet',
        emptyHint: 'Rewards, purchases and achievements will appear here.',
        error: 'Could not load activity. Please try again.',
        retry: 'Try again',
        more: 'Load more',
        loadingMore: 'Loading…',
        all: 'All activity',
        quiz_reward: 'Quiz reward',
        daily_login_reward: 'Daily login reward',
        shop_purchase: 'Shop purchase',
        shop_refund: 'Refund',
        achievement_unlock: 'Achievement unlocked',
        coins: 'Coins',
        xp: 'XP'
    } : {
        title: 'История операций',
        subtitle: 'Все награды, покупки и достижения в одном месте.',
        verified: 'Подтверждённые сервером операции',
        disabled: 'Проверенная история операций появится после безопасного серверного выпуска. Старые неподтверждённые записи здесь не показываются.',
        loading: 'Загружаем историю…',
        empty: 'Пока нет операций',
        emptyHint: 'Здесь будут появляться награды, покупки и достижения.',
        error: 'Не удалось загрузить историю. Попробуйте ещё раз.',
        retry: 'Повторить',
        more: 'Показать ещё',
        loadingMore: 'Загрузка…',
        all: 'Все операции',
        quiz_reward: 'Награда за квиз',
        daily_login_reward: 'Ежедневная награда',
        shop_purchase: 'Покупка в магазине',
        shop_refund: 'Возврат покупки',
        achievement_unlock: 'Получено достижение',
        coins: 'Монеты',
        xp: 'Опыт'
    };
}

function formatDate(timestamp, language) {
    try {
        return new Intl.DateTimeFormat(language === 'en' ? 'en' : 'ru', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(timestamp));
    } catch {
        return '';
    }
}

function signed(value) {
    return value > 0 ? '+' + value.toLocaleString() : value.toLocaleString();
}

function renderEntry(entry, messages, language) {
    const details = [];
    if (entry.coinsDelta !== 0) {
        details.push('<span class="ledger-delta coins ' + (entry.coinsDelta < 0 ? 'negative' : 'positive') + '">' +
            signed(entry.coinsDelta) + ' <small>' + messages.coins + '</small></span>');
    }
    if (entry.xpDelta !== 0) {
        details.push('<span class="ledger-delta xp positive">+' +
            entry.xpDelta.toLocaleString() + ' <small>' + messages.xp + '</small></span>');
    }
    const icons = {
        shop_purchase: 'bi-bag',
        daily_login_reward: 'bi-calendar-check',
        achievement_unlock: 'bi-award',
        shop_refund: 'bi-arrow-counterclockwise',
        quiz_reward: 'bi-controller'
    };
    const label = messages[entry.type];
    const date = formatDate(entry.occurredAt, language);
    return '<li class="ledger-entry">' +
        '<span class="ledger-entry-icon ' + escapeHTML(entry.type) + '" aria-hidden="true"><i class="bi ' + icons[entry.type] + '"></i></span>' +
        '<div class="ledger-entry-main"><strong>' + label + '</strong>' +
        '<time datetime="' + new Date(entry.occurredAt).toISOString() + '">' + date + '</time></div>' +
        '<div class="ledger-entry-deltas">' + details.join('') + '</div></li>';
}

export function renderAccountLedgerHistory({ language = 'ru', previewEnabled = false } = {}) {
    const messages = copy(language);
    const filterOptions = FILTERS.map(type => {
        const label = type === 'all' ? messages.all : messages[type];
        return '<option value="' + type + '">' + label + '</option>';
    }).join('');
    return '<section class="profile-ledger-card glass-card animate-in animate-in-delay-2" id="profile-ledger-history" ' +
        'aria-labelledby="profile-ledger-title" data-preview-enabled="' + (previewEnabled ? 'true' : 'false') + '">' +
        '<div class="profile-ledger-heading"><div class="profile-ledger-heading-copy">' +
        '<span class="profile-ledger-icon" aria-hidden="true"><i class="bi bi-journal-text"></i></span><div>' +
        '<h2 id="profile-ledger-title">' + messages.title + '</h2><p>' + messages.subtitle + '</p></div></div>' +
        '<span class="profile-ledger-verified"><i class="bi bi-shield-check" aria-hidden="true"></i> ' + messages.verified + '</span></div>' +
        (previewEnabled
            ? '<div class="profile-ledger-toolbar"><label class="visually-hidden" for="profile-ledger-filter">' + messages.all + '</label>' +
                '<select id="profile-ledger-filter" class="profile-ledger-filter">' + filterOptions + '</select></div>' +
                '<div id="profile-ledger-status" class="profile-ledger-status" role="status" aria-live="polite">' + messages.loading + '</div>' +
                '<ul id="profile-ledger-list" class="profile-ledger-list" aria-label="' + messages.title + '"></ul>' +
                '<div class="profile-ledger-footer"><button type="button" id="profile-ledger-more" class="btn-premium profile-ledger-more" hidden>' +
                messages.more + '</button></div>'
            : '<div class="profile-ledger-locked"><i class="bi bi-lock" aria-hidden="true"></i><p>' + messages.disabled + '</p></div>') +
        '</section>';
}

export function attachAccountLedgerHistoryListeners() {
    const root = document.getElementById('profile-ledger-history');
    if (!root || root.dataset.previewEnabled !== 'true') return;
    const list = root.querySelector('#profile-ledger-list');
    const status = root.querySelector('#profile-ledger-status');
    const filter = root.querySelector('#profile-ledger-filter');
    const more = root.querySelector('#profile-ledger-more');
    if (!list || !status || !filter || !more) return;

    const language = getState().language;
    const messages = copy(language);
    const readHistory = createFirebaseAccountLedgerHistoryInvoker({
        auth, functions, httpsCallable, location: window.location
    });
    let cursor = null;
    let loading = false;
    let hasLoaded = false;

    const load = async ({ append = false } = {}) => {
        if (loading) return;
        loading = true;
        filter.disabled = true;
        more.disabled = true;
        more.textContent = messages.loadingMore;
        status.textContent = append ? '' : messages.loading;
        status.classList.remove('is-error');
        if (!append) {
            list.innerHTML = '';
            more.hidden = true;
        }
        try {
            const type = filter.value === 'all' ? null : filter.value;
            const page = await readHistory({ pageSize: PAGE_SIZE, type, cursor: append ? cursor : null });
            list.insertAdjacentHTML('beforeend', page.entries.map(entry => renderEntry(entry, messages, language)).join(''));
            cursor = page.nextCursor;
            hasLoaded = true;
            const isEmpty = list.children.length === 0;
            status.textContent = isEmpty ? messages.empty + '. ' + messages.emptyHint : '';
            status.classList.toggle('is-empty', isEmpty);
            more.hidden = !cursor;
        } catch (error) {
            console.error('Account ledger history load failed:', error);
            status.textContent = messages.error;
            status.classList.add('is-error');
            if (append && hasLoaded) more.hidden = false;
            else {
                status.insertAdjacentHTML('beforeend', ' <button type="button" id="profile-ledger-retry" class="profile-ledger-retry">' +
                    messages.retry + '</button>');
            }
        } finally {
            loading = false;
            filter.disabled = false;
            more.disabled = false;
            more.textContent = messages.more;
        }
    };

    filter.addEventListener('change', () => {
        cursor = null;
        hasLoaded = false;
        load();
    });
    more.addEventListener('click', () => load({ append: true }));
    root.addEventListener('click', event => {
        if (event.target.closest('#profile-ledger-retry')) load();
    });
    load();
}
