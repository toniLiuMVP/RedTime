// lm402.html inline classic #2 外部化（CSP 撤 unsafe-inline）
// Loading tips — cycle through game hints while loading
(function () {
  const tips = [
"轉動視角，每個角落都藏著 2005 年的痕跡",
"看到會發光的東西，靠近點一下。",
"這裡有七種結局，看你最後站在哪裡。",
"每個選擇，都會改變女兒最後看見的那一秒。",
"留意紅線，它從來不會帶你走錯路。",
"11:00 教室的鐘會響，到時候別走遠。"
  ];
  const tipEl = document.getElementById("loader-tip");
  if (!tipEl) return;
  let idx = 0;
  tipEl.textContent = tips[0];
  const tipTimer = setInterval(function () {
tipEl.style.opacity = "0";
setTimeout(function () {
  idx = (idx + 1) % tips.length;
  tipEl.textContent = tips[idx];
  tipEl.style.opacity = "1";
}, 500);
  }, 4000);
  // 暴露給 app.js — 場景進入、loader 消失後 clearInterval，避免 timer 與 DOM refs 洩漏
  window.__lm402LoaderTipTimer = tipTimer;
})();

// Fallback: if ES module fails to load (e.g. file:// protocol), show help after 6s
// C9: only kick in AFTER the cinematic gate has been entered; before that, nothing is loading yet.
window.__lm402Ready = false;
window.__lm402GateEntered = false;
// 「場景卡住」提示：改由 enterScene 進場後才排程（避免在玄關久留時 6s timer 先空轉掉）
window.__lm402ShowStuckHint = function () {
  if (window.__lm402Ready) return;
  var loader = document.getElementById("lm402-loader");
  if (!loader) return;
  var inner = loader.querySelector(".loader-inner");
  if (!inner) return;
  var hint = document.createElement("div");
  hint.style.cssText =
"margin-top:24px;padding:16px 20px;border:1px solid rgba(217,179,106,.3);border-radius:12px;background:rgba(217,179,106,.06);max-width:360px;text-align:center";

  /* 分流:file:// 才是真的不支援;一般網路只是還在載(2.5MB 場景),別把慢網訪客嚇走 */
  var isFile = false;
  try { isFile = location.protocol === "file:"; } catch (e) {}
  var msg = document.createElement("div");
  msg.style.cssText = "font:300 13px/1.8 'Noto Sans TC',sans-serif;color:rgba(238,232,222,.7)";
  msg.textContent = isFile ? "場景載入似乎卡住了。" : "網路好像慢了一點，場景還在載入中…";
  hint.appendChild(msg);

  var detail = document.createElement("div");
  detail.style.cssText = "font:300 12px/1.7 'Noto Sans TC',sans-serif;color:rgba(238,232,222,.5);margin-top:8px;text-align:left";
  detail.textContent = isFile
    ? "直接從檔案開啟（file://）不支援 3D 場景。請用本機伺服器（npx serve .）或部署到網頁空間。"
    : "可以再等一下下；等太久的話，重新整理通常會更快（已載過的部分會直接接手）。";
  hint.appendChild(detail);

  if (!isFile) {
    /* CSP script-src 'self' 會封 javascript: URI — 用 button + listener */
    var rl = document.createElement("button");
    rl.type = "button";
    rl.textContent = "↻ 重新整理";
    rl.style.cssText = "display:inline-block;margin-top:10px;margin-right:14px;font:500 12px 'Noto Sans TC',sans-serif;color:rgba(217,179,106,.9);background:none;border:none;cursor:pointer;padding:0";
    rl.addEventListener("click", function () { location.reload(); });
    hint.appendChild(rl);
  }

  var link = document.createElement("a");
  link.href = "index.html";
  link.textContent = "返回首頁";
  link.style.cssText = "display:inline-block;margin-top:14px;padding:8px 20px;border:1px solid rgba(115,208,165,.4);border-radius:4px;color:#73d0a5;text-decoration:none;font:400 11px 'DM Mono',monospace;letter-spacing:.12em";
  hint.appendChild(link);

  inner.appendChild(hint);
};
