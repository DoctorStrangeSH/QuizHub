// ============================================
// QuizHub — Турнирная система
// ============================================

let activeTournament = null;
let tournamentUnsubscribe = null;

// ========== ТИПЫ ТУРНИРОВ ==========

const TOURNAMENT_TYPES = {
  daily: {
    name: 'Ежедневный',
    icon: '📅',
    duration: 86400, // 24 часа
    reward: 100,
    entryFee: 0
  },
  weekly: {
    name: 'Еженедельный',
    icon: '🏆',
    duration: 604800, // 7 дней
    reward: 500,
    entryFee: 50
  },
  speed: {
    name: 'Блиц-турнир',
    icon: '⚡',
    duration: 3600, // 1 час
    reward: 200,
    entryFee: 25
  }
};

// ========== СОЗДАНИЕ/ПРИСОЕДИНЕНИЕ К ТУРНИРУ ==========

async function joinTournament(type) {
  if (!currentUser) {
    showToast('Войди в аккаунт для участия в турнире', 'warning');
    return;
  }
  
  const config = TOURNAMENT_TYPES[type];
  if (!config) return;
  
  // Проверяем монеты
  if (config.entryFee > 0) {
    const coins = parseInt(localStorage.getItem('quizhub-coins') || '0');
    if (coins < config.entryFee) {
      showToast(`Не хватает монет! Нужно ${config.entryFee} 🪙`, 'warning');
      return;
    }
    addCoins(-config.entryFee);
  }
  
  try {
    // Ищем активный турнир этого типа
    const now = new Date();
    const snapshot = await db.collection('tournaments')
      .where('type', '==', type)
      .where('status', '==', 'active')
      .where('endsAt', '>', now)
      .limit(1)
      .get();
    
    let tournamentId;
    
    if (snapshot.empty) {
      // Создаём новый турнир
      const endsAt = new Date(now.getTime() + config.duration * 1000);
      
      const ref = await db.collection('tournaments').add({
        type: type,
        name: config.name,
        icon: config.icon,
        reward: config.reward,
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        endsAt: endsAt,
        participants: [{
          uid: currentUser.uid,
          name: currentUser.displayName || 'Игрок',
          score: 0,
          photoURL: currentUser.photoURL || null
        }],
        participantCount: 1
      });
      
      tournamentId = ref.id;
    } else {
      tournamentId = snapshot.docs[0].id;
      
      // Добавляем участника
      await db.collection('tournaments').doc(tournamentId).update({
        participants: firebase.firestore.FieldValue.arrayUnion({
          uid: currentUser.uid,
          name: currentUser.displayName || 'Игрок',
          score: 0,
          photoURL: currentUser.photoURL || null
        }),
        participantCount: firebase.firestore.FieldValue.increment(1)
      });
    }
    
    activeTournament = { id: tournamentId, type };
    showToast(`Ты в турнире «${config.name}»! 🎮`, 'success');
    
    // Подписываемся на обновления
    subscribeToTournament(tournamentId);
    
  } catch (error) {
    console.error('Ошибка турнира:', error);
    showToast('Не удалось присоединиться к турниру', 'danger');
  }
}

// ========== ОБНОВЛЕНИЕ СЧЁТА В ТУРНИРЕ ==========

async function updateTournamentScore(score) {
  if (!activeTournament || !currentUser) return;
  
  try {
    const ref = db.collection('tournaments').doc(activeTournament.id);
    const doc = await ref.get();
    const data = doc.data();
    
    const participants = data.participants.map(p => {
      if (p.uid === currentUser.uid) {
        return { ...p, score: Math.max(p.score || 0, score) };
      }
      return p;
    });
    
    await ref.update({ participants });
  } catch (error) {
    console.error('Ошибка обновления счёта турнира:', error);
  }
}

// ========== ПОДПИСКА НА ТУРНИР ==========

function subscribeToTournament(tournamentId) {
  if (tournamentUnsubscribe) tournamentUnsubscribe();
  
  tournamentUnsubscribe = db.collection('tournaments').doc(tournamentId)
    .onSnapshot(doc => {
      const data = doc.data();
      if (!data) return;
      
      if (data.status === 'finished') {
        showTournamentResults(data);
        tournamentUnsubscribe();
        tournamentUnsubscribe = null;
        activeTournament = null;
      }
    });
}

// ========== РЕЗУЛЬТАТЫ ТУРНИРА ==========

function showTournamentResults(data) {
  const sorted = (data.participants || []).sort((a, b) => b.score - a.score);
  
  const screen = document.getElementById('screen-tournament');
  if (!screen) return;
  
  const medals = ['🥇', '🥈', '🥉'];
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-6 text-center py-5">
        <h2 class="fw-bold font-display mb-2">${data.icon} Турнир завершён!</h2>
        <p class="text-muted mb-4">${data.name}</p>
        
        <div class="d-grid gap-3 mb-4">
          ${sorted.slice(0, 10).map((p, i) => `
            <div class="bg-card rounded-4 p-3 d-flex align-items-center gap-3">
              <span class="fs-3">${i < 3 ? medals[i] : `#${i + 1}`}</span>
              <span class="fw-bold flex-grow-1 text-start">${p.name}</span>
              <span class="text-accent fw-bold">${p.score}</span>
            </div>
          `).join('')}
        </div>
        
        <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">
          <i class="bi bi-house me-2"></i>На главную
        </button>
      </div>
    </div>
  `;
  
  showScreen('tournament');
}

// ========== UI ТУРНИРОВ ==========

function showTournamentScreen() {
    const screen = document.getElementById('screen-tournament');
    if (!screen) return;

    screen.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-lg-6 text-center py-5">
                <h2 class="fw-bold font-display mb-4">🏆 ${t('tournamentTitle')}</h2>

                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <div class="bg-card rounded-4 p-4">
                            <span class="fs-1">📅</span>
                            <h5 class="fw-bold mt-2">${t('dailyTournament')}</h5>
                            <p class="text-accent fw-bold">🏆 100 ${t('tournamentReward')}</p>
                            <p class="text-success small">${t('free')}</p>
                            <button class="btn btn-accent rounded-pill px-4 mt-2 w-100" onclick="joinTournament('daily')">
                                ${t('participate')}
                            </button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="bg-card rounded-4 p-4">
                            <span class="fs-1">🏆</span>
                            <h5 class="fw-bold mt-2">${t('weeklyTournament')}</h5>
                            <p class="text-accent fw-bold">🏆 500 ${t('tournamentReward')}</p>
                            <p class="text-muted small">${t('entryFee')}: 50 🪙</p>
                            <button class="btn btn-accent rounded-pill px-4 mt-2 w-100" onclick="joinTournament('weekly')">
                                ${t('participate')}
                            </button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="bg-card rounded-4 p-4">
                            <span class="fs-1">⚡</span>
                            <h5 class="fw-bold mt-2">${t('blitzTournament')}</h5>
                            <p class="text-accent fw-bold">🏆 200 ${t('tournamentReward')}</p>
                            <p class="text-muted small">${t('entryFee')}: 25 🪙</p>
                            <button class="btn btn-accent rounded-pill px-4 mt-2 w-100" onclick="joinTournament('speed')">
                                ${t('participate')}
                            </button>
                        </div>
                    </div>
                </div>

                <button class="btn btn-outline-accent rounded-pill px-4" onclick="showScreen('home')">
                    <i class="bi bi-house me-2"></i>${t('home')}
                </button>
            </div>
        </div>
    `;

    showScreen('tournament');
}