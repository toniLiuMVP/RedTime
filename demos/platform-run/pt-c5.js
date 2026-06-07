// platform-run 外部化 inline script #5（CSP 撤 unsafe-inline）
/* C8 — 月台 10 關 mechanic 變化 (visual layer foundation)
 8 個關卡 (L3-L10) 加 visual mechanic overlay：
   L3 風    L4 雨    L5 排隊    L6 嬰兒
   L7 廣播  L8 長椅  L9 燈閃    L10 紅線
 實作策略：
   - DOM/CSS 純 overlay， 不動 game physics
   - 監測 #narr-text 文字變化「第 N 關開始」 → 自動啟動該關 mechanic
   - 完整 physics 整合留 later
 Console API：
   __LEVEL_MECHANICS__.activate(N) / deactivate() / list()
*/
(function () {
const STYLE_ID = 'c8-mechanics-style';
const ROOT_ID = 'c8-mechanics-overlay';

const MECHANICS = {
  3:  { key: 'wind',     label: '風',    desc: '風往反方向灌，他低頭頂著走' },
  4:  { key: 'rain',     label: '雨',    desc: '雨打在頂棚上很吵，鞋子早濕了' },
  5:  { key: 'queue',    label: '排隊',  desc: '一整排人在排隊，他側身鑽' },
  6:  { key: 'baby',     label: '嬰兒',  desc: '有人在哭，他想起還小的妳' },
  7:  { key: 'announce', label: '廣播',  desc: '廣播在報下一班，他開始小跑' },
  8:  { key: 'bench',    label: '長椅',  desc: '長椅、行李堆在走道上' },
  9:  { key: 'flicker',  label: '燈閃',  desc: '月台的燈忽明忽暗' },
  10: { key: 'redline',  label: '紅線',  desc: '父女之間那條，看不見卻拉不斷的線' }
};

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    #${ROOT_ID} {
      position: fixed; inset: 0; pointer-events: none; z-index: 15;
      opacity: 0; transition: opacity 0.55s ease-out;
    }
    #${ROOT_ID}.active { opacity: 1; }
    #${ROOT_ID} .c8-banner {
      position: absolute; top: 90px; left: 50%;
      transform: translateX(-50%) translateY(-12px);
      padding: 8px 22px;
      background: rgba(8, 6, 4, 0.72);
      border: 1px solid rgba(218, 176, 124, 0.42);
      border-radius: 2px;
      font-family: "Cormorant Garamond", "Noto Serif TC", Georgia, serif;
      font-size: 13px; letter-spacing: 0.32em; text-indent: 0.32em;
      color: rgba(248, 232, 200, 0.88);
      opacity: 0;
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    #${ROOT_ID}.active .c8-banner { opacity: 1; transform: translateX(-50%) translateY(0); }
    /* L3 wind — diagonal leaf streaks */
    #${ROOT_ID} .c8-mech-wind {
      position: absolute; inset: 0;
      background:
        linear-gradient(98deg, transparent 0%, transparent 38%, rgba(220, 196, 158, 0.05) 39%, transparent 40%) 0 0/120px 100% repeat,
        linear-gradient(102deg, transparent 0%, transparent 58%, rgba(220, 196, 158, 0.04) 59%, transparent 60%) 60px 0/180px 100% repeat;
      animation: c8WindDrift 8s linear infinite;
      opacity: 0;
    }
    #${ROOT_ID}.active[data-mech="wind"] .c8-mech-wind { opacity: 1; }
    @keyframes c8WindDrift {
      0% { background-position: 0 0, 60px 0; }
      100% { background-position: 240px 0, 360px 0; }
    }
    /* L4 rain — vertical streaks */
    #${ROOT_ID} .c8-mech-rain {
      position: absolute; inset: 0;
      background:
        linear-gradient(180deg, transparent 0%, rgba(180, 200, 218, 0.16) 50%, transparent 100%) 0 0/2px 80px repeat,
        linear-gradient(180deg, transparent 0%, rgba(180, 200, 218, 0.10) 50%, transparent 100%) 22px 0/2px 64px repeat;
      animation: c8RainFall 0.65s linear infinite;
      opacity: 0;
    }
    #${ROOT_ID}.active[data-mech="rain"] .c8-mech-rain { opacity: 1; }
    @keyframes c8RainFall {
      0% { background-position: 0 0, 22px 0; }
      100% { background-position: 0 80px, 22px 64px; }
    }
    /* L5 queue — side silhouettes */
    #${ROOT_ID} .c8-mech-queue-l,
    #${ROOT_ID} .c8-mech-queue-r {
      position: absolute; top: 35vh; bottom: 18vh; width: 96px;
      background: linear-gradient(90deg, rgba(40, 30, 22, 0.42), transparent);
      opacity: 0;
    }
    #${ROOT_ID} .c8-mech-queue-l { left: 0; }
    #${ROOT_ID} .c8-mech-queue-r { right: 0; transform: scaleX(-1); }
    #${ROOT_ID}.active[data-mech="queue"] .c8-mech-queue-l,
    #${ROOT_ID}.active[data-mech="queue"] .c8-mech-queue-r { opacity: 1; }
    /* L6 baby — caption pulse */
    #${ROOT_ID} .c8-mech-baby {
      position: absolute; top: 140px; left: 24px;
      font-family: "Cormorant Garamond", "Noto Serif TC", Georgia, serif;
      font-size: 12px; letter-spacing: 0.22em;
      color: rgba(248, 200, 180, 0.78);
      opacity: 0;
    }
    #${ROOT_ID}.active[data-mech="baby"] .c8-mech-baby {
      opacity: 1; animation: c8BabyCry 4.5s ease-in-out infinite;
    }
    @keyframes c8BabyCry {
      0%, 100% { transform: translateY(0); opacity: 0.78; }
      50% { transform: translateY(-3px); opacity: 1; }
    }
    /* L7 announce — sliding banner */
    #${ROOT_ID} .c8-mech-announce {
      position: absolute; top: 180px; right: -300px;
      padding: 8px 18px;
      background: rgba(40, 30, 22, 0.78);
      border-left: 2px solid rgba(248, 180, 84, 0.86);
      color: rgba(248, 232, 200, 0.92);
      font-size: 12px; letter-spacing: 0.18em;
      font-family: "Noto Sans TC", sans-serif;
    }
    #${ROOT_ID}.active[data-mech="announce"] .c8-mech-announce {
      animation: c8AnnounceSlide 9s ease-in-out infinite;
    }
    @keyframes c8AnnounceSlide {
      0%, 100% { right: -300px; }
      20%, 60% { right: 18px; }
    }
    /* L8 bench — center silhouette */
    #${ROOT_ID} .c8-mech-bench {
      position: absolute; bottom: 28vh; left: 50%;
      transform: translateX(-50%);
      width: clamp(140px, 18vw, 220px); height: 22px;
      background: linear-gradient(180deg, rgba(80, 60, 42, 0.55), rgba(40, 28, 18, 0.78));
      border-radius: 2px;
      opacity: 0;
    }
    #${ROOT_ID}.active[data-mech="bench"] .c8-mech-bench { opacity: 1; }
    /* L9 flicker — random dim */
    #${ROOT_ID} .c8-mech-flicker {
      position: absolute; inset: 0;
      background: rgba(0, 0, 0, 0);
    }
    #${ROOT_ID}.active[data-mech="flicker"] .c8-mech-flicker {
      animation: c8Flicker 3.2s steps(3, end) infinite;
    }
    @keyframes c8Flicker {
      0%, 70%, 100% { background: rgba(0, 0, 0, 0); }
      72%, 74% { background: rgba(0, 0, 0, 0.35); }
      76% { background: rgba(0, 0, 0, 0); }
    }
    /* L10 redline — full vertical */
    #${ROOT_ID} .c8-mech-redline {
      position: absolute; top: 0; bottom: 0; left: 50%;
      width: 1px;
      background: linear-gradient(180deg, transparent 0%, rgba(228, 70, 60, 0.92) 50%, transparent 100%);
      box-shadow: 0 0 12px rgba(228, 70, 60, 0.55);
      opacity: 0;
    }
    #${ROOT_ID}.active[data-mech="redline"] .c8-mech-redline {
      opacity: 1; animation: c8Redline 4.5s ease-in-out infinite;
    }
    @keyframes c8Redline {
      0%, 100% { opacity: 0.78; }
      50% { opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      #${ROOT_ID} *,
      #${ROOT_ID} *::before { animation: none !important; }
      /* review caught: keep L10 redline visible in static mode */
      #${ROOT_ID}.active[data-mech="redline"] .c8-mech-redline { opacity: 1; }
      /* review caught: L7 announce stranded off-screen w/o anim — pin into view */
      #${ROOT_ID}.active[data-mech="announce"] .c8-mech-announce { right: 18px; }
      /* Free GPU layers when inactive */
      #${ROOT_ID}:not(.active) > div { visibility: hidden; }
    }
  `;
  document.head.appendChild(s);
}

function makeDiv(className, text) {
  const d = document.createElement('div');
  d.className = className;
  if (text) d.textContent = text;
  return d;
}

function ensureRoot() {
  let root = document.getElementById(ROOT_ID);
  if (root) return root;
  root = document.createElement('div');
  root.id = ROOT_ID;
  root.setAttribute('aria-hidden', 'true');
  root.appendChild(makeDiv('c8-banner'));
  root.appendChild(makeDiv('c8-mech-wind'));
  root.appendChild(makeDiv('c8-mech-rain'));
  root.appendChild(makeDiv('c8-mech-queue-l'));
  root.appendChild(makeDiv('c8-mech-queue-r'));
  root.appendChild(makeDiv('c8-mech-baby', '嬰兒的哭聲'));
  root.appendChild(makeDiv('c8-mech-announce', '本次往南列車即將進站'));
  root.appendChild(makeDiv('c8-mech-bench'));
  root.appendChild(makeDiv('c8-mech-flicker'));
  root.appendChild(makeDiv('c8-mech-redline'));
  document.body.appendChild(root);
  return root;
}

let activeLevel = 0;
function activate(n) {
  n = parseInt(n, 10);
  const mech = MECHANICS[n];
  if (!mech) {
    deactivate();
    return null;
  }
  ensureStyle();
  const root = ensureRoot();
  const banner = root.querySelector('.c8-banner');
  if (banner) banner.textContent = '第 ' + n + ' 關 — ' + mech.label;
  root.setAttribute('data-mech', mech.key);
  root.classList.add('active');
  activeLevel = n;
  return { level: n, mech: mech };
}

function deactivate() {
  const root = document.getElementById(ROOT_ID);
  if (root) {
    root.classList.remove('active');
    root.removeAttribute('data-mech');
  }
  activeLevel = 0;
}

function list() {
  return Object.assign({}, MECHANICS);
}

/* Auto-trigger via #narr-text mutation observer */
function startObserver() {
  const target = document.getElementById('narr-text');
  if (!target) return;
  const obs = new MutationObserver(function () {
    const txt = target.textContent || '';
    const m = txt.match(/第\s*(\d+)\s*關開始/);
    if (m) {
      const n = parseInt(m[1], 10);
      activate(n);
    }
  });
  obs.observe(target, { childList: true, characterData: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserver, { once: true });
} else {
  startObserver();
}

window.__LEVEL_MECHANICS__ = {
  activate: activate,
  deactivate: deactivate,
  list: list,
  get level() { return activeLevel; },
  version: 'v1'
};
})();
