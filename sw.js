// RedTime Service Worker
// 策略：全部 network-first（有網路永遠拿最新，離線才用快取）

const CACHE_NAME = 'redtime-20260410101040';

// 預快取核心資源（install 時立即下載，供離線使用）
const PRECACHE_URLS = [
  '/RedTime/',
  '/RedTime/index.html',
  '/RedTime/reader.html',
  '/RedTime/lm402.html',
  '/RedTime/fonts/fonts.css',
  '/RedTime/assets/lm402/lm402.css',
  '/RedTime/assets/lm402/app.js',
  '/RedTime/assets/lm402/renderer.js',
  '/RedTime/assets/lm402/data.js',
  '/RedTime/assets/lm402/vendor-three.module.js',
  '/RedTime/assets/lm402/GLTFLoader.js',
  '/RedTime/assets/lm402/ui-panels.js',
  '/RedTime/assets/lm402/characters/junior/exports/junior_2005_hero_closeup.glb',
  '/RedTime/assets/lm402/characters/junior/exports/junior_2005_runtime.glb',
  '/RedTime/assets/lm402/characters/junior/exports/junior_2005_runtime_mobile.glb',
  '/RedTime/assets/og-image.jpg',
  '/RedTime/assets/pwa-icon-192.png',
  '/RedTime/assets/pwa-icon-512.png',
  '/RedTime/favicon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 全部 network-first：有網路拿最新，離線回退快取
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && url.origin === location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
