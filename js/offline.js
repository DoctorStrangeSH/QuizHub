// ============================================
// QuizHub — Офлайн-режим и сетевая устойчивость
// ============================================

// ========== СОСТОЯНИЕ СЕТИ ==========

let isOnline = navigator.onLine;

function updateOnlineStatus() {
  isOnline = navigator.onLine;
  
  const indicator = document.getElementById('online-indicator');
  if (indicator) {
    if (isOnline) {
      indicator.className = 'online-indicator online';
      indicator.title = 'Онлайн';
      setTimeout(() => {
        indicator.style.opacity = '0';
      }, 2000);
    } else {
      indicator.className = 'online-indicator offline';
      indicator.title = 'Офлайн — результаты сохранятся локально';
      indicator.style.opacity = '1';
    }
  }
  
  if (!isOnline) {
    showToast('Вы офлайн. Результаты сохранятся и отправятся позже 📡', 'warning');
  } else {
    showToast('Подключение восстановлено! 🔄', 'success');
    syncOfflineResults();
  }
}

function createOnlineIndicator() {
  if (document.getElementById('online-indicator')) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'online-indicator';
  indicator.className = 'online-indicator ' + (isOnline ? 'online' : 'offline');
  indicator.title = isOnline ? 'Онлайн' : 'Офлайн';
  
  if (isOnline) {
    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 2000);
  }
  
  document.body.appendChild(indicator);
}

// ========== OFFLINE RESULTS ==========

function saveResultOffline(result) {
  return new Promise((resolve) => {
    const offlineResults = JSON.parse(localStorage.getItem('quizhub-offline-results') || '[]');
    offlineResults.push({
      ...result,
      savedAt: Date.now()
    });
    localStorage.setItem('quizhub-offline-results', JSON.stringify(offlineResults));
    
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SAVE_OFFLINE_RESULT',
        result: result
      });
    }
    
    resolve();
  });
}

async function syncOfflineResults() {
  const offlineResults = JSON.parse(localStorage.getItem('quizhub-offline-results') || '[]');
  
  if (offlineResults.length === 0) return;
  
  let synced = 0;
  
  for (const result of offlineResults) {
    try {
      if (typeof saveResult === 'function') {
        await saveResult(result);
        synced++;
      }
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
    }
  }
  
  if (synced > 0) {
    showToast(`Синхронизировано результатов: ${synced} ✅`, 'success');
  }
  
  const remaining = offlineResults.slice(synced);
  localStorage.setItem('quizhub-offline-results', JSON.stringify(remaining));
}

// ========== АВТОСОХРАНЕНИЕ ПРОГРЕССА ==========

function saveQuizProgress(progress) {
  localStorage.setItem('quizhub-quiz-progress', JSON.stringify({
    ...progress,
    timestamp: Date.now()
  }));
  
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SAVE_QUIZ_PROGRESS',
      progress: progress
    });
  }
}

function getQuizProgress() {
  const saved = localStorage.getItem('quizhub-quiz-progress');
  if (!saved) return null;
  
  const progress = JSON.parse(saved);
  const age = (Date.now() - progress.timestamp) / 1000;
  
  if (age > 1800) {
    localStorage.removeItem('quizhub-quiz-progress');
    return null;
  }
  
  return progress;
}

// ========== УСТАНОВКА PWA ==========

let deferredPrompt = null;
let installButtonAdded = false;

function initPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if (!installButtonAdded) {
      addInstallButton();
      installButtonAdded = true;
    }
  });
  
  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  if (isIOS && !isStandalone && !installButtonAdded) {
    setTimeout(() => {
      showToast('💡 Добавь приложение на домашний экран: нажми "Поделиться" → "На экран Домой"', 'info');
    }, 3000);
  }
  
  window.addEventListener('appinstalled', () => {
    const installBtn = document.getElementById('install-button');
    if (installBtn) installBtn.remove();
    deferredPrompt = null;
    showToast('Приложение установлено! 🎉', 'success');
  });
}

function addInstallButton() {
  const authArea = document.getElementById('auth-area');
  if (!authArea) return;
  
  const installBtn = document.createElement('button');
  installBtn.id = 'install-button';
  installBtn.className = 'btn btn-outline-accent btn-sm rounded-pill px-3 ms-2';
  installBtn.innerHTML = '<i class="bi bi-download me-1"></i>Установить';
  installBtn.onclick = installPWA;
  
  authArea.parentNode.insertBefore(installBtn, authArea.nextSibling);
}

async function installPWA() {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[PWA] Результат установки: ${outcome}`);
  
  if (outcome === 'accepted') {
    const installBtn = document.getElementById('install-button');
    if (installBtn) installBtn.remove();
  }
  
  deferredPrompt = null;
}

// ========== ВИБРАЦИЯ ==========

function vibrate(pattern = 200) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

function vibrateCorrect() {
  vibrate([100, 50, 100]);
}

function vibrateWrong() {
  vibrate([200, 100, 400]);
}

function vibrateAchievement() {
  vibrate([100, 50, 100, 50, 200]);
}

// ========== ЖЕСТЫ (СВАЙП) ==========

function initSwipeNavigation() {
  let touchStartX = 0;
  let touchStartY = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  
  document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
      if (deltaX > 0) {
        const currentScreen = document.querySelector('.screen.active');
        if (currentScreen && currentScreen.id !== 'screen-home') {
          showScreen('home');
        }
      }
    }
  });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  createOnlineIndicator();
  updateOnlineStatus();
  initPWAInstall();
  initSwipeNavigation();
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  const savedProgress = getQuizProgress();
  if (savedProgress) {
    const age = Math.floor((Date.now() - savedProgress.timestamp) / 1000);
    if (age < 1800) {
      showToast(`У вас есть незавершённый квиз (${Math.floor(age / 60)} мин. назад)`, 'info');
    }
  }
  
  // Исправленная проверка periodicSync
  if (navigator.serviceWorker && navigator.serviceWorker.registration) {
    navigator.serviceWorker.ready.then(reg => {
      if ('periodicSync' in reg) {
        console.log('[PWA] Periodic Sync поддерживается');
      }
      if ('sync' in reg) {
        console.log('[PWA] Background Sync поддерживается');
      }
    });
  }
});