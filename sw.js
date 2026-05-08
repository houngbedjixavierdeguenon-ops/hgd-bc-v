const CACHE = 'hgd-bc-v2';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  self.clients.claim();
  // Nettoyer les anciens caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Ne pas intercepter Firebase, Google Fonts, etc.
  const url = e.request.url;
  if (
    url.includes('firebasejs') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('firebaseio') ||
    url.includes('firestore')
  ) {
    return; // laisser passer normalement
  }

  // Pour les ressources locales : cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        // Mettre en cache les ressources statiques
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => new Response('', { status: 503 }))
  );
});
