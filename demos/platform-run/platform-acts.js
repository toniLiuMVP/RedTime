// platform-acts.js · 月台父女記憶 vignettes
// 純 DOM(iOS-safe)、零 innerHTML、韓劇暗調。對外:window.__PACTS__
// EP36(廚房門/捷運天空/月台狂奔)、EP37(透明片/不能穿越)、EP30(13 歲離家)。

(function () {
  "use strict";
  function el(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

  // P1-7 月台 vignette 專用 SFX：水聲白噪 + lowpass（壓掉人聲，打開才聽見）、倒帶升頻 whoosh。
  // iOS-safe：lazy AudioContext（gesture 內 resume）、尊重靜音鈕（window.__PT_AUDIO_OK__）。
  var PSFX = (function () {
    var ctx = null;
    function audioOK() { try { if (typeof window.__PT_AUDIO_OK__ === "function") return !!window.__PT_AUDIO_OK__(); } catch (e) {} return true; }
    function ensure() {
      if (!audioOK()) return null;
      try {
        if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
        if (ctx.state === "suspended" && ctx.resume) ctx.resume();
      } catch (e) { return null; }
      return ctx;
    }
    // 水聲白噪 + lowpass：回傳 { open, stop }。open()＝lowpass 打開、水聲退去、人聲浮現。
    function waterVeil() {
      var c = ensure();
      var noop = { open: function () {}, stop: function () {} };
      if (!c) return noop;
      try {
        var len = Math.floor(c.sampleRate * 2), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        var src = c.createBufferSource(); src.buffer = buf; src.loop = true;
        var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 480; // 水聲悶住人聲
        var g = c.createGain(); g.gain.value = 0.05;
        src.connect(lp); lp.connect(g); g.connect(c.destination); src.start();
        return {
          open: function () {
            try {
              var now = c.currentTime;
              lp.frequency.cancelScheduledValues(now); lp.frequency.setValueAtTime(lp.frequency.value, now);
              lp.frequency.exponentialRampToValueAtTime(7000, now + 1.4);
              g.gain.setValueAtTime(g.gain.value, now); g.gain.exponentialRampToValueAtTime(0.013, now + 1.6);
            } catch (e) {}
          },
          stop: function () { try { var now = c.currentTime; g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5); src.stop(now + 0.65); } catch (e) {} }
        };
      } catch (e) { return noop; }
    }
    // 倒帶升頻 whoosh（女兒能倒帶＝時間回去）
    function sweepUp() {
      var c = ensure(); if (!c) return;
      try {
        var now = c.currentTime, o = c.createOscillator(), g = c.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(220, now); o.frequency.exponentialRampToValueAtTime(1400, now + 0.5);
        g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.045, now + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
        o.connect(g); g.connect(c.destination); o.start(now); o.stop(now + 0.62);
      } catch (e) {}
    }
    return { ensure: ensure, waterVeil: waterVeil, sweepUp: sweepUp };
  })();

  // #7 紅線色溫：把拔與女兒之間那條「拉得再長也不會斷」的線（EP36）。
  // 讀 runner 寫的 window.__PT_BOND__（0 遠 → 1 近）：越近越暖越亮。純頂端細線（z-index 60），不擋遊戲畫面；暫停/未跑時隱藏。
  (function redlineBond() {
    if (typeof window === "undefined" || typeof document === "undefined" || !window.requestAnimationFrame) return;
    var wrap = null, line = null, knotL = null, knotR = null, label = null, _labelShown = false;
    function ensure() {
      if (wrap) return;
      var st = document.createElement("style");
      st.id = "pt-bond-style";
      st.textContent = "#pt-bond{position:fixed;top:6px;left:20%;right:20%;height:16px;z-index:60;pointer-events:none;opacity:0;transition:opacity .6s ease}"
        + "#pt-bond .pb-line{position:absolute;top:6px;left:0;right:0;height:3px;border-radius:2px;background:#e4463c;transition:background .3s,box-shadow .3s,height .3s}"
        + "#pt-bond .pb-knot{position:absolute;top:1px;width:11px;height:11px;border-radius:50%;background:#fff;transition:box-shadow .3s}"
        + "#pt-bond .pb-l{left:-5px}#pt-bond .pb-r{right:-5px}"
        + "#pt-bond .pb-label{position:absolute;top:18px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;letter-spacing:.12em;color:#ffd9b0;text-shadow:0 1px 3px rgba(0,0,0,.7);opacity:0;transition:opacity 1s ease}";
      document.head.appendChild(st);
      wrap = document.createElement("div"); wrap.id = "pt-bond"; wrap.setAttribute("aria-hidden", "true");
      line = document.createElement("div"); line.className = "pb-line";
      knotL = document.createElement("div"); knotL.className = "pb-knot pb-l";
      knotR = document.createElement("div"); knotR.className = "pb-knot pb-r";
      label = document.createElement("div"); label.className = "pb-label"; label.textContent = "這條紅線，拉多遠都不會斷";
      wrap.appendChild(line); wrap.appendChild(knotL); wrap.appendChild(knotR); wrap.appendChild(label);
      (document.body || document.documentElement).appendChild(wrap);
    }
    function tick() {
      window.requestAnimationFrame(tick);
      var b = window.__PT_BOND__;
      if (typeof b !== "number" || window.__RUN_PAUSED__) { if (wrap) wrap.style.opacity = "0"; return; }
      ensure();
      b = Math.max(0, Math.min(1, b));
      wrap.style.opacity = (0.30 + Math.pow(b, 1.3) * 0.62).toFixed(2);
      if (!_labelShown && b > 0.02 && label) { _labelShown = true; label.style.opacity = "1"; setTimeout(function () { if (label) label.style.opacity = "0"; }, 3200); }
      var hue = ((354 + b * 20) % 360).toFixed(0);   // 354 深紅(遠) → 14 暖金(近)
      var col = "hsl(" + hue + ",85%," + (46 + b * 18).toFixed(0) + "%)";
      line.style.background = col;
      line.style.height = (3 + b * 3).toFixed(1) + "px";
      var pulse = b > 0.9 ? (b - 0.9) * 200 : 0; // 接近抱到女兒：線收緊發燙（拉到最緊也沒斷）
      line.style.boxShadow = "0 0 " + (8 + b * 22 + pulse).toFixed(0) + "px " + col;
      knotL.style.boxShadow = knotR.style.boxShadow = "0 0 " + (8 + b * 16 + pulse * 0.5).toFixed(0) + "px " + col;
    }
    window.requestAnimationFrame(tick);
  })();

  function injectStyle() {
    if (document.getElementById("pacts-style")) return;
    const s = document.createElement("style");
    s.id = "pacts-style";
    s.textContent = [
      ".pact-ov{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;",
      "background:radial-gradient(120% 90% at 50% 42%,rgba(20,24,30,.55),rgba(8,10,14,.94));backdrop-filter:blur(2px);",
      "font-family:inherit;color:#eef2f6;opacity:0;transition:opacity .9s ease;text-align:center;padding:24px}",
      ".pact-ov.show{opacity:1}",
      ".pact-ov .pa-kicker{font-size:12px;letter-spacing:.24em;color:#9fd0ff;margin-bottom:.6em;opacity:.88}",
      ".pact-ov .pa-line{font-size:clamp(15px,2.2vw,21px);line-height:2;max-width:660px;text-shadow:0 0 14px rgba(150,200,255,.22);min-height:2em;white-space:pre-line}",
      ".pact-ov .pa-sub{font-size:13px;opacity:.66;margin-top:1em;letter-spacing:.08em;min-height:1.4em;white-space:pre-line;line-height:1.9}",
      ".pact-ov .pa-choices{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:1.6em}",
      ".pact-ov .pa-btn{background:rgba(255,255,255,.06);border:1px solid rgba(159,208,255,.32);border-radius:999px;color:#eef2f6;",
      "font-family:inherit;font-size:14px;padding:11px 22px;cursor:pointer;transition:all .3s ease;letter-spacing:.06em}",
      ".pact-ov .pa-btn:hover,.pact-ov .pa-btn:focus{background:rgba(159,208,255,.16);transform:translateY(-2px);outline:none;box-shadow:0 6px 20px rgba(150,200,255,.18)}",
      ".pact-ov .pa-btn.warm{border-color:rgba(255,180,150,.5);color:#ffe6d6}",
      ".pact-ov .pa-btn.disabled{opacity:.3;cursor:not-allowed;text-decoration:line-through}",
      ".pact-ov::before,.pact-ov::after{content:'';position:fixed;left:0;right:0;height:0;background:#05070a;z-index:5;transition:height 1s cubic-bezier(.7,0,.3,1);pointer-events:none}",
      ".pact-ov::before{top:0}",
      ".pact-ov::after{bottom:0}",
      ".pact-ov.show::before,.pact-ov.show::after{height:6.5vh}",
      ".pact-ov .pt-bridge{width:min(72vw,360px);height:96px;margin-top:1.2em;border-radius:14px;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-touch-callout:none;border:1px solid rgba(159,208,255,.22);background:linear-gradient(180deg,rgba(159,208,255,.05),rgba(255,255,255,.02));transition:box-shadow .25s,background .25s}",
      ".pact-ov .pt-bridge.steady{box-shadow:0 0 30px rgba(255,170,200,.42);background:linear-gradient(180deg,rgba(255,180,205,.11),rgba(159,208,255,.03))}",
      ".pact-ov .pt-bridge-baby{font-size:13px;letter-spacing:.34em;color:#ffd9e6;text-shadow:0 0 14px rgba(255,150,190,.5);z-index:2}",
      ".pact-ov .pt-bridge-arms{position:absolute;left:6%;right:6%;top:50%;height:3px;border-radius:2px;background:linear-gradient(90deg,transparent,#ffd9c0,transparent);transform:scaleX(.5);transition:transform .14s ease,opacity .25s}",
      ".pact-ov .pt-meter{width:240px;height:6px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:1.1em;overflow:hidden}",
      ".pact-ov .pt-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#9fd0ff,#ffd9e6);transition:width .12s linear}",
    ].join("");
    document.head.appendChild(s);
  }
  // 暫停引用計數：vignette 開啟期間凍結月台 runner（window.__RUN_PAUSED__），看回憶時時間不流逝
  let _pauseN = 0;
  function _pause(d) { _pauseN = Math.max(0, _pauseN + d); if (typeof window !== "undefined") window.__RUN_PAUSED__ = _pauseN > 0; }
  // 逃生系統:每幕 onDone 經 armP() 包成只回一次 + 登記 _armedP;open() 注入跳過鈕/Escape/30s watchdog,
  // 保證任一幕互動失效也能往前 → 解凍,不會把整支月台凍死(對齊 EP36「不能倒帶,只能往前跑」)。
  let _armedP = null;
  function armP(onDone) {
    var a = { done: false, onCleanup: null };
    a.guard = function (r) { if (a.done) return; a.done = true; if (a.onCleanup) { try { a.onCleanup(); } catch (e) {} } if (_armedP === a) _armedP = null; if (typeof onDone === "function") onDone(r); };
    _armedP = a;
    return a.guard;
  }
  function open() {
    injectStyle(); _pause(1);
    const ov = el("div", "pact-ov"); document.body.appendChild(ov);
    const armed = _armedP;
    let wd = 0;
    function cleanup() { document.removeEventListener("keydown", onEsc); if (wd) { clearTimeout(wd); wd = 0; } }
    function doSkip() { cleanup(); close(ov, function () { if (armed) armed.guard({ ok: false, skipped: true }); }, 0); }
    function onEsc(e) { if (e.key === "Escape") doSkip(); }
    const skip = el("button", null, "跳過這段 ›");
    skip.style.cssText = "position:fixed;top:max(14px,env(safe-area-inset-top));right:max(14px,env(safe-area-inset-right));z-index:9000;background:rgba(10,14,20,.62);border:1px solid rgba(159,208,255,.34);color:rgba(207,224,240,.72);font-family:inherit;font-size:11px;letter-spacing:.18em;padding:7px 14px;border-radius:999px;cursor:pointer;opacity:.55;transition:opacity .3s";
    skip.setAttribute("aria-label", "跳過這段");
    skip.addEventListener("click", doSkip);
    skip.addEventListener("mouseenter", function () { skip.style.opacity = "1"; });
    ov.appendChild(skip);
    document.addEventListener("keydown", onEsc);
    if (armed) armed.onCleanup = cleanup; // 正常結束也清 watchdog/esc（guard 內部呼叫，不受 act 持有原始參考影響）
    wd = setTimeout(function () { if (armed && !armed.done) doSkip(); }, 30000);
    requestAnimationFrame(() => ov.classList.add("show"));
    return ov;
  }
  function close(ov, cb, d) { setTimeout(() => { ov.classList.remove("show"); setTimeout(() => { if (ov.parentNode) ov.parentNode.removeChild(ov); _pause(-1); if (cb) cb(); }, 900); }, d || 0); }
  function clearC(c) { while (c.firstChild) c.removeChild(c.firstChild); }

  // #2 回聲(EP36 廚房門:把拔我會想你的 / 戴時空耳機聽見他沒說出口的回答)
  function echo(onDone) {
    const ov = open();
    ov.appendChild(el("div", "pa-kicker", "2017 · 家要分開的那天 · 廚房門口"));
    const line = el("div", "pa-line", "「把拔，我會想你的。」女兒抱著小背包，站在廚房門口。把拔背對著她，把水龍頭開得好大。");
    ov.appendChild(line);
    const sub = el("div", "pa-sub", "他好像說了什麼，可是被水聲蓋住了。");
    ov.appendChild(sub);
    const ch = el("div", "pa-choices"); ov.appendChild(ch);
    ch.appendChild((function () { const b = el("button", "pa-btn warm", "戴上時空耳機，聽聽看"); b.addEventListener("click", () => {
      const veil = PSFX.waterVeil();             // 水聲白噪先湧上，lowpass 悶住人聲
      sub.textContent = "耳機裡，水聲退去。妳聽見他壓得很低、很抖的聲音。";
      setTimeout(() => { veil.open(); }, 350);    // lowpass 打開：水退、人聲才浮現
      line.textContent = "「……我也會想妳的。」";
      clearC(ch);
      setTimeout(() => { sub.textContent = "他沒有回頭。水，又開得更大聲了一點。"; }, 2000);
      setTimeout(() => { veil.stop(); }, 4600);   // 收尾前收掉水聲
      close(ov, function () { if (onDone) onDone({ ok: true }); }, 5200);
    }); return b; })());
  }

  // #3 透明片注音(EP37 父親節:描注音 + 比家庭手勢)
  function tracing(onDone) {
    const ov = open();
    ov.appendChild(el("div", "pa-kicker", "父親節 · 透明片上的注音"));
    const line = el("div", "pa-line", "妳在透明片上，一個一個描出注音：ㄅㄚˇ ㄅㄚˊ ㄨㄛˇ ㄏㄨㄟˋ ㄒㄧㄤˇ ㄋㄧˇ ㄉㄜ˙");
    ov.appendChild(line);
    const sub = el("div", "pa-sub", "描好了。接著，比出只有你們才懂的暗號。");
    ov.appendChild(sub);
    const ch = el("div", "pa-choices"); ov.appendChild(ch);
    const steps = [
      { act: "用拳頭，敲敲自己的胸口兩下", meaning: "" },
      { act: "用食指，指著對方", meaning: "" },
      { act: "用斜斜的 7，比在自己的下巴", meaning: "（代表自己最帥、最美）" },
      { act: "最後，跟對方比一個讚", meaning: "（代表你最棒）" },
    ];
    let i = 0;
    function render() {
      clearC(ch);
      if (i >= steps.length) {
        line.textContent = "「把拔，我會想你的。」這句話，從此有了只屬於你們的手語。";
        sub.textContent = "";
        close(ov, function () { if (onDone) onDone({ ok: true }); }, 3800);
        return;
      }
      const b = el("button", "pa-btn", steps[i].act);
      b.addEventListener("click", () => { const m = steps[i].meaning; sub.textContent = m; i++; clearC(ch); setTimeout(render, m ? 1600 : 800); });
      ch.appendChild(b);
    }
    render();
  }

  // #4 不能穿越(EP37:女兒能 rewind,把拔不能,只能往前跑/相信)
  function cantTravel(onDone) {
    const ov = open();
    ov.appendChild(el("div", "pa-kicker", "命運阿嬤 · 一個不公平的規則"));
    const line = el("div", "pa-line", "命運阿嬤說：有人可以穿越，是為了修補；有人不能穿越，是為了讓『心』變成真的。");
    ov.appendChild(line);
    const sub = el("div", "pa-sub", "妳（女兒）可以倒帶。試試看，把拔可以嗎？");
    ov.appendChild(sub);
    const ch = el("div", "pa-choices"); ov.appendChild(ch);
    // 女兒倒帶：真的能按
    const rw = el("button", "pa-btn", "⟲ 倒帶（女兒）");
    rw.addEventListener("click", () => { PSFX.sweepUp(); sub.textContent = "畫面倒退、重來。在妳的時間裡，錯了可以再來一次。"; }); // 升頻 whoosh＝倒帶；把拔鈕全程死寂
    // 把拔倒帶：按鈕一直閃躲、點不到（機制即隱喻：他沒有這個能力）
    const pf = el("button", "pa-btn", "⟲ 倒帶（把拔）");
    let dodges = 0, gaveUp = false;
    function dodge(e) {
      if (gaveUp) return;
      if (e) e.preventDefault();
      dodges++;
      const dx = (dodges % 2 ? 1 : -1) * (44 + dodges * 12);
      const dy = ((dodges % 3) - 1) * 24;
      pf.style.transform = "translate(" + dx + "px," + dy + "px)";
      pf.style.opacity = Math.max(0.22, 1 - dodges * 0.13).toFixed(2);
      sub.textContent = "（他想倒帶……可是那個按鈕，一直從他指間滑開。）";
      if (dodges >= 5) {
        gaveUp = true;
        pf.style.pointerEvents = "none"; pf.style.transform = "translate(0,0)"; pf.style.opacity = "0.28";
        pf.classList.add("disabled");
        sub.textContent = "把拔，沒有這個按鈕。他不能倒帶，只能往前跑。他唯一能做的，是『相信』。";
      }
    }
    pf.addEventListener("pointerenter", dodge); // 桌機 hover 就閃開
    pf.addEventListener("pointerdown", dodge);  // 觸控/點擊：按下去前先滑開
    const go = el("button", "pa-btn warm", "那就，往前跑");
    go.addEventListener("click", () => { line.textContent = "他照著看不見前方的劇本，一次又一次，用力地往前跑。"; sub.textContent = ""; clearC(ch); close(ov, function () { if (onDone) onDone({ ok: true }); }, 3400); });
    ch.appendChild(rw); ch.appendChild(pf); ch.appendChild(go);
  }

  // #5 13 歲離家的夜(EP30:翻外套藏名字 → 廟桌下 → 大阿姨「肚子會餓嗎?」)
  //   註:此人=把拔的大阿姨。女兒視角(reader EP30)叫她「大姨婆」,但月台是把拔視角 → 用「大阿姨」
  function runaway13(onDone) {
    const ov = open();
    ov.appendChild(el("div", "pa-kicker", "把拔 13 歲 · 離家的那一夜"));
    const line = el("div", "pa-line", "補習班下課，他沒有回家。夜很深。");
    ov.appendChild(line);
    const sub = el("div", "pa-sub", "");
    ov.appendChild(sub);
    const ch = el("div", "pa-choices"); ov.appendChild(ch);
    const seq = [
      { b: "把外套反過來穿，藏起繡的名字", s: "沒有人會知道他是誰。也沒有人，會把他帶回去。" },
      { b: "買一個最便宜的御飯糰", s: "他蹲在便利商店外面，慢慢咬。" },
      { b: "睡到廟裡的供桌底下", s: "神明桌下最暗，最安全。他縮成一團。" },
    ];
    let i = 0;
    function render() {
      clearC(ch);
      if (i < seq.length) {
        const b = el("button", "pa-btn", seq[i].b);
        b.addEventListener("click", () => { sub.textContent = seq[i].s; i++; setTimeout(render, 1700); });
        ch.appendChild(b);
      } else {
        line.textContent = "天亮了。是把拔的大阿姨。她沒有罵他，只問了一句。";
        sub.textContent = "「肚子，會餓嗎？」";
        close(ov, function () { if (onDone) onDone({ ok: true }); }, 4000);
      }
    }
    render();
  }

  // #6 櫃子上的天空(EP36 2013:把拔抱 1 歲女兒進捷運站男廁，在木櫃上用身體撐成橋換尿布)
  function subwaySky(onDone) {
    const ov = open();
    ov.appendChild(el("div", "pa-kicker", "2013 · 台北某個捷運站的男廁 · 櫃子上的天空"));
    const line = el("div", "pa-line", "一歲的妳哭了，需要換尿布。可是捷運站沒有親子廁所，男廁裡，也沒有尿布台。");
    ov.appendChild(line);
    const sub = el("div", "pa-sub", "按住下面那塊地方，把兩隻手臂撐成一座橋。撐住，別讓往來的視線碰到她。");
    ov.appendChild(sub);
    // P2-10 按住維持平衡撐橋（reuse gaze hold）：撐住手臂成橋，放手太早她又扭動
    const bridge = el("div", "pt-bridge");
    const arms = el("div", "pt-bridge-arms");
    const baby = el("div", "pt-bridge-baby", "妳");
    bridge.appendChild(arms); bridge.appendChild(baby);
    ov.appendChild(bridge);
    const meterWrap = el("div", "pt-meter"); const fill = el("i"); meterWrap.appendChild(fill); ov.appendChild(meterWrap);
    let holding = false, hold = 0, raf = 0, last = 0, done = false;
    const NEED = 3.0;
    function loop(t) {
      if (done) return;
      if (!last) last = t;
      const dt = (t - last) / 1000; last = t;
      if (holding) hold = Math.min(NEED, hold + dt); else hold = Math.max(0, hold - dt * 1.4);
      fill.style.width = (hold / NEED * 100) + "%";
      const steady = hold > 0.2;
      bridge.classList.toggle("steady", steady);
      arms.style.transform = "scaleX(" + (0.5 + (hold / NEED) * 0.5).toFixed(2) + ")"; // 撐越久，橋越穩越長
      if (!holding && hold > 0.05 && hold < NEED) sub.textContent = "她又開始扭動了……再撐住一點。";
      if (hold >= NEED) return finish();
      raf = requestAnimationFrame(loop);
    }
    function down(e) { e.preventDefault(); holding = true; }
    function up() { holding = false; }
    function finish() {
      done = true; cancelAnimationFrame(raf);
      bridge.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      bridge.classList.add("steady"); arms.style.transform = "scaleX(1)";
      line.textContent = "在那個小小的、櫃子上的天空底下，妳停止了哭泣。";
      sub.textContent = "他把兩隻手臂撐成一座橋，一邊解尿布，一邊用身體擋住來往的視線。";
      close(ov, function () { if (onDone) onDone({ ok: true }); }, 4400);
    }
    bridge.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    raf = requestAnimationFrame(loop);
  }

  // #10 我趕上了 → 多年後回望(EP36→41:趕上那刻 → 女兒國一 LINE)
  function yearsLater(onDone) {
    const ov = open();
    ov.appendChild(el("div", "pa-kicker", "在車門關上前兩秒"));
    const line = el("div", "pa-line", "「我趕上了。」他一邊喘，一邊笑，把妳整個抱起來，塞進北上自強號。");
    ov.appendChild(line);
    const sub = el("div", "pa-sub", "");
    ov.appendChild(sub);
    const ch = el("div", "pa-choices"); ov.appendChild(ch);
    const b = el("button", "pa-btn warm", "許多年後……");
    b.addEventListener("click", () => {
      clearC(ch);
      line.textContent = "許多年後，妳已經國一了。\n妳在訊息框打了一半：「把拔，我也會想你的。」";
      setTimeout(() => { line.textContent = "字還沒打完。"; sub.textContent = "他傳來的那句，先到了：「我也想妳。」"; }, 2800);
      setTimeout(() => { line.textContent = "那句『我也想妳』，\n好像不是這一刻才說的，\n是他在每一條時間線裡，都對妳說過一次。"; sub.textContent = ""; }, 5600);
      close(ov, function () { if (onDone) onDone({ ok: true }); }, 9000);
    });
    ch.appendChild(b);
  }

  // #1 polish：趕上那一刻的電影定格（抱起女兒；暖白 bloom + letterbox + 大字，pointer-events:none 不擋遊戲、自動消失、不碰 runner 邏輯）
  function catchMoment() {
    if (document.getElementById("catch-moment")) return;
    const ov = el("div"); ov.id = "catch-moment";
    ov.style.cssText = "position:fixed;inset:0;z-index:8500;pointer-events:none;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .5s ease";
    const bloom = el("div"); bloom.style.cssText = "position:absolute;inset:0;background:radial-gradient(circle at 50% 55%,rgba(255,240,210,.5),rgba(255,200,150,.1) 45%,transparent 72%)";
    const top = el("div"); top.style.cssText = "position:absolute;top:0;left:0;right:0;height:clamp(28px,5vh,52px);background:#06050a;transform:scaleY(0);transform-origin:top;transition:transform .6s cubic-bezier(.7,0,.3,1)";
    const bot = el("div"); bot.style.cssText = "position:absolute;bottom:0;left:0;right:0;height:clamp(28px,5vh,52px);background:#06050a;transform:scaleY(0);transform-origin:bottom;transition:transform .6s cubic-bezier(.7,0,.3,1)";
    const line = el("div", null, "我，趕上了。"); line.style.cssText = "position:relative;color:#fff6e8;font-size:clamp(20px,4vw,34px);letter-spacing:.14em;text-shadow:0 0 26px rgba(255,200,150,.85);transform:scale(1.1);transition:transform 1.4s ease";
    ov.appendChild(bloom); ov.appendChild(top); ov.appendChild(bot); ov.appendChild(line);
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.style.opacity = "1"; top.style.transform = "scaleY(1)"; bot.style.transform = "scaleY(1)"; line.style.transform = "scale(1)"; });
    setTimeout(function () {
      ov.style.opacity = "0"; top.style.transform = "scaleY(0)"; bot.style.transform = "scaleY(0)";
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 600);
    }, 1600);
  }

  function runChain(ids, onAll) {
    if (document.querySelector(".pact-ov")) return; // W3：已有 vignette 開著就忽略，避免疊字穿透
    const map = { echo: echo, tracing: tracing, cantTravel: cantTravel, runaway13: runaway13, subwaySky: subwaySky, yearsLater: yearsLater };
    let i = 0;
    _pause(1); /* 整條回憶鏈期間（含幕間空檔）都凍結遊戲，結束才解凍，避免時間偷跑 */
    function next() { if (i >= ids.length) { _pause(-1); if (onAll) onAll(); return; } const fn = map[ids[i++]]; if (typeof fn === "function") fn(armP(next)); else next(); }
    next();
  }

  // 遊戲內故事閱讀 overlay：iframe 嵌 reader.html?embed=1，開啟時凍結月台、不跳出遊戲
  let _storyPaused = false;
  function ensureStoryOverlay() {
    let ov = document.getElementById("pt-story-overlay");
    if (ov) return ov;
    ov = document.createElement("div");
    ov.id = "pt-story-overlay";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-label", "故事閱讀");
    ov.style.cssText = "position:fixed;inset:0;z-index:100001;background:rgba(6,8,11,.94);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:none;opacity:0;overflow:hidden;transition:opacity .35s ease";
    const bar = document.createElement("div");
    bar.style.cssText = "position:relative;height:calc(env(safe-area-inset-top,0px) + 52px);box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;padding:calc(env(safe-area-inset-top,0px) + 6px) 16px 6px;background:rgba(6,8,11,.98);border-bottom:1px solid rgba(232,160,90,.22)";   // 正常文件流 bar(非絕對浮層):固定高 safe+52 與 iframe 的 dvh 扣減對齊,接在 iframe 上方不重疊,iOS iframe 合成層蓋不到(r15 真正解法)
    const lbl = el("div", null, "故事 · 月台這一段");
    lbl.style.cssText = "color:#cdbfae;font-size:13px;letter-spacing:.14em";
    const rightG = document.createElement("div");
    rightG.style.cssText = "display:flex;align-items:center;gap:8px;pointer-events:none";
    const music = el("button", null, "🔊");   // toni #1:讀故事時音樂續播,提供開關
    music.id = "pt-story-music";
    music.setAttribute("aria-label", "開關背景音樂");
    music.style.cssText = "pointer-events:auto;background:rgba(20,14,10,.72);color:#f0d0a8;border:1px solid rgba(232,160,90,.5);border-radius:999px;font-family:inherit;font-size:15px;line-height:1;padding:7px 11px;cursor:pointer";
    music.addEventListener("click", function () { try { const on = window.__PT_MUSIC_TOGGLE__ ? window.__PT_MUSIC_TOGGLE__() : true; music.textContent = on ? "🔊" : "🔇"; } catch (e) {} });
    const close = el("button", null, "✕ 回到月台");
    close.id = "pt-story-close";
    close.style.cssText = "pointer-events:auto;background:rgba(20,14,10,.72);color:#f0d0a8;border:1px solid rgba(232,160,90,.5);border-radius:999px;font-family:inherit;font-size:13px;letter-spacing:.06em;padding:8px 16px;cursor:pointer";
    close.addEventListener("click", closeStoryReader);
    rightG.appendChild(music); rightG.appendChild(close);
    bar.appendChild(lbl); bar.appendChild(rightG);
    const frame = document.createElement("iframe");
    frame.id = "pt-story-iframe";
    frame.title = "故事閱讀";
    frame.style.cssText = "position:relative;display:block;width:100%;height:calc(100dvh - 52px - env(safe-area-inset-top,0px));border:0;background:#0a0c0e";   // 流式區塊接 bar 下方,dvh 算高(非 absolute→iOS 合成層蓋不到;非 height:auto→不塌 150px)
    ov.appendChild(bar); ov.appendChild(frame);   // bar 在前=文件流在上方;iframe 在後=下方填滿
    document.body.appendChild(ov);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov.style.display === "block") closeStoryReader(); });
    return ov;
  }
  let _storyReturnFocus = null;
  function openStoryReader(ep) {
    const ov = ensureStoryOverlay();
    const frame = document.getElementById("pt-story-iframe");
    frame.src = "../../reader.html?embed=1#ep-" + (ep || 36);
    ov.style.display = "block";
    requestAnimationFrame(function () { ov.style.opacity = "1"; });
    if (!_storyPaused) { _storyPaused = true; _pause(1); }
    _storyReturnFocus = document.activeElement;
    const music = document.getElementById("pt-story-music");
    if (music) { try { music.textContent = (window.__PT_MUSIC_ON__ && window.__PT_MUSIC_ON__()) ? "🔊" : "🔇"; } catch (e) {} }   // 開啟時同步音樂鈕圖示(音樂在讀故事時不停)
    const close = document.getElementById("pt-story-close");
    if (close) requestAnimationFrame(function () { try { close.focus(); } catch (e) {} });
  }
  function closeStoryReader() {
    const ov = document.getElementById("pt-story-overlay");
    if (!ov) return;
    ov.style.opacity = "0";
    setTimeout(function () { ov.style.display = "none"; const f = document.getElementById("pt-story-iframe"); if (f) f.src = "about:blank"; }, 350);
    if (_storyPaused) { _storyPaused = false; _pause(-1); }
    if (_storyReturnFocus && _storyReturnFocus.focus) { try { _storyReturnFocus.focus(); } catch (e) {} }
    _storyReturnFocus = null;
  }
  if (typeof window !== "undefined") window.__PT_READ_STORY__ = openStoryReader;

  // 自注入左上角按鈕。桌機：2×2 並列、下移避開倒數進度條。
  // 手機：兩排各收合成一顆（💭 回憶 / 🏠 飛回），點一下展開原本兩顆、再點收合。
  function injectLauncher() {
    if (document.getElementById("pt-launcher")) return;
    if (!document.getElementById("pt-launcher-style")) {
      const st = document.createElement("style");
      st.id = "pt-launcher-style";
      st.textContent =
        "#pt-launcher{position:fixed;top:120px;left:14px;z-index:70;display:flex;flex-direction:column;gap:8px;align-items:flex-start}" +
        "#pt-launcher .pt-row{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap}" +
        "#pt-launcher .pt-row-items{display:flex;gap:8px;flex-wrap:wrap}" +
        "#pt-launcher .pt-toggle{display:none}" +
        "@media (max-width:768px){#pt-launcher .pt-toggle{display:inline-flex}#pt-launcher .pt-row:not(.pt-open) .pt-row-items{display:none}}";
      document.head.appendChild(st);
    }
    const pill = function (bg, color, border) {
      return "background:" + bg + ";color:" + color + ";border:1px solid " + border + ";border-radius:999px;font-family:inherit;font-size:12px;letter-spacing:.06em;padding:7px 14px;cursor:pointer;backdrop-filter:blur(4px);opacity:.85;transition:opacity .3s;white-space:nowrap";
    };
    const wire = function (btn) { btn.addEventListener("mouseenter", function () { btn.style.opacity = "1"; }); };
    const wrap = document.createElement("div");
    wrap.id = "pt-launcher";

    // 第 1 排：💭 回憶（手機收合鈕）→ 把拔的回憶 ｜ 讀這段故事
    const row1 = document.createElement("div"); row1.className = "pt-row";
    const tg1 = el("button", "pt-toggle", "💭 回憶");
    tg1.style.cssText = pill("rgba(10,14,20,.6)", "#cfe0f0", "rgba(159,208,255,.4)");
    tg1.setAttribute("aria-label", "展開／收合回憶與讀故事按鈕");
    wire(tg1);
    tg1.addEventListener("click", function () { row1.classList.toggle("pt-open"); });
    const items1 = document.createElement("div"); items1.className = "pt-row-items";

    const b = el("button", null, "💭 把拔的回憶");
    b.id = "pacts-launcher";
    b.style.cssText = pill("rgba(10,14,20,.6)", "#cfe0f0", "rgba(159,208,255,.4)");
    wire(b);
    b.addEventListener("click", function () { runChain(["echo", "tracing", "cantTravel", "runaway13", "subwaySky"], function () {}); });

    const r = el("button", null, "📖 讀這段故事");
    r.id = "pt-read-story";
    r.style.cssText = pill("rgba(20,14,10,.6)", "#f0d0a8", "rgba(232,160,90,.45)");
    r.setAttribute("aria-label", "讀這段故事 EP36");
    wire(r);
    r.addEventListener("click", function () { openStoryReader(36); });
    items1.appendChild(b); items1.appendChild(r);
    row1.appendChild(tg1); row1.appendChild(items1);

    // 第 2 排：🏠 飛回（手機收合鈕）→ 飛回首頁 ｜ 飛到把拔跟女兒的故事（皆跳出遊戲）
    const row2 = document.createElement("div"); row2.className = "pt-row";
    const tg2 = el("button", "pt-toggle", "🏠 飛回");
    tg2.style.cssText = pill("rgba(12,16,22,.6)", "#bcd0e4", "rgba(150,180,210,.4)");
    tg2.setAttribute("aria-label", "展開／收合飛回首頁與飛到全集按鈕");
    wire(tg2);
    tg2.addEventListener("click", function () { row2.classList.toggle("pt-open"); });
    const items2 = document.createElement("div"); items2.className = "pt-row-items";

    const h = el("button", null, "🏠 飛回首頁");
    h.id = "pt-fly-home";
    h.style.cssText = pill("rgba(12,16,22,.6)", "#bcd0e4", "rgba(150,180,210,.4)");
    h.setAttribute("aria-label", "飛回首頁");
    wire(h);
    h.addEventListener("click", function () { window.location.href = "../../index.html"; });

    const a = el("button", null, "📖 飛到把拔跟女兒的故事");
    a.id = "pt-fly-reader";
    a.style.cssText = pill("rgba(20,14,10,.6)", "#f0d0a8", "rgba(232,160,90,.45)");
    a.setAttribute("aria-label", "飛到把拔跟女兒的故事全集");
    wire(a);
    a.addEventListener("click", function () { window.location.href = "../../reader.html"; });
    items2.appendChild(h); items2.appendChild(a);
    row2.appendChild(tg2); row2.appendChild(items2);

    wrap.appendChild(row1); wrap.appendChild(row2);
    document.body.appendChild(wrap);

    // 所有「讀這段 EP36」連結(含 title 的「先讀這段故事」)改走遊戲內 overlay(保留返回月台+音樂續播),不再 navigate-away 跳出頁面
    document.querySelectorAll('a[href*="reader.html#ep-36"]').forEach(function (lk) {
      if (lk._wiredEmbed) return; lk._wiredEmbed = true;
      lk.addEventListener("click", function (e) { e.preventDefault(); openStoryReader(36); });
    });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectLauncher, { once: true });
    else injectLauncher();
  }

  if (typeof window !== "undefined") {
    var _wrapP = function (fn) { return function (cb) { return fn(armP(cb)); }; };
    window.__PACTS__ = { echo: _wrapP(echo), tracing: _wrapP(tracing), cantTravel: _wrapP(cantTravel), runaway13: _wrapP(runaway13), subwaySky: _wrapP(subwaySky), yearsLater: _wrapP(yearsLater), catchMoment: catchMoment, runChain: runChain };
    // console 逃生口:萬一還是卡住,__FORCE_RESUME__() 強制解凍 + 清掉殘留 vignette
    window.__FORCE_RESUME__ = function () { _pauseN = 0; if (typeof window !== "undefined") window.__RUN_PAUSED__ = false; document.querySelectorAll(".pact-ov").forEach(function (o) { if (o.parentNode) o.parentNode.removeChild(o); }); };
  }
})();
