// RedTime Service Worker
// 策略：HTML 用 network-first，靜態資源用 cache-first
// 更新版本號即可清除舊快取

const CACHE_NAME = 'redtime-v1';

// 預快取核心資源（install 時立即下載）
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

  // HTML 頁面：network-first，確保使用者看到最新版本
  if (event.request.mode === 'navigate' ||
      event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 其他靜態資源（字體、JS、CSS、GLB、圖片）：cache-first
  // 完全繞過 GitHub Pages max-age=600 限制
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // 只快取同源且成功的回應
        if (response.ok && url.origin === location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
