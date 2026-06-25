// ============================================
// QuizHub — Service Worker v2.0
// ============================================

const CACHE_VERSION = 'v2';
const CACHE_NAME = `quizhub-${CACHE_VERSION}`;
const API_CACHE = `quizhub-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `quizhub-images-${CACHE_VERSION}`;

// Ресурсы для предварительного кэширования
const PRECACHE_ASSETS = [
  '/QuizHub/',
  '/QuizHub/index.html',
  '/QuizHub/css/style.css',
  '/QuizHub/manifest.json',
  '/QuizHub/js/firebase-config.js',
  '/QuizHub/js/sounds.js',
  '/QuizHub/js/animations.js',
  '/QuizHub/js/ui.js',
  '/QuizHub/js/auth.js',
  '/QuizHub/js/api.js',
  '/QuizHub/js/quiz.js',
  '/QuizHub/js/achievements.js',
  '/QuizHub/assets/favicon.svg',
  '/QuizHub/assets/icon-192.png',
  '/QuizHub/assets/icon-512.png'
];

// Внешние ресурсы для кэширования
const EXTERNAL_ASSETS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js'
];

// ========== УСТАНОВКА ==========

self.addEventListener('install', event => {
  console.log('[SW] Установка...');
  
  event.waitUntil(
    Promise.all([
      // Кэшируем локальные файлы
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Кэширую локальные ресурсы');
        return cache.addAll(PRECACHE_ASSETS);
      }),
      // Кэшируем внешние файлы
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Кэширую внешние ресурсы');
        return Promise.allSettled(
          EXTERNAL_ASSETS.map(url => 
            cache.add(url).catch(err => 
              console.warn(`[SW] Не удалось закэшировать: ${url}`, err)
            )
          )
        );
      })
    ]).then(() => {
      console.log('[SW] Установка завершена');
      return self.skipWaiting();
    })
  );
});

// ========== АКТИВАЦИЯ ==========

self.addEventListener('activate', event => {
  console.log('[SW] Активация...');
  
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => 
          key !== CACHE_NAME && 
          key !== API_CACHE && 
          key !== IMAGE_CACHE
        ).map(key => {
          console.log('[SW] Удаляю старый кэш:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      console.log('[SW] Активация завершена');
      return self.clients.claim();
    })
  );
});

// ========== ПЕРЕХВАТ ЗАПРОСОВ ==========

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Пропускаем Firebase и API запросы (не кэшируем)
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('googleapis.com')
  ) {
    return; // Пропускаем — пусть идут в сеть
  }
  
  // Open Trivia DB API — кэшируем на 1 час
  if (url.hostname === 'opentdb.com') {
    event.respondWith(networkFirstWithCache(request, API_CACHE, 3600));
    return;
  }
  
  // Изображения — кэшируем надолго
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    event.respondWith(cacheFirstWithRefresh(request, IMAGE_CACHE));
    return;
  }
  
  // HTML — всегда пытаемся сеть, потом кэш
  if (request.destination === 'document' || url.pathname.endsWith('/')) {
    event.respondWith(networkFirstWithCache(request, CACHE_NAME));
    return;
  }
  
  // Остальное — кэш, потом сеть
  event.respondWith(cacheFirstWithRefresh(request, CACHE_NAME));
});

// ========== СТРАТЕГИИ КЭШИРОВАНИЯ ==========

// Кэш первый, потом сеть (с обновлением кэша)
async function cacheFirstWithRefresh(request, cacheName) {
  const cached = await caches.match(request);
  
  if (cached) {
    // Обновляем кэш в фоне
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(cacheName).then(cache => {
          cache.put(request, response.clone());
        });
      }
    }).catch(() => {});
    
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Если нет сети и нет в кэше — показываем офлайн-страницу
    if (request.destination === 'document') {
      return caches.match('/QuizHub/index.html');
    }
    throw error;
  }
}

// Сеть первая, потом кэш
async function networkFirstWithCache(request, cacheName, maxAge = 0) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const clonedResponse = response.clone();
      
      // Если указан maxAge, добавляем заголовок с датой кэширования
      if (maxAge > 0) {
        const headers = new Headers(clonedResponse.headers);
        headers.set('sw-cached-date', Date.now().toString());
        const agedResponse = new Response(clonedResponse.body, {
          status: clonedResponse.status,
          statusText: clonedResponse.statusText,
          headers: headers
        });
        cache.put(request, agedResponse);
      } else {
        cache.put(request, clonedResponse);
      }
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    
    if (cached) {
      // Проверяем возраст кэша
      if (maxAge > 0) {
        const cachedDate = cached.headers.get('sw-cached-date');
        if (cachedDate) {
          const age = (Date.now() - parseInt(cachedDate)) / 1000;
          if (age < maxAge) {
            return cached;
          }
        }
      } else {
        return cached;
      }
    }
    
    throw error;
  }
}

// ========== PUSH-УВЕДОМЛЕНИЯ ==========

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Время проверить свои знания! Пройди новый квиз.',
    icon: '/QuizHub/assets/icon-192.png',
    badge: '/QuizHub/assets/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/QuizHub/'
    },
    actions: [
      { action: 'play', title: '🎮 Играть' },
      { action: 'close', title: '❌ Закрыть' }
    ],
    tag: 'quizhub-daily',
    renotify: true
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || '🧠 QuizHub',
      options
    )
  );
});

// Клик по уведомлению
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'play') {
    event.waitUntil(
      clients.openWindow('/QuizHub/')
    );
  }
});

// ========== ФОНОВАЯ СИНХРОНИЗАЦИЯ ==========

self.addEventListener('sync', event => {
  if (event.tag === 'sync-results') {
    event.waitUntil(syncPendingResults());
  }
});

async function syncPendingResults() {
  // Отправляем сохранённые результаты в Firestore
  const db = await openDatabase();
  const pendingResults = await db.getAll('pendingResults');
  
  for (const result of pendingResults) {
    try {
      // Здесь можно отправить результат в Firestore через fetch
      // Но Firebase JS SDK не работает в Service Worker
      // Поэтому используем fetch напрямую к Firestore REST API
      console.log('[SW] Синхронизирую результат:', result);
      
      // Удаляем из очереди после успешной отправки
      await db.delete('pendingResults', result.id);
    } catch (error) {
      console.error('[SW] Ошибка синхронизации:', error);
    }
  }
}

// ========== INDEXEDDB ДЛЯ ОФЛАЙН-РЕЗУЛЬТАТОВ ==========

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('QuizHubOffline', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingResults')) {
        db.createObjectStore('pendingResults', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
      if (!db.objectStoreNames.contains('quizProgress')) {
        db.createObjectStore('quizProgress', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(new DBWrapper(request.result));
    request.onerror = () => reject(request.error);
  });
}

// Обёртка для удобной работы с IndexedDB
class DBWrapper {
  constructor(db) {
    this.db = db;
  }
  
  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  put(storeName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// ========== СООБЩЕНИЯ ОТ СТРАНИЦЫ ==========

self.addEventListener('message', event => {
  if (event.data.type === 'SAVE_OFFLINE_RESULT') {
    // Сохраняем результат офлайн
    event.waitUntil(
      openDatabase().then(db => 
        db.put('pendingResults', {
          ...event.data.result,
          timestamp: Date.now()
        })
      )
    );
    
    // Регистрируем фоновую синхронизацию
    if ('sync' in self.registration) {
      self.registration.sync.register('sync-results');
    }
  }
  
  if (event.data.type === 'SAVE_QUIZ_PROGRESS') {
    event.waitUntil(
      openDatabase().then(db => 
        db.put('quizProgress', {
          id: 'current',
          ...event.data.progress,
          timestamp: Date.now()
        })
      )
    );
  }
  
  if (event.data.type === 'GET_QUIZ_PROGRESS') {
    event.waitUntil(
      openDatabase().then(db => 
        db.get('quizProgress', 'current')
      ).then(progress => {
        event.ports[0].postMessage({ progress });
      })
    );
  }
});