/* AG Tracker Service Worker */
const CACHE_VERSION = 'v1.0.0'; // bump this when you change files
const CACHE_NAME = `agtracker-${CACHE_VERSION}`;

// List every file you want available offline
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : null)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for same-origin; network-first fallback if needed.
// Ensure SPA navigation works offline by serving cached index.html.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Handle navigations (address bar, link clicks) -> return cached shell
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(resp => resp || fetch(req))
    );
    return;
  }

  // Only handle same-origin requests for caching
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(networkResp => {
          // Optionally cache new same-origin files (good for icons/manifest/etc.)
          const copy = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return networkResp;
        }).catch(() => cached); // last resort use whatever we had
      })
    );
  }
});
