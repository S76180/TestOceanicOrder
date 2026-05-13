/* ============================================
   ICONMIC - Service Worker (PWA)
   ============================================ */

const CACHE_NAME = 'iconmic-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/library.html',
  '/reader.html',
  '/scanner.html',
  '/profile.html',
  '/css/common.css',
  '/css/index.css',
  '/css/auth.css',
  '/css/library.css',
  '/css/reader.css',
  '/css/scanner.css',
  '/css/profile.css',
  '/js/supabase-config.js',
  '/js/app.js',
  '/js/auth.js',
  '/js/index.js',
  '/js/library.js',
  '/js/reader.js',
  '/js/scanner.js',
  '/js/profile.js',
  '/manifest.json'
];

/* ---------- Install ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

/* ---------- Activate ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

/* ---------- Fetch ---------- */
self.addEventListener('fetch', (event) => {
  // Skip non-GET and external API requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase')) return;
  if (event.request.url.includes('cdn.jsdelivr.net')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache but also update in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});

        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
