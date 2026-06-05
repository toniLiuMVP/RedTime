// twin-b-acts.js · 雙時空B Acts 2-10(後一眼瞬間的戀愛弧 overlay vignettes)
// 純 DOM(iOS-safe)、零 innerHTML(createElement + textContent)、韓劇暗調。
// 對外:window.__ACTS__ = { gaze, note, msn, phoneCall, sevenEleven, infinite, believe, runChain }
// 每個 act(onDone) → 完成後呼叫 onDone(result);runChain([...],onAll) 串成情感鏈。

(function () {
  "use strict";

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  // P0-2 觸覺心跳 + Web Audio 低頻情緒音。
  // iOS-safe:lazy AudioContext（在 user gesture 內 resume）、navigator.vibrate 在 iOS 是 no-op（已 guard）、
  // 尊重使用者靜音（讀 app 橋接 window.__TWIN_B_AUDIO_OK__，無橋接時預設可發聲）。
  // 設計語彙:心跳在「靠近 / 撐住」時加快，最關鍵的那句刻意靜音留白（不呼叫 SFX）。
  var SFX = (function () {
    var ctx = null, master = null;
    function audioOK() {
      try { if (typeof window.__TWIN_B_AUDIO_OK__ === "function") return !!window.__TWIN_B_AUDIO_OK__(); } catch (e) {}
      return true;
    }
    function ensure() {
      if (!audioOK()) return null;
      try {
        if (!ctx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          ctx = new AC();
          master = ctx.createGain();
          master.gain.value = 1;
          master.connect(ctx.destination);
        }
        if (ctx.state === "suspended" && ctx.resume) ctx.resume();
      } catch (e) { return null; }
      return ctx;
    }
    function tone(freq, dur, vol) {
      var c = ensure(); if (!c || !master) return;
      try {
        var now = c.currentTime, d = dur || 0.6;
        var o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol || 0.05), now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + d);
        o.connect(g); g.connect(master);
        o.start(now); o.stop(now + d + 0.06);
      } catch (e) {}
    }
    // 一記心跳 = 低頻雙 thud（lub-dub）+ 震動
    function beat() {
      try { if (navigator.vibrate) navigator.vibrate([26, 90, 38]); } catch (e) {}
      tone(58, 0.16, 0.075);
      setTimeout(function () { tone(44, 0.22, 0.055); }, 150);
    }
    // 連續心跳 n 下、間隔 gap（ms，越小越急）
    function heartbeat(n, gap) {
      var c = n || 1, step = gap || 720;
      for (var i = 0; i < c; i++) setTimeout(beat, i * step);
    }
    // 光點點亮的細柔泛音
    function shimmer() { tone(880, 0.5, 0.024); setTimeout(function () { tone(1320, 0.42, 0.016); }, 80); }
    // 失敗 / 撥不出去的悶鈍音
    function dud() { tone(150, 0.18, 0.05); setTimeout(function () { tone(110, 0.2, 0.04); }, 90); }
    return { tone: tone, beat: beat, heartbeat: heartbeat, shimmer: shimmer, dud: dud };
  })();

  function injectStyle() {
    if (document.getElementById("acts-style")) return;
    const s = document.createElement("style");
    s.id = "acts-style";
    s.textContent = [
      ".act-ov{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;",
      "background:radial-gradient(120% 90% at 50% 40%,rgba(26,20,28,.5),rgba(10,9,14,.92));backdrop-filter:blur(2px);",
      "font-family:inherit;color:#f4ece2;opacity:0;transition:opacity .9s ease;text-align:center;padding:24px}",
      ".act-ov.show{opacity:1}",
      ".act-ov .act-kicker{font-size:12px;letter-spacing:.24em;color:#ffd9a8;margin-bottom:.6em;opacity:.85}",
      ".act-ov .act-line{font-size:clamp(15px,2.2vw,21px);line-height:2;max-width:660px;text-shadow:0 0 14px rgba(255,200,150,.25);min-height:2em;white-space:pre-line}",
      ".act-ov .act-sub{font-size:13px;opacity:.66;margin-top:1em;letter-spacing:.08em;white-space:pre-line;line-height:1.9}",
      ".act-ov .act-choices{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:1.6em}",
      ".act-ov .act-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,200,150,.3);border-radius:999px;",
      "color:#f4ece2;font-family:inherit;font-size:14px;padding:11px 22px;cursor:pointer;transition:all .3s ease;letter-spacing:.06em}",
      ".act-ov .act-btn:hover,.act-ov .act-btn:focus{background:rgba(255,200,150,.16);transform:translateY(-2px);outline:none;box-shadow:0 6px 20px rgba(255,190,130,.18)}",
      // gaze
      ".act-ov .gaze-zone{width:min(60vw,340px);height:min(60vw,340px);border-radius:50%;margin-top:1.4em;cursor:pointer;",
      "background:radial-gradient(circle,rgba(255,228,200,.10),transparent 70%);border:1px solid rgba(255,210,160,.25);",
      "display:flex;align-items:center;justify-content:center;position:relative;transition:box-shadow .2s,background .2s;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-touch-callout:none}",
      ".act-ov .gaze-core{width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 0 24px rgba(255,225,190,.9)}",
      ".act-ov .gaze-meter{width:240px;height:6px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:1.2em;overflow:hidden}",
      ".act-ov .gaze-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd9a8,#fff2dd);transition:width .12s linear}",
      ".act-ov.gaze-bloom{background:radial-gradient(120% 90% at 50% 45%,rgba(255,236,210,.34),rgba(20,16,18,.9))}",
      ".act-ov .gaze-twin{position:absolute;top:50%;left:50%;width:13px;height:13px;border-radius:50%;background:radial-gradient(circle,#fff,#ffdca8);box-shadow:0 0 14px rgba(255,220,180,.85);opacity:.8;transition:transform 1.3s cubic-bezier(.6,0,.35,1),opacity .9s,box-shadow .9s;pointer-events:none}",
      ".act-ov .gaze-twin-l{transform:translate(-46px,-50%)}",
      ".act-ov .gaze-twin-r{transform:translate(34px,-50%)}",
      ".act-ov.gaze-bloom .gaze-twin-l,.act-ov.gaze-bloom .gaze-twin-r{transform:translate(-6px,-50%);opacity:1;box-shadow:0 0 28px rgba(255,238,210,1)}",
      // 一眼瞬間命中的定格暖金 flash（被命運按下存檔鍵的那一秒）
      ".act-ov .gaze-flash{position:fixed;inset:0;z-index:6;pointer-events:none;background:radial-gradient(circle at 50% 48%,rgba(255,238,210,.55),rgba(255,220,180,.12) 42%,transparent 70%);opacity:0}",
      ".act-ov .gaze-flash.on{animation:gazeFlash 1.3s ease-out forwards}",
      "@keyframes gazeFlash{0%{opacity:0}26%{opacity:1}100%{opacity:0}}",
      ".act-ov .hug-zone{position:relative;width:min(74vw,360px);height:min(46vh,300px);margin-top:1.2em;border-radius:18px;cursor:grab;touch-action:none;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;border:1px solid rgba(255,210,160,.14)}",
      ".act-ov .hug-zone:active{cursor:grabbing}",
      ".act-ov .hug-daughter{position:absolute;top:12%;left:50%;transform:translateX(-50%);font-size:13px;letter-spacing:.34em;color:#ffd9e6;text-shadow:0 0 14px rgba(255,150,190,.6);transition:opacity .12s;pointer-events:none}",
      ".act-ov .hug-him{width:42px;height:42px;border-radius:50%;margin-bottom:20px;background:radial-gradient(circle,#fff,#ffd9a8 58%,rgba(255,200,150,0));box-shadow:0 0 28px rgba(255,210,150,.85);transition:filter .1s;pointer-events:none}",
      ".act-ov .pc-inputwrap{position:relative;margin-top:1.2em;display:flex;flex-direction:column;align-items:center}",
      ".act-ov .pc-input{background:rgba(255,255,255,.06);border:1px solid rgba(255,200,150,.3);border-radius:10px;color:#f4ece2;font-family:inherit;font-size:15px;padding:10px 16px;width:min(70vw,300px);text-align:center;outline:none}",
      ".act-ov .pc-ghost{position:absolute;top:-2px;color:#ffd9a8;font-size:18px;pointer-events:none;animation:pcGhost .72s ease-out forwards}",
      "@keyframes pcGhost{from{opacity:.9;transform:translateY(0)}to{opacity:0;transform:translateY(-22px)}}",
      ".act-ov .pc-dodge{transition:transform .18s cubic-bezier(.3,0,.2,1)}",
      ".act-ov .pc-dodge:disabled{opacity:.6;cursor:not-allowed;border-color:rgba(255,120,120,.4);color:#ffb3b3}",
      ".act-ov .note-wipe{margin-top:1.2em;padding:18px 22px;border-radius:12px;border:1px dashed rgba(255,200,150,.3);cursor:ew-resize;touch-action:none;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;max-width:min(82vw,440px)}",
      ".act-ov .note-blur{font-size:16px;line-height:1.9;color:#ffe9d6;transition:filter .08s,opacity .08s;pointer-events:none}",
      ".act-ov .note-trail{margin-top:.9em;font-size:12px;letter-spacing:.18em;color:#caa6b4;transition:opacity .5s;pointer-events:none}",
      ".act-ov::before,.act-ov::after{content:'';position:fixed;left:0;right:0;height:0;background:#06050a;z-index:5;transition:height 1s cubic-bezier(.7,0,.3,1);pointer-events:none}",
      ".act-ov::before{top:0}",
      ".act-ov::after{bottom:0}",
      ".act-ov.show::before,.act-ov.show::after{height:6.5vh}",
      ".act-ov .th-stage{position:relative;width:min(82vw,440px);height:130px;margin-top:1.4em}",
      ".act-ov .th-heart{position:absolute;top:55%;transform:translateY(-50%);width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;color:#2a1820;background:radial-gradient(circle,#fff,#ffd9e6);box-shadow:0 0 22px rgba(255,150,190,.7);animation:thGlow 3s ease-in-out infinite}",
      ".act-ov .th-dad{left:1%}",
      ".act-ov .th-aunt{right:1%}",
      ".act-ov .th-me{left:50%;transform:translate(-50%,-50%);top:12%;width:42px;height:42px}",
      ".act-ov .th-thread{position:absolute;top:55%;left:6%;right:6%;height:2px;background:linear-gradient(90deg,#ff6b9d,#ffd9a8,#ff6b9d);box-shadow:0 0 8px rgba(255,120,160,.8)}",
      "@keyframes thGlow{0%,100%{box-shadow:0 0 18px rgba(255,150,190,.6)}50%{box-shadow:0 0 30px rgba(255,180,210,.95)}}",
      ".act-ov .inf-dwrap{display:flex;flex-direction:column;align-items:center;margin-bottom:.6em;min-height:56px;justify-content:flex-end}",
      ".act-ov .inf-daughter{width:38px;height:38px;border-radius:50%;background:radial-gradient(circle,#fff,#ffd9e6);opacity:.12;transform:scale(.7);box-shadow:0 0 8px rgba(255,185,212,.4);transition:opacity 1s ease,transform 1s ease,box-shadow 1s ease}",
      ".act-ov .inf-dcap{font-size:11px;letter-spacing:.24em;color:#ffd9e6;margin-top:.4em;opacity:.2;transition:opacity 1s ease}",
      ".act-ov .believe-thread{position:fixed;left:10%;right:10%;bottom:17%;height:2px;background:linear-gradient(90deg,transparent,#ff6b9d,#ffd9a8,#ff6b9d,transparent);box-shadow:0 0 10px rgba(255,120,160,.7);opacity:0;transform:translateY(40px) scaleX(.3);transition:opacity 3s ease,transform 3.6s cubic-bezier(.5,0,.3,1);pointer-events:none}",
      ".act-ov .believe-thread.rise{opacity:.92;transform:translateY(0) scaleX(1)}",
      ".act-ov .th-draggable{cursor:grab;touch-action:none;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;animation:none}",
      ".act-ov .th-draggable:active{cursor:grabbing}",
      // standStill（EP38 站好）：放手往前衝的晃動
      ".act-ov.ss-lurch{animation:ssLurch .42s ease}",
      "@keyframes ssLurch{0%,100%{transform:translateX(0)}28%{transform:translateX(9px) rotate(.5deg)}60%{transform:translateX(-7px) rotate(-.3deg)}}",
      // riverbank（EP7 河堤）：慢慢走到底的暖光軌
      ".act-ov .rb-track{position:relative;width:min(80vw,460px);height:8px;margin-top:1.8em;border-radius:4px;background:rgba(255,210,160,.12);cursor:ew-resize;touch-action:none;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none}",
      ".act-ov .rb-glow{position:absolute;inset:0;border-radius:4px;background:linear-gradient(90deg,#ffd9a8,#ffb877);opacity:.3;transition:opacity .4s}",
      ".act-ov .rb-dot{position:absolute;top:50%;left:0;width:16px;height:16px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,#fff,#ffd9a8);box-shadow:0 0 16px rgba(255,200,150,.9)}",
      // knowingVsBelieving（EP41 知道vs相信）：冷白「知道」光球
      ".act-ov .kb-orb{width:64px;height:64px;border-radius:50%;margin-top:1.5em;display:flex;align-items:center;justify-content:center;font-size:14px;letter-spacing:.1em;color:#1a2436;background:radial-gradient(circle,#fff,#cfe0ff 72%);box-shadow:0 0 30px rgba(200,222,255,.82);cursor:pointer;touch-action:none;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none}",
    ].join("");
    document.head.appendChild(s);
  }

  function makeOverlay() {
    injectStyle();
    const ov = el("div", "act-ov");
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add("show"));
    return ov;
  }
  function closeOverlay(ov, cb, delay) {
    setTimeout(() => {
      ov.classList.remove("show");
      setTimeout(() => { if (ov.parentNode) ov.parentNode.removeChild(ov); if (cb) cb(); }, 900);
    }, delay || 0);
  }

  // ── Act 2 一眼瞬間・凝視(EP38/3:按住撐住那一眼;Before Your Eyes 反向)──
  function gaze(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "2005 · 11:00 · 一眼瞬間"));
    const line = el("div", "act-line", "鐘響了。他在前門找不到妳。電話響起，妳輕輕說：「你走到後門。」");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "他走過背光的走廊……按住下面這束光，撐住這一眼。");
    ov.appendChild(sub);
    const zone = el("div", "gaze-zone");
    zone.appendChild(el("div", "gaze-core"));
    zone.appendChild(el("div", "gaze-twin gaze-twin-l")); // 1994 凍齡的妳
    zone.appendChild(el("div", "gaze-twin gaze-twin-r")); // 2005 此刻的妳 — 撐住凝視時兩個妳在同一瞳孔交疊
    ov.appendChild(zone);
    const meterWrap = el("div", "gaze-meter");
    const fill = el("i"); meterWrap.appendChild(fill); ov.appendChild(meterWrap);

    let holding = false, hold = 0, raf = 0, last = 0, done = false, nextBeat = 0.25;
    const NEED = 3.2;
    function loop(t) {
      if (done) return;
      if (!last) last = t;
      const dt = (t - last) / 1000; last = t;
      if (holding) {
        hold = Math.min(NEED, hold + dt);
        if (hold >= nextBeat) { SFX.beat(); nextBeat = hold + Math.max(0.34, 0.85 - (hold / NEED) * 0.5); } // 越撐越近，心跳越急
      } else { hold = Math.max(0, hold - dt * 1.6); nextBeat = Math.min(nextBeat, hold + 0.25); }
      fill.style.width = (hold / NEED * 100) + "%";
      ov.classList.toggle("gaze-bloom", hold > NEED * 0.55);
      if (hold >= NEED) { return finish(true); }
      raf = requestAnimationFrame(loop);
    }
    function down(e) { e.preventDefault(); holding = true; SFX.ensure(); }
    function up() { holding = false; }
    function finish(ok) {
      done = true; cancelAnimationFrame(raf);
      zone.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (ok) { try { if (navigator.vibrate) navigator.vibrate(0); } catch (e) {} } // 命運按下存檔鍵的那一秒 — 刻意靜音留白
      if (ok) {
        // 一眼瞬間定格：先 0.9s 純留白 + 全畫面暖金 flash，文字才浮現，俏皮話延後到 ~2.2s（所有後製都為這一秒服務）
        if (meterWrap) meterWrap.style.display = "none";
        ov.classList.add("gaze-bloom");
        const flash = el("div", "gaze-flash"); ov.appendChild(flash);
        requestAnimationFrame(function () { flash.classList.add("on"); });
        line.textContent = ""; sub.textContent = "";
        setTimeout(function () { line.textContent = "他抬起頭。\n你們誰都還來不及開口。\n那一秒，像被命運按了存檔鍵。"; }, 900);
        setTimeout(function () { sub.textContent = "他心裡冒出一句很不正經的：「也太像徐若瑄了吧。」"; }, 2200);
        closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 4200);
      } else {
        line.textContent = "妳鬆開得太早了，那一眼只成了餘光……";
        sub.textContent = "再按住一次，撐久一點。";
        setTimeout(() => { done = false; hold = 0; last = 0; sub.textContent = "他走過背光的走廊……按住下面這束光，撐住這一眼。"; zone.addEventListener("pointerdown", down); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up); raf = requestAnimationFrame(loop); }, 1600);
      }
    }
    zone.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    raf = requestAnimationFrame(loop);
  }

  // ── Act 4 兩張紙條(EP21/24/26:哭著放→笑著放;留下=女兒消失 悖論)──
  function note(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "2006 · 機車上的那張紙條"));
    const line = el("div", "act-line", "「我走了，你要好好照顧自己。」她把紙條握在手裡，站在他的 125 旁邊。妳要怎麼放下它？");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "");
    ov.appendChild(sub);
    const choices = el("div", "act-choices");
    ov.appendChild(choices);
    let stage = 0; // 0=第一次, 1=第二次

    function btn(label, fn) {
      const b = el("button", "act-btn", label);
      b.addEventListener("click", fn);
      return b;
    }
    function clear() { while (choices.firstChild) choices.removeChild(choices.firstChild); }

    function renderStage() {
      clear();
      if (stage === 0) {
        choices.appendChild(btn("哭著放下", () => {
          sub.textContent = "她哭著，把紙條貼在他機車的儀表板前。一滴眼淚，落在冰涼的坐墊上。";
          stage = 1;
          setTimeout(secondPrompt, 1900);
          clear();
        }));
        choices.appendChild(btn("留下，不走", () => {
          sub.textContent = "如果她留下……背景裡，女兒的身影開始淡掉。命運阿嬤說過：她的溫柔，會把女兒抹消。";
          line.style.opacity = "0.4";
          setTimeout(() => { line.style.opacity = "1"; sub.textContent = "她紅著眼，把手收回來。這一次，她還是不能留。"; renderStage(); }, 2600);
          clear();
        }));
      }
    }
    function secondPrompt() {
      line.textContent = "可是這樣還不夠。她又走了回來，第二次拿起同一張紙條。";
      sub.textContent = "用手指，橫向擦過那行被淚水模糊的字，把眼淚擦乾。";
      clear();
      const wipe = el("div", "note-wipe");
      const blurLine = el("div", "note-blur", "「我走了，你要好好照顧自己。」");
      const trail = el("div", "note-trail", "往後好多年，她不敢再經過的「民安西路」");
      wipe.appendChild(blurLine); wipe.appendChild(trail);
      choices.appendChild(wipe);
      let dragging = false, lastX = 0, progress = 0, doneW = false;
      function paint() {
        blurLine.style.filter = "blur(" + ((1 - progress) * 3).toFixed(2) + "px)"; blurLine.style.opacity = (0.45 + progress * 0.55).toFixed(2);
        trail.style.opacity = (0.1 + (1 - progress) * 0.22).toFixed(2); // 越擦越淡，那條不敢經過的路慢慢被擦掉
      }
      paint();
      function down(e) { e.preventDefault(); dragging = true; lastX = e.clientX; }
      function move(e) {
        if (!dragging || doneW) return;
        progress = Math.min(1, progress + Math.abs(e.clientX - lastX) / 420);
        lastX = e.clientX; paint();
        if (progress >= 1) finishWipe();
      }
      function up() { dragging = false; }
      function finishWipe() {
        if (doneW) return; doneW = true;
        wipe.removeEventListener("pointerdown", down);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        blurLine.style.filter = "blur(0)"; blurLine.style.opacity = "1";
        trail.style.opacity = "0.85"; // 擦乾的瞬間，那條路亮一下，再放下
        setTimeout(function () {
          clear();
          sub.textContent = "她擦乾眼淚，笑著，把同一張紙條，又放了一次。\n第一次是不捨。第二次，是成全。";
          setTimeout(function () { sub.textContent = "「真的痛在心裡殘忍的告別，把拔的心才能被徹底粉碎後，用時間一針一針，紮實地縫起來。」"; }, 3400);
          closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 7600);
        }, 1400);
      }
      wipe.addEventListener("pointerdown", down);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    }
    renderStage();
  }

  // ── Act 3 禁忌擁抱(EP12:衝上去抱他會撕裂時間線→女兒消失;忍住=收手)──
  function hug(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "2005 · 一眼瞬間之後"));
    const line = el("div", "act-line", "他就站在那裡，近得妳能聽見他的呼吸。妳的手，好想抱上去。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "按住下面那束光，把他往妳這裡拉近。但小心，背景裡有女兒。");
    ov.appendChild(sub);
    const zone = el("div", "hug-zone");
    const daughter = el("div", "hug-daughter", "女 兒");
    const him = el("div", "hug-him");
    zone.appendChild(daughter); zone.appendChild(him);
    ov.appendChild(zone);

    let dragging = false, pull = 0, raf = 0, done = false, nextBeat = 0; // pull 0..1（拉近程度）
    function paint() {
      him.style.transform = "translateY(" + (-pull * 150) + "px) scale(" + (1 + pull * 0.6) + ")";
      him.style.filter = "blur(" + (1 - pull).toFixed(2) + "px)";
      daughter.style.opacity = Math.max(0.04, 1 - pull * 1.08).toFixed(2);
      if (pull > 0.66) sub.textContent = "女兒的身影快要消失了……時間線在撕裂。在她不見之前，放手。";
      else if (pull > 0.12) sub.textContent = "再近一點……可是女兒，正在淡掉。";
    }
    function loop() {
      if (done) return;
      pull = dragging ? Math.min(1, pull + 0.011) : Math.max(0, pull - 0.05);
      if (dragging && pull >= nextBeat) { SFX.beat(); nextBeat = pull + Math.max(0.12, 0.34 - pull * 0.24); } // 越想抱越近，心越急
      if (!dragging) nextBeat = Math.min(nextBeat, pull);
      paint();
      if (pull >= 1) return tornApart();
      raf = requestAnimationFrame(loop);
    }
    function down(e) { e.preventDefault(); dragging = true; SFX.ensure(); }
    function up() {
      if (done) return;
      dragging = false;
      if (pull > 0.25) { done = true; cancelAnimationFrame(raf); cleanup(); ease(finish); } // 主動放手 → 收回的這段刻意靜音
    }
    function tornApart() { // 硬抱到底：女兒消失 → 教學重來
      cancelAnimationFrame(raf); dragging = false;
      try { if (navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 130]); } catch (e) {} SFX.dud(); // 時間線撕裂
      sub.textContent = "如果抱下去，女兒就再也不存在了。妳猛地收手。";
      ease(function () { sub.textContent = "再試一次。這一次，在她消失之前，主動放手。"; raf = requestAnimationFrame(loop); });
    }
    function ease(after) { // 把 pull 平滑收回 0
      var step = function () { pull = Math.max(0, pull - 0.06); paint(); if (pull > 0) requestAnimationFrame(step); else after(); };
      step();
    }
    function cleanup() { zone.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); }
    function finish() {
      daughter.style.opacity = "1";
      line.textContent = "妳含著淚，把伸出去的手，一寸一寸收了回來。";
      sub.textContent = "「就抱著回憶吧。就好。」這樣，女兒才會存在。";
      closeOverlay(ov, function () { if (onDone) onDone({ ok: true, resisted: true }); }, 3400);
    }
    zone.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    raf = requestAnimationFrame(loop);
  }

  // ── Act 5 紅線導航(EP22:跟著暖色找到心的另一端)──
  function redthread(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "女兒 · 沿著紅線飛"));
    const line = el("div", "act-line", "我沿著那條紅線飛進他們之間。線的顏色一直在變：紅、粉、黃。命運阿嬤說，跟著「暖」的方向走，就能找到他們的心。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "");
    ov.appendChild(sub);
    const choices = el("div", "act-choices");
    ov.appendChild(choices);
    const opts = [{ n: "偏冷的灰藍", w: false }, { n: "溫暖的橘粉", w: true }, { n: "刺眼的慘白", w: false }];
    let step = 0;
    function render() {
      while (choices.firstChild) choices.removeChild(choices.firstChild);
      opts.forEach((c) => {
        const b = el("button", "act-btn", "往" + c.n + "的那端");
        b.addEventListener("click", () => {
          if (c.w) {
            step++;
            if (step >= 2) {
              sub.textContent = "紅線在我面前亮成一片溫柔的粉。線的另一端，是把拔。";
              while (choices.firstChild) choices.removeChild(choices.firstChild);
              closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 3200);
            } else { sub.textContent = "暖起來了。再往暖的方向。"; render(); }
          } else { sub.textContent = "這端越走越冷……我退回來，重新讀線的顏色。"; }
        });
        choices.appendChild(b);
      });
    }
    render();
  }

  // ── Act 6 MSN 隱身等待(EP6/7:等待也算在約會的時間裡)──
  function msn(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "2005 · MSN"));
    const line = el("div", "act-line", "他還沒上線。妳可以「隱身上線」，假裝不在，卻偷偷等他出現。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "等待的時候，也算在約會的時間裡。");
    ov.appendChild(sub);
    const choices = el("div", "act-choices");
    ov.appendChild(choices);
    const waitLines = ["螢幕安安靜靜的。", "風扇的聲音很大，我盯著他的頭像。", "他的狀態還是「離線」。可是我不想關掉視窗。"];
    let waited = 0;
    const wait = el("button", "act-btn", "隱身，再等一下");
    const leave = el("button", "act-btn", "算了，先關掉");
    wait.addEventListener("click", () => {
      waited++;
      if (waited >= 3) {
        sub.textContent = "「登登登」他上線了。視窗跳出一句：「妳今天，過得好嗎？」";
        line.textContent = "原來他也一直在等。我們都隱身著，等對方先出現。";
        while (choices.firstChild) choices.removeChild(choices.firstChild);
        closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 3600);
      } else { sub.textContent = waitLines[waited - 1] || "再等一下下。"; }
    });
    leave.addEventListener("click", () => {
      sub.textContent = "我關掉視窗。可是心裡那扇，一直沒關。";
      while (choices.firstChild) choices.removeChild(choices.firstChild);
      closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 3000);
    });
    choices.appendChild(wait); choices.appendChild(leave);
  }

  // ── Act 7 分手電話(EP13:只能承受,奪走能動性)──
  function phoneCall(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "2005 · 12 · 22 · 傍晚 · 伯達樓轉角"));
    const line = el("div", "act-line", "電話響了。是學妹打來的。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "");
    ov.appendChild(sub);
    const choices = el("div", "act-choices");
    ov.appendChild(choices);
    // Phase 1：她的聲音
    const seq1 = ["聽筒裡，學妹的聲音：「我們分手吧！你不要再來找我了！」", "傍晚，你（學長）站在伯達樓的轉角。天色昏暗，你的眼睛，早已泛紅。", "你張開嘴，想說一句「不要走」。"];
    let i = 0;
    function phase1() { if (i < seq1.length) { sub.textContent = seq1[i++]; setTimeout(phase1, 2600); } else tryToSpeak(); }
    // Phase 2：打字失效（機制即隱喻：一個字都發不出來，被奪走能動性）
    function tryToSpeak() {
      sub.textContent = "（試著打字告訴她……）";
      const wrap = el("div", "pc-inputwrap");
      const input = el("input", "pc-input");
      input.type = "text"; input.setAttribute("placeholder", "你想說的話…"); input.setAttribute("autocomplete", "off"); input.setAttribute("autocorrect", "off");
      wrap.appendChild(input); choices.appendChild(wrap);
      try { input.focus(); } catch (e) {}
      let attempts = 0, doneT = false;
      function ghost(c) {
        const g = el("span", "pc-ghost", c); wrap.appendChild(g);
        SFX.tone(168, 0.1, 0.03); // 每個字都發不出聲，悶悶地散掉
        setTimeout(() => { if (g.parentNode) g.parentNode.removeChild(g); }, 720);
        if (++attempts >= 4) finishTyping();
      }
      function onKey(e) { if (e.key && e.key.length === 1) { e.preventDefault(); ghost(e.key); } }       // 桌機
      function onInput() { const v = input.value; if (v) { input.value = ""; ghost(v.slice(-1)); } }       // iOS 軟鍵盤後備
      input.addEventListener("keydown", onKey);
      input.addEventListener("input", onInput);
      const fb = setTimeout(finishTyping, 7000);
      function finishTyping() {
        if (doneT) return; doneT = true; clearTimeout(fb);
        input.removeEventListener("keydown", onKey); input.removeEventListener("input", onInput);
        try { input.blur(); } catch (e) {}
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        sub.textContent = "話到了喉嚨，又被吞了回去。這一次，你，沒有挽留的權利。";
        setTimeout(phase2_5, 2800);
      }
    }
    // Phase 2.5：撥回去 — 黑名單是她按下的，你連那顆鍵都點不到（reuse dodge，EP13 奪走能動性）
    function phase2_5() {
      sub.textContent = "你想撥回去。手指，伸向那顆「撥回去」。";
      const dodge = el("button", "act-btn pc-dodge", "📞 撥回去");
      let dodges = 0, settled = false;
      function flee(e) {
        if (settled) return;
        if (e && e.preventDefault) e.preventDefault();
        dodges++;
        const dx = (Math.random() * 2 - 1) * Math.min(window.innerWidth * 0.3, 210);
        const dy = (Math.random() * 2 - 1) * Math.min(window.innerHeight * 0.2, 140);
        dodge.style.transform = "translate(" + dx.toFixed(0) + "px," + dy.toFixed(0) + "px)";
        SFX.dud(); try { if (navigator.vibrate) navigator.vibrate(16); } catch (er) {}
        if (dodges === 2) sub.textContent = "撥回去……怎麼按不到？";
        else if (dodges >= 4) settle();
      }
      function settle() {
        settled = true;
        dodge.removeEventListener("pointerenter", flee);
        dodge.removeEventListener("pointerdown", flee);
        dodge.style.transform = "translate(0,0)";
        dodge.disabled = true;
        dodge.textContent = "🚫 對方已將你列入黑名單";
        sub.textContent = "黑名單，是她按下的。撥不出去的，是你。";
        setTimeout(phase3, 2800);
      }
      dodge.addEventListener("pointerenter", flee); // 桌機：游標一靠近就閃
      dodge.addEventListener("pointerdown", flee);  // 觸控：手指還沒點到就閃開
      choices.appendChild(dodge);
    }
    // Phase 3：只能承受
    const seq3 = ["一個同學從轉角走過，卻沒有注意到你泛紅的眼睛。", "你只能站著，讓這一切，發生。"];
    let j = 0;
    function phase3() {
      if (j < seq3.length) { sub.textContent = seq3[j++]; setTimeout(phase3, 2600); }
      else {
        const b = el("button", "act-btn", "……（深呼吸，繼續）");
        b.addEventListener("click", () => { while (choices.firstChild) choices.removeChild(choices.firstChild); closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 1400); });
        choices.appendChild(b);
      }
    }
    phase1();
  }

  // ── Act 8 七年的 7-11 夜晚(EP19/26/29:重複即悲傷)──
  function sevenEleven(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "斷聯的那些年 · 她家附近的 7-11"));
    const line = el("div", "act-line", "我又來了。只是想呼吸一下，她走過的這條街的空氣。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "第 1 個夜晚");
    ov.appendChild(sub);
    const choices = el("div", "act-choices");
    ov.appendChild(choices);
    // P1-5 逐晚色溫變冷變暗（暖橙 → 冷藍，越夜越深；保留 opacity 淡入淡出）
    function setTemp(n) {
      const t = Math.min(1, (n - 1) / 4);
      const cr = (40 + (16 - 40) * t).toFixed(0), cg = (28 + (22 - 28) * t).toFixed(0), cb = (22 + (34 - 22) * t).toFixed(0);
      const er = (12 + (6 - 12) * t).toFixed(0), eg = (10 + (8 - 10) * t).toFixed(0), eb = (12 + (14 - 12) * t).toFixed(0);
      const ca = (0.5 + 0.06 * t).toFixed(2), ea = (0.92 + 0.05 * t).toFixed(2);
      ov.style.transition = "opacity .9s ease, background 1.4s ease";
      ov.style.background = "radial-gradient(120% 90% at 50% 40%,rgba(" + cr + "," + cg + "," + cb + "," + ca + "),rgba(" + er + "," + eg + "," + eb + "," + ea + "))";
    }
    setTemp(1);
    const nightLines = ["關東煮的熱氣。自動門開了又關，不是她。", "我買了一罐飲料，握在手心，沒打開。", "店員開始記得我。我假裝在看雜誌。"];
    let night = 1;
    const b = el("button", "act-btn", "再來一晚");
    b.addEventListener("click", () => {
      night++;
      setTemp(night);
      if (night >= 5) {
        sub.textContent = "她不會來。我知道。可是我還是，一晚一晚地來。";
        line.textContent = "時間就這樣，一針一針，把心縫了起來。";
        while (choices.firstChild) choices.removeChild(choices.firstChild);
        // EP28 飲料黑卡前瞻伏筆（斷聯夜晚 → 多年後 2023 冬的熱普洱黑卡）
        setTimeout(() => { line.textContent = "（總有一天，我會學會：心煩，就為她買一杯熱普洱無糖加厚，讓它，替我先抱住她。）"; sub.textContent = ""; }, 2600);
        closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 6400);
      } else { sub.textContent = "第 " + night + " 個夜晚"; line.textContent = nightLines[night - 2] || "我又來了。"; }
    });
    choices.appendChild(b);
  }

  // ── Act 9 無限時間線的選擇(EP28:我依然選擇你)──
  function infinite(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "無限的時間線"));
    const line = el("div", "act-line", "命運阿嬤把所有平行世界攤在我面前。每一條，都問同一句話。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "");
    ov.appendChild(sub);
    const choices = el("div", "act-choices");
    ov.appendChild(choices);
    // P1-6 女兒光點：每選一次「我依然選你」，那個叫女兒的光點就更亮（女兒＝這個選擇生出的未來）
    const dWrap = el("div", "inf-dwrap");
    const dDot = el("div", "inf-daughter");
    const dCap = el("div", "inf-dcap", "女兒");
    dWrap.appendChild(dDot); dWrap.appendChild(dCap);
    ov.insertBefore(dWrap, line);
    const worlds = ["在他沒當蛙人的那條線", "在妳沒生病的那條線", "在你們早十年相遇的那條線", "在這條，最痛的原始線"];
    function glowDaughter(k) {
      const f = Math.min(1, k / worlds.length);
      dDot.style.opacity = (0.12 + f * 0.88).toFixed(2);
      dDot.style.transform = "scale(" + (0.7 + f * 0.55).toFixed(2) + ")";
      dDot.style.boxShadow = "0 0 " + (8 + f * 36).toFixed(0) + "px rgba(255,185,212," + (0.4 + f * 0.6).toFixed(2) + ")";
      dCap.style.opacity = (0.2 + f * 0.8).toFixed(2);
    }
    glowDaughter(0);
    let i = 0;
    function render() {
      while (choices.firstChild) choices.removeChild(choices.firstChild);
      line.textContent = worlds[i] + "：妳，還會選擇跟他在一起嗎？";
      const yes = el("button", "act-btn", "我依然選擇跟你在一起");
      yes.addEventListener("click", () => {
        i++;
        glowDaughter(i); SFX.shimmer(); // 光點更亮一階 + 細柔泛音
        if (i >= worlds.length) {
          line.textContent = "在無限的時間線裡，我依然會選擇跟你在一起。";
          sub.textContent = "是我們先伸的手，是「選擇」，讓紅線成形。";
          while (choices.firstChild) choices.removeChild(choices.firstChild);
          setTimeout(() => { line.textContent = "命運阿嬤笑了：「命運不是命定！但紅線，是命中注定。」"; sub.textContent = "每一次妳說「我依然選你」，那個叫女兒的光點，就更亮一點。"; }, 2800);
          closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 6800);
        } else { sub.textContent = "紅線又亮了一條。女兒，又清晰了一點。"; render(); }
      });
      choices.appendChild(yes);
    }
    render();
  }

  // ── Act 10 相信的力量(EP40:不能穿越,只能相信)──
  function believe(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "2007 · 大兵日記 · 相信的力量"));
    const line = el("div", "act-line", "她走了。我不能穿越，也不能回頭。我只能往前，靠「相信」撐下去。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "");
    ov.appendChild(sub);
    const choices = el("div", "act-choices");
    ov.appendChild(choices);
    const pages = ["3000 公尺，跑到吐。", "半夜兩點站哨，星空冷得清楚。", "三分鐘的冷水澡。", "「顧一頭牛」那種荒謬的命令。"];
    let i = 0;
    function render() {
      while (choices.firstChild) choices.removeChild(choices.firstChild);
      if (i < pages.length) {
        line.textContent = pages[i];
        sub.textContent = "打不倒的自信，敲不碎的心。";
        const b = el("button", "act-btn", "選擇相信，翻過這一頁");
        b.addEventListener("click", () => { i++; render(); });
        choices.appendChild(b);
      } else {
        line.textContent = "我是靠「相信」，撐過了整整十五年。";
        sub.textContent = "我沒有在賭。我只是相信「相信的力量」。我一直站在妳永遠找得到我的地方。";
        const thread = el("div", "believe-thread"); ov.appendChild(thread);
        requestAnimationFrame(function () { requestAnimationFrame(function () { thread.classList.add("rise"); }); }); // 紅線緩緩升起
        closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 5600);
      }
    }
    render();
  }

  // ── Act 11 一串數字 1163(EP41:阿姨哭了七天，只傳把拔四個數字；女兒戴時空耳機同時聽見兩邊）──
  function train1163(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "EP41 · 一串數字 · 1163"));
    const line = el("div", "act-line", "把拔的手機，跳出四個數字：1163。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "你以為，她只是要告訴你一個班次。");
    ov.appendChild(sub);
    const choices = el("div", "act-choices");
    ov.appendChild(choices);
    function clear() { while (choices.firstChild) choices.removeChild(choices.firstChild); }
    function btn(label, fn) { const b = el("button", "act-btn", label); b.addEventListener("click", fn); return b; }
    const days = [
      "第一天。她哭了，卻說不出自己在哭什麼。",
      "第二天。哭到睡著，又哭著醒來。",
      "第六天。她忽然懂了，為什麼你以前下班，都不急著回家。",
      "第七天。她忍住沒有去找你。她只能告訴你：我，在這班車上。",
    ];
    let d = 0;
    function step() {
      SFX.beat(); // 每一個哭過的夜晚，一記心跳
      sub.textContent = days[d];
      d++;
      clear();
      const last = (d >= days.length);
      choices.appendChild(btn(last ? "聽完了" : "聽下一個數字", () => { clear(); last ? finish() : step(); }));
    }
    function phase2() { SFX.ensure(); line.textContent = "1163"; sub.textContent = ""; clear(); step(); }
    function finish() {
      line.textContent = "同一串數字。";
      sub.textContent = "她用整顆心寫，你用呆腦袋讀。";
      setTimeout(() => { line.textContent = "1163。\n不是一個班次，是七個哭過的夜晚。"; sub.textContent = ""; }, 2600);
      closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 5600);
    }
    // Phase 1：把拔視角，把它當成班次查
    choices.appendChild(btn("查火車時刻表", () => {
      sub.textContent = "把拔馬上去查火車時刻表。1163，是一個班次的號碼。他點點頭，把它當成一個號碼，讀完了。";
      clear();
      setTimeout(() => {
        sub.textContent = "可是，戴上時空耳機的妳，聽見的不是班次。";
        clear();
        choices.appendChild(btn("戴上時空耳機，一個數字一個數字地聽", phase2));
      }, 2200);
    }));
  }

  // ── Act 12 母親節康乃馨(EP41:把拔半夜在黑暗客廳放一朵花，謝謝媽媽沒放棄他；情感鏈最後一站）──
  function carnation(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "EP41 · 母親節 · 半夜十二點"));
    const line = el("div", "act-line", "客廳沒有開燈。只有一張隱約的餐桌。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "你手上，有一朵康乃馨。把它，輕輕放在桌上。");
    ov.appendChild(sub);
    const choices = el("div", "act-choices");
    ov.appendChild(choices);
    const b = el("button", "act-btn", "🌸　輕輕放下");
    b.addEventListener("click", () => {
      while (choices.firstChild) choices.removeChild(choices.firstChild);
      line.textContent = "「謝謝妳，從來都沒有放棄過我。」";
      sub.textContent = "";
      setTimeout(() => { sub.textContent = "他能撐過十五年，是因為他自己，也曾被一句溫柔，接住過。"; }, 2800);
      closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 6200);
    });
    choices.appendChild(b);
  }

  // ── Act 13 三顆心同框(EP41 capstone:你從來都不是一個人 — 把拔/阿姨/女兒同一條紅線）──
  function threehearts(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "EP41 · 你從來都不是一個人"));
    const line = el("div", "act-line", "我在把拔的心裡聽到的，是阿姨的聲音。\n我在阿姨的心裡看到的，是滿滿的把拔。");
    ov.appendChild(line);
    const stage = el("div", "th-stage");
    const thread = el("div", "th-thread");
    const dad = el("div", "th-heart th-dad", "把拔");
    const aunt = el("div", "th-heart th-aunt", "阿姨");
    const me = el("div", "th-heart th-me th-draggable", "我");
    stage.appendChild(thread); stage.appendChild(dad); stage.appendChild(aunt); stage.appendChild(me);
    ov.appendChild(stage);
    const sub = el("div", "act-sub", "用手指，把「我」這顆心，往下拖到紅線中央。");
    ov.appendChild(sub);
    // P2-8 玩家親手把「我」放進那條紅線（reuse drag）；放進去的那一刻＝你從來都不是一個人
    let dragging = false, prog = 0, done = false, startY = 0, startProg = 0; // prog 0(上方) → 1(紅線中央)
    function paint() {
      me.style.top = (12 + prog * 43).toFixed(1) + "%";
      me.style.opacity = (0.55 + prog * 0.45).toFixed(2);
      me.style.boxShadow = "0 0 " + (12 + prog * 26).toFixed(0) + "px rgba(255,150,190," + (0.5 + prog * 0.5).toFixed(2) + ")";
      thread.style.opacity = (0.5 + prog * 0.5).toFixed(2);
      thread.style.boxShadow = "0 0 " + (8 + prog * 18).toFixed(0) + "px rgba(255,120,160," + (0.6 + prog * 0.4).toFixed(2) + ")";
    }
    paint();
    function down(e) { if (done) return; e.preventDefault(); dragging = true; startY = (e.clientY || 0); startProg = prog; }
    function move(e) {
      if (!dragging || done) return;
      prog = Math.max(0, Math.min(1, startProg + ((e.clientY || 0) - startY) / 220)); // 往下拖 → prog 增
      paint();
      if (prog >= 0.92) settle();
    }
    function up() { if (done || !dragging) return; dragging = false; if (prog < 0.92) sub.textContent = "再往下一點，把「我」放進那條紅線裡。"; }
    function settle() {
      done = true; dragging = false;
      me.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      prog = 1; paint();
      me.classList.remove("th-draggable"); // 放進紅線後，三顆心一起脈動（th-heart glow 接管；capstone 刻意靜音留白）
      sub.textContent = "三顆心，同一條拉得再長也不會斷的紅線。";
      setTimeout(function () { line.textContent = "原來，我從來都不是一個人。"; sub.textContent = ""; }, 2800);
      closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 6200);
    }
    me.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  // ── Act 14 站好(EP38:愛最難的不是衝，是站好不動。反向 hold：按住=釘住，放手=往前衝失控）──
  function standStill(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "2005 · 10:40 · 走廊"));
    const line = el("div", "act-line", "「然後，站好等他。」\n可是等一下他真的往這裡走的時候，妳全身，都會想往前衝。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "按住下面這束光，把自己釘在後門。撐住，別往前衝。");
    ov.appendChild(sub);
    const zone = el("div", "gaze-zone");
    zone.appendChild(el("div", "gaze-core"));
    ov.appendChild(zone);
    const meterWrap = el("div", "gaze-meter"); const fill = el("i"); meterWrap.appendChild(fill); ov.appendChild(meterWrap);
    let holding = false, hold = 0, raf = 0, last = 0, done = false, nextBeat = 0.25;
    const NEED = 3.4;
    function loop(t) {
      if (done) return;
      if (!last) last = t;
      const dt = (t - last) / 1000; last = t;
      if (holding) { hold = Math.min(NEED, hold + dt); if (hold >= nextBeat) { SFX.beat(); nextBeat = hold + Math.max(0.3, 0.8 - (hold / NEED) * 0.46); } }
      else { hold = Math.max(0, hold - dt * 0.9); nextBeat = Math.min(nextBeat, hold + 0.25); }
      fill.style.width = (hold / NEED * 100) + "%";
      if (hold >= NEED) return finish();
      raf = requestAnimationFrame(loop);
    }
    function lurch() { ov.classList.add("ss-lurch"); sub.textContent = "妳往前衝了半步……時間線晃了一下。穩住，再站好。"; setTimeout(function () { ov.classList.remove("ss-lurch"); }, 460); }
    function down(e) { e.preventDefault(); holding = true; SFX.ensure(); }
    function up() { if (done || !holding) return; holding = false; if (hold > 0.15) lurch(); }
    function finish() {
      done = true; cancelAnimationFrame(raf); ov.classList.remove("ss-lurch");
      zone.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      line.textContent = "妳站住了。\n他自己，走完了那段背光的走廊。";
      sub.textContent = "";
      setTimeout(function () { sub.textContent = "以後某個很難熬的夜晚，妳會謝謝這個，沒有往前多跨一步的自己。"; }, 1600);
      closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 5400);
    }
    zone.addEventListener("pointerdown", down); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    raf = requestAnimationFrame(loop);
  }

  // ── Act 15 河堤的風(EP7:可以就這樣白頭偕老的那個黃昏。慢滑＝捨不得走完，越慢黃昏留越久）──
  function riverbank(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "2018 · 重新堤外道 · 黃昏"));
    const line = el("div", "act-line", "沒有紅綠燈，也沒有車。只有妳、我、黃昏、河堤、風聲。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "用手指，慢慢地、捨不得地，把這段回家的路滑到底。越慢，黃昏留得越久。");
    ov.appendChild(sub);
    const track = el("div", "rb-track"); const glow = el("div", "rb-glow"); const dot = el("div", "rb-dot");
    track.appendChild(glow); track.appendChild(dot); ov.appendChild(track);
    let dragging = false, prog = 0, lastX = 0, done = false, fast = 0;
    function paint() {
      dot.style.left = (prog * 100) + "%";
      glow.style.opacity = (0.3 + prog * 0.6).toFixed(2);
      ov.style.background = "radial-gradient(120% 90% at 50% 55%,rgba(" + (40 + prog * 38).toFixed(0) + "," + (28 + prog * 16).toFixed(0) + ",22,.5),rgba(12,9,10,.92))";
    }
    paint();
    function down(e) { e.preventDefault(); dragging = true; lastX = e.clientX || 0; }
    function move(e) {
      if (!dragging || done) return;
      const x = e.clientX || 0, dx = Math.abs(x - lastX); lastX = x;
      if (dx > 16) { fast++; if (fast > 2) sub.textContent = "別騎那麼快。讓黃昏，再久一點。"; prog = Math.min(1, prog + dx / 1000); }
      else { prog = Math.min(1, prog + dx / 540); } // 慢滑推進較多：獎勵捨不得
      paint();
      if (prog >= 1) finish();
    }
    function up() { dragging = false; }
    function finish() {
      done = true;
      track.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      line.textContent = "那時，真的覺得，\n可以就這樣，白頭偕老。";
      sub.textContent = "";
      closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 4400);
    }
    track.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  }

  // ── Act 16 知道，與相信(EP41 capstone 女兒視角：握著「知道」救不了他 → 主動放下，改成相信）──
  function knowingVsBelieving(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "EP41 · 知道，與相信"));
    const line = el("div", "act-line", "我手上明明握著「知道」。\n可是「知道」，救不了現在的他。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "按住那顆「知道」，聽我說完。");
    ov.appendChild(sub);
    const orb = el("div", "kb-orb", "知道"); ov.appendChild(orb);
    const beats = ["童話故事裡，痛的人翻過一頁，就會有人來敲門。", "可是我這裡，沒辦法敲門。我住在台中，你住在桃園。", "我看著趴在桌上的你。我什麼都知道，卻一句都不能說。"];
    let holding = false, done = false, step = 0, dim = 0, raf = 0, last = 0, ready = false, beatTimer = 0;
    function paint() { orb.style.opacity = (1 - dim * 0.72).toFixed(2); orb.style.transform = "scale(" + (1 - dim * 0.25).toFixed(2) + ")"; orb.style.boxShadow = "0 0 " + (30 - dim * 24).toFixed(0) + "px rgba(200,222,255," + (0.82 - dim * 0.64).toFixed(2) + ")"; }
    paint();
    function loop(t) {
      if (done) return;
      if (!last) last = t;
      const dt = (t - last) / 1000; last = t;
      if (holding && step < beats.length) {
        beatTimer += dt;
        dim = Math.min((step + beatTimer / 2.2) / (beats.length + 0.2), 0.95);
        if (beatTimer >= 2.2) { sub.textContent = beats[step]; step++; beatTimer = 0; SFX.tone(170, 0.12, 0.024); }
      } else if (holding && step >= beats.length && !ready) { ready = true; dim = 0.95; sub.textContent = "「知道」沒有用。放下它。鬆手吧。"; }
      paint();
      raf = requestAnimationFrame(loop);
    }
    function down(e) { e.preventDefault(); holding = true; SFX.ensure(); }
    function up() { holding = false; if (ready && !done) release(); }
    function release() {
      done = true; cancelAnimationFrame(raf);
      orb.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      orb.style.transition = "opacity 1.2s ease,transform 1.2s ease"; orb.style.opacity = "0"; orb.style.transform = "scale(.4)";
      const thread = el("div", "believe-thread"); ov.appendChild(thread);
      requestAnimationFrame(function () { requestAnimationFrame(function () { thread.classList.add("rise"); }); });
      line.textContent = "所以我把「知道」放下。\n我決定，跟把拔做同一件事。";
      sub.textContent = "";
      setTimeout(function () { line.textContent = "我不是因為看過了才相信。\n我是因為，我願意相信。"; }, 2600);
      setTimeout(function () { sub.textContent = "就跟把拔一樣。"; }, 5000);
      closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 7400);
    }
    orb.addEventListener("pointerdown", down); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    raf = requestAnimationFrame(loop);
  }

  // ── 鏈執行器:串起多個 act 成情感弧 ──
  // ── Capstone：三顆心同框定格（EP41 頂點；runChain 全鏈跑完後 onAll 觸發的收尾留白） ──
  function capstone(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "EP41 · 這不是童話故事"));
    const line = el("div", "act-line", "三條時間線，\n終於收進同一格畫面裡。");
    ov.appendChild(line);
    const stage = el("div", "th-stage");
    const thread = el("div", "th-thread");
    const dad = el("div", "th-heart th-dad", "把拔");
    const aunt = el("div", "th-heart th-aunt", "阿姨");
    const me = el("div", "th-heart th-me", "我");
    me.style.top = "55%"; me.style.transform = "translate(-50%,-50%)"; // 「我」已在紅線中央：三顆心同框定格
    stage.appendChild(thread); stage.appendChild(dad); stage.appendChild(aunt); stage.appendChild(me);
    ov.appendChild(stage);
    const sub = el("div", "act-sub", "");
    ov.appendChild(sub);
    try { SFX.heartbeat(3, 600); } catch (e) {}
    setTimeout(function () { sub.textContent = "不是童話。是我們，真的這樣相信過來的。"; }, 2800);
    closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 6000);
  }

  function runChain(ids, onAll) {
    if (document.querySelector(".act-ov")) return; // W3：已有 overlay 開著就忽略，避免疊字穿透
    const map = { gaze: gaze, standStill: standStill, note: note, hug: hug, redthread: redthread, msn: msn, phoneCall: phoneCall, sevenEleven: sevenEleven, riverbank: riverbank, infinite: infinite, believe: believe, train1163: train1163, knowingVsBelieving: knowingVsBelieving, carnation: carnation, threehearts: threehearts };
    let i = 0;
    function next() {
      if (i >= ids.length) { if (onAll) onAll(); return; }
      const fn = map[ids[i++]];
      if (typeof fn === "function") fn(next); else next();
    }
    next();
  }

  if (typeof window !== "undefined") {
    window.__ACTS__ = {
      gaze: gaze, standStill: standStill, note: note, hug: hug, redthread: redthread, msn: msn,
      phoneCall: phoneCall, sevenEleven: sevenEleven, riverbank: riverbank, infinite: infinite, believe: believe,
      train1163: train1163, knowingVsBelieving: knowingVsBelieving, carnation: carnation, threehearts: threehearts,
      capstone: capstone, runChain: runChain,
    };
  }
})();
