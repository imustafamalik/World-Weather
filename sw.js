/**
 * World Weather & Elevation Explorer - Service Worker
 * Caches core app shell for offline loading and handles offline fallbacks
 */

const CACHE_NAME = 'world-weather-shell-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './strings.js',
  './manifest.json',
  './icons/icon.svg'
];

// Install Event: Cache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('PWA Pre-caching notice:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean Out Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-while-revalidate for local assets, network-first for external APIs
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle local app shell files
  if (requestUrl.origin === location.origin) {
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
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
