/* AG Tracker Service Worker */
const CACHE_VERSION = 'v1.0.1'; // bump when you change files
const CACHE_NAME = `agtracker-${CACHE_VERSION}`;

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
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// Serve index.html for navigations; cache-first for same-origin assets.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // SPA navigations
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(resp => resp || fetch(req))
    );
    return;
  }

  // Only cache same-origin requests
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(net => {
          const copy = net.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
          return net;
        });
      })
    );
  }
});
