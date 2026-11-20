import { getState } from '../../store/state.js';
import { auth, db, doc, getDoc, updateDoc, increment, arrayUnion } from '../../firebase-config.js';
import { SHOP_ITEMS } from './shop-data.js';

export function renderShop() {
    return `
        <div class="dashboard-layout">
            <div class="sidebar-overlay" id="sidebar-overlay" onclick="window.closeSidebar()"></div>
            <aside class="dashboard-sidebar glass-card" id="sidebar">
                <div class="sidebar-header"><div class="sidebar-logo arcade-mark" aria-hidden="true"><i class="bi bi-hexagon-fill"></i><span>Q</span></div><h3 class="sidebar-title text-gradient">QuizHub</h3></div>
                <nav class="sidebar-nav">
                    <a class="sidebar-link" onclick="window.navigateTo('home'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-house-door-fill"></i></span><span>Главная</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('chat'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-chat-dots-fill"></i></span><span>Чат</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('friends'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-people-fill"></i></span><span>Друзья</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('leaderboard'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-trophy-fill"></i></span><span>Лидеры</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('achievements'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-award-fill"></i></span><span>Достижения</span></a>
                    <a class="sidebar-link active" onclick="window.navigateTo('shop'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-bag-fill"></i></span><span>Магазин</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('profile'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-person-circle"></i></span><span>Профиль</span></a>
                    <a class="sidebar-link" onclick="window.navigateTo('events'); window.closeSidebar();"><span class="sidebar-link-icon" aria-hidden="true"><i class="bi bi-calendar-event-fill"></i></span><span>События</span></a>
                </nav>
                <div class="sidebar-footer">
                    <button class="sidebar-btn" onclick="window.toggleTheme()">${getState().theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}</button>
                    <button class="sidebar-btn" onclick="window.toggleLang()">${getState().language === 'ru' ? '🇬🇧 English' : '🇷🇺 Русский'}</button>
                </div>
            </aside>
            <main class="dashboard-main">
                <div class="dashboard-content-wrapper">
                    <header class="mobile-header glass-card"><button class="burger-btn" type="button" aria-label="Открыть меню" aria-controls="sidebar" aria-expanded="false" onclick="window.toggleSidebar()"><i class="bi bi-list" aria-hidden="true"></i></button><span class="text-gradient fw-bold">QuizHub</span><div id="shop-coins-display"><span class="coins-badge">🪙 0</span></div></header>
                    <div class="shop-header glass-card animate-in"><div class="collection-eyebrow"><i class="bi bi-stars" aria-hidden="true"></i> КОЛЛЕКЦИЯ</div><h3 class="mb-0 fw-bold"><i class="bi bi-bag-heart" aria-hidden="true"></i> Магазин</h3><p class="collection-subtitle">Украшай профиль и выбирай свой стиль игры.</p></div>
                    <div class="shop-tabs glass-card animate-in animate-in-delay-1">
                        <button class="shop-tab active" data-tab="themes" onclick="window.switchShopTab('themes', this)">🎨 Темы</button>
                        <button class="shop-tab" data-tab="frames" onclick="window.switchShopTab('frames', this)">🖼️ Рамки</button>
                        <button class="shop-tab" data-tab="particles" onclick="window.switchShopTab('particles', this)">✨ Частицы</button>
                        <button class="shop-tab" data-tab="bonuses" onclick="window.switchShopTab('bonuses', this)">🎁 Бонусы</button>
                    </div>
                    <div id="shop-items" class="shop-items animate-in animate-in-delay-2"><div class="text-center py-4"><div class="loading-spinner"></div></div></div>
                </div>
            </main>
        </div>
    `;
}

