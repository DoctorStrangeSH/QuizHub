const CACHE_NAME = 'quizhub-v5';
const SCOPE = new URL(self.registration.scope);
const scoped = (path) => new URL(path, SCOPE).href;
const CORE_ASSETS = [
    '', 'index.html', 'offline.html', 'manifest.json',
    'app/styles/themes.css', 'app/styles/main.css',
    'app/locales/ru.json', 'app/locales/en.json'
].map(scoped);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                // One missing optional asset must not prevent worker installation.
                await Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url)));
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((key) => key.startsWith('quizhub-') && key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Never intercept Firebase, third-party resources, or pages outside this PWA.
    if (request.method !== 'GET' || url.origin !== SCOPE.origin ||
        !url.pathname.startsWith(SCOPE.pathname)) return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        event.waitUntil(caches.open(CACHE_NAME)
                            .then((cache) => cache.put(scoped('index.html'), copy)));
                    }
                    return response;
                })
                .catch(async () => (await caches.match(request)) ||
                    (await caches.match(scoped('index.html'))) ||
                    (await caches.match(scoped('offline.html'))) ||
                    Response.error())
        );
        return;
    }

    // App code, styles and translations must refresh after each release.
    // Keep the last working version for genuine offline use.
    const isApplicationAsset = /\.(?:js|css|json)$/.test(url.pathname);
    if (isApplicationAsset) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok && response.type === 'basic') {
                        const copy = response.clone();
                        event.waitUntil(caches.open(CACHE_NAME)
                            .then((cache) => cache.put(request, copy)));
                    }
                    return response;
                })
                .catch(async () => (await caches.match(request)) || Response.error())
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(async (cached) => {
            if (cached) return cached;
            const response = await fetch(request);
            if (response.ok && response.type === 'basic') {
                const copy = response.clone();
                event.waitUntil(caches.open(CACHE_NAME)
                    .then((cache) => cache.put(request, copy)));
            }
            return response;
        })
    );
});
