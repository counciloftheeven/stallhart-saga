/* ═══════════════════════════════════════════════════════════════
   STALLHART DESTANI — Progressive Web App Service Worker (sw.js)
   ---------------------------------------------------------------
   Çevrimdışı okuma, hızlı önbellek ve kesintisiz roman deneyimi.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const CACHE_NAME = 'stallhart-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/oku.html',
  '/bolumler.html',
  '/karakterler.html',
  '/haneler.html',
  '/lore.html',
  '/harita.html',
  '/sozler.html',
  '/assets/css/styles.css?v=3.0',
  '/assets/js/router.js?v=3.0',
  '/assets/js/config.js?v=3.0',
  '/assets/js/patches.js?v=3.0',
  '/assets/js/wiki.js?v=3.0',
  '/assets/js/community.js?v=3.0',
  '/assets/js/community-divan.js',
  '/assets/js/travel-calc.js',
  '/data/book.json',
  '/data/chapters.json',
  '/data/characters.json',
  '/data/houses.json',
  '/data/kingdoms.json',
  '/data/geography.json',
  '/data/lore.json',
  '/data/quotes.json',
  '/data/language.json',
  '/assets/images/logo-stallhart.png',
  '/assets/css/community.css',
  '/assets/css/harita.css',
  '/manifest.json',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[PWA SW] Precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Supabase ve harici API isteklerini doğrudan ağa bırak
  if (url.origin.includes('supabase.co')) {
    return;
  }

  // HTML Sayfaları: Network First (Ağ varsa tazele, yoksa önbellekten sun)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(req).then(cached => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // Statik Varlıklar (CSS, JS, JSON, Görseller): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then(cachedResponse => {
      const fetchPromise = fetch(req).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, responseToCache));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