export async function loadShopItems(tab = 'themes') {
    const user = auth.currentUser;
    if (!user) return;
    const lang = getState().language;
    const isRU = lang === 'ru';
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const profile = userDoc.exists() ? userDoc.data() : {};
        const coins = profile.coins || 0;
        document.getElementById('shop-coins-display').innerHTML = `<span class="coins-badge">🪙 ${coins}</span>`;
        const ownedThemes = profile.ownedThemes || ['theme_default', 'theme_light'];
        const ownedFrames = profile.ownedFrames || ['frame_default'];
        const ownedParticles = profile.ownedParticles || ['particles_default'];
        const equippedTheme = profile.equippedTheme || 'theme_default';
        const equippedFrame = profile.equippedFrame || 'frame_default';
        const equippedParticles = profile.equippedParticles || 'particles_default';
        const activeBonuses = profile.activeBonuses || {};
        let items = [];
        if (tab === 'themes') items = SHOP_ITEMS.themes;
        else if (tab === 'frames') items = SHOP_ITEMS.frames;
        else if (tab === 'particles') items = SHOP_ITEMS.particles;
        else items = SHOP_ITEMS.bonuses;
        const container = document.getElementById('shop-items');
        if (!container) return;
        container.innerHTML = items.map(item => {
            const name = isRU ? item.nameRU : item.nameEN;
            const desc = isRU ? item.descRU : item.descEN;
            if (tab === 'bonuses') {
                const isActive = activeBonuses[item.effect] && activeBonuses[item.effect] > Date.now();
                let btn;
                if (isActive) { const r = Math.ceil((activeBonuses[item.effect] - Date.now()) / 60000); btn = `<button class="shop-btn equipped">✅ Активен (${r} мин)</button>`; }
                else { const c = coins >= item.price; btn = `<button class="shop-btn buy ${c ? '' : 'cant-buy'}" onclick="window.buyBonus('${item.id}',${item.price},'${item.effect}',${item.duration})" ${c ? '' : 'disabled'}>🛒 ${item.price} 🪙</button>`; }
                return `<div class="shop-item glass-card ${isActive ? 'equipped-item' : ''}"><div class="shop-item-icon">${item.icon}</div><div class="shop-item-info"><h4 class="shop-item-name">${name}</h4><p class="shop-item-desc">${desc}</p></div><div class="shop-item-action">${btn}</div></div>`;
            }
            let isOwned, isEquipped;
            if (tab === 'themes') { isOwned = ownedThemes.includes(item.id); isEquipped = equippedTheme === item.id; }
            else if (tab === 'frames') { isOwned = ownedFrames.includes(item.id); isEquipped = equippedFrame === item.id; }
            else { isOwned = ownedParticles.includes(item.id); isEquipped = equippedParticles === item.id; }
            let btn;
            if (isEquipped) btn = '<button class="shop-btn equipped">✅ Используется</button>';
            else if (isOwned) btn = `<button class="shop-btn equip" onclick="window.equipItem('${item.id}','${tab}')">✨ Применить</button>`;
            else if (item.price === 0) btn = '<button class="shop-btn equipped">✅ Бесплатно</button>';
            else { const c = coins >= item.price; btn = `<button class="shop-btn buy ${c ? '' : 'cant-buy'}" onclick="window.buyItem('${item.id}',${item.price},'${tab}')" ${c ? '' : 'disabled'}>🛒 ${item.price} 🪙</button>`; }
            return `<div class="shop-item glass-card ${isEquipped ? 'equipped-item' : ''}"><div class="shop-item-icon">${item.icon}</div><div class="shop-item-info"><h4 class="shop-item-name">${name}</h4><p class="shop-item-desc">${desc}</p></div><div class="shop-item-action">${btn}</div></div>`;
        }).join('');
    } catch (error) { console.error('Ошибка загрузки магазина:', error); }
}

