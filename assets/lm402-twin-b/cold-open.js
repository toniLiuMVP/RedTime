// cold-open.js — LM402 冷開場：學妹 1994 第一次穿越（EP32）。
// toni 2026-06-03：玩家點進 LM402 的第一瞬間先帶入 1994 穿越的鈎子，
// 等玩家按「女兒帶你飛」（既有玄關 gate）之後，遊戲才從鐘響前 20 分鐘的意識菜市場（第二次穿越）開始。
// 純 DOM（createElement + textContent、零 innerHTML）、iOS-safe、零破折號。文案逐字對齊 reader.html EP32（女兒視角）。
// 在玄關 gate 之上播一層；首次進站 only（localStorage）；隨時可「跳過」。播完淡出 → 露出既有 gate。
(function () {
  "use strict";
  if (typeof document === "undefined" || typeof window === "undefined") return;

  var SEEN_KEY = "lm402_coldopen_seen_v1";
  try {
    // 每次進站都預設播放（toni 紀律）；只有 ?cold=0 可強制不播。播放中隨時可「快速飛過」。
    if (new URL(location.href).searchParams.get("cold") === "0") return;
  } catch (e) {}

  var reduced = false;
  try { reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  // ── 文案卡（逐字對齊 EP32；空字串＝段落間距）──
  // auto：ms 後自動推進；0＝等輕觸。fx：'pulse'｜'cool'｜'beat'｜'rebound'。
  var CARDS = [
    { lines: ["把拔說過：", "愛因斯坦指出有一種世界，", "當離這個世界中心越近，時間就會過得越慢。", "", "那個我喊她阿姨的女生，好像永遠不會被時間追上。"], auto: 0 },
    { kicker: "1994 · 阿姨高三的那個夏天", lines: ["禮堂喇叭放著畢業歌，", "第一個長音「傷離別～」在梁上盤旋。", "", "綠色布告欄前，她的名字被一封封情書寫滿，", "外圈密密畫著愛心。"], auto: 0 },
    { lines: ["廣播響起，點了她的座號：請立刻到訓導處。", "同學起鬨、偷笑、吹口哨。", "", "她心裡卻很安靜：", "關我什麼事？為什麼我要被約談？", "", "她伸出食指，把情書的紙角輕輕壓平，卻沒有撕下來。", "", "她不願讓喧鬧，替她下定義。"], auto: 0 },
    { lines: ["訓導處外的長椅，她安靜坐著。", "她把指尖貼在脈搏上，像在搜尋命運的密碼：", "", "如果命中注定會遇見那個人，他現在在哪裡？", "", "紅線，在她體內亮了一下。", "畢業歌聲，被拉成一條銀線。"], auto: 0, fx: "pulse" },
    { kicker: "2005 · LM402 教室後門", lines: ["走廊的冷白燈，在地上鋪了一層溫柔的灰。", "後門被推開，一個人影逆光走來。", "", "她是二十九歲的身體，裝著十八歲的意識。", "", "她抬眼，看見，只是看見。"], auto: 0, fx: "cool" },
    { lines: ["。"], auto: reduced ? 1200 : 1900, big: "。", fx: "cool" },
    { lines: ["無台詞，無走位，世界退到安靜的一格。", "", "我以為過了一分鐘，其實，只過了一秒。"], auto: reduced ? 2600 : 4200, fx: "cool" },
    { lines: ["她聽見自己心裡：", "是他。", "原來是你。"], auto: reduced ? 2000 : 2800, fx: "cool" },
    { lines: ["咚、咚、咚、", "咚、咚、", "咚。"], auto: reduced ? 2200 : 3200, big: "咚", fx: "beat" },
    { lines: ["還沒來得及開口，", "紅線先一步回彈，把她拉了回去。"], auto: reduced ? 2400 : 3400, fx: "rebound" },
    { lines: ["那一眼，她沒能說完。", "", "這一次，換你陪她飛回去。", "落地的那一刻，是鐘響前二十分鐘。"], auto: 0, cont: true },
  ];

  function injectStyle() {
    if (document.getElementById("cold-open-style")) return;
    var s = document.createElement("style");
    s.id = "cold-open-style";
    s.textContent = [
      "#cold-open{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;",
      "background:#04030a;color:#f2e6d0;font-family:'Noto Serif TC','PingFang TC',serif;text-align:center;padding:28px;opacity:0;transition:opacity 1s ease;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}",
      "#cold-open.show{opacity:1}",
      "#cold-open.cool{color:#e7eef4;background:#05070d}",
      "#cold-open::before,#cold-open::after{content:'';position:fixed;left:0;right:0;height:8.5vh;background:#000;z-index:3;pointer-events:none;transition:height 1s cubic-bezier(.4,0,.2,1)}",
      "#cold-open.squeeze::before,#cold-open.squeeze::after{height:12.5vh}",
      "#cold-open::before{top:0}#cold-open::after{bottom:0}",
      "#co-kicker{font-size:12px;letter-spacing:.28em;color:#ffd9a8;opacity:.8;margin-bottom:1.1em;min-height:1.2em;transition:opacity .8s ease}",
      "#cold-open.cool #co-kicker{color:#9fd0ff}",
      "#co-text{max-width:660px;line-height:2.05;font-size:clamp(15px,2.3vw,20px);text-shadow:0 0 16px rgba(255,200,150,.18);transition:opacity .85s ease}",
      "#cold-open.cool #co-text{text-shadow:0 0 16px rgba(150,200,255,.18)}",
      "#co-text .co-ln{display:block;min-height:.4em}",
      "#co-text .co-big{display:block;font-size:clamp(30px,6vw,52px);letter-spacing:.14em;margin:.3em 0;text-shadow:0 0 28px rgba(255,210,160,.5)}",
      "#cold-open.cool #co-text .co-big{text-shadow:0 0 30px rgba(170,200,255,.55)}",
      "#co-thread{position:fixed;top:50%;left:18%;right:18%;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,#e4d2b0,transparent);opacity:.22;transform:scaleX(.55);transform-origin:left center;box-shadow:0 0 8px rgba(220,200,160,.4);z-index:2;transition:opacity 1s ease,transform 1.2s cubic-bezier(.5,0,.3,1),background .8s ease,box-shadow .4s ease;pointer-events:none}",
      "#cold-open.thread-on #co-thread{opacity:.85;transform:scaleX(1);background:linear-gradient(90deg,transparent,#c0392b,#ff6b5a,#c0392b,transparent);box-shadow:0 0 14px rgba(220,70,60,.7)}",
      "#cold-open.rebound #co-thread{transform:scaleX(0);transform-origin:right center;opacity:.3;transition:opacity .9s ease,transform .9s cubic-bezier(.6,0,.4,1)}",
      "#co-pulse{position:fixed;top:50%;left:50%;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle,#fff,#ffb6a0);box-shadow:0 0 18px rgba(255,140,120,.85);transform:translate(-50%,-50%) scale(0);opacity:0;z-index:2;transition:opacity .8s ease;pointer-events:none}",
      "#cold-open.pulse-on #co-pulse{opacity:1;animation:coPulse .9s ease-in-out infinite}",
      "@keyframes coPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.18)}}",
      "#cold-open.beat #co-text .co-big{animation:coBeat .5s ease}",
      "@keyframes coBeat{0%{transform:scale(1)}30%{transform:scale(1.12);text-shadow:0 0 40px rgba(255,120,110,.8)}100%{transform:scale(1)}}",
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

  function run() {
    injectStyle();
    var ov = document.createElement("div");
    ov.id = "cold-open";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-label", "LM402 開場");
    var thread = mk("div", "", ""); thread.id = "co-thread"; thread.setAttribute("aria-hidden", "true");
    var pulse = mk("div", "", ""); pulse.id = "co-pulse"; pulse.setAttribute("aria-hidden", "true");
    var kicker = mk("div", "", ""); kicker.id = "co-kicker";
    var text = mk("div", "", ""); text.id = "co-text"; text.setAttribute("aria-live", "polite");
    var cont = document.createElement("button"); cont.id = "co-cont"; cont.type = "button"; cont.textContent = "繼續";
    var skip = document.createElement("button"); skip.id = "co-skip"; skip.type = "button"; skip.textContent = "快速飛過";
    var hint = mk("div", "", "輕觸繼續"); hint.id = "co-hint"; hint.setAttribute("aria-hidden", "true");
    ov.appendChild(thread); ov.appendChild(pulse); ov.appendChild(kicker); ov.appendChild(text); ov.appendChild(cont); ov.appendChild(skip); ov.appendChild(hint);
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add("show"); });

    var i = -1, done = false, autoTimer = 0, hintTimer = 0;
    var actx = null;
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
      try { if (navigator.vibrate) navigator.vibrate([24, 90, 36]); } catch (e) {}
      tryTone(58, 0.16, 0.06); setTimeout(function () { tryTone(44, 0.2, 0.045); }, 150);
    }

    function clearHint() { hint.classList.remove("show"); if (hintTimer) { clearTimeout(hintTimer); hintTimer = 0; } }
    function armHint() { clearHint(); hintTimer = setTimeout(function () { if (!done) hint.classList.add("show"); }, 2400); }

    function render(card) {
      // fade out then swap
      kicker.style.opacity = "0"; text.style.opacity = "0";
      setTimeout(function () {
        if (done) return;
        kicker.textContent = card.kicker || "";
        while (text.firstChild) text.removeChild(text.firstChild);
        card.lines.forEach(function (ln) {
          var el = mk("span", "co-ln", null);
          if (card.big && ln.indexOf(card.big) !== -1 && (ln === card.big || card.big === "。" || card.big === "咚")) { el.className = "co-big"; }
          el.textContent = ln;
          text.appendChild(el);
        });
        if (card.fx === "cool" || card.fx === "beat" || card.fx === "rebound") ov.classList.add("cool");
        if (card.fx === "pulse") { ov.classList.add("thread-on", "pulse-on"); }
        if (card.fx === "beat") { ov.classList.add("beat"); heartbeat(); setTimeout(heartbeat, 760); setTimeout(heartbeat, 1320); }
        if (card.fx === "rebound") { ov.classList.add("rebound"); }
        if (card.big === "。") ov.classList.add("squeeze"); else ov.classList.remove("squeeze");
        kicker.style.opacity = "1"; text.style.opacity = "1";
      }, 380);
    }

    function next() {
      if (done) return;
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = 0; }
      i++;
      if (i >= CARDS.length) { return; } // 最後一張靠 cont 按鈕結束
      var card = CARDS[i];
      render(card);
      cont.classList.toggle("show", !!card.cont);
      if (card.auto > 0) { autoTimer = setTimeout(next, card.auto + 420); }
      else if (!card.cont) { armHint(); }
      else { clearHint(); }
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
      if (e.target === skip || e.target === cont) return; // 按鈕自己處理
      var card = CARDS[i];
      if (card && card.auto > 0) return;   // 自動推進的拍不吃輕觸
      clearHint();
      next();
    }
    ov.addEventListener("click", onTap);
    skip.addEventListener("click", function (e) { e.stopPropagation(); finish(); });
    cont.addEventListener("click", function (e) { e.stopPropagation(); finish(); });

    next(); // 第一張
  }

  function mk(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
