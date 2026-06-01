// twin-b-acts.js — 雙時空B Acts 2-10(後一眼瞬間的戀愛弧 overlay vignettes)
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
      ".act-ov .act-line{font-size:clamp(15px,2.2vw,21px);line-height:2;max-width:660px;text-shadow:0 0 14px rgba(255,200,150,.25);min-height:2em}",
      ".act-ov .act-sub{font-size:13px;opacity:.66;margin-top:1em;letter-spacing:.08em}",
      ".act-ov .act-choices{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:1.6em}",
      ".act-ov .act-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,200,150,.3);border-radius:999px;",
      "color:#f4ece2;font-family:inherit;font-size:14px;padding:11px 22px;cursor:pointer;transition:all .3s ease;letter-spacing:.06em}",
      ".act-ov .act-btn:hover,.act-ov .act-btn:focus{background:rgba(255,200,150,.16);transform:translateY(-2px);outline:none;box-shadow:0 6px 20px rgba(255,190,130,.18)}",
      // gaze
      ".act-ov .gaze-zone{width:min(60vw,340px);height:min(60vw,340px);border-radius:50%;margin-top:1.4em;cursor:pointer;",
      "background:radial-gradient(circle,rgba(255,228,200,.10),transparent 70%);border:1px solid rgba(255,210,160,.25);",
      "display:flex;align-items:center;justify-content:center;position:relative;transition:box-shadow .2s,background .2s;user-select:none;-webkit-user-select:none;touch-action:none}",
      ".act-ov .gaze-core{width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 0 24px rgba(255,225,190,.9)}",
      ".act-ov .gaze-meter{width:240px;height:6px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:1.2em;overflow:hidden}",
      ".act-ov .gaze-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd9a8,#fff2dd);transition:width .12s linear}",
      ".act-ov.gaze-bloom{background:radial-gradient(120% 90% at 50% 45%,rgba(255,236,210,.34),rgba(20,16,18,.9))}",
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
      line.textContent = ok
        ? "兩條視線對上的瞬間，時間真的像往旁邊退了一步。他整個人被釘在原地——那不是餘光，是看見。"
        : "妳鬆開得太早了，那一眼只成了餘光……";
      sub.textContent = ok ? "也太像徐若瑄了吧。" : "再按住一次，撐久一點。";
      if (ok) { closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 2600); }
      else { setTimeout(() => { done = false; hold = 0; last = 0; sub.textContent = "他走過背光的走廊……按住下面這束光，撐住這一眼。"; raf = requestAnimationFrame(loop); }, 1600); }
    }
    zone.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
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
          sub.textContent = "她哭著把紙條壓在椅墊下。眼淚一滴，落在他的安全帽上。";
          stage = 1;
          setTimeout(secondPrompt, 1900);
          clear();
        }));
        choices.appendChild(btn("留下，不走", () => {
          sub.textContent = "如果她留下……背景裡，女兒的身影開始淡掉。命運阿嬤說過：她的溫柔，會把女兒抹消。";
          line.style.opacity = "0.4";
          setTimeout(() => { line.style.opacity = "1"; sub.textContent = "她紅著眼，把手收回來——這一次，她還是不能留。"; renderStage(); }, 2600);
          clear();
        }));
      }
    }
    function secondPrompt() {
      line.textContent = "可是這樣還不夠。她又走了回來，蹲下，第二次拿起同一張紙條。";
      clear();
      choices.appendChild(btn("這次，笑著放下", () => {
        sub.textContent = "她擦乾眼淚，笑著又放了一次。只有這樣狠、這樣完整的告別，才能把他的心一針一針縫得夠緊——縫成日後撐住十五年的鋼鐵人。";
        clear();
        closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 4200);
      }));
    }
    renderStage();
  }

  // ── Act 3 禁忌擁抱(EP12:衝上去抱他會撕裂時間線→女兒消失;忍住=收手)──
  function hug(onDone) {
    const ov = makeOverlay();
    ov.appendChild(el("div", "act-kicker", "2005 · 一眼瞬間之後"));
    const line = el("div", "act-line", "他就站在那裡，近得妳能聽見他的呼吸。妳好想衝上去，抱住他。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "");
    ov.appendChild(sub);
    const choices = el("div", "act-choices");
    const hugBtn = el("button", "act-btn", "衝上去，抱住他");
    const holdBtn = el("button", "act-btn", "忍住，把手收回來");
    choices.appendChild(hugBtn); choices.appendChild(holdBtn);
    ov.appendChild(choices);
    function clearC() { while (choices.firstChild) choices.removeChild(choices.firstChild); }
    hugBtn.addEventListener("click", () => {
      try { ov.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }], { duration: 110, iterations: 9, direction: "alternate" }); } catch (e) {}
      sub.textContent = "妳撲了上去，時間線發出撕裂的雜訊。背景裡，女兒的身影開始崩解……不行，這個擁抱會抹掉她。";
      clearC();
      setTimeout(() => {
        sub.textContent = "妳含著淚，把伸出去的手，一寸一寸收了回來。";
        line.textContent = "愛，有時候不是抱緊，而是收手。";
        closeOverlay(ov, function () { if (onDone) onDone({ ok: true, resisted: false }); }, 3200);
      }, 2400);
    });
    holdBtn.addEventListener("click", () => {
      sub.textContent = "妳把伸出去的手，輕輕收了回來。指尖還記得他襯衫的溫度。";
      line.textContent = "愛，有時候不是抱緊，而是收手。這樣，女兒才會存在。";
      clearC();
      closeOverlay(ov, function () { if (onDone) onDone({ ok: true, resisted: true }); }, 3400);
    });
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
    ov.appendChild(el("div", "act-kicker", "2005 · 12 · 22"));
    const line = el("div", "act-line", "電話響了。妳站在伯達樓轉角，按下接聽。");
    ov.appendChild(line);
    const sub = el("div", "act-sub", "");
    ov.appendChild(sub);
    const choices = el("div", "act-choices");
    ov.appendChild(choices);
    const seq = ["聽筒裡，她的聲音很平靜：「我們分手吧。」", "妳想說什麼，可是一個字都發不出來。", "夕陽把轉角染成橘色。一個同學走過，沒注意到妳通紅的眼睛。", "妳只能站著，讓這一切，發生。"];
    let i = 0;
    function step() {
      if (i < seq.length) { sub.textContent = seq[i++]; setTimeout(step, 2600); }
      else {
        const b = el("button", "act-btn", "……（深呼吸，繼續）");
        b.addEventListener("click", () => { while (choices.firstChild) choices.removeChild(choices.firstChild); closeOverlay(ov, function () { if (onDone) onDone({ ok: true }); }, 1400); });
        choices.appendChild(b);
      }
    }
    step();
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

  // ── 鏈執行器:串起多個 act 成情感弧 ──
  function runChain(ids, onAll) {
    const map = { gaze: gaze, note: note, hug: hug, redthread: redthread, msn: msn, phoneCall: phoneCall, sevenEleven: sevenEleven, infinite: infinite, believe: believe };
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
      runChain: runChain,
    };
  }
})();
