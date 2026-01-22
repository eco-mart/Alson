const CACHE_NAME = 'one-more-bite-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/css_updates.css',
    '/manifest.json',
    '/assets/icon-192.png',
    '/assets/icon-512.png'
    // Scripts will be added as we modularize
];

// Install Event - Cache Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event - Cleanup Old Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Network First for API, Cache First for Assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API or Realtime requests -> Network Only (or Network First)
    if (url.pathname.includes('/rest/v1/') || url.pathname.includes('realtime')) {
        return; // Let browser handle it (Network only)
    }

    // Navigation to root -> Network First, fall back to cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match('./index.html');
                })
        );
        return;
    }

    // Assets -> Cache First, fall back to Network
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
