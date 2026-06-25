// ============================================
// QuizHub — Виртуальная валюта (монеты)
// ============================================

let userCoins = parseInt(localStorage.getItem('quizhub-coins') || '0');

// ========== КОШЕЛЁК ==========

function addCoins(amount) {
  userCoins += amount;
  if (userCoins < 0) userCoins = 0;
  localStorage.setItem('quizhub-coins', userCoins.toString());
  updateCoinsDisplay();
  
  if (amount > 0) {
    showCoinAnimation(amount);
  }
}

function getCoins() {
  return userCoins;
}

function updateCoinsDisplay() {
  const el = document.getElementById('coins-display');
  if (el) {
    el.textContent = userCoins;
    
    // Анимация изменения
    el.classList.add('score-counter');
    setTimeout(() => el.classList.remove('score-counter'), 300);
  }
}

// ========== МАГАЗИН ==========

const SHOP_ITEMS = [
  {
    id: 'theme_neon',
    name: 'Неоновая тема',
    desc: 'Яркая неоновая тема оформления',
    icon: '🎨',
    price: 100,
    type: 'theme'
  },
  {
    id: 'theme_ocean',
    name: 'Океан',
    desc: 'Спокойная морская тема',
    icon: '🌊',
    price: 100,
    type: 'theme'
  },
  {
    id: 'booster_x2',
    name: 'Удвоитель XP',
    desc: 'Двойной опыт на 1 час',
    icon: '⚡',
    price: 50,
    type: 'booster',
    duration: 3600
  },
  {
    id: 'booster_freeze',
    name: 'Заморозка времени',
    desc: '+5 секунд на вопрос (одноразово)',
    icon: '❄️',
    price: 30,
    type: 'booster'
  },
  {
    id: 'avatar_gold',
    name: 'Золотая рамка',
    desc: 'Золотая рамка аватара',
    icon: '🖼️',
    price: 200,
    type: 'cosmetic'
  },
  {
    id: 'title_master',
    name: 'Титул «Мастер»',
    desc: 'Особый титул перед именем',
    icon: '👑',
    price: 300,
    type: 'cosmetic'
  }
];

let purchasedItems = JSON.parse(localStorage.getItem('quizhub-purchases') || '[]');
let activeBoosters = JSON.parse(localStorage.getItem('quizhub-active-boosters') || '[]');

function buyItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  
  if (userCoins < item.price) {
    showToast(`Не хватает монет! Нужно ${item.price} 🪙`, 'warning');
    return;
  }
  
  if (purchasedItems.includes(itemId)) {
    showToast('Уже куплено!', 'info');
    return;
  }
  
  addCoins(-item.price);
  purchasedItems.push(itemId);
  localStorage.setItem('quizhub-purchases', JSON.stringify(purchasedItems));
  
  if (item.type === 'booster') {
    activateBooster(item);
  }
  
  showToast(`Куплено: ${item.name}! 🎉`, 'success');
  renderShop();
}

function activateBooster(item) {
  const booster = {
    id: item.id,
    name: item.name,
    icon: item.icon,
    expiresAt: Date.now() + (item.duration || 0) * 1000
  };
  
  activeBoosters.push(booster);
  localStorage.setItem('quizhub-active-boosters', JSON.stringify(activeBoosters));
}

function getActiveMultiplier() {
  const now = Date.now();
  let multiplier = 1;
  
  activeBoosters = activeBoosters.filter(b => b.expiresAt > now);
  localStorage.setItem('quizhub-active-boosters', JSON.stringify(activeBoosters));
  
  if (activeBoosters.some(b => b.id === 'booster_x2')) {
    multiplier = 2;
  }
  
  return multiplier;
}

function hasBooster(boosterId) {
  return activeBoosters.some(b => b.id === boosterId);
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

// ========== НАЧИСЛЕНИЕ МОНЕТ ЗА КВИЗ ==========

function awardQuizCoins(result) {
  let coins = 0;
  
  // Базовые монеты
  coins += 5;
  
  // Бонус за правильные ответы
  coins += result.correctAnswers * 2;
  
  // Бонус за сложность
  const diffBonus = { easy: 0, medium: 5, hard: 10 };
  coins += diffBonus[result.difficulty] || 0;
  
  // Бонус за идеальный результат
  if (result.correctAnswers === 10) {
    coins += 20;
  }
  
  // Применяем бустер
  const multiplier = getActiveMultiplier();
  coins = Math.floor(coins * multiplier);
  
  addCoins(coins);
  
  // Если есть команда — добавляем командные очки
  if (typeof addTeamScore === 'function' && userTeam) {
    addTeamScore(coins);
  }
  
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
    <div class="row justify-content-center">
      <div class="col-lg-6">
        <div class="text-center mb-4">
          <h2 class="fw-bold font-display mb-2">🛍️ Магазин</h2>
          <p class="text-muted">Твой баланс: <span class="text-accent fw-bold">${userCoins} 🪙</span></p>
        </div>
        
        <div class="d-grid gap-3">
          ${SHOP_ITEMS.map(item => {
            const purchased = purchasedItems.includes(item.id);
            return `
              <div class="bg-card rounded-4 p-3 d-flex align-items-center gap-3">
                <span class="fs-2">${item.icon}</span>
                <div class="flex-grow-1 text-start">
                  <p class="fw-bold mb-0">${item.name}</p>
                  <small class="text-muted">${item.desc}</small>
                </div>
                ${purchased 
                  ? '<span class="badge bg-success">Куплено</span>'
                  : `<button class="btn btn-accent btn-sm rounded-pill px-3" 
                             onclick="buyItem('${item.id}')">
                       ${item.price} 🪙
                     </button>`
                }
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="text-center mt-4">
          <button class="btn btn-outline-accent rounded-pill px-4" onclick="showScreen('home')">
            <i class="bi bi-house me-2"></i>На главную
          </button>
        </div>
      </div>
    </div>
  `;
}

// ========== АНИМАЦИЯ МОНЕТ ==========

function showCoinAnimation(amount) {
  const el = document.createElement('div');
  el.className = 'coin-animation';
  el.textContent = `+${amount} 🪙`;
  document.body.appendChild(el);
  
  setTimeout(() => el.remove(), 1500);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  updateCoinsDisplay();
});