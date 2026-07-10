// platform-run 外部化 inline script #4（CSP 撤 unsafe-inline）
/* C6 — 月台雙時空 — Q 鍵視角切換 + 紅線視覺
 設計：Q 按下時切換 view-year (2018 ↔ 2025)， 顯示一條垂直紅線
 (EP36 「我們之間就還有一條拉得再長也不會斷的線」)。
 只動 DOM overlay， 不動 game logic。 */
(function () {
const STYLE_ID = 'c6-redline-style';
const ROOT_ID = 'c6-redline-overlay';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    #${ROOT_ID} {
      position: fixed; inset: 0; pointer-events: none; z-index: 75;
      opacity: 0; transition: opacity 0.45s ease-out;
    }
    #${ROOT_ID}.active { opacity: 1; }
    #${ROOT_ID} .c6-line {
      position: absolute; top: 0; bottom: 0; left: 50%;
      width: 1px;
      background: linear-gradient(180deg,
        transparent 0%,
        rgba(228, 70, 60, 0.55) 14%,
        rgba(228, 70, 60, 0.92) 50%,
        rgba(228, 70, 60, 0.55) 86%,
        transparent 100%);
      box-shadow:
        0 0 8px rgba(228, 70, 60, 0.55),
        0 0 18px rgba(228, 70, 60, 0.25);
      transform: translateX(-0.5px);
      animation: c6Pulse 3.8s ease-in-out infinite;
    }
    @keyframes c6Pulse {
      0%, 100% { opacity: 0.85; }
      50% { opacity: 1; }
    }
    #${ROOT_ID} .c6-indicator {
      position: absolute; top: 18px; left: 50%;
      transform: translateX(-50%);
      padding: 6px 16px;
      background: rgba(8, 6, 4, 0.62);
      border: 1px solid rgba(228, 70, 60, 0.42);
      border-radius: 2px;
      font-family: "Cormorant Garamond", "Noto Serif TC", Georgia, serif;
      font-size: 12px; letter-spacing: 0.32em; text-indent: 0.32em;
      color: rgba(248, 232, 200, 0.86);
      text-transform: uppercase;
    }
    #${ROOT_ID} .c6-indicator .c6-year { color: rgba(248, 168, 144, 0.96); font-weight: 400; }
    @media (prefers-reduced-motion: reduce) {
      #${ROOT_ID} .c6-line { animation: none; }
    }
  `;
  document.head.appendChild(s);
}

function makeDiv(className) {
  const d = document.createElement('div');
  d.className = className;
  return d;
}

function ensureRoot() {
  let root = document.getElementById(ROOT_ID);
  if (root) return root;
  root = document.createElement('div');
  root.id = ROOT_ID;
  root.setAttribute('aria-hidden', 'true');
  const line = makeDiv('c6-line');
  const ind = makeDiv('c6-indicator');
  const label = document.createElement('span');
  label.textContent = 'view ';
  const year = document.createElement('span');
  year.className = 'c6-year';
  year.textContent = '2018';
  ind.appendChild(label);
  ind.appendChild(year);
  root.appendChild(line);
  root.appendChild(ind);
  document.body.appendChild(root);
  return root;
}

let currentYear = '2018';
function setYear(y) {
  if (y !== '2018' && y !== '2025') return;
  currentYear = y;
  ensureStyle();
  const root = ensureRoot();
  root.classList.add('active');
  const yearEl = root.querySelector('.c6-year');
  if (yearEl) yearEl.textContent = y;
}

function toggle() {
  setYear(currentYear === '2018' ? '2025' : '2018');
}

function hide() {
  const root = document.getElementById(ROOT_ID);
  if (root) root.classList.remove('active');
}

/* Q 鍵 toggle — review caught leaderboard input collision， 排除 input/contentEditable */
function isTypingTarget(t) {
  if (!t) return false;
  const tag = t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (t.isContentEditable) return true;
  return false;
}
window.addEventListener('keydown', function (e) {
  if (e.code !== 'KeyQ') return;
  if (e.repeat) return;
  if (isTypingTarget(e.target)) return;
  const title = document.getElementById('title-screen');
  if (title && !title.classList.contains('hide') && title.style.display !== 'none') {
    return;
  }
  toggle();
});

window.__VIEW_TOGGLE__ = {
  setYear: setYear,
  toggle: toggle,
  hide: hide,
  get year() { return currentYear; },
  version: 'v1'
};
})();
