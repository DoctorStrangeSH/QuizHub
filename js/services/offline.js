// ============================================
// QuizHub — Офлайн-режим v2.0 (без тостов)
// ============================================

let isOnline = navigator.onLine;
let wasOffline = false;
let isFirstCheck = true;

function updateOnlineStatus() {
  const wasOnline = isOnline;
  isOnline = navigator.onLine;
  
  const indicator = document.getElementById('online-indicator');
  if (indicator) {
    if (isOnline) {
      indicator.className = 'online-indicator online';
      setTimeout(() => { indicator.style.opacity = '0'; }, 2000);
    } else {
      indicator.className = 'online-indicator offline';
      indicator.style.opacity = '1';
    }
  }
  
  if (isFirstCheck) { isFirstCheck = false; return; }
  
  if (isOnline && wasOffline) {
    syncOfflineResults();
    wasOffline = false;
    console.log('🔄 Сеть восстановлена');
  }
  
  if (!isOnline && wasOnline) {
    wasOffline = true;
    console.log('📡 Сеть потеряна');
  }
}

function createOnlineIndicator() {
  if (document.getElementById('online-indicator')) return;
  const indicator = document.createElement('div');
  indicator.id = 'online-indicator';
  indicator.className = 'online-indicator ' + (isOnline ? 'online' : 'offline');
  indicator.style.opacity = '0';
  document.body.appendChild(indicator);
}

function saveResultOffline(result) {
  return new Promise((resolve) => {
    const offlineResults = JSON.parse(localStorage.getItem('quizhub-offline-results') || '[]');
    offlineResults.push({ ...result, savedAt: Date.now() });
    localStorage.setItem('quizhub-offline-results', JSON.stringify(offlineResults));
    resolve();
  });
}

async function syncOfflineResults() {
  const offlineResults = JSON.parse(localStorage.getItem('quizhub-offline-results') || '[]');
  if (offlineResults.length === 0) return;
  
  let synced = 0;
  for (const result of offlineResults) {
    try {
      if (typeof saveResult === 'function') { await saveResult(result); synced++; }
    } catch (error) { break; }
  }
  
  if (synced > 0) console.log(`✅ Синхронизировано: ${synced}`);
  const remaining = offlineResults.slice(synced);
  localStorage.setItem('quizhub-offline-results', JSON.stringify(remaining));
}

function saveQuizProgress(progress) {
  localStorage.setItem('quizhub-quiz-progress', JSON.stringify({ ...progress, timestamp: Date.now() }));
}

function getQuizProgress() {
  const saved = localStorage.getItem('quizhub-quiz-progress');
  if (!saved) return null;
  const progress = JSON.parse(saved);
  if ((Date.now() - progress.timestamp) / 1000 > 1800) {
    localStorage.removeItem('quizhub-quiz-progress');
    return null;
  }
  return progress;
}

// ========== PWA ==========
let deferredPrompt = null;
function initPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
}
async function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
}

// ========== ВИБРАЦИЯ ==========
function vibrate(p=200) { if('vibrate' in navigator) navigator.vibrate(p); }
function vibrateCorrect() { vibrate([100,50,100]); }
function vibrateWrong() { vibrate([200,100,400]); }
function vibrateAchievement() { vibrate([100,50,100,50,200]); }

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
  createOnlineIndicator();
  updateOnlineStatus();
  initPWAInstall();
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});