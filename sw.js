const CACHE_NAME = 'quiz-empire-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/app/styles/themes.css',
    '/app/styles/main.css',
    '/app/modules/auth/auth.css',
    '/app/modules/profile/profile.css',
    '/app/modules/dashboard/dashboard.css',
    '/app/modules/friends/friends.css',
    '/app/modules/quiz/quiz.css',
    '/app/modules/leaderboard/leaderboard.css',
    '/app/modules/achievements/achievements.css',
    '/app/modules/shop/shop.css',
    '/app/modules/chat/chat.css',
    '/app/modules/events/events.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css'
];

// Установка
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Активация
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => 
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Стратегия: Network First, fallback to cache
self.addEventListener('fetch', (event) => {
    // Пропускаем Firebase запросы
    if (event.request.url.includes('firestore') || 
        event.request.url.includes('googleapis') ||
        event.request.url.includes('gstatic')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Кешируем успешные ответы
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Оффлайн — отдаём кеш или оффлайн-страницу
                return caches.match(event.request)
                    .then(cached => cached || caches.match('/offline.html'));
            })
    );
});