// cold-open.js — 天堂路 全黑開場序幕(文案 toni 親寫,逐字)。
// 點進天堂路第一畫面:全黑逐句把玩家帶進故事世界(提早入伍 → 海陸 → 11 個月天堂路),
// 「每當我閉上眼睛，我就可以看見妳。」首尾包夾。播完淡出 → 露出軍營進場畫面。
// 純 DOM(createElement + textContent、零 innerHTML)、iOS-safe、零破折號。每次進站播;隨時可跳過(?cold=0 可關)。
(function () {
  "use strict";
  if (typeof document === "undefined" || typeof window === "undefined") return;
  try { if (new URL(location.href).searchParams.get("cold") === "0") return; } catch (e) {}

  // ── 文案卡(toni 親寫,逐字;空字串＝段落間距)。auto:ms 後自動推進;0＝等輕觸 ──
  var CARDS = [
    { lines: ["「每當我閉上眼睛，我就可以看見妳。」"], auto: 0 },
    { lines: ["那年，我真的太傷心了。", "", "原本以為可以跟妳白頭偕老的。"], auto: 0 },
    { lines: ["我到了區公所，是要跟兵役課說：", "「請幫我辦理提早入伍。」"], auto: 0 },
    { lines: ["里長幫我代抽的籤：海軍陸戰隊。"], auto: 0 },
    { lines: ["新訓大廳，連長說：「要參加兩棲蛙人的舉手。」", "", "我從前門走出去，又從後門走回來。", "", "因為我想到不會游泳應該會出事。"], auto: 0 },
    { lines: ["但是在這11個月裡，每天都過得很精實。"], auto: 0 },
    { lines: ["計算砲點全連第一名。", "比腕力全連第一名。", "三千公尺12分鐘。", "精神答數用吼的。", "退伍時，體脂肪只有8%。"], auto: 0 },
    { lines: ["這是一段，屬於我人生的天堂路。"], auto: 0 },
    { lines: ["「每當我閉上眼睛，我就可以看見妳。」"], auto: 0, cont: true },
  ];

  function injectStyle() {
    if (document.getElementById("co-style")) return;
    var s = document.createElement("style");
    s.id = "co-style";
    s.textContent = [
      "#cold-open{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;",
      "background:#04030a;color:#f2e6d0;font-family:'Noto Serif TC','PingFang TC',serif;text-align:center;padding:28px;opacity:0;transition:opacity 1s ease;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}",
      "#cold-open.show{opacity:1}",
      "#cold-open::before,#cold-open::after{content:'';position:fixed;left:0;right:0;height:8.5vh;background:#000;z-index:3;pointer-events:none}",
      "#cold-open::before{top:0}#cold-open::after{bottom:0}",
      "#co-text{max-width:660px;line-height:2.05;font-size:clamp(15px,2.3vw,20px);text-shadow:0 0 16px rgba(255,200,150,.18);transition:opacity .85s ease}",
      "#co-text .co-ln{display:block;min-height:.4em}",
      "#co-skip{position:fixed;top:calc(8.5vh + 14px);right:18px;z-index:5;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.2);color:#cbb;border-radius:999px;font:300 12px/1 'Noto Sans TC',sans-serif;letter-spacing:.1em;padding:8px 16px;cursor:pointer;transition:all .3s ease}",
      "#co-skip:hover{background:rgba(255,255,255,.14);color:#fff}",
      "#co-cont{margin-top:1.8em;background:rgba(255,255,255,.06);border:1px solid rgba(255,200,150,.35);color:#f4ece2;border-radius:999px;font:300 15px/1 'Noto Serif TC',serif;letter-spacing:.08em;padding:13px 28px;cursor:pointer;opacity:0;transition:opacity .9s ease,background .3s,transform .3s}",
      "#co-cont.show{opacity:1}",
      "#co-cont:hover{background:rgba(255,200,150,.16);transform:translateY(-2px)}",
      "#co-hint{position:fixed;bottom:calc(8.5vh + 16px);left:0;right:0;text-align:center;z-index:5;font:300 12px/1 'Noto Sans TC',sans-serif;letter-spacing:.16em;color:#998;opacity:0;transition:opacity .6s ease;pointer-events:none}",
      "#co-hint.show{opacity:.6}",
    ].join("");
    document.head.appendChild(s);
  }

  function mk(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function run() {
    injectStyle();
    var ov = document.createElement("div");
    ov.id = "cold-open"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "天堂路 開場");
    var text = mk("div", "", ""); text.id = "co-text"; text.setAttribute("aria-live", "polite");
    var cont = document.createElement("button"); cont.id = "co-cont"; cont.type = "button"; cont.textContent = "繼續";
    var skip = document.createElement("button"); skip.id = "co-skip"; skip.type = "button"; skip.textContent = "快速飛過";
    var hint = mk("div", "", "輕觸繼續"); hint.id = "co-hint"; hint.setAttribute("aria-hidden", "true");
    ov.appendChild(text); ov.appendChild(cont); ov.appendChild(skip); ov.appendChild(hint);
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add("show"); });

    var i = -1, done = false, autoTimer = 0, hintTimer = 0;
    function clearHint() { hint.classList.remove("show"); if (hintTimer) { clearTimeout(hintTimer); hintTimer = 0; } }
    function armHint() { clearHint(); hintTimer = setTimeout(function () { if (!done) hint.classList.add("show"); }, 2400); }
    function render(card) {
      text.style.opacity = "0";
      setTimeout(function () {
        if (done) return;
        while (text.firstChild) text.removeChild(text.firstChild);
        card.lines.forEach(function (ln) { text.appendChild(mk("span", "co-ln", ln)); });
        text.style.opacity = "1";
      }, 380);
    }
    function next() {
      if (done) return;
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = 0; }
      i++;
      if (i >= CARDS.length) return;   // 最後一張靠 cont 按鈕結束
      var card = CARDS[i];
      render(card);
      cont.classList.remove("show");
      if (card.cont) setTimeout(function () { cont.classList.add("show"); }, 1800);   // bookend 命脈句先在純黑裡獨處 ~1.8s,按鈕後到不搶收束拍
      if (card.auto > 0) autoTimer = setTimeout(next, card.auto + 420);
      else if (!card.cont) armHint();
      else clearHint();
    }
    function finish() {
      if (done) return; done = true;
      if (autoTimer) clearTimeout(autoTimer);
      clearHint();
      ov.removeEventListener("click", onTap);
      ov.style.opacity = "0";
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 1050);
    }
    function onTap(e) {
      if (done) return;
      if (e.target === skip || e.target === cont) return;   // 按鈕自己處理
      var card = CARDS[i];
      if (card && card.auto > 0) return;   // 自動推進的拍不吃輕觸
      clearHint(); next();
    }
    ov.addEventListener("click", onTap);
    skip.addEventListener("click", function (e) { e.stopPropagation(); finish(); });
    cont.addEventListener("click", function (e) { e.stopPropagation(); finish(); });

    next();   // 第一張
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
