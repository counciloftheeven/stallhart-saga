/* ═══════════════════════════════════════════════════════════════
   STALLHART DESTANI — Progressive Web App Service Worker (sw.js)
   ---------------------------------------------------------------
   Çevrimdışı okuma, hızlı önbellek ve kesintisiz roman deneyimi.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const CACHE_NAME = 'stallhart-v3';
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
  '/hiyerarsi.html',
  '/forum.html',
  '/forum-kategori.html',
  '/forum-konu.html',
  '/assets/css/styles.css',
  '/assets/css/styles.css?v=3.0',
  '/assets/css/kurultay.css',
  '/assets/css/kurultay.css?v=3.0',
  '/assets/css/community.css',
  '/assets/css/community.css?v=3.0',
  '/assets/css/harita.css',
  '/assets/css/harita.css?v=3.0',
  '/assets/js/router.js',
  '/assets/js/router.js?v=3.0',
  '/assets/js/config.js',
  '/assets/js/config.js?v=3.0',
  '/assets/js/patches.js',
  '/assets/js/patches.js?v=3.0',
  '/assets/js/wiki.js',
  '/assets/js/wiki.js?v=3.0',
  '/assets/js/community.js',
  '/assets/js/community.js?v=3.0',
  '/assets/js/community-divan.js',
  '/assets/js/kurultay.js',
  '/assets/js/kurultay.js?v=3.0',
  '/assets/js/travel-calc.js',
  '/data/book.json',
  '/data/chapters.json',
  '/data/characters.json',
  '/data/houses.json',
  '/data/kingdoms.json',
  '/data/geography.json',
  '/data/lore.json',
  '/data/quotes.json',
  '/data/hierarchy.json',
  '/data/language.json',
  '/assets/images/logo-stallhart.png',
  '/assets/images/logo-stallhart-240w.webp',
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

  // Kitap ve Evren Verileri (/data/*.json): Cache First + Arka Planda Güncelle (Tam Çevrimdışı Okuma)
  if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(cached => {
        const fetchPromise = fetch(req).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return networkResponse;
        }).catch(() => null);

        return cached || fetchPromise || caches.match('/data/chapters.json');
      })
    );
    return;
  }

  // HTML Sayfaları: Network First, Çevrimdışında Önbellekten Sun
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
          return caches.match(req, { ignoreSearch: true }).then(cached => cached || caches.match('/oku.html') || caches.match('/index.html'));
        })
    );
    return;
  }

  // Statik Varlıklar (CSS, JS, Görseller): Stale-While-Revalidate
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cachedResponse => {
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
