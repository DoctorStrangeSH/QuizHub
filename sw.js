// ============================================
// QuizHub — Service Worker (PWA)
// ============================================

const CACHE_NAME = 'quizhub-v1';
const ASSETS = [
  '/QuizHub/',
  '/QuizHub/index.html',
  '/QuizHub/style.css',
  '/QuizHub/manifest.json',
  '/QuizHub/js/firebase-config.js',
  '/QuizHub/js/sounds.js',
  '/QuizHub/js/ui.js',
  '/QuizHub/js/auth.js',
  '/QuizHub/js/quiz.js',
  '/QuizHub/js/api.js',
  '/QuizHub/js/achievements.js',
  '/QuizHub/assets/favicon.svg',
  '/QuizHub/assets/icon-192.png',
  '/QuizHub/assets/icon-512.png'
];

// Установка: кэшируем статические файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Активация: удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов: кэш first, потом сеть
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});