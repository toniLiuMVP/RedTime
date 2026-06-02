// platform-twin-b-acts.js · 月台雙時空B 父女記憶 vignettes
// 純 DOM(iOS-safe)、零 innerHTML、韓劇暗調。對外:window.__PACTS__
// EP36(廚房門/捷運天空/月台狂奔)、EP37(透明片/不能穿越)、EP30(13 歲離家)。

(function () {
  "use strict";
  function el(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

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
    ].join("");
    document.head.appendChild(s);
  }
  // 暫停引用計數：vignette 開啟期間凍結月台 runner（window.__RUN_PAUSED__），看回憶時時間不流逝
  let _pauseN = 0;
  function _pause(d) { _pauseN = Math.max(0, _pauseN + d); if (typeof window !== "undefined") window.__RUN_PAUSED__ = _pauseN > 0; }
  function open() { injectStyle(); _pause(1); const ov = el("div", "pact-ov"); document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("show")); return ov; }
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
      sub.textContent = "耳機裡，水聲退去。妳聽見他壓得很低、很抖的聲音。";
      line.textContent = "「……我也會想妳的。」";
      clearC(ch);
      setTimeout(() => { sub.textContent = "他沒有回頭。水，又開得更大聲了一點。"; }, 2000);
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
    rw.addEventListener("click", () => { sub.textContent = "畫面倒退、重來。在妳的時間裡，錯了可以再來一次。"; });
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
    const sub = el("div", "pa-sub", "");
    ov.appendChild(sub);
    const ch = el("div", "pa-choices"); ov.appendChild(ch);
    const wm = el("button", "pa-btn warm", "在角落的木櫃上，為她撐出一塊乾淨的地方");
    wm.addEventListener("click", () => {
      sub.textContent = "他把妳抱進男廁，在那排鎖著的木頭櫃子上，把兩隻手臂撐成一座橋，一邊解尿布，一邊用身體擋住來往的視線。";
      line.textContent = "在那個小小的、櫃子上的天空底下，妳停止了哭泣。";
      clearC(ch);
      close(ov, function () { if (onDone) onDone({ ok: true }); }, 3800);
    });
    ch.appendChild(wm);
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
      setTimeout(() => { line.textContent = "從四維空間的角度，\n那句話，是從所有時間線一起飛來的。"; sub.textContent = ""; }, 5600);
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
    const top = el("div"); top.style.cssText = "position:absolute;top:0;left:0;right:0;height:12vh;background:#06050a;transform:scaleY(0);transform-origin:top;transition:transform .6s cubic-bezier(.7,0,.3,1)";
    const bot = el("div"); bot.style.cssText = "position:absolute;bottom:0;left:0;right:0;height:12vh;background:#06050a;transform:scaleY(0);transform-origin:bottom;transition:transform .6s cubic-bezier(.7,0,.3,1)";
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
    function next() { if (i >= ids.length) { _pause(-1); if (onAll) onAll(); return; } const fn = map[ids[i++]]; if (typeof fn === "function") fn(next); else next(); }
    next();
  }

  // 自注入「把拔的回憶」launcher（top-left，subtle；播 5 段父女記憶鏈）
  function injectLauncher() {
    if (document.getElementById("pacts-launcher")) return;
    const b = el("button", null, "💭 把拔的回憶");
    b.id = "pacts-launcher";
    b.style.cssText = "position:fixed;top:14px;left:14px;z-index:70;background:rgba(10,14,20,.6);color:#cfe0f0;border:1px solid rgba(159,208,255,.4);border-radius:999px;font-family:inherit;font-size:12px;letter-spacing:.08em;padding:7px 14px;cursor:pointer;backdrop-filter:blur(4px);opacity:.8;transition:opacity .3s";
    b.addEventListener("mouseenter", () => { b.style.opacity = "1"; });
    b.addEventListener("click", () => { runChain(["echo", "tracing", "cantTravel", "runaway13", "subwaySky"], function () {}); });
    document.body.appendChild(b);
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectLauncher, { once: true });
    else injectLauncher();
  }

  if (typeof window !== "undefined") {
    window.__PACTS__ = { echo: echo, tracing: tracing, cantTravel: cantTravel, runaway13: runaway13, subwaySky: subwaySky, yearsLater: yearsLater, catchMoment: catchMoment, runChain: runChain };
  }
})();
