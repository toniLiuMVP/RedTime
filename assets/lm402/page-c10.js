// lm402.html inline classic #10 外部化（CSP 撤 unsafe-inline）
/* C3 — 一眼瞬間 6-effect orchestration (twin only — 正本不動 紀律)
 觸發方式 (console)：__ONE_EYE_MOMENT__.trigger({ caption, ms })
 6 個效果：slow-mo / backlight / close-up / 字幕 / warm-grade / white-flash
 無 voice ducking (per 遊戲內已有配樂機制)。 */
(function () {
const STYLE_ID = 'one-eye-moment-style';
const ROOT_ID = 'one-eye-moment-overlay';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
#${ROOT_ID} {
  position: fixed; inset: 0; pointer-events: none; z-index: 9985;
  opacity: 0; transition: opacity 0.32s ease-out;
}
#${ROOT_ID}.active { opacity: 1; }
#${ROOT_ID} .oem-slowmo {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 48%,
    transparent 0%, transparent 22%,
    rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.55) 100%);
}
#${ROOT_ID} .oem-rim {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 28%,
    rgba(255, 224, 168, 0.42) 0%,
    rgba(255, 200, 130, 0.18) 18%,
    transparent 42%);
  mix-blend-mode: screen;
  animation: oemRimPulse 2.8s ease-in-out infinite;
}
@keyframes oemRimPulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}
#${ROOT_ID} .oem-bars-top,
#${ROOT_ID} .oem-bars-bot {
  position: absolute; left: 0; right: 0;
  background: linear-gradient(to bottom, #000 0%, #000 88%, transparent 100%);
  height: 22vh;
  transform: translateY(-100%);
  transition: transform 1.2s cubic-bezier(0.2, 0.7, 0.2, 1);
}
#${ROOT_ID} .oem-bars-top { top: 0; }
#${ROOT_ID} .oem-bars-bot {
  bottom: 0; top: auto;
  background: linear-gradient(to top, #000 0%, #000 88%, transparent 100%);
  transform: translateY(100%);
}
#${ROOT_ID}.active .oem-bars-top { transform: translateY(0); }
#${ROOT_ID}.active .oem-bars-bot { transform: translateY(0); }
#${ROOT_ID} .oem-caption {
  position: absolute; left: 50%; bottom: 22vh;
  transform: translateX(-50%) translateY(20px);
  font-family: "Cormorant Garamond", "Noto Serif TC", Georgia, serif;
  font-size: clamp(20px, 3vw, 36px); font-weight: 300;
  letter-spacing: 0.16em; text-indent: 0.16em;
  color: rgba(248, 232, 200, 0.96);
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.85);
  opacity: 0;
  transition: opacity 1.4s ease-out 0.5s, transform 1.4s ease-out 0.5s;
  white-space: pre-line; text-align: center;
}
#${ROOT_ID}.active .oem-caption {
  opacity: 1; transform: translateX(-50%) translateY(0);
}
#${ROOT_ID} .oem-grade {
  position: absolute; inset: 0;
  background: linear-gradient(180deg,
    rgba(255, 196, 140, 0.10) 0%,
    rgba(217, 156, 96, 0.06) 50%,
    rgba(120, 70, 40, 0.10) 100%);
  mix-blend-mode: overlay;
}
#${ROOT_ID} .oem-flash {
  position: absolute; inset: 0; background: #fff;
  opacity: 0;
}
#${ROOT_ID}.flash .oem-flash { opacity: 0.78; transition: opacity 0.08s ease-out; }
/* A3 — 韓劇導演 3-beat 鏡位節奏 timing — close-up → cut → wide pull-back */
#${ROOT_ID}.active .oem-rim { transition: opacity 0.45s ease-out; }
#${ROOT_ID}.active .oem-caption { transition: opacity 1.4s ease-out, transform 1.4s ease-out; }
#${ROOT_ID}.active .oem-bars-top, #${ROOT_ID}.active .oem-bars-bot { transition: transform 1.2s cubic-bezier(0.2, 0.7, 0.2, 1); }
#${ROOT_ID}.active[data-beat="1"] .oem-rim { opacity: 0; }
#${ROOT_ID}.active[data-beat="1"] .oem-caption { opacity: 0; transform: translateX(-50%) translateY(28px); }
#${ROOT_ID}.active[data-beat="2"] .oem-rim { opacity: 0.85; }
#${ROOT_ID}.active[data-beat="2"] .oem-caption { opacity: 0.45; transform: translateX(-50%) translateY(12px); }
#${ROOT_ID}.active[data-beat="3"] .oem-rim { opacity: 1; }
#${ROOT_ID}.active[data-beat="3"] .oem-caption { opacity: 1; transform: translateX(-50%) translateY(0); }
@media (prefers-reduced-motion: reduce) {
  #${ROOT_ID}.active[data-beat] .oem-rim { opacity: 1; }
  #${ROOT_ID}.active[data-beat] .oem-caption { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  #${ROOT_ID} .oem-rim { animation: none; }
  #${ROOT_ID} .oem-bars-top,
  #${ROOT_ID} .oem-bars-bot { transition: none; }
  #${ROOT_ID} .oem-caption { transition: opacity 0.4s ease-out; }
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
  root.appendChild(makeDiv('oem-slowmo'));
  root.appendChild(makeDiv('oem-rim'));
  root.appendChild(makeDiv('oem-grade'));
  root.appendChild(makeDiv('oem-bars-top'));
  root.appendChild(makeDiv('oem-bars-bot'));
  root.appendChild(makeDiv('oem-caption'));
  root.appendChild(makeDiv('oem-flash'));
  document.body.appendChild(root);
  return root;
}

/* review caught: track pending timers， repeated trigger 不會打斷
A3 — 韓劇導演 1: 3-beat 鏡位節奏 (close-up → cut → wide pull-back)
  beat 1 (0-400ms)     close-up + warm grade (認知「他看到了」)
  beat 2 (400-900ms)   add rim + slow-mo intensify (比對「她也看到了」)
  beat 3 (900-1400ms)  full pull-back + caption fade-in + final flash (失神「世界停了」) */
let _flashTimer = 0;
let _fadeTimer = 0;
let _beat2Timer = 0;
let _beat3Timer = 0;
function trigger(opts) {
  opts = opts || {};
  const caption = (typeof opts.caption === 'string') ? opts.caption : '她看見他了…';
  const ms = (typeof opts.ms === 'number' && opts.ms > 500) ? opts.ms : 4200;
  ensureStyle();
  const root = ensureRoot();
  const cap = root.querySelector('.oem-caption');
  if (cap) cap.textContent = caption;

  /* Cancel any in-flight effect timers before re-triggering */
  if (_flashTimer) { clearTimeout(_flashTimer); _flashTimer = 0; }
  if (_fadeTimer) { clearTimeout(_fadeTimer); _fadeTimer = 0; }
  if (_beat2Timer) { clearTimeout(_beat2Timer); _beat2Timer = 0; }
  if (_beat3Timer) { clearTimeout(_beat3Timer); _beat3Timer = 0; }

  /* 6) white flash first */
  root.classList.add('flash');
  _flashTimer = setTimeout(function () {
root.classList.remove('flash');
_flashTimer = 0;
  }, 140);
  /* Beat 1: close-up + warm grade (認知) */
  requestAnimationFrame(function () {
root.setAttribute('data-beat', '1');
root.classList.add('active');
  });
  /* Beat 2: add rim + slow-mo intensify (比對) */
  _beat2Timer = setTimeout(function () {
root.setAttribute('data-beat', '2');
_beat2Timer = 0;
  }, 400);
  /* Beat 3: full pull-back + caption (失神) */
  _beat3Timer = setTimeout(function () {
root.setAttribute('data-beat', '3');
_beat3Timer = 0;
  }, 900);
  /* hold + fade out */
  _fadeTimer = setTimeout(function () {
root.classList.remove('active');
root.removeAttribute('data-beat');
_fadeTimer = 0;
  }, ms);
  return { caption: caption, ms: ms };
}

function reset() {
  const root = document.getElementById(ROOT_ID);
  if (root) {
root.classList.remove('active');
root.classList.remove('flash');
  }
}

window.__ONE_EYE_MOMENT__ = {
  trigger: trigger,
  reset: reset,
  version: 'v1'
};
})();
