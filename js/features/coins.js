// ============================================
// QuizHub — Виртуальная валюта v2.0
// ============================================

let userCoins = parseInt(localStorage.getItem('quizhub-coins') || '0');

// ========== КОШЕЛЁК ==========

function addCoins(amount) {
  userCoins += amount;
  if (userCoins < 0) userCoins = 0;
  localStorage.setItem('quizhub-coins', userCoins.toString());
  updateCoinsDisplay();
  if (amount > 0) showCoinAnimation(amount);
}

function getCoins() { return userCoins; }

function updateCoinsDisplay() {
  const el = document.getElementById('coins-display');
  if (el) { el.textContent = userCoins; el.classList.add('score-counter'); setTimeout(() => el.classList.remove('score-counter'), 300); }
}

// ========== МАГАЗИН ==========

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

// ========== ПОКУПКА ==========

function buyItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  
  if (userCoins < item.price) {
    showToast(`Не хватает монет! Нужно ${item.price} 🪙`, 'warning');
    return;
  }
  
  if (purchasedItems.includes(itemId) && item.type !== 'booster') {
    showToast('Уже куплено!', 'info');
    return;
  }
  
  addCoins(-item.price);
  
  if (!purchasedItems.includes(itemId)) {
    purchasedItems.push(itemId);
  }
  localStorage.setItem('quizhub-purchases', JSON.stringify(purchasedItems));
  
  if (item.type === 'theme') {
    applyTheme(itemId);
  } else if (item.type === 'booster') {
    activateBooster(item);
  } else if (item.type === 'cosmetic') {
    applyCosmetic(itemId);
  }
  
  showToast(`Куплено: ${item.name}! 🎉`, 'success');
  renderShop();
}

// ========== ТЕМЫ ==========

const CUSTOM_THEMES = {
  theme_neon: {
    '--accent': '#00FF88',
    '--accent-glow': 'rgba(0, 255, 136, 0.4)',
    '--secondary': '#FF00FF',
    '--bg-primary': '#0a0a0a',
  },
  theme_ocean: {
    '--accent': '#00BFFF',
    '--accent-glow': 'rgba(0, 191, 255, 0.4)',
    '--secondary': '#006080',
    '--bg-primary': '#0a1628',
  },
};

function applyTheme(themeId) {
  // Сбрасываем предыдущую тему
  if (activeCustomTheme && CUSTOM_THEMES[activeCustomTheme]) {
    Object.keys(CUSTOM_THEMES[activeCustomTheme]).forEach(key => {
      document.documentElement.style.removeProperty(key);
    });
  }
  
  const theme = CUSTOM_THEMES[themeId];
  if (!theme) return;
  
  activeCustomTheme = themeId;
  localStorage.setItem('quizhub-custom-theme', themeId);
  
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  
  showToast('Тема применена! 🎨', 'success');
}

function resetTheme() {
  if (activeCustomTheme && CUSTOM_THEMES[activeCustomTheme]) {
    Object.keys(CUSTOM_THEMES[activeCustomTheme]).forEach(key => {
      document.documentElement.style.removeProperty(key);
    });
  }
  activeCustomTheme = null;
  localStorage.removeItem('quizhub-custom-theme');
  showToast('Тема сброшена', 'info');
}

// ========== БУСТЕРЫ ==========

function activateBooster(item) {
  activeBoosters.push({
    id: item.id,
    name: item.name,
    icon: item.icon,
    expiresAt: Date.now() + (item.duration || 0) * 1000
  });
  localStorage.setItem('quizhub-active-boosters', JSON.stringify(activeBoosters));
}

function getActiveMultiplier() {
  const now = Date.now();
  activeBoosters = activeBoosters.filter(b => b.expiresAt > now);
  localStorage.setItem('quizhub-active-boosters', JSON.stringify(activeBoosters));
  return activeBoosters.some(b => b.id === 'booster_x2') ? 2 : 1;
}

function useFreezeBooster() {
  const index = activeBoosters.findIndex(b => b.id === 'booster_freeze');
  if (index >= 0) {
    activeBoosters.splice(index, 1);
    localStorage.setItem('quizhub-active-boosters', JSON.stringify(activeBoosters));
    return true;
  }
  return false;
}

// ========== КОСМЕТИКА ==========

function applyCosmetic(cosmeticId) {
  const settings = JSON.parse(localStorage.getItem('quizhub-theme-settings') || '{}');
  if (cosmeticId === 'avatar_gold') settings.avatarFrame = 'gold';
  else if (cosmeticId === 'title_master') settings.title = 'Мастер';
  localStorage.setItem('quizhub-theme-settings', JSON.stringify(settings));
  showToast('Косметика применена! ✨', 'success');
}

// ========== НАЧИСЛЕНИЕ МОНЕТ ==========

function awardQuizCoins(result) {
  let coins = 5;
  coins += result.correctAnswers * 2;
  const diffBonus = { easy: 0, medium: 5, hard: 10 };
  coins += diffBonus[result.difficulty] || 0;
  if (result.correctAnswers === 10) coins += 20;
  coins = Math.floor(coins * getActiveMultiplier());
  addCoins(coins);
  return coins;
}

// ========== UI МАГАЗИНА ==========

function showShopScreen() {
  const screen = document.getElementById('screen-shop');
  if (!screen) return;
  renderShop();
  showScreen('shop');
}

function renderShop() {
  const screen = document.getElementById('screen-shop');
  if (!screen) return;
  
  screen.innerHTML = `
    <div class="row justify-content-center"><div class="col-lg-6">
      <div class="text-center mb-4">
        <h2 class="fw-bold font-display mb-2">🛍️ Магазин</h2>
        <p class="text-muted">Баланс: <span class="text-accent fw-bold">${userCoins} 🪙</span></p>
        ${activeCustomTheme ? `<button class="btn btn-outline-warning btn-sm rounded-pill px-3 mt-2" onclick="resetTheme()">🔄 Сбросить тему</button>` : ''}
      </div>
      <div class="d-grid gap-3">
        ${SHOP_ITEMS.map(item => {
          const purchased = purchasedItems.includes(item.id) && item.type !== 'booster';
          return `
            <div class="bg-card rounded-4 p-3 d-flex align-items-center gap-3">
              <span class="fs-2">${item.icon}</span>
              <div class="flex-grow-1 text-start">
                <p class="fw-bold mb-0">${item.name}</p>
                <small class="text-muted">${item.desc}</small>
              </div>
              ${purchased 
                ? '<span class="badge bg-success">Куплено</span>'
                : `<button class="btn btn-accent btn-sm rounded-pill px-3" onclick="buyItem('${item.id}')">${item.price} 🪙</button>`
              }
            </div>
          `;
        }).join('')}
      </div>
      <div class="text-center mt-4">
        <button class="btn btn-outline-accent rounded-pill px-4" onclick="showScreen('home')">🏠 На главную</button>
      </div>
    </div></div>`;
}

// ========== АНИМАЦИЯ ==========

function showCoinAnimation(amount) {
  const el = document.createElement('div');
  el.className = 'coin-animation';
  el.textContent = `+${amount} 🪙`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

function initCustomTheme() {
  const saved = localStorage.getItem('quizhub-custom-theme');
  if (saved && CUSTOM_THEMES[saved]) {
    activeCustomTheme = saved;
    Object.entries(CUSTOM_THEMES[saved]).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCoinsDisplay();
  initCustomTheme();
});