// BC3 Manager Service Worker v8
const CACHE = 'bc3-v12';

self.addEventListener('install', e => {
  // Activar inmediatamente sin esperar a que se cierren pestañas
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  // Tomar control de todos los clientes al activar
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Solo cachear recursos del mismo origen (no CDNs externos)
  if (url.origin !== location.origin) return;
  
  // index.html y sw.js: siempre network-first para ver actualizaciones
  if (url.pathname.endsWith('/') || 
      url.pathname.endsWith('index.html') || 
      url.pathname.endsWith('sw.js')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  
  // Resto: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
