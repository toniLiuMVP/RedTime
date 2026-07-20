/* 小說模式(全站最高對比)早期掛載:reader 選的三態模式跨頁生效。
   同步跑於首屏繪製前(此檔在 head 同步載)防止對比閃換;body 未 parse 故掛 html 元素。
   預設小說模式:新訪(從未選過模式=null)即套用;明確選過紅線("aesthetic")/閱讀("focus")則不掛。 */
(function () {
  try {
    var m = localStorage.getItem("redtime-read-mode");
    if (m === "novel" || m == null) {
      document.documentElement.classList.add("novel-read");
    }
  } catch (e) {}
})();

/* 首訪冷開場:全黑畫面以打字節奏浮現標語,浮現完停一拍再淡入整頁。
   只出現一次(本機記憶);減少動態偏好或無法記憶時直接不出現。 */
(function () {
  "use strict";
  var KEY = "redtime_cold_open_seen_v1";
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (localStorage.getItem(KEY)) return;
    localStorage.setItem(KEY, "1");
  } catch (e) {
    return; // 無法記憶「看過」→ 寧可不播,避免每次進站都重演
  }

  var TEXT = "一眼，只有一秒。"; // 與 hero 標語同句
  var ov = document.createElement("div");
  ov.className = "cold-open";

  var line = document.createElement("p");
  line.className = "co-line";
  line.setAttribute("aria-hidden", "true"); // 逐字浮現不逐字報讀;同句已在 hero 完整可讀

  var skip = document.createElement("button");
  skip.type = "button";
  skip.className = "co-skip";
  skip.textContent = "跳過";
  skip.setAttribute("aria-label", "跳過開場，直接進入首頁");

  ov.appendChild(line);
  ov.appendChild(skip);
  (document.body || document.documentElement).appendChild(ov);

  var timers = [];
  var done = false;
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function onKey(e) { if (e.key === "Escape") dismiss(true); }
  function dismiss(fast) {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    document.removeEventListener("keydown", onKey);
    ov.classList.add(fast ? "co-out-fast" : "co-out");
    setTimeout(function () {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }, fast ? 500 : 1600);
  }
  skip.addEventListener("click", function () { dismiss(true); });
  document.addEventListener("keydown", onKey);

  var idx = 0;
  function type() {
    if (done) return;
    idx++;
    line.textContent = TEXT.slice(0, idx);
    if (idx < TEXT.length) later(type, 550);
    else later(function () { dismiss(false); }, 1700);
  }
  later(type, 900);
  later(function () {
    try { skip.focus({ preventScroll: true }); } catch (e) { try { skip.focus(); } catch (e2) {} }
  }, 120);
  later(function () { dismiss(true); }, 12000); // 保險:無論如何不擋畫面超過 12 秒
})();