window.switchShopTab = (tab, el) => { document.querySelectorAll('.shop-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); }); el.classList.add('active'); el.setAttribute('aria-selected', 'true'); loadShopItems(tab); };

function isShopPreviewRequested() {
    const params = new URLSearchParams(window.location.search);
    return ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
        params.get('firebaseEmulator') === '1' &&
        params.get('shopPreview') === '1';
}

function createShopOperationId() {
    if (!window.crypto?.randomUUID) throw new Error('SECURE_OPERATION_ID_UNAVAILABLE');
    return `shop_${window.crypto.randomUUID()}`;
}

async function invokeLocalShop(operation, payload) {
    const { createLocalFirebaseShopInvoker } = await import('./firebase-shop-preview.js');
    const invoke = createLocalFirebaseShopInvoker();
    return invoke(operation, payload);
}

window.buyItem = async (itemId, price, type) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        if (isShopPreviewRequested()) {
            const response = await invokeLocalShop('purchase', {
                itemId,
                operationId: createShopOperationId()
            });
            const receipt = response?.data;
            if (!receipt || typeof receipt.alreadyPurchased !== 'boolean') {
                throw new Error('INVALID_SHOP_PURCHASE_RECEIPT');
            }
            if (receipt.alreadyPurchased) {
                alert('Покупка уже обработана.');
                await loadShopItems(type);
                return;
            }
            if (!Number.isSafeInteger(receipt.balance) || receipt.balance < 0 ||
                !Number.isSafeInteger(receipt.coinsSpent) || receipt.coinsSpent < 0) {
                throw new Error('INVALID_SHOP_PURCHASE_RECEIPT');
            }
            if (type === 'themes') applyTheme(itemId);
            else if (type === 'particles') applyParticles(itemId);
            await loadShopItems(type);
            return;
        }
        const userRef = doc(db, 'users', user.uid);
        const profile = (await getDoc(userRef)).data();
        if (price > 0 && (profile.coins || 0) < price) { alert('Недостаточно монет!'); return; }
        let fn, ef;
        if (type === 'themes') { fn = 'ownedThemes'; ef = 'equippedTheme'; }
        else if (type === 'frames') { fn = 'ownedFrames'; ef = 'equippedFrame'; }
        else { fn = 'ownedParticles'; ef = 'equippedParticles'; }
        if ((profile[fn] || []).includes(itemId)) { alert('Уже есть!'); return; }
        const upd = { [fn]: arrayUnion(itemId), [ef]: itemId };
        if (price > 0) upd.coins = increment(-price);
        await updateDoc(userRef, upd);
        if (type === 'themes') applyTheme(itemId);
        else if (type === 'particles') applyParticles(itemId);
        loadShopItems(type);
    } catch (e) { alert('Ошибка: ' + e.message); }
};

window.buyBonus = async (itemId, price, effect, duration) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        if (isShopPreviewRequested()) {
            const response = await invokeLocalShop('purchase', {
                itemId,
                operationId: createShopOperationId()
            });
            const receipt = response?.data;
            if (!receipt || typeof receipt.alreadyPurchased !== 'boolean') {
                throw new Error('INVALID_SHOP_PURCHASE_RECEIPT');
            }
            if (receipt.alreadyPurchased) {
                alert('Покупка уже обработана.');
                await loadShopItems('bonuses');
                return;
            }
            if (!Number.isSafeInteger(receipt.balance) || receipt.balance < 0 ||
                !Number.isSafeInteger(receipt.coinsSpent) || receipt.coinsSpent < 0) {
                throw new Error('INVALID_SHOP_PURCHASE_RECEIPT');
            }
            alert('Бонус активирован! 🎁');
            await loadShopItems('bonuses');
            return;
        }
        const userRef = doc(db, 'users', user.uid);
        const profile = (await getDoc(userRef)).data();
        if ((profile.coins || 0) < price) { alert('Недостаточно монет!'); return; }
        const ab = profile.activeBonuses || {};
        ab[effect] = Date.now() + duration * 1000;
        await updateDoc(userRef, { coins: increment(-price), activeBonuses: ab });
        alert('Бонус активирован! 🎁');
        loadShopItems('bonuses');
    } catch (e) { alert('Ошибка: ' + e.message); }
};

