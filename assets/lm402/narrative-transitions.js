/**
 * narrative-transitions.js — 章節 fade + 記憶閃回（H2 + H4）
 *
 * 公開 API：
 *   const t = createTransitions();
 *   t.fadeBlack({ durIn:600, stay:400, durOut:600 });   // 章節切換
 *   t.memoryFlash({ intensity:0.85, totalDur:1200 });   // 記憶閃回（白光 + 微震）
 *   t.dispose();
 *
 * 使用範例：
 *   await window.__TRANSITIONS__.fadeBlack();
 *   window.__TRANSITIONS__.memoryFlash();
 */

const STYLES = `
  #lm402-transition-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 200;
    opacity: 0;
    background: #000;
    will-change: opacity;
  }
  #lm402-transition-overlay.flash-anim {
    animation: lm402TransitionFlash 1.2s ease-out forwards;
  }
  @keyframes lm402TransitionFlash {
    0%   { opacity: 0; }
    5%   { opacity: 0.92; }   /* 60ms 快閃 in */
    100% { opacity: 0; }
  }
`;

export function createTransitions() {
  const existing = document.getElementById("lm402-transition-overlay");
  if (existing) existing.remove();

  if (!document.getElementById("lm402-transition-style")) {
    const style = document.createElement("style");
    style.id = "lm402-transition-style";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  const overlay = document.createElement("div");
  overlay.id = "lm402-transition-overlay";
  overlay.setAttribute("aria-hidden", "true");
  document.body.appendChild(overlay);

  /**
   * H2 章節 fade — 黑屏淡入 → 停留 → 淡出
   * 回傳 Promise 在整個 transition 結束時 resolve（callable in async sequence）
   */
  function fadeBlack(opts = {}) {
    const durIn = opts.durIn ?? 600;
    const stay = opts.stay ?? 400;
    const durOut = opts.durOut ?? 600;
    overlay.style.background = "#000";
    overlay.classList.remove("flash-anim");
    return new Promise((resolve) => {
      overlay.style.transition = `opacity ${durIn}ms ease`;
      overlay.style.opacity = "1";
      setTimeout(() => {
        setTimeout(() => {
          overlay.style.transition = `opacity ${durOut}ms ease`;
          overlay.style.opacity = "0";
          setTimeout(() => resolve(), durOut);
        }, stay);
      }, durIn);
    });
  }

  /**
   * H4 記憶閃回 — 白光快速 flash + 慢 fade
   * 配合 narrative-overlay.show() 可呈現「畫面瞬間白屏 → 過去回憶浮現」
   */
  function memoryFlash(opts = {}) {
    const intensity = opts.intensity ?? 0.92;
    const totalDur = opts.totalDur ?? 1200;
    overlay.style.background = `rgba(255, 248, 232, ${intensity})`; // 暖白（記憶感）
    overlay.style.transition = "none";
    overlay.style.opacity = "0";

    // CSS animation 控制曲線
    overlay.classList.remove("flash-anim");
    // 強制重新觸發 animation
    void overlay.offsetWidth;
    overlay.style.animationDuration = `${totalDur}ms`;
    overlay.classList.add("flash-anim");

    return new Promise((resolve) => {
      setTimeout(() => {
        overlay.classList.remove("flash-anim");
        overlay.style.opacity = "0";
        resolve();
      }, totalDur);
    });
  }

  /**
   * 自訂顏色淡入淡出（給未來其他敘事特效用）
   */
  function colorFade(opts = {}) {
    const color = opts.color ?? "rgba(0,0,0,1)";
    const durIn = opts.durIn ?? 400;
    const stay = opts.stay ?? 300;
    const durOut = opts.durOut ?? 400;
    overlay.classList.remove("flash-anim");
    overlay.style.background = color;
    return new Promise((resolve) => {
      overlay.style.transition = `opacity ${durIn}ms ease`;
      overlay.style.opacity = "1";
      setTimeout(() => {
        setTimeout(() => {
          overlay.style.transition = `opacity ${durOut}ms ease`;
          overlay.style.opacity = "0";
          setTimeout(() => resolve(), durOut);
        }, stay);
      }, durIn);
    });
  }

  function dispose() {
    overlay.remove();
    document.getElementById("lm402-transition-style")?.remove();
  }

  return { fadeBlack, memoryFlash, colorFade, dispose };
}
