// lm402.html inline module #1 外部化（CSP 撤 unsafe-inline）；放 root 保留 ./assets/lm402/ dynamic import 路徑
(function () {
  const gate = document.getElementById("cinematic-gate");
  const gateBtn = document.getElementById("cinematic-gate-enter");
  if (!gate || !gateBtn) {
// 玄關不存在時退回原有行為，直接載入場景（安全網）
import("./assets/lm402/app.js")
  .then(() => { window.__lm402Ready = true; window.__lm402GateEntered = true; })
  .catch((err) => console.error("[lm402] scene load failed", err));
return;
  }

  // a11y/CSP：玄關附屬按鈕改用 addEventListener（取代 inline onclick，關掉 inline event handler 注入路徑）
  var _gt = document.querySelector(".cinematic-gate-tutorial");
  if (_gt) _gt.addEventListener("click", function () { if (typeof openLM402Tutorial === "function") openLM402Tutorial(); });
  var _gr = document.querySelector(".cinematic-gate-read");
  if (_gr) _gr.addEventListener("click", function () { if (window.__GATE_GUIDE__) window.__GATE_GUIDE__.open(); });

  // 直立手機在玄關就先講「建議橫向」,別讓玩家投入一兩分鐘後才被 rotate-lock 擋下
  (function () {
    var hint = document.getElementById("gate-portrait-hint");
    if (!hint) return;
    function sync() {
      var touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      hint.hidden = !(touch && window.innerHeight > window.innerWidth);
    }
    sync();
    window.addEventListener("orientationchange", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
  })();

  // a11y：玄關 dialog focus trap — Tab/Shift+Tab 鎖在玄關內，初始 focus 給進場鈕
  function _gateFocusables() {
return Array.prototype.slice.call(gate.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'))
  .filter(function (el) { return el.offsetParent !== null; });
  }
  function _gateTrap(e) {
if (e.key !== "Tab") return;
var f = _gateFocusables();
if (!f.length) return;
var first = f[0], last = f[f.length - 1];
if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  gate.addEventListener("keydown", _gateTrap);
  setTimeout(function () { try { gateBtn.focus(); } catch (e) {} }, 120);

  let entered = false;
  function enterScene() {
if (entered) return;
entered = true;
// 立刻把按鈕 disable，避免快速連點或 touch+click 雙發造成 race：
// 雖然 `entered` flag 已經擋了二次執行，但 disabled 可以更明確地讓 UI 不回應
gateBtn.disabled = true;
gateBtn.setAttribute("aria-disabled", "true");
window.__lm402GateEntered = true;
gate.removeEventListener("keydown", _gateTrap); // 進場後解除 focus trap
// 進場後才排「場景卡住」提示（給 6 秒讓場景載入；玄關久留不再先空轉掉）
setTimeout(function () { if (!window.__lm402Ready && typeof window.__lm402ShowStuckHint === "function") window.__lm402ShowStuckHint(); }, 6000);

// 1. 在使用者 gesture 內解鎖音訊
//    (a) AudioContext 預熱
try {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    const ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    window.__lm402PrimedAudioCtx = ctx;
    setTimeout(() => { window.__lm402PrimedAudioCtx = null; }, 3000);
  }
} catch (e) { /* noop */ }
//    (b) HTMLAudioElement media engagement 預熱
try {
  const probe = new Audio();
  probe.muted = true;
  probe.playsInline = true;
  probe.src =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
  const p = probe.play();
  if (p && typeof p.catch === "function") p.catch(() => {});
  setTimeout(() => { try { probe.pause(); probe.src = ""; } catch (e) {} }, 120);
} catch (e) { /* noop */ }

// 2. 設定 flag 讓 app.js init 時自動把音樂打開
window.__lm402AutoplayPrimed = true;

// 3. 玄關淡出動畫（1.1s），結束後移除節點
gate.classList.add("gate-exiting");
setTimeout(() => { if (gate.parentNode) gate.parentNode.removeChild(gate); }, 1200);

// 4. 動態 import app.js（觸發 Three.js 初始化）
import("./assets/lm402/app.js")
  .then(() => { window.__lm402Ready = true; })
  .catch((err) => {
    console.error("[lm402] failed to load scene module", err);
    const loader = document.getElementById("lm402-loader");
    if (loader) {
      const inner = loader.querySelector(".loader-inner");
      if (inner) {
        const msg = document.createElement("div");
        msg.style.cssText =
          "color:#d9b36a;text-align:center;padding:24px 16px;font:300 14px/1.7 'Noto Sans TC',sans-serif;max-width:320px";
        msg.textContent = "場景載入失敗，請重新整理頁面。";
        inner.appendChild(msg);
      }
    }
  });
  }

  gateBtn.addEventListener("click", enterScene);
  gateBtn.addEventListener("keydown", (e) => {
if (e.key === "Enter" || e.key === " ") {
  e.preventDefault();
  enterScene();
}
  });
})();
