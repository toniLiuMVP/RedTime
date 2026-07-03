// platform-run 演出補強 #7:翻牌式顯示器字幕 + 進站音都卜勒層
// 純外掛:觀察既有敘事節拍(#narr-text),不動 game.js 邏輯;音效全程 WebAudio 合成,零新音檔。
(function () {
  "use strict";
  if (typeof document === "undefined" || !window.MutationObserver) return;

  var _rmq = null;
  function reduced() {
    try {
      if (!_rmq) _rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
      return _rmq.matches;
    } catch (e) { return false; }
  }

  /* ── 翻牌顯示器:車站發車顯示器質感,關鍵節拍逐字翻出 EP36 原文短句 ── */
  var st = document.createElement("style");
  st.id = "pt-flap-style";
  st.textContent = [
    "#pt-flap{position:fixed;top:46px;left:50%;transform:translateX(-50%);z-index:55;display:flex;gap:3px;padding:7px 12px;",
    "background:rgba(8,9,12,.74);border:1px solid rgba(217,179,106,.2);border-radius:4px;pointer-events:none;",
    "opacity:0;transition:opacity .5s ease;max-width:92vw;flex-wrap:nowrap;overflow:hidden}",
    "#pt-flap.show{opacity:1}",
    "#pt-flap .fl-ch{display:inline-block;min-width:1.15em;padding:2px 1px;text-align:center;",
    "font-size:clamp(13px,1.9vw,17px);letter-spacing:.02em;color:#ffd9a0;",
    "background:linear-gradient(180deg,#1a1d24 0%,#12141a 48%,#0b0d12 52%,#14161c 100%);",
    "border-radius:2px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.045);",
    "text-shadow:0 0 8px rgba(255,200,140,.38);backface-visibility:hidden}",
    "#pt-flap.anim .fl-ch{animation:ptFlip .38s cubic-bezier(.3,.7,.3,1) both;animation-delay:calc(var(--i)*55ms)}",
    "@keyframes ptFlip{0%{transform:rotateX(-92deg);opacity:.15}55%{transform:rotateX(16deg);opacity:1}100%{transform:rotateX(0)}}",
    "@media (max-width:640px){#pt-flap{top:70px}}",
    "@media (prefers-reduced-motion:reduce){#pt-flap.anim .fl-ch{animation:none}}"
  ].join("");
  (document.head || document.documentElement).appendChild(st);

  var board = null, hideT = 0;
  function ensureBoard() {
    if (board) return;
    board = document.createElement("div");
    board.id = "pt-flap";
    board.setAttribute("aria-hidden", "true"); // 視覺裝飾層:內容為正文短句的畫面回聲,不重複播報給讀屏
    (document.body || document.documentElement).appendChild(board);
  }
  function showFlap(text) {
    ensureBoard();
    while (board.firstChild) board.removeChild(board.firstChild);
    var chars = Array.from ? Array.from(text) : text.split("");
    for (var i = 0; i < chars.length; i++) {
      var sp = document.createElement("span");
      sp.className = "fl-ch";
      sp.textContent = chars[i];
      sp.style.setProperty("--i", String(i));
      board.appendChild(sp);
    }
    board.classList.remove("anim", "show");
    void board.offsetWidth; // 重置逐字動畫
    board.classList.add("show");
    if (!reduced()) board.classList.add("anim");
    clearTimeout(hideT);
    hideT = setTimeout(function () { if (board) board.classList.remove("show"); }, 4600);
  }

  /* 節拍 → 字幕對照:字幕全為 EP36 原文(或原句片段),逐字未改 */
  var BEATS = [
    { has: "南下的火車慢慢滑進台中站", text: "「把拔會不會趕不上？」", sfx: true, cool: 12000 },
    { has: "跑！", exact: true, text: "非常短、非常用力的三十秒", cool: 100000 },
    { has: "衝向北上自強號的車門", text: "把拔很胖，但是卻跑得很快!", cool: 100000 },
    { has: "把拔把我整個抱起來", text: "每一次都趕上", cool: 100000 },
    { has: "他一邊喘氣，一邊笑", text: "拉得再長也不會斷的線", cool: 100000 }
  ];
  var lastFire = {};
  var narr = document.getElementById("narr-text");
  if (narr) {
    new MutationObserver(function () {
      var t = narr.textContent || "";
      if (!t) return;
      for (var i = 0; i < BEATS.length; i++) {
        var b = BEATS[i];
        var hit = b.exact ? t === b.has : t.indexOf(b.has) >= 0;
        if (!hit) continue;
        var now = Date.now();
        if (lastFire[i] && now - lastFire[i] < b.cool) break;
        lastFire[i] = now;
        showFlap(b.text);
        if (b.sfx) trainDoppler();
        break;
      }
    }).observe(narr, { childList: true, characterData: true, subtree: true });
  }

  /* ── 進站音都卜勒層:低頻滾動噪音 playbackRate 由高滑低 + 帶通下掃 + 立體聲橫移 ── */
  var ctx = null;
  function audioOK() {
    try { if (typeof window.__PT_AUDIO_OK__ === "function") return !!window.__PT_AUDIO_OK__(); } catch (e) {}
    return true;
  }
  function ensureCtx() {
    if (!audioOK()) return null;
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === "suspended" && ctx.resume) ctx.resume();
    } catch (e) { return null; }
    return ctx;
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && ctx && ctx.suspend) { try { ctx.suspend(); } catch (e) {} }
  });

  function trainDoppler() {
    var c = ensureCtx();
    if (!c) return;
    try {
      var now = c.currentTime, dur = 4.2;
      // 近似 brown noise:列車滾動的低頻能量
      var len = Math.floor(c.sampleRate * 2), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      var last = 0;
      for (var i = 0; i < len; i++) {
        var w = Math.random() * 2 - 1;
        last = (last + 0.045 * w) / 1.045;
        d[i] = last * 4.0;
      }
      var src = c.createBufferSource();
      src.buffer = buf; src.loop = true;
      src.playbackRate.setValueAtTime(1.18, now);
      src.playbackRate.exponentialRampToValueAtTime(0.66, now + dur); // 接近 → 減速進站,音高整體下滑
      var bp = c.createBiquadFilter();
      bp.type = "bandpass"; bp.Q.value = 0.8;
      bp.frequency.setValueAtTime(950, now);
      bp.frequency.exponentialRampToValueAtTime(380, now + dur);
      var g = c.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.13, now + 1.5);
      g.gain.setValueAtTime(0.13, now + 2.1);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      var tail = g, pan = null;
      try {
        pan = c.createStereoPanner();
        pan.pan.setValueAtTime(-0.35, now);
        pan.pan.linearRampToValueAtTime(0.3, now + dur);
        g.connect(pan); tail = pan;
      } catch (e) {}
      src.connect(bp); bp.connect(g); tail.connect(c.destination);
      src.start(now); src.stop(now + dur + 0.1);
      // 軌道低頻震動
      var o = c.createOscillator(), og = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(52, now);
      o.frequency.exponentialRampToValueAtTime(24, now + dur);
      og.gain.setValueAtTime(0.0001, now);
      og.gain.exponentialRampToValueAtTime(0.05, now + 1.2);
      og.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(og); og.connect(c.destination);
      o.start(now); o.stop(now + dur + 0.1);
    } catch (e) {}
  }
})();
