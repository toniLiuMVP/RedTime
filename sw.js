// RedTime Service Worker
// 兩層 cache 設計(2026-05-09 round-15+ 升級):
//   STATIC_CACHE  — 大型不變 asset(GLB / vendor JS / fonts / pwa icon)。
//                   只在 STATIC_VERSION 升版時 invalidate(GLB 不會每次 sw 改就重下)。
//   RUNTIME_CACHE — html / 動態 JS / data.js。每次 sw 改 RUNTIME_VERSION 就 invalidate。
// 策略:STATIC 大型資產 cache-first / RUNTIME(html 等)network-first。

// — Cache version 分離 —
// 升 STATIC_VERSION 才會重下 GLB / vendor(僅在 vendor 升版或 GLB 換新時)
const STATIC_VERSION = 'static-v88-20260726';  // bump: font subset re-cut(new glyph coverage)
// 升 RUNTIME_VERSION 重下 html / data.js / app.js(每次 source 變動)
const RUNTIME_VERSION = 'runtime-v404-20260730';   // bump every deploy that changes html/js/css; auto-reload then delivers the fix to clients still on the prior worker

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
  // three.js addons:GLTFLoader 的兩個靜態相依。少了它們,離線首訪三個 3D 頁的
  // module graph 會斷(頁面殼進得去、遊戲載不起來 — R5 W2 實測「離線保證是假的」的元凶)。
  '/RedTime/assets/lm402/BufferGeometryUtils.js',
  '/RedTime/assets/lm402/SkeletonUtils.js',
  '/RedTime/demos/_vendor/BufferGeometryUtils.js',
  // 共用 assets
  // 【R5 W3-②】fonts-v2.css = 去重版(790 → 231 條 @font-face,gzip −71.4%),
  //   刻意用**新檔名**而不是覆寫 + bump STATIC_VERSION:woff2 的 231 個 URL 逐一不變,
  //   改名讓回訪者保留全部已快取字型與 mp3(bump 則最壞重下 ~24MB)。
  //   舊 fonts.css 檔案保留在 repo(舊 offline pack 與尚未換版的 RUNTIME html 仍引用它)。
  '/RedTime/fonts/fonts-v2.css',
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
  // 引文查證器(離線・內嵌手稿全文)— 落實引用守則「引用前先查在不在」
  '/RedTime/verify.html',
];

// — 路徑分流規則 —
// 大型靜態資源(GLB / vendor / fonts / images / 音訊 / wasm)→ STATIC_CACHE
// 其他(html / data.js / app.js / css)→ RUNTIME_CACHE
function isStaticAsset(url) {
  return /\.(glb|woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico)$/i.test(url) ||
         /\.(mp3|m4a|ogg)$/i.test(url) ||   // BGM 單首 4-7MB 且內容不變;走 RUNTIME 會被每次部署的 bump 沖掉、等於每次上線重下
         /\.wasm$/i.test(url) ||   // draco decoder wasm:binary,只在 vendor 換版時才變
         url.includes('/fonts/fonts.css') ||   // 舊版(仍被舊 offline pack / 未換版 html 引用)— 維持 STATIC 語意
         url.includes('/fonts/fonts-v2.css') ||   // 去重版(R5 W3-②),precached in STATIC — serve cache-first to match
         url.includes('/vendor-three') ||
         url.includes('/_vendor/') ||
         url.includes('/GLTFLoader') ||
         url.includes('/BufferGeometryUtils') ||   // GLTFLoader 的靜態相依;與 /GLTFLoader 同級,必須同走 STATIC(否則 GLTFLoader 秒命中、module graph 卻卡在 RUNTIME 網路請求上;離線首訪直接斷鏈)
         url.includes('/SkeletonUtils') ||         // 同上,GLTFLoader.js:69 靜態 import
         url.includes('/DRACOLoader') ||
         url.includes('/draco/') ||   // decoder 目錄(wasm wrapper JS + wasm)— 與 STATIC_PRECACHE_URLS 對齊,precache 完就別再 network-first
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
const MAX_STATIC_ITEMS = 400;    // 字型子集(231 個 woff2)+ 三遊戲 GLB/引擎 + 圖示的完整工作集要能全裝;上限太低會把 3D 引擎資產逐出、破壞離線保證
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
  return /\.(js|mjs|css|glb|woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico|wasm|json|mp3|m4a|ogg|wav)$/i.test(pathname);
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
    '/RedTime/fonts/fonts-v2.css',
    '/RedTime/favicon.svg',
    '/RedTime/assets/og-image.jpg',
  ];
  for (let i = 0; i <= 42; i++) urls.push(`/RedTime/ep/${i}.html`);
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

// 暖檔 in-flight 去重表(url → Promise)。SW 被回收重啟時歸零,無妨 — 只影響去重不影響正確性。
const _warmInFlight = new Map();

// 音訊冷路徑的「合成回應」工具。
// 為什麼冷路徑不能直接 return 網路 response:Chrome 的媒體層對同一個 URL 只維持一份
// UrlData(blink::UrlIndex),並要求該 URL 上每一段 range 回應的「來源型態」一致。首播若拿到
// 網路 response,之後暖檔落地、seek 改由本 SW 從快取切片自組 206,兩者混用會讓媒體層判定
// data-source read failure → MediaError code 2「PIPELINE_ERROR_READ: FFmpegDemuxer: data source
// error」,播放當場卡死(補 ETag / Last-Modified 無效,實測過)。解法是首播就把網路 response
// 重新包成 SW 自建的 Response — 從第一個 byte 起全程同一種來源,seek / loop / 離線都一致。
// 這個 UrlData 會跨 SW 更新與同分頁導覽存活,所以「只在冷快取那一次」也必須合成。
function synthesizeResponse(net, body) {
  // 204 / 205 / 304 規格上不得帶 body,Response 建構子會 throw;這類狀態(實測未出現過)原樣回。
  if (!body || net.status === 204 || net.status === 205 || net.status === 304) return net;
  const headers = new Headers();
  net.headers.forEach((v, k) => headers.set(k, v));
  return new Response(body, { status: net.status, statusText: net.statusText, headers });
}

// 背景暖檔 + in-flight 去重。
// 去重必須保留:媒體棧首播會連發多個 Range 請求,cache.put 完成前全都 miss —
// 不去重的話同一首歌會並發下載多次完整檔。
// putFromStream 有值 = 已經有整檔串流可直接寫入(零額外下載);null = 得自己抓一次完整檔。
function startAudioWarm(event, url, cache, putFromStream) {
  if (_warmInFlight.has(url)) return;
  const warm = (async () => {
    try {
      if (putFromStream) await putFromStream();
      else {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res || res.status !== 200) return;
        await cache.put(url, res);
      }
      await trimCache(STATIC_CACHE, MAX_STATIC_ITEMS);
    } catch (e) {
      // tee 寫入失敗(quota / 連線中斷)→ 退回獨立抓一次;再失敗就放棄,不影響本次播放。
      if (!putFromStream) return;
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res && res.status === 200) {
          await cache.put(url, res);
          await trimCache(STATIC_CACHE, MAX_STATIC_ITEMS);
        }
      } catch (e2) { /* 暖檔失敗不影響本次播放 */ }
    }
  })().finally(() => _warmInFlight.delete(url));
  _warmInFlight.set(url, warm);
  event.waitUntil(warm);
}

// STATIC 資產的 Range 請求:快取命中 → 切片自組 206;未命中 → passthrough(+音訊背景暖檔)。
// 任何一步出錯一律回退到原生 fetch,絕不讓 SW 成為播放失敗的原因。
async function serveRangeFromStatic(event, request) {
  try {
    const rangeHeader = request.headers.get('range') || '';
    // multi-range(帶逗號)不模擬,交給網路
    const m = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
    if (!m || rangeHeader.includes(',')) return fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    const full = await cache.match(request.url);
    if (!full || full.status !== 200) {
      const isAudio = /\.(mp3|m4a|ogg)$/i.test(new URL(request.url).pathname);
      const net = await fetch(request);
      // 非音訊(wasm / vendor 之類極少數帶 Range 的請求)維持原樣直接回。
      if (!isAudio) return net;

      // 音訊冷路徑「一律合成回應」— 見 startAudioWarm() 上方長註解說明為何不能回原生 response。
      // 這次網路回應是否已涵蓋整檔?(200,或 206 且 Content-Range 從 0 蓋到最後一個 byte)
      const cr = /^bytes 0-(\d+)\/(\d+)$/.exec(net.headers.get('Content-Range') || '');
      const coversWholeFile = net.status === 200 ||
        (net.status === 206 && cr && Number(cr[1]) === Number(cr[2]) - 1);

      if (coversWholeFile && net.body && !_warmInFlight.has(request.url)) {
        // 整檔已經在這條連線上 → tee 成兩份:一份寫 cache,一份回給媒體層。只下載一次。
        const [toCache, toClient] = net.body.tee();
        const warmHeaders = new Headers();
        for (const k of ['Content-Type', 'ETag', 'Last-Modified']) {
          const v = net.headers.get(k);
          if (v) warmHeaders.set(k, v);
        }
        startAudioWarm(event, request.url, cache, async () => {
          await cache.put(request.url, new Response(toCache, { status: 200, statusText: 'OK', headers: warmHeaders }));
        });
        return synthesizeResponse(net, toClient);
      }

      // 走到這裡代表:(a) origin 回的是真・部分內容(暖檔完成前就 seek),或
      // (b) 已經有暖檔在跑。本次照常回,暖檔另外抓一次完整檔(HTTP cache 會補掉重疊部分)。
      startAudioWarm(event, request.url, cache, null);
      return synthesizeResponse(net, net.body);
    }
    const buf = await full.arrayBuffer();
    const size = buf.byteLength;
    let start, end;
    if (m[1] === '') {           // 後綴形式 bytes=-N:最後 N bytes
      if (m[2] === '') return fetch(request);
      start = Math.max(0, size - Number(m[2]));
      end = size - 1;
    } else {
      start = Number(m[1]);
      end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= size) {
      return fetch(request);
    }
    const headers = new Headers();
    headers.set('Content-Type', full.headers.get('Content-Type') || 'application/octet-stream');
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    headers.set('Accept-Ranges', 'bytes');
    return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers });
  } catch (e) {
    return fetch(request);
  }
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

  // 安全紀律 5:帶 Range 的請求(音訊 seek / 媒體 partial load)不走一般 cache 邏輯 —
  // 206 partial 無法 cache.put(Cache API 規格直接 throw TypeError),完整快取直接回 200
  // 給 Range 請求媒體 seek 也會異常。但 <audio> 的 mp3 載入「一律」帶 Range(Chrome/Safari),
  // 單純 passthrough 會讓 BGM 永遠進不了 STATIC 快取、每次部署重下 4-7MB/首。
  // 解法:STATIC 資產的 Range 請求改由 serveRangeFromStatic 處理 —
  //   快取有完整檔 → 從快取切片自組合規 206 回應(離線播放 + seek 都成立);
  //   快取沒有(且是音訊)→ passthrough 原請求,同時背景抓一次完整檔入快取(僅首播多一次下載,
  //   之後所有回訪與部署都命中;STATIC 不隨 RUNTIME bump 失效)。
  // 其餘(非 STATIC)Range 請求維持 passthrough。
  if (request.headers.has('range')) {
    if (isStaticAsset(url.pathname)) {
      event.respondWith(serveRangeFromStatic(event, request));
    }
    return;
  }

  // STATIC 大型不變資產(GLB / vendor / fonts / images):cache-first
  // 回訪瞬命中、省頻寬;靠 STATIC_VERSION bump + activate 清舊版做 invalidation。
  // (前提:sw.js 本身不可被強快取,GitHub Pages 預設 max-age 短 + 瀏覽器 24h 強制檢查兜底)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      // 先查 STATIC_CACHE 本尊,查無再全域 match(離線收藏包當後備)。
      // 直接全域 match 會按 cache「建立順序」搜尋 — 建過離線包的用戶,舊 pack 條目
      // 會永久遮蔽之後 STATIC_VERSION bump 換上的新內容(例如字型子集重切白做)。
      caches.open(STATIC_CACHE)
        .then(c => c.match(request))
        .then(hit => hit || caches.match(request))
        .then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          // 只快取完整的 200(206/partial 一律不入 cache — cache.put 會 throw)
          if (response.status === 200) {
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
        // 只快取完整的 200(206/partial 一律不入 cache — cache.put 會 throw)
        if (response.status === 200) {
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
      .catch(() => caches.open(RUNTIME_CACHE)
        // 離線回退同樣先查 RUNTIME 本尊再全域 match — 理由同 STATIC 分支:
        // 別讓較早建立的離線收藏包永久遮蔽較新的 runtime 副本。
        .then(c => c.match(request))
        .then(hit => hit || caches.match(request))
        .then(cached => {
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
