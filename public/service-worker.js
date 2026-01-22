const CACHE_NAME = 'one-more-bite-v3';
const SHELL_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/icon-192.png',
    '/assets/icon-512.png'
];

// Install Event - Cache App Shell
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(SHELL_ASSETS).catch(err => {
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

// Fetch Event - Stale-while-revalidate for assets, Network-first for API
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // API or Realtime requests -> Network Only
    if (url.hostname.includes('supabase') ||
        url.pathname.includes('/rest/v1/') ||
        url.pathname.includes('/auth/v1/') ||
        url.pathname.includes('realtime')) {
        return;
    }

    // Navigation requests (HTML) -> Network First, fall back to cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    // Static Assets (JS, CSS, Images) -> Cache First (Stale-while-revalidate)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Return cached response if network fails
                return cachedResponse;
            });

            return cachedResponse || fetchPromise;
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
