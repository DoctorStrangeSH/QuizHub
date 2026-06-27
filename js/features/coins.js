// ============================================
// QuizHub — Виртуальная валюта v2.4
// ============================================

let userCoins = parseInt(localStorage.getItem('quizhub-coins') || '0');

function addCoins(amount) {
  userCoins += amount;
  if (userCoins < 0) userCoins = 0;
  localStorage.setItem('quizhub-coins', userCoins.toString());
  updateCoinsDisplay();
  if (amount > 0) showCoinAnimation(amount);
  if (typeof saveUserDataToFirestore === 'function' && typeof currentUser !== 'undefined' && currentUser) {
    saveUserDataToFirestore();
  }
}

function getCoins() { return userCoins; }

function updateCoinsDisplay() {
  const el = document.getElementById('coins-display');
  if (el) { el.textContent = userCoins; el.classList.add('score-counter'); setTimeout(() => el.classList.remove('score-counter'), 300); }
}

const SHOP_ITEMS = [
  { id: 'theme_neon', name: 'Неоновая тема', desc: 'Яркая неоновая тема оформления', icon: '🎨', price: 100, type: 'theme' },
  { id: 'theme_ocean', name: 'Океан', desc: 'Спокойная морская тема', icon: '🌊', price: 100, type: 'theme' },
  { id: 'booster_x2', name: 'Удвоитель XP', desc: 'Двойной опыт на 1 час', icon: '⚡', price: 50, type: 'booster', duration: 3600 },
  { id: 'booster_freeze', name: 'Заморозка времени', desc: '+5 секунд на вопрос (одноразово)', icon: '❄️', price: 30, type: 'booster' },
  { id: 'avatar_gold', name: 'Золотая рамка', desc: 'Золотая рамка аватара', icon: '🖼️', price: 200, type: 'cosmetic' },
  { id: 'title_master', name: 'Титул «Мастер»', desc: 'Особый титул перед именем', icon: '👑', price: 300, type: 'cosmetic' },
];

let purchasedItems = JSON.parse(localStorage.getItem('quizhub-purchases') || '[]');
let activeBoosters = JSON.parse(localStorage.getItem('quizhub-active-boosters') || '[]');
let activeCustomTheme = localStorage.getItem('quizhub-custom-theme') || null;

function buyItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  if (userCoins < item.price) { showToast(`Не хватает монет! Нужно ${item.price} 🪙`, 'warning'); return; }
  if (item.type !== 'booster' && purchasedItems.includes(itemId)) { showToast('Уже куплено! Нажми «Применить» для использования.', 'info'); return; }
  addCoins(-item.price);
  if (!purchasedItems.includes(itemId)) purchasedItems.push(itemId);
  localStorage.setItem('quizhub-purchases', JSON.stringify(purchasedItems));
  showToast(`Куплено: ${item.name}! Нажми «Применить» 🎉`, 'success');
  renderShop();
}

function applyItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  if (!purchasedItems.includes(itemId) && item.type !== 'booster') { showToast('Сначала купите этот предмет! 🛍️', 'warning'); return; }
  if (item.type === 'theme') { applyTheme(itemId); showToast(`Тема «${item.name}» применена! 🎨`, 'success'); }
  else if (item.type === 'booster') { activateBooster(item); showToast(`Бустер «${item.name}» активирован! ⚡`, 'success'); }
  else if (item.type === 'cosmetic') { applyCosmetic(itemId); showToast(`Косметика «${item.name}» применена! ✨`, 'success'); }
  renderShop();
}

function applyTheme(themeId) {
    // Сбрасываем предыдущую тему
    if (activeCustomTheme) {
        document.documentElement.removeAttribute('data-custom-theme');
    }

    // Применяем новую тему
    activeCustomTheme = themeId;
    localStorage.setItem('quizhub-custom-theme', themeId);
    document.documentElement.setAttribute('data-custom-theme', themeId);
}

function resetTheme() {
    document.documentElement.removeAttribute('data-custom-theme');
    activeCustomTheme = null;
    localStorage.removeItem('quizhub-custom-theme');

    if (typeof saveUserDataToFirestore === 'function') {
        saveUserDataToFirestore();
    }

    showToast('Тема сброшена ✅', 'info');
    renderShop();
}

function activateBooster(item) {
  activeBoosters.push({ id: item.id, name: item.name, icon: item.icon, expiresAt: Date.now() + (item.duration || 0) * 1000 });
  localStorage.setItem('quizhub-active-boosters', JSON.stringify(activeBoosters));
}

function getActiveMultiplier() {
  const now = Date.now();
  activeBoosters = activeBoosters.filter(b => b.expiresAt > now);
  localStorage.setItem('quizhub-active-boosters', JSON.stringify(activeBoosters));
  return activeBoosters.some(b => b.id === 'booster_x2') ? 2 : 1;
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

function showShopScreen() { renderShop(); showScreen('shop'); }

function renderShop() {
  const screen = document.getElementById('screen-shop');
  if (!screen) return;
  screen.innerHTML = `
    <div class="row justify-content-center"><div class="col-lg-6">
      <div class="text-center mb-4"><h2 class="fw-bold font-display mb-2">🛍️ ${t('shopTitle')}</h2><p class="text-muted">${t('shopBalance')}: <span class="text-accent fw-bold">${userCoins} 🪙</span></p>${activeCustomTheme ? `<button class="btn btn-outline-warning btn-sm rounded-pill px-3 mt-2" onclick="resetTheme()">${t('shopReset')}</button>` : ''}</div>
      <div class="d-grid gap-3">${SHOP_ITEMS.map(item => { const purchased = purchasedItems.includes(item.id); const isActive = item.type === 'theme' && activeCustomTheme === item.id; let btnHTML = ''; if (!purchased) btnHTML = `<button class="btn btn-accent btn-sm rounded-pill px-3 shop-buy-btn" onclick="buyItem('${item.id}')">${item.price} 🪙</button>`; else if (isActive) btnHTML = `<span class="badge bg-success shop-active-badge">✅ Активна</span>`; else btnHTML = `<button class="btn btn-outline-accent btn-sm rounded-pill px-3 shop-apply-btn" onclick="applyItem('${item.id}')">${t('shopApply')}</button>`; return `<div class="bg-card rounded-4 p-3 d-flex align-items-center gap-3"><span class="fs-2">${item.icon}</span><div class="flex-grow-1 text-start"><p class="fw-bold mb-0">${item.name} ${isActive ? '✅' : ''}</p><small class="text-muted">${item.desc}</small></div>${btnHTML}</div>`; }).join('')}</div>
      <div class="text-center mt-4"><button class="btn btn-outline-accent rounded-pill px-4" onclick="showScreen('home')">🏠 ${t('home')}</button></div>
    </div></div>`;
}

function showCoinAnimation(amount) {
  const el = document.createElement('div');
  el.className = 'coin-animation';
  el.textContent = `+${amount} 🪙`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

function initCustomTheme() {
    const saved = localStorage.getItem('quizhub-custom-theme');
    if (saved) {
        activeCustomTheme = saved;
        document.documentElement.setAttribute('data-custom-theme', saved);
    }
}

document.addEventListener('DOMContentLoaded', () => { updateCoinsDisplay(); initCustomTheme(); });