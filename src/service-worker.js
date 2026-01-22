const CACHE_NAME = 'one-more-bite-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/css_updates.css',
    '/js/app.js',
    '/js/mobile.js',
    '/js/api.js',
    '/js/auth.js',
    '/js/state.js',
    '/js/utils.js',
    '/js/ui/student.js',
    '/js/ui/admin.js',
    '/manifest.json',
    '/assets/icon-192.png',
    '/assets/icon-512.png'
];

// Install Event - Cache Assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.warn('[ServiceWorker] Some assets failed to cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate Event - Cleanup Old Caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
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

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // API or Realtime requests -> Network Only
    if (url.hostname.includes('supabase') ||
        url.pathname.includes('/rest/v1/') ||
        url.pathname.includes('/auth/v1/') ||
        url.pathname.includes('realtime')) {
        return; // Let browser handle it (Network only)
    }

    // Navigation requests -> Network First, fall back to cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone and cache the response
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Offline - return cached index.html
                    return caches.match('/index.html');
                })
        );
        return;
    }

    // Assets -> Cache First, fall back to Network
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }

            return fetch(event.request).then(fetchResponse => {
                // Don't cache if not successful
                if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type === 'opaque') {
                    return fetchResponse;
                }

                // Clone and cache for future
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return fetchResponse;
            });
        })
    );
});

// Handle offline sync (for future enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cart') {
        console.log('[ServiceWorker] Background sync triggered');
        // Could sync draft cart items when back online
    }
});

// Handle push notifications (for future enhancement)
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received');
    const data = event.data ? event.data.json() : {};
    const options = {
        body: data.body || 'Your order is ready!',
        icon: '/assets/icon-192.png',
        badge: '/assets/icon-192.png',
        vibrate: [200, 100, 200],
        data: data
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'One More Bite', options)
    );
});
