/* ═══════════════════════════════════════════════════════════════
   STALLHART DESTANI — Progressive Web App Service Worker (sw.js)
   ---------------------------------------------------------------
   Çevrimdışı okuma, hızlı önbellek ve kesintisiz roman deneyimi.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const CACHE_NAME = 'stallhart-v8';
const MAX_CACHE_ENTRIES = 60;

// Önbellek üst sınırı koruması (Cache Eviction / FIFO)
async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const toDelete = keys.length - maxItems;
      for (let i = 0; i < toDelete; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (e) {
    console.warn('[PWA SW] Cache trim error:', e);
  }
}

// Büyük harita görselleri (önbelleğe alınmaz, doğrudan ağdan çekilir)
function isLargeImage(pathname) {
  const p = pathname.toLowerCase();
  return p.includes('siyasi_harita') || p.includes('/maps/') || p.includes('harita00');
}
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/oku.html',
  '/bolumler.html',
  '/karakterler.html',
  '/haneler.html',
  '/lore.html',
  '/olay-detay.html',
  '/harita.html',
  '/sozler.html',
  '/hiyerarsi.html',
  '/forum.html',
  '/forum-kategori.html',
  '/forum-konu.html',
  '/assets/css/styles.css',
  '/assets/css/styles.css?v=3.2',
  '/assets/css/kurultay.css',
  '/assets/css/community.css',
  '/assets/css/harita.css',
  '/assets/js/router.js',
  '/assets/js/router.js?v=3.2',
  '/assets/js/config.js',
  '/assets/js/patches.js',
  '/assets/js/patches.js?v=3.1',
  '/assets/js/wiki.js',
  '/assets/js/wiki.js?v=3.1',
  '/assets/js/community.js',
  '/assets/js/community.js?v=3.1',
  '/assets/js/community-divan.js',
  '/assets/js/kurultay.js',
  '/assets/js/kurultay.js?v=3.1',
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

  // Büyük harita görsellerini önbelleğe alma — doğrudan ağdan sun (hafıza taşmasını önler)
  if (isLargeImage(url.pathname)) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Statik Varlıklar (CSS, JS, Görseller): Stale-While-Revalidate (sürüm parametrelerini dikkate alır)
  event.respondWith(
    caches.match(req).then(cachedResponse => {
      const fetchPromise = fetch(req).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(async cache => {
            await cache.put(req, responseToCache);
            limitCacheSize(CACHE_NAME, MAX_CACHE_ENTRIES);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
