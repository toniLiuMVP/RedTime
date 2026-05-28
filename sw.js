// RedTime Service Worker
// 兩層 cache 設計(2026-05-09 round-15+ 升級):
//   STATIC_CACHE  — 大型不變 asset(GLB / vendor JS / fonts / pwa icon)。
//                   只在 STATIC_VERSION 升版時 invalidate(GLB 不會每次 sw 改就重下)。
//   RUNTIME_CACHE — html / 動態 JS / data.js。每次 sw 改 RUNTIME_VERSION 就 invalidate。
// 策略:network-first(有網路永遠拿最新,離線才用快取)。

// — Cache version 分離 —
// 升 STATIC_VERSION 才會重下 GLB / vendor(僅在 vendor 升版或 GLB 換新時)
const STATIC_VERSION = 'static-v15-20260606';  // unchanged: GLB / vendor 無變動
// 升 RUNTIME_VERSION 重下 html / data.js / app.js(每次 source 變動)
const RUNTIME_VERSION = 'runtime-v69-20260529';  // bumped: competition 6/7 chrome localized to zh-TW (codenames + telemetry kept)

const STATIC_CACHE = `redtime-${STATIC_VERSION}`;
const RUNTIME_CACHE = `redtime-${RUNTIME_VERSION}`;
const ALL_CURRENT_CACHES = new Set([STATIC_CACHE, RUNTIME_CACHE]);

// — 大型不變 asset:STATIC_CACHE —
const STATIC_PRECACHE_URLS = [
  // 正本 lm402(穩定)
  '/RedTime/assets/lm402/vendor-three.module.js',
  '/RedTime/assets/lm402/GLTFLoader.js',
  '/RedTime/assets/lm402/DRACOLoader.js',
  '/RedTime/assets/lm402/draco/draco_decoder.wasm',
  '/RedTime/assets/lm402/draco/draco_wasm_wrapper.js',
  '/RedTime/assets/lm402/characters/junior/exports/junior_2005_hero_closeup.glb',
  '/RedTime/assets/lm402/characters/junior/exports/junior_2005_runtime.glb',
  '/RedTime/assets/lm402/characters/junior/exports/junior_2005_runtime_mobile.glb',
  // 雙時空 lm402-twin(進化版,獨立 GLB 副本)
  '/RedTime/assets/lm402-twin/GLTFLoader.js',
  '/RedTime/assets/lm402-twin/DRACOLoader.js',
  '/RedTime/assets/lm402-twin/characters/junior/exports/junior_2005_hero_closeup.glb',
  '/RedTime/assets/lm402-twin/characters/junior/exports/junior_2005_runtime.glb',
  '/RedTime/assets/lm402-twin/characters/junior/exports/junior_2005_runtime_mobile.glb',
  // 平行世界 lm402-parallel(WebGPU 探索,獨立 GLB + WebGPU vendor)
  '/RedTime/assets/lm402-parallel/GLTFLoader.js',
  '/RedTime/assets/lm402-parallel/DRACOLoader.js',
  '/RedTime/assets/lm402-parallel/characters/junior/exports/junior_2005_hero_closeup.glb',
  '/RedTime/assets/lm402-parallel/characters/junior/exports/junior_2005_runtime.glb',
  '/RedTime/assets/lm402-parallel/characters/junior/exports/junior_2005_runtime_mobile.glb',
  // 月台奔跑雙時空(完整 offline:three vendor + 主題曲 mp3 + GLB 若有)
  '/RedTime/demos/platform-run-twin/three.module.js',
  '/RedTime/demos/platform-run-twin/把拔我會想你的.mp3',
  // 月台奔跑平行世界(r46 新增,共享 lm402-parallel WebGPU vendor)
  '/RedTime/demos/platform-run-parallel/three.module.js',
  '/RedTime/demos/platform-run-parallel/把拔我會想你的.mp3',
  '/RedTime/assets/lm402-parallel/vendor/three.webgpu.min.js',
  '/RedTime/assets/lm402-parallel/vendor/three.tsl.min.js',
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
  // 三線 LM402 入口 + 共用 landing
  '/RedTime/lm402.html',
  '/RedTime/lm402-time.html',
  '/RedTime/lm402-twin.html',
  '/RedTime/lm402-parallel.html',
  /* AI 3D 競賽 — 三選手作品(c1=Claude / c2=Codex / c3=Gemini) */
  '/RedTime/competition-1.html',
  '/RedTime/competition-2.html',
  '/RedTime/competition-3.html',
  '/RedTime/competition-4.html',
  '/RedTime/competition-5.html',
  '/RedTime/competition-6.html',
  '/RedTime/competition-7.html',
  // 正本 lm402 主 module
  '/RedTime/assets/lm402/lm402.css',
  '/RedTime/assets/lm402/app.js',
  '/RedTime/assets/lm402/renderer.js',
  '/RedTime/assets/lm402/data.js',
  '/RedTime/assets/lm402/ui-panels.js',
  // 雙時空主 module
  '/RedTime/assets/lm402-twin/lm402.css',
  '/RedTime/assets/lm402-twin/app.js',
  '/RedTime/assets/lm402-twin/renderer.js',
  '/RedTime/assets/lm402-twin/data.js',
  '/RedTime/assets/lm402-twin/junior-materials-hr.js',
  '/RedTime/assets/lm402-twin/envmap-sunset.js',
  // 平行世界主 module
  '/RedTime/assets/lm402-parallel/lm402.css',
  '/RedTime/assets/lm402-parallel/app.js',
  '/RedTime/assets/lm402-parallel/renderer.js',
  '/RedTime/assets/lm402-parallel/data.js',
  '/RedTime/assets/lm402-parallel/webgpu-bootstrap.js',
  '/RedTime/assets/lm402-parallel/parallel-init.js',
  // 月台奔跑入口頁 + 三線 SPA(r46 加平行世界)
  '/RedTime/demos/platform-run-time.html',
  '/RedTime/demos/platform-run/index.html',
  '/RedTime/demos/platform-run-twin/index.html',
  '/RedTime/demos/platform-run-parallel/index.html',
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

// 安全紀律:cache allowlist — 只 cache 已知 file type 或 html(避免 cache 異常 path)
function isCacheable(pathname) {
  if (pathname === '/' || pathname.endsWith('/') || pathname.endsWith('.html')) return true;
  return /\.(js|mjs|css|glb|woff2?|ttf|otf|png|jpg|jpeg|svg|ico|wasm|json)$/i.test(pathname);
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

  // 全部 network-first(有網路拿最新,離線回退快取)
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          // 分流寫進對應 cache
          const targetCache = isStaticAsset(url.pathname) ? STATIC_CACHE : RUNTIME_CACHE;
          const targetMax = isStaticAsset(url.pathname) ? MAX_STATIC_ITEMS : MAX_RUNTIME_ITEMS;
          caches.open(targetCache)
            .then(cache => cache.put(request, clone))
            .then(() => trimCache(targetCache, targetMax))
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
