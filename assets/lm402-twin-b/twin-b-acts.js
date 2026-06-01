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

  // ── 鏈執行器:串起多個 act 成情感弧 ──
  function runChain(ids, onAll) {
    const map = { gaze: gaze, note: note };
    let i = 0;
    function next() {
      if (i >= ids.length) { if (onAll) onAll(); return; }
      const fn = map[ids[i++]];
      if (typeof fn === "function") fn(next); else next();
    }
    next();
  }

  if (typeof window !== "undefined") {
    window.__ACTS__ = { gaze: gaze, note: note, runChain: runChain };
  }
})();
