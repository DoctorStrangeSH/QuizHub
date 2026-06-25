// ============================================
// QuizHub — Социальные механики v2.0
// ============================================

let friendsList = JSON.parse(localStorage.getItem('quizhub-friends') || '[]');
let friendRequests = JSON.parse(localStorage.getItem('quizhub-friend-requests') || '[]');

async function sendFriendRequest(targetUserId) {
  if (!currentUser) { showToast('Войдите в аккаунт', 'warning'); return; }
  if (friendsList.includes(targetUserId)) { showToast('Уже в друзьях!', 'info'); return; }
  try {
    await db.collection('friendRequests').add({ from: currentUser.uid, fromName: currentUser.displayName, fromPhoto: currentUser.photoURL, to: targetUserId, status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    showToast('Заявка отправлена! 📨', 'success');
  } catch (e) { showToast('Не удалось отправить заявку', 'danger'); }
}

async function acceptFriendRequest(requestId, friendId) {
  if (!currentUser) return;
  try {
    await db.collection('users').doc(currentUser.uid).set({ friends: firebase.firestore.FieldValue.arrayUnion(friendId) }, { merge: true });
    await db.collection('users').doc(friendId).set({ friends: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) }, { merge: true });
    await db.collection('friendRequests').doc(requestId).update({ status: 'accepted' });
    friendsList.push(friendId); localStorage.setItem('quizhub-friends', JSON.stringify(friendsList));
    showToast('Теперь вы друзья! 🎉', 'success');
    if (typeof addCoins === 'function') addCoins(50);
  } catch (e) { showToast('Не удалось принять заявку', 'danger'); }
}

function generateReferralCode() {
  if (!currentUser) return null;
  const code = currentUser.uid.substring(0, 8).toUpperCase();
  return code;
}

function showFriendsScreen() {
  const screen = document.getElementById('screen-friends');
  if (!screen) return;
  renderFriendsScreen(screen);
  showScreen('friends');
}

function renderFriendsScreen(screen) {
  const referralCode = generateReferralCode();
  screen.innerHTML = `
    <div class="row justify-content-center"><div class="col-lg-6">
      <div class="text-center mb-4"><h2 class="fw-bold font-display mb-2">👥 ${t('friendsTitle')}</h2><p class="text-muted">${friendsList.length} ${t('friendsCount')}</p></div>
      <div class="bg-card rounded-4 p-4 mb-4 text-center"><p class="text-muted mb-2">Твой реферальный код</p><h3 class="font-display text-accent mb-2">${referralCode}</h3><button class="btn btn-outline-accent btn-sm rounded-pill px-3" onclick="copyReferralCode('${referralCode}')"><i class="bi bi-clipboard me-1"></i>Копировать</button></div>
      <div class="bg-card rounded-4 p-4 mb-4"><h5 class="fw-bold mb-3">${t('friendsTitle')}</h5><div class="d-grid gap-2" id="friends-list">${friendsList.length === 0 ? `<p class="text-muted text-center">${t('noFriends')}</p>` : '<p class="text-muted">Загрузка...</p>'}</div></div>
      <button class="btn btn-outline-accent rounded-pill px-4 w-100" onclick="showScreen('home')"><i class="bi bi-house me-2"></i>${t('home')}</button>
    </div></div>`;
  loadFriendsList();
}

function copyReferralCode(code) { navigator.clipboard.writeText(code).then(() => showToast('Код скопирован! 📋', 'success')); }

async function loadFriendsList() {
  const container = document.getElementById('friends-list');
  if (!container || friendsList.length === 0) return;
  const friends = [];
  for (const uid of friendsList.slice(0, 20)) { try { const doc = await db.collection('users').doc(uid).get(); if (doc.exists) friends.push({ uid, ...doc.data() }); } catch (e) {} }
  container.innerHTML = friends.map(f => `<div class="d-flex align-items-center gap-3 p-2 rounded-3 bg-card-hover">${f.photoURL ? `<img src="${f.photoURL}" width="32" height="32" class="rounded-circle">` : `<div class="bg-accent rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;"><small>${(f.displayName||'?')[0]}</small></div>`}<span class="flex-grow-1 fw-semibold">${f.displayName || 'Игрок'}</span></div>`).join('');
}