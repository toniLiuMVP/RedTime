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
      ".act-ov .hug-zone{position:relative;width:min(74vw,360px);height:min(46vh,300px);margin-top:1.2em;border-radius:18px;cursor:grab;touch-action:none;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;border:1px solid rgba(255,210,160,.14)}",
      ".act-ov .hug-zone:active{cursor:grabbing}",
      ".act-ov .hug-daughter{position:absolute;top:12%;left:50%;transform:translateX(-50%);font-size:13px;letter-spacing:.34em;color:#ffd9e6;text-shadow:0 0 14px rgba(255,150,190,.6);transition:opacity .12s;pointer-events:none}",
      ".act-ov .hug-him{width:42px;height:42px;border-radius:50%;margin-bottom:20px;background:radial-gradient(circle,#fff,#ffd9a8 58%,rgba(255,200,150,0));box-shadow:0 0 28px rgba(255,210,150,.85);transition:filter .1s;pointer-events:none}",
      ".act-ov .pc-inputwrap{position:relative;margin-top:1.2em;display:flex;flex-direction:column;align-items:center}",
      ".act-ov .pc-input{background:rgba(255,255,255,.06);border:1px solid rgba(255,200,150,.3);border-radius:10px;color:#f4ece2;font-family:inherit;font-size:15px;padding:10px 16px;width:min(70vw,300px);text-align:center;outline:none}",
      ".act-ov .pc-ghost{position:absolute;top:-2px;color:#ffd9a8;font-size:18px;pointer-events:none;animation:pcGhost .72s ease-out forwards}",
      "@keyframes pcGhost{from{opacity:.9;transform:translateY(0)}to{opacity:0;transform:translateY(-22px)}}",
      ".act-ov .note-wipe{margin-top:1.2em;padding:18px 22px;border-radius:12px;border:1px dashed rgba(255,200,150,.3);cursor:ew-resize;touch-action:none;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;max-width:min(82vw,440px)}",
      ".act-ov .note-blur{font-size:16px;line-height:1.9;color:#ffe9d6;transition:filter .08s,opacity .08s;pointer-events:none}",
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
    ov.appendChild(zone);
    const meterWrap = el("div", "gaze-meter");
    const fill = el("i"); meterWrap.appendChild(fill); ov.appendChild(meterWrap);

    let holding = false, hold = 0, raf = 0, last = 0, done = false;
    const NEED = 3.2;
    function loop(t) {
      if (done) return;
      if (!last) last = t;
      const dt = (t - last) / 1000; last = t;
      if (holding) hold = Math.min(NEED, hold + dt); else hold = Math.max(0, hold - dt * 1.6);
      fill.style.width = (hold / NEED * 100) + "%";
      ov.classList.toggle("gaze-bloom", hold > NEED * 0.55);
      if (hold >= NEED) { return finish(true); }
      raf = requestAnimationFrame(loop);
    }
    function down(e) { e.preventDefault(); holding = true; }
    function up() { holding = false; }
    function finish(ok) {
      done = true; cancelAnimationFrame(raf);
      zone.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      line.textContent = ok
        ? "他抬起頭。\n你們誰都還來不及開口。\n那一秒，像被命運按了存檔鍵。"
        : "妳鬆開得太早了，那一眼只成了餘光……";
      sub.textContent = ok ? "" : "再按住一次，撐久一點。";
      if (ok) { setTimeout(() => { sub.textContent = "也太像徐若瑄了吧。"; }, 1100); closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 3000); }
      else { setTimeout(() => { done = false; hold = 0; last = 0; sub.textContent = "他走過背光的走廊……按住下面這束光，撐住這一眼。"; zone.addEventListener("pointerdown", down); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up); raf = requestAnimationFrame(loop); }, 1600); }
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
      wipe.appendChild(blurLine);
      choices.appendChild(wipe);
      let dragging = false, lastX = 0, progress = 0, doneW = false;
      function paint() { blurLine.style.filter = "blur(" + ((1 - progress) * 3).toFixed(2) + "px)"; blurLine.style.opacity = (0.45 + progress * 0.55).toFixed(2); }
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
        clear();
        sub.textContent = "她擦乾眼淚，笑著，把同一張紙條，又放了一次。\n第一次是不捨。第二次，是成全。";
        closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 4200);
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

    let dragging = false, pull = 0, raf = 0, done = false; // pull 0..1（拉近程度）
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
      paint();
      if (pull >= 1) return tornApart();
      raf = requestAnimationFrame(loop);
    }
    function down(e) { e.preventDefault(); dragging = true; }
    function up() {
      if (done) return;
      dragging = false;
      if (pull > 0.25) { done = true; cancelAnimationFrame(raf); cleanup(); ease(finish); }
    }
    function tornApart() { // 硬抱到底：女兒消失 → 教學重來
      cancelAnimationFrame(raf); dragging = false;
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
        setTimeout(phase3, 2800);
      }
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
    const nightLines = ["關東煮的熱氣。自動門開了又關，不是她。", "我買了一罐她以前喝的飲料，沒打開。", "店員開始記得我。我假裝在看雜誌。"];
    let night = 1;
    const b = el("button", "act-btn", "再來一晚");
    b.addEventListener("click", () => {
      night++;
      if (night >= 5) {
        sub.textContent = "她不會來。我知道。可是我還是，一晚一晚地來。";
        line.textContent = "時間就這樣，一針一針，把心縫了起來。";
        while (choices.firstChild) choices.removeChild(choices.firstChild);
        closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 3600);
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
    const worlds = ["在他沒當蛙人的那條線", "在妳沒生病的那條線", "在你們早十年相遇的那條線", "在這條，最痛的原始線"];
    let i = 0;
    function render() {
      while (choices.firstChild) choices.removeChild(choices.firstChild);
      line.textContent = worlds[i] + "：妳，還會選擇跟他在一起嗎？";
      const yes = el("button", "act-btn", "我依然選擇跟你在一起");
      yes.addEventListener("click", () => {
        i++;
        if (i >= worlds.length) {
          line.textContent = "在無限的時間線裡，我依然會選擇跟你在一起。";
          sub.textContent = "是我們先伸的手，是「選擇」，讓紅線成形。";
          while (choices.firstChild) choices.removeChild(choices.firstChild);
          closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 3800);
        } else { sub.textContent = "紅線又亮了一條。"; render(); }
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
        sub.textContent = "相信「相信的力量」。我一直都站在妳永遠找得到我的地方。";
        closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 4200);
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
      sub.textContent = days[d];
      d++;
      clear();
      const last = (d >= days.length);
      choices.appendChild(btn(last ? "聽完了" : "聽下一個數字", () => { clear(); last ? finish() : step(); }));
    }
    function phase2() { line.textContent = "1163"; sub.textContent = ""; clear(); step(); }
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
    const me = el("div", "th-heart th-me", "我");
    stage.appendChild(thread); stage.appendChild(dad); stage.appendChild(aunt); stage.appendChild(me);
    ov.appendChild(stage);
    const sub = el("div", "act-sub", "");
    ov.appendChild(sub);
    setTimeout(function () { sub.textContent = "三顆心，同一條拉得再長也不會斷的紅線。"; }, 2600);
    setTimeout(function () { line.textContent = "原來，我從來都不是一個人。"; sub.textContent = ""; }, 5200);
    closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 8000);
  }

  // ── 鏈執行器:串起多個 act 成情感弧 ──
  function runChain(ids, onAll) {
    if (document.querySelector(".act-ov")) return; // W3：已有 overlay 開著就忽略，避免疊字穿透
    const map = { gaze: gaze, note: note, hug: hug, redthread: redthread, msn: msn, phoneCall: phoneCall, sevenEleven: sevenEleven, infinite: infinite, believe: believe, train1163: train1163, carnation: carnation, threehearts: threehearts };
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
      gaze: gaze, note: note, hug: hug, redthread: redthread, msn: msn,
      phoneCall: phoneCall, sevenEleven: sevenEleven, infinite: infinite, believe: believe,
      train1163: train1163, carnation: carnation, threehearts: threehearts,
      runChain: runChain,
    };
  }
})();
