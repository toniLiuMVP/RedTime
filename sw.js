// RedTime Service Worker
// 兩層 cache 設計(2026-05-09 round-15+ 升級):
//   STATIC_CACHE  — 大型不變 asset(GLB / vendor JS / fonts / pwa icon)。
//                   只在 STATIC_VERSION 升版時 invalidate(GLB 不會每次 sw 改就重下)。
//   RUNTIME_CACHE — html / 動態 JS / data.js。每次 sw 改 RUNTIME_VERSION 就 invalidate。
// 策略:STATIC 大型資產 cache-first / RUNTIME(html 等)network-first。

// — Cache version 分離 —
// 升 STATIC_VERSION 才會重下 GLB / vendor(僅在 vendor 升版或 GLB 換新時)
const STATIC_VERSION = 'static-v20-20260622';  // bump: 22 prop GLBs re-baked with weathered textures — overwrite cached originals (cache-first won't refetch without a key bump)
// 升 RUNTIME_VERSION 重下 html / data.js / app.js(每次 source 變動)
const RUNTIME_VERSION = 'runtime-v157-20260622';   // bump every deploy that changes html/js/css; auto-reload then delivers the fix to clients still on the prior worker

const STATIC_CACHE = `redtime-${STATIC_VERSION}`;
const RUNTIME_CACHE = `redtime-${RUNTIME_VERSION}`;
const ALL_CURRENT_CACHES = new Set([STATIC_CACHE, RUNTIME_CACHE]);

// — 大型不變 asset:STATIC_CACHE —
const STATIC_PRECACHE_URLS = [
  // 月台奔跑共用 three.module(單一副本,platform-run 使用)
  '/RedTime/demos/_vendor/three.module.js',
  // 共用 assets
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
  '/RedTime/manifest.json',
  // 三個公開遊戲入口(LM402 / 月台 / 天堂路)— 都要離線可用
  '/RedTime/lm402.html',
  '/RedTime/demos/platform-run/index.html',
  '/RedTime/demos/695/tiantanglu-3d/index.html',
];

// — 路徑分流規則 —
// 大型靜態資源(GLB / vendor / fonts / images)→ STATIC_CACHE
// 其他(html / data.js / app.js / css)→ RUNTIME_CACHE
function isStaticAsset(url) {
  return /\.(glb|woff2?|ttf|otf|png|jpg|jpeg|svg|ico)$/i.test(url) ||
         url.includes('/vendor-three') ||
         url.includes('/_vendor/') ||
         url.includes('/GLTFLoader') ||
         url.includes('/three.core') ||
         url.includes('/babylon');   // Babylon UMD 8MB → STATIC cache（on-demand,僅 ?webgpu=1 抓）
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

// 安全紀律:cache allowlist — 只 cache 已知 file type 或 html(避免 cache 異常 path)
function isCacheable(pathname) {
  if (pathname === '/' || pathname.endsWith('/') || pathname.endsWith('.html')) return true;
  return /\.(js|mjs|css|glb|woff2?|ttf|otf|png|jpg|jpeg|svg|ico|wasm|json|mp3|m4a|ogg|wav)$/i.test(pathname);
}

self.addEventListener('fetch', event => {
  const { request } = event;

  // 安全紀律 1:只 cache GET(POST/PUT/DELETE 等不 cache,直接 passthrough)
  if (request.method !== 'GET') return;

  // 安全紀律 2:只處理 http(s)(skip chrome-extension:// / data: / blob:)
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // 安全紀律 3:只 cache 同 origin(跨 origin response 不入 cache,避免 cache poisoning)
  if (url.origin !== location.origin) return;

  // 安全紀律 4:path allowlist(只 cache 已知 file type / html,避免異常 path 入 cache)
  if (!isCacheable(url.pathname)) return;

  // STATIC 大型不變資產(GLB / vendor / fonts / images):cache-first
  // 回訪瞬命中、省頻寬;靠 STATIC_VERSION bump + activate 清舊版做 invalidation。
  // (前提:sw.js 本身不可被強快取,GitHub Pages 預設 max-age 短 + 瀏覽器 24h 強制檢查兜底)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE)
              .then(cache => cache.put(request, clone))
              .then(() => trimCache(STATIC_CACHE, MAX_STATIC_ITEMS))
              .catch(err => { console.warn('[sw] static cache.put failed:', url.pathname, err && err.message); });
          }
          return response;
        });
      })
    );
    return;
  }

  // 其餘(html / 動態 JS / data.js / css):network-first(有網路拿最新,離線回退快取)
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE)
            .then(cache => cache.put(request, clone))
            .then(() => trimCache(RUNTIME_CACHE, MAX_RUNTIME_ITEMS))
            .catch(err => {
              // cache.put 失敗(quota exceeded / Range response 等)— 不影響 main response delivery
              console.warn('[sw] cache.put failed:', url.pathname, err && err.message);
            });
        }
        return response;
      })
      .catch(() => caches.match(request))    // match() 自動跨所有 cache 找
  );
});
