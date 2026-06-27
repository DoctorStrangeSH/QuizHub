// ============================================
// QuizHub — Виртуальная валюта v3.0 (StateManager)
// ============================================

function addCoins(amount) {
    const currentCoins = AppState.get('coins');
    const newCoins = Math.max(0, currentCoins + amount);
    AppState.set('coins', newCoins);
    if (amount > 0) showCoinAnimation(amount);

    EventBus.emit(EVENTS.COINS_CHANGED, newCoins);

    if (typeof saveUserDataToFirestore === 'function' && typeof currentUser !== 'undefined' && currentUser) {
        saveUserDataToFirestore();
    }
}

function getCoins() {
    return AppState.get('coins');
}

function updateCoinsDisplay() {
    const el = document.getElementById('coins-display');
    if (el) {
        el.textContent = AppState.get('coins');
        el.classList.add('score-counter');
        setTimeout(() => el.classList.remove('score-counter'), 300);
    }
}

const SHOP_ITEMS = [
    { id: 'theme_neon', name: 'Неоновая тема', desc: 'Яркая неоновая тема оформления', icon: '🎨', price: 100, type: 'theme' },
    { id: 'theme_ocean', name: 'Океан', desc: 'Спокойная морская тема', icon: '🌊', price: 100, type: 'theme' },
    { id: 'booster_x2', name: 'Удвоитель XP', desc: 'Двойной опыт на 1 час', icon: '⚡', price: 50, type: 'booster', duration: 3600 },
    { id: 'booster_freeze', name: 'Заморозка времени', desc: '+5 секунд на вопрос (одноразово)', icon: '❄️', price: 30, type: 'booster' },
    { id: 'avatar_gold', name: 'Золотая рамка', desc: 'Золотая рамка аватара', icon: '🖼️', price: 200, type: 'cosmetic' },
    { id: 'title_master', name: 'Титул «Мастер»', desc: 'Особый титул перед именем', icon: '👑', price: 300, type: 'cosmetic' },
];

function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const coins = AppState.get('coins');
    if (coins < item.price) {
        showToast(`Не хватает монет! Нужно ${item.price} 🪙`, 'warning');
        return;
    }

    const purchased = AppState.get('purchasedItems');
    if (item.type !== 'booster' && purchased.includes(itemId)) {
        showToast('Уже куплено! Нажми «Применить» для использования.', 'info');
        return;
    }

    addCoins(-item.price);

    if (!purchased.includes(itemId)) {
        AppState.set('purchasedItems', [...purchased, itemId]);
    }

    showToast(`Куплено: ${t('item_' + item.id) || item.name}! 🎉`, 'success');
    renderShop();
}

function applyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const purchased = AppState.get('purchasedItems');
    if (!purchased.includes(itemId) && item.type !== 'booster') {
        showToast('Сначала купите этот предмет! 🛍️', 'warning');
        return;
    }

    if (item.type === 'theme') {
        applyTheme(itemId);
        showToast(`Тема «${t('item_' + item.id) || item.name}» применена! 🎨`, 'success');
    } else if (item.type === 'booster') {
        activateBooster(item);
        showToast(`Бустер «${t('item_' + item.id) || item.name}» активирован! ⚡`, 'success');
    } else if (item.type === 'cosmetic') {
        applyCosmetic(itemId);
        showToast(`Косметика «${t('item_' + item.id) || item.name}» применена! ✨`, 'success');
    }

    renderShop();
}

function applyTheme(themeId) {
    const currentTheme = AppState.get('activeCustomTheme');
    if (currentTheme) document.documentElement.removeAttribute('data-custom-theme');
    AppState.set('activeCustomTheme', themeId);
    document.documentElement.setAttribute('data-custom-theme', themeId);
}

function resetTheme() {
    document.documentElement.removeAttribute('data-custom-theme');
    AppState.set('activeCustomTheme', null);

    if (typeof saveUserDataToFirestore === 'function') {
        saveUserDataToFirestore();
    }

    showToast('Тема сброшена ✅', 'info');
    renderShop();
}

function activateBooster(item) {
    const boosters = AppState.get('activeBoosters');
    boosters.push({
        id: item.id,
        name: item.name,
        icon: item.icon,
        expiresAt: Date.now() + (item.duration || 0) * 1000
    });
    AppState.set('activeBoosters', boosters);
}

function getActiveMultiplier() {
    const now = Date.now();
    let boosters = AppState.get('activeBoosters');
    boosters = boosters.filter(b => b.expiresAt > now);
    AppState.set('activeBoosters', boosters);
    return boosters.some(b => b.id === 'booster_x2') ? 2 : 1;
}

function applyCosmetic(cosmeticId) {
    const settings = JSON.parse(localStorage.getItem('quizhub-theme-settings') || '{}');
    if (cosmeticId === 'avatar_gold') settings.avatarFrame = 'gold';
    else if (cosmeticId === 'title_master') settings.title = 'Мастер';
    localStorage.setItem('quizhub-theme-settings', JSON.stringify(settings));
}

function awardQuizCoins(result) {
    if (typeof currentUser === 'undefined' || !currentUser) return 0;

    let coins = 5;
    coins += result.correctAnswers * 2;
    const diffBonus = { easy: 0, medium: 5, hard: 10 };
    coins += diffBonus[result.difficulty] || 0;
    if (result.correctAnswers === 10) coins += 20;
    coins = Math.floor(coins * getActiveMultiplier());
    addCoins(coins);
    return coins;
}

function showShopScreen() {
    renderShop();
    showScreen('shop');
}

function renderShop() {
    const screen = document.getElementById('screen-shop');
    if (!screen) return;

    const coins = AppState.get('coins');
    const purchased = AppState.get('purchasedItems');
    const activeTheme = AppState.get('activeCustomTheme');

    screen.innerHTML = `
        <div class="row justify-content-center"><div class="col-lg-6">
            <div class="text-center mb-4">
                <h2 class="fw-bold font-display mb-2">🛍️ ${t('shopTitle')}</h2>
                <p class="text-muted">${t('shopBalance')}: <span class="text-accent fw-bold">${coins} 🪙</span></p>
                ${activeTheme ? `<button class="btn btn-outline-warning btn-sm rounded-pill px-3 mt-2" onclick="resetTheme()">${t('shopReset')}</button>` : ''}
            </div>
            <div class="d-grid gap-3">
                ${SHOP_ITEMS.map(item => {
                    const isPurchased = purchased.includes(item.id);
                    const isActive = item.type === 'theme' && activeTheme === item.id;
                    return I18N_TEMPLATES.shopItemCard(item, isPurchased, isActive);
                }).join('')}
            </div>
            <div class="text-center mt-4">
                <button class="btn btn-outline-accent rounded-pill px-4" onclick="showScreen('home')">🏠 ${t('home')}</button>
            </div>
        </div></div>
    `;
}

function showCoinAnimation(amount) {
    const el = document.createElement('div');
    el.className = 'coin-animation';
    el.textContent = `+${amount} 🪙`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
}

function initCustomTheme() {
    const saved = AppState.get('activeCustomTheme');
    if (saved) {
        document.documentElement.setAttribute('data-custom-theme', saved);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateCoinsDisplay();
    initCustomTheme();
});