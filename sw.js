// RedTime Service Worker
// 兩層 cache 設計(2026-05-09 round-15+ 升級):
//   STATIC_CACHE  — 大型不變 asset(GLB / vendor JS / fonts / pwa icon)。
//                   只在 STATIC_VERSION 升版時 invalidate(GLB 不會每次 sw 改就重下)。
//   RUNTIME_CACHE — html / 動態 JS / data.js。每次 sw 改 RUNTIME_VERSION 就 invalidate。
// 策略:STATIC 大型資產 cache-first / RUNTIME(html 等)network-first。

// — Cache version 分離 —
// 升 STATIC_VERSION 才會重下 GLB / vendor(僅在 vendor 升版或 GLB 換新時)
const STATIC_VERSION = 'static-v89-20260726';  // bump: font subset re-cut(new glyph coverage)
// 升 RUNTIME_VERSION 重下 html / data.js / app.js(每次 source 變動)
const RUNTIME_VERSION = 'runtime-v421-20260812';   // bump every deploy that changes html/js/css; auto-reload then delivers the fix to clients still on the prior worker

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
  // three.js addons:GLTFLoader 的兩個靜態相依,必須與 /GLTFLoader 同走 STATIC
  // (否則頁面 JS 已在 RUNTIME 快取時,離線仍斷在這兩支)。
  // ⚠ 措辭校正(R5 審核 B3):這不是「離線首訪」的完整保證。完整帳目與裁決見下方
  //   「離線能力現況(R6 Wave B)」註解區塊。
  '/RedTime/assets/lm402/BufferGeometryUtils.js',
  '/RedTime/assets/lm402/SkeletonUtils.js',
  '/RedTime/demos/_vendor/BufferGeometryUtils.js',
  // 【R6 Wave B】補上 R5 漏掉的**父節點**:GLTFLoader / DRACOLoader 本尊。
  // R5 precache 了 GLTFLoader 的兩個子相依,loader 本體卻只被 isStaticAsset() 判進
  // STATIC(cache-first)、不在 precache 名單裡 → STATIC_VERSION 一 bump,activate
  // 刪掉舊 STATIC cache,這兩支就跟著消失,子相依的 precache 等於白做。
  // 斷鏈後果不對稱(實地確認過 import 形態):
  //   · LM402:renderer.js 開頭是**靜態** import GLTFLoader / DRACOLoader
  //     → 缺任一支,整個 renderer 模組求值失敗,場景不啟動。
  //   · 月台 / 天堂路:走 props-loader.js 的**動態** import,而 game.js / scene.js 的
  //     `import("./props-loader.js").then(...).catch(e => console.warn("[props] module load failed"))`
  //     有接住 → 場景照跑、只是道具全缺(乾淨降級,不炸)。
  // 成本:4 檔 30.2 KB gzip,而且只在 STATIC_VERSION bump 時付一次
  //(近 4 次 release 逐檔比對:這 4 支 0 次變動)。
  '/RedTime/assets/lm402/GLTFLoader.js',
  '/RedTime/assets/lm402/DRACOLoader.js',
  '/RedTime/demos/_vendor/GLTFLoader.js',    // 兩行 re-export shim,與已收的 three.module.js / BufferGeometryUtils.js shim 對齊
  '/RedTime/demos/_vendor/DRACOLoader.js',
  // (_vendor/SkeletonUtils.js 刻意不收:三個頁面都沒有人 import 它 —— GLTFLoader.js
  //  走的是 assets/lm402/SkeletonUtils.js。收用不到的 URL 只是替 addAll 增加失敗面。)
  // 【R5 審核 A1】webgl-notice.js 判據已在本輪就地改寫(webgl→webgl2),但它走
  // 永不失效的 STATIC cache-first(`/_vendor/` 規則)且原本不在 precache →
  // R5 前訪過遊戲頁的回訪者會**永遠**命中舊判據,WebGL1-only 靜默黑畫面照舊,
  // 而那正是這次修復唯一的目標族群。precache 的 install-time addAll 對同名
  // cache 執行 put 覆寫 → 新 SW 一裝即生效,不必 bump STATIC_VERSION。
  '/RedTime/demos/_vendor/webgl-notice.js',
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

// ─────────────────────────────────────────────────────────────────────────────
// 離線能力現況(R6 Wave B 實測定稿,2026-08-01)
// —— 別把「precache 了 HTML」讀成「離線能玩」。這一段是本檔對外的誠實聲明。
//
// 現況三句話:
//   1. **閱讀**離線可用:章節頁靠 opt-in 離線包(見 OFFLINE_PACK_URLS),字型與 mp3
//      靠 STATIC(不隨 RUNTIME bump 失效)。這是本站真正的離線承諾,和 reader.html
//      設定面板的文案「離線收藏(把全部章節存進這台裝置,斷網也能讀)」一致 —— 那句
//      文案只承諾「讀」,沒有承諾「玩」,不需要改。
//   2. 三個 3D 頁**離線首訪玩不到**:頁面殼(HTML + CSS)進得去,3D 進不去。
//   3. 三個 3D 頁**離線重訪**只在「上線期間真的開過該頁、且此後 RUNTIME_VERSION 沒 bump」
//      時成立;bump 一次就失效,直到下次上線把 RUNTIME cache 重新填回來。
//
// 為什麼不把入口模組鏈也 precache(R6 量完的帳,三個選項都算過):
//   · 缺口有多大:量測當下,三頁「離線首訪要能玩」還缺的 network-first 檔案聯集 =
//     69 檔 / 526.8 KB gzip(單頁:月台 20 檔 109.1 KB、天堂路 9 檔 97.7 KB、
//     LM402 47 檔 341.1 KB)。本輪收了其中 3 份 CSS(34.9 KB),**仍缺 66 檔 /
//     491.9 KB gzip**;只算入口模組鏈的話是 31 檔 / 386.7 KB gzip
//     (月台 5 檔 63.5 KB、天堂路 5 檔 87.7 KB、LM402 24 檔 253.0 KB)。
//   · 真正的代價不是一次性的,是**每次上線**:拿最近 4 個 release 逐檔比對,這 69 檔
//     每次都有 5-7 檔真的改動 = 229-292 KB gzip 的新位元組;而且 61.8%(325.4 KB)
//     集中在 renderer.js(4/4 次改)、game.js(4/4)、postfx.js(4/4)、scene.js(3/4)、
//     app.js(2/4)這五支入口模組。換句話說「只收便宜穩定的那一段」功能上等於沒收,
//     因為缺的正是每次都在改的那幾支。
//     對照組:現行這份 RUNTIME precache 名單,同樣 4 個 release 只變動 0-1 條
//     (0-11.3 KB gzip;R5 那次 846 KB 是 reader.html 大改版的一次性例外)。
//     收入口鏈 = 讓「從不玩 3D 的讀者」每次上線多下載 20-80 倍的位元組。
//   · 收了也還不是「能玩」:離線仍缺 30 個 GLB 道具(1584.9 KB gzip)與 36 個 woff2
//     子集(1913.7 KB gzip)—— 遊戲會跑,但沒道具、沒字型。
//   · cache.addAll 全有全無:名單會從現在的 13 條變成 79 條,任何一支模組被改名或搬家就會讓整個
//     install 失敗、SW 永遠裝不上(連帶拖垮 mp3 快取與離線閱讀),而這 69 條深層模組
//     路徑是手維護的,沒有建置期產生器、也沒有 CI 檢查。
//     (順帶:MAX_RUNTIME_ITEMS = 80,79 條 precache 一上線就會被 trimCache 從最舊的
//      開始吃掉;真要走這條路,上限得一起改。)
//
// 為什麼也不放進 opt-in 離線包(OFFLINE_PACK_URLS):
//   離線包刻意不隨版失效,所以它一定會跟版本化的 RUNTIME / STATIC 打架,而這不是理論
//   風險:最近 80 個 commit 裡有 8 個 commit 同時改了某個頁面 HTML 與它的入口模組
//   (8e866e1 / f8fc696 / 05a1448 / 53a0a4f / 3a5eba7 / 638c74f / dda3eab / 587d344)
//   —— 等於每次 release 都會造出「新 HTML(RUNTIME precache)+ 舊 renderer/app.js
//   (pack)」的組合。fetch handler 的查找順序(RUNTIME 本尊 → 全域 caches.match)
//   保證了這個組合會真的被端出去。要修就得把 pack 版本化,而版本化之後的失效行為
//   與現狀完全等價(下次部署就沒了),卻多出一整套 cache 版本管理、整包重下的 UX
//   (43 章 ≈ 20MB)、以及 activate 清理舊 pack 的分支。效益÷代價不成立。
//
// 翻案條件(哪天再議):
//   (a) 有證據顯示真的有人在離線首訪玩 3D(例如 boot-sentry 回報離線斷鏈次數);或
//   (b) 三個遊戲頁改成 hashed 檔名 + 建置期產生 precache manifest —— 屆時 addAll 的
//       維護風險與 bump 稅會一起消失,再重新談收不收。
// ─────────────────────────────────────────────────────────────────────────────

// — 動態 / 易變 asset:RUNTIME_CACHE —
const RUNTIME_PRECACHE_URLS = [
  '/RedTime/',
  '/RedTime/index.html',
  '/RedTime/reader.html',
  '/RedTime/manifest.json',
  // 清除本機資料共用模組(reader + 三遊戲頁都載)— precache 讓離線首訪也能用清除鈕
  '/RedTime/assets/clear-data.js',
  '/RedTime/assets/finished-state.js',
  // 三個公開遊戲入口(LM402 / 月台 / 天堂路)的 HTML + 它們的樣式表。
  // 收到這裡為止 = 離線首訪保證「頁面長得對」,**不**保證「玩得到」(理由見上方
  // 「離線能力現況」)。
  // 樣式表為什麼非收不可:LM402 與月台的 CSP 都是 style-src self(不含
  // unsafe-inline),整個版面都靠外部 CSS。離線首訪時 HTML 命中 precache、CSS 走
  // network-first 撲空 → 瀏覽器把整份文件當無樣式純文字由上往下攤開,連平常 hidden
  // 的過關/結局/排行榜文案都會一起露出來(R6 實測截圖確認)。收這 3 份共 34.9 KB
  // gzip,把「殼」變成真的殼;而且這 3 份 CSS 近 4 個 release 0 次變動,之後每次上線
  // 都是 304,等於只付一次。
  // (天堂路不需要:它的 CSP 帶 unsafe-inline,版面寫在 index.html 自己的 <style> 裡,
  //  離線首訪本來就是有樣式的。)
  '/RedTime/lm402.html',
  '/RedTime/assets/lm402/lm402.css',
  '/RedTime/lm402-page.css',
  '/RedTime/demos/platform-run/index.html',
  '/RedTime/demos/platform-run/platform.css',
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
         url.includes('/BufferGeometryUtils') ||   // GLTFLoader 的靜態相依;與 /GLTFLoader 同級,必須同走 STATIC(否則 GLTFLoader 秒命中、module graph 卻卡在 RUNTIME 網路請求上;離線時斷鏈)
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

/* 【R6 審核修復】precache 條目豁免 trim。
   三個鏡頭獨立命中同一條:RUNTIME precache 的遊戲殼(3 HTML + 3 CSS + verify.html)
   是整份快取裡「唯一永不被重新請求」的鍵 —— network-first 的 cache.put 對其他頁面是
   「刪同鍵再 append」(推到最新端),而殼從不被重新 put → 永遠停在最舊端 →
   讀 43 章 + 開一次 LM402(~47 檔)≈ 105-110 鍵 > 80,trimCache 第一批吃掉的
   正是本輪剛買到的離線殼;HTML 被逐出後斷網開遊戲頁,navigate 回退還會端出
   reader.html。修法:trim 只在「非 precache 鍵」上計數與刪除(protect 集合以
   pathname 比對);上限語意變成「precache 之外最多 N 條」,總量上界 = N + 名單長度。
   STATIC 同樣加保護(對稱 + 未來擴名單時免踩同坑;現況 400 上限本就有餘裕)。 */
const RUNTIME_PRECACHE_SET = new Set(RUNTIME_PRECACHE_URLS);
const STATIC_PRECACHE_SET = new Set(STATIC_PRECACHE_URLS);
async function trimCache(cacheName, maxItems, protectPaths) {
  const cache = await caches.open(cacheName);
  let keys = await cache.keys();
  if (protectPaths) keys = keys.filter(k => {
    try { return !protectPaths.has(new URL(k.url).pathname); } catch (e) { return true; }
  });
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
      await trimCache(STATIC_CACHE, MAX_STATIC_ITEMS, STATIC_PRECACHE_SET);
    } catch (e) {
      // tee 寫入失敗(quota / 連線中斷)→ 退回獨立抓一次;再失敗就放棄,不影響本次播放。
      if (!putFromStream) return;
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res && res.status === 200) {
          await cache.put(url, res);
          await trimCache(STATIC_CACHE, MAX_STATIC_ITEMS, STATIC_PRECACHE_SET);
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
        // 【R5 審核 B4 記帳】WHATWG Streams 的 tee 對較慢分支沒有背壓上限:
        // cache.put 全速吃 toCache 時,媒體層還沒讀走的 chunk 會滯留在 SW 的
        // stream 佇列,峰值 ≤ 最大單檔(一眼瞬間.mp3 ≈ 7MB)。這是冷快取首播的
        // 一次性短暫暫存;媒體層 cancel toClient 時該分支佇列由規格清空
        // (chunk 只進另一分支);每 URL 由 _warmInFlight 鎖一份不會並發疊加。
        // 同類佇列語意(response.clone 即 tee)R4 起就施加於 8MB Babylon 等全部
        // STATIC 資產,非新風險類別;暖路徑的 arrayBuffer+slice 峰值(~14MB)本就更高。
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
              .then(() => trimCache(STATIC_CACHE, MAX_STATIC_ITEMS, STATIC_PRECACHE_SET))
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
            .then(() => trimCache(RUNTIME_CACHE, MAX_RUNTIME_ITEMS, RUNTIME_PRECACHE_SET))
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
