/**
 * narrative-letter.js — 書信日記模式（H6）
 *
 * 全螢幕 overlay 模擬一張紙（信件 / 日記頁），中文字打在紙上。
 * 配合 H3 打字機效果可逐字浮現，呈現「閱讀她的日記」感。
 *
 * 公開 API：
 *   const l = createNarrativeLetter();
 *   l.show({ title, body, signature, typewriter: true, onClose });
 *   l.showPages(pages);                // 多頁日記翻頁
 *   l.hide();
 *   l.dispose();
 *
 * 從 console 試：
 *   window.__LETTER__.show({
 *     title: '2005 / 11 / 15',
 *     body: '今天他從前門走過來，打了那通電話。\n我站在後門，沒說話。',
 *     signature: '— 學妹',
 *   });
 */

const STYLES = `
  #lm402-letter-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(20, 16, 12, 0.62);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    opacity: 0;
    pointer-events: none;
    z-index: 150;
    transition: opacity 0.5s ease;
  }
  #lm402-letter-overlay.show {
    opacity: 1;
    pointer-events: auto;
  }
  #lm402-letter-paper {
    max-width: 580px;
    width: calc(100vw - 64px);
    max-height: calc(100vh - 80px);
    background: linear-gradient(180deg,
      #fcf6e8 0%,
      #f7eed6 50%,
      #f0e4c4 100%);
    color: #2a1f12;
    padding: 56px 64px 48px;
    border-radius: 2px;
    box-shadow:
      0 4px 24px rgba(60, 42, 24, 0.4),
      inset 0 0 80px rgba(180, 140, 80, 0.12);
    font-family: 'Noto Serif TC', "PingFang TC", "Microsoft JhengHei", serif;
    overflow-y: auto;
    transform: translateY(20px) rotate(-0.3deg);
    transition: transform 0.5s ease;
    position: relative;
  }
  #lm402-letter-overlay.show #lm402-letter-paper {
    transform: translateY(0) rotate(0deg);
  }
  /* 紙張角落微捲翻陰影 */
  #lm402-letter-paper::before {
    content: "";
    position: absolute;
    bottom: 0;
    right: 0;
    width: 50px;
    height: 50px;
    background: linear-gradient(225deg, transparent 50%, rgba(80, 60, 30, 0.18) 50%);
    border-bottom-right-radius: 2px;
  }
  #lm402-letter-paper .ltitle {
    font-size: 22px;
    font-weight: 600;
    color: #5c3a1c;
    margin-bottom: 24px;
    letter-spacing: 0.06em;
    text-align: center;
    border-bottom: 1px solid rgba(120, 80, 30, 0.22);
    padding-bottom: 16px;
  }
  #lm402-letter-paper .ltitle:empty {
    display: none;
  }
  #lm402-letter-paper .lbody {
    font-size: 17px;
    line-height: 2;
    color: #2a1f12;
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 4em;
  }
  #lm402-letter-paper .lbody.typing::after {
    content: "";
    display: inline-block;
    width: 0.5em;
    height: 1.1em;
    background: rgba(60, 42, 24, 0.6);
    margin-left: 2px;
    vertical-align: text-bottom;
    animation: lm402LetterBlink 0.7s steps(1) infinite;
  }
  @keyframes lm402LetterBlink {
    0%, 50% { opacity: 1; }
    50.1%, 100% { opacity: 0; }
  }
  #lm402-letter-paper .lsignature {
    margin-top: 32px;
    font-size: 16px;
    color: #6a4520;
    text-align: right;
    font-style: italic;
    letter-spacing: 0.04em;
  }
  #lm402-letter-paper .lsignature:empty {
    display: none;
  }
  #lm402-letter-pagenav {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #6a4520;
  }
  #lm402-letter-pagenav button {
    background: rgba(120, 80, 30, 0.12);
    border: 1px solid rgba(120, 80, 30, 0.3);
    color: #5c3a1c;
    padding: 6px 16px;
    border-radius: 2px;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s;
  }
  #lm402-letter-pagenav button:hover { background: rgba(120, 80, 30, 0.22); }
  #lm402-letter-pagenav button:disabled { opacity: 0.3; cursor: default; }
  #lm402-letter-close {
    position: absolute;
    top: 14px;
    right: 16px;
    background: transparent;
    border: none;
    font-size: 20px;
    color: rgba(80, 50, 20, 0.5);
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
  }
  #lm402-letter-close:hover { color: #2a1f12; }
  @media (max-width: 640px) {
    #lm402-letter-paper {
      padding: 40px 32px;
      width: calc(100vw - 32px);
    }
    #lm402-letter-paper .ltitle { font-size: 19px; }
    #lm402-letter-paper .lbody { font-size: 16px; line-height: 1.85; }
  }
`;

