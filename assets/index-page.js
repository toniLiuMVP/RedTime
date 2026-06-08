// index.html page scripts — 外部化（CSP：撤 script-src 'unsafe-inline'）
// 由 4 個原 inline <script> 依序合併：page-init / sw-register / tour-controller / entry-router

// ── block 1 ──
// NAV scroll
window.addEventListener(
  "scroll",
  () => {
document
  .getElementById("nav")
  .classList.toggle("scrolled", window.scrollY > 40);
  },
  { passive: true },
);

// Reveal on scroll
const ro = new IntersectionObserver(
  (entries) => {
entries.forEach((e) => {
  if (e.isIntersecting) {
    e.target.classList.add("in");
    ro.unobserve(e.target);
  }
});
  },
  { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
);
document.querySelectorAll(".reveal").forEach((el) => ro.observe(el));

// YouTube facade：點擊前完全不連 Google（隱私）；點擊才注入 nocookie iframe（效能）
document.querySelectorAll(".yt-facade").forEach((btn) => {
  btn.addEventListener("click", function () {
var id = btn.getAttribute("data-yt-id") || "";
// 白名單：只接受合法 11 碼 YouTube ID（防注入，呼應 §安全不變式）
if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
var ifr = document.createElement("iframe");
ifr.style.cssText =
  "position:absolute;inset:0;width:100%;height:100%;border:0";
ifr.src =
  "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1";
ifr.title = btn.getAttribute("data-yt-title") || "";
ifr.setAttribute("frameborder", "0");
ifr.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
ifr.setAttribute(
  "allow",
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
);
ifr.setAttribute("allowfullscreen", "");
if (btn.parentNode) btn.parentNode.replaceChild(ifr, btn);
try { ifr.focus(); } catch (e) {}
  });
});

// Homepage font scale — :6 階(加超特大)+ site-wide localStorage 同步 + 放大鏡 elderly mode
(() => {
  const LEGACY_KEY = "redtime_home_font_scale_v1";  // 舊鍵 fallback
  const SITE_KEY = "redtime_site_font_v2";          // 新鍵:跨頁面同步(reader 也讀此鍵)
  const LEVELS = {
small: 0.92,
medium: 1,
large: 1.08,
xlarge: 1.16,
xxlarge: 1.24,
xxxlarge: 1.34,   // 新增超特大階(長輩友善)
  };
  const buttons = Array.from(
document.querySelectorAll("[data-font-scale]"),
  );
  var _supportsZoom = (function () { try { var d = document.createElement("div"); d.style.zoom = "2"; return d.style.zoom !== "" && d.style.zoom !== "normal"; } catch (e) { return false; } })();
  const applyScale = (level) => {
const scale = LEVELS[level] || LEVELS.medium;
document.body.dataset.fontScale = level;
document.documentElement.style.setProperty(
  "--page-font-scale",
  String(scale),
);
if (_supportsZoom) { document.body.style.zoom = String(scale); }
else { document.documentElement.style.fontSize = (scale * 100) + "%"; } // 舊 Firefox 無 zoom → 改 root font-size,rem 內容跟著縮放
buttons.forEach((button) => {
  button.classList.toggle(
    "active",
    button.dataset.fontScale === level,
  );
});
  };
  // 優先讀新 site key,fallback 到舊 home key
  let saved = "medium";
  try {
saved = localStorage.getItem(SITE_KEY) || localStorage.getItem(LEGACY_KEY) || "medium";
if (!LEVELS[saved]) saved = "medium";
  } catch {}
  applyScale(saved);
  buttons.forEach((button) => {
button.addEventListener("click", () => {
  const level = button.dataset.fontScale || "medium";
  try {
    localStorage.setItem(SITE_KEY, level);    // 寫 site 共享鍵
    localStorage.setItem(LEGACY_KEY, level);  // 寫舊鍵保 backward compat
  } catch {}
  applyScale(level);
});
  });
  // 放大鏡按鈕 — 一鍵跳到最大階「超特大」(長輩友善 elderly mode)
  const magnifyBtn = document.getElementById("site-font-magnify");
  if (magnifyBtn) {
magnifyBtn.addEventListener("click", () => {
  const level = "xxxlarge";
  try {
    localStorage.setItem(SITE_KEY, level);
    localStorage.setItem(LEGACY_KEY, level);
  } catch {}
  applyScale(level);
});
  }
})();

// Hero particle canvas — with red thread of fate
(function () {
  var cvs = document.getElementById("hero-canvas"),
ctx = cvs.getContext("2d");
  var W, H, pts = [], frame = 0;
  var COLS = [
"#16a864","#c89010","#a8a49c","#b84820",
"#3880ff","#9040f0","#ff4858","#e8cc10"
  ];

  // Red thread control points (normalized 0-1)
  var threadSeeds = [];
  for (var i = 0; i < 7; i++) {
threadSeeds.push({
  nx: 0.08 + i * 0.14,
  ny: 0.35 + (i % 2 === 0 ? -0.12 : 0.12) + Math.random() * 0.06,
  phase: Math.random() * Math.PI * 2,
  amp: 8 + Math.random() * 14
});
  }

  function resize() {
W = cvs.width = cvs.offsetWidth;
H = cvs.height = cvs.offsetHeight;
  }

  // Get thread point at normalized position t (0..1)
  function threadY(t, time) {
var baseY = H * 0.48;
var wave = Math.sin(t * Math.PI * 2.2 + time * 0.3) * H * 0.06;
var drift = Math.sin(t * Math.PI * 1.1 + time * 0.15) * H * 0.03;
return baseY + wave + drift;
  }

  function drawThread(time) {
var segments = 120;
var breathe = 0.5 + 0.5 * Math.sin(time * 0.4);

// Outer glow — :偏黃暖紅(EP41 toni 親寫「我跟把拔的紅線，有點偏黃色」fidelity)
ctx.save();
ctx.globalAlpha = 0.06 + breathe * 0.04;
ctx.strokeStyle = "#e85a3a";  // 從 #ff4858 純朱紅 → 暖琥珀紅
ctx.lineWidth = 12;
ctx.shadowColor = "#e85a3a";
ctx.shadowBlur = 40;
ctx.beginPath();
for (var i = 0; i <= segments; i++) {
  var t = i / segments;
  var x = t * W;
  var y = threadY(t, time);
  if (i === 0) ctx.moveTo(x, y);
  else ctx.lineTo(x, y);
}
ctx.stroke();
ctx.restore();

// Core line — 沿線色相微變化，從暖紅 → 偏黃 → 回暖紅，對位 EP41 line 70「有點偏黃色」
ctx.save();
ctx.globalAlpha = 0.12 + breathe * 0.08;
var grad = ctx.createLinearGradient(0, 0, W, 0);
grad.addColorStop(0, "#e85a3a");      // 起點 暖紅
grad.addColorStop(0.4, "#f0a058");    // 偏黃峰值
grad.addColorStop(0.7, "#e85a3a");    // 回到暖紅
grad.addColorStop(1, "#c84830");      // 終點 沉穩暗紅
ctx.strokeStyle = grad;
ctx.lineWidth = 1.2;
ctx.shadowColor = "#e85a3a";
ctx.shadowBlur = 16;
ctx.beginPath();
for (var i = 0; i <= segments; i++) {
  var t = i / segments;
  var x = t * W;
  var y = threadY(t, time);
  if (i === 0) ctx.moveTo(x, y);
  else ctx.lineTo(x, y);
}
ctx.stroke();
ctx.restore();

// Sparkle nodes along thread — 火花亦偏蜜橙(對位偏黃紅線)
for (var i = 0; i < 5; i++) {
  var st = (i + 1) / 6;
  var sparklePhase = time * 0.8 + i * 1.3;
  var sparkleAlpha = 0.15 + 0.25 * Math.pow(Math.sin(sparklePhase), 2);
  var sx = st * W;
  var sy = threadY(st, time);
  ctx.save();
  ctx.globalAlpha = sparkleAlpha;
  ctx.fillStyle = "#f5b878";     // 從 #ff8fa0 冷粉 → 蜜橙
  ctx.shadowColor = "#e85a3a";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(sx, sy, 2 + Math.sin(sparklePhase) * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
  }

  function mkP() {
// 20% of particles are born near the red thread
var nearThread = Math.random() < 0.2;
var px, py;
if (nearThread && W && H) {
  var t = Math.random();
  px = t * W;
  py = threadY(t, frame * 0.016) + (Math.random() - 0.5) * 60;
} else {
  px = Math.random() * W;
  py = Math.random() * H;
}
var isRed = nearThread && Math.random() < 0.5;
return {
  x: px, y: py,
  r: Math.random() * 1.8 + 0.2,
  vx: (Math.random() - 0.5) * 0.12,
  vy: (Math.random() - 0.5) * 0.12,
  c: isRed ? "#e85a3a" : COLS[Math.floor(Math.random() * COLS.length)],
  a: isRed ? Math.random() * 0.3 + 0.12 : Math.random() * 0.35 + 0.04,
  life: Math.random() * 320 + 120,
  age: 0
};
  }
  for (var i = 0; i < 150; i++) pts.push(mkP());

  function draw() {
frame++;
/* 當 hero 完全滾出視野時暫停繪製，節省 CPU/電池 */
if (cvs.getBoundingClientRect().bottom < 0) {
  requestAnimationFrame(draw);
  return;
}
var time = frame * 0.016;
ctx.clearRect(0, 0, W, H);

// Draw the red thread behind particles
drawThread(time);

// Draw particles
pts = pts.filter(function(p) {
  p.x += p.vx;
  p.y += p.vy;
  p.age++;
  var f = Math.min(p.age / 40, 1) *
          Math.min(1 - (p.age - p.life + 40) / 40, 1);
  if (f <= 0) return false;
  ctx.globalAlpha = p.a * f;
  ctx.fillStyle = p.c;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
  return true;
});
while (pts.length < 150) pts.push(mkP());
requestAnimationFrame(draw);
  }
  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });
})();

// ── block 2 ──
if ('serviceWorker' in navigator) {
  // 相對路徑同時支援 GitHub Pages (/RedTime/) 與本機伺服器 (/)
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
}

// ── block 3 ──
/* P0-1: 新讀者引路 modal tour controller */
(function () {
  const TOUR_KEY = "redtime_newcomer_done";
  const TOUR_STEPS = 5;
  let currentStep = 1;

  window.openNewcomerTour = function () {
const overlay = document.getElementById("newcomer-tour");
if (!overlay) return;
try { if (typeof closeModal === "function") closeModal(); } catch (e) {} // 互斥：開新手教學前先關導覽 modal
overlay.hidden = false;
overlay.setAttribute("aria-hidden", "false");
currentStep = 1;
updateTourStep();
document.body.style.overflow = "hidden";
setTimeout(() => {
  const closeBtn = overlay.querySelector(".tour-close");
  if (closeBtn) closeBtn.focus();
}, 50);
  };

  window.closeNewcomerTour = function () {
const overlay = document.getElementById("newcomer-tour");
if (!overlay) return;
overlay.hidden = true;
overlay.setAttribute("aria-hidden", "true");
document.body.style.overflow = "";
try { localStorage.setItem(TOUR_KEY, "1"); } catch (e) {}
  };

  window.tourNext = function () {
if (currentStep < TOUR_STEPS) {
  currentStep++;
  updateTourStep();
}
  };

  window.tourPrev = function () {
if (currentStep > 1) {
  currentStep--;
  updateTourStep();
}
  };

  function updateTourStep() {
const overlay = document.getElementById("newcomer-tour");
if (!overlay) return;
overlay.querySelectorAll(".tour-step").forEach(s => {
  const n = parseInt(s.dataset.step, 10);
  s.classList.toggle("active", n === currentStep);
});
overlay.querySelectorAll(".tour-dot").forEach(d => {
  const n = parseInt(d.dataset.step, 10);
  d.classList.toggle("active", n === currentStep);
  d.classList.toggle("done", n < currentStep);
});
const prev = overlay.querySelector(".tour-btn-prev");
const next = overlay.querySelector(".tour-btn-next");
const indicator = overlay.querySelector(".tour-step-indicator");
if (prev) prev.hidden = currentStep === 1;
if (next) next.hidden = currentStep === TOUR_STEPS;
if (indicator) indicator.textContent = currentStep + " / " + TOUR_STEPS;
// Scroll card to top so new step is visible
const card = overlay.querySelector(".tour-card");
if (card) card.scrollTop = 0;
  }

  document.addEventListener("DOMContentLoaded", function () {
// Auto-open from query string (?tour=1 from reader.html)
const params = new URLSearchParams(window.location.search);
if (params.get("tour") === "1") {
  setTimeout(() => window.openNewcomerTour(), 300);
  // Clean URL so refresh doesn't re-open
  if (window.history && window.history.replaceState) {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, "", cleanUrl);
  }
}

// ESC close
document.addEventListener("keydown", function (e) {
  const overlay = document.getElementById("newcomer-tour");
  if (e.key === "Escape" && overlay && !overlay.hidden) {
    window.closeNewcomerTour();
  }
});

// Click outside card to close
const overlay = document.getElementById("newcomer-tour");
if (overlay) {
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) window.closeNewcomerTour();
  });
}

// CSP 收斂：tour 控制鈕改 addEventListener（取代 inline onclick）
var _bN = document.querySelector(".btn-newcomer");
if (_bN) _bN.addEventListener("click", function () { window.openNewcomerTour(); });
if (overlay) {
  var _bC = overlay.querySelector(".tour-close");
  if (_bC) _bC.addEventListener("click", function () { window.closeNewcomerTour(); });
  var _bP = overlay.querySelector(".tour-btn-prev");
  if (_bP) _bP.addEventListener("click", function () { window.tourPrev(); });
  var _bX = overlay.querySelector(".tour-btn-next");
  if (_bX) _bX.addEventListener("click", function () { window.tourNext(); });
  var _bS = overlay.querySelector(".tour-skip");
  if (_bS) _bS.addEventListener("click", function () { window.closeNewcomerTour(); });
}
  });
})();

// ── block 4 ──
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var ROUTE_KEY = "redtime_entry_route_v1";
  var READER = "reader.html";

  // ── 入手集數單一來源（技術債清理）──
  // VIEWPOINTS.ep 與新讀者導覽 step4 的三個 sample 連結都引用這張表，避免 EP 編號異動時多處不同步。
  // 注意：QUIZ[].ep 是「每題對應的集數」（綁該題題目文字 EPx），語意不同，刻意不併進此表。
  // VIEWPOINTS 的 text/recs 與 tour 的 tag/desc 內含的「EPx」字樣是 toni 親寫文案，維持不動；本表只統一「連結目標」結構。
  var RECOMMENDED_ENTRIES = { father: 0, male: 3, female: 38, daughter: 41, mixed: 24 };
  // 把入手集數寫進 step4 sample 連結（只設 href 結構，不動可見文字）
  try {
var _samples = document.querySelectorAll(".tour-sample[data-entry]");
for (var _si = 0; _si < _samples.length; _si++) {
  var _ek = _samples[_si].getAttribute("data-entry");
  if (RECOMMENDED_ENTRIES[_ek] != null) _samples[_si].setAttribute("href", READER + "#ep-" + RECOMMENDED_ENTRIES[_ek]);
}
  } catch (e) {}

  var QUIZ = [
{ q: "EP3：學長第一眼看到學妹，心裡冒出的那句話？（填關鍵詞）", ans: ["徐若瑄"], ep: 3, hook: "連這句都答得出來，代表你真的在第一秒就被釘住了。" },
{ q: "EP3：學妹在 LM402 教室，叫學長走到哪一道門？", ans: ["後門"], ep: 3, hook: "前門來電、後門等待，差一道門就不是這個故事了。" },
{ q: "反覆出現的「一眼瞬間」鐘響時間？（HH:MM）", ans: ["11:00", "11點", "11", "十一"], ep: 3, hook: "整部作品所有後製、表情都為這一秒服務。" },
{ q: "EP36：把拔在台中火車站「我趕上了」，趕上女兒幾秒的擁抱？", ans: ["30", "三十"], ep: 36, hook: "「拉得再長也不會斷」的那一抱，差一秒都不算趕上。" },
{ q: "EP37：女兒用注音寫給把拔的那句話是？", ans: ["把拔我會想你的", "我會想你"], ep: 37, hook: "一個不能穿越、只能相信的爸爸，收到的第一份父親節禮物。" },
{ q: "EP13：學妹打電話跟學長提分手，是哪一年月日？（YYYY-MM-DD）", ans: ["2005-12-22", "2005/12/22"], ep: 13, hook: "用離開去愛的人，連分手都選在最痛的日子。" },
{ q: "EP23：命運阿嬤送女兒的 7 歲生日禮物是？", ans: ["時空手錶", "手錶"], ep: 23, hook: "飛遍所有時間線卻不能干預的女兒，靠這件道具起步。" },
{ q: "EP38：意識菜市場有幾個年紀的「我」？", ans: ["5", "五"], ep: 38, hook: "不是兩個年代的切換，是同一個人意識裡七嘴八舌的自己。" },
{ q: "EP27：來來水餃他們點了幾顆韭菜水餃？", ans: ["25", "二十五", "25 顆"], ep: 27, hook: "2025 南機場夜市那一桌，連幾顆水餃都是他們的暗號。" },
{ q: "最終題：完整寫出 EP3 學長心裡那句話（不論標點）", ans: ["也太像徐若瑄了吧", "也太像徐若瑄"], ep: 3, hook: "從第一秒回到第一秒，一字不差才算真鐵粉。" }
  ];

  var VIEWPOINTS = {
father: { name: "把拔", sub: "父親視角", ep: RECOMMENDED_ENTRIES.father, text: "他是那種會說「我海軍陸戰隊欸」來掩飾捨不得的爸爸。從 EP0 進，你會先笑出來，然後在某一句之後，突然鼻酸。", recs: "推薦入手：EP0（最短、最低門檻）→ EP36（月台狂奔「我趕上了」）", echo: "想知道那個被他抱起來的小女孩，長大後怎麼喊他嗎？去女兒視角：她說「現在的我已經不叫你『把拔』了，我現在都直接叫你一聲『爸』」。" },
male: { name: "學長", sub: "男主視角", ep: RECOMMENDED_ENTRIES.male, text: "2005 年，他站錯了門。電話那頭一句「你走到後門」，他繞過去，抬頭那一眼：「也太像徐若瑄了吧。」二十年的故事從這一秒開始。", recs: "推薦入手：EP3（一眼瞬間，故事的起點）→ EP39（相信的力量）", echo: "你站在前門撲空的這一眼，她在後門也記了一輩子。去學妹視角，看同一場「一眼瞬間」她那一邊的聲音。" },
female: { name: "學妹（阿姨）", sub: "女主視角", ep: RECOMMENDED_ENTRIES.female, text: "29 歲的身體裡，住著 18 歲的意識。她第二次闖進同一間教室，只為了看清楚一個人。教室裡不同年紀的自己正在七嘴八舌。", recs: "推薦入手：EP38（意識菜市場）→ EP13（她用離開去愛）", echo: "她用一通電話逼他下定決心，自己也痛，「傷你有多深，我就有多痛」。去學長視角，看那一刀落下後，他在伯達樓轉角站了多久。" },
daughter: { name: "女兒", sub: "夢境視角", ep: RECOMMENDED_ENTRIES.daughter, text: "她飛遍所有時間線，卻被禁止干預。她什麼都知道，直到發現「知道」救不了現在的他。而她最後選擇相信，不是因為看過了，是因為願意。", recs: "推薦入手：EP41（拱心石「這不是童話故事」）→ EP16（女兒對爸爸最柔軟的告白）", echo: "她最後選擇跟把拔一樣去「相信」。去把拔視角，看那個不能穿越、只能相信的人，怎麼在所有平行世界裡都選擇把她生下來。" },
mixed: { name: "複合視角", sub: "多線交織", ep: RECOMMENDED_ENTRIES.mixed, text: "兩三條時間線塞在同一集裡，同一秒鐘被不同人各看一遍。建議先讀過幾集再進來，不然會認不出誰是誰。", recs: "推薦入手：EP24（小年夜急症室七盞白光，與 LM402 一眼瞬間互文）。建議讀過幾集再來。", echo: "先把男女主讀過，回頭看 EP24 那七盞白光到底在照誰，才會起雞皮疙瘩。" }
  };

  function ce(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function optEl(tag, title, sub) { var e = ce(tag, "ob-opt"); e.appendChild(ce("span", "ob-opt-t", title)); if (sub) e.appendChild(ce("span", "ob-opt-s", sub)); return e; }
  function norm(s) { return (s || "").toString().toLowerCase().replace(/[\s　，,。.、:：;；!！?？「」『』（）()]/g, ""); }
  function go(url) { try { window.location.href = url; } catch (e) {} }

  var _bd = null, _autoCloseT = null;
  function closeModal() { if (_autoCloseT) { clearTimeout(_autoCloseT); _autoCloseT = null; } if (!_bd) return; var bd = _bd; _bd = null; bd.classList.remove("show"); try { document.body.style.overflow = ""; } catch (e) {} setTimeout(function () { if (bd.parentNode) bd.parentNode.removeChild(bd); }, 460); document.removeEventListener("keydown", onKey); }
  function onKey(e) { if (e.key === "Escape") closeModal(); }
  function openModal() {
try { var _nt = document.getElementById("newcomer-tour"); if (_nt && !_nt.hidden) { _nt.hidden = true; _nt.setAttribute("aria-hidden", "true"); } } catch (e) {} // 互斥：開導覽 modal 前先關新手教學，避免雙層捲動鎖
var stale = document.querySelectorAll(".ob-backdrop");
for (var s = 0; s < stale.length; s++) { if (stale[s].parentNode) stale[s].parentNode.removeChild(stale[s]); }
_bd = null; document.removeEventListener("keydown", onKey);
var bd = ce("div", "ob-backdrop"); bd.setAttribute("role", "dialog"); bd.setAttribute("aria-modal", "true");
var card = ce("div", "ob-card");
var x = ce("button", "ob-close", "×"); x.setAttribute("aria-label", "關閉"); x.addEventListener("click", closeModal);
card.appendChild(x); bd.appendChild(card); document.body.appendChild(bd);
bd.addEventListener("click", function (e) { if (e.target === bd) closeModal(); });
document.addEventListener("keydown", onKey);
requestAnimationFrame(function () { bd.classList.add("show"); });
try { document.body.style.overflow = "hidden"; } catch (e) {}
_bd = bd; return card;
  }
  function clearCard(card) { while (card.children.length > 1) card.removeChild(card.lastChild); }

  function remember(v) { try { localStorage.setItem(ROUTE_KEY, v); } catch (e) {} }

  function renderChoose(card) {
clearCard(card);
var k = ce("div", "ob-kicker");
k.appendChild(document.createTextNode("2005 年，他在走廊盡頭看了她一眼。"));
k.appendChild(ce("br"));
k.appendChild(document.createTextNode("那一眼只有一秒，他卻用了"));
k.appendChild(ce("b", null, "二十年"));
k.appendChild(document.createTextNode("才讀懂。"));
card.appendChild(k);
card.appendChild(ce("div", "ob-title", "想從哪裡走進來？"));
card.appendChild(ce("div", "ob-sub", "選哪個都行，第一眼都會回到 2005 年那道走廊。"));
var opts = ce("div", "ob-options");
function opt(t, s, fn) { var e = optEl("button", t, s); e.addEventListener("click", fn); return e; }
opts.appendChild(opt("📖 讀 EP3 試讀", "一個 21 歲男生狼狽又認真的初戀，從那一眼開始。", function () { remember("read"); go(READER + "#ep-3"); }));
opts.appendChild(opt("↗ 走進 LM402", "站到他站過的位置，看那一眼會不會發生，這次換你親眼看。", function () { remember("lm402"); go("lm402.html"); }));
opts.appendChild(opt("🏃 走進月台上的狂奔", "月台那 30 秒，自己跑一次就忘不了。", function () { remember("platform"); go("demos/platform-run/index.html"); }));
opts.appendChild(opt("★ 我是老朋友 · 鐵粉測驗", "讓我看看你記得多少。十題，最後一題我故意留了狠的。", function () { remember("fan"); renderQuiz(card); }));
card.appendChild(opts);
var mini = ce("a", "ob-mini", "還沒想好？先翻第一頁，故事會自己告訴你該往哪走 →"); mini.href = READER;
mini.addEventListener("click", function () { remember("read"); });
card.appendChild(mini);
  }


  function renderQuiz(card) {
var i = 0, correct = 0;
function step() {
  clearCard(card);
  if (i >= QUIZ.length) { return summary(); }
  var item = QUIZ[i];
  card.appendChild(ce("div", "ob-progress", "第 " + (i + 1) + " 題 / 共 " + QUIZ.length + " 題"));
  card.appendChild(ce("div", "ob-q", item.q));
  var input = ce("input", "ob-input"); input.type = "text"; input.setAttribute("autocomplete", "off"); input.setAttribute("aria-label", "你的答案");
  card.appendChild(input);
  var btn = ce("button", "ob-submit", "送出答案");
  var fb = ce("div", "ob-fb");
  var answered = false;
  function submit() {
    if (answered) { i++; step(); return; }
    answered = true;
    var v = norm(input.value), ok = false;
    var vnum = (v.match(/^\d+/) || [""])[0]; // 使用者輸入開頭的數字串：容忍「30秒」「5個」這類帶單位
    for (var j = 0; j < item.ans.length; j++) {
      var a = norm(item.ans[j]); if (!a) continue;
      if (/^\d+$/.test(a) && a.length <= 2) { if (vnum === a) { ok = true; break; } } // 短純數字：比開頭數字（30秒→30 對；1130→1130≠11 拒）
      else if (a.replace(/\D/g, "").length >= 4) { if (v.replace(/\D/g, "") === a.replace(/\D/g, "")) { ok = true; break; } } // 日期/長數字：比純數字串（2005年12月22日→20051222 對）
      else if (v === a || v.indexOf(a) >= 0) { ok = true; break; }
    }
    if (ok) { correct++; fb.className = "ob-fb ok"; fb.textContent = "答對了。" + item.hook; }
    else {
      fb.className = "ob-fb no";
      fb.appendChild(document.createTextNode("正解：" + item.ans[0] + "。" + item.hook));
      fb.appendChild(ce("br"));
      var lk = ce("a", null, "去讀 EP" + item.ep + " →"); lk.href = READER + "#ep-" + item.ep; fb.appendChild(lk);
    }
    btn.textContent = (i + 1 >= QUIZ.length) ? "看結果 →" : "下一題 →";
  }
  btn.addEventListener("click", submit);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
  card.appendChild(btn); card.appendChild(fb);
  setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);
}
function summary() {
  clearCard(card);
  // B1：進站成績寫入同源 key，reader 鐵粉挑戰大廳唯讀顯示（0~10 只增不減，不碰 reader 既有 key）
  try { var prev = parseInt(localStorage.getItem("redtime_entry_quiz_best_v1") || "0", 10) || 0; if (correct > prev) localStorage.setItem("redtime_entry_quiz_best_v1", String(correct)); } catch (e) {}
  // B4：分級鐵粉密語（稱號 + 真實台詞，逐字核實自故事正文）
  var tier = correct >= 8
    ? { t: "☆ 男主角 ☆", m: "你是不是 toni 本人？連「也太像徐若瑄了吧」都答得出來，那一眼你也被釘了二十年。" }
    : (correct >= 4
      ? { t: "☆ 紅線時空者 ☆", m: "謝謝你也喜歡。你記得的「等待的時候，也算在約會的時間裡」，都是最戳心的那幾段。" }
      : { t: "☆ 紅線新手 ☆", m: "紅線剛牽上你。「我說我走了，但我從沒離開過」——剛剛答錯那幾題，回去把那集讀一遍就懂了，第一次來都這樣。" });
  card.appendChild(ce("div", "ob-progress", "你答對了 " + correct + " / " + QUIZ.length + " 題"));
  card.appendChild(ce("div", "ob-title", tier.t));
  card.appendChild(ce("div", "ob-sub", tier.m));
  var opts = ce("div", "ob-options");
  var c = optEl("a", "看完整 100 題鐵粉題庫 →", "一百題，分五十座月台。這十題只是開胃，看你能撐到第幾站還笑得出來。"); c.href = READER + "#fanquiz"; opts.appendChild(c);
  var a = optEl("a", "📖 回去重讀全集", "EP0 到 EP41，從頭再走一次那條紅線。"); a.href = READER; opts.appendChild(a);
  var b = optEl("button", "🏃 再陪把拔跑一次月台", "EP36 的那 30 秒，這次換你跑。"); b.addEventListener("click", function () { go("demos/platform-run/index.html"); }); opts.appendChild(b);
  card.appendChild(opts);
}
step();
  }

  function openViewpoint(key) {
var v = VIEWPOINTS[key]; if (!v) return;
var card = openModal();
card.appendChild(ce("div", "ob-progress", v.sub));
card.appendChild(ce("div", "ob-title", v.name));
card.appendChild(ce("div", "ob-sub", v.text));
card.appendChild(ce("div", "ob-kicker", v.recs));
if (v.echo) { var eh = ce("div", "ob-echo"); eh.appendChild(ce("span", "ob-echo-tag", "互文鈎")); eh.appendChild(document.createTextNode(" " + v.echo)); card.appendChild(eh); }
var opts = ce("div", "ob-options");
var a = optEl("a", "📖 從這裡入手 → EP" + v.ep, v.name + "視角最推薦的第一集，直接開讀。"); a.href = READER + "#ep-" + v.ep;
opts.appendChild(a); card.appendChild(opts);
  }

  var CARD_MAP = { "arc-father": "father", "arc-male": "male", "arc-female": "female", "arc-daughter": "daughter", "arc-mixed": "mixed" };
  Object.keys(CARD_MAP).forEach(function (cls) {
var el = document.querySelector(".arc-card." + cls);
if (!el) return;
el.style.cursor = "pointer";
el.setAttribute("role", "button");
el.setAttribute("tabindex", "0");
el.setAttribute("aria-label", VIEWPOINTS[CARD_MAP[cls]].name + " 視角導覽");
el.addEventListener("click", function () { openViewpoint(CARD_MAP[cls]); });
el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openViewpoint(CARD_MAP[cls]); } });
  });

  // 進站分流窗：開啟後 20 秒無互動自動關閉（與 ×／Esc／點背景同一套 closeModal）。
  // 只在進站分流窗 arm（不影響使用者主動點開的視角卡／鐵粉測驗）；任何關閉都會 clearTimeout。
  function openRouter() { if (_autoCloseT) { clearTimeout(_autoCloseT); _autoCloseT = null; } var card = openModal(); renderChoose(card); _autoCloseT = setTimeout(closeModal, 20000); }
  window.__ENTRY_ROUTER__ = { open: openRouter, viewpoint: openViewpoint, reset: function () { try { localStorage.removeItem(ROUTE_KEY); } catch (e) {} } };

  var tourDeep = false; try { tourDeep = new URLSearchParams(location.search).get("tour") === "1"; } catch (e) {}
  // 進站分流永遠顯示（每次進站都跳，鐵粉題庫多、每次有驚喜）；可手動跳過（× / Escape / 點背景）。
  // ?tour=1 深連時讓既有新讀者導覽接手，不雙開。
  if (!tourDeep) { setTimeout(openRouter, 900); }
})();

// ── block 5 ──
// 動態紅線時間軸：SVG 紅線隨捲動沿時間軸畫下，逐一點亮年份節點（紅線 = 命中注定母題）
(function initTimelineThread() {
  var track = document.querySelector("#timeline-sec .tl-track");
  if (!track) return;
  var path = track.querySelector(".tl-thread-path");
  var events = Array.prototype.slice.call(track.querySelectorAll(".tl-event"));
  if (!path && !events.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  function setFull() {
    if (path) path.style.strokeDashoffset = "0";
    events.forEach(function (e) { e.classList.add("lit"); });
  }
  var ticking = false;
  function update() {
    ticking = false;
    var r = track.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight || 1;
    var ref = vh * 0.62; // 紅線「畫到」這條視窗參考線
    var p = (ref - r.top) / Math.max(1, r.height);
    p = Math.max(0, Math.min(1, p));
    if (path) path.style.strokeDashoffset = String(1000 * (1 - p));
    var headY = r.top + p * r.height;
    events.forEach(function (e) {
      var er = e.getBoundingClientRect();
      var dotY = er.top + Math.min(28, er.height * 0.3); // 紅線到達節點上緣附近即點亮
      if (dotY <= headY) e.classList.add("lit"); else e.classList.remove("lit");
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function attach() {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }
  function detach() {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  }
  if (reduce.matches) setFull(); else attach();
  var onPref = function () { if (reduce.matches) { detach(); setFull(); } else { attach(); } };
  if (reduce.addEventListener) reduce.addEventListener("change", onPref);
  else if (reduce.addListener) reduce.addListener(onPref);
})();