// platform-run 演出補強 #8:抱起瞬間定格收法 + 跑動鏡頭呼吸感 + 眨眼轉場 + 結局「追」小框與三印狀態列
// 純外掛 patch:不動 game.js 邏輯,全部掛在既有 DOM / window hook 上。
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var _rmq = null;
  function reduced() {
    try {
      if (!_rmq) _rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
      return _rmq.matches;
    } catch (e) { return false; }
  }

  var st = document.createElement("style");
  st.id = "pt-c8-style";
  st.textContent = [
    /* 眨眼轉場:上下眼瞼,世界在闔眼時切換 */
    "#pt-eyelid{position:fixed;inset:0;z-index:9600;pointer-events:none;display:none}",
    "#pt-eyelid .pl-lid{position:absolute;left:0;right:0;height:50.5%;background:#000;transform:scaleY(0);",
    "transition:transform var(--lid-dur,150ms) cubic-bezier(.65,0,.35,1)}",
    "#pt-eyelid .pl-top{top:0;transform-origin:top}",
    "#pt-eyelid .pl-bot{bottom:0;transform-origin:bottom}",
    "#pt-eyelid.shut .pl-lid{transform:scaleY(1)}",
    /* 結局「追」小框 + 三印狀態列(貼齊結果畫面金色暗調) */
    "#pt-trial-block{position:relative;z-index:3;margin-top:clamp(18px,2.6vh,28px);display:flex;flex-direction:column;align-items:center;gap:14px;opacity:0;animation:fadeUp 1s 3.3s forwards}",
    ".pt-motif-frame{display:flex;align-items:center;gap:14px;padding:10px 18px;border:1px solid rgba(217,179,106,.28);border-radius:2px;background:rgba(217,179,106,.04)}",
    ".pt-motif-frame .pmf-ch{font-family:'Noto Serif TC','Noto Serif CJK TC',serif;font-size:clamp(22px,3.4vw,30px);color:#e8c988;line-height:1;",
    "border:1px solid rgba(217,179,106,.5);padding:6px 7px;border-radius:2px;text-shadow:0 0 14px rgba(217,179,106,.35)}",
    ".pt-motif-frame .pmf-txt{display:flex;flex-direction:column;gap:4px;text-align:left}",
    ".pt-motif-frame .pmf-eyebrow{font-size:10px;letter-spacing:.3em;color:#8e7a63}",
    ".pt-motif-frame .pmf-line{font-size:clamp(12px,1.6vw,14px);letter-spacing:.08em;color:#c8b89a;line-height:1.8}",
    ".pt-seal-row{display:flex;gap:clamp(16px,2.6vw,26px);align-items:center}",
    ".pt-seal{display:flex;flex-direction:column;align-items:center;gap:5px}",
    ".pt-seal .ps-ch{font-family:'Noto Serif TC','Noto Serif CJK TC',serif;font-size:clamp(14px,2vw,18px);line-height:1;padding:5px 6px;border-radius:2px;",
    "border:1px solid rgba(142,122,99,.35);color:#6d5f4e}",
    ".pt-seal .ps-n{font-size:10px;letter-spacing:.14em;color:#6d5f4e}",
    ".pt-seal.on .ps-ch{border-color:rgba(217,179,106,.6);color:#e8c988;background:rgba(217,179,106,.07);box-shadow:0 0 12px rgba(217,179,106,.18)}",
    ".pt-seal.on .ps-n{color:#b8956a}",
    "@media (prefers-reduced-motion:reduce){#pt-trial-block{animation-duration:.01ms;animation-delay:0s}}"
  ].join("");
  (document.head || document.documentElement).appendChild(st);

  /* ── 眨眼轉場(閉眼→切換→睜眼;開跑與重跑那一拍) ── */
  var eyelid = null, blinking = false;
  function ensureEyelid() {
    if (eyelid) return;
    eyelid = document.createElement("div");
    eyelid.id = "pt-eyelid";
    eyelid.setAttribute("aria-hidden", "true");
    var top = document.createElement("div"); top.className = "pl-lid pl-top";
    var bot = document.createElement("div"); bot.className = "pl-lid pl-bot";
    eyelid.appendChild(top); eyelid.appendChild(bot);
    (document.body || document.documentElement).appendChild(eyelid);
  }
  function blink(closeMs, holdMs, openMs) {
    if (reduced() || blinking) return;
    ensureEyelid();
    blinking = true;
    eyelid.style.display = "block";
    eyelid.style.setProperty("--lid-dur", closeMs + "ms");
    void eyelid.offsetWidth;
    eyelid.classList.add("shut");
    setTimeout(function () {
      eyelid.style.setProperty("--lid-dur", openMs + "ms");
      eyelid.classList.remove("shut");
      setTimeout(function () { eyelid.style.display = "none"; blinking = false; }, openMs + 60);
    }, closeMs + holdMs);
  }
  function titleVisible() {
    var t = document.getElementById("title-screen");
    return !!(t && !t.classList.contains("hide") && t.style.display !== "none");
  }
  function maybeBlinkOnStart() {
    if (!titleVisible()) return;
    setTimeout(function () { if (!titleVisible()) blink(150, 130, 620); }, 0);
  }
  document.addEventListener("click", maybeBlinkOnStart, true);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") maybeBlinkOnStart();
  }, true);
  var retryBtn = document.getElementById("result-retry");
  if (retryBtn) retryBtn.addEventListener("click", function () { blink(150, 130, 620); }, true);

  /* ── 抱起女兒瞬間:既有慢動作(runner 內建)之後短暫定格,再正常收 ──
     canon:趕上是唯一結局方向,定格只加在「趕上」那一拍,失敗路徑不加任何演出。 */
  function storyOpen() {
    var o = document.getElementById("pt-story-overlay");
    return !!(o && o.style.display === "block");
  }
  function onCatchFreeze() {
    if (reduced()) return;
    setTimeout(function () {
      if (window.__RUN_PAUSED__) return; // 已有其他凍結(回憶 vignette / 閱讀 overlay),不搶旗
      window.__RUN_PAUSED__ = true;
      setTimeout(function () {
        if (!document.querySelector(".pact-ov") && !storyOpen()) window.__RUN_PAUSED__ = false;
      }, 480);
    }, 380);
  }
  (function wrapCatch() {
    var P = window.__PACTS__;
    if (P && typeof P.catchMoment === "function") {
      var orig = P.catchMoment;
      P.catchMoment = function () {
        try { onCatchFreeze(); } catch (e) {}
        return orig.apply(this, arguments);
      };
    }
  })();

  /* ── 跑動鏡頭呼吸感:canvas 極輕微位移(振幅漸入漸出),只在跑動中生效 ── */
  (function cameraBreath() {
    if (!window.requestAnimationFrame) return;
    var canvas = null, amp = 0, applied = false, t0 = performance.now();
    function findCanvas() {
      if (canvas && canvas.isConnected) return canvas;
      canvas = document.querySelector('canvas[aria-label="平台跑酷遊戲畫面"]') || document.querySelector("body > canvas");
      return canvas;
    }
    function tick() {
      window.requestAnimationFrame(tick);
      var hud = document.getElementById("hud");
      var active = hud && hud.style.display === "block" && !window.__RUN_PAUSED__ && !document.hidden && !reduced();
      amp += ((active ? 1 : 0) - amp) * 0.04;
      var c = findCanvas();
      if (!c) return;
      if (amp < 0.01) {
        if (applied) { c.style.transform = ""; applied = false; }
        return;
      }
      var t = (performance.now() - t0) / 1000;
      var y = Math.sin(t * 2 * Math.PI * 0.26) * 2.2 * amp;
      var x = Math.sin(t * 2 * Math.PI * 0.145 + 1.3) * 1.1 * amp;
      c.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) scale(" + (1 + 0.006 * amp).toFixed(4) + ")";
      applied = true;
    }
    window.requestAnimationFrame(tick);
  })();

  /* ── 結局畫面:「追」小框(對位首頁三道試煉卡)+ 三印狀態列(跨遊戲共用鑰匙) ── */
  function hasRen() { // 忍:LM402 至少一個結局
    try {
      var a = JSON.parse(localStorage.getItem("lm402_endings_completed_v1") || "[]");
      return Array.isArray(a) && a.length > 0;
    } catch (e) { return false; }
  }
  function hasAo() { // 熬:天堂路通關
    try { return localStorage.getItem("tiantanglu_cleared_v1") === "1"; } catch (e) { return false; }
  }
  function hasZhui() { // 追:月台全部過關(與天堂路端同一把鑰匙、同一判準;留名紀錄不算,失敗場次也能留名)
    try { return localStorage.getItem("platformRunCleared_v1") === "1"; } catch (e) { return false; }
  }

  var block = null, sealEls = null;
  function el(t, c, x) {
    var e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  }
  function buildBlock() {
    if (block) return;
    var rs = document.getElementById("result-screen");
    if (!rs) return;
    block = el("div"); block.id = "pt-trial-block";
    var frame = el("div", "pt-motif-frame");
    frame.appendChild(el("span", "pmf-ch", "追"));
    var txt = el("span", "pmf-txt");
    txt.appendChild(el("span", "pmf-eyebrow", "三道試煉 · 追"));
    txt.appendChild(el("span", "pmf-line", "在車門關上前趕到她身邊。每一次，都趕上。"));
    frame.appendChild(txt);
    block.appendChild(frame);
    var row = el("div", "pt-seal-row");
    row.setAttribute("role", "group");
    sealEls = {};
    [["忍", "LM402", "ren"], ["熬", "天堂路", "ao"], ["追", "月台", "zhui"]].forEach(function (s) {
      var seal = el("span", "pt-seal");
      seal.appendChild(el("span", "ps-ch", s[0]));
      seal.appendChild(el("span", "ps-n", s[1]));
      sealEls[s[2]] = seal;
      row.appendChild(seal);
    });
    block.appendChild(row);
    var links = rs.querySelector(".result-links");
    if (links) rs.insertBefore(block, links); else rs.appendChild(block);
  }
  function refreshSeals() {
    buildBlock();
    if (!block || !sealEls) return;
    var states = { ren: hasRen(), ao: hasAo(), zhui: hasZhui() };
    Object.keys(states).forEach(function (k) {
      sealEls[k].classList.toggle("on", states[k]);
    });
    var row = block.querySelector(".pt-seal-row");
    if (row) row.setAttribute("aria-label",
      "三道試煉印記：忍(LM402)" + (states.ren ? "已得" : "未得") +
      "、熬(天堂路)" + (states.ao ? "已得" : "未得") +
      "、追(月台)" + (states.zhui ? "已得" : "未得"));
  }
  var rs = document.getElementById("result-screen");
  if (rs && window.MutationObserver) {
    new MutationObserver(function () {
      // 延一拍再刷新:讓「全部過關」寫鑰匙的 observer 先落地,同一輪就能點亮「追」
      if (rs.classList.contains("show")) setTimeout(refreshSeals, 0);
    }).observe(rs, { attributes: true, attributeFilter: ["class"] });
  }
})();

/* ── 特大熱美:首次拾取的一次性正文回聲(引文 verbatim,只出現一生一次) ── */
(function () {
  "use strict";
  if (typeof document === "undefined" || !window.MutationObserver) return;

  var KEY = "platformRunCoffeeEcho_v1";
  function alreadyShown() {
    try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }
  function markShown() {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
  }
  if (alreadyShown()) return;

  var _rmq2 = null;
  function reduced2() {
    try {
      if (!_rmq2) _rmq2 = window.matchMedia("(prefers-reduced-motion: reduce)");
      return _rmq2.matches;
    } catch (e) { return false; }
  }

  var st = document.createElement("style");
  st.id = "pt-coffee-echo-style";
  st.textContent = [
    "#pt-coffee-echo{position:fixed;left:50%;bottom:clamp(96px,16vh,150px);transform:translateX(-50%);",
    "z-index:9500;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:6px;",
    "opacity:0;transition:opacity .9s ease,translate .9s ease;translate:0 8px;max-width:86vw;text-align:center}",
    "#pt-coffee-echo.on{opacity:1;translate:0 0}",
    "#pt-coffee-echo .pce-q{font-family:'Noto Serif TC','Noto Serif CJK TC',serif;",
    "font-size:clamp(15px,2.2vw,20px);letter-spacing:.12em;line-height:1.9;color:#e8c988;",
    "text-shadow:0 1px 10px rgba(0,0,0,.65),0 0 18px rgba(217,179,106,.22)}",
    "#pt-coffee-echo .pce-src{font-size:10px;letter-spacing:.3em;color:#8e7a63}",
    "@media (prefers-reduced-motion:reduce){#pt-coffee-echo{transition:none;translate:0 0}}"
  ].join("");
  (document.head || document.documentElement).appendChild(st);

  var shown = false;
  function showEcho() {
    if (shown) return;
    shown = true;
    markShown();
    var box = document.createElement("div");
    box.id = "pt-coffee-echo";
    box.setAttribute("role", "status");
    var q = document.createElement("span");
    q.className = "pce-q";
    q.textContent = "我握著特大熱美。";
    var src = document.createElement("span");
    src.className = "pce-src";
    src.textContent = "EP 39";
    box.appendChild(q);
    box.appendChild(src);
    (document.body || document.documentElement).appendChild(box);
    var hold = 4200;
    if (reduced2()) {
      box.classList.add("on");
      setTimeout(function () { box.remove(); }, hold);
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { box.classList.add("on"); });
      });
      setTimeout(function () {
        box.classList.remove("on");
        setTimeout(function () { box.remove(); }, 1000);
      }, hold);
    }
  }

  var notify = document.getElementById("pickup-notify");
  if (!notify) return;
  var mo = new MutationObserver(function () {
    var t = notify.textContent || "";
    if (t.indexOf("特大熱美") !== -1) {
      mo.disconnect();
      showEcho();
    }
  });
  mo.observe(notify, { childList: true, characterData: true, subtree: true });
})();
