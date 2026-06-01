/**
 * narrative-overlay.js — 文學旁白系統（H1 + H3 整合）
 *
 * 功能：
 *   - H1 字幕系統：畫面下方浮動 overlay 顯示劇情旁白
 *   - H3 打字機效果：文字逐字浮現（電影感）
 *   - 配合 fade transition：show/hide 平滑漸入漸出
 *
 * 公開 API：
 *   const n = createNarrativeOverlay();
 *   n.show(speaker, text, { typewriter: true, speed: 50, autoHideAfter: 4000 });
 *   n.preset('age_29');  // 用內建 preset
 *   n.hide();
 *   n.dispose();
 */

const STYLES = `
  #lm402-narrative-overlay {
    position: fixed;
    bottom: 56px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 720px;
    width: calc(100vw - 80px);
    padding: 22px 32px 24px;
    background: linear-gradient(180deg, rgba(18,14,10,0.78) 0%, rgba(28,22,18,0.86) 100%);
    backdrop-filter: blur(14px) saturate(1.4);
    -webkit-backdrop-filter: blur(14px) saturate(1.4);
    border: 1px solid rgba(255, 230, 200, 0.22);
    border-radius: 4px;
    color: #f4eee0;
    font-family: 'Noto Serif TC', "PingFang TC", "Microsoft JhengHei", serif;
    opacity: 0;
    transform: translate(-50%, 8px);
    transition: opacity 0.45s ease, transform 0.45s ease;
    pointer-events: none;
    z-index: 100;
    box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  }
  #lm402-narrative-overlay.show {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  #lm402-narrative-overlay .nspeaker {
    font-size: 12px;
    color: #ffd49c;
    margin-bottom: 8px;
    letter-spacing: 0.08em;
    font-weight: 500;
    text-transform: uppercase;
  }
  #lm402-narrative-overlay .nspeaker:empty { display: none; }
  #lm402-narrative-overlay .ntext {
    font-size: 18px;
    line-height: 1.78;
    color: #f4eee0;
    letter-spacing: 0.02em;
    min-height: 1.78em;
  }
  #lm402-narrative-overlay .ntext.typing::after {
    content: "";
    display: inline-block;
    width: 0.5em;
    height: 1.05em;
    background: rgba(255, 212, 156, 0.7);
    margin-left: 2px;
    vertical-align: text-bottom;
    animation: lm402NarrativeBlink 0.7s steps(1) infinite;
  }
  @keyframes lm402NarrativeBlink {
    0%, 50% { opacity: 1; }
    50.1%, 100% { opacity: 0; }
  }
  @media (max-width: 640px) {
    #lm402-narrative-overlay {
      bottom: 24px;
      width: calc(100vw - 32px);
      padding: 16px 22px 18px;
    }
    #lm402-narrative-overlay .ntext { font-size: 16px; }
  }
`;

export function createNarrativeOverlay(options = {}) {
  const existing = document.getElementById("lm402-narrative-overlay");
  if (existing) existing.remove();

  if (!document.getElementById("lm402-narrative-style")) {
    const style = document.createElement("style");
    style.id = "lm402-narrative-style";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // 用 createElement 而非 innerHTML（避免 XSS 風險，靜態結構也更安全）
  const overlay = document.createElement("div");
  overlay.id = "lm402-narrative-overlay";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");

  const speakerEl = document.createElement("div");
  speakerEl.className = "nspeaker";
  overlay.appendChild(speakerEl);

  const textEl = document.createElement("div");
  textEl.className = "ntext";
  overlay.appendChild(textEl);

  document.body.appendChild(overlay);

  let typewriterTimer = null;
  let autoHideTimer = null;

  function clearTimers() {
    if (typewriterTimer) { clearInterval(typewriterTimer); typewriterTimer = null; }
    if (autoHideTimer)   { clearTimeout(autoHideTimer);   autoHideTimer = null; }
  }

  function show(speaker, text, opts = {}) {
    clearTimers();
    speakerEl.textContent = speaker || "";
    textEl.textContent = "";
    textEl.classList.remove("typing");
    overlay.classList.add("show");

    const useTypewriter = opts.typewriter !== false;
    const speed = opts.speed ?? 55;
    const autoHideAfter = opts.autoHideAfter ?? 0;

    if (useTypewriter && text) {
      textEl.classList.add("typing");
      let i = 0;
      typewriterTimer = setInterval(() => {
        if (i >= text.length) {
          clearInterval(typewriterTimer);
          typewriterTimer = null;
          textEl.classList.remove("typing");
          if (autoHideAfter > 0) {
            autoHideTimer = setTimeout(() => hide(), autoHideAfter);
          }
          return;
        }
        textEl.textContent = text.slice(0, ++i);
      }, speed);
    } else {
      textEl.textContent = text || "";
      if (autoHideAfter > 0) {
        autoHideTimer = setTimeout(() => hide(), autoHideAfter);
      }
    }
  }

  function hide() {
    clearTimers();
    overlay.classList.remove("show");
  }

  function dispose() {
    clearTimers();
    overlay.remove();
    document.getElementById("lm402-narrative-style")?.remove();
  }

  // 從 data.js 提取的真實 narrative beats（toni 原文）
  const PRESETS = {
    consc_open: { speaker: "意識菜市場", text: "教室裡，不同年紀的自己正在七嘴八舌。" },
    age_18: { speaker: "18 歲的聲音", text: "我心臟跳好快……我好怕搞砸。" },
    age_29: { speaker: "29 歲的聲音", text: "坐好。保持微笑，看起來鎮定就好。" },
    age_33: { speaker: "33 歲的聲音", text: "喜歡不是佔有。靠近需要對方同意。" },
    age_39: { speaker: "39 歲的聲音", text: "先活著。後來的事後來再說。" },
    age_49: { speaker: "49 歲的聲音", text: "不要怕。留一點空白給命運，也留一點空白給妳自己。" },
    bell: { speaker: null, text: "鐘響了。" },
    look: { speaker: null, text: "他看見她了，不是餘光，不是恍惚，是整個人被釘在原地那種看見。" },
  };

  function preset(key, opts) {
    const p = PRESETS[key];
    if (!p) {
      console.warn("[narrative] unknown preset:", key);
      return;
    }
    show(p.speaker, p.text, opts);
  }

  return { show, hide, dispose, preset, PRESETS };
}
