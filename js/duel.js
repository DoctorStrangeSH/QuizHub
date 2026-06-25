// ============================================
// QuizHub — Режим дуэли (PvP)
// ============================================

let duelRoom = null;
let duelListener = null;
let duelOpponent = null;
let duelMyScore = 0;
let duelOpponentScore = 0;
let duelId = null;

// Создание комнаты для дуэли
async function createDuelRoom() {
  const myName = document.getElementById('player-name').value.trim() || 'Игрок 1';
  
  try {
    const roomRef = await db.collection('duels').add({
      player1: {
        name: myName,
        score: 0,
        finished: false,
        uid: currentUser?.uid || null,
        photoURL: currentUser?.photoURL || null
      },
      player2: null,
      status: 'waiting',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      questions: generateDuelQuestions()
    });
    
    duelId = roomRef.id;
    duelRoom = roomRef;
    
    showDuelWaitingScreen(duelId);
    listenForOpponent(duelId);
    
    showToast('Комната создана! Отправь код другу 📋', 'success');
  } catch (error) {
    console.error('Ошибка создания дуэли:', error);
    showToast('Не удалось создать дуэль', 'danger');
  }
}

// Присоединение к комнате
async function joinDuelRoom(roomId) {
  const myName = document.getElementById('player-name').value.trim() || 'Игрок 2';
  
  try {
    const roomDoc = await db.collection('duels').doc(roomId).get();
    
    if (!roomDoc.exists) {
      showToast('Комната не найдена 😕', 'danger');
      return;
    }
    
    const roomData = roomDoc.data();
    
    if (roomData.status !== 'waiting') {
      showToast('Эта дуэль уже началась', 'warning');
      return;
    }
    
    await db.collection('duels').doc(roomId).update({
      player2: {
        name: myName,
        score: 0,
        finished: false,
        uid: currentUser?.uid || null,
        photoURL: currentUser?.photoURL || null
      },
      status: 'ready'
    });
    
    duelId = roomId;
    duelRoom = db.collection('duels').doc(roomId);
    
    startDuelQuiz(roomData.questions, 'player2');
    
  } catch (error) {
    console.error('Ошибка присоединения:', error);
    showToast('Не удалось присоединиться', 'danger');
  }
}

function generateDuelQuestions() {
  // Генерируем 5 вопросов для дуэли
  const category = document.getElementById('quiz-category')?.value || 'any';
  const pool = [];
  
  Object.values(russianQuestions).forEach(arr => pool.push(...arr));
  const selected = shuffleArray(pool).slice(0, 5);
  
  return selected.map(q => ({
    question: q.question,
    answers: shuffleArray([...q.answers]),
    correctIndex: q.correctIndex,
    category: q.category,
    difficulty: q.difficulty
  }));
}

function listenForOpponent(roomId) {
  duelListener = db.collection('duels').doc(roomId)
    .onSnapshot(doc => {
      const data = doc.data();
      if (!data) return;
      
      if (data.status === 'ready' && data.player2) {
        duelOpponent = data.player2;
        showToast(`${data.player2.name} присоединился! 🎮`, 'success');
        startDuelQuiz(data.questions, 'player1');
      }
      
      // Обновляем счёт соперника
      if (data.player1 && data.player2) {
        const myRole = duelOpponent ? 'player2' : 'player1';
        const opponentRole = myRole === 'player1' ? 'player2' : 'player1';
        duelOpponentScore = data[opponentRole]?.score || 0;
        
        updateDuelScoreDisplay();
        
        // Проверяем завершение
        if (data.player1.finished && data.player2.finished) {
          finishDuel(data);
        }
      }
    });
}

function startDuelQuiz(questions, role) {
  quizQuestions = questions;
  QUIZ_SETTINGS.totalQuestions = questions.length;
  
  currentQuestionIndex = 0;
  duelMyScore = 0;
  score = 0;
  
  showScreen('quiz');
  renderDuelQuizScreen();
  startTimer();
  
  quizStartTime = Date.now();
}

function renderDuelQuizScreen() {
  // Похоже на renderQuizScreen, но с информацией о дуэли
  renderQuizScreen();
  
  // Добавляем информацию о дуэли
  const scoreEl = document.querySelector('#screen-quiz .d-flex.justify-content-between');
  if (scoreEl) {
    scoreEl.innerHTML = `
      <small class="text-muted">⚔️ Дуэль — Вопрос ${currentQuestionIndex + 1} из ${QUIZ_SETTINGS.totalQuestions}</small>
      <small class="text-muted">
        Ты: <span class="text-accent fw-bold">${duelMyScore}</span> | 
        Соперник: <span class="text-warning fw-bold">${duelOpponentScore}</span>
      </small>
    `;
  }
}

function updateDuelScoreDisplay() {
  const scoreEl = document.querySelector('#screen-quiz .d-flex.justify-content-between');
  if (scoreEl) {
    scoreEl.innerHTML = `
      <small class="text-muted">⚔️ Дуэль — Вопрос ${currentQuestionIndex + 1} из ${QUIZ_SETTINGS.totalQuestions}</small>
      <small class="text-muted">
        Ты: <span class="text-accent fw-bold">${duelMyScore}</span> | 
        Соперник: <span class="text-warning fw-bold">${duelOpponentScore}</span>
      </small>
    `;
  }
}

async function finishDuelQuiz() {
  clearInterval(timerInterval);
  
  // Отправляем результат
  const myRole = duelOpponent ? 'player2' : 'player1';
  
  await duelRoom.update({
    [`${myRole}.score`]: duelMyScore,
    [`${myRole}.finished`]: true
  });
  
  showDuelWaitingResult();
}

function showDuelWaitingResult() {
  const screen = document.getElementById('screen-result');
  if (!screen) return;
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-6 text-center py-5">
        <div class="spinner-border text-accent mb-3" role="status">
          <span class="visually-hidden">Ожидание...</span>
        </div>
        <h3 class="fw-bold mb-2">Ожидаем соперника...</h3>
        <p class="text-muted">Твой счёт: ${duelMyScore}</p>
      </div>
    </div>
  `;
  
  showScreen('result');
}

function finishDuel(data) {
  const myRole = duelOpponent ? 'player2' : 'player1';
  const opponentRole = myRole === 'player1' ? 'player2' : 'player1';
  
  const myScore = data[myRole]?.score || 0;
  const opponentScore = data[opponentRole]?.score || 0;
  
  let result = '';
  if (myScore > opponentScore) result = 'Победа! 🏆';
  else if (myScore < opponentScore) result = 'Поражение 😔';
  else result = 'Ничья! 🤝';
  
  const screen = document.getElementById('screen-result');
  if (screen) {
    screen.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-lg-6 text-center py-5">
          <h2 class="fw-bold font-display mb-3">${result}</h2>
          <div class="row g-3 mb-4">
            <div class="col-6">
              <div class="bg-card rounded-4 p-4">
                <p class="text-muted mb-1">Ты</p>
                <p class="display-5 fw-bold text-accent">${myScore}</p>
                <small>${data[myRole]?.name}</small>
              </div>
            </div>
            <div class="col-6">
              <div class="bg-card rounded-4 p-4">
                <p class="text-muted mb-1">Соперник</p>
                <p class="display-5 fw-bold text-warning">${opponentScore}</p>
                <small>${data[opponentRole]?.name}</small>
              </div>
            </div>
          </div>
          <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">
            <i class="bi bi-house me-2"></i>На главную
          </button>
        </div>
      </div>
    `;
  }
  
  // Очищаем
  if (duelListener) duelListener();
  duelListener = null;
  duelRoom = null;
  duelOpponent = null;
}

function showDuelWaitingScreen(roomId) {
  const screen = document.getElementById('screen-quiz');
  if (!screen) return;
  
  screen.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-6 text-center py-5">
        <i class="bi bi-controller fs-1 text-accent d-block mb-3"></i>
        <h3 class="fw-bold mb-2">Ожидание соперника</h3>
        <p class="text-muted mb-4">Отправь этот код другу:</p>
        <div class="bg-card rounded-4 p-4 mb-4">
          <p class="display-5 fw-bold font-display text-accent mb-0">${roomId}</p>
          <button class="btn btn-outline-accent btn-sm rounded-pill mt-2" onclick="copyDuelCode('${roomId}')">
            <i class="bi bi-clipboard me-1"></i>Копировать
          </button>
        </div>
        <div class="spinner-border text-accent" role="status">
          <span class="visually-hidden">Ожидание...</span>
        </div>
        <p class="text-muted mt-3">Ждём подключения...</p>
        <button class="btn btn-outline-accent rounded-pill mt-3" onclick="cancelDuel()">
          Отменить
        </button>
      </div>
    </div>
  `;
  
  showScreen('quiz');
}

async function cancelDuel() {
  if (duelListener) duelListener();
  if (duelId) {
    await db.collection('duels').doc(duelId).delete();
  }
  duelRoom = null;
  duelId = null;
  showScreen('home');
}

function copyDuelCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast('Код скопирован! 📋', 'success');
  });
}

// Форма присоединения к дуэли
function showJoinDuelForm() {
  const code = prompt('Введи код дуэли:');
  if (code && code.trim()) {
    joinDuelRoom(code.trim());
  }
}