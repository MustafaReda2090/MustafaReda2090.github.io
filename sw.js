/* Service worker — offline shell for the Resource Library.
 *
 * The whole dataset is inlined in index.html, so caching the shell is
 * genuinely all it takes to work offline. Sync traffic must never be
 * cached: a stale PUT response would resurrect marks you deleted.
 *
 * Bump CACHE whenever index.html changes, or browsers will keep serving
 * the old copy from the cache-first rule below.
 */
const CACHE = 'reslib-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll fails the whole install if any single file 404s, which is
      // easy to hit on a subpath deploy — add them individually instead.
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;                 // never touch the sync PUT

  const url = new URL(req.url);
  if (url.pathname.includes('/api/')) return;       // sync is always live
  if (url.origin !== self.location.origin) return;  // let cross-origin through

  // Cache-first: the shell is static and the app must open with no network.
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) {
        // Refresh in the background so the next open gets any update.
        event.waitUntil(
          fetch(req)
            .then(res => res.ok && caches.open(CACHE).then(c => c.put(req, res.clone())))
            .catch(() => {})
        );
        return hit;
      }
      return fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));  // offline navigation fallback
    })
  );
});
