// twin-b-council.js · 雙時空B Act1「意識菜市場議會」
// 故事接地(EP38):10:40 阿姨的意識裡 18/29/33/39/49 歲的自己七嘴八舌,
// 玩家平衡這些聲音,幫她把「你走到後門」這句話「練穩」(app.js 旁白原文)。
// 太衝(撕裂時間線→女兒淡化,EP21 悖論)/ 太退(太冷→錯過)。穩定 = 練穩 → 進一眼瞬間。
//
// 對外:window.__COUNCIL__ = { start(onComplete), stop(), isActive() }
// 純 DOM(iOS-safe,不碰 WebGL);零 innerHTML(全 createElement + textContent,XSS-safe)。

(function () {
  "use strict";

  // 5 個年紀的聲音(EP38 接地):lean = 傾向(+ 衝 / − 退)
  const VOICES = [
    { lean: +2, color: "#ffcf9e", label: "18 歲（1994 凍齡）", line: "我好怕說錯、做錯……可是我好想衝過去跟他說話！" },
    { lean: -1, color: "#ffe6cf", label: "29 歲（當下身體）", line: "穩住。社會化偽裝起來，別讓他看出妳在發抖。" },
    { lean: -1, color: "#dfe6f5", label: "33 歲", line: "先活下來再說。別把自己一次燒光。" },
    { lean: -2, color: "#cfe0f0", label: "39 歲", line: "煞車踩住。先活下來，比先說出口更重要。" },
    { lean: +1, color: "#f5dce6", label: "49 歲（看透的妳）", line: "去愛這一次吧。後面好多年的我們，都會謝謝妳今天沒有逃跑。" },
  ];

  const CLOCK_MAX = 40;
  let host = null, active = false, onDone = null, raf = 0;
  let skew = 0, steady = 0, clock = 0, lastTick = 0;
  let watchEl = null, steadyFill = null, skewKnob = null, lineEl = null, daughterEl = null;

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function injectStyle() {
    if (document.getElementById("council-style")) return;
    const s = document.createElement("style");
    s.id = "council-style";
    s.textContent = [
      "#council-overlay{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;",
      "justify-content:center;background:radial-gradient(120% 90% at 50% 38%,rgba(28,22,30,.42),rgba(12,10,16,.86));",
      "backdrop-filter:blur(2px);font-family:inherit;color:#f4ece2;opacity:0;transition:opacity .8s ease}",
      "#council-overlay.show{opacity:1}",
      "#council-overlay .cc-title{font-size:clamp(15px,2.4vw,22px);letter-spacing:.22em;color:#ffd9a8;text-shadow:0 0 16px rgba(255,180,120,.4);margin-bottom:.2em}",
      "#council-overlay .cc-sub{font-size:clamp(11px,1.5vw,13px);opacity:.72;margin-bottom:1.1em;letter-spacing:.06em;max-width:680px;text-align:center;line-height:1.7}",
      "#council-overlay .cc-watch{font-variant-numeric:tabular-nums;font-size:clamp(20px,3vw,30px);color:#7fd4ff;text-shadow:0 0 18px rgba(120,200,255,.5);margin-bottom:.6em}",
      "#council-overlay .cc-voices{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:880px;padding:0 16px}",
      "#council-overlay .cc-voice{flex:1 1 240px;max-width:280px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);",
      "border-radius:14px;padding:14px 16px;cursor:pointer;transition:transform .25s ease,box-shadow .35s ease,filter .35s ease,opacity .35s;",
      "filter:blur(.4px) saturate(.85);opacity:.78}",
      "#council-overlay .cc-voice:hover,#council-overlay .cc-voice:focus{transform:translateY(-3px) scale(1.02);filter:none;opacity:1;box-shadow:0 8px 28px rgba(255,190,130,.18);outline:none}",
      "#council-overlay .cc-age{font-size:12px;letter-spacing:.1em;margin-bottom:.4em}",
      "#council-overlay .cc-line{font-size:14px;line-height:1.7}",
      "#council-overlay .cc-said{margin-top:.8em;min-height:1.6em;font-size:15px;color:#fff;text-shadow:0 0 12px rgba(255,210,160,.4);text-align:center;max-width:680px;white-space:pre-line;line-height:1.9}",
      "#council-overlay .cc-meters{display:flex;gap:26px;align-items:center;margin-top:1.2em;font-size:12px;letter-spacing:.08em}",
      "#council-overlay .cc-skewbar{display:inline-block;width:200px;height:6px;border-radius:3px;background:linear-gradient(90deg,#9fd0ff,#fff2dd,#ff9a76);position:relative;margin:0 8px;vertical-align:middle}",
      "#council-overlay .cc-knob{position:absolute;top:-4px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 0 10px rgba(255,255,255,.7);transform:translateX(-7px);left:50%;transition:left .35s ease}",
      "#council-overlay .cc-steadybar{display:inline-block;width:200px;height:8px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden;margin:0 8px;vertical-align:middle}",
      "#council-overlay .cc-steadybar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd9a8,#ff8fb0);transition:width .4s ease}",
      "#council-overlay .cc-daughter{margin-top:1em;font-size:12px;letter-spacing:.1em;color:#ffd9e6;transition:opacity .5s}",
    ].join("");
    document.head.appendChild(s);
  }

  function build() {
    host = el("div");
    host.id = "council-overlay";
    host.appendChild(el("div", "cc-title", "意識菜市場"));
    host.appendChild(el("div", "cc-sub", "10:40　幫她把那句「你走到後門」練穩。太衝會撕裂時間線，太退會錯過。"));
    watchEl = el("div", "cc-watch", "10:40");
    host.appendChild(watchEl);

    const vbox = el("div", "cc-voices");
    VOICES.forEach((v, i) => {
      const card = el("div", "cc-voice");
      card.tabIndex = 0;
      card.style.borderColor = v.color;
      const age = el("div", "cc-age", v.label);
      age.style.color = v.color;
      card.appendChild(age);
      card.appendChild(el("div", "cc-line", v.line));
      card.addEventListener("click", () => pick(i));
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(i); } });
      vbox.appendChild(card);
    });
    host.appendChild(vbox);

    lineEl = el("div", "cc-said", "");
    host.appendChild(lineEl);

    const meters = el("div", "cc-meters");
    const skewWrap = el("span", null, "衝");
    const skewBar = el("span", "cc-skewbar");
    skewKnob = el("span", "cc-knob");
    skewBar.appendChild(skewKnob);
    skewWrap.appendChild(skewBar);
    skewWrap.appendChild(document.createTextNode("退"));
    meters.appendChild(skewWrap);
    const steadyWrap = el("span", null, "穩定");
    const steadyBar = el("span", "cc-steadybar");
    steadyFill = el("i");
    steadyBar.appendChild(steadyFill);
    steadyWrap.appendChild(steadyBar);
    meters.appendChild(steadyWrap);
    host.appendChild(meters);

    daughterEl = el("div", "cc-daughter", "✦ 背景裡，女兒的身影　穩定");
    host.appendChild(daughterEl);

    document.body.appendChild(host);
    requestAnimationFrame(() => host.classList.add("show"));
  }

  function pick(i) {
    if (!active) return;
    const v = VOICES[i];
    skew += v.lean;
    const balanced = Math.abs(skew) <= 1;
    steady = Math.max(0, Math.min(100, steady + (balanced ? 14 : -8)));
    lineEl.textContent = "「" + v.line + "」";
    render();
  }

  function render() {
    const pct = Math.max(-100, Math.min(100, skew * 18));
    skewKnob.style.left = (50 + pct / 2) + "%";
    steadyFill.style.width = steady + "%";
    const tear = Math.max(0, skew) / 6;
    daughterEl.style.opacity = String(Math.max(0.18, 1 - tear));
    daughterEl.textContent = skew > 3
      ? "✦ 背景裡，女兒的身影　正在淡化……（太衝了）"
      : (skew < -3 ? "✦ 太冷了，這一眼會錯過……" : "✦ 背景裡，女兒的身影　穩定");
  }

  function tick(t) {
    if (!active) return;
    if (!lastTick) lastTick = t;
    clock += Math.min((t - lastTick) / 1000, 0.05); // W2：切分頁回來不會時間暴衝、提早結算
    lastTick = t;
    const mm = Math.min(60, Math.floor((clock / CLOCK_MAX) * 20) + 40);
    watchEl.textContent = mm >= 60 ? "11:00" : "10:" + mm;
    if (clock >= CLOCK_MAX) { finish(); return; }
    raf = requestAnimationFrame(tick);
  }

  function finish() {
    active = false;
    cancelAnimationFrame(raf);
    const ok = steady >= 60 && Math.abs(skew) <= 2;
    // P1：把高潮留給留白。五個聲音同時淡出，只剩時鐘與一句意象（不解釋「她練穩了」）。
    const vbox = host && host.querySelector(".cc-voices");
    if (vbox) { vbox.style.transition = "opacity 1.1s ease"; vbox.style.opacity = "0"; }
    if (watchEl) watchEl.textContent = "11:00";
    lineEl.textContent = ok
      ? "菜市場安靜了。所有年紀的妳，都退到巷口。\n只剩最小的那個十八歲，站在正中央。"
      : "聲音還是好吵、好吵。\n但鐘已經響了，她只能抓住最要緊的那一句：\n「你……走到後門。」";
    daughterEl.textContent = ok ? "✦ 女兒的身影　清晰而穩定" : "✦ 女兒的身影　還在，只是微微發抖";
    // 成功：留白 1.2 秒後，才浮出進入一眼瞬間的引線
    if (ok) setTimeout(() => { if (lineEl) lineEl.textContent = "鐘響了。\n你走到後門。"; }, 2600);
    setTimeout(() => {
      if (host) host.classList.remove("show");
      setTimeout(() => { if (host && host.parentNode) host.parentNode.removeChild(host); host = null; }, 800);
      if (typeof onDone === "function") onDone({ steady: steady, skew: skew, ok: ok });
    }, ok ? 4600 : 2800);
  }

  function start(onComplete) {
    if (active) return;
    onDone = (typeof onComplete === "function") ? onComplete : null;
    active = true;
    skew = 0; steady = 0; clock = 0; lastTick = 0;
    injectStyle(); build(); render();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    active = false; cancelAnimationFrame(raf);
    if (host && host.parentNode) host.parentNode.removeChild(host);
    host = null;
  }

  if (typeof window !== "undefined") {
    window.__COUNCIL__ = { start: start, stop: stop, isActive: function () { return active; } };
  }
})();