export function createNarrativeLetter() {
  const existing = document.getElementById("lm402-letter-overlay");
  if (existing) existing.remove();

  if (!document.getElementById("lm402-letter-style")) {
    const style = document.createElement("style");
    style.id = "lm402-letter-style";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // overlay
  const overlay = document.createElement("div");
  overlay.id = "lm402-letter-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  // paper
  const paper = document.createElement("div");
  paper.id = "lm402-letter-paper";

  const closeBtn = document.createElement("button");
  closeBtn.id = "lm402-letter-close";
  closeBtn.setAttribute("aria-label", "關閉");
  closeBtn.textContent = "✕";
  paper.appendChild(closeBtn);

  const titleEl = document.createElement("div");
  titleEl.className = "ltitle";
  paper.appendChild(titleEl);

  const bodyEl = document.createElement("div");
  bodyEl.className = "lbody";
  paper.appendChild(bodyEl);

  const sigEl = document.createElement("div");
  sigEl.className = "lsignature";
  paper.appendChild(sigEl);

  const navWrap = document.createElement("div");
  navWrap.id = "lm402-letter-pagenav";
  navWrap.style.display = "none";
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "← 前頁";
  const pageInfo = document.createElement("span");
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "後頁 →";
  navWrap.appendChild(prevBtn);
  navWrap.appendChild(pageInfo);
  navWrap.appendChild(nextBtn);
  paper.appendChild(navWrap);

  overlay.appendChild(paper);
  document.body.appendChild(overlay);

  let typewriterTimer = null;
  let onCloseCallback = null;
  let currentPages = null;
  let currentIdx = 0;

  function clearTimer() {
    if (typewriterTimer) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
    }
  }

  function renderPage(page, opts = {}) {
    clearTimer();
    titleEl.textContent = page.title || "";
    bodyEl.textContent = "";
    bodyEl.classList.remove("typing");
    sigEl.textContent = page.signature || "";
    paper.scrollTop = 0;

    const useTypewriter = opts.typewriter !== false;
    const speed = opts.speed ?? 50;
    const body = page.body || "";

    if (useTypewriter && body) {
      bodyEl.classList.add("typing");
      let i = 0;
      typewriterTimer = setInterval(() => {
        if (i >= body.length) {
          clearInterval(typewriterTimer);
          typewriterTimer = null;
          bodyEl.classList.remove("typing");
          return;
        }
        bodyEl.textContent = body.slice(0, ++i);
      }, speed);
    } else {
      bodyEl.textContent = body;
    }
  }

  function show(page, opts = {}) {
    if (!page) return;
    currentPages = null;
    currentIdx = 0;
    navWrap.style.display = "none";
    onCloseCallback = opts.onClose || null;
    overlay.classList.add("show");
    renderPage(page, opts);
  }

  function showPages(pages, opts = {}) {
    if (!pages || pages.length === 0) return;
    currentPages = pages;
    currentIdx = 0;
    onCloseCallback = opts.onClose || null;
    navWrap.style.display = pages.length > 1 ? "flex" : "none";
    overlay.classList.add("show");
    renderPage(pages[0], opts);
    updateNav();
  }

  function updateNav() {
    if (!currentPages) return;
    pageInfo.textContent = `${currentIdx + 1} / ${currentPages.length}`;
    prevBtn.disabled = currentIdx === 0;
    nextBtn.disabled = currentIdx >= currentPages.length - 1;
  }

  function nextPage() {
    if (!currentPages || currentIdx >= currentPages.length - 1) return;
    currentIdx++;
    renderPage(currentPages[currentIdx]);
    updateNav();
  }

  function prevPage() {
    if (!currentPages || currentIdx <= 0) return;
    currentIdx--;
    renderPage(currentPages[currentIdx]);
    updateNav();
  }

  function hide() {
    clearTimer();
    overlay.classList.remove("show");
    if (onCloseCallback) {
      const cb = onCloseCallback;
      onCloseCallback = null;
      setTimeout(cb, 500);
    }
  }

  closeBtn.addEventListener("click", hide);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hide();
  });
  prevBtn.addEventListener("click", prevPage);
  nextBtn.addEventListener("click", nextPage);

  // ESC 關閉
  const escHandler = (e) => {
    if (e.key === "Escape" && overlay.classList.contains("show")) hide();
  };
  document.addEventListener("keydown", escHandler);

  function dispose() {
    clearTimer();
    overlay.remove();
    document.getElementById("lm402-letter-style")?.remove();
    document.removeEventListener("keydown", escHandler);
  }

  return { show, showPages, hide, nextPage, prevPage, dispose };
}
