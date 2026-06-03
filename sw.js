// BC3 Manager Service Worker v1.2
const CACHE = 'bc3-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Skip non-GET and browser-extension requests
  if (e.request.method !== 'GET') return;
  if (!url.startsWith('http')) return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(resp => {
          if (resp.ok) cache.put(e.request, resp.clone());
          return resp;
        }).catch(() => cached);
        // For CDN requests serve cache immediately if available
        if (url.includes('cdn.jsdelivr.net') || url.includes('unpkg.com')) {
          return cached || fetchPromise;
        }
        return fetchPromise || cached;
      })
    )
  );
});
