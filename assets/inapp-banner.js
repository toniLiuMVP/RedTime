// in-app browser（Threads/FB/IG/LINE 內建瀏覽器 WebView）偵測 + 引導橫幅
// 背景：這些 WebView 對 WebGL/Three.js（lm402 3D 場景）支援不穩，常黑屏/卡頓。
// 策略（Gemini A 級查證）：
//   - LINE：唯一能「自動」外開的情況 → 導到帶 openExternalBrowser=1 的同網址。
//   - Meta（FB/IG/Threads）：iOS 無法程式化跳出 Safari → 顯示引導橫幅 + 複製網址；
//     Android 可在「使用者點擊」時用 intent:// 外開（禁 onload/timer 自動，否則被攔）。
//   - 橫幅是建議不是封鎖，可關閉（sessionStorage 記住不重複）。
// CSP：本檔外部載入（script-src 'self'）；注入的 <style> 由 adopt-style-shim 轉 adoptedStyleSheets。
(function () {
  "use strict";
  try {
    if (sessionStorage.getItem("lm402_inapp_dismissed") === "1") return;
  } catch (e) {}

  var ua = navigator.userAgent || "";
  var isMeta = /FBAN|FBAV|FB_IAB|Instagram|Threads|Barcelona/i.test(ua); // Barcelona = Threads iOS 代號
  var isLine = /Line\//i.test(ua);
  if (!isMeta && !isLine) return; // 一般瀏覽器：不顯示

  var isAndroid = /Android/i.test(ua);

  // LINE：直接帶參數自動外開（iOS/Android 皆有效），避免重複加參數
  if (isLine) {
    if (location.search.indexOf("openExternalBrowser=1") < 0) {
      var sep = location.search ? "&" : "?";
      try {
        location.replace(location.href + sep + "openExternalBrowser=1");
        return;
      } catch (e) {}
    }
    return;
  }

  // Meta 系：引導橫幅
  function injectStyle() {
    var css =
      "#lm402-inapp{position:fixed;top:0;left:0;right:0;z-index:100000;" +
      "background:linear-gradient(180deg,#1c1320,#120c16);color:#f0e6e6;" +
      "border-bottom:1px solid rgba(255,72,88,.4);" +
      "font-family:'Noto Sans TC',sans-serif;font-size:13.5px;line-height:1.7;" +
      "padding:14px 16px calc(14px + env(safe-area-inset-top,0px));" +
      "box-shadow:0 6px 24px rgba(0,0,0,.5);font-weight:300}" +
      "#lm402-inapp .ib-t{font-weight:500;color:#ff8fa0;margin-bottom:4px}" +
      "#lm402-inapp .ib-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}" +
      "#lm402-inapp button{font-family:inherit;font-size:13px;border-radius:999px;cursor:pointer;" +
      "padding:8px 16px;border:1px solid rgba(255,217,168,.4);background:transparent;color:#f0d4a8}" +
      "#lm402-inapp button.ib-primary{background:#ff4858;border-color:#ff4858;color:#fff}" +
      "#lm402-inapp .ib-x{margin-left:auto;border:0;background:transparent;color:#9a8f96;font-size:18px;padding:4px 8px}";
    var s = document.createElement("style");
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  function build() {
    injectStyle();
    var bar = document.createElement("div");
    bar.id = "lm402-inapp";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "瀏覽器相容提示");

    var t = document.createElement("div");
    t.className = "ib-t";
    t.textContent = "建議用瀏覽器開啟";
    bar.appendChild(t);

    var msg = document.createElement("div");
    msg.textContent = isAndroid
      ? "你正在 App 內建瀏覽器裡。這個 3D 場景在這裡可能黑屏或卡頓，點下面用瀏覽器開最順。"
      : "你正在 App 內建瀏覽器裡。這個 3D 場景在這裡可能黑屏或卡頓。請點右上角的「⋯」選「在 Safari 開啟」。";
    bar.appendChild(msg);

    var row = document.createElement("div");
    row.className = "ib-row";

    if (isAndroid) {
      var openBtn = document.createElement("button");
      openBtn.className = "ib-primary";
      openBtn.type = "button";
      openBtn.textContent = "在瀏覽器開啟";
      openBtn.addEventListener("click", function () {
        // 必須綁在使用者點擊：intent:// + browser_fallback_url 保險
        var fallback = encodeURIComponent(location.href);
        location.href =
          "intent://" + location.host + location.pathname + location.search +
          "#Intent;scheme=https;S.browser_fallback_url=" + fallback + ";end";
      });
      row.appendChild(openBtn);
    }

    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.textContent = "複製網址";
    copyBtn.addEventListener("click", function () {
      var done = function () { copyBtn.textContent = "已複製 ✓"; };
      try {
        navigator.clipboard.writeText(location.href).then(done, function () {
          window.prompt("複製這個網址，貼到瀏覽器開啟：", location.href);
        });
      } catch (e) {
        window.prompt("複製這個網址，貼到瀏覽器開啟：", location.href);
      }
    });
    row.appendChild(copyBtn);

    var x = document.createElement("button");
    x.className = "ib-x";
    x.type = "button";
    x.setAttribute("aria-label", "關閉提示，仍要在這裡繼續");
    x.textContent = "×";
    x.addEventListener("click", function () {
      try { sessionStorage.setItem("lm402_inapp_dismissed", "1"); } catch (e) {}
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    });
    row.appendChild(x);

    bar.appendChild(row);
    document.body.appendChild(bar);
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
