// BC3 Manager Service Worker v1.1
const CACHE = 'bc3-v2';
const PRECACHE = [
  'https://mmunozdominguez.github.io/bc3manager/',
  'https://mmunozdominguez.github.io/bc3manager/index.html',
  'https://mmunozdominguez.github.io/bc3manager/manifest.json',
  'https://mmunozdominguez.github.io/bc3manager/icon-192.png',
  'https://mmunozdominguez.github.io/bc3manager/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(PRECACHE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
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
  if (url.includes('cdn.jsdelivr.net') || url.includes('unpkg.com')) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(resp => {
            if (resp.ok) cache.put(e.request, resp.clone());
            return resp;
          }).catch(() => cached);
        })
      )
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(resp => {
        if (resp.ok && e.request.method === 'GET')
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        return resp;
      })
    )
  );
});
