// blink-patch.js — 眨眼轉場(上下眼瞼開合;世界在闔眼時切換)
// 對外:window.__BLINK__(closeMs, holdMs, openMs, midFn)
//   closeMs 閉眼、holdMs 全黑停留(midFn 在此刻執行)、openMs 睜眼。
// prefers-reduced-motion 時退為單層淡入淡出(不做眼瞼位移)。
// 純 DOM、pointer-events:none、aria-hidden,不攔截任何輸入。
(function () {
  "use strict";
  var active = false;
  var wrap = null, lidTop = null, lidBot = null, fade = null;

  function reducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) { return false; }
  }

  function ensure() {
    if (wrap) return;
    var s = document.createElement("style");
    s.id = "blink-patch-style";
    s.textContent = [
      "#blink-lids{position:fixed;inset:0;z-index:9400;pointer-events:none;display:none}",
      "#blink-lids.on{display:block}",
      "#blink-lids .blink-lid{position:absolute;left:0;right:0;height:51vh;background:#020204;transition:transform .3s cubic-bezier(.6,.05,.4,1);will-change:transform}",
      "#blink-lids .blink-lid.top{top:0;transform:translateY(-102%);border-radius:0 0 46% 46%/0 0 9vh 9vh}",
      "#blink-lids .blink-lid.bot{bottom:0;transform:translateY(102%);border-radius:46% 46% 0 0/9vh 9vh 0 0}",
      "#blink-lids.closed .blink-lid{transform:translateY(0)}",
      "#blink-lids .blink-fade{position:absolute;inset:0;background:#020204;opacity:0;transition:opacity .26s ease;display:none}",
      "#blink-lids.closed .blink-fade{opacity:1}",
      "#blink-lids.rm .blink-lid{display:none}",
      "#blink-lids.rm .blink-fade{display:block}",
    ].join("");
    document.head.appendChild(s);
    wrap = document.createElement("div");
    wrap.id = "blink-lids";
    wrap.setAttribute("aria-hidden", "true");
    lidTop = document.createElement("div");
    lidTop.className = "blink-lid top";
    lidBot = document.createElement("div");
    lidBot.className = "blink-lid bot";
    fade = document.createElement("div");
    fade.className = "blink-fade";
    wrap.appendChild(lidTop);
    wrap.appendChild(lidBot);
    wrap.appendChild(fade);
    document.body.appendChild(wrap);
  }

  function setDur(ms) {
    var v = ms + "ms";
    lidTop.style.transitionDuration = v;
    lidBot.style.transitionDuration = v;
    fade.style.transitionDuration = v;
  }

  window.__BLINK__ = function (closeMs, holdMs, openMs, midFn) {
    // 已有一次眨眼進行中:不疊加,直接執行切換,保證 midFn 一定被呼叫
    if (active) {
      if (typeof midFn === "function") { try { midFn(); } catch (e) {} }
      return;
    }
    active = true;
    try { ensure(); } catch (e) {
      active = false;
      if (typeof midFn === "function") { try { midFn(); } catch (e2) {} }
      return;
    }
    var rm = reducedMotion();
    var cMs = Math.max(80, closeMs || 300);
    var oMs = Math.max(80, openMs || 420);
    var hMs = Math.max(0, holdMs == null ? 120 : holdMs);
    if (rm) { cMs = Math.min(cMs, 220); oMs = Math.min(oMs, 260); }
    wrap.classList.toggle("rm", rm);
    wrap.classList.add("on");
    setDur(cMs);
    // 時序鏈用 setTimeout 驅動(分頁在背景時 rAF 會凍結,不能拿它擋住 midFn);
    // rAF 只負責讓 class 切換發生在下一個 paint,拿到 transition。
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { wrap.classList.add("closed"); });
    });
    setTimeout(function () {
      wrap.classList.add("closed"); // 背景分頁 rAF 沒跑到也保底(重複 add 無害)
      if (typeof midFn === "function") { try { midFn(); } catch (e) {} }
      setTimeout(function () {
        setDur(oMs);
        wrap.classList.remove("closed");
        setTimeout(function () {
          wrap.classList.remove("on");
          active = false;
        }, oMs + 80);
      }, hMs);
    }, cMs + 60);
  };
})();
