/* boot-sentry.js — LM402 開機自癒哨兵（classic script，CSP 'self'）
   目的：任何原因造成的「黑畫面」（舊 Service Worker / 壞快取 / 模組載入失敗）
   不再讓訪客卡死：
   1) 開機 12 秒內若「進場 gate 與 cold-open 都沒長出來」且無 ready 旗標 → 視為 boot 失敗
   2) 第一次失敗：自動 註銷 SW + 清 caches + 帶 cache-bust 參數重載（每個分頁只自動嘗試一次）
   3) 再失敗：顯示可讀的錯誤面板（含捕捉到的 JS 錯誤）讓訪客一鍵重試或回首頁
   不依賴任何模組；對正常使用者零干擾（健康時計時器靜默取消）。 */
(function () {
  "use strict";
  var HEAL_KEY = "lm402_boot_heal_v1";
  var TEST = /[?&]bootsentrytest=1/.test(location.search);
  var TIMEOUT_MS = TEST ? 3000 : 12000;
  var errors = [];

  window.addEventListener("error", function (e) {
    if (errors.length < 6) {
      errors.push((e.message || "script error") + (e.filename ? " @ " + e.filename.split("/").pop() + ":" + e.lineno : ""));
    }
  });
  window.addEventListener("unhandledrejection", function (e) {
    if (errors.length < 6) {
      var r = e.reason;
      errors.push("unhandled: " + (r && r.message ? r.message : String(r)).slice(0, 160));
    }
  });

  function healthy() {
    if (TEST) return false;
    return !!(
      window.__lm402Ready ||
      document.getElementById("cinematic-gate-enter") ||
      document.getElementById("cold-open")
    );
  }

  function purgeAndReload() {
    var done = function () {
      var base = location.pathname;
      var keep = location.search.replace(/^\?/, "").split("&").filter(function (p) {
        return p && p.indexOf("healed=") !== 0;
      });
      keep.push("healed=" + Date.now());
      location.replace(base + "?" + keep.join("&"));
    };
    var tasks = [];
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        tasks.push(
          navigator.serviceWorker.getRegistrations().then(function (regs) {
            return Promise.all(regs.map(function (r) { return r.unregister(); }));
          })
        );
      }
    } catch (e) {}
    try {
      if (window.caches && caches.keys) {
        tasks.push(
          caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) { return caches.delete(k); }));
          })
        );
      }
    } catch (e) {}
    Promise.all(tasks).then(done, done);
    setTimeout(done, 4000); /* 保險：清理卡住也要重載 */
  }

  function showPanel() {
    var old = document.getElementById("boot-sentry-panel");
    if (old) old.remove();
    var d = document.createElement("div");
    d.id = "boot-sentry-panel";
    d.setAttribute("role", "alert");
    d.style.cssText =
      "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;" +
      "background:rgba(8,8,12,.97);color:#eae6de;font-family:'Noto Sans TC',sans-serif;padding:24px";
    var box = document.createElement("div");
    box.style.cssText = "max-width:520px;text-align:center;line-height:1.9";
    function el(tag, css, text) {
      var n = document.createElement(tag);
      if (css) n.style.cssText = css;
      if (text) n.textContent = text;
      return n;
    }
    box.appendChild(el("div", "font-size:20px;margin-bottom:10px", "載入遇到了問題"));
    box.appendChild(el("div", "font-size:13px;color:#b8b2a6;margin-bottom:14px",
      "這一頁沒有順利醒過來。已自動清過一次快取仍未成功，可再試一次，或先用 Safari 開啟。"));
    if (errors.length) {
      var pre = el("div", "font-size:11px;color:#8a8a94;background:rgba(255,255,255,.04);border-radius:6px;padding:10px;margin-bottom:16px;text-align:left;word-break:break-all");
      errors.slice(0, 4).forEach(function (m) { pre.appendChild(el("div", "", "· " + m)); });
      box.appendChild(pre);
    }
    var row = el("div", "display:flex;gap:10px;justify-content:center;flex-wrap:wrap");
    var btn = el("button", "font:14px 'Noto Sans TC';padding:10px 22px;border-radius:8px;border:1px solid rgba(255,72,88,.55);background:rgba(255,72,88,.14);color:#ffd0d6;cursor:pointer", "清除快取，再試一次");
    btn.onclick = function () { try { sessionStorage.removeItem(HEAL_KEY); } catch (e) {} purgeAndReload(); };
    var home = el("a", "font:14px 'Noto Sans TC';padding:10px 22px;border-radius:8px;border:1px solid rgba(234,230,222,.3);color:#eae6de;text-decoration:none", "回首頁");
    home.href = "index.html";
    row.appendChild(btn); row.appendChild(home);
    box.appendChild(row);
    d.appendChild(box);
    (document.body || document.documentElement).appendChild(d);
  }

  function check() {
    if (healthy()) {
      try { sessionStorage.removeItem(HEAL_KEY); } catch (e) {}
      return;
    }
    var attempted = false;
    try { attempted = sessionStorage.getItem(HEAL_KEY) === "1"; } catch (e) {}
    if (!attempted) {
      try { sessionStorage.setItem(HEAL_KEY, "1"); } catch (e) {}
      purgeAndReload();
    } else {
      showPanel();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(check, TIMEOUT_MS); });
  } else {
    setTimeout(check, TIMEOUT_MS);
  }
})();
