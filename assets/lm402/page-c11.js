// lm402.html inline classic #11 外部化（CSP 撤 unsafe-inline）
/* A1 — Steam-1: LM402-twin 意識碎片 5 hotspot fish hook
 完成 onboarding 後 → 左下浮現「意識碎片 0/5」→ 點教室 5 處 → 5 個學妹意識菜市場短句
 (對位 EP38 18/29/33/39/49 歲 5 個意識) → 收滿解鎖 __CONSC_TEXT__.setIntensity(0.6) */
(function () {
const KEY_TOUR_DONE = 'redtime_lm402_newcomer_done';
const KEY_FRAG = 'redtime_lm402_consc_fragments';
const FRAGMENTS = [
  { age: 18, quote: '他現在在哪裡？', pos: { top: '32%', left: '48%' }, label: '前門' },
  { age: 29, quote: '先聽我說， 18 歲的妳。', pos: { top: '42%', left: '14%' }, label: '黑板' },
  { age: 33, quote: '先把心退半步。', pos: { top: '52%', left: '78%' }, label: '窗外' },
  { age: 39, quote: '先留在座位上。', pos: { top: '60%', left: '38%' }, label: '座位' },
  { age: 49, quote: '去愛這一次吧。', pos: { top: '38%', left: '88%' }, label: '後門' },
];

function loadCollected() {
  try {
const raw = localStorage.getItem(KEY_FRAG);
if (!raw) return [];
const arr = JSON.parse(raw);
return Array.isArray(arr) ? arr.filter(function (n) { return Number.isInteger(n); }) : [];
  } catch (e) { return []; }
}
function saveCollected(arr) {
  try { localStorage.setItem(KEY_FRAG, JSON.stringify(arr)); } catch (e) {}
}
function isTourDone() {
  try { return localStorage.getItem(KEY_TOUR_DONE) === '1'; } catch (e) { return false; }
}

let _styleAdded = false;
function ensureStyle() {
  if (_styleAdded) return;
  _styleAdded = true;
  const s = document.createElement('style');
  s.textContent = `
/* review caught: mobile 左搖桿 bottom-left + z-index 14 → badge 移到 top-right */
#consc-badge {
  position: fixed; top: 18px; right: 88px; z-index: 1240;
  padding: 8px 14px;
  background: rgba(8, 6, 10, 0.78); backdrop-filter: blur(10px);
  border: 1px solid rgba(168, 220, 220, 0.42);
  border-radius: 2px;
  color: rgba(220, 244, 240, 0.92);
  font-family: "Cormorant Garamond", "Noto Serif TC", Georgia, serif;
  font-size: 12px; letter-spacing: 0.22em;
  display: none; align-items: center; gap: 8px;
  transition: opacity 0.5s ease, transform 0.5s ease;
  cursor: default;
  pointer-events: none;
}
@media (max-width: 767px) {
  /* 手機：往下移一排，避開右上角音樂選單(audio-widget top:8 right:8)，
     對齊 r71「時空手錶下移」做法。直向時 music-prompt 在左側，不衝突。 */
  #consc-badge {
    top: max(58px, calc(env(safe-area-inset-top) + 52px));
    right: max(8px, env(safe-area-inset-right));
    font-size: 11px; padding: 6px 10px;
  }
}
@media (max-width: 1080px) and (orientation: landscape) {
  /* 橫向手機：桌機 right:88 會跟橫向的音樂選單重疊(截圖案例)。
     再多下移一些避開橫向時也在右側的 music-prompt 提示膠囊。 */
  #consc-badge {
    top: max(92px, calc(env(safe-area-inset-top) + 84px));
    right: max(8px, env(safe-area-inset-right));
    font-size: 11px; padding: 6px 10px;
  }
}
#consc-badge.visible { display: inline-flex; }
#consc-badge .cb-icon { color: rgba(168, 220, 220, 0.95); font-size: 14px; }
#consc-badge .cb-num { color: rgba(255, 220, 200, 0.88); font-family: "DM Mono", monospace; font-size: 11px; letter-spacing: 0.06em; }
.consc-hotspot {
  position: fixed; z-index: 1235;
  width: 44px; height: 44px; border-radius: 50%;   /* 44px 觸控熱區（WCAG 2.5.5），視覺光點維持 26px 在 ::before */
  background: transparent; border: none; box-shadow: none;
  cursor: pointer; pointer-events: auto;
  transform: translate(-50%, -50%);
  display: flex; align-items: center; justify-content: center;
}
.consc-hotspot::before {
  content: ""; width: 26px; height: 26px; border-radius: 50%;
  background: rgba(168, 220, 220, 0.32);
  border: 1px solid rgba(168, 220, 220, 0.62);
  box-shadow: 0 0 12px rgba(168, 220, 220, 0.42);
  animation: consc-pulse 2.6s ease-in-out infinite;
}
.consc-hotspot.collected::before {
  background: rgba(248, 168, 152, 0.42);
  border-color: rgba(228, 70, 80, 0.62);
  box-shadow: 0 0 8px rgba(228, 70, 80, 0.42);
  animation: none;
}
@keyframes consc-pulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.18); }
}
.consc-popup {
  position: fixed; z-index: 1245;
  padding: 14px 22px;
  background: rgba(8, 6, 10, 0.88); backdrop-filter: blur(14px);
  border: 1px solid rgba(168, 220, 220, 0.42);
  border-radius: 3px;
  color: rgba(248, 232, 220, 0.95);
  font-family: "Cormorant Garamond", "Noto Serif TC", Georgia, serif;
  font-size: 15px; letter-spacing: 0.10em; line-height: 1.85;
  max-width: 320px;
  text-align: center;
  opacity: 0;
  transform: translate(-50%, -52%);
  transition: opacity 0.5s ease, transform 0.5s ease;
  pointer-events: none;
}
.consc-popup.visible { opacity: 1; transform: translate(-50%, -50%); }
.consc-popup .cp-age {
  display: block; font-family: "DM Mono", monospace;
  font-size: 9px; color: rgba(168, 220, 220, 0.72);
  letter-spacing: 0.32em; text-indent: 0.32em;
  text-transform: uppercase; margin-bottom: 8px;
}
@media (prefers-reduced-motion: reduce) {
  .consc-hotspot, .consc-hotspot::before { animation: none; }
  #consc-badge, .consc-popup { transition: none; }
}
  `;
  document.head.appendChild(s);
}

function makeBadge() {
  ensureStyle();
  let badge = document.getElementById('consc-badge');
  if (badge) return badge;
  badge = document.createElement('div');
  badge.id = 'consc-badge';
  badge.setAttribute('role', 'status');
  badge.setAttribute('aria-live', 'polite');
  const icon = document.createElement('span');
  icon.className = 'cb-icon';
  icon.textContent = '✦';
  const label = document.createElement('span');
  label.textContent = '意識碎片';
  const num = document.createElement('span');
  num.className = 'cb-num';
  num.id = 'consc-badge-num';
  num.textContent = '0/5';
  badge.appendChild(icon);
  badge.appendChild(label);
  badge.appendChild(num);
  document.body.appendChild(badge);
  return badge;
}

function updateBadge() {
  const collected = loadCollected();
  const num = document.getElementById('consc-badge-num');
  if (num) num.textContent = collected.length + '/5';
}

function renderHotspots() {
  ensureStyle();
  const collected = loadCollected();
  FRAGMENTS.forEach(function (f, i) {
const existing = document.getElementById('consc-hotspot-' + i);
if (existing) existing.remove();
const h = document.createElement('button');
h.id = 'consc-hotspot-' + i;
h.type = 'button';
h.className = 'consc-hotspot' + (collected.indexOf(i) >= 0 ? ' collected' : '');
h.setAttribute('aria-label', '意識碎片 ' + f.label);
h.style.top = f.pos.top;
h.style.left = f.pos.left;
h.addEventListener('click', function () { triggerFragment(i); });
document.body.appendChild(h);
  });
}

let _popupTimer = 0;
function triggerFragment(i) {
  const f = FRAGMENTS[i];
  if (!f) return;
  const collected = loadCollected();
  const wasNew = collected.indexOf(i) < 0;
  if (wasNew) {
collected.push(i);
saveCollected(collected);
const h = document.getElementById('consc-hotspot-' + i);
if (h) h.classList.add('collected');
updateBadge();
  }
  if (_popupTimer) clearTimeout(_popupTimer);
  let pop = document.getElementById('consc-popup');
  if (pop) pop.remove();
  pop = document.createElement('div');
  pop.id = 'consc-popup';
  pop.className = 'consc-popup';
  pop.setAttribute('role', 'status');
  pop.style.top = f.pos.top;
  pop.style.left = f.pos.left;
  const age = document.createElement('span');
  age.className = 'cp-age';
  age.textContent = f.age + ' 歲的意識';
  const quote = document.createElement('span');
  quote.textContent = '「' + f.quote + '」';
  pop.appendChild(age);
  pop.appendChild(quote);
  document.body.appendChild(pop);
  requestAnimationFrame(function () {
pop.classList.add('visible');
  });
  _popupTimer = setTimeout(function () {
pop.classList.remove('visible');
setTimeout(function () { if (pop.parentNode) pop.remove(); }, 500);
_popupTimer = 0;
  }, 3600);

  if (wasNew && collected.length === 5) {
/* 收滿 → 解鎖 __CONSC_TEXT__ 自動開
    — critical issue caught: __CONSC_TEXT__ 要等 renderer 載入 + loader z-index 999 < badge 1235
   解: poll 60 次 (~12s) until __CONSC_TEXT__ ready, 確保不會永久失效 */
let _unlockTries = 0;
function tryUnlock() {
  try {
    if (window.__CONSC_TEXT__ && typeof window.__CONSC_TEXT__.setIntensity === 'function') {
      window.__CONSC_TEXT__.setIntensity(0.6);
      console.info('[consc-frag] 5/5 collected — __CONSC_TEXT__ unlocked (intensity 0.6)');
      showUnlockedToast();
      return;
    }
  } catch (e) {
    console.warn('[consc-frag] unlock attempt failed:', e && e.message);
  }
  _unlockTries++;
  if (_unlockTries < 60) {
    setTimeout(tryUnlock, 200);
  } else {
    console.warn('[consc-frag] __CONSC_TEXT__ never became ready after 12s — showing toast anyway');
    showUnlockedToast();
  }
}
setTimeout(tryUnlock, 2800);
  }
}

function showUnlockedToast() {
  const t = document.createElement('div');
  t.className = 'consc-popup visible';
  t.style.top = '50%';
  t.style.left = '50%';
  t.style.borderColor = 'rgba(255, 220, 200, 0.62)';
  const age = document.createElement('span');
  age.className = 'cp-age';
  age.textContent = '意識菜市場 解鎖';
  const msg = document.createElement('span');
  msg.textContent = '「意識菜市場」現在自動點亮。';
  t.appendChild(age);
  t.appendChild(msg);
  document.body.appendChild(t);
  setTimeout(function () {
t.classList.remove('visible');
setTimeout(function () { if (t.parentNode) t.remove(); }, 600);
  }, 3600);
}

function activate() {
  ensureStyle();
  const badge = makeBadge();
  badge.classList.add('visible');
  updateBadge();
  renderHotspots();
}

function tryActivate() {
  if (isTourDone()) activate();
}

/* Activate on load if tour already done, OR after tour closes */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryActivate, { once: true });
} else {
  tryActivate();
}
/* Hook into tour close —  — review caught:「之後再玩」也算 close = 不該觸發碎片
   改成只在「完成所有步驟 + 點 OK 開始飛」時才激活, 透過監測 tutorial overlay 隱藏 + 最後步驟到達 */
const _origNext = window.lm402TourNext;
let _reachedFinalStep = false;
if (typeof _origNext === 'function') {
  window.lm402TourNext = function () {
const r = _origNext.apply(this, arguments);
/* After advance, check if we're on the final step */
try {
  const indicator = document.querySelector('.lt-step-indicator');
  if (indicator && /^[0-9]+ \/ [0-9]+$/.test(indicator.textContent || '')) {
    const parts = indicator.textContent.split('/').map(function (s) { return parseInt(s.trim(), 10); });
    if (parts[0] === parts[1]) _reachedFinalStep = true;
  }
} catch (e) {}
return r;
  };
}
const _origClose = window.closeLM402Tutorial;
if (typeof _origClose === 'function') {
  window.closeLM402Tutorial = function () {
const r = _origClose.apply(this, arguments);
/* Only activate if user reached the final step (i.e., completed tour, not skipped) */
if (_reachedFinalStep) {
  setTimeout(tryActivate, 400);
}
return r;
  };
}

/* A4 — 韓劇導演 3: BGM frequency-driven bloom (AnalyserNode 60-250Hz RMS → __POSTFX__.bloom.strength)
   默認 disabled, console opt-in: __BGM_DRIVE__.enable() / __BGM_DRIVE__.disable()
— review caught: use bloom.strength (not .intensity) + scan window for any Audio instance */
(function () {
  let _ctx = null, _analyser = null, _rafId = 0, _enabled = false, _connected = null;
  let _baseStrength = null;
  function findActiveAudio() {
/* Try: 1) any window-attached Audio refs 2) DOM <audio> 3) tracked-audios (if exposed) */
const candidates = [];
for (const k of Object.keys(window)) {
  try {
    const v = window[k];
    if (v && typeof v === 'object' && v.tagName === 'AUDIO') candidates.push(v);
  } catch (e) {}
}
Array.from(document.querySelectorAll('audio')).forEach(function (a) { candidates.push(a); });
for (const a of candidates) {
  if (a && !a.paused && a.duration > 0) return a;
}
return candidates.length > 0 ? candidates[candidates.length - 1] : null;
  }
  function ensureCtx() {
if (_ctx) return _ctx;
try {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  _ctx = new AC();
  return _ctx;
} catch (e) { return null; }
  }
  function rmsLowFreq() {
if (!_analyser) return 0;
const data = new Uint8Array(_analyser.frequencyBinCount);
_analyser.getByteFrequencyData(data);
/* 60-250Hz at 44.1kHz sample rate ≈ bins 1-12 (very rough; AudioContext default fftSize 2048) */
const lowBins = data.slice(2, 14);
let sum = 0;
for (let i = 0; i < lowBins.length; i++) sum += lowBins[i] * lowBins[i];
return Math.sqrt(sum / lowBins.length) / 255;
  }
  function tick() {
if (!_enabled) return;
_rafId = requestAnimationFrame(tick);
/* adaptive 弱機 level>=2 砍 bloom 時讓位(否則每幀覆蓋 adaptive 降載),loop 續跑,adaptive 回升再恢復 */
if (window.__ADAPTIVE_Q__ && window.__ADAPTIVE_Q__.level >= 2) return;
const rms = Math.max(rmsLowFreq(), 0.15);
/* Map 0.15-1.0 → bloom.strength 0.30-0.55 (韓劇導演 spec; postfx uses .strength not .intensity) */
const target = 0.30 + (rms - 0.15) / 0.85 * 0.25;
try {
  if (window.__POSTFX__ && window.__POSTFX__.tuning && window.__POSTFX__.tuning.bloom) {
    window.__POSTFX__.tuning.bloom.strength = Math.min(0.55, Math.max(0.30, target));
  }
} catch (e) {}
  }
  function enable() {
if (_enabled) { console.info('[bgm-drive] already enabled'); return; }
const ctx = ensureCtx();
if (!ctx) { console.warn('[bgm-drive] no AudioContext available'); return; }
const audio = findActiveAudio();
if (!audio) { console.warn('[bgm-drive] no playing audio found'); return; }
try {
  if (ctx.state === 'suspended') ctx.resume();
  const src = ctx.createMediaElementSource(audio);
  _analyser = ctx.createAnalyser();
  _analyser.fftSize = 2048;
  src.connect(_analyser);
  _analyser.connect(ctx.destination);
  _connected = src;
  _enabled = true;
  /* Backup base bloom.strength to restore on disable */
  if (window.__POSTFX__ && window.__POSTFX__.tuning && window.__POSTFX__.tuning.bloom) {
    _baseStrength = window.__POSTFX__.tuning.bloom.strength;
  }
  tick();
  console.info('[bgm-drive] enabled — bloom now driven by 60-250Hz RMS');
} catch (e) {
  console.warn('[bgm-drive] enable failed (createMediaElementSource may fail if audio is cross-origin or already connected):', e && e.message);
}
  }
  function disable() {
_enabled = false;
if (_rafId) cancelAnimationFrame(_rafId);
_rafId = 0;
if (_baseStrength !== null && window.__POSTFX__ && window.__POSTFX__.tuning && window.__POSTFX__.tuning.bloom) {
  window.__POSTFX__.tuning.bloom.strength = _baseStrength;
}
console.info('[bgm-drive] disabled');
  }
  window.__BGM_DRIVE__ = {
enable: enable, disable: disable,
isEnabled: function () { return _enabled; },
version: 'v1'
  };
})();

/* Console / debug */
window.__CONSC_FRAGMENTS__ = {
  list: function () { return FRAGMENTS.slice(); },
  collected: loadCollected,
  reset: function () {
try { localStorage.removeItem(KEY_FRAG); } catch (e) {}
['consc-badge', 'consc-popup'].forEach(function (id) {
  const el = document.getElementById(id);
  if (el) el.remove();
});
FRAGMENTS.forEach(function (_, i) {
  const h = document.getElementById('consc-hotspot-' + i);
  if (h) h.remove();
});
console.info('[consc-frag] reset');
  },
  activate: activate,
  version: 'v1'
};
})();

// CSP 收斂：tutorial 控制鈕改 addEventListener（取代 inline onclick）
(function () {
  function _w(sel, fnName) {
    var el = document.querySelector(sel);
    if (el) el.addEventListener("click", function () { if (typeof window[fnName] === "function") window[fnName](); });
  }
  _w(".lm402-tutorial-close", "closeLM402Tutorial");
  _w(".lt-skip", "closeLM402Tutorial");
  _w(".lt-btn-prev", "lm402TourPrev");
  _w(".lt-btn-next", "lm402TourNext");
})();
