// RedTime Service Worker
// 兩層 cache 設計(2026-05-09 round-15+ 升級):
//   STATIC_CACHE  — 大型不變 asset(GLB / vendor JS / fonts / pwa icon)。
//                   只在 STATIC_VERSION 升版時 invalidate(GLB 不會每次 sw 改就重下)。
//   RUNTIME_CACHE — html / 動態 JS / data.js。每次 sw 改 RUNTIME_VERSION 就 invalidate。
// 策略:STATIC 大型資產 cache-first / RUNTIME(html 等)network-first。

// — Cache version 分離 —
// 升 STATIC_VERSION 才會重下 GLB / vendor(僅在 vendor 升版或 GLB 換新時)
const STATIC_VERSION = 'static-v82-20260703';  // bump: subset webfonts to the in-use glyph set
// 升 RUNTIME_VERSION 重下 html / data.js / app.js(每次 source 變動)
const RUNTIME_VERSION = 'runtime-v357-20260710';   // bump every deploy that changes html/js/css; auto-reload then delivers the fix to clients still on the prior worker

const STATIC_CACHE = `redtime-${STATIC_VERSION}`;
const RUNTIME_CACHE = `redtime-${RUNTIME_VERSION}`;
// 離線收藏包(opt-in):訪客在閱讀設定按「下載離線內容」才建。
// 不隨 RUNTIME bump 失效(章節頁內容穩定;連線時 network-first 一律拿最新,離線才回退這份)。
const OFFLINE_PACK_CACHE = 'redtime-offline-pack-v1';
const ALL_CURRENT_CACHES = new Set([STATIC_CACHE, RUNTIME_CACHE, OFFLINE_PACK_CACHE]);

// — 大型不變 asset:STATIC_CACHE —
const STATIC_PRECACHE_URLS = [
  // three.js engine build (shared vendor module + core)
  '/RedTime/demos/_vendor/three.module.js',
  '/RedTime/assets/lm402/vendor-three.module.js',
  '/RedTime/assets/lm402/three.core.js',
  // Draco geometry decoder (shared)
  '/RedTime/assets/lm402/draco/draco_wasm_wrapper.js',
  '/RedTime/assets/lm402/draco/draco_decoder.wasm',
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
  // 清除本機資料共用模組(reader + 三遊戲頁都載)— precache 讓離線首訪也能用清除鈕
  '/RedTime/assets/clear-data.js',
  '/RedTime/assets/finished-state.js',
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
         url.includes('/fonts/fonts.css') ||   // large invariant stylesheet, precached in STATIC — serve cache-first to match
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

// — 離線收藏包(opt-in message handler) —
// 頁面 postMessage({type:'OFFLINE_PACK'}) 才觸發;URL 清單只在此維護(不接受頁面傳入的清單)。
// 分批下載、逐批回報進度;單一檔案失敗只計數,不中斷整包。
const OFFLINE_PACK_URLS = (() => {
  const urls = [
    '/RedTime/reader.html',
    '/RedTime/index.html',
    '/RedTime/assets/load-fonts.js',
    '/RedTime/assets/clear-data.js',
  '/RedTime/assets/finished-state.js',
    '/RedTime/assets/frame-guard.js',
    '/RedTime/fonts/fonts.css',
    '/RedTime/favicon.svg',
    '/RedTime/assets/og-image.jpg',
  ];
  for (let i = 0; i <= 41; i++) urls.push(`/RedTime/ep/${i}.html`);
  return urls;
})();
const OFFLINE_PACK_BATCH = 6;

self.addEventListener('message', event => {
  const data = event.data;
  if (!data || data.type !== 'OFFLINE_PACK') return;
  const client = event.source;
  event.waitUntil((async () => {
    let done = 0, failed = 0;
    const total = OFFLINE_PACK_URLS.length;
    let cache;
    try {
      cache = await caches.open(OFFLINE_PACK_CACHE);
    } catch (e) {
      if (client) client.postMessage({ type: 'OFFLINE_PACK_DONE', total, failed: total });
      return;
    }
    for (let i = 0; i < total; i += OFFLINE_PACK_BATCH) {
      const batch = OFFLINE_PACK_URLS.slice(i, i + OFFLINE_PACK_BATCH);
      await Promise.all(batch.map(async u => {
        try {
          const res = await fetch(u, { cache: 'no-cache' });
          if (res && res.ok) await cache.put(u, res);
          else failed++;
        } catch (e) { failed++; }
        done++;
      }));
      if (client) {
        try { client.postMessage({ type: 'OFFLINE_PACK_PROGRESS', done, total, failed }); } catch (e) {}
      }
    }
    if (client) {
      try { client.postMessage({ type: 'OFFLINE_PACK_DONE', total, failed }); } catch (e) {}
    }
  })());
});

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
      .catch(() => caches.match(request).then(cached => {
        if (cached) return cached;
        // 離線且未快取的「導覽請求」(分享深連 / 帶 utm 的 URL / 未 precache 的路徑)
        // → 回退到快取的 app shell,讓 PWA 真正離線可用,而非瀏覽器錯誤頁。
        if (request.mode === 'navigate' && url.pathname.startsWith('/RedTime/')) {
          return caches.match('/RedTime/reader.html').then(s => s || caches.match('/RedTime/'));
        }
        return undefined;
      }))
  );
});
