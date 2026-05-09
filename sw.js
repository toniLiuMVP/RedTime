// RedTime Service Worker
// 兩層 cache 設計(2026-05-09 round-15+ 升級):
//   STATIC_CACHE  — 大型不變 asset(GLB / vendor JS / fonts / pwa icon)。
//                   只在 STATIC_VERSION 升版時 invalidate(GLB 不會每次 sw 改就重下)。
//   RUNTIME_CACHE — html / 動態 JS / data.js。每次 sw 改 RUNTIME_VERSION 就 invalidate。
// 策略:network-first(有網路永遠拿最新,離線才用快取)。

// — Cache version 分離 —
// 升 STATIC_VERSION 才會重下 GLB / vendor(僅在 vendor 升版或 GLB 換新時)
const STATIC_VERSION = 'static-v1-20260509';
// 升 RUNTIME_VERSION 重下 html / data.js / app.js(每次 source 變動)
const RUNTIME_VERSION = 'runtime-v1-20260509';

const STATIC_CACHE = `redtime-${STATIC_VERSION}`;
const RUNTIME_CACHE = `redtime-${RUNTIME_VERSION}`;
const ALL_CURRENT_CACHES = new Set([STATIC_CACHE, RUNTIME_CACHE]);

// — 大型不變 asset:STATIC_CACHE —
const STATIC_PRECACHE_URLS = [
  '/RedTime/assets/lm402/vendor-three.module.js',
  '/RedTime/assets/lm402/GLTFLoader.js',
  '/RedTime/assets/lm402/DRACOLoader.js',
  '/RedTime/assets/lm402/draco/draco_decoder.wasm',
  '/RedTime/assets/lm402/draco/draco_wasm_wrapper.js',
  '/RedTime/assets/lm402/characters/junior/exports/junior_2005_hero_closeup.glb',
  '/RedTime/assets/lm402/characters/junior/exports/junior_2005_runtime.glb',
  '/RedTime/assets/lm402/characters/junior/exports/junior_2005_runtime_mobile.glb',
  '/RedTime/fonts/fonts.css',
  '/RedTime/assets/og-image.jpg',
  '/RedTime/assets/pwa-icon-192.png',
  '/RedTime/assets/pwa-icon-512.png',
  '/RedTime/favicon.svg',
];

// — 動態 / 易變 asset:RUNTIME_CACHE —
const RUNTIME_PRECACHE_URLS = [
  '/RedTime/',
  '/RedTime/index.html',
  '/RedTime/reader.html',
  '/RedTime/lm402.html',
  '/RedTime/assets/lm402/lm402.css',
  '/RedTime/assets/lm402/app.js',
  '/RedTime/assets/lm402/renderer.js',
  '/RedTime/assets/lm402/data.js',
  '/RedTime/assets/lm402/ui-panels.js',
];

// — 路徑分流規則 —
// 大型靜態資源(GLB / vendor / fonts / images)→ STATIC_CACHE
// 其他(html / data.js / app.js / css)→ RUNTIME_CACHE
function isStaticAsset(url) {
  return /\.(glb|woff2?|ttf|otf|png|jpg|jpeg|svg|ico)$/i.test(url) ||
         url.includes('/vendor-three') ||
         url.includes('/GLTFLoader') ||
         url.includes('/three.core');
}

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_PRECACHE_URLS)),
      caches.open(RUNTIME_CACHE).then(cache => cache.addAll(RUNTIME_PRECACHE_URLS)),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => !ALL_CURRENT_CACHES.has(k)).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// 各 cache 上限(防 trim 雙層分開)
const MAX_STATIC_ITEMS = 60;     // GLB / vendor / fonts / images:不容易長
const MAX_RUNTIME_ITEMS = 80;    // html / dynamic JS:常變動

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await Promise.all(keys.slice(0, keys.length - maxItems).map(k => cache.delete(k)));
  }
}

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;
  const url = new URL(event.request.url);

  // 全部 network-first(有網路拿最新,離線回退快取)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && url.origin === location.origin) {
          const clone = response.clone();
          // 分流寫進對應 cache
          const targetCache = isStaticAsset(url.pathname) ? STATIC_CACHE : RUNTIME_CACHE;
          const targetMax = isStaticAsset(url.pathname) ? MAX_STATIC_ITEMS : MAX_RUNTIME_ITEMS;
          caches.open(targetCache).then(cache => {
            cache.put(event.request, clone);
            trimCache(targetCache, targetMax);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))    // match() 自動跨所有 cache 找
  );
});
