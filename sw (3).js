// ── HGD BC — Service Worker v2 (mise à jour automatique) ──
// Changer ce numéro à chaque déploiement force la mise à jour chez tous les utilisateurs
const CACHE_VERSION = 'hgd-bc-v2-20260508';
const ASSETS = ['./', './index.html'];

// Installation : mettre en cache les assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      // Prendre le contrôle immédiatement sans attendre
      return self.skipWaiting();
    })
  );
});

// Activation : supprimer les anciens caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_VERSION; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim(); // Prendre contrôle de tous les onglets
    })
  );
});

// Fetch : Network First (toujours essayer le réseau d'abord pour avoir le dernier contenu)
self.addEventListener('fetch', function(e) {
  // Ne pas intercepter les requêtes Firebase ou externes
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      // Mettre en cache la réponse fraîche
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Fallback vers le cache si hors ligne
      return caches.match(e.request);
    })
  );
});

// Recevoir l'ordre de skipWaiting depuis la page
self.addEventListener('message', function(e) {
  if (e.data && e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