window.equipItem = async (itemId, type) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        if (isShopPreviewRequested()) {
            await invokeLocalShop('equip', { itemId });
            if (type === 'themes') applyTheme(itemId);
            else if (type === 'particles') applyParticles(itemId);
            await loadShopItems(type);
            return;
        }
        const userRef = doc(db, 'users', user.uid);
        let ef;
        if (type === 'themes') ef = 'equippedTheme';
        else if (type === 'frames') ef = 'equippedFrame';
        else ef = 'equippedParticles';
        await updateDoc(userRef, { [ef]: itemId });
        if (type === 'themes') applyTheme(itemId);
        else if (type === 'particles') applyParticles(itemId);
        loadShopItems(type);
    } catch (e) { alert('Ошибка: ' + e.message); }
};

function applyTheme(id) {
    localStorage.setItem('shopTheme', id);
    const t = {
        theme_default: { 'data-theme': 'dark', '--accent': '#7c5cfc', '--bg-primary': '#0a0a0f', '--bg-secondary': '#12121a', '--bg-glass': 'rgba(18,18,26,0.7)', '--text-primary': '#e8e8f0', '--text-secondary': '#9898b0', '--border': 'rgba(255,255,255,0.06)', bg: '#0a0a0f' },
        theme_light: { 'data-theme': 'light', '--accent': '#6c5ce7', '--bg-primary': '#f5f5f7', '--bg-secondary': '#fff', '--bg-glass': 'rgba(255,255,255,0.8)', '--text-primary': '#1a1a2e', '--text-secondary': '#6b6b80', '--border': 'rgba(0,0,0,0.08)', bg: '#f5f5f7' },
        theme_neon: { 'data-theme': 'neon', '--accent': '#c084fc', '--bg-primary': '#0a0a1a', '--bg-secondary': '#0f0f2a', '--bg-glass': 'rgba(15,15,42,0.8)', '--text-primary': '#f0e6ff', '--text-secondary': '#b8a9d4', '--border': 'rgba(192,132,252,0.15)', bg: 'linear-gradient(135deg,#0a0a1a,#1a0a2e,#0a0a1a)' },
        theme_ocean: { 'data-theme': 'ocean', '--accent': '#38bdf8', '--bg-primary': '#0a1628', '--bg-secondary': '#0f1f3a', '--bg-glass': 'rgba(15,31,58,0.8)', '--text-primary': '#e0f2fe', '--text-secondary': '#94b8d4', '--border': 'rgba(56,189,248,0.12)', bg: 'linear-gradient(135deg,#0a1628,#0f2a3f,#0a1628)' },
        theme_sunset: { 'data-theme': 'sunset', '--accent': '#fb923c', '--bg-primary': '#1a0f0a', '--bg-secondary': '#2a1a0f', '--bg-glass': 'rgba(42,26,15,0.8)', '--text-primary': '#fff1e6', '--text-secondary': '#d4b8a9', '--border': 'rgba(251,146,60,0.12)', bg: 'linear-gradient(135deg,#1a0f0a,#2a150a,#1a0f0a)' },
        theme_forest: { 'data-theme': 'forest', '--accent': '#4ade80', '--bg-primary': '#0a1a0f', '--bg-secondary': '#0f2a1a', '--bg-glass': 'rgba(15,42,26,0.8)', '--text-primary': '#e6f5ec', '--text-secondary': '#a9c4b4', '--border': 'rgba(74,222,128,0.12)', bg: 'linear-gradient(135deg,#0a1a0f,#0f2a15,#0a1a0f)' }
    };
    const s = t[id] || t.theme_default;
    const r = document.documentElement;
    r.setAttribute('data-theme', s['data-theme']);
    Object.entries(s).forEach(([k, v]) => { if (k !== 'data-theme' && k !== 'bg') r.style.setProperty(k, v); });
    document.body.style.background = s.bg;
}

function applyParticles(id) {
    localStorage.setItem('shopParticles', id);
    import('../particles/particles.js').then(m => { if (m.updateParticlesType) m.updateParticlesType(id); });
}

const savedTheme = localStorage.getItem('shopTheme');
if (savedTheme) applyTheme(savedTheme);

export function attachShopListeners() {
    loadShopItems('themes');
    window.toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };
    window.closeSidebar = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); };
}