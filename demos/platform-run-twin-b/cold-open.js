// cold-open.js — 月台上的狂奔 冷開場：女兒倒敘飛回去看把拔月台狂奔（EP36）。
// toni 2026-06-03：月台其實是女兒飛回過去回頭看的視角（倒敘）。點「開始」前先放鈎子，
// 讓沒讀過故事的人也懂：他為什麼跑、為什麼永遠不會放棄。融入 EP16「我現在都叫你一聲爸」。
// 純 DOM（createElement + textContent、零 innerHTML）、iOS-safe、零破折號。文案逐字對齊 reader.html EP36 + EP16。
// 在標題畫面之上播一層；首次進站 only（localStorage）；隨時可「跳過」。播完淡出 → 露出既有標題畫面。
(function () {
  "use strict";
  if (typeof document === "undefined" || typeof window === "undefined") return;

  var SEEN_KEY = "pt_coldopen_seen_v1";
  try {
    // 每次進站都預設播放（toni 紀律）；只有 ?cold=0 可強制不播。播放中隨時可「快速飛過」。
    if (new URL(location.href).searchParams.get("cold") === "0") return;
  } catch (e) {}

  var reduced = false;
  try { reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  // auto：ms 後自動推進；0＝等輕觸。fx：'soft'（一拳一拳的輕心跳）｜'thread'｜'beat'。big：放大的關鍵字。
  var CARDS = [
    // EP16「一拳一拳」女兒對把拔的獨白（toni 原文，一句一拳，輕輕打進心裡）
    { lines: ["「把拔，", "今天我可以在你的房間睡覺嗎？」"], auto: 0, fx: "soft" },
    { lines: ["「把拔，", "其實我幼稚園的時候，", "我就知道你跟我的媽媽分開了。」"], auto: 0, fx: "soft" },
    { lines: ["「把拔，我知道你對我很好。", "我們去吃火鍋超市，一顆蛤蜊 50 元，", "我想吃三顆，你也會買給我，", "然後三顆都被我現場吃掉。」"], auto: 0, fx: "soft" },
    { lines: ["「把拔，我一直記得你跟我說，", "你永遠都不會打我的。", "但如果我是男生，你就會叫我跪下。", "還好我是女生 😚」"], auto: 0, fx: "soft" },
    { lines: ["「把拔，我知道你很搞笑，", "也知道你是想讓我開心才不顧形象。", "但自從上次看到你跟那個阿姨，", "我知道你不用再特地為我講好笑的話了。」"], auto: 0, fx: "soft" },
    { lines: ["「把拔，我知道小時候我常常去敲你的房門。", "雖然你很胖，", "但在你旁邊，我每次都可以睡到打呼。」"], auto: 0, fx: "soft" },
    { lines: ["「把拔，我只是想跟你說，不用擔心我。", "我很兇，不會被欺負的。」"], auto: 0, fx: "soft" },
    { lines: ["「把拔，也謝謝你在我小時候有陪我。", "我都記得。」"], auto: 0, fx: "soft" },
    { lines: ["「把拔，其實現在的我，", "已經不叫你「把拔」了。", "我現在，都直接叫你一聲「爸」。」"], auto: 0, big: "爸", fx: "soft" },
    // 從長大的我，飛回去看小時候的他（EP36 倒敘）
    { lines: ["可是今天晚上，我好想回去看看小時候的他。", "", "「命運阿嬤，我可以去找小時候的自己嗎？」"], auto: 0, fx: "thread" },
    { kicker: "2018 · 大班 · 台中火車站", lines: ["我大班，背著粉紅色的小背包，站在月台上。", "", "南下的列車停了。有一個人，從一號車廂衝了出來。"], auto: 0, fx: "thread" },
    { lines: ["那是把拔。又胖又喘，背著一個好大的包，用力地跑。", "", "北上的自強號也進站了。他必須在門關上之前，把我抱上車。"], auto: 0, fx: "thread" },
    { lines: ["在門快要關上的前兩秒，他趕上了。", "", "「我趕上了。」他一邊喘，一邊笑。"], auto: reduced ? 2400 : 3400, big: "我趕上了", fx: "beat" },
    { lines: ["只要他還願意在月台上那樣用力地跑，", "我們之間，就還有一條拉得再長也不會斷的線。"], auto: reduced ? 2600 : 3800, fx: "thread" },
    { lines: ["不管多趕、多累，他都要「每一次都趕上」。", "", "你會用他的肺呼吸，用他的腿跑。", "這一次，換你陪他，每一次都趕上。"], auto: 0, cont: true },
  ];

  function injectStyle() {
    if (document.getElementById("ptco-style")) return;
    var s = document.createElement("style");
    s.id = "ptco-style";
    s.textContent = [
      "#ptco{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;",
      "background:#06050a;color:#f4ece2;font-family:'Noto Serif TC','PingFang TC',serif;text-align:center;padding:28px;opacity:0;transition:opacity 1s ease;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}",
      "#ptco.show{opacity:1}",
      "#ptco::before,#ptco::after{content:'';position:fixed;left:0;right:0;height:8.5vh;background:#000;z-index:3;pointer-events:none}",
      "#ptco::before{top:0}#ptco::after{bottom:0}",
      "#ptco-kicker{font-size:12px;letter-spacing:.28em;color:#9fd0ff;opacity:.8;margin-bottom:1.1em;min-height:1.2em;transition:opacity .8s ease}",
      "#ptco-text{max-width:660px;line-height:2.05;font-size:clamp(15px,2.3vw,20px);text-shadow:0 0 16px rgba(255,200,180,.2);transition:opacity .85s ease}",
      "#ptco-text .ptco-ln{display:block;min-height:.4em}",
      "#ptco-text .ptco-big{display:block;font-size:clamp(28px,5.5vw,48px);letter-spacing:.12em;margin:.3em 0;text-shadow:0 0 28px rgba(255,150,180,.5)}",
      // 粉紅紅線（女兒與把拔的線是粉紅色，EP36）
      "#ptco-thread{position:fixed;top:50%;left:16%;right:16%;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,#ff9ec2,transparent);opacity:0;transform:scaleX(.4);transform-origin:center;box-shadow:0 0 10px rgba(255,140,180,.5);z-index:2;transition:opacity 1s ease,transform 1.2s cubic-bezier(.5,0,.3,1),box-shadow .4s ease;pointer-events:none}",
      "#ptco.thread-on #ptco-thread{opacity:.85;transform:scaleX(1);background:linear-gradient(90deg,transparent,#ff6b9d,#ffd9e6,#ff6b9d,transparent);box-shadow:0 0 16px rgba(255,107,157,.75)}",
      "#ptco.beat #ptco-text .ptco-big{animation:ptcoBeat .5s ease}",
      "@keyframes ptcoBeat{0%{transform:scale(1)}30%{transform:scale(1.12);text-shadow:0 0 40px rgba(255,140,170,.85)}100%{transform:scale(1)}}",
      "#ptco.beat::before,#ptco.beat::after{animation:ptcoBite .62s ease}",
      "@keyframes ptcoBite{0%,100%{height:8.5vh}45%{height:calc(8.5vh + 7px)}}",
      "#ptco-skip{position:fixed;top:calc(8.5vh + 14px);right:18px;z-index:5;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.2);color:#cbb;border-radius:999px;font:300 12px/1 'Noto Sans TC',sans-serif;letter-spacing:.1em;padding:8px 16px;cursor:pointer;transition:all .3s ease}",
      "#ptco-skip:hover{background:rgba(255,255,255,.14);color:#fff}",
      "#ptco-cont{margin-top:1.8em;background:rgba(255,255,255,.06);border:1px solid rgba(255,180,200,.4);color:#f4ece2;border-radius:999px;font:300 15px/1 'Noto Serif TC',serif;letter-spacing:.08em;padding:13px 28px;cursor:pointer;opacity:0;transition:opacity .9s ease,background .3s,transform .3s}",
      "#ptco-cont.show{opacity:1}",
      "#ptco-cont:hover{background:rgba(255,180,200,.16);transform:translateY(-2px)}",
      "#ptco-hint{position:fixed;bottom:calc(8.5vh + 16px);left:0;right:0;text-align:center;z-index:5;font:300 12px/1 'Noto Sans TC',sans-serif;letter-spacing:.16em;color:#998;opacity:0;transition:opacity .6s ease;pointer-events:none}",
      "#ptco-hint.show{opacity:.6}",
    ].join("");
    document.head.appendChild(s);
  }

  function mk(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function run() {
    injectStyle();
    var ov = mk("div"); ov.id = "ptco"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "月台上的狂奔 開場");
    var thread = mk("div"); thread.id = "ptco-thread"; thread.setAttribute("aria-hidden", "true");
    var kicker = mk("div"); kicker.id = "ptco-kicker";
    var text = mk("div"); text.id = "ptco-text"; text.setAttribute("aria-live", "polite");
    var cont = mk("button"); cont.id = "ptco-cont"; cont.type = "button"; cont.textContent = "替他跑";
    var skip = mk("button"); skip.id = "ptco-skip"; skip.type = "button"; skip.textContent = "快速飛過";
    var hint = mk("div", "", "輕觸繼續"); hint.id = "ptco-hint"; hint.setAttribute("aria-hidden", "true");
    ov.appendChild(thread); ov.appendChild(kicker); ov.appendChild(text); ov.appendChild(cont); ov.appendChild(skip); ov.appendChild(hint);
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add("show"); });

    var i = -1, done = false, autoTimer = 0, hintTimer = 0, actx = null, gestured = false;
    function tryTone(freq, dur, vol) {
      try {
        if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); }
        if (!actx) return;
        if (actx.state === "suspended" && actx.resume) actx.resume();
        var now = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        o.connect(g); g.connect(actx.destination); o.start(now); o.stop(now + dur + 0.05);
      } catch (e) {}
    }
    function heartbeat() {
      try { if (gestured && navigator.vibrate) navigator.vibrate([24, 90, 36]); } catch (e) {}
      tryTone(58, 0.16, 0.06); setTimeout(function () { tryTone(44, 0.2, 0.045); }, 150);
    }
    function clearHint() { hint.classList.remove("show"); if (hintTimer) { clearTimeout(hintTimer); hintTimer = 0; } }
    function armHint() { clearHint(); hintTimer = setTimeout(function () { if (!done) hint.classList.add("show"); }, 2400); }

    function render(card) {
      kicker.style.opacity = "0"; text.style.opacity = "0";
      setTimeout(function () {
        if (done) return;
        kicker.textContent = card.kicker || "";
        while (text.firstChild) text.removeChild(text.firstChild);
        card.lines.forEach(function (ln) {
          var el = mk("span", "ptco-ln", null);
          if (card.big && ln.indexOf(card.big) !== -1 && (ln === card.big || ln.indexOf("「" + card.big + "」") !== -1)) el.className = "ptco-big";
          el.textContent = ln;
          text.appendChild(el);
        });
        if (card.fx === "soft" && gestured) { try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) {} tryTone(56, 0.14, 0.045); } // 一拳一拳：每句一記輕輕的心跳（首句靜默，從第二句起才響）
        if (card.fx === "thread") ov.classList.add("thread-on");
        if (card.fx === "beat") { ov.classList.add("thread-on", "beat"); heartbeat(); setTimeout(heartbeat, 760); setTimeout(heartbeat, 1320); }
        kicker.style.opacity = "1"; text.style.opacity = "1";
      }, 380);
    }

    function next() {
      if (done) return;
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = 0; }
      i++;
      if (i >= CARDS.length) return;
      var card = CARDS[i];
      render(card);
      cont.classList.toggle("show", !!card.cont);
      if (card.auto > 0) autoTimer = setTimeout(next, card.auto + 420);
      else if (!card.cont) armHint();
      else clearHint();
    }

    function finish() {
      if (done) return; done = true;
      try { localStorage.setItem(SEEN_KEY, "1"); } catch (e) {}
      if (autoTimer) clearTimeout(autoTimer);
      clearHint();
      ov.removeEventListener("click", onTap);
      ov.style.opacity = "0";
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 1050);
    }

    function onTap(e) {
      if (done) return;
      gestured = true;
      if (e.target === skip || e.target === cont) return;
      var card = CARDS[i];
      if (card && card.auto > 0) return;
      clearHint();
      next();
    }
    ov.addEventListener("click", onTap);
    skip.addEventListener("click", function (e) { e.stopPropagation(); finish(); });
    cont.addEventListener("click", function (e) { e.stopPropagation(); finish(); });

    next();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
