// ============================================
// QuizHub — Социальные механики
// ============================================

// ========== СИСТЕМА ДРУЗЕЙ ==========

let friendsList = JSON.parse(localStorage.getItem('quizhub-friends') || '[]');
let friendRequests = JSON.parse(localStorage.getItem('quizhub-friend-requests') || '[]');
let sentRequests = JSON.parse(localStorage.getItem('quizhub-sent-requests') || '[]');

async function sendFriendRequest(targetUserId) {
  if (!currentUser) {
    showToast('Войдите в аккаунт', 'warning');
    return;
  }
  
  if (friendsList.includes(targetUserId)) {
    showToast('Уже в друзьях!', 'info');
    return;
  }
  
  if (sentRequests.includes(targetUserId)) {
    showToast('Заявка уже отправлена', 'info');
    return;
  }
  
  try {
    await db.collection('friendRequests').add({
      from: currentUser.uid,
      fromName: currentUser.displayName,
      fromPhoto: currentUser.photoURL,
      to: targetUserId,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    sentRequests.push(targetUserId);
    localStorage.setItem('quizhub-sent-requests', JSON.stringify(sentRequests));
    
    showToast('Заявка отправлена! 📨', 'success');
  } catch (error) {
    console.error('Ошибка отправки заявки:', error);
    showToast('Не удалось отправить заявку', 'danger');
  }
}

async function acceptFriendRequest(requestId, friendId) {
  if (!currentUser) return;
  
  try {
    // Добавляем в друзья обоих
    const userRef = db.collection('users').doc(currentUser.uid);
    const friendRef = db.collection('users').doc(friendId);
    
    await userRef.set({
      friends: firebase.firestore.FieldValue.arrayUnion(friendId)
    }, { merge: true });
    
    await friendRef.set({
      friends: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
    }, { merge: true });
    
    // Обновляем заявку
    await db.collection('friendRequests').doc(requestId).update({
      status: 'accepted'
    });
    
    // Обновляем локально
    friendsList.push(friendId);
    localStorage.setItem('quizhub-friends', JSON.stringify(friendsList));
    
    // Убираем из запросов
    friendRequests = friendRequests.filter(r => r.id !== requestId);
    localStorage.setItem('quizhub-friend-requests', JSON.stringify(friendRequests));
    
    showToast('Теперь вы друзья! 🎉', 'success');
    
    // Начисляем бонус
    addCoins(50);
    showToast('+50 🪙 за нового друга!', 'success');
  } catch (error) {
    console.error('Ошибка:', error);
    showToast('Не удалось принять заявку', 'danger');
  }
}

async function removeFriend(friendId) {
  if (!currentUser) return;
  
  try {
    await db.collection('users').doc(currentUser.uid).update({
      friends: firebase.firestore.FieldValue.arrayRemove(friendId)
    });
    
    await db.collection('users').doc(friendId).update({
      friends: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
    });
    
    friendsList = friendsList.filter(id => id !== friendId);
    localStorage.setItem('quizhub-friends', JSON.stringify(friendsList));
    
    showToast('Удалён из друзей', 'info');
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

function getFriendsLeaderboard() {
  if (friendsList.length === 0) return Promise.resolve([]);
  
  return db.collection('leaderboard')
    .where('userId', 'in', friendsList.slice(0, 10)) // Firestore ограничение
    .orderBy('score', 'desc')
    .limit(20)
    .get()
    .then(snapshot => {
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    });
}

// ========== СИСТЕМА РЕФЕРАЛОВ ==========

function generateReferralCode() {
  if (!currentUser) return null;
  
  const code = currentUser.uid.substring(0, 8).toUpperCase();
  localStorage.setItem('quizhub-referral-code', code);
  return code;
}

async function useReferralCode(code) {
  if (!currentUser) {
    showToast('Войдите в аккаунт', 'warning');
    return;
  }
  
  const usedCode = localStorage.getItem('quizhub-used-referral');
  if (usedCode) {
    showToast('Вы уже использовали реферальный код', 'info');
    return;
  }
  
  try {
    // Ищем владельца кода
    const snapshot = await db.collection('users')
      .where('referralCode', '==', code)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      showToast('Неверный код', 'warning');
      return;
    }
    
    const referrer = snapshot.docs[0];
    
    // Начисляем бонусы
    await db.collection('users').doc(referrer.id).update({
      referralCount: firebase.firestore.FieldValue.increment(1),
      coins: firebase.firestore.FieldValue.increment(100)
    });
    
    // Бонус новому пользователю
    addCoins(100);
    
    localStorage.setItem('quizhub-used-referral', code);
    showToast('Реферальный код применён! +100 🪙', 'success');
    
  } catch (error) {
    console.error('Ошибка:', error);
    showToast('Не удалось применить код', 'danger');
  }
}

// ========== ЕЖЕДНЕВНЫЕ ПОДАРКИ ==========

function sendDailyGift(friendId) {
  if (!currentUser) return;
  
  const today = new Date().toISOString().split('T')[0];
  const sentGifts = JSON.parse(localStorage.getItem('quizhub-sent-gifts') || '{}');
  
  if (sentGifts[today]?.includes(friendId)) {
    showToast('Подарок уже отправлен сегодня', 'info');
    return;
  }
  
  // Отправляем подарок
  db.collection('gifts').add({
    from: currentUser.uid,
    fromName: currentUser.displayName,
    to: friendId,
    type: 'daily',
    amount: 25,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    claimed: false
  });
  
  // Записываем отправку
  if (!sentGifts[today]) sentGifts[today] = [];
  sentGifts[today].push(friendId);
  localStorage.setItem('quizhub-sent-gifts', JSON.stringify(sentGifts));
  
  showToast('Подарок отправлен! 🎁', 'success');
}

async function claimGifts() {
  if (!currentUser) return;
  
  try {
    const snapshot = await db.collection('gifts')
      .where('to', '==', currentUser.uid)
      .where('claimed', '==', false)
      .get();
    
    let totalCoins = 0;
    
    for (const doc of snapshot.docs) {
      const gift = doc.data();
      totalCoins += gift.amount;
      await doc.ref.update({ claimed: true });
    }
    
    if (totalCoins > 0) {
      addCoins(totalCoins);
      showToast(`Получено подарков: +${totalCoins} 🪙!`, 'success');
    }
  } catch (error) {
    console.error('Ошибка получения подарков:', error);
  }
}

// ========== СОВМЕСТНЫЕ ДОСТИЖЕНИЯ ==========

const SOCIAL_ACHIEVEMENTS = [
  {
    id: 'first_friend',
    name: 'Дружба',
    desc: 'Добавить первого друга',
    icon: '🤝',
    condition: () => friendsList.length >= 1
  },
  {
    id: 'social_butterfly',
    name: 'Душа компании',
    desc: 'Иметь 10 друзей',
    icon: '🦋',
    condition: () => friendsList.length >= 10
  },
  {
    id: 'gift_giver',
    name: 'Щедрый',
    desc: 'Отправить 10 подарков',
    icon: '🎁',
    condition: () => {
      const allGifts = JSON.parse(localStorage.getItem('quizhub-sent-gifts') || '{}');
      let total = 0;
      Object.values(allGifts).forEach(arr => total += arr.length);
      return total >= 10;
    }
  },
  {
    id: 'referral_master',
    name: 'Вербовщик',
    desc: 'Пригласить 5 друзей по реферальному коду',
    icon: '📢',
    condition: () => (userReferralCount || 0) >= 5
  }
];

let userReferralCount = 0;

function checkSocialAchievements() {
  SOCIAL_ACHIEVEMENTS.forEach(ach => {
    if (!unlockedAchievements.includes(ach.id) && ach.condition()) {
      unlockedAchievements.push(ach.id);
      showAchievements([ach]);
    }
  });
  
  localStorage.setItem('quizhub-achievements', JSON.stringify(unlockedAchievements));
}

// ========== UI ДРУЗЕЙ ==========

function showFriendsScreen() {
  const screen = document.getElementById('screen-friends');
  if (!screen) return;
  
  renderFriendsScreen(screen);
  showScreen('friends');
}

function renderFriendsScreen(screen) {
  const referralCode = (typeof currentUser !== 'undefined' && currentUser) 
  ? currentUser.uid.substring(0, 8).toUpperCase() 
  : '————';
  
  getFriendsLeaderboard().then(friendsScores => {
    screen.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-lg-6">
          <div class="text-center mb-4">
            <h2 class="fw-bold font-display mb-2">👥 Друзья</h2>
            <p class="text-muted">${friendsList.length} друзей</p>
          </div>
          
          <!-- Реферальный код -->
          <div class="bg-card rounded-4 p-4 mb-4 text-center">
            <p class="text-muted mb-2">Твой реферальный код</p>
            <h3 class="font-display text-accent mb-2">${referralCode}</h3>
            <button class="btn btn-outline-accent btn-sm rounded-pill px-3" 
                    onclick="copyReferralCode('${referralCode}')">
              <i class="bi bi-clipboard me-1"></i>Копировать
            </button>
            <p class="text-muted small mt-2">+100 🪙 за каждого друга!</p>
          </div>
          
          <!-- Ввести код -->
          <div class="bg-card rounded-4 p-4 mb-4">
            <div class="input-group">
              <input type="text" class="form-control rounded-pill px-4" 
                     id="referral-input" placeholder="Введите код друга" maxlength="8">
              <button class="btn btn-accent rounded-pill px-4 ms-2" 
                      onclick="useReferralFromInput()">
                Применить
              </button>
            </div>
          </div>
          
          <!-- Список друзей -->
          <div class="bg-card rounded-4 p-4 mb-4">
            <h5 class="fw-bold mb-3">Мои друзья</h5>
            <div class="d-grid gap-2" id="friends-list">
              ${friendsList.length === 0 
                ? '<p class="text-muted text-center">У вас пока нет друзей</p>'
                : '<p class="text-muted">Загрузка...</p>'}
            </div>
          </div>
          
          <!-- Друзья в лидерах -->
          ${friendsScores.length > 0 ? `
            <div class="bg-card rounded-4 p-4 mb-4">
              <h5 class="fw-bold mb-3">🏆 Друзья в таблице лидеров</h5>
              <div class="d-grid gap-2">
                ${friendsScores.map((f, i) => `
                  <div class="d-flex align-items-center gap-3 p-2">
                    <span class="fw-bold">${i + 1}.</span>
                    <span class="flex-grow-1">${f.playerName}</span>
                    <span class="text-accent fw-bold">${f.score}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <button class="btn btn-outline-accent rounded-pill px-4 w-100" onclick="showScreen('home')">
            <i class="bi bi-house me-2"></i>На главную
          </button>
        </div>
      </div>
    `;
    
    loadFriendsList();
  });
}

function copyReferralCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast('Код скопирован! 📋', 'success');
  });
}

function useReferralFromInput() {
  const input = document.getElementById('referral-input');
  const code = input?.value.trim();
  if (code) useReferralCode(code);
}

async function loadFriendsList() {
  const container = document.getElementById('friends-list');
  if (!container) return;
  
  if (friendsList.length === 0) return;
  
  // Загружаем имена друзей
  const friends = [];
  for (const uid of friendsList.slice(0, 20)) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) {
        friends.push({ uid, ...doc.data() });
      }
    } catch (e) {}
  }
  
  container.innerHTML = friends.map(f => `
    <div class="d-flex align-items-center gap-3 p-2 rounded-3 bg-card-hover">
      ${f.photoURL 
        ? `<img src="${f.photoURL}" width="32" height="32" class="rounded-circle">`
        : `<div class="bg-accent rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;">
            <small>${(f.displayName || '?')[0]}</small></div>`
      }
      <span class="flex-grow-1 fw-semibold">${f.displayName || 'Игрок'}</span>
      <button class="btn btn-sm btn-outline-accent rounded-pill px-2" onclick="sendDailyGift('${f.uid}')" title="Подарок">
        🎁
      </button>
      <button class="btn btn-sm btn-outline-danger rounded-pill px-2" onclick="removeFriend('${f.uid}')" title="Удалить">
        ✕
      </button>
    </div>
  `).join('');
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  claimGifts();
  checkSocialAchievements();
  
  // Проверяем новые подарки каждые 5 минут
  setInterval(claimGifts, 300000);
});