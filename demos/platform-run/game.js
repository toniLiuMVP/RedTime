import * as THREE from "../_vendor/three.module.js";
import { createPostFX } from "./postfx.js";
/* ════════════════════════════════════════════════
   fix-7 (r33 Codex finding):timer registry
   ════════════════════════════════════════════════
   現 13 處 setTimeout 未追蹤取消,phase change / restart 後舊 callback 仍會跑 → state/DOM 污染
   解:wrap setTimeout 為 safeSetTimeout(track _allTimers),createGuards 換關時 clearAllTimers()
   Console API:__CLEAR_TIMERS__() 緊急清所有 pending
*/
const _allTimers = new Set();
function safeSetTimeout(fn, ms) {
  let id;
  id = setTimeout(() => {
    _allTimers.delete(id);
    try { fn(); } catch (e) { console.error('[safeSetTimeout] callback error:', e); }
  }, ms);
  _allTimers.add(id);
  return id;
}
function clearAllTimers() {
  const n = _allTimers.size;
  _allTimers.forEach(id => clearTimeout(id));
  _allTimers.clear();
  if (n > 0) console.info('[clearAllTimers] cleared', n, 'pending timer(s)');
  return n;
}
if (typeof window !== 'undefined') {
  window.__CLEAR_TIMERS__ = clearAllTimers;
  window.__PENDING_TIMERS__ = () => _allTimers.size;
}


/* ════════════════════════════════════════════════
   常數與設定
   ════════════════════════════════════════════════ */
const PLATFORM_LEN = 400;
const PLATFORM_W   = 10;
const RUN_SPEED    = 8.5;
const SPRINT_SPEED = 12.5;
const SPRINT_MAX   = 100;
const SPRINT_DRAIN = 35;
const SPRINT_REGEN = 18;
const GAME_TIME    = 36;
const DODGE_SPEED  = 6;
const CAR_LEN      = 22;
const CAR_COUNT    = 8;
const DAUGHTER_Z   = -(PLATFORM_LEN / 2 - 25);

const POWERUP_COLLECT_RADIUS = 1.5;
const NPC_SAFE_DISTANCE = 3;

/* Jump constants */
const JUMP_VELOCITY = 5;
const JUMP_GRAVITY  = -15;

/* Luggage constants */
const LUGGAGE_COUNT = 7;
const LUGGAGE_COLLISION_RADIUS = 0.5;
const LUGGAGE_CLEAR_HEIGHT = 0.3;

/* Barrier constants */
const BARRIER_CLEAR_HEIGHT = 0.3;
const BARRIER_COLLISION_RADIUS = 0.8;

/* Quality presets */
const QUALITY_PRESETS = [
  { label: "\u4F4E",   pixelRatio: 0.5,  shadows: false, shadowType: null,                    shadowSize: 0,    fog: false, npcCount: 20, antialias: false },
  { label: "\u9806\u66A2", pixelRatio: 0.75, shadows: true,  shadowType: THREE.BasicShadowMap,    shadowSize: 512,  fog: true,  npcCount: 25, antialias: false },
  { label: "\u9AD8\u7D1A", pixelRatio: 1.0,  shadows: true,  shadowType: THREE.PCFSoftShadowMap,  shadowSize: 1024, fog: true,  npcCount: 30, antialias: true  },
  { label: "\u5168\u958B", pixelRatio: Math.min(window.devicePixelRatio, 2), shadows: true, shadowType: THREE.PCFSoftShadowMap, shadowSize: 1024, fog: true, npcCount: 35, antialias: true },
  { label: "\u5B8C\u7F8E", pixelRatio: Math.min(window.devicePixelRatio, 2), shadows: true, shadowType: THREE.PCFSoftShadowMap, shadowSize: 2048, fog: true, npcCount: 45, antialias: true },
];

/* ════════════════════════════════════════════════
   DOM 參照
   ════════════════════════════════════════════════ */
const dom = {
  title:        document.getElementById("title-screen"),
  hud:          document.getElementById("hud"),
  timerFill:    document.getElementById("timer-fill"),
  timerText:    document.getElementById("timer-text"),
  distText:     document.getElementById("distance-text"),
  sprintWrap:   document.getElementById("sprint-bar-wrap"),
  sprintFill:   document.getElementById("sprint-fill"),
  narrText:     document.getElementById("narr-text"),
  vignette:     document.getElementById("vignette"),
  result:       document.getElementById("result-screen"),
  resultTitle:  document.getElementById("result-title"),
  resultBody:   document.getElementById("result-body"),
  resultRetry:  document.getElementById("result-retry"),
  touchCtrl:    document.getElementById("touch-controls"),
  joystickArea: document.getElementById("joystick-area"),
  joystickKnob: document.getElementById("joystick-knob"),
  sprintBtn:    document.getElementById("sprint-btn"),
  jumpBtn:      document.getElementById("jump-btn"),
  ultimateBtn:  document.getElementById("ultimate-btn"),
  breathHint:   document.getElementById("breath-hint"),
  pickupNotify: document.getElementById("pickup-notify"),
  goldFlash:    document.getElementById("gold-flash"),
  muteBtn:      document.getElementById("mute-btn"),
  buffIndicators: document.getElementById("buff-indicators"),
  qualityBtn:   document.getElementById("quality-btn"),
  qualityPanel: document.getElementById("quality-panel"),
  /* Leaderboard */
  nameInput:      document.getElementById("name-input"),
  nameInputWrap:  document.getElementById("name-input-wrap"),
  saveScoreBtn:   document.getElementById("save-score-btn"),
  leaderboardBtn: document.getElementById("leaderboard-btn"),
  leaderboardPanel: document.getElementById("leaderboard-panel"),
  lbBody:         document.getElementById("lb-body"),
  lbClose:        document.getElementById("lb-close"),
  /* Level system */
  levelText:      document.getElementById("level-text"),
  levelTransition: document.getElementById("level-transition"),
  levelClearText: document.getElementById("level-clear-text"),
  levelNextText:  document.getElementById("level-next-text"),
  levelHookText:  document.getElementById("level-hook-text"),
  finalLevelWarning: document.getElementById("final-level-warning"),
  hiddenEnding:   document.getElementById("hidden-ending"),
  hiddenEndingText: document.getElementById("hidden-ending-text"),
  ultimateCount:  document.getElementById("ultimate-count"),
  introSkip:      document.getElementById("intro-skip"),
};

/* Set text content safely (no innerHTML) */
dom.ultimateBtn.textContent = "\u5FC5\u6BBA\u6280 E";
dom.qualityBtn.textContent = "\u2699";

function updateUltimateUI() {
  if (state.ultimateCharges > 0) {
    dom.ultimateBtn.classList.remove("used");
    dom.ultimateCount.textContent = "\u00D7" + state.ultimateCharges;
  } else {
    dom.ultimateBtn.classList.add("used");
    dom.ultimateCount.textContent = "\u00D70";
  }
}

/* ════════════════════════════════════════════════
   遊戲狀態
   ════════════════════════════════════════════════ */
const state = {
  phase: "title",
  clock: 0,
  transitionFreeze: false, // 關卡過場顯示 LEVEL_HOOK（把拔的回憶）時凍結整個模擬，時間不流逝
  timeLeft: GAME_TIME,
  sprint: SPRINT_MAX,
  playerZ: PLATFORM_LEN / 2 - 10,
  playerX: 0,
  playerVx: 0,
  sprinting: false,
  gotDaughter: false,
  introTimer: 0,
  narrTimer: 0,
  cameraShake: 0,
  heartRate: 60,
  trainSouthZ: PLATFORM_LEN,
  trainNorthZ: -PLATFORM_LEN,
  trainSouthArrived: false,
  trainNorthArrived: false,
  trainNorthDoorOpen: false,
  trainNorthLeaving: false,
  doorPhase: 0,
  /* power-up timers */
  riceBallTimer: 0,
  coffeeTimer: 0,
  collisionSlowTimer: 0,
  /* ultimate */
  ultimateUsed: false,
  ultimateTimer: 0,
  /* pickup notification */
  pickupNotifyTimer: 0,
  /* jump state */
  jumpY: 0,
  jumpVel: 0,
  isJumping: false,
  wasJumping: false,
  /* luggage slow */
  luggageSlowTimer: 0,
  /* barrier hint shown */
  barrierHintShown: false,
  /* quality */
  quality: 3,
  /* leaderboard */
  itemsCollected: 0,
  /* guard slow */
  guardSlowTimer: 0,
  /* victory animation */
  victoryTimer: 0,
  victoryPhase: 0,
  victoryDoorX: 0,
  victoryDoorZ: 0,
  /* === Level system === */
  currentLevel: 1,
  maxLevel: 10,
  totalTimeBank: 0,
  totalItemsBank: 0,
  levelTimes: [],
  ultimateCharges: 1,
  levelTransitionTimer: 0,
  hiddenEndingPhase: 0,
  hiddenEndingTimer: 0,
  /* carry-over state (persists between levels) */
  carryRiceBall: 0,
  carryCoffee: 0,
  carryUltimate: 0,
};

/* ════════════════════════════════════════════════
   背景音樂 — NEVER INTERRUPT
   ════════════════════════════════════════════════ */
const bgm = new Audio("\u628A\u62D4\u6211\u6703\u60F3\u4F60\u7684.mp3"); bgm.preload = "none";
bgm.loop = true;
bgm.volume = 0.3;
let bgmMuted = false;
let bgmStarted = false;

dom.muteBtn.textContent = "\uD83D\uDD0A";
function setMute(m) { bgmMuted = !!m; bgm.muted = bgmMuted; dom.muteBtn.textContent = bgmMuted ? "\uD83D\uDD07" : "\uD83D\uDD0A"; }
dom.muteBtn.addEventListener("click", function() { setMute(!bgmMuted); });
// P1-7 \u6A4B\u63A5\uFF1A\u8B93 vignette \u7684 SFX\uFF08\u6C34\u8072\u767D\u566A / \u5012\u5E36\u5347\u983B\uFF09\u5C0A\u91CD\u975C\u97F3\u9215\uFF08read-only getter\uFF09
window.__PT_AUDIO_OK__ = function () { try { return !bgmMuted; } catch (e) { return true; } };
// \u904A\u6232\u5167\u6545\u4E8B\u95B1\u8B80 overlay \u7684\u97F3\u6A02\u958B\u95DC\u7528(toni #1:\u8B80\u6545\u4E8B\u6642\u97F3\u6A02\u7E8C\u64AD\u3001\u53EF\u95DC);\u5171\u7528\u540C\u4E00 bgmMuted \u72C0\u614B
window.__PT_MUSIC_TOGGLE__ = function () { setMute(!bgmMuted); return !bgmMuted; };
window.__PT_MUSIC_ON__ = function () { return !bgmMuted; };

/* ════════════════════════════════════════════════
   Three.js 初始化
   ════════════════════════════════════════════════ */
let isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const defaultQuality = isMobile ? 3 : 4;
state.quality = defaultQuality;
const preset = QUALITY_PRESETS[state.quality];

const renderer = new THREE.WebGLRenderer({ antialias: preset.antialias, alpha: false });
renderer.setPixelRatio(preset.pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = preset.shadows;
if (preset.shadowType) renderer.shadowMap.type = preset.shadowType;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute("aria-label", "平台跑酷遊戲畫面");
document.body.prepend(renderer.domElement);

const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
if (preset.fog) {
  scene.fog = new THREE.FogExp2(0xc8dff0, 0.003);
} else {
  scene.fog = null;
}

/* ── Blender 寫實道具(非阻塞 dynamic import,失敗只 warn;raycast 關閉不擋遊戲) ── */
import("./props-loader.js").then((m) => m.loadSceneProps(THREE, scene, scene, { base: "./props/", items: [
  { file: "station_sign",    pos: [ 0,   3.4, -120], rot: 0 },
  { file: "station_sign",    pos: [ 0,   3.4,    0], rot: 0 },
  { file: "station_sign",    pos: [ 0,   3.4,  120], rot: 0 },
  { file: "departure_board", pos: [ 2.6, 3.0, -190], rot: -1.57 },
  { file: "departure_board", pos: [ 2.6, 3.0,  190], rot: -1.57 },
  { file: "vending_machine", pos: [ 3.4, 0,   -60], rot: -1.57 },
  { file: "vending_machine", pos: [ 3.4, 0,    60], rot: -1.57 },
  { file: "ticket_gate",     pos: [-3.4, 0,     0], rot: 0 },
  { file: "info_pillar",     pos: [-3.6, 0,  -150], rot: 0 },
  { file: "info_pillar",     pos: [-3.6, 0,   150], rot: 0 },
  { file: "timetable_stand", pos: [ 3.6, 0,  -190], rot: -1.57 },
  { file: "timetable_stand", pos: [ 3.6, 0,   190], rot: -1.57 },
  { file: "luggage_bag",     pos: [ 1.6, 0,  -168], rot: 0.5 },
  { file: "luggage_bag",     pos: [ 2.1, 0,  -165], rot: -0.3 },
] })).catch((e) => { console.warn("[props] module load failed:", e && e.message); });

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 12, PLATFORM_LEN / 2 + 20);
camera.lookAt(0, 0, 0);

/* ── 電影後製管線（移植自主場景 postfx；僅最高畫質檔啟用） ──
   月台是 400m 開放尺度 + primitive 大量 mesh，跟教室參數不同：
   DOF 焦段放寬、SSAO 先關（接觸陰影收益低、省 GPU）、bloom 壓低。
   可能過曝的 effect（godRays/lensFlare/volFog/chroma）沿用預設 0。 */
const POSTFX_MIN_QUALITY = 4; // 「完美」檔才開（桌機預設檔；行動預設「全開」不啟用）
let postfx = null;
let postfxOn = false;
const _fxAnchor = new THREE.Vector3();
function setPostfxEnabled(on) {
  if (on && !postfx) {
    try {
      postfx = createPostFX({ renderer, scene, camera });
      postfx.tuning.dof.focalRange = 10;
      postfx.tuning.dof.maxBlur = 2.2;
      postfx.tuning.ssao.enabled = false;
      postfx.tuning.bloom.strength = 0.14;
      postfx.tuning.grain.amount = 0.010;
      postfx.tuning.exposure = 1.05; // 對齊直出路徑（applyArtUpgrade 實際覆寫值 1.05）
      postfxSetSize();
    } catch (e) {
      console.warn("[postfx] init failed, falling back to direct render:", e && e.message);
      postfx = null;
      on = false;
    }
  }
  postfxOn = Boolean(on && postfx);
  if (typeof window !== "undefined") window.__PT_POSTFX__ = postfxOn ? postfx : null;
  /* GPU 後製上線時退場 DOM 假暗角/顆粒，避免雙重暗角 */
  const fake = document.getElementById("art-upgrade-postfx");
  if (fake) fake.style.display = postfxOn ? "none" : "";
}
function renderFrame() {
  if (postfxOn) {
    _fxAnchor.set(father.position.x, father.position.y + 1.5, father.position.z);
    postfx.setJuniorAnchor(_fxAnchor);
    postfx.render(state.clock); // 傳時間給 film grain，否則噪點靜態化
  } else {
    renderer.render(scene, camera);
  }
}
/* postfx RT 尺寸對齊直出路徑的 pixelRatio（Retina 上選最高檔不掉解析度；
   弱機由 adaptive 降檔自動關 postfx 兜底） */
function postfxSetSize() {
  if (!postfx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  postfx.setSize(Math.round(window.innerWidth * dpr), Math.round(window.innerHeight * dpr));
}

/* ════════════════════════════════════════════════
   r36 push4 美術強化 batch 1(platform-run)
   所有 API 預設 OFF,console call 才啟用 — 避免壞掉
   ════════════════════════════════════════════════ */
let _trainHeadlight = null;
window.__TRAIN_HEADLIGHT__ = function(intensity, color) {
  if (intensity === undefined) intensity = 2.5;
  if (color === undefined) color = '#fff5d6';
  if (_trainHeadlight) scene.remove(_trainHeadlight);
  _trainHeadlight = new THREE.SpotLight(new THREE.Color(color), intensity, 60, Math.PI / 5, 0.4, 1.5);
  _trainHeadlight.position.set(0, 4, -PLATFORM_LEN / 2);
  _trainHeadlight.target.position.set(0, 0, 0);
  scene.add(_trainHeadlight); scene.add(_trainHeadlight.target);
  console.info('[__TRAIN_HEADLIGHT__] intensity=' + intensity + ' color=' + color);
  return _trainHeadlight;
};
window.__TRAIN_HEADLIGHT_OFF__ = function() {
  if (_trainHeadlight) { scene.remove(_trainHeadlight); _trainHeadlight = null; }
  console.info('[__TRAIN_HEADLIGHT__] off');
};

/* L7 月台天花板 RectAreaLight 螢光燈群(替代單一 DirectionalLight) */
let _ceilingLights = [];
window.__CEILING_LIGHTS__ = function(count, intensity) {
  if (count === undefined) count = 6;
  if (intensity === undefined) intensity = 3;
  _ceilingLights.forEach(function(l) { scene.remove(l); });
  _ceilingLights = [];
  var spacing = PLATFORM_LEN / count;
  for (var i = 0; i < count; i++) {
    var light = new THREE.RectAreaLight(0xffffe0, intensity, 4, 0.4);
    light.position.set(0, 5.5, -PLATFORM_LEN / 2 + spacing / 2 + i * spacing);
    light.lookAt(0, 0, light.position.z);
    scene.add(light);
    _ceilingLights.push(light);
  }
  console.info('[__CEILING_LIGHTS__] ' + count + ' lights intensity=' + intensity);
};
window.__CEILING_LIGHTS_OFF__ = function() {
  _ceilingLights.forEach(function(l) { scene.remove(l); });
  _ceilingLights = [];
  console.info('[__CEILING_LIGHTS__] off');
};

/* K7 火車經過鏡頭震動(camera shake transfer) */
let _shakeRAF = null, _shakeT0 = 0;
window.__TRAIN_SHAKE__ = function(amplitude, durationMs) {
  /* A11Y-06：尊重 prefers-reduced-motion，前庭敏感者跳過火車經過的鏡頭震動（移動核心保留） */
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (amplitude === undefined) amplitude = 0.08;
  if (durationMs === undefined) durationMs = 1200;
  if (_shakeRAF) cancelAnimationFrame(_shakeRAF);
  _shakeT0 = performance.now();
  var baseY = camera.position.y, baseX = camera.position.x, baseZ = camera.position.z;
  var loop = function() {
    var t = (performance.now() - _shakeT0) / durationMs;
    if (t >= 1) {
      camera.position.set(baseX, baseY, baseZ);
      _shakeRAF = null;
      console.info('[__TRAIN_SHAKE__] complete');
      return;
    }
    var falloff = 1 - t;
    camera.position.y = baseY + (Math.random() - 0.5) * amplitude * falloff;
    camera.position.x = baseX + (Math.random() - 0.5) * amplitude * falloff;
    camera.position.z = baseZ + (Math.random() - 0.5) * amplitude * falloff;
    _shakeRAF = requestAnimationFrame(loop);
  };
  loop();
  console.info('[__TRAIN_SHAKE__] amplitude=' + amplitude + ' duration=' + durationMs + 'ms');
};

/* A5 月台蒸汽 / 火車到站 steam particle */
let _steam = null, _steamRaf = null;
window.__STEAM__ = function(count, intensity) {
  if (count === undefined) count = 150;
  if (intensity === undefined) intensity = 0.7;
  if (_steam) scene.remove(_steam);
  if (_steamRaf) { cancelAnimationFrame(_steamRaf); _steamRaf = null; }   // 防重複呼叫疊出兩個 RAF 迴圈(QA fix)
  var geo = new THREE.BufferGeometry();
  var positions = new Float32Array(count * 3), velocities = new Float32Array(count * 3);
  for (var i = 0; i < count; i++) {
    positions[i*3] = (Math.random() - 0.5) * 8;
    positions[i*3+1] = Math.random() * 2 + 0.2;
    positions[i*3+2] = -PLATFORM_LEN / 2 + Math.random() * 10;
    velocities[i*3] = (Math.random() - 0.5) * 0.003;
    velocities[i*3+1] = 0.005 + Math.random() * 0.008;
    velocities[i*3+2] = (Math.random() - 0.5) * 0.003;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.userData.velocities = velocities;
  var mat = new THREE.PointsMaterial({
    size: 0.35, color: 0xeeeeee, transparent: true, opacity: intensity * 0.5,
    sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  _steam = new THREE.Points(geo, mat);
  scene.add(_steam);
  var tick = function() {
    if (!_steam) return;
    var p = _steam.geometry.attributes.position.array, v = _steam.geometry.userData.velocities;
    for (var i = 0; i < count; i++) {
      p[i*3] += v[i*3]; p[i*3+1] += v[i*3+1]; p[i*3+2] += v[i*3+2];
      if (p[i*3+1] > 6) { p[i*3+1] = 0.2; }
    }
    _steam.geometry.attributes.position.needsUpdate = true;
    _steamRaf = requestAnimationFrame(tick);
  };
  tick();
  console.info('[__STEAM__] ' + count + ' particles intensity=' + intensity);
};
window.__STEAM_OFF__ = function() {
  if (_steamRaf) { cancelAnimationFrame(_steamRaf); _steamRaf = null; }
  if (_steam) { scene.remove(_steam); _steam = null; }
  console.info('[__STEAM__] off');
};

/* F7 + F6 Vignette + Grain DOM overlay(便宜 postfx,不需 EffectComposer)*/
let _vignetteEl = null;
window.__VIGNETTE__ = function(strength) {
  if (strength === undefined) strength = 0.5;
  if (typeof document === 'undefined') return;
  if (!_vignetteEl) {
    _vignetteEl = document.createElement('div');
    _vignetteEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9000;background:radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,' + strength + ') 100%);';
    document.body.appendChild(_vignetteEl);
  } else {
    _vignetteEl.style.background = 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,' + strength + ') 100%)';
  }
  console.info('[__VIGNETTE__] strength=' + strength);
};
window.__VIGNETTE_OFF__ = function() {
  if (_vignetteEl) { _vignetteEl.remove(); _vignetteEl = null; }
  console.info('[__VIGNETTE__] off');
};

/* K1 Camera Breath(月台雙時空也有用,FPS 漫步感)*/
let _pBreathRAF = null, _pBreathBaseY = null;
window.__CAMERA_BREATH__ = function(amp, freq) {
  if (amp === undefined) amp = 0.012;
  if (freq === undefined) freq = 0.5;
  if (_pBreathRAF) cancelAnimationFrame(_pBreathRAF);
  var t0 = performance.now();
  if (_pBreathBaseY === null) _pBreathBaseY = camera.position.y;
  var loop = function() {
    var t = (performance.now() - t0) / 1000;
    camera.position.y = _pBreathBaseY + Math.sin(t * freq * 2 * Math.PI) * amp;
    _pBreathRAF = requestAnimationFrame(loop);
  };
  loop();
  console.info('[__CAMERA_BREATH__] amp=' + amp + ' freq=' + freq + 'Hz');
};
window.__CAMERA_BREATH_OFF__ = function() {
  if (_pBreathRAF) { cancelAnimationFrame(_pBreathRAF); _pBreathRAF = null; }
  if (_pBreathBaseY !== null) camera.position.y = _pBreathBaseY;
  console.info('[__CAMERA_BREATH__] off');
};

/* r36 一鍵 apply all art enhancements */
window.__ART_APPLY_ALL__ = function() {
  try { window.__TRAIN_HEADLIGHT__(2.5, '#fff5d6'); } catch(e) {}
  try { window.__CEILING_LIGHTS__(6, 3); } catch(e) {}
  try { window.__STEAM__(150, 0.7); } catch(e) {}
  try { window.__VIGNETTE__(0.4); } catch(e) {}
  try { window.__CAMERA_BREATH__(0.012, 0.5); } catch(e) {}
  console.info('[__ART_APPLY_ALL__] art preset batch 1 全套啟用');
};
window.__ART_RESET_ALL__ = function() {
  try { window.__TRAIN_HEADLIGHT_OFF__(); } catch(e) {}
  try { window.__CEILING_LIGHTS_OFF__(); } catch(e) {}
  try { window.__STEAM_OFF__(); } catch(e) {}
  try { window.__VIGNETTE_OFF__(); } catch(e) {}
  try { window.__CAMERA_BREATH_OFF__(); } catch(e) {}
  console.info('[__ART_RESET_ALL__] art preset batch 1 全套重置');
};

/* ════════════════════════════════════════════════
   r38 push6 美術 batch 2(platform-run)
   ════════════════════════════════════════════════ */
/* M6 火車金屬 MeshPhysical 升等(traverse 火車相關 mesh)*/
window.__TRAIN_PHYSICAL__ = function(metalness, roughness, clearcoat) {
  if (metalness === undefined) metalness = 0.85;
  if (roughness === undefined) roughness = 0.35;
  if (clearcoat === undefined) clearcoat = 0.4;
  var count = 0;
  scene.traverse(function(obj) {
    if (!obj.material) return;
    var n = (obj.name || '').toLowerCase();
    if (!/train|car|metal|body|engine/.test(n)) return;
    // 取代為 MeshPhysicalMaterial(若還是 MeshStandard)
    if (obj.material.type === 'MeshStandardMaterial' && !obj.userData._physicalSwapped) {
      var c = obj.material.color ? obj.material.color.clone() : new THREE.Color(0x888888);
      var newMat = new THREE.MeshPhysicalMaterial({
        color: c, metalness: metalness, roughness: roughness,
        clearcoat: clearcoat, clearcoatRoughness: 0.1
      });
      obj.material = newMat;
      obj.userData._physicalSwapped = true;
      obj.material.needsUpdate = true;
      count++;
    } else if (obj.material.metalness !== undefined) {
      obj.material.metalness = metalness;
      obj.material.roughness = roughness;
      if (typeof obj.material.clearcoat === 'number') obj.material.clearcoat = clearcoat;
      obj.material.needsUpdate = true;
      count++;
    }
  });
  console.info('[__TRAIN_PHYSICAL__] ' + count + ' train materials upgraded');
};

/* M7 月台地磚 detail material(tile pattern + dirt overlay)*/
let _platformTileTex = null;
window.__PLATFORM_TILE__ = function(intensity) {
  if (intensity === undefined) intensity = 0.7;
  if (typeof document === 'undefined') return;
  if (!_platformTileTex) {
    var c = document.createElement('canvas');
    c.width = c.height = 512;
    var ctx = c.getContext('2d');
    /* 磚面:深溝縫 + 每磚微色差 + 污漬 + 伸縮縫(舊版 1px 縫近乎隱形) */
    ctx.fillStyle = '#5f5a50';
    ctx.fillRect(0, 0, 512, 512);
    for (var x = 0; x < 512; x += 64) {
      for (var y = 0; y < 512; y += 64) {
        var shade = 0.92 + Math.random() * 0.16;
        ctx.fillStyle = 'rgb(' + Math.round(134 * shade) + ',' + Math.round(128 * shade) + ',' + Math.round(111 * shade) + ')';
        ctx.fillRect(x + 3, y + 3, 58, 58);
        ctx.fillStyle = 'rgba(40,35,25,' + (Math.random() * 0.22) + ')';
        ctx.fillRect(x + 3 + Math.random() * 44, y + 3 + Math.random() * 44, 10, 10);
        /* 邊角磨損亮邊 */
        ctx.fillStyle = 'rgba(255,250,240,' + (Math.random() * 0.05) + ')';
        ctx.fillRect(x + 3, y + 3, 58, 3);
      }
    }
    /* 伸縮縫(每 256px 一條深縫) */
    ctx.fillStyle = '#423e36';
    ctx.fillRect(0, 254, 512, 5);
    ctx.fillRect(254, 0, 5, 512);
    _platformTileTex = new THREE.CanvasTexture(c);
    _platformTileTex.wrapS = _platformTileTex.wrapT = THREE.RepeatWrapping;
    /* 甲板 ~10×400:依長寬比設 repeat 接近方磚(8×8 會拉成 50m 長條) */
    _platformTileTex.repeat.set(3, 80);
    _platformTileTex.anisotropy = 8;
  }
  var count = 0;
  scene.traverse(function(obj) {
    if (!obj.material) return;
    var n = (obj.name || '').toLowerCase();
    if (!/platform|floor|ground|tile/.test(n)) return;
    obj.material.map = _platformTileTex;
    obj.material.needsUpdate = true;
    count++;
  });
  console.info('[__PLATFORM_TILE__] ' + count + ' floor surfaces tiled intensity=' + intensity);
};

/* M9 火車車身 decals(車牌 + logo SDF-style)*/
let _decals = [];
window.__TRAIN_DECALS__ = function(text) {
  if (text === undefined) text = 'LM-402';
  _decals.forEach(function(d) { if (d.parent) d.parent.remove(d); });
  _decals = [];
  if (typeof document === 'undefined') return;
  var c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);
  var tex = new THREE.CanvasTexture(c);
  var matDecal = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  scene.traverse(function(obj) {
    if (!obj.material) return;
    var n = (obj.name || '').toLowerCase();
    if (!/car|train|body/.test(n)) return;
    var geo = new THREE.PlaneGeometry(2, 0.5);
    var decal = new THREE.Mesh(geo, matDecal);
    decal.position.set(0, 1, 1.01);
    if (obj.position) obj.add(decal);
    _decals.push(decal);
  });
  console.info('[__TRAIN_DECALS__] text="' + text + '" ' + _decals.length + ' decals added');
};
window.__TRAIN_DECALS_OFF__ = function() {
  _decals.forEach(function(d) { if (d.parent) d.parent.remove(d); });
  _decals = [];
  console.info('[__TRAIN_DECALS__] off');
};

/* A6 月台地面濕反射(平面假反射 — 不用 true SSR)*/
let _wetFloorMesh = null;
window.__WET_FLOOR__ = function(reflectivity) {
  if (reflectivity === undefined) reflectivity = 0.3;
  if (_wetFloorMesh) scene.remove(_wetFloorMesh);
  /* 加一層半透 PlaneGeometry 模擬反射光 */
  var geo = new THREE.PlaneGeometry(PLATFORM_LEN, PLATFORM_W * 2);
  var mat = new THREE.MeshPhysicalMaterial({
    color: 0x223344, metalness: 0.8, roughness: 0.15,
    transparent: true, opacity: reflectivity,
    clearcoat: 1.0, clearcoatRoughness: 0.05
  });
  _wetFloorMesh = new THREE.Mesh(geo, mat);
  _wetFloorMesh.rotation.x = -Math.PI / 2;
  _wetFloorMesh.position.y = 0.005;
  scene.add(_wetFloorMesh);
  console.info('[__WET_FLOOR__] reflectivity=' + reflectivity);
};
window.__WET_FLOOR_OFF__ = function() {
  if (_wetFloorMesh) { scene.remove(_wetFloorMesh); _wetFloorMesh = null; }
  console.info('[__WET_FLOOR__] off');
};

/* K4 First-person POV camera mode toggle */
let _fpsBase = null;
window.__FPS_POV__ = function(mode) {
  if (mode === undefined) mode = 'on';
  if (_fpsBase === null) {
    _fpsBase = {
      pos: camera.position.clone(),
      target: new THREE.Vector3(0, 0, 0)
    };
    camera.getWorldDirection(_fpsBase.target);
  }
  if (mode === 'on') {
    camera.position.set(0, 1.7, 0);
    camera.lookAt(0, 1.7, -PLATFORM_LEN / 2);
  } else {
    camera.position.copy(_fpsBase.pos);
    camera.lookAt(0, 0, 0);
  }
  console.info('[__FPS_POV__] mode="' + mode + '"');
};

/* r38 batch 2 apply / reset for platform-run */
window.__ART_APPLY_BATCH2__ = function() {
  try { window.__TRAIN_PHYSICAL__(0.85, 0.35, 0.4); } catch(e) {}
  try { window.__PLATFORM_TILE__(0.7); } catch(e) {}
  try { window.__TRAIN_DECALS__('LM-402'); } catch(e) {}
  try { window.__WET_FLOOR__(0.3); } catch(e) {}
  console.info('[__ART_APPLY_BATCH2__] art preset batch 2 全套啟用');
};
window.__ART_RESET_BATCH2__ = function() {
  try { window.__TRAIN_DECALS_OFF__(); } catch(e) {}
  try { window.__WET_FLOOR_OFF__(); } catch(e) {}
  try { window.__FPS_POV__('off'); } catch(e) {}
  console.info('[__ART_RESET_BATCH2__] art preset batch 2 全套重置');
};
window.__ART_APPLY_EVERYTHING__ = function() {
  try { window.__ART_APPLY_ALL__(); } catch(e) {}
  try { window.__ART_APPLY_BATCH2__(); } catch(e) {}
  console.info('[__ART_APPLY_EVERYTHING__] platform-run 全 2 batch 美術全套啟用');
};
window.__ART_RESET_EVERYTHING__ = function() {
  try { window.__ART_RESET_ALL__(); } catch(e) {}
  try { window.__ART_RESET_BATCH2__(); } catch(e) {}
  console.info('[__ART_RESET_EVERYTHING__] platform-run 全 2 batch 重置');
};

/* ════════════════════════════════════════════════
   r39 push7 美術 batch 3(platform-run)— 5 個 procedural 拉回
   ════════════════════════════════════════════════ */

/* E5 月台招牌 SDF text sprite */
let _signs = [];
window.__PLATFORM_SIGN__ = function(stationName, dest) {
  if (stationName === undefined) stationName = '時光月台';
  if (dest === undefined) dest = '通往 2005';
  _signs.forEach(function(s) { scene.remove(s); }); _signs = [];
  if (typeof document === 'undefined') return;
  /* 招牌主圖 */
  var c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  var ctx = c.getContext('2d');
  /* 背景藍底白邊 */
  ctx.fillStyle = '#1a4ba8'; ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 112);
  /* 站名 */
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(stationName, 256, 50);
  /* 目的地 */
  ctx.font = '24px sans-serif';
  ctx.fillText('→ ' + dest, 256, 95);
  var tex = new THREE.CanvasTexture(c);
  /* 多個招牌沿月台分布 */
  for (var i = 0; i < 4; i++) {
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    var geo = new THREE.PlaneGeometry(4, 1);
    var sign = new THREE.Mesh(geo, mat);
    sign.position.set(-PLATFORM_W / 2 - 0.5, 3.5, -PLATFORM_LEN / 2 + (i + 0.5) * (PLATFORM_LEN / 4));
    sign.rotation.y = Math.PI / 2;
    scene.add(sign);
    _signs.push(sign);
  }
  console.info('[__PLATFORM_SIGN__] station="' + stationName + '" dest="' + dest + '" ' + _signs.length + ' signs');
};
window.__PLATFORM_SIGN_OFF__ = function() {
  _signs.forEach(function(s) { scene.remove(s); }); _signs = [];
  console.info('[__PLATFORM_SIGN__] off');
};

/* E6 月台 props variety(座椅 / 垃圾桶 random)*/
let _props = [];
window.__PROP_VARIETY__ = function(count) {
  if (count === undefined) count = 12;
  _props.forEach(function(p) { scene.remove(p); }); _props = [];
  for (var i = 0; i < count; i++) {
    var type = Math.random();
    var prop, mat;
    if (type < 0.4) {
      /* 長椅 */
      var geo = new THREE.BoxGeometry(1.8, 0.4, 0.5);
      mat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.7 });
      prop = new THREE.Mesh(geo, mat);
      prop.position.y = 0.4;
    } else if (type < 0.7) {
      /* 垃圾桶 */
      prop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 0.7, 12),
        new THREE.MeshStandardMaterial({ color: 0x5a5040, roughness: 0.4, metalness: 0.6 })
      );
      prop.position.y = 0.35;
    } else {
      /* 標誌柱 */
      prop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 })
      );
      prop.position.y = 0.75;
    }
    prop.position.x = (Math.random() - 0.5) * (PLATFORM_W * 0.7);
    prop.position.z = -PLATFORM_LEN / 2 + Math.random() * PLATFORM_LEN;
    prop.rotation.y = Math.random() * Math.PI * 2;
    prop.castShadow = true;
    scene.add(prop);
    _props.push(prop);
  }
  console.info('[__PROP_VARIETY__] ' + count + ' props placed');
};
window.__PROP_VARIETY_OFF__ = function() {
  _props.forEach(function(p) { scene.remove(p); }); _props = [];
  console.info('[__PROP_VARIETY__] off');
};

/* E7 遠景城市 procedural skyline(box buildings)*/
let _skyline = null;
function _disposeSkyline() {
  if (!_skyline) return;
  _skyline.traverse(function(o) {
    if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); }
  });
  scene.remove(_skyline);
  _skyline = null;
}
window.__CITY_SKYLINE__ = function(count, distance) {
  if (count === undefined) count = 40;
  if (distance === undefined) distance = 80;
  _disposeSkyline();
  _skyline = new THREE.Group();
  for (var i = 0; i < count; i++) {
    var w = 3 + Math.random() * 6, h = 5 + Math.random() * 25, d = 3 + Math.random() * 6;
    var building = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.6, 0.05, 0.15 + Math.random() * 0.1),
        roughness: 0.8
      })
    );
    /* 兩側街區帶：x 避開月台＋軌道走廊（原 sin/cos 擺位會把大樓生在跑道正中，變可穿越灰板） */
    var side = Math.random() < 0.5 ? -1 : 1;
    building.position.set(
      side * (25 + Math.random() * distance),
      h / 2,
      (Math.random() - 0.5) * (PLATFORM_LEN + 160)
    );
    _skyline.add(building);
  }
  scene.add(_skyline);
  console.info('[__CITY_SKYLINE__] ' + count + ' buildings at distance ' + distance);
};
window.__CITY_SKYLINE_OFF__ = function() {
  _disposeSkyline();
  console.info('[__CITY_SKYLINE__] off');
};

/* P6 NPC motion variety(月台路人 offset + speed jitter)*/
let _npcMotionRAF = null;
window.__NPC_MOTION__ = function(jitter) {
  if (jitter === undefined) jitter = 0.3;
  if (_npcMotionRAF) cancelAnimationFrame(_npcMotionRAF);
  var npcs = [];
  scene.traverse(function(obj) {
    if (!obj.position) return;
    var n = (obj.name || '').toLowerCase();
    if (!/npc|passenger|crowd|person/.test(n)) return;
    npcs.push({ obj: obj, basePos: obj.position.clone(), phase: Math.random() * Math.PI * 2, freq: 0.5 + Math.random() * jitter });
  });
  if (npcs.length === 0) { console.warn('[__NPC_MOTION__] no NPCs matched'); return; }
  var loop = function() {
    var t = performance.now() / 1000;
    npcs.forEach(function(d) {
      d.obj.position.x = d.basePos.x + Math.sin(t * d.freq + d.phase) * jitter;
      d.obj.position.z = d.basePos.z + Math.cos(t * d.freq * 0.7 + d.phase) * jitter * 0.5;
    });
    _npcMotionRAF = requestAnimationFrame(loop);
  };
  loop();
  console.info('[__NPC_MOTION__] ' + npcs.length + ' NPCs jitter=' + jitter);
};
window.__NPC_MOTION_OFF__ = function() {
  if (_npcMotionRAF) { cancelAnimationFrame(_npcMotionRAF); _npcMotionRAF = null; }
  console.info('[__NPC_MOTION__] off');
};

/* C10 NPC variety(月台路人多樣性 — scale + color random)*/
window.__NPC_VARIETY__ = function() {
  var count = 0;
  scene.traverse(function(obj) {
    if (!obj.material || !obj.position) return;
    var n = (obj.name || '').toLowerCase();
    if (!/npc|passenger|crowd|person/.test(n)) return;
    if (obj.userData._varietyApplied) return;
    obj.scale.set(0.85 + Math.random() * 0.3, 0.85 + Math.random() * 0.3, 0.85 + Math.random() * 0.3);
    if (obj.material.color) {
      obj.material.color.setHSL(Math.random(), 0.3 + Math.random() * 0.4, 0.4 + Math.random() * 0.3);
      obj.material.needsUpdate = true;
    }
    obj.userData._varietyApplied = true;
    count++;
  });
  console.info('[__NPC_VARIETY__] ' + count + ' NPCs varied');
};

/* r39 batch 3 apply / reset */
window.__ART_APPLY_BATCH3__ = function() {
  try { window.__PLATFORM_SIGN__('時光月台', '通往 2005'); } catch(e) {}
  try { window.__PROP_VARIETY__(12); } catch(e) {}
  try { window.__CITY_SKYLINE__(40, 80); } catch(e) {}
  try { window.__NPC_MOTION__(0.3); } catch(e) {}
  try { window.__NPC_VARIETY__(); } catch(e) {}
  console.info('[__ART_APPLY_BATCH3__] art preset batch 3 全套啟用');
};
window.__ART_RESET_BATCH3__ = function() {
  try { window.__PLATFORM_SIGN_OFF__(); } catch(e) {}
  try { window.__PROP_VARIETY_OFF__(); } catch(e) {}
  try { window.__CITY_SKYLINE_OFF__(); } catch(e) {}
  try { window.__NPC_MOTION_OFF__(); } catch(e) {}
  console.info('[__ART_RESET_BATCH3__] art preset batch 3 全套重置');
};
/* 重新定義 EVERYTHING 含 batch 3 */
window.__ART_APPLY_EVERYTHING__ = function() {
  try { window.__ART_APPLY_ALL__(); } catch(e) {}
  try { window.__ART_APPLY_BATCH2__(); } catch(e) {}
  try { window.__ART_APPLY_BATCH3__(); } catch(e) {}
  console.info('[__ART_APPLY_EVERYTHING__] platform-run 全 3 batch 美術全套啟用');
};
window.__ART_RESET_EVERYTHING__ = function() {
  try { window.__ART_RESET_ALL__(); } catch(e) {}
  try { window.__ART_RESET_BATCH2__(); } catch(e) {}
  try { window.__ART_RESET_BATCH3__(); } catch(e) {}
  console.info('[__ART_RESET_EVERYTHING__] platform-run 全 3 batch 重置');
};

/* ════════════════════════════════════════════════
   r40 push8 美術 batch 4(platform-run)
   F9 grain overlay + P5 foot IK fake + A9 heat haze 月台
   ════════════════════════════════════════════════ */

/* F9 月台 postfx 補 — film grain DOM overlay(補 batch 1 vignette)*/
let _pgrainEl = null, _pgrainRAF = null;
window.__MONTAI_GRAIN__ = function(strength, fps) {
  if (strength === undefined) strength = 0.10;
  if (fps === undefined) fps = 24;
  if (typeof document === 'undefined') return;
  if (_pgrainEl) _pgrainEl.remove();
  _pgrainEl = document.createElement('div');
  var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='SEED'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 STR 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>";
  _pgrainEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8997;opacity:' + strength + ';mix-blend-mode:overlay;';
  document.body.appendChild(_pgrainEl);
  var last = 0, seed = 0;
  var interval = 1000 / fps;
  var tick = function(now) {
    if (!_pgrainEl) return;
    if (now - last > interval) {
      seed = (seed + 1) % 100;
      var url = 'data:image/svg+xml;utf8,' + svg.replace('SEED', seed).replace('STR', strength * 2);
      _pgrainEl.style.backgroundImage = "url(\"" + url + "\")";
      last = now;
    }
    _pgrainRAF = requestAnimationFrame(tick);
  };
  tick(0);
  console.info('[__MONTAI_GRAIN__] strength=' + strength + ' fps=' + fps);
};
window.__MONTAI_GRAIN_OFF__ = function() {
  if (_pgrainRAF) { cancelAnimationFrame(_pgrainRAF); _pgrainRAF = null; }
  if (_pgrainEl) { _pgrainEl.remove(); _pgrainEl = null; }
  console.info('[__MONTAI_GRAIN__] off');
};

/* A9 月台軌道遠端 heat haze fake — DOM filter blur + hue-rotate */
let _phazeEl = null, _phazeRAF = null;
window.__HEAT_HAZE__ = function(strength) {
  if (strength === undefined) strength = 0.4;
  if (typeof document === 'undefined') return;
  if (!_phazeEl) {
    _phazeEl = document.createElement('div');
    _phazeEl.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:25%;pointer-events:none;z-index:8995;backdrop-filter:blur(1px);';
    document.body.appendChild(_phazeEl);
  }
  var t = 0;
  var tick = function() {
    if (!_phazeEl) return;
    t += 0.04;
    var blur = 0.6 + Math.sin(t) * strength;
    _phazeEl.style.backdropFilter = 'blur(' + blur + 'px) hue-rotate(' + (Math.sin(t * 0.7) * 4) + 'deg)';
    _phazeRAF = requestAnimationFrame(tick);
  };
  tick();
  console.info('[__HEAT_HAZE__] strength=' + strength);
};
window.__HEAT_HAZE_OFF__ = function() {
  if (_phazeRAF) { cancelAnimationFrame(_phazeRAF); _phazeRAF = null; }
  if (_phazeEl) { _phazeEl.remove(); _phazeEl = null; }
  console.info('[__HEAT_HAZE__] off');
};

/* P5 月台步伐 foot IK fake — 根據 character.position 反向計算 knee bend */
let _footIKRAF = null;
window.__FOOT_IK__ = function(strength) {
  if (strength === undefined) strength = 0.8;
  if (_footIKRAF) cancelAnimationFrame(_footIKRAF);
  /* 找場景上所有有 legL/legR userData 的 character */
  var chars = [];
  scene.traverse(function(obj) {
    if (obj.userData && (obj.userData.legL || obj.userData.legR)) {
      chars.push(obj);
    }
  });
  if (chars.length === 0) {
    console.warn('[__FOOT_IK__] no characters with legL/legR userData');
    return;
  }
  var basePos = chars.map(function(c) { return { y: c.position.y, t: 0 }; });
  var loop = function() {
    var t = performance.now() / 1000;
    chars.forEach(function(char, i) {
      basePos[i].t += 0.05;
      /* foot lock to ground level + knee bend cycle */
      var legL = char.userData.legL, legR = char.userData.legR;
      var stepPhase = Math.sin(basePos[i].t);
      if (legL && legL.rotation) {
        legL.rotation.x = stepPhase * 0.4 * strength;
      }
      if (legR && legR.rotation) {
        legR.rotation.x = -stepPhase * 0.4 * strength;
      }
      /* slight body bob 模擬 walking gait */
      char.position.y = basePos[i].y + Math.abs(stepPhase) * 0.03 * strength;
    });
    _footIKRAF = requestAnimationFrame(loop);
  };
  loop();
  console.info('[__FOOT_IK__] ' + chars.length + ' characters strength=' + strength);
};
window.__FOOT_IK_OFF__ = function() {
  if (_footIKRAF) { cancelAnimationFrame(_footIKRAF); _footIKRAF = null; }
  console.info('[__FOOT_IK__] off');
};

/* r40 batch 4 apply / reset */
window.__ART_APPLY_BATCH4__ = function() {
  try { window.__MONTAI_GRAIN__(0.10, 24); } catch(e) {}
  try { window.__HEAT_HAZE__(0.4); } catch(e) {}
  try { window.__FOOT_IK__(0.8); } catch(e) {}
  console.info('[__ART_APPLY_BATCH4__] art preset batch 4 全套啟用');
};
window.__ART_RESET_BATCH4__ = function() {
  try { window.__MONTAI_GRAIN_OFF__(); } catch(e) {}
  try { window.__HEAT_HAZE_OFF__(); } catch(e) {}
  try { window.__FOOT_IK_OFF__(); } catch(e) {}
  console.info('[__ART_RESET_BATCH4__] art preset batch 4 全套重置');
};
/* 重定義 EVERYTHING 含 batch 4 */
window.__ART_APPLY_EVERYTHING__ = function() {
  try { window.__ART_APPLY_ALL__(); } catch(e) {}
  try { window.__ART_APPLY_BATCH2__(); } catch(e) {}
  try { window.__ART_APPLY_BATCH3__(); } catch(e) {}
  try { window.__ART_APPLY_BATCH4__(); } catch(e) {}
  console.info('[__ART_APPLY_EVERYTHING__] platform-run 全 4 batch 美術全套啟用');
};
window.__ART_RESET_EVERYTHING__ = function() {
  try { window.__ART_RESET_ALL__(); } catch(e) {}
  try { window.__ART_RESET_BATCH2__(); } catch(e) {}
  try { window.__ART_RESET_BATCH3__(); } catch(e) {}
  try { window.__ART_RESET_BATCH4__(); } catch(e) {}
  console.info('[__ART_RESET_EVERYTHING__] platform-run 全 4 batch 重置');
};

/* ════════════════════════════════════════════════
   Codex r44 #7 (🔴) ack — art RAF audit + 集中 dispose 強化
   原 finding:多 RAF 特效可重複啟動,缺集中取消;長玩或重開累積 perf 問題
   現況:每個 _xxxRAF 已有 if (id) cancelAnimationFrame(id) guard(防重複啟動 ✓)
         + __ART_RESET_EVERYTHING__ 已 cover 4 batch dispose(集中 ✓ partial)
   補強:加 __PENDING_ART_RAFS__() console 給 toni audit + STEAM 加 generation guard
   ════════════════════════════════════════════════ */

/* __PENDING_ART_RAFS__() — 列出當前 active art RAF(對齊 r33 __PENDING_TIMERS__ pattern)*/
window.__PENDING_ART_RAFS__ = function() {
  var actives = [];
  if (typeof _shakeRAF !== 'undefined' && _shakeRAF) actives.push('TRAIN_SHAKE (K7)');
  if (typeof _pBreathRAF !== 'undefined' && _pBreathRAF) actives.push('CAMERA_BREATH (K1)');
  if (typeof _npcMotionRAF !== 'undefined' && _npcMotionRAF) actives.push('NPC_MOTION (P6)');
  if (typeof _pgrainRAF !== 'undefined' && _pgrainRAF) actives.push('MONTAI_GRAIN (F9)');
  if (typeof _phazeRAF !== 'undefined' && _phazeRAF) actives.push('HEAT_HAZE (A9)');
  if (typeof _footIKRAF !== 'undefined' && _footIKRAF) actives.push('FOOT_IK (P5)');
  if (typeof _steam !== 'undefined' && _steam) actives.push('STEAM (A5,self-cancelling chain)');
  console.info('[__PENDING_ART_RAFS__]', actives.length, 'active:', actives);
  return actives;
};

/* ════════════════════════════════════════════════
   光源 — DAYTIME
   ════════════════════════════════════════════════ */
/* 半球光 — 天空/地面漸層環境光 */
const hemiLight = new THREE.HemisphereLight(0x9ec8ee, 0x8a7a66, 0.55); /* 天藍/地暖的柔和塑形 */
scene.add(hemiLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.18); /* 平光壓低,把立體感讓給斜陽 */
scene.add(ambientLight);

/* 主陽光（更強、更真實的陰影） */
const mainLight = new THREE.DirectionalLight(0xffe2b8, 2.8); /* 午後暖陽 */
mainLight.position.set(38, 26, 18); /* 仰角 ~31°:長影斜照,柱/人/樹的影子落在月台上 */
mainLight.castShadow = true;
mainLight.shadow.mapSize.set(preset.shadowSize || 1024, preset.shadowSize || 1024);
mainLight.shadow.camera.left   = -30;
mainLight.shadow.camera.right  =  30;
mainLight.shadow.camera.top    =  80;
mainLight.shadow.camera.bottom = -80;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 200;
mainLight.shadow.bias = -0.0005;
mainLight.shadow.normalBias = 0.06; /* 31° 斜陽下地面 depth 梯度大,0.02 會出條紋 acne */
scene.add(mainLight);
scene.add(mainLight.target);

/* 逆光補光（背光邊緣光效果） */
const rimLight = new THREE.DirectionalLight(0xffd4a0, 0.6);
rimLight.position.set(-15, 30, -20);
scene.add(rimLight);

/* 暖色補光 */
const warmFill = new THREE.PointLight(0xffeedd, 0.35, 60);
warmFill.position.set(0, 8, 0);
scene.add(warmFill);

/* 月台區域補光 */
const platformFill = new THREE.PointLight(0xffffff, 0.15, 40);
platformFill.position.set(0, 5.5, -50);
scene.add(platformFill);

/* ════════════════════════════════════════════════
   art refinement pass (visual polish, game logic unchanged)
   following established rendering best practices:
   - AgX ToneMapping(取代 ACES)+ exposure 微調
   - HDR IBL envmap 程序生成(sunset/dusk)→ scene.environment 套全 PBR materials
   - scene.fog tone 微升(對齊 sunset 色)
   - defer traverse 升 metalness/clearcoat/sheen per material name pattern
   - DOM lightweight postfx vignette + grain(對齊 r38 batch 1 既有 vignette)
   ════════════════════════════════════════════════ */
(function applyArtUpgrade() {
  /* 1. tone mapping AgX(Gemini #1)*/
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.05;

  /* 2. 程序 sunset/dusk envmap → 半寫實 70%(Gemini #2 IBL)*/
  try {
    const pmremGen = new THREE.PMREMGenerator(renderer);
    pmremGen.compileEquirectangularShader && pmremGen.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    const sunsetMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: 'varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vDir;\n' +
        'void main(){\n' +
        '  vec3 d=normalize(vDir);\n' +
        '  float t=clamp(d.y*0.5+0.5, 0.0, 1.0);\n' +
        '  vec3 horizon=vec3(0.92, 0.66, 0.42);\n' +
        '  vec3 zenith=vec3(0.18, 0.32, 0.55);\n' +
        '  vec3 sky=mix(horizon, zenith, smoothstep(0.05, 0.55, t));\n' +
        '  vec3 ground=vec3(0.10, 0.08, 0.06);\n' +
        '  vec3 col=mix(ground, sky, smoothstep(-0.08, 0.05, d.y));\n' +
        '  float sun=max(0.0, dot(d, normalize(vec3(0.55, 0.32, -0.45))));\n' +
        '  col += pow(sun, 80.0) * vec3(2.4, 1.55, 0.85);\n' +
        '  col += pow(sun, 8.0) * vec3(0.35, 0.18, 0.06) * 0.18;\n' +
        '  gl_FragColor=vec4(col, 1.0);\n' +
        '}',
    });
    const envSphere = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 32), sunsetMat);
    envScene.add(envSphere);
    const envRT = pmremGen.fromScene(envScene, 0.04);
    scene.environment = envRT.texture;
    scene.background = envRT.texture;
    envScene.remove(envSphere);
    envSphere.geometry.dispose();
    sunsetMat.dispose();
    pmremGen.dispose();
    console.info('[art-upgrade r45] envmap + AgX tone mapping ready (twin sync)');
  } catch (e) {
    console.warn('[art-upgrade r45] envmap setup failed (graceful):', e.message);
  }

  /* 3. fog 大氣 perspective tone 微調(對齊 sunset 色 b09878)*/
  if (preset.fog) scene.fog = new THREE.FogExp2(0xb09878, 0.0025);

  /* 4. polling retry traverse 升級 materials v2(對齊正本 Phase 5 round 2)
     baseline upgrade for ALL MeshStandard + color-based pattern detection */
  if (typeof window !== 'undefined') window.__PLATFORM_TWIN_SCENE__ = scene;
  (function pollTraverseUpgrade() {
    var tries = 0, maxTries = 80, totalUpgraded = 0, stats = { byName: {}, total: 0 };
    function tryUpgrade() {
      var upgraded = 0;
      scene.traverse(function(obj) {
        if (!obj.material) return;
        var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (var i = 0; i < mats.length; i++) {
          var m = mats[i];
          if (m.userData && m.userData._artUpgraded) continue;
          if (!m.color && m.envMapIntensity === undefined) continue;
          if (m.envMapIntensity === undefined) m.envMapIntensity = 1.0;
          else m.envMapIntensity = 1.0;
          stats.total++;
          var c = m.color;
          var r = c ? c.r : 0, g = c ? c.g : 0, b = c ? c.b : 0;
          var name = ((obj.name || '') + ' ' + (m.name || '')).toLowerCase();

          if ((m.metalness > 0.5) || /train|rail|metal|cab|engine|car/.test(name)) {
            m.metalness = Math.max(m.metalness || 0.8, 0.85);
            m.roughness = Math.min(m.roughness || 0.4, 0.3);
            m.envMapIntensity = 1.5;
            stats.byName.metal = (stats.byName.metal || 0) + 1;
          } else if (g > r * 1.2 && g > b * 1.2 && g > 0.25) {
            m.envMapIntensity = 0.55;
            if (m.roughness !== undefined) m.roughness = 0.85;
            stats.byName.leaf = (stats.byName.leaf || 0) + 1;
          } else if (r > 0.7 && g > 0.6 && b < 0.4) {
            m.emissiveIntensity = Math.min((m.emissiveIntensity || 0) + 0.1, 0.5);
            stats.byName.yellow = (stats.byName.yellow || 0) + 1;
          } else if ((b > r && b > g && b > 0.3 && m.metalness !== undefined && m.metalness > 0.3) || /window|glass|pane/.test(name)) {
            m.metalness = 0.85;
            m.roughness = 0.08;
            m.envMapIntensity = 1.8;
            stats.byName.glass = (stats.byName.glass || 0) + 1;
          } else if (Math.abs(r - g) < 0.1 && Math.abs(g - b) < 0.1 && r > 0.4) {
            m.envMapIntensity = 0.7;
            if (m.roughness !== undefined) m.roughness = Math.min((m.roughness || 0.7) + 0.05, 0.95);
            stats.byName.platform = (stats.byName.platform || 0) + 1;
          } else {
            if (m.roughness !== undefined && m.roughness < 0.3) m.roughness = 0.3;
            stats.byName.other = (stats.byName.other || 0) + 1;
          }

          if (!m.userData) m.userData = {};
          m.userData._artUpgraded = true;
          upgraded++;
          m.needsUpdate = true;
        }
      });
      totalUpgraded += upgraded;
      tries++;
      /* 只在真的有新材質時 log;follow-up 只排一個(原本一次排兩個,
         每關新道具都觸發 upgraded>0 → timer 指數疊加洗版 console) */
      if (upgraded > 0) {
        console.info('[art-upgrade r45 v2] polling traverse:', totalUpgraded, 'materials | byCategory:', JSON.stringify(stats.byName), '| tries:', tries);
        if (typeof window !== 'undefined') window.__PLATFORM_TWIN_UPGRADE_STATS__ = stats;
      }
      if (tries < maxTries) {
        safeSetTimeout(tryUpgrade, upgraded > 0 ? 2000 : 600);
      }
    }
    safeSetTimeout(tryUpgrade, 600);
  })();

  /* 5. DOM lightweight postfx(對齊 r38 batch 1 vignette 已有,本次補 grain)*/
  if (typeof document !== 'undefined' && !document.getElementById('art-upgrade-postfx')) {
    var wrap = document.createElement('div');
    wrap.id = 'art-upgrade-postfx';
    var vig = document.createElement('div');
    vig.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8996;background:radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.45) 100%);';
    wrap.appendChild(vig);
    var grain = document.createElement('div');
    grain.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8997;opacity:0.08;mix-blend-mode:overlay;';
    wrap.appendChild(grain);
    document.body.appendChild(wrap);
    var svgT = "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='SEED'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.15 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>";
    var seed = 0, last = 0;
    (function grainTick(now) {
      if (now - last > 42) {
        seed = (seed + 1) % 100;
        grain.style.backgroundImage = 'url("data:image/svg+xml;utf8,' + svgT.replace('SEED', seed) + '")';
        last = now;
      }
      requestAnimationFrame(grainTick);
    })(0);
    console.info('[art-upgrade r45] DOM postfx ready (twin)');
  }
})();

/* ════════════════════════════════════════════════
   材質庫
   ════════════════════════════════════════════════ */
const MAT = {
  platform:   new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 }),
  yellow:     new THREE.MeshStandardMaterial({ color: 0xf5d050, roughness: 0.4, emissive: 0xf5d050, emissiveIntensity: 0.15 }),
  rail:       new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.3 }),
  gravel:     new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 1.0 }),
  pillar:     new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.6 }),
  roof:       new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, transparent: true, opacity: 0.6 }),
  window:     new THREE.MeshStandardMaterial({ color: 0x3a6a8a, roughness: 0.1, metalness: 0.5 }),
  door:       new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.3, metalness: 0.4 }),
  skin:       new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.8 }),
  fatherBody: new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.7 }),
  pink:       new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.6 }),
  bench:      new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 }),
  hair:       new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }),
  pants:      new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.7 }),
  shoe:       new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 }),
  pinkDress:  new THREE.MeshStandardMaterial({ color: 0xffb6c1, roughness: 0.6 }),
  pinkBag:    new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.6 }),
};

/* Father-specific materials */
const MAT_whiteSneaker = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.5 });
const MAT_glasses      = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
const MAT_fauxHawk     = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 });

/* Warning sign materials */
const MAT_warning = new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xffdd00, emissiveIntensity: 0.6, roughness: 0.3 });
const MAT_warningPole = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });

/* ════════════════════════════════════════════════
   迷彩紋理（背包 + 短褲用）
   ════════════════════════════════════════════════ */
function createCamoTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#556b2f";
  ctx.fillRect(0, 0, 128, 128);
  const colors = ["#3b5323", "#2e4a1e", "#6b4f2a", "#4a5d23", "#3d3d1e", "#5c4a1f"];
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    const cx = Math.random() * 128;
    const cy = Math.random() * 128;
    const rx = 5 + Math.random() * 18;
    const ry = 3 + Math.random() * 10;
    const rot = Math.random() * Math.PI;
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const camoTexture = createCamoTexture();
const MAT_camo = new THREE.MeshStandardMaterial({ map: camoTexture, roughness: 0.8 });

/* ════════════════════════════════════════════════
   建立月台
   ════════════════════════════════════════════════ */
function buildPlatform() {
  const g = new THREE.BoxGeometry(PLATFORM_W, 0.6, PLATFORM_LEN);
  const m = new THREE.Mesh(g, MAT.platform);
  m.name = "platform-deck"; /* 美術 pass 靠名稱匹配(原本全場景無命名,半數效果 no-op) */
  m.position.y = -0.3;
  m.receiveShadow = true;
  scene.add(m);

  for (const side of [-1, 1]) {
    const yg = new THREE.BoxGeometry(0.5, 0.05, PLATFORM_LEN);
    const ym = new THREE.Mesh(yg, MAT.yellow);
    ym.position.set(side * (PLATFORM_W / 2 - 0.2), 0.02, 0);
    scene.add(ym);
  }

  for (const side of [-1, 1]) {
    const gg = new THREE.BoxGeometry(4, 0.1, PLATFORM_LEN);
    const gm = new THREE.Mesh(gg, MAT.gravel);
    gm.position.set(side * (PLATFORM_W / 2 + 3), -0.85, 0);
    scene.add(gm);
  }

  for (const side of [-1, 1]) {
    for (const rr of [-0.4, 0.4]) {
      const rg = new THREE.BoxGeometry(0.08, 0.12, PLATFORM_LEN);
      const rm = new THREE.Mesh(rg, MAT.rail);
      rm.position.set(side * (PLATFORM_W / 2 + 3) + rr, -0.7, 0);
      scene.add(rm);
    }
  }

  for (let z = -PLATFORM_LEN / 2 + 10; z <= PLATFORM_LEN / 2 - 10; z += 20) {
    for (const x of [-3, 3]) {
      const pg = new THREE.CylinderGeometry(0.2, 0.25, 6, 8);
      const pm = new THREE.Mesh(pg, MAT.pillar);
      pm.position.set(x, 3, z);
      pm.castShadow = true;
      scene.add(pm);
    }
    const rg = new THREE.BoxGeometry(PLATFORM_W + 2, 0.15, 18);
    const rm = new THREE.Mesh(rg, MAT.roof);
    rm.position.set(0, 6, z);
    scene.add(rm);
  }

  /* ── 旅客座椅（精緻：座面 + 椅背 + 椅腳 + 扶手） ── */
  var benchLegMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.6 });
  var benchSeatMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.75 });
  var benchBackMat = new THREE.MeshStandardMaterial({ color: 0x7a6a50, roughness: 0.8 });
  for (let z = -PLATFORM_LEN / 2 + 25; z <= PLATFORM_LEN / 2 - 25; z += 30) {
    var benchG = new THREE.Group();
    /* 座面（木條拼排效果，3 根長條） */
    for (var bsi = 0; bsi < 3; bsi++) {
      var slat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.12), benchSeatMat);
      slat.position.set(0, 0.42, -0.14 + bsi * 0.14);
      slat.castShadow = true;
      benchG.add(slat);
    }
    /* 椅背（2 根木條） */
    for (var bbi = 0; bbi < 2; bbi++) {
      var backSlat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.03), benchBackMat);
      backSlat.position.set(0, 0.58 + bbi * 0.14, 0.22);
      backSlat.castShadow = true;
      benchG.add(backSlat);
    }
    /* 4 支椅腳（金屬） */
    for (var bli = 0; bli < 4; bli++) {
      var legX = (bli < 2 ? -0.65 : 0.65);
      var legZ = (bli % 2 === 0 ? -0.12 : 0.18);
      var benchLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 6), benchLegMat);
      benchLeg.position.set(legX, 0.21, legZ);
      benchG.add(benchLeg);
    }
    /* 2 支扶手（金屬弧形） */
    for (var bai = 0; bai < 2; bai++) {
      var armX = bai === 0 ? -0.72 : 0.72;
      var armRest = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), benchLegMat);
      armRest.rotation.x = -0.3;
      armRest.position.set(armX, 0.55, 0.08);
      benchG.add(armRest);
    }
    benchG.position.set(-2.5, 0, z);
    scene.add(benchG);
  }

  /* ── 垃圾桶 + 資源回收桶（每隔一段距離配對放置） ── */
  var trashBodyMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6, metalness: 0.3 });
  var trashLidMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.4 });
  var recycleMat = new THREE.MeshStandardMaterial({ color: 0x2a7a3a, roughness: 0.5 }); /* 綠色回收桶 */
  var recycleLidMat = new THREE.MeshStandardMaterial({ color: 0x1a6a2a, roughness: 0.4 });
  var trashLabelMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3 }); /* 標示牌 */

  for (let tz = -PLATFORM_LEN / 2 + 40; tz <= PLATFORM_LEN / 2 - 40; tz += 60) {
    /* 一般垃圾桶（灰色圓桶） */
    var trashG = new THREE.Group();
    var trashBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.65, 10), trashBodyMat);
    trashBody.position.y = 0.325;
    trashBody.castShadow = true;
    trashG.add(trashBody);
    var trashLid = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 10), trashLidMat);
    trashLid.position.y = 0.67;
    trashG.add(trashLid);
    /* 開口（投入口） */
    var trashHole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.06), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    trashHole.position.y = 0.69;
    trashG.add(trashHole);
    /* 標示牌「一般垃圾」 */
    var trashLabel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.01), trashLabelMat);
    trashLabel.position.set(0, 0.5, -0.2);
    trashG.add(trashLabel);
    trashG.position.set(2.5, 0, tz);
    scene.add(trashG);

    /* 資源回收桶（綠色圓桶，放旁邊） */
    var recycleG = new THREE.Group();
    var recycleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.65, 10), recycleMat);
    recycleBody.position.y = 0.325;
    recycleBody.castShadow = true;
    recycleG.add(recycleBody);
    var recycleLid = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 10), recycleLidMat);
    recycleLid.position.y = 0.67;
    recycleG.add(recycleLid);
    /* 圓形投入口 */
    var recycleHole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    recycleHole.position.y = 0.69;
    recycleG.add(recycleHole);
    /* 回收標誌 ♻（用三角形環表示） */
    var recycleSign = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.06, 3), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    recycleSign.position.set(0, 0.45, -0.2);
    recycleG.add(recycleSign);
    recycleG.position.set(2.9, 0, tz);
    scene.add(recycleG);
  }

  const floorG = new THREE.PlaneGeometry(100, PLATFORM_LEN + 40);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1 });
  const floorM = new THREE.Mesh(floorG, floorMat);
  floorM.rotation.x = -Math.PI / 2;
  floorM.position.y = -0.9;
  floorM.receiveShadow = true;
  scene.add(floorM);
}

/* ════════════════════════════════════════════════
   台中火車站背景 — 偶像劇等級天空 + 真實百貨大樓群
   ════════════════════════════════════════════════ */
function buildBackground() {

  /* ═══ 一、偶像劇天空 ═══ */
  /* 天空漸層球（溫暖午後色調） */
  const skyGeo = new THREE.SphereGeometry(280, 48, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor:    { value: new THREE.Color(0x3a7ec8) },  /* 頂部深藍 */
      midColor:    { value: new THREE.Color(0x6aadee) },  /* 中段天藍 */
      bottomColor: { value: new THREE.Color(0xf0e0c8) },  /* 地平線暖金 */
      sunDir:      { value: new THREE.Vector3(38, 26, 18).normalize() }, /* 與主光同向 */
      sunColor:    { value: new THREE.Color(0xfff5e0) },
      offset:      { value: 12 },
      exponent:    { value: 0.35 }
    },
    vertexShader: [
      "varying vec3 vWorldPos;",
      "void main() {",
      "  vec4 wp = modelMatrix * vec4(position, 1.0);",
      "  vWorldPos = wp.xyz;",
      "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
      "}"
    ].join("\n"),
    fragmentShader: [
      "uniform vec3 topColor;",
      "uniform vec3 midColor;",
      "uniform vec3 bottomColor;",
      "uniform vec3 sunDir;",
      "uniform vec3 sunColor;",
      "uniform float offset;",
      "uniform float exponent;",
      "varying vec3 vWorldPos;",
      "void main() {",
      "  vec3 dir = normalize(vWorldPos + offset);",
      "  float h = max(dir.y, 0.0);",
      "  /* 三段式天空漸層 */",
      "  vec3 skyCol = mix(bottomColor, midColor, smoothstep(0.0, 0.25, h));",
      "  skyCol = mix(skyCol, topColor, smoothstep(0.25, 0.7, h));",
      "  /* 太陽光暈 */",
      "  float sunDot = max(dot(dir, sunDir), 0.0);",
      "  skyCol += sunColor * pow(sunDot, 32.0) * 0.6;",
      "  skyCol += sunColor * pow(sunDot, 8.0) * 0.15;",
      "  gl_FragColor = vec4(skyCol, 1.0);",
      "}"
    ].join("\n")
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  /* 太陽光盤（可見的太陽） */
  var sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xfffce8, transparent: true, opacity: 0.7 });
  var sunOuter = new THREE.Mesh(new THREE.CircleGeometry(8, 32), new THREE.MeshBasicMaterial({ color: 0xfff8e0, transparent: true, opacity: 0.3 }));
  sunOuter.position.set(131, 90, 62); /* 沿主光方向放遠(normalize(38,26,18)×170) */
  sunOuter.lookAt(0, 0, 0);
  scene.add(sunOuter);
  var sunCore = new THREE.Mesh(new THREE.CircleGeometry(3.5, 32), sunGlowMat);
  sunCore.position.set(131, 90, 62);
  sunCore.lookAt(0, 0, 0);
  scene.add(sunCore);

  /* ═══ 積雲（Cumulus）叢集 ═══ */
  /* 每朵雲 = 5~8 個球體堆疊出蓬鬆形狀 */
  var cloudCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  var cloudEdgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
  var cloudSunMat  = new THREE.MeshBasicMaterial({ color: 0xfff8e8, transparent: true, opacity: 0.5 });

  var cloudDefs = [
    { x: -80, y: 50, z: -60,  scale: 1.2 },
    { x: -30, y: 55, z: -110, scale: 0.9 },
    { x:  50, y: 48, z: -80,  scale: 1.0 },
    { x:  90, y: 58, z: -30,  scale: 1.4 },
    { x: -60, y: 52, z:  40,  scale: 0.8 },
    { x:  30, y: 56, z:  70,  scale: 1.1 },
    { x: -100, y: 45, z: 80,  scale: 1.3 },
    { x:  70, y: 60, z: 120,  scale: 0.7 },
    { x: -20, y: 62, z: 140,  scale: 0.6 },
    { x: 110, y: 50, z:  20,  scale: 1.0 },
    { x: -110, y: 55, z: -30, scale: 0.85 },
    { x:  0,  y: 65, z: -140, scale: 0.5 },
  ];

  for (var ci = 0; ci < cloudDefs.length; ci++) {
    var cd = cloudDefs[ci];
    var cloudGroup = new THREE.Group();
    var numPuffs = 5 + Math.floor(Math.random() * 4);
    for (var pi = 0; pi < numPuffs; pi++) {
      var puffR = (3 + Math.random() * 5) * cd.scale;
      var mat = pi < 2 ? cloudCoreMat : (pi < 4 ? cloudSunMat : cloudEdgeMat);
      var puff = new THREE.Mesh(new THREE.SphereGeometry(puffR, 8, 6), mat);
      puff.position.set(
        (Math.random() - 0.5) * 10 * cd.scale,
        (Math.random() - 0.3) * 3 * cd.scale,
        (Math.random() - 0.5) * 6 * cd.scale
      );
      puff.scale.y = 0.4 + Math.random() * 0.25;
      cloudGroup.add(puff);
    }
    cloudGroup.position.set(cd.x, cd.y, cd.z);
    scene.add(cloudGroup);
  }

  /* ═══ 二、真實建築群 ═══ */
  /* 共用材質 */
  var winGlassMat = new THREE.MeshStandardMaterial({ color: 0x6699cc, roughness: 0.05, metalness: 0.7, emissive: 0x1a2a3a, emissiveIntensity: 0.12 });
  var winFrameMat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.4 });
  var acMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 });
  var roofEdgeMat = new THREE.MeshStandardMaterial({ color: 0x556666, roughness: 0.5 });

  /* 每棟建築的定義（含建築型態） */
  var bldgDefs = [
    /* ── 左側建築群 ── */
    { x:-35,  z:-80,  type:"podium_tower", podW:22, podH:8, podD:24, podColor:0xd4c4a8,
      towerW:14, towerH:30, towerD:16, towerColor:0x8899aa, roofType:"antenna" },
    { x:-38,  z:-25,  type:"glass_curtain", w:16, h:48, d:16, baseColor:0x5a7a9a,
      glassColor:0x4488bb, roofType:"helipad" },
    { x:-32,  z:35,   type:"stepped", levels:[{w:22,h:12,d:24,c:0xccbbaa},{w:16,h:10,d:18,c:0xbbaa99},{w:10,h:8,d:12,c:0xaa9988}],
      roofType:"garden" },
    { x:-40,  z:95,   type:"glass_curtain", w:14, h:55, d:14, baseColor:0x7788aa,
      glassColor:0x3a7aaa, roofType:"spire" },
    { x:-35,  z:155,  type:"podium_tower", podW:20, podH:10, podD:22, podColor:0xc8b898,
      towerW:12, towerH:25, towerD:14, towerColor:0x99aabb, roofType:"flat" },
    /* ── 右側建築群 ── */
    { x:35,   z:-100, type:"podium_tower", podW:18, podH:9, podD:20, podColor:0xbba888,
      towerW:12, towerH:35, towerD:14, towerColor:0x889988, roofType:"antenna" },
    { x:38,   z:-35,  type:"stepped", levels:[{w:22,h:10,d:22,c:0xddc8b0},{w:18,h:12,d:16,c:0xccbb9a},{w:12,h:10,d:12,c:0xbbaa88}],
      roofType:"flat" },
    { x:32,   z:25,   type:"glass_curtain", w:14, h:50, d:14, baseColor:0x6a8aaa,
      glassColor:0x4488aa, roofType:"helipad" },
    { x:36,   z:85,   type:"podium_tower", podW:20, podH:8, podD:18, podColor:0xc0b090,
      towerW:14, towerH:30, towerD:12, towerColor:0x8899aa, roofType:"antenna" },
    { x:40,   z:145,  type:"stepped", levels:[{w:24,h:8,d:22,c:0xd0c0a8},{w:18,h:10,d:16,c:0xc0b098},{w:14,h:8,d:14,c:0xb0a088}],
      roofType:"garden" },
    /* ── 後方遠景（簡化但有造型） ── */
    { x:-58, z:-60,  type:"glass_curtain", w:12, h:62, d:12, baseColor:0x667788, glassColor:0x3a6a8a, roofType:"spire" },
    { x:-58, z:65,   type:"podium_tower", podW:14, podH:6, podD:14, podColor:0x998877, towerW:9, towerH:38, towerD:9, towerColor:0x778899, roofType:"flat" },
    { x:58,  z:-50,  type:"glass_curtain", w:12, h:58, d:12, baseColor:0x778899, glassColor:0x4488aa, roofType:"antenna" },
    { x:58,  z:75,   type:"podium_tower", podW:14, podH:6, podD:14, podColor:0xaa9977, towerW:9, towerH:34, towerD:9, towerColor:0x667788, roofType:"flat" },
  ];

  /* 窗戶生成器 — 在 bGroup 上繪製窗戶格線 */
  function addWindowGrid(bGroup, bw, bh, bd, floorH, startY) {
    var wW = 1.2, wH = 1.6, wGap = 2.2;
    var floors = Math.floor(bh / floorH);
    var winsPerRow = Math.max(1, Math.floor((bw - 1.5) / wGap));
    for (var face = 0; face < 4; face++) {
      for (var fi = 0; fi < floors; fi++) {
        var count = (face < 2) ? winsPerRow : Math.max(1, Math.floor((bd - 1.5) / wGap));
        var faceW = (face < 2) ? bw : bd;
        for (var wi = 0; wi < count; wi++) {
          var wx2 = -((count - 1) * wGap) / 2 + wi * wGap;
          var wy2 = startY + fi * floorH + floorH * 0.5;
          var wm = new THREE.Mesh(new THREE.PlaneGeometry(wW, wH), winGlassMat);
          if (face === 0) { wm.position.set(wx2, wy2, -(bd / 2 + 0.02)); }
          else if (face === 1) { wm.position.set(wx2, wy2, bd / 2 + 0.02); wm.rotation.y = Math.PI; }
          else if (face === 2) { wm.position.set(-(faceW === bd ? bw : bw) / 2 - 0.02, wy2, wx2); wm.rotation.y = Math.PI / 2; }
          else { wm.position.set((face === 3 ? bw : bw) / 2 + 0.02, wy2, wx2); wm.rotation.y = -Math.PI / 2; }
          if (face >= 2) {
            /* 側面窗位置用 bd 計算 */
            var sCount = Math.max(1, Math.floor((bd - 1.5) / wGap));
            var swx = -((sCount - 1) * wGap) / 2 + wi * wGap;
            if (wi >= sCount) continue;
            wm.position.z = swx;
            wm.position.x = (face === 2 ? -1 : 1) * (bw / 2 + 0.02);
          }
          bGroup.add(wm);
        }
      }
    }
  }

  /* 屋頂生成器 */
  function addRoof(bGroup, bw, bd, topY, type) {
    /* 屋頂邊框 */
    var edgeH = 1.0;
    var edge = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.6, edgeH, bd + 0.6), roofEdgeMat);
    edge.position.y = topY + edgeH / 2;
    bGroup.add(edge);
    /* 空調機組 */
    var acCount = 2 + Math.floor(Math.random() * 3);
    for (var ai = 0; ai < acCount; ai++) {
      var acBox = new THREE.Mesh(new THREE.BoxGeometry(1.2 + Math.random(), 0.8, 0.8 + Math.random()), acMat);
      acBox.position.set((Math.random() - 0.5) * (bw - 2.5), topY + edgeH + 0.4, (Math.random() - 0.5) * (bd - 2.5));
      bGroup.add(acBox);
    }
    if (type === "antenna") {
      /* 通訊天線塔 */
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 10, 6), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 }));
      pole.position.set(0, topY + edgeH + 5, 0);
      bGroup.add(pole);
      var dish = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 6, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5 }));
      dish.rotation.x = Math.PI / 4;
      dish.position.set(0, topY + edgeH + 7, -0.5);
      bGroup.add(dish);
      /* 紅色警示燈 */
      var warn = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6 }));
      warn.position.set(0, topY + edgeH + 10.2, 0);
      bGroup.add(warn);
    } else if (type === "helipad") {
      /* 直升機停機坪 */
      var pad = new THREE.Mesh(new THREE.CylinderGeometry(bw * 0.3, bw * 0.3, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0x556655 }));
      pad.position.y = topY + edgeH + 0.1;
      bGroup.add(pad);
      var hMark = new THREE.Mesh(new THREE.RingGeometry(bw * 0.15, bw * 0.2, 16), new THREE.MeshStandardMaterial({ color: 0xffffcc }));
      hMark.rotation.x = -Math.PI / 2;
      hMark.position.y = topY + edgeH + 0.22;
      bGroup.add(hMark);
    } else if (type === "spire") {
      /* 尖塔造型 */
      var spire = new THREE.Mesh(new THREE.ConeGeometry(1.5, 8, 8), new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.5 }));
      spire.position.y = topY + edgeH + 4;
      bGroup.add(spire);
    } else if (type === "garden") {
      /* 屋頂花園（綠色） */
      var garden = new THREE.Mesh(new THREE.BoxGeometry(bw - 2, 0.5, bd - 2), new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.9 }));
      garden.position.y = topY + edgeH + 0.25;
      bGroup.add(garden);
      /* 小灌木 */
      for (var si = 0; si < 4; si++) {
        var shrub = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 6), new THREE.MeshStandardMaterial({ color: 0x3a6a2a, roughness: 0.9 }));
        shrub.position.set((Math.random() - 0.5) * (bw - 4), topY + edgeH + 1.0, (Math.random() - 0.5) * (bd - 4));
        shrub.scale.y = 0.7;
        bGroup.add(shrub);
      }
    }
  }

  /* 裙樓商店（底部） */
  function addShopFront(bGroup, bw, bd) {
    var shopColors = [0xcc3333, 0x3366cc, 0xcc9933, 0x339933, 0xcc3399, 0x6633cc];
    /* 遮陽棚 */
    var awningColor = shopColors[Math.floor(Math.random() * shopColors.length)];
    var awning = new THREE.Mesh(
      new THREE.BoxGeometry(bw * 0.9, 0.12, 1.5),
      new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.6 })
    );
    awning.position.set(0, 4.0, -(bd / 2 + 0.8));
    bGroup.add(awning);
    /* 店面玻璃（大面積） */
    var shopGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(bw * 0.8, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x88bbdd, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.5 })
    );
    shopGlass.position.set(0, 2.2, -(bd / 2 + 0.03));
    bGroup.add(shopGlass);
    /* 店面招牌燈箱 */
    var signColor = shopColors[Math.floor(Math.random() * shopColors.length)];
    var shopSign = new THREE.Mesh(
      new THREE.BoxGeometry(bw * 0.5, 1.2, 0.3),
      new THREE.MeshStandardMaterial({ color: signColor, emissive: signColor, emissiveIntensity: 0.2, roughness: 0.3 })
    );
    shopSign.position.set(0, 5.5, -(bd / 2 + 0.2));
    bGroup.add(shopSign);
  }

  /* 生成所有建築 */
  for (var bi = 0; bi < bldgDefs.length; bi++) {
    var bd2 = bldgDefs[bi];
    var bGroup = new THREE.Group();

    if (bd2.type === "podium_tower") {
      /* === 裙樓 + 塔樓型 === */
      var podMat = new THREE.MeshStandardMaterial({ color: bd2.podColor, roughness: 0.65 });
      var podium = new THREE.Mesh(new THREE.BoxGeometry(bd2.podW, bd2.podH, bd2.podD), podMat);
      podium.position.y = bd2.podH / 2;
      podium.castShadow = true; podium.receiveShadow = true;
      bGroup.add(podium);
      /* 裙樓橫帶裝飾 */
      var podBand = new THREE.Mesh(new THREE.BoxGeometry(bd2.podW + 0.3, 0.3, bd2.podD + 0.3),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.3 }));
      podBand.position.y = bd2.podH;
      bGroup.add(podBand);
      addWindowGrid(bGroup, bd2.podW, bd2.podH, bd2.podD, 4.0, 0);
      addShopFront(bGroup, bd2.podW, bd2.podD);

      /* 塔樓 */
      var towerMat = new THREE.MeshStandardMaterial({ color: bd2.towerColor, roughness: 0.5 });
      var tower = new THREE.Mesh(new THREE.BoxGeometry(bd2.towerW, bd2.towerH, bd2.towerD), towerMat);
      tower.position.y = bd2.podH + bd2.towerH / 2;
      tower.castShadow = true; tower.receiveShadow = true;
      bGroup.add(tower);
      addWindowGrid(bGroup, bd2.towerW, bd2.towerH, bd2.towerD, 3.5, bd2.podH);
      /* 塔樓底部裝飾帶 */
      var tBand = new THREE.Mesh(new THREE.BoxGeometry(bd2.towerW + 0.4, 0.4, bd2.towerD + 0.4),
        new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.4 }));
      tBand.position.y = bd2.podH + 0.2;
      bGroup.add(tBand);
      addRoof(bGroup, bd2.towerW, bd2.towerD, bd2.podH + bd2.towerH, bd2.roofType);

    } else if (bd2.type === "glass_curtain") {
      /* === 玻璃帷幕大樓 === */
      /* 結構核心 */
      var coreMat = new THREE.MeshStandardMaterial({ color: bd2.baseColor, roughness: 0.4, metalness: 0.3 });
      var core = new THREE.Mesh(new THREE.BoxGeometry(bd2.w - 1, bd2.h, bd2.d - 1), coreMat);
      core.position.y = bd2.h / 2;
      core.castShadow = true;
      bGroup.add(core);
      /* 玻璃帷幕外層 */
      var curtainMat = new THREE.MeshStandardMaterial({
        color: bd2.glassColor, roughness: 0.02, metalness: 0.85,
        transparent: true, opacity: 0.65, envMapIntensity: 1.5
      });
      for (var gf = 0; gf < 4; gf++) {
        var gw = (gf < 2) ? bd2.w : bd2.d;
        var gd2 = (gf < 2) ? bd2.d : bd2.w;
        var glassPanel = new THREE.Mesh(new THREE.PlaneGeometry(gw, bd2.h), curtainMat);
        glassPanel.position.y = bd2.h / 2;
        if (gf === 0) { glassPanel.position.z = -(bd2.d / 2 + 0.01); }
        else if (gf === 1) { glassPanel.position.z = bd2.d / 2 + 0.01; glassPanel.rotation.y = Math.PI; }
        else if (gf === 2) { glassPanel.position.x = -(bd2.w / 2 + 0.01); glassPanel.rotation.y = Math.PI / 2; }
        else { glassPanel.position.x = bd2.w / 2 + 0.01; glassPanel.rotation.y = -Math.PI / 2; }
        bGroup.add(glassPanel);
      }
      /* 橫向樓層分隔線（金屬條） */
      var divMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 });
      for (var di = 0; di < Math.floor(bd2.h / 3.5); di++) {
        var divY = di * 3.5 + 1.75;
        for (var ds = 0; ds < 2; ds++) {
          var divLine = new THREE.Mesh(new THREE.BoxGeometry(bd2.w + 0.1, 0.08, 0.08), divMat);
          divLine.position.set(0, divY, ds === 0 ? -(bd2.d / 2 + 0.02) : (bd2.d / 2 + 0.02));
          bGroup.add(divLine);
        }
      }
      /* 底部入口 */
      addShopFront(bGroup, bd2.w, bd2.d);
      addRoof(bGroup, bd2.w, bd2.d, bd2.h, bd2.roofType);

    } else if (bd2.type === "stepped") {
      /* === 退縮階梯型 === */
      var baseY = 0;
      for (var li = 0; li < bd2.levels.length; li++) {
        var lv = bd2.levels[li];
        var lvMat = new THREE.MeshStandardMaterial({ color: lv.c, roughness: 0.6 });
        var lvMesh = new THREE.Mesh(new THREE.BoxGeometry(lv.w, lv.h, lv.d), lvMat);
        lvMesh.position.y = baseY + lv.h / 2;
        lvMesh.castShadow = true; lvMesh.receiveShadow = true;
        bGroup.add(lvMesh);
        /* 每層之間的裝飾帶 */
        if (li > 0) {
          var stepBand = new THREE.Mesh(new THREE.BoxGeometry(lv.w + 0.5, 0.3, lv.d + 0.5),
            new THREE.MeshStandardMaterial({ color: 0x888877, metalness: 0.3 }));
          stepBand.position.y = baseY + 0.15;
          bGroup.add(stepBand);
        }
        /* 退縮平台上的欄杆 */
        if (li > 0) {
          var prevLv = bd2.levels[li - 1];
          var railMat2 = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.4 });
          for (var rsi = 0; rsi < 2; rsi++) {
            var railZ = rsi === 0 ? -(lv.d / 2 - 0.2) : (lv.d / 2 - 0.2);
            var railWidth = (prevLv.w - lv.w) / 2;
            if (railWidth > 1) {
              var terRail = new THREE.Mesh(new THREE.BoxGeometry(railWidth, 0.8, 0.05), railMat2);
              terRail.position.set((lv.w / 2 + railWidth / 2), baseY + 0.4, railZ);
              bGroup.add(terRail);
              var terRail2 = terRail.clone();
              terRail2.position.x = -(lv.w / 2 + railWidth / 2);
              bGroup.add(terRail2);
            }
          }
        }
        addWindowGrid(bGroup, lv.w, lv.h, lv.d, 3.5, baseY);
        baseY += lv.h;
      }
      var topLv = bd2.levels[bd2.levels.length - 1];
      addShopFront(bGroup, bd2.levels[0].w, bd2.levels[0].d);
      addRoof(bGroup, topLv.w, topLv.d, baseY, bd2.roofType);
    }

    bGroup.position.set(bd2.x, -0.9, bd2.z);
    scene.add(bGroup);
  }

  /* ═══ 三、月台設施 ═══ */
  /* 車站站名標誌 */
  var signMat = new THREE.MeshStandardMaterial({ color: 0x1a4a7a, roughness: 0.3 });
  var signBack = new THREE.Mesh(new THREE.BoxGeometry(6, 1.5, 0.2), signMat);
  signBack.position.set(0, 7.5, -PLATFORM_LEN / 2 + 5);
  scene.add(signBack);

  /* 月台遮雨棚裝飾燈（精緻燈具：燈罩 + 燈泡） */
  var lampShadeMat = new THREE.MeshStandardMaterial({ color: 0xddddcc, roughness: 0.5 });
  var lampBulbMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffeeaa, emissiveIntensity: 0.4, roughness: 0.2 });
  for (var lz = -PLATFORM_LEN / 2 + 10; lz <= PLATFORM_LEN / 2 - 10; lz += 20) {
    var lampG = new THREE.Group();
    /* 燈罩 */
    var shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 0.2, 8), lampShadeMat);
    shade.position.y = 5.8;
    lampG.add(shade);
    /* 燈泡 */
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), lampBulbMat);
    bulb.position.y = 5.68;
    lampG.add(bulb);
    /* 燈桿 */
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), lampShadeMat);
    stem.position.y = 5.95;
    lampG.add(stem);
    lampG.position.set(0, 0, lz);
    scene.add(lampG);
  }

  /* 路樹（月台外側） */
  var treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  var treeFoliageMat = new THREE.MeshStandardMaterial({ color: 0x3a7a2a, roughness: 0.85 });
  var treeFoliageB = new THREE.MeshStandardMaterial({ color: 0x2a6a1a, roughness: 0.85 });
  for (var ti = -PLATFORM_LEN / 2 + 15; ti <= PLATFORM_LEN / 2 - 15; ti += 35) {
    for (var tside = -1; tside <= 1; tside += 2) {
      var treeG = new THREE.Group();
      var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3.5, 6), treeTrunkMat);
      trunk.position.y = 1.5;
      trunk.castShadow = true;
      treeG.add(trunk);
      /* 樹冠（多球疊加） */
      for (var fi2 = 0; fi2 < 4; fi2++) {
        var foliR = 1.5 + Math.random() * 0.8;
        var foliMat = Math.random() > 0.5 ? treeFoliageMat : treeFoliageB;
        var foli = new THREE.Mesh(new THREE.SphereGeometry(foliR, 8, 6), foliMat);
        foli.position.set((Math.random() - 0.5) * 1.2, 3.5 + Math.random() * 1.5, (Math.random() - 0.5) * 1.2);
        foli.scale.y = 0.7 + Math.random() * 0.3;
        foli.castShadow = true;
        treeG.add(foli);
      }
      treeG.position.set(tside * (PLATFORM_W / 2 + 8), -0.9, ti);
      scene.add(treeG);
    }
  }
}

/* ════════════════════════════════════════════════
   建立火車
   ════════════════════════════════════════════════ */
const trainSouth = new THREE.Group();
const trainNorth = new THREE.Group();
const northDoors = [];

function buildTrain(group, color, stripe, hasDoors) {
  var bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.25, metalness: 0.35 });
  var stripeMat = new THREE.MeshStandardMaterial({ color: stripe, roughness: 0.3, metalness: 0.2 });
  var bottomMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.3 });
  var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 });
  var ventMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6, metalness: 0.4 });
  var headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffcc, emissiveIntensity: 0.6, roughness: 0.1 });

  for (var i = 0; i < CAR_COUNT; i++) {
    var cz = -i * CAR_LEN;

    /* 車體主結構（圓頂造型） */
    var body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, CAR_LEN - 1), bodyMat);
    body.name = "train-car-body";
    body.position.set(0, 1.2, cz);
    body.castShadow = true;
    group.add(body);

    /* 側裙板:車側下緣深色收邊,破掉整面平板感 */
    var skirt = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.34, CAR_LEN - 1.1), bottomMat);
    skirt.position.set(0, 0.12, cz);
    group.add(skirt);
    /* 車頂簷線:車體與圓頂交界的細收邊 */
    var eave = new THREE.Mesh(new THREE.BoxGeometry(3.27, 0.07, CAR_LEN - 1.1), ventMat); /* 3.27:避免與窗框外面(±1.63)共面閃爍 */
    eave.position.set(0, 2.42, cz);
    group.add(eave);

    /* 圓頂 */
    var roofGeo = new THREE.CylinderGeometry(1.6, 1.6, CAR_LEN - 1.2, 12, 1, false, 0, Math.PI);
    var roofMat2 = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.4, metalness: 0.3 });
    var roofMesh = new THREE.Mesh(roofGeo, roofMat2);
    roofMesh.rotation.z = Math.PI / 2;
    roofMesh.rotation.y = Math.PI / 2;
    roofMesh.position.set(0, 2.4, cz);
    group.add(roofMesh);

    /* 色帶（車身中段） */
    var stripeGeo = new THREE.BoxGeometry(3.22, 0.3, CAR_LEN - 1.2);
    var sm = new THREE.Mesh(stripeGeo, stripeMat);
    sm.position.set(0, 1.6, cz);
    group.add(sm);

    /* 下方色帶 */
    var stripe2 = new THREE.Mesh(new THREE.BoxGeometry(3.22, 0.1, CAR_LEN - 1.2), stripeMat);
    stripe2.position.set(0, 0.3, cz);
    group.add(stripe2);

    /* 窗戶（更精緻） */
    for (var wz = -CAR_LEN / 2 + 3; wz < CAR_LEN / 2 - 3; wz += 2.5) {
      for (var wside = 0; wside < 2; wside++) {
        var wx = wside === 0 ? -1.61 : 1.61;
        /* 窗框 */
        var wFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.1, 1.6), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 }));
        wFrame.position.set(wx, 1.9, cz + wz);
        group.add(wFrame);
        /* 玻璃 */
        var wGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.9, 1.3), new THREE.MeshStandardMaterial({ color: 0x4488aa, roughness: 0.05, metalness: 0.7, transparent: true, opacity: 0.7 }));
        wGlass.position.set(wx * 0.99, 1.9, cz + wz);
        group.add(wGlass);
      }
    }

    /* 車門（更精緻） */
    if (hasDoors) {
      for (var dIdx = 0; dIdx < 2; dIdx++) {
        var dz = dIdx === 0 ? -CAR_LEN / 4 : CAR_LEN / 4;
        var doorMatL = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.2, metalness: 0.5 });
        var doorL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 0.7), doorMatL);
        var doorR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 0.7), doorMatL.clone());
        doorL.position.set(1.61, 1.1, cz + dz - 0.35);
        doorR.position.set(1.61, 1.1, cz + dz + 0.35);
        /* 門上小窗 */
        var doorWinMat = new THREE.MeshStandardMaterial({ color: 0x4488aa, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.6 });
        var doorWinL = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.5), doorWinMat);
        doorWinL.position.set(0.035, 0.5, 0);
        doorL.add(doorWinL);
        var doorWinR = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.5), doorWinMat);
        doorWinR.position.set(0.035, 0.5, 0);
        doorR.add(doorWinR);
        group.add(doorL);
        group.add(doorR);
        northDoors.push({ left: doorL, right: doorR, z: cz + dz });
      }
    }

    /* 轉向架 + 輪組 */
    for (var bIdx = 0; bIdx < 2; bIdx++) {
      var bz = bIdx === 0 ? -CAR_LEN / 3 : CAR_LEN / 3;
      var bogie = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 2.2), bottomMat);
      bogie.position.set(0, -0.1, cz + bz);
      group.add(bogie);
      /* 輪子（更精緻） */
      for (var wxi = 0; wxi < 2; wxi++) {
        for (var wzi = 0; wzi < 2; wzi++) {
          var wheelX = wxi === 0 ? -1.2 : 1.2;
          var wheelZ = wzi === 0 ? -0.5 : 0.5;
          var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16), wheelMat);
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(wheelX, -0.4, cz + bz + wheelZ);
          group.add(wheel);
          /* 輪緣 */
          var flange = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 16), wheelMat);
          flange.rotation.x = Math.PI / 2;
          flange.position.set(wheelX, -0.4, cz + bz + wheelZ + (wxi === 0 ? -0.08 : 0.08));
          group.add(flange);
        }
      }
    }

    /* 車頂通風口 */
    if (i % 2 === 0) {
      var vent = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.6), ventMat);
      vent.position.set(0, 3.1, cz);
      group.add(vent);
    }

    /* 車廂連接器 */
    if (i > 0) {
      var conn = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.4), bottomMat);
      conn.position.set(0, 0.6, cz + CAR_LEN / 2 - 0.2);
      group.add(conn);
      /* 連接器彈簧 */
      var spring = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8), ventMat);
      spring.rotation.z = Math.PI / 2;
      spring.position.set(0, 0.3, cz + CAR_LEN / 2 - 0.2);
      group.add(spring);
    }
  }

  /* 車頭大燈 */
  var headL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.08, 12), headlightMat);
  headL.rotation.x = Math.PI / 2;
  headL.position.set(-0.8, 1.2, CAR_LEN / 2 - 0.5);
  group.add(headL);
  var headR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.08, 12), headlightMat);
  headR.rotation.x = Math.PI / 2;
  headR.position.set(0.8, 1.2, CAR_LEN / 2 - 0.5);
  group.add(headR);

  /* 車頭擋風玻璃 */
  var frontGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x2a5a7a, roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.6 })
  );
  frontGlass.position.set(0, 2.0, CAR_LEN / 2 - 0.51);
  group.add(frontGlass);
}

function setupTrains() {
  buildTrain(trainSouth, 0xc4c7cb, 0x123a6e, false);   // EMU500:裸不鏽鋼銀 + 深藍帶(TRA 寫實,取代原通用藍)
  trainSouth.position.set(-(PLATFORM_W / 2 + 3), -0.45, PLATFORM_LEN);
  scene.add(trainSouth);

  buildTrain(trainNorth, 0xc6c9cd, 0x1656a4, true);   // EMU800 微笑號:裸不鏽鋼銀 + 藍帶(TRA 寫實,取代原橙色錯誤)
  trainNorth.position.set(PLATFORM_W / 2 + 3, -0.45, -PLATFORM_LEN);
  scene.add(trainNorth);
}

/* ════════════════════════════════════════════════
   黃線安全警衛（精緻 3D 模型）
   ════════════════════════════════════════════════ */
const guards = [];
const MAT_guardVest = new THREE.MeshStandardMaterial({ color: 0xccff00, roughness: 0.4, emissive: 0x445500, emissiveIntensity: 0.25 });
const MAT_guardSkin = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.75 });
const MAT_guardPants = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.65 });
const MAT_guardHat = new THREE.MeshStandardMaterial({ color: 0x1a1a6a, roughness: 0.5 });
const MAT_guardShirt = new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.6 });
const MAT_guardBelt = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
const MAT_guardShoe = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.5 });
const MAT_reflective = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.1, metalness: 0.6, emissive: 0xcccccc, emissiveIntensity: 0.15 });
const MAT_whistle = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.8 });

function createGuards() {
  /* fix-7 (r33):換關時 clear 所有 pending timers,避免舊 callback 改 state/DOM */
  clearAllTimers();
  /* Remove old guards */
  /* fix-7 (r32 Codex finding):加 dispose geometry + material,避免換關 WebGL memory leak
     (對齊 npc / lg / m 既有 dispose pattern,line 2347-2517) */
  for (var gi = 0; gi < guards.length; gi++) {
    var g = guards[gi];
    if (g.parent) scene.remove(g);
    g.traverse(function(child){
      if (child.geometry) child.geometry.dispose();
      if (child.material && child.material.dispose) child.material.dispose();
    });
  }
  guards.length = 0;

  /* Level-based scaling: base 10 + (level-1) extra per side */
  var GUARDS_PER_SIDE = 10 + (state.currentLevel - 1);
  /* Level-based wander range: 0.5 + (level-1)*0.1 person widths toward center */
  var maxWanderDist = 0.5 + (state.currentLevel - 1) * 0.1;

  for (var side = -1; side <= 1; side += 2) {
    for (var i = 0; i < GUARDS_PER_SIDE; i++) {
      var guard = new THREE.Group();

      /* === 頭部 === */
      var ghead = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 14), MAT_guardSkin);
      ghead.position.y = 1.4;
      ghead.castShadow = true;
      guard.add(ghead);

      /* 耳朵 */
      var gearL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), MAT_guardSkin);
      gearL.scale.set(0.5, 1, 0.7);
      gearL.position.set(-0.17, 1.4, 0);
      guard.add(gearL);
      var gearR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), MAT_guardSkin);
      gearR.scale.set(0.5, 1, 0.7);
      gearR.position.set(0.17, 1.4, 0);
      guard.add(gearR);

      /* 眼睛 */
      var gEyeW = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      var gEyeP = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2 });
      for (var gei = 0; gei < 2; gei++) {
        var gex = gei === 0 ? -0.06 : 0.06;
        var geW = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), gEyeW);
        geW.scale.z = 0.5;
        geW.position.set(gex, 1.42, -0.15);
        guard.add(geW);
        var geP = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), gEyeP);
        geP.position.set(gex, 1.42, -0.17);
        guard.add(geP);
      }

      /* 眉毛 */
      var gBrowMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
      var gBrowL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.015), gBrowMat);
      gBrowL.position.set(-0.06, 1.47, -0.14);
      guard.add(gBrowL);
      var gBrowR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.015), gBrowMat);
      gBrowR.position.set(0.06, 1.47, -0.14);
      guard.add(gBrowR);

      /* 頭髮（短平頭） */
      var gHairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
      var gHair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), gHairMat);
      gHair.position.y = 1.5;
      gHair.scale.set(1.05, 0.35, 1.05);
      guard.add(gHair);

      /* === 帽子（正式制帽 + 帽簷 + 帽徽） === */
      var ghatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.12, 12), MAT_guardHat);
      ghatTop.position.y = 1.56;
      guard.add(ghatTop);
      /* 帽簷 */
      var ghatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 12, 1, false, 0, Math.PI), MAT_guardHat);
      ghatBrim.rotation.y = Math.PI;
      ghatBrim.position.set(0, 1.5, -0.02);
      guard.add(ghatBrim);
      /* 帽徽（金色） */
      var gBadgeMat = new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.3, metalness: 0.7 });
      var gBadge = new THREE.Mesh(new THREE.CircleGeometry(0.03, 8), gBadgeMat);
      gBadge.position.set(0, 1.56, -0.135);
      guard.add(gBadge);

      /* === 上身 — 深藍襯衫 + 反光背心 === */
      var gShirt = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.45, 5, 10), MAT_guardShirt);
      gShirt.position.y = 0.95;
      gShirt.castShadow = true;
      guard.add(gShirt);

      /* 反光背心（疊在襯衫上） */
      var gVest = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.35, 4, 8), MAT_guardVest);
      gVest.position.y = 0.95;
      guard.add(gVest);

      /* 反光條紋（V 字型前後） */
      var gStripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.035, 0.01), MAT_reflective);
      gStripe1.position.set(0, 1.05, -0.24);
      guard.add(gStripe1);
      var gStripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.035, 0.01), MAT_reflective);
      gStripe2.position.set(0, 0.85, -0.24);
      guard.add(gStripe2);
      var gStripe3 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.035, 0.01), MAT_reflective);
      gStripe3.position.set(0, 1.05, 0.24);
      guard.add(gStripe3);

      /* === 皮帶 + 對講機 === */
      var gBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.05, 10), MAT_guardBelt);
      gBelt.position.y = 0.68;
      guard.add(gBelt);
      /* 皮帶扣 */
      var gBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), gBadgeMat);
      gBuckle.position.set(0, 0.68, -0.24);
      guard.add(gBuckle);
      /* 對講機 */
      var gRadio = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.025), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 }));
      gRadio.position.set(-0.25, 0.72, 0);
      guard.add(gRadio);
      /* 對講機天線 */
      var gAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.003, 0.08, 4), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      gAntenna.position.set(-0.25, 0.82, 0);
      guard.add(gAntenna);

      /* === 手臂 === */
      var gArmL = new THREE.Group();
      var gArmLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.4, 8), MAT_guardShirt);
      gArmLMesh.position.y = -0.15;
      gArmL.add(gArmLMesh);
      var gHandL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), MAT_guardSkin);
      gHandL.position.y = -0.38;
      gArmL.add(gHandL);
      gArmL.position.set(-0.3, 1.15, 0);
      gArmL.rotation.z = 0.1;
      guard.add(gArmL);
      guard.userData.leftArm = gArmL;

      var gArmR = new THREE.Group();
      var gArmRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.4, 8), MAT_guardShirt);
      gArmRMesh.position.y = -0.15;
      gArmR.add(gArmRMesh);
      var gHandR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), MAT_guardSkin);
      gHandR.position.y = -0.38;
      gArmR.add(gHandR);
      gArmR.position.set(0.3, 1.15, 0);
      gArmR.rotation.z = -0.1;
      guard.add(gArmR);
      guard.userData.rightArm = gArmR;

      /* 哨子（掛在脖子上） */
      var gWhistle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.04, 6), MAT_whistle);
      gWhistle.rotation.x = Math.PI / 2;
      gWhistle.position.set(0.05, 1.2, -0.2);
      guard.add(gWhistle);
      /* 哨子繩 */
      var gWhistleCord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 4), new THREE.MeshStandardMaterial({ color: 0x333333 }));
      gWhistleCord.position.set(0.03, 1.28, -0.18);
      gWhistleCord.rotation.z = 0.3;
      guard.add(gWhistleCord);

      /* === 腿（左右分組，方便動畫） === */
      var gLegL = new THREE.Group();
      var gLegLUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.3, 8), MAT_guardPants);
      gLegLUpper.position.y = -0.1;
      gLegL.add(gLegLUpper);
      var gLegLLower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.25, 8), MAT_guardPants);
      gLegLLower.position.y = -0.35;
      gLegL.add(gLegLLower);
      /* 黑皮鞋 */
      var gShoeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.18), MAT_guardShoe);
      gShoeL.position.set(0, -0.5, -0.03);
      gLegL.add(gShoeL);
      gLegL.position.set(-0.1, 0.6, 0);
      guard.add(gLegL);
      guard.userData.leftLeg = gLegL;

      var gLegR = new THREE.Group();
      var gLegRUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.3, 8), MAT_guardPants);
      gLegRUpper.position.y = -0.1;
      gLegR.add(gLegRUpper);
      var gLegRLower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.25, 8), MAT_guardPants);
      gLegRLower.position.y = -0.35;
      gLegR.add(gLegRLower);
      var gShoeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.18), MAT_guardShoe);
      gShoeR.position.set(0, -0.5, -0.03);
      gLegR.add(gShoeR);
      gLegR.position.set(0.1, 0.6, 0);
      guard.add(gLegR);
      guard.userData.rightLeg = gLegR;

      /* Contact shadow */
      var gShadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.3, 10),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 })
      );
      gShadow.rotation.x = -Math.PI / 2;
      gShadow.position.y = 0.01;
      guard.add(gShadow);

      var baseZ = -PLATFORM_LEN / 2 + 20 + (PLATFORM_LEN - 40) * (i / Math.max(1, GUARDS_PER_SIDE - 1));
      var patrolRange = 10 + Math.random() * 20;
      var lineX = side * (PLATFORM_W / 2 - 0.2);
      guard.position.set(lineX, 0, baseZ);
      /* 保留先前設定的四肢引用，合併巡邏資料 */
      var _la = guard.userData.leftArm;
      var _ra = guard.userData.rightArm;
      var _ll = guard.userData.leftLeg;
      var _rl = guard.userData.rightLeg;
      guard.userData = {
        side: side,
        lineX: lineX,
        baseZ: baseZ,
        patrolMin: baseZ - patrolRange,
        patrolMax: baseZ + patrolRange,
        patrolSpeed: 1.0 + Math.random() * 1.2,
        patrolDir: Math.random() > 0.5 ? 1 : -1,
        /* X wander: scales with level */
        maxWander: maxWanderDist,
        wanderX: 0,
        wanderTarget: 0,
        wanderTimer: Math.random() * 3,
        /* 四肢引用（走路動畫用） */
        leftArm: _la,
        rightArm: _ra,
        leftLeg: _ll,
        rightLeg: _rl
      };
      scene.add(guard);
      guards.push(guard);
    }
  }
}

function playGuardWhistle() {
  if (!audioCtx) return;
  var now = audioCtx.currentTime;
  var osc = audioCtx.createOscillator();
  var gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(2000, now);
  osc.frequency.linearRampToValueAtTime(2200, now + 0.15);
  osc.frequency.linearRampToValueAtTime(2000, now + 0.3);
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.5);
}

function updateGuards(dt) {
  for (var gi = 0; gi < guards.length; gi++) {
    var g = guards[gi];
    var d = g.userData;

    /* Z patrol along the line (unlimited range on line) */
    g.position.z += d.patrolDir * d.patrolSpeed * dt;
    if (g.position.z > d.patrolMax) d.patrolDir = -1;
    if (g.position.z < d.patrolMin) d.patrolDir = 1;

    /* X wander: leave line up to maxWander toward center, stay on line freely */
    var mw = d.maxWander || 0.5;
    d.wanderTimer -= dt;
    if (d.wanderTimer <= 0) {
      d.wanderTarget = Math.random() * mw;
      d.wanderTarget *= -d.side;
      d.wanderTimer = 1.5 + Math.random() * 3;
    }
    d.wanderX += (d.wanderTarget - d.wanderX) * dt * 2;
    g.position.x = d.lineX + d.wanderX;

    /* 警衛也必須留在月台上 */
    var guardHalfW = PLATFORM_W / 2 - 0.3;
    var guardHalfZ = PLATFORM_LEN / 2 - 2;
    g.position.x = Math.max(-guardHalfW, Math.min(guardHalfW, g.position.x));
    g.position.z = Math.max(-guardHalfZ, Math.min(guardHalfZ, g.position.z));

    /* 警衛巡邏走路動畫 */
    if (!d.walkPhase) d.walkPhase = Math.random() * Math.PI * 2;
    d.walkPhase += d.patrolSpeed * dt * 5;
    var gSwing = Math.sin(d.walkPhase) * 0.3;
    if (d.leftLeg) d.leftLeg.rotation.x = gSwing;
    if (d.rightLeg) d.rightLeg.rotation.x = -gSwing;
    if (d.leftArm) d.leftArm.rotation.x = -gSwing * 0.5;
    if (d.rightArm) d.rightArm.rotation.x = gSwing * 0.5;

    /* Collision check with father */
    var dx = father.position.x - g.position.x;
    var dz = father.position.z - g.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 1.0 && state.guardSlowTimer <= 0) {
      state.guardSlowTimer = 5;
      showNarrative("\u300C\u8ACB\u52FF\u8DE8\u8D8A\u9EC3\u7DDA\u3002\u300D", 2);
      playGuardWhistle();
    }
  }
}

/* ════════════════════════════════════════════════
   建立角色（增強版模型）
   ════════════════════════════════════════════════ */
const father   = new THREE.Group();
const daughter = new THREE.Group();
const mother   = new THREE.Group();
let npcs       = [];
const fatherLeftLeg = new THREE.Group();
const fatherRightLeg = new THREE.Group();
const fatherLeftArm = new THREE.Group();
const fatherRightArm = new THREE.Group();

const FATHER_BASE_Y = -0.01;
let fatherContactShadow = null; /* 接觸陰影 handle:跳躍時釘地用(animate 每幀抵銷升降) */

function buildFather() {
  /* Head（更高面數、更圓潤） */
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16), MAT.skin);
  head.position.y = 1.55;
  head.castShadow = true;
  father.add(head);

  /* 耳朵 */
  var earMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.85 });
  var earL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), earMat);
  earL.scale.set(0.6, 1, 0.8);
  earL.position.set(-0.22, 1.55, 0);
  father.add(earL);
  var earR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), earMat);
  earR.scale.set(0.6, 1, 0.8);
  earR.position.set(0.22, 1.55, 0);
  father.add(earR);

  /* 鼻子 */
  var noseMat = new THREE.MeshStandardMaterial({ color: 0xd4a070, roughness: 0.8 });
  var nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 8), noseMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 1.52, -0.22);
  father.add(nose);

  /* 嘴巴（微笑弧線） */
  var mouthCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.06, 1.46, -0.21),
    new THREE.Vector3(0, 1.44, -0.22),
    new THREE.Vector3(0.06, 1.46, -0.21)
  );
  var mouthGeo = new THREE.TubeGeometry(mouthCurve, 8, 0.008, 4, false);
  var mouthMat = new THREE.MeshStandardMaterial({ color: 0x8B5E3C, roughness: 0.9 });
  var mouth = new THREE.Mesh(mouthGeo, mouthMat);
  father.add(mouth);

  /* 眉毛 */
  var browMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 });
  var browL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.02), browMat);
  browL.position.set(-0.08, 1.62, -0.2);
  browL.rotation.z = 0.1;
  father.add(browL);
  var browR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.02), browMat);
  browR.position.set(0.08, 1.62, -0.2);
  browR.rotation.z = -0.1;
  father.add(browR);

  /* 眼睛 */
  var eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  var eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2 });
  for (var ei = 0; ei < 2; ei++) {
    var ex = ei === 0 ? -0.08 : 0.08;
    var eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeWhiteMat);
    eyeW.position.set(ex, 1.56, -0.2);
    eyeW.scale.z = 0.5;
    father.add(eyeW);
    var eyeP = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyePupilMat);
    eyeP.position.set(ex, 1.56, -0.22);
    father.add(eyeP);
  }

  /* Beckham faux hawk hair（更精緻） */
  const fauxHawkShape = new THREE.Shape();
  fauxHawkShape.moveTo(-0.14, -0.07);
  fauxHawkShape.lineTo(0.14, -0.07);
  fauxHawkShape.lineTo(0.09, 0.08);
  fauxHawkShape.lineTo(-0.09, 0.08);
  fauxHawkShape.closePath();
  const fauxHawkGeo = new THREE.ExtrudeGeometry(fauxHawkShape, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  const fauxHawk = new THREE.Mesh(fauxHawkGeo, MAT_fauxHawk);
  fauxHawk.position.set(0, 1.68, -0.16);
  father.add(fauxHawk);
  /* 側面頭髮 */
  var sideHairL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), MAT_fauxHawk);
  sideHairL.scale.set(0.3, 0.7, 0.9);
  sideHairL.position.set(-0.18, 1.6, 0);
  father.add(sideHairL);
  var sideHairR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), MAT_fauxHawk);
  sideHairR.scale.set(0.3, 0.7, 0.9);
  sideHairR.position.set(0.18, 1.6, 0);
  father.add(sideHairR);

  /* Thick-framed glasses（更精緻） */
  const glassesGroup = new THREE.Group();
  var glassMat = new THREE.MeshStandardMaterial({ color: 0x4488aa, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.4 });
  const frameL = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.018, 10, 20), MAT_glasses);
  frameL.position.set(-0.08, 0, 0);
  glassesGroup.add(frameL);
  var lensL = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), glassMat);
  lensL.position.set(-0.08, 0, -0.01);
  glassesGroup.add(lensL);
  const frameR = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.018, 10, 20), MAT_glasses);
  frameR.position.set(0.08, 0, 0);
  glassesGroup.add(frameR);
  var lensR = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), glassMat);
  lensR.position.set(0.08, 0, -0.01);
  glassesGroup.add(lensR);
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 6), MAT_glasses);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0, 0);
  glassesGroup.add(bridge);
  /* 鏡腳 */
  var templeL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.18, 4), MAT_glasses);
  templeL.rotation.x = Math.PI / 2;
  templeL.position.set(-0.14, 0, 0.08);
  glassesGroup.add(templeL);
  var templeR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.18, 4), MAT_glasses);
  templeR.rotation.x = Math.PI / 2;
  templeR.position.set(0.14, 0, 0.08);
  glassesGroup.add(templeR);
  glassesGroup.position.set(0, 1.55, -0.22);
  father.add(glassesGroup);

  /* Torso（更自然的體型） */
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.5, 6, 12), MAT.fatherBody);
  torso.position.y = 1.05;
  torso.castShadow = true;
  father.add(torso);


  /* 肩頭圓帽:把手臂跟軀幹接起來(原本肩膀有縫) */
  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), MAT.fatherBody);
  shoulderL.position.set(-0.34, 1.27, 0);
  father.add(shoulderL);
  const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), MAT.fatherBody);
  shoulderR.position.set(0.34, 1.27, 0);
  father.add(shoulderR);

  /* 衣領 */
  var collarMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.6 });
  var collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 6, 12, Math.PI), collarMat);
  collar.rotation.x = Math.PI / 2;
  collar.rotation.z = Math.PI;
  collar.position.set(0, 1.32, -0.08);
  father.add(collar);

  /* Belly */
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), MAT.fatherBody);
  belly.position.set(0, 0.85, -0.2);
  belly.castShadow = true;
  father.add(belly);

  /* Left arm */
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.55, 6), MAT.skin);
  armL.position.set(0, -0.2, 0);
  fatherLeftArm.add(armL);
  /* 左手掌 */
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), MAT.skin);
  handL.position.set(0, -0.5, 0);
  fatherLeftArm.add(handL);
  fatherLeftArm.position.set(-0.38, 1.25, 0);
  fatherLeftArm.rotation.z = 0.15;
  father.add(fatherLeftArm);

  /* Right arm */
  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.55, 6), MAT.skin);
  armR.position.set(0, -0.2, 0);
  fatherRightArm.add(armR);
  /* 右手掌 */
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), MAT.skin);
  handR.position.set(0, -0.5, 0);
  fatherRightArm.add(handR);
  fatherRightArm.position.set(0.38, 1.25, 0);
  fatherRightArm.rotation.z = -0.15;
  father.add(fatherRightArm);

  /* Left leg */
  const upperLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.085, 0.25, 6), MAT_camo);
  upperLegL.position.set(0, -0.1, 0);
  fatherLeftLeg.add(upperLegL);
  const calfL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.25, 6), MAT.skin);
  calfL.position.set(0, -0.35, 0);
  fatherLeftLeg.add(calfL);
  const sneakerL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.24), MAT_whiteSneaker);
  sneakerL.position.set(0, -0.52, -0.04);
  fatherLeftLeg.add(sneakerL);
  fatherLeftLeg.position.set(-0.13, 0.6, 0);
  father.add(fatherLeftLeg);

  /* Right leg */
  const upperLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.085, 0.25, 6), MAT_camo);
  upperLegR.position.set(0, -0.1, 0);
  fatherRightLeg.add(upperLegR);
  const calfR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.25, 6), MAT.skin);
  calfR.position.set(0, -0.35, 0);
  fatherRightLeg.add(calfR);
  const sneakerR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.24), MAT_whiteSneaker);
  sneakerR.position.set(0, -0.52, -0.04);
  fatherRightLeg.add(sneakerR);
  fatherRightLeg.position.set(0.13, 0.6, 0);
  father.add(fatherRightLeg);

  /* Camo backpack(圓頂蓋+側袋+肩帶,保留「好大的包」的份量感) */
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.35), MAT_camo);
  backpack.position.set(0, 1.05, 0.35);
  backpack.castShadow = true;
  father.add(backpack);
  const packTop = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.55, 10, 1, false, 0, Math.PI), MAT_camo);
  packTop.rotation.z = Math.PI / 2;
  packTop.position.set(0, 1.375, 0.35);
  packTop.castShadow = true;
  father.add(packTop);
  const pocketL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.22), MAT_camo);
  pocketL.position.set(-0.315, 0.95, 0.35);
  father.add(pocketL);
  const pocketR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.22), MAT_camo);
  pocketR.position.set(0.315, 0.95, 0.35);
  father.add(pocketR);
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x3a4434, roughness: 0.85 });
  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.04), strapMat);
  strapL.position.set(-0.16, 1.16, -0.27);
  strapL.rotation.x = 0.12;
  father.add(strapL);
  const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.04), strapMat);
  strapR.position.set(0.16, 1.16, -0.27);
  strapR.rotation.x = 0.12;
  father.add(strapR);

  /* Contact shadow (blob) for visual grounding — radial gradient 取代硬邊圓（落地感） */
  const csCanvas = document.createElement("canvas");
  csCanvas.width = csCanvas.height = 64;
  const csCtx = csCanvas.getContext("2d");
  const csGrad = csCtx.createRadialGradient(32, 32, 2, 32, 32, 32);
  csGrad.addColorStop(0, "rgba(0,0,0,0.38)");
  csGrad.addColorStop(0.6, "rgba(0,0,0,0.18)");
  csGrad.addColorStop(1, "rgba(0,0,0,0)");
  csCtx.fillStyle = csGrad;
  csCtx.fillRect(0, 0, 64, 64);
  const csTex = new THREE.CanvasTexture(csCanvas);
  const contactShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 16),
    new THREE.MeshBasicMaterial({ map: csTex, transparent: true, depthWrite: false })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = FATHER_BASE_Y + 0.01;
  father.add(contactShadow);
  fatherContactShadow = contactShadow;

  father.position.set(0, FATHER_BASE_Y, state.playerZ);
  scene.add(father);
}

function buildDaughter() {
  /* 精緻小女孩膚色 */
  var childSkinMat = new THREE.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.75 });

  /* Head（更高面數、更圓潤可愛） */
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), childSkinMat);
  head.position.y = 0.78;
  head.castShadow = true;
  daughter.add(head);

  /* 臉頰紅暈 */
  var blushMat = new THREE.MeshStandardMaterial({ color: 0xffaaaa, roughness: 0.9, transparent: true, opacity: 0.3 });
  var blushL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), blushMat);
  blushL.scale.set(1, 0.6, 0.3);
  blushL.position.set(-0.1, 0.74, -0.14);
  daughter.add(blushL);
  var blushR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), blushMat);
  blushR.scale.set(1, 0.6, 0.3);
  blushR.position.set(0.1, 0.74, -0.14);
  daughter.add(blushR);

  /* 大眼睛（可愛） */
  var dEyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  var dEyePupilMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.2 });
  var dEyeHighlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.1 });
  for (var dei = 0; dei < 2; dei++) {
    var dex = dei === 0 ? -0.06 : 0.06;
    var dEyeW = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), dEyeWhiteMat);
    dEyeW.scale.z = 0.5;
    dEyeW.position.set(dex, 0.78, -0.14);
    daughter.add(dEyeW);
    var dEyeP = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), dEyePupilMat);
    dEyeP.position.set(dex, 0.78, -0.16);
    daughter.add(dEyeP);
    /* 眼睛高光 */
    var dEyeH = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), dEyeHighlightMat);
    dEyeH.position.set(dex + 0.01, 0.79, -0.17);
    daughter.add(dEyeH);
  }

  /* 小嘴巴 */
  var dMouthMat = new THREE.MeshStandardMaterial({ color: 0xee8888, roughness: 0.8 });
  var dMouth = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), dMouthMat);
  dMouth.scale.set(1.5, 0.5, 0.5);
  dMouth.position.set(0, 0.71, -0.15);
  daughter.add(dMouth);

  /* 小鼻子 */
  var dNose = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), childSkinMat);
  dNose.position.set(0, 0.75, -0.16);
  daughter.add(dNose);

  /* 頭髮（更精緻的瀏海 + 馬尾） */
  const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 12), MAT.hair);
  hairTop.position.y = 0.88;
  hairTop.scale.set(1.08, 0.55, 1.08);
  daughter.add(hairTop);

  /* 瀏海 */
  var bangsMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85 });
  var bangs = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.1), bangsMat);
  bangs.position.set(0, 0.86, -0.12);
  daughter.add(bangs);

  /* 馬尾 + 髮圈 */
  const ponytail = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), MAT.hair);
  ponytail.position.set(0, 0.82, 0.16);
  ponytail.scale.set(0.6, 1.5, 0.6);
  daughter.add(ponytail);
  /* 粉紅髮圈 */
  var hairTie = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.015, 6, 12), new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.5 }));
  hairTie.position.set(0, 0.86, 0.14);
  hairTie.rotation.x = Math.PI / 2;
  daughter.add(hairTie);

  /* 粉色洋裝（更精緻） */
  var dressMat = new THREE.MeshStandardMaterial({ color: 0xffb6c1, roughness: 0.55 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.25, 6, 12), dressMat);
  body.position.y = 0.45;
  body.castShadow = true;
  daughter.add(body);
  /* 裙擺 */
  var skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 0.18, 12), dressMat);
  skirt.position.y = 0.28;
  daughter.add(skirt);
  /* 蝴蝶結裝飾 */
  var bowMat = new THREE.MeshStandardMaterial({ color: 0xff4488, roughness: 0.4 });
  var bowL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), bowMat);
  bowL.scale.set(1.5, 0.8, 0.5);
  bowL.position.set(-0.04, 0.58, -0.13);
  daughter.add(bowL);
  var bowR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), bowMat);
  bowR.scale.set(1.5, 0.8, 0.5);
  bowR.position.set(0.04, 0.58, -0.13);
  daughter.add(bowR);

  /* 手臂 */
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.28, 8), childSkinMat);
  armL.position.set(-0.2, 0.5, 0);
  armL.rotation.z = 0.2;
  daughter.add(armL);
  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.28, 8), childSkinMat);
  armR.position.set(0.2, 0.5, 0);
  armR.rotation.z = -0.2;
  daughter.add(armR);
  /* 小手掌 */
  var handMat = new THREE.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.7 });
  var handL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), handMat);
  handL.position.set(-0.23, 0.34, 0);
  daughter.add(handL);
  var handR = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), handMat);
  handR.position.set(0.23, 0.34, 0);
  daughter.add(handR);

  /* 腿 + 白色短襪 + 粉色小鞋 */
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.2, 8), childSkinMat);
  legL.position.set(-0.07, 0.2, 0);
  daughter.add(legL);
  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.2, 8), childSkinMat);
  legR.position.set(0.07, 0.2, 0);
  daughter.add(legR);
  var sockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  var sockL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8), sockMat);
  sockL.position.set(-0.07, 0.1, 0);
  daughter.add(sockL);
  var sockR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8), sockMat);
  sockR.position.set(0.07, 0.1, 0);
  daughter.add(sockR);
  var shoeDMat = new THREE.MeshStandardMaterial({ color: 0xff6699, roughness: 0.5 });
  var shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.12), shoeDMat);
  shoeL.position.set(-0.07, 0.05, -0.02);
  daughter.add(shoeL);
  var shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.12), shoeDMat);
  shoeR.position.set(0.07, 0.05, -0.02);
  daughter.add(shoeR);

  /* 粉紅小背包 */
  const dbp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.12), MAT.pinkBag);
  dbp.position.set(0, 0.45, 0.15);
  daughter.add(dbp);
  /* 背包蓋 */
  var flapMat = new THREE.MeshStandardMaterial({ color: 0xff5599, roughness: 0.5 });
  var flap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.13), flapMat);
  flap.position.set(0, 0.6, 0.15);
  daughter.add(flap);

  /* 接近時的粉紅光芒（引導玩家） */
  const beacon = new THREE.PointLight(0xff69b4, 2.5, 18);
  beacon.position.y = 1.2;
  daughter.add(beacon);

  /* Contact shadow */
  var dShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 })
  );
  dShadow.rotation.x = -Math.PI / 2;
  dShadow.position.y = 0.01;
  daughter.add(dShadow);

  daughter.position.set(1, 0, DAUGHTER_Z);
  scene.add(daughter);
}

/* ════════════════════════════════════════════════
   Enhanced NPC humanoid builder — 多樣化旅客
   ════════════════════════════════════════════════ */

/* NPC 原型定義（8 種不同類型旅客） */
var NPC_ARCHETYPES = [
  { name: "上班族", shirtColors: [0x1a2a4a, 0x2a3a5a, 0x333344], pantsColors: [0x1a1a2a, 0x2a2a3a], hairStyle: "short", hasGlasses: 0.3, hasTie: true, bagType: "briefcase", hRange: [1.65, 1.8] },
  { name: "學生", shirtColors: [0xffffff, 0xf0f0f0, 0xe8e8ff], pantsColors: [0x1a1a3a, 0x2a2a4a], hairStyle: "medium", hasGlasses: 0.15, hasTie: false, bagType: "backpack", hRange: [1.5, 1.7] },
  { name: "長輩", shirtColors: [0x8b7355, 0x7a6a55, 0x9a8a6a], pantsColors: [0x4a4a3a, 0x5a5a4a], hairStyle: "grey", hasGlasses: 0.5, hasTie: false, bagType: "none", hRange: [1.5, 1.65], hatChance: 0.4 },
  { name: "觀光客", shirtColors: [0xcc3333, 0x33aa33, 0x3366cc, 0xcc6600], pantsColors: [0x4a6a4a, 0x5a5a3a, 0x6a5a4a], hairStyle: "random", hasGlasses: 0.4, hasTie: false, bagType: "suitcase", hRange: [1.55, 1.8], hatChance: 0.5 },
  { name: "媽媽", shirtColors: [0xaa6677, 0x778899, 0x668877, 0x886677], pantsColors: [0x3a3a4a, 0x2a3a3a], hairStyle: "long", hasGlasses: 0.15, hasTie: false, bagType: "handbag", hRange: [1.5, 1.65], female: true },
  { name: "年輕女性", shirtColors: [0xff8888, 0x88aaff, 0xffcc88, 0xaa88ff, 0x88ffaa], pantsColors: [0x2a2a3a, 0x3a2a3a, 0x4a3a4a], hairStyle: "long", hasGlasses: 0.1, hasTie: false, bagType: "tote", hRange: [1.5, 1.65], female: true },
  { name: "運動男", shirtColors: [0x334455, 0x445566, 0x223344], pantsColors: [0x223344, 0x334455], hairStyle: "short", hasGlasses: 0, hasTie: false, bagType: "sportbag", hRange: [1.7, 1.85] },
  { name: "小孩", shirtColors: [0xff6633, 0x33ccff, 0xffcc33, 0x66ff66], pantsColors: [0x2a3a5a, 0x3a2a4a, 0x5a3a2a], hairStyle: "short", hasGlasses: 0, hasTie: false, bagType: "none", hRange: [0.9, 1.2], child: true },
];

function makeHumanoid(bodyColor, h, w, headSize) {
  var g = new THREE.Group();
  var scale = h / 1.7;
  var archetype = NPC_ARCHETYPES[Math.floor(Math.random() * NPC_ARCHETYPES.length)];

  var shirtColor = bodyColor || archetype.shirtColors[Math.floor(Math.random() * archetype.shirtColors.length)];
  var pantsColor = archetype.pantsColors[Math.floor(Math.random() * archetype.pantsColors.length)];
  var hairColors = archetype.hairStyle === "grey" ? [0x888888, 0x999999, 0xaaaaaa] : [0x1a1a1a, 0x3a2a1a, 0x2a1a0a, 0x5a3a2a, 0x1a0a0a, 0x4a3a2a];
  var shoeColors = [0x1a1a1a, 0x2a2a2a, 0x3a2a1a, 0xf0f0f0, 0x555555, 0x8B4513];

  var shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65 });
  var pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.65 });
  var hairMat  = new THREE.MeshStandardMaterial({ color: hairColors[Math.floor(Math.random() * hairColors.length)], roughness: 0.85 });
  var shoeMat  = new THREE.MeshStandardMaterial({ color: shoeColors[Math.floor(Math.random() * shoeColors.length)], roughness: 0.7 });
  var skinTone = archetype.female ? 0xf0c8a0 : 0xdeb887;
  var npcSkinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.75 });

  /* 頭 */
  var headMesh = new THREE.Mesh(new THREE.SphereGeometry(headSize, 12, 12), npcSkinMat);
  headMesh.position.y = h * 0.82;
  headMesh.castShadow = true;
  g.add(headMesh);

  /* 頭髮（依類型變化） */
  if (archetype.hairStyle === "long" || archetype.female) {
    var hairTop2 = new THREE.Mesh(new THREE.SphereGeometry(headSize * 0.9, 8, 8), hairMat);
    hairTop2.position.y = h * 0.82 + headSize * 0.45;
    hairTop2.scale.set(1.1, 0.55, 1.1);
    g.add(hairTop2);
    var hairBack = new THREE.Mesh(new THREE.SphereGeometry(headSize * 0.7, 8, 8), hairMat);
    hairBack.position.set(0, h * 0.75, headSize * 0.5);
    hairBack.scale.set(0.7, 1.3, 0.5);
    g.add(hairBack);
  } else {
    var hairMesh2 = new THREE.Mesh(new THREE.SphereGeometry(headSize * 0.85, 8, 8), hairMat);
    hairMesh2.position.y = h * 0.82 + headSize * 0.5;
    hairMesh2.scale.set(1.05, 0.45, 1.05);
    g.add(hairMesh2);
  }

  /* 帽子（觀光客/長輩有機會戴） */
  if (archetype.hatChance && Math.random() < archetype.hatChance) {
    var hatColors = [0x8b4513, 0x2c3e50, 0xcc6622, 0x556b2f, 0xf5f5dc];
    var hatMat2 = new THREE.MeshStandardMaterial({ color: hatColors[Math.floor(Math.random() * hatColors.length)], roughness: 0.6 });
    var hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(headSize * 1.4, headSize * 1.4, 0.03, 12), hatMat2);
    hatBrim.position.y = h * 0.82 + headSize * 0.9;
    g.add(hatBrim);
    var hatTop = new THREE.Mesh(new THREE.CylinderGeometry(headSize * 0.7, headSize * 0.9, headSize * 0.5, 12), hatMat2);
    hatTop.position.y = h * 0.82 + headSize * 1.1;
    g.add(hatTop);
  }

  /* 眼鏡 */
  if (Math.random() < (archetype.hasGlasses || 0)) {
    var npcGlassesMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
    var npcGlassL = new THREE.Mesh(new THREE.TorusGeometry(headSize * 0.3, 0.008, 6, 10), npcGlassesMat);
    npcGlassL.position.set(-headSize * 0.4, h * 0.82, -(headSize + 0.01));
    g.add(npcGlassL);
    var npcGlassR = new THREE.Mesh(new THREE.TorusGeometry(headSize * 0.3, 0.008, 6, 10), npcGlassesMat);
    npcGlassR.position.set(headSize * 0.4, h * 0.82, -(headSize + 0.01));
    g.add(npcGlassR);
  }

  /* 軀幹 */
  var torsoH = h * 0.3;
  var torsoMesh = new THREE.Mesh(new THREE.CapsuleGeometry(w * 0.5, torsoH, 4, 10), shirtMat);
  torsoMesh.position.y = h * 0.52;
  torsoMesh.castShadow = true;
  g.add(torsoMesh);

  /* 領帶（上班族） */
  if (archetype.hasTie && Math.random() < 0.6) {
    var tieColors = [0xcc2222, 0x2222cc, 0x882288, 0x228888];
    var tieMat = new THREE.MeshStandardMaterial({ color: tieColors[Math.floor(Math.random() * tieColors.length)], roughness: 0.5 });
    var tie = new THREE.Mesh(new THREE.BoxGeometry(0.04, torsoH * 0.8, 0.02), tieMat);
    tie.position.set(0, h * 0.52, -(w * 0.5 + 0.01));
    g.add(tie);
  }

  /* 手臂 */
  var armLen = h * 0.25;
  var npcLeftArm = new THREE.Group();
  var armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.035 * scale, armLen, 8), shirtMat);
  armLMesh.position.y = -armLen * 0.4;
  npcLeftArm.add(armLMesh);
  /* 手掌 */
  var npcHandL = new THREE.Mesh(new THREE.SphereGeometry(0.025 * scale, 6, 6), npcSkinMat);
  npcHandL.position.y = -armLen * 0.85;
  npcLeftArm.add(npcHandL);
  npcLeftArm.position.set(-(w * 0.5 + 0.06), h * 0.62, 0);
  npcLeftArm.rotation.z = 0.12;
  g.add(npcLeftArm);
  g.userData.leftArm = npcLeftArm;

  var npcRightArm = new THREE.Group();
  var armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.035 * scale, armLen, 8), shirtMat);
  armRMesh.position.y = -armLen * 0.4;
  npcRightArm.add(armRMesh);
  var npcHandR = new THREE.Mesh(new THREE.SphereGeometry(0.025 * scale, 6, 6), npcSkinMat);
  npcHandR.position.y = -armLen * 0.85;
  npcRightArm.add(npcHandR);
  npcRightArm.position.set(w * 0.5 + 0.06, h * 0.62, 0);
  npcRightArm.rotation.z = -0.12;
  g.add(npcRightArm);
  g.userData.rightArm = npcRightArm;

  /* 腿 */
  var legLen = h * 0.22;
  var npcLeftLeg = new THREE.Group();
  var legLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055 * scale, 0.045 * scale, legLen, 8), pantsMat);
  legLMesh.position.y = -legLen * 0.4;
  npcLeftLeg.add(legLMesh);
  var shoeLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.06 * scale, 0.16 * scale), shoeMat);
  shoeLMesh.position.set(0, -legLen * 0.85, -0.02);
  npcLeftLeg.add(shoeLMesh);
  npcLeftLeg.position.set(-w * 0.22, h * 0.24, 0);
  g.add(npcLeftLeg);
  g.userData.leftLeg = npcLeftLeg;

  var npcRightLeg = new THREE.Group();
  var legRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055 * scale, 0.045 * scale, legLen, 8), pantsMat);
  legRMesh.position.y = -legLen * 0.4;
  npcRightLeg.add(legRMesh);
  var shoeRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.06 * scale, 0.16 * scale), shoeMat);
  shoeRMesh.position.set(0, -legLen * 0.85, -0.02);
  npcRightLeg.add(shoeRMesh);
  npcRightLeg.position.set(w * 0.22, h * 0.24, 0);
  g.add(npcRightLeg);
  g.userData.rightLeg = npcRightLeg;

  /* 行李/包包（依類型變化） */
  var bagType = archetype.bagType;
  if (bagType === "briefcase") {
    var briefMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 });
    var brief = new THREE.Mesh(new THREE.BoxGeometry(0.25 * scale, 0.18 * scale, 0.06 * scale), briefMat);
    brief.position.set((Math.random() > 0.5 ? 1 : -1) * (w * 0.5 + 0.15), h * 0.3, 0);
    g.add(brief);
  } else if (bagType === "backpack") {
    var bpColors = [0x2a5a2a, 0x2a2a5a, 0x5a2a2a, 0x3a3a3a, 0xcc6622];
    var bpMat = new THREE.MeshStandardMaterial({ color: bpColors[Math.floor(Math.random() * bpColors.length)], roughness: 0.7 });
    var bp = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.3 * scale, 0.12 * scale), bpMat);
    bp.position.set(0, h * 0.5, w * 0.5 + 0.06);
    g.add(bp);
  } else if (bagType === "suitcase") {
    var scColors = [0x8b4513, 0x2a2a5a, 0x5a2a2a, 0x1a4a1a];
    var scMat = new THREE.MeshStandardMaterial({ color: scColors[Math.floor(Math.random() * scColors.length)], roughness: 0.6 });
    var sc = new THREE.Mesh(new THREE.BoxGeometry(0.25 * scale, 0.35 * scale, 0.12 * scale), scMat);
    sc.position.set((Math.random() > 0.5 ? 1 : -1) * (w * 0.5 + 0.18), h * 0.18, 0);
    g.add(sc);
    /* 行李箱輪子 */
    var scWheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 6), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    scWheel1.rotation.z = Math.PI / 2;
    scWheel1.position.set(sc.position.x - 0.08, 0.02, 0);
    g.add(scWheel1);
    var scWheel2 = scWheel1.clone();
    scWheel2.position.set(sc.position.x + 0.08, 0.02, 0);
    g.add(scWheel2);
  } else if (bagType === "handbag" && Math.random() < 0.7) {
    var hbMat = new THREE.MeshStandardMaterial({ color: [0x8b4513, 0xaa3333, 0x2a2a5a][Math.floor(Math.random() * 3)], roughness: 0.5 });
    var hb = new THREE.Mesh(new THREE.BoxGeometry(0.15 * scale, 0.12 * scale, 0.06 * scale), hbMat);
    hb.position.set((Math.random() > 0.5 ? 1 : -1) * (w * 0.5 + 0.12), h * 0.38, 0);
    g.add(hb);
  } else if (bagType === "tote" && Math.random() < 0.6) {
    var toteMat = new THREE.MeshStandardMaterial({ color: [0xcc9966, 0xf5f5dc, 0x88aacc][Math.floor(Math.random() * 3)], roughness: 0.6 });
    var tote = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.22 * scale, 0.04 * scale), toteMat);
    tote.position.set((Math.random() > 0.5 ? 1 : -1) * (w * 0.5 + 0.12), h * 0.35, 0);
    g.add(tote);
  } else if (bagType === "sportbag" && Math.random() < 0.5) {
    var sbMat = new THREE.MeshStandardMaterial({ color: [0x1a1a1a, 0x2a3a5a][Math.floor(Math.random() * 2)], roughness: 0.6 });
    var sb = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3 * scale, 8), sbMat);
    sb.rotation.z = Math.PI / 2;
    sb.position.set((Math.random() > 0.5 ? 1 : -1) * (w * 0.5 + 0.12), h * 0.35, 0);
    g.add(sb);
  }

  /* Contact shadow */
  var npcShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.25 * scale, 8),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 })
  );
  npcShadow.rotation.x = -Math.PI / 2;
  npcShadow.position.y = 0.01;
  g.add(npcShadow);

  g.userData.archetype = archetype.name;
  return g;
}

function getCurrentNpcCount() {
  return QUALITY_PRESETS[state.quality].npcCount;
}

function buildCharacters() {
  buildFather();
  buildDaughter();

  const mBody = makeHumanoid(0x6b4c3b, 1.6, 0.4, 0.2);
  mother.add(mBody);
  mother.position.set(2.5, 0, DAUGHTER_Z + 0.5);
  scene.add(mother);

  spawnNPCs(getCurrentNpcCount());
}

function spawnNPCs(count) {
  const npcColors = [0x555555, 0x666677, 0x776655, 0x557766, 0x886655, 0x556688, 0x778855, 0x887766];
  for (let i = 0; i < count; i++) {
    const h = 1.4 + Math.random() * 0.5;
    const c = npcColors[Math.floor(Math.random() * npcColors.length)];
    const npc = makeHumanoid(c, h, 0.3 + Math.random() * 0.15, 0.15 + Math.random() * 0.05);
    const z = (Math.random() - 0.5) * (PLATFORM_LEN - 40);
    const x = (Math.random() - 0.5) * (PLATFORM_W - 3);
    npc.position.set(x, 0, z);
    npc.userData.baseX = x;
    npc.userData.baseZ = z;
    npc.userData.wobblePhase = Math.random() * Math.PI * 2;
    npc.userData.wobbleSpeed = 0.3 + Math.random() * 0.5;
    scene.add(npc);
    npcs.push(npc);
  }
}

function clearNPCs() {
  for (const npc of npcs) {
    scene.remove(npc);
    npc.traverse(function(child) {
      if (child.geometry) child.geometry.dispose();
      if (child.material && child.material.dispose) child.material.dispose();
    });
  }
  npcs = [];
}

function rebuildNPCs(count) {
  clearNPCs();
  spawnNPCs(count);
}

/* ════════════════════════════════════════════════
   行李障礙物系統 + 路障牆
   ════════════════════════════════════════════════ */
const luggageItems = [];
const barrierWalls = [];
/* #9 障礙敘事化：第一道行李牆教玩家跳；之後每道＝把拔人生跨過的一道坎（EP30/19/18/25，皆原著） */
let barrierNarrIdx = 0;
const BARRIER_NARRATIVES = [
  "13 歲那年，他連外套上繡的名字都要反過來藏。這道坎，他跳過了。",
  "兩棲蛙人的魔鬼操練，3000 公尺跑到吐。這道坎，他也跳過了。",
  "2023 年那場倒車的意外。撞上了，他還是爬起來，繼續往前。",
  "斷聯的那些年，圍爐裡最安靜的那個位子。他沒有停下來。",
  "每一道行李，都是他用力跨過去的一段人生。為了趕上妳。",
];

function isNearNPCOrLuggage(x, z) {
  for (const npc of npcs) {
    const dx = x - npc.userData.baseX;
    const dz = z - npc.userData.baseZ;
    if (Math.sqrt(dx * dx + dz * dz) < NPC_SAFE_DISTANCE) return true;
  }
  for (const lg of luggageItems) {
    const dx = x - lg.position.x;
    const dz = z - lg.position.z;
    if (Math.sqrt(dx * dx + dz * dz) < 2) return true;
  }
  return false;
}

function createWarningSign(z) {
  const group = new THREE.Group();

  /* Pole */
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.5, 6), MAT_warningPole);
  pole.position.y = 1.25;
  group.add(pole);

  /* Triangle warning sign */
  const triShape = new THREE.Shape();
  triShape.moveTo(0, 0.35);
  triShape.lineTo(-0.3, -0.15);
  triShape.lineTo(0.3, -0.15);
  triShape.closePath();
  const triGeo = new THREE.ShapeGeometry(triShape);
  const triMesh = new THREE.Mesh(triGeo, MAT_warning);
  triMesh.position.set(0, 2.5, 0);
  group.add(triMesh);
  /* Back face */
  const triBack = new THREE.Mesh(triGeo, MAT_warning);
  triBack.position.set(0, 2.5, 0);
  triBack.rotation.y = Math.PI;
  group.add(triBack);

  /* Glow light */
  const glow = new THREE.PointLight(0xffdd00, 1.5, 8);
  glow.position.y = 2.6;
  group.add(glow);

  group.position.set(0, 0, z);
  scene.add(group);
  return group;
}

function spawnBarrierWall(z) {
  const barrier = { meshes: [], signGroup: null, z: z, xMin: -3, xMax: 3 };
  const luggageColors = [0x8b4513, 0x2a2a2a, 0x666666, 0x1a2a4a, 0x4a3728, 0x3a3a3a];
  const numCases = 4;
  const spacing = 6 / numCases;

  for (let i = 0; i < numCases; i++) {
    const px = -3 + spacing * i + spacing * 0.5 + (Math.random() - 0.5) * 0.3;
    const w = 0.7 + Math.random() * 0.2;
    const h = 0.4 + Math.random() * 0.1;
    const d = 0.5 + Math.random() * 0.1;
    const color = luggageColors[Math.floor(Math.random() * luggageColors.length)];
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(px, h / 2, z + (Math.random() - 0.5) * 0.3);
    mesh.rotation.y = Math.random() * 0.3 - 0.15;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const handleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), handleMat);
    handle.position.y = h / 2 + 0.02;
    mesh.add(handle);

    scene.add(mesh);
    barrier.meshes.push(mesh);
  }

  barrier.signGroup = createWarningSign(z - 8);
  barrierWalls.push(barrier);
}

function spawnLuggage() {
  const luggageColors = [0x8b4513, 0x2a2a2a, 0x666666, 0x1a2a4a, 0x4a3728, 0x3a3a3a];
  const zStart = PLATFORM_LEN / 2 - 25;
  const zEnd = DAUGHTER_Z + 15;
  const totalRunDist = zStart - zEnd;

  /* Level-based barrier count: 2 base + (level-1) extra */
  var barrierCount = 2 + (state.currentLevel - 1);
  for (var bi = 0; bi < barrierCount; bi++) {
    var barrierZ = zStart - totalRunDist * ((bi + 1) / (barrierCount + 1));
    spawnBarrierWall(barrierZ);
  }

  /* Spawn scattered individual luggage (avoiding barrier zones) */
  for (let i = 0; i < LUGGAGE_COUNT; i++) {
    const segLen = (zStart - zEnd) / LUGGAGE_COUNT;
    const zMin = zStart - (i + 1) * segLen;
    const zMax = zStart - i * segLen;

    let px, pz, found = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      px = (Math.random() - 0.5) * (PLATFORM_W - 4);
      pz = zMin + Math.random() * (zMax - zMin);
      /* Avoid barrier zones */
      let nearBarrier = false;
      for (const bw of barrierWalls) {
        if (Math.abs(pz - bw.z) < 4) { nearBarrier = true; break; }
      }
      if (!nearBarrier && !isNearNPCOrLuggage(px, pz)) { found = true; break; }
    }
    if (!found) {
      px = (Math.random() - 0.5) * 3;
      pz = zMin + Math.random() * (zMax - zMin);
    }

    const w = 0.5 + Math.random() * 0.2;
    const h = 0.3 + Math.random() * 0.1;
    const d = 0.35 + Math.random() * 0.1;
    const color = luggageColors[Math.floor(Math.random() * luggageColors.length)];
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(px, h / 2, pz);
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), handleMat);
    handle.position.y = h / 2 + 0.02;
    mesh.add(handle);

    scene.add(mesh);
    luggageItems.push(mesh);
  }
}

function resetLuggage() {
  for (const lg of luggageItems) {
    scene.remove(lg);
    lg.traverse(function(child) {
      if (child.geometry) child.geometry.dispose();
      if (child.material && child.material.dispose) child.material.dispose();
    });
  }
  luggageItems.length = 0;

  for (const bw of barrierWalls) {
    for (const m of bw.meshes) {
      scene.remove(m);
      m.traverse(function(child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material && child.material.dispose) child.material.dispose();
      });
    }
    if (bw.signGroup) {
      scene.remove(bw.signGroup);
      bw.signGroup.traverse(function(child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material && child.material.dispose) child.material.dispose();
      });
    }
  }
  barrierWalls.length = 0;

  spawnLuggage();
}

function checkLuggageCollisions() {
  if (state.luggageSlowTimer > 0) return;
  for (const lg of luggageItems) {
    const dx = father.position.x - lg.position.x;
    const dz = father.position.z - lg.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < LUGGAGE_COLLISION_RADIUS) {
      if (state.jumpY > LUGGAGE_CLEAR_HEIGHT) continue;
      state.luggageSlowTimer = 0.5;
      state.cameraShake = 4;
      playCollisionBump(); ptVibe(40);
      showPickupNotify("\u884C\u674E\u7D46\u5012\uFF01\u6E1B\u901F\u4E2D...");
    }
  }
}

/* 手機觸覺共用 helper（iOS no-op；reduced-motion 自動略過） */
function ptVibe(p) { try { if (navigator.vibrate && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) navigator.vibrate(p); } catch (e) {} }

function checkBarrierCollisions() {
  for (const bw of barrierWalls) {
    const dz = father.position.z - bw.z;
    /* Only block when approaching from the running direction (positive z going negative) */
    if (dz > -1.5 && dz < 1.5) {
      if (father.position.x >= bw.xMin - 0.5 && father.position.x <= bw.xMax + 0.5) {
        if (state.jumpY <= BARRIER_CLEAR_HEIGHT) {
          /* STOP: clamp position to not pass through */
          if (dz > 0) {
            father.position.z = bw.z + 1.5;
          } else {
            father.position.z = bw.z - 1.5;
          }
          if (state.luggageSlowTimer <= 0) {
            state.luggageSlowTimer = 0.3;
            state.cameraShake = 5;
            playBarrierHit(); ptVibe([60, 30, 60]);
            showPickupNotify("\u88AB\u884C\u674E\u64CB\u4F4F\u4E86\uFF01\u8DF3\u904E\u53BB\uFF01");
          }
        }
      }
    }

    /* #9 \u969C\u7919\u6558\u4E8B\u5316\uFF1A\u7B2C\u4E00\u9053\u6559\u5B78\u300C\u8DF3\u904E\u53BB\u300D\uFF0C\u4E4B\u5F8C\u6BCF\u9053\uFF1D\u628A\u62D4\u8DE8\u904E\u7684\u4E00\u9053\u4EBA\u751F\u7684\u574E\uFF08\u5404 barrier \u53EA\u6558\u4E8B\u4E00\u6B21\uFF09 */
    if (!bw.narrated) {
      const approachDist = father.position.z - bw.z;
      if (approachDist > 0 && approachDist < 18) {
        bw.narrated = true;
        if (!state.barrierHintShown) {
          state.barrierHintShown = true;
          showNarrative("\u524D\u65B9\u6709\u884C\u674E\uFF01\u8DF3\u904E\u53BB\uFF01", 2.5);
        } else {
          showNarrative(BARRIER_NARRATIVES[barrierNarrIdx % BARRIER_NARRATIVES.length], 2.6);
          barrierNarrIdx++;
        }
      }
    }
  }

  /* Animate warning signs */
  for (const bw of barrierWalls) {
    if (bw.signGroup) {
      const glow = bw.signGroup.children.find(function(c) { return c.isLight; });
      if (glow) {
        glow.intensity = 1.2 + Math.sin(state.clock * 5) * 0.8;
      }
    }
  }
}

/* ════════════════════════════════════════════════
   道具系統（御飯糰 + 特大熱美式）
   ════════════════════════════════════════════════ */
const powerups = [];
const RICEBALL_COUNT = 6;
const COFFEE_COUNT = 4;

function isNearNPC(x, z) {
  for (const npc of npcs) {
    const dx = x - npc.userData.baseX;
    const dz = z - npc.userData.baseZ;
    if (Math.sqrt(dx * dx + dz * dz) < NPC_SAFE_DISTANCE) return true;
  }
  return false;
}

function findSafePosition(zMin, zMax) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const x = (Math.random() - 0.5) * (PLATFORM_W - 4);
    const z = zMin + Math.random() * (zMax - zMin);
    if (!isNearNPC(x, z)) return { x: x, z: z };
  }
  return { x: (Math.random() - 0.5) * 3, z: zMin + Math.random() * (zMax - zMin) };
}

function createRiceBall(x, z) {
  const group = new THREE.Group();
  const rice = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.35, 3),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.6 })
  );
  rice.rotation.y = Math.PI / 6;
  group.add(rice);

  const nori = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.12, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.9 })
  );
  nori.position.y = -0.1;
  group.add(nori);

  /* 自體發光（emissive 不影響場景光源數量，不觸發 shader 重編譯） */
  rice.material.emissive = new THREE.Color(0xffd700);
  rice.material.emissiveIntensity = 0.3;
  nori.material.emissive = new THREE.Color(0xffd700);
  nori.material.emissiveIntensity = 0.15;

  group.position.set(x, 0.8, z);
  group.userData = { type: "riceball", collected: false, baseY: 0.8 };
  scene.add(group);
  powerups.push(group);
  return group;
}

function createCoffee(x, z) {
  const group = new THREE.Group();
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.08, 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.5 })
  );
  group.add(cup);

  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.04, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a1a0a, roughness: 0.7 })
  );
  coffee.position.y = 0.16;
  group.add(coffee);

  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.1, 0.04, 8),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 })
  );
  lid.position.y = 0.19;
  group.add(lid);

  /* 自體發光（emissive 不影響場景光源數量，不觸發 shader 重編譯） */
  cup.material.emissive = new THREE.Color(0x3498db);
  cup.material.emissiveIntensity = 0.3;
  lid.material.emissive = new THREE.Color(0x3498db);
  lid.material.emissiveIntensity = 0.2;

  group.position.set(x, 0.8, z);
  group.userData = { type: "coffee", collected: false, baseY: 0.8 };
  scene.add(group);
  powerups.push(group);
  return group;
}

function spawnPowerups() {
  const zStart = PLATFORM_LEN / 2 - 20;
  const zEnd = DAUGHTER_Z + 10;

  for (let i = 0; i < RICEBALL_COUNT; i++) {
    const segLen = (zStart - zEnd) / RICEBALL_COUNT;
    const zMin = zStart - (i + 1) * segLen;
    const zMax = zStart - i * segLen;
    const pos = findSafePosition(zMin, zMax);
    createRiceBall(pos.x, pos.z);
  }

  for (let i = 0; i < COFFEE_COUNT; i++) {
    const segLen = (zStart - zEnd) / COFFEE_COUNT;
    const zMin = zStart - (i + 1) * segLen;
    const zMax = zStart - i * segLen;
    const pos = findSafePosition(zMin, zMax);
    createCoffee(pos.x, pos.z);
  }
}

function resetPowerups() {
  for (const p of powerups) {
    scene.remove(p);
    p.traverse(function(child) {
      if (child.geometry) child.geometry.dispose();
      if (child.material && child.material.dispose) child.material.dispose();
    });
  }
  powerups.length = 0;
  spawnPowerups();
}

function updatePowerups(dt) {
  for (const p of powerups) {
    if (p.userData.collected) continue;
    p.rotation.y += dt * 1.5;
    p.position.y = p.userData.baseY + Math.sin(state.clock * 3 + p.position.z) * 0.1;

    const dx = father.position.x - p.position.x;
    const dz = father.position.z - p.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < POWERUP_COLLECT_RADIUS) {
      p.userData.collected = true;
      scene.remove(p);
      playPickupDing();

      state.itemsCollected++;
      if (p.userData.type === "riceball") {
        state.riceBallTimer = 3;
        showPickupNotify("+\u5FA1\u98EF\u7CF0\uFF1A\u885D\u523A\u5EF6\u9577\uFF01");
      } else if (p.userData.type === "coffee") {
        state.coffeeTimer = 3;
        showPickupNotify("+\u7279\u5927\u71B1\u7F8E\u5F0F\uFF1A\u901F\u5EA6\u52A0\u500D\uFF01");
      }
    }
  }

  if (state.riceBallTimer > 0) state.riceBallTimer = Math.max(0, state.riceBallTimer - dt);
  if (state.coffeeTimer > 0) state.coffeeTimer = Math.max(0, state.coffeeTimer - dt);
  if (state.collisionSlowTimer > 0) state.collisionSlowTimer = Math.max(0, state.collisionSlowTimer - dt);
  if (state.ultimateTimer > 0) state.ultimateTimer = Math.max(0, state.ultimateTimer - dt);
  if (state.luggageSlowTimer > 0) state.luggageSlowTimer = Math.max(0, state.luggageSlowTimer - dt);
  if (state.guardSlowTimer > 0) state.guardSlowTimer = Math.max(0, state.guardSlowTimer - dt);

  if (state.pickupNotifyTimer > 0) {
    state.pickupNotifyTimer -= dt;
    if (state.pickupNotifyTimer <= 0) {
      dom.pickupNotify.classList.remove("show");
    }
  }
}

function showPickupNotify(text) {
  dom.pickupNotify.textContent = text;
  dom.pickupNotify.classList.add("show");
  state.pickupNotifyTimer = 2;
}

/* ════════════════════════════════════════════════
   必殺技：「我也會想妳的」— 時空特效版
   ════════════════════════════════════════════════ */
let fatherGlowLight = null;
var ultimateParticles = [];
var ultimateShockwave = null;
var ultimateTrailTimer = 0;
var ultimateScreenPhase = 0;

function activateUltimate() {
  if (state.ultimateCharges <= 0) return;
  if (state.phase !== "running" && state.phase !== "sprint2") return;

  state.ultimateCharges--;
  state.ultimateTimer = 5;
  updateUltimateUI();
  ultimateScreenPhase = 0;

  /* === Sound === */
  playUltimateActivation();

  /* === Father glow light (enhanced) === */
  fatherGlowLight = new THREE.PointLight(0xffd700, 5, 12);
  fatherGlowLight.position.y = 1;
  father.add(fatherGlowLight);

  showNarrative("「把拔，我會想你的。」", 3);

  /* === Screen effect phase 1: Full white flash (0-0.3s) === */
  dom.goldFlash.style.transition = "opacity 0.05s";
  dom.goldFlash.style.background = "radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,215,0,0.6) 40%, transparent 80%)";
  dom.goldFlash.style.opacity = "1";
  document.body.style.filter = "brightness(2) saturate(2)";

  safeSetTimeout(function() {
    /* Phase 2: Gold ripple (0.3-0.8s) */
    dom.goldFlash.style.transition = "opacity 0.5s";
    dom.goldFlash.style.background = "radial-gradient(ellipse at center, rgba(255,215,0,0.7) 0%, rgba(255,180,0,0.3) 50%, transparent 80%)";
    dom.goldFlash.style.opacity = "0.8";
    document.body.style.filter = "brightness(1.3) saturate(1.5)";
  }, 300);

  safeSetTimeout(function() {
    /* Phase 3: Subtle golden hue (0.8-5s) */
    dom.goldFlash.style.transition = "opacity 0.8s";
    dom.goldFlash.style.background = "radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 70%)";
    dom.goldFlash.style.opacity = "0.6";
    document.body.style.filter = "brightness(1.08) saturate(1.15) hue-rotate(-5deg)";
    ultimateScreenPhase = 1;
  }, 800);

  /* === Shockwave ring === */
  var ringGeo = new THREE.RingGeometry(0.3, 0.6, 32);
  var ringMat = new THREE.MeshBasicMaterial({
    color: 0xffd700, transparent: true, opacity: 0.9, side: THREE.DoubleSide
  });
  ultimateShockwave = new THREE.Mesh(ringGeo, ringMat);
  ultimateShockwave.rotation.x = -Math.PI / 2;
  ultimateShockwave.position.copy(father.position);
  ultimateShockwave.position.y = 0.1;
  ultimateShockwave.userData.age = 0;
  scene.add(ultimateShockwave);

  /* === Particle burst (50 particles) === */
  for (var p = 0; p < 50; p++) {
    var size = 0.04 + Math.random() * 0.06;
    var pGeo = new THREE.SphereGeometry(size, 6, 6);
    var isWhite = Math.random() > 0.5;
    var pMat = new THREE.MeshBasicMaterial({
      color: isWhite ? 0xffffff : 0xffd700,
      transparent: true, opacity: 1
    });
    var pMesh = new THREE.Mesh(pGeo, pMat);
    pMesh.position.copy(father.position);
    pMesh.position.y += 0.8 + Math.random() * 0.4;
    var angle = Math.random() * Math.PI * 2;
    var speed = 2 + Math.random() * 5;
    var upSpeed = 1 + Math.random() * 4;
    pMesh.userData.vx = Math.cos(angle) * speed;
    pMesh.userData.vy = upSpeed;
    pMesh.userData.vz = Math.sin(angle) * speed;
    pMesh.userData.age = 0;
    pMesh.userData.maxAge = 1.5 + Math.random() * 0.8;
    scene.add(pMesh);
    ultimateParticles.push(pMesh);
  }

  /* === Cleanup after 5s === */
  safeSetTimeout(function() {
    if (fatherGlowLight && fatherGlowLight.parent) {
      father.remove(fatherGlowLight);
      fatherGlowLight = null;
    }
    /* Reset screen effects */
    dom.goldFlash.style.transition = "opacity 0.8s";
    dom.goldFlash.style.opacity = "0";
    dom.goldFlash.style.background = "radial-gradient(ellipse at center,rgba(255,215,0,0.5) 0%,transparent 70%)";
    document.body.style.filter = "";
    ultimateScreenPhase = 0;
    /* Clean remaining particles */
    for (var i = ultimateParticles.length - 1; i >= 0; i--) {
      if (ultimateParticles[i].parent) scene.remove(ultimateParticles[i]);
      ultimateParticles[i].geometry.dispose();
      ultimateParticles[i].material.dispose();
    }
    ultimateParticles = [];
    /* Clean shockwave */
    if (ultimateShockwave && ultimateShockwave.parent) {
      scene.remove(ultimateShockwave);
      ultimateShockwave.geometry.dispose();
      ultimateShockwave.material.dispose();
      ultimateShockwave = null;
    }
  }, 5000);
}

/* Update ultimate particles — called each frame from game loop */
function updateUltimateEffects(dt) {
  /* Shockwave expansion */
  if (ultimateShockwave && ultimateShockwave.parent) {
    ultimateShockwave.userData.age += dt;
    var swAge = ultimateShockwave.userData.age;
    var swScale = 1 + swAge * 10;
    ultimateShockwave.scale.set(swScale, swScale, 1);
    ultimateShockwave.material.opacity = Math.max(0, 0.9 - swAge / 1.5);
    if (swAge > 1.5) {
      scene.remove(ultimateShockwave);
      ultimateShockwave.geometry.dispose();
      ultimateShockwave.material.dispose();
      ultimateShockwave = null;
    }
  }

  /* Burst particles */
  for (var i = ultimateParticles.length - 1; i >= 0; i--) {
    var pt = ultimateParticles[i];
    pt.userData.age += dt;
    if (pt.userData.age > pt.userData.maxAge) {
      if (pt.parent) scene.remove(pt);
      pt.geometry.dispose();
      pt.material.dispose();
      ultimateParticles.splice(i, 1);
      continue;
    }
    pt.position.x += pt.userData.vx * dt;
    pt.position.y += pt.userData.vy * dt;
    pt.position.z += pt.userData.vz * dt;
    pt.userData.vy -= 3 * dt;
    var life = 1 - pt.userData.age / pt.userData.maxAge;
    pt.material.opacity = life;
    pt.scale.setScalar(life);
  }

  /* Golden particle trail behind father during ultimate */
  if (state.ultimateTimer > 0) {
    ultimateTrailTimer -= dt;
    if (ultimateTrailTimer <= 0) {
      ultimateTrailTimer = 0.05;
      var tSize = 0.02 + Math.random() * 0.03;
      var tGeo = new THREE.SphereGeometry(tSize, 4, 4);
      var tMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.3 ? 0xffd700 : 0xffffff,
        transparent: true, opacity: 0.8
      });
      var trail = new THREE.Mesh(tGeo, tMat);
      trail.position.copy(father.position);
      trail.position.x += (Math.random() - 0.5) * 0.4;
      trail.position.y += 0.3 + Math.random() * 0.8;
      trail.position.z += 0.3 + Math.random() * 0.3;
      trail.userData.vx = (Math.random() - 0.5) * 0.5;
      trail.userData.vy = 0.5 + Math.random() * 1.0;
      trail.userData.vz = 0;
      trail.userData.age = 0;
      trail.userData.maxAge = 0.6 + Math.random() * 0.4;
      scene.add(trail);
      ultimateParticles.push(trail);
    }
  }
}

/* ════════════════════════════════════════════════
   車門目標標記
   ════════════════════════════════════════════════ */
let doorMarker = null;

function createDoorMarker() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.08, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.8, transparent: true, opacity: 0.8 })
  );
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 0.6, 4),
    new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.6 })
  );
  arrow.position.y = 1.5;
  group.add(arrow);

  const glow = new THREE.PointLight(0x00ff88, 2, 10);
  glow.position.y = 1;
  group.add(glow);

  group.visible = false;
  scene.add(group);
  doorMarker = group;
}

function updateDoorMarker() {
  if (!doorMarker) return;
  if (state.gotDaughter && state.phase === "sprint2") {
    doorMarker.visible = true;
    let nearestDoor = null;
    let nearestDist = Infinity;
    for (const d of northDoors) {
      const doorWorldZ = trainNorth.position.z + d.z;
      const dz = Math.abs(father.position.z - doorWorldZ);
      if (dz < nearestDist) {
        nearestDist = dz;
        nearestDoor = d;
      }
    }
    if (nearestDoor) {
      const doorWorldZ = trainNorth.position.z + nearestDoor.z;
      const markerX = PLATFORM_W / 2 - 1;
      doorMarker.position.set(markerX, 0.1, doorWorldZ);
      doorMarker.children[1].position.y = 1.5 + Math.sin(state.clock * 4) * 0.3;
      doorMarker.children[1].rotation.y = state.clock * 2;
    }
  } else {
    doorMarker.visible = false;
  }
}

/* ════════════════════════════════════════════════
   音效系統（程序化生成）
   ════════════════════════════════════════════════ */
let audioCtx = null;
let nextBeat = 0;

function initAudio() {
  if (audioCtx) { if (audioCtx.state === "suspended" && audioCtx.resume) audioCtx.resume(); return; }   // 已建立但被 iOS 背景化重新 suspend → 在下次手勢叫 initAudio 時 resume,SFX 不會整局靜音(對齊 cold-open.js / platform-acts.js)
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended" && audioCtx.resume) audioCtx.resume();
}

function playHeartbeat() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  if (now < nextBeat) return;
  const interval = 60 / state.heartRate;
  nextBeat = now + interval;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(55, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.3);

  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(50, now + 0.12);
  osc2.frequency.exponentialRampToValueAtTime(30, now + 0.27);
  gain2.gain.setValueAtTime(0.2, now + 0.12);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.4);
}

function playFootstep() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.015));
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.08;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  src.start(now);
}

function playSprintFootstep() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  var buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.03), audioCtx.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.006));
  var src = audioCtx.createBufferSource();
  src.buffer = buf;
  var gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
  var filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  filter.Q.value = 2;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  src.start(now);
  /* Add a sharp click layer for urgency */
  var clickOsc = audioCtx.createOscillator();
  clickOsc.type = "square";
  clickOsc.frequency.setValueAtTime(3000, now);
  clickOsc.frequency.exponentialRampToValueAtTime(1500, now + 0.015);
  var clickGain = audioCtx.createGain();
  clickGain.gain.setValueAtTime(0.05, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
  clickOsc.connect(clickGain);
  clickGain.connect(audioCtx.destination);
  clickOsc.start(now);
  clickOsc.stop(now + 0.025);
}

function playDoorChime() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  for (let i = 0; i < 4; i++) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, now + i * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.3);
    osc.stop(now + i * 0.3 + 0.25);
  }
}

function playSuccess() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [523, 659, 784].forEach(function(freq, i) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, now + i * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.2);
    osc.stop(now + i * 0.2 + 0.5);
  });
}

/* 抱到女兒 — warm emotional ascending chord */
function playDaughterGrab() {
  if (!audioCtx) return;
  var now = audioCtx.currentTime;
  /* Warm ascending chord: C5 -> E5 -> G5 -> C6 with sine waves */
  var notes = [523, 659, 784, 1047];
  for (var i = 0; i < notes.length; i++) {
    var osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = notes[i];
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, now + i * 0.12);
    g.gain.linearRampToValueAtTime(0.1, now + i * 0.12 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.6);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.7);
    /* Add soft harmonic overtone for warmth */
    var harm = audioCtx.createOscillator();
    harm.type = "sine";
    harm.frequency.value = notes[i] * 2;
    var hg = audioCtx.createGain();
    hg.gain.setValueAtTime(0.0001, now + i * 0.12);
    hg.gain.linearRampToValueAtTime(0.03, now + i * 0.12 + 0.05);
    hg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.8);
    harm.connect(hg);
    hg.connect(audioCtx.destination);
    harm.start(now + i * 0.12);
    harm.stop(now + i * 0.12 + 0.9);
  }
  /* Gentle shimmer overlay */
  var shimBuf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.8), audioCtx.sampleRate);
  var shimData = shimBuf.getChannelData(0);
  for (var j = 0; j < shimData.length; j++) shimData[j] = (Math.random() * 2 - 1);
  var shimSrc = audioCtx.createBufferSource();
  shimSrc.buffer = shimBuf;
  var shimFilter = audioCtx.createBiquadFilter();
  shimFilter.type = "bandpass";
  shimFilter.frequency.value = 6000;
  shimFilter.Q.value = 5;
  var shimGain = audioCtx.createGain();
  shimGain.gain.setValueAtTime(0.0001, now + 0.2);
  shimGain.gain.linearRampToValueAtTime(0.025, now + 0.35);
  shimGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  shimSrc.connect(shimFilter);
  shimFilter.connect(shimGain);
  shimGain.connect(audioCtx.destination);
  shimSrc.start(now + 0.2);
}

/* 必殺技音效 — deep bass sweep + power chord + sparkle */
function playUltimateActivation() {
  if (!audioCtx) return;
  var now = audioCtx.currentTime;
  /* Deep bass sweep (30Hz -> 80Hz -> 30Hz) */
  var bass = audioCtx.createOscillator();
  bass.type = "sine";
  bass.frequency.setValueAtTime(30, now);
  bass.frequency.exponentialRampToValueAtTime(80, now + 0.4);
  bass.frequency.exponentialRampToValueAtTime(30, now + 1.2);
  var bassGain = audioCtx.createGain();
  bassGain.gain.setValueAtTime(0.35, now);
  bassGain.gain.linearRampToValueAtTime(0.25, now + 0.5);
  bassGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
  bass.connect(bassGain);
  bassGain.connect(audioCtx.destination);
  bass.start(now);
  bass.stop(now + 1.6);
  /* Ascending power chord (stacked fifths) */
  var chordFreqs = [220, 330, 440, 660, 880];
  for (var c = 0; c < chordFreqs.length; c++) {
    var cOsc = audioCtx.createOscillator();
    cOsc.type = c < 2 ? "sawtooth" : "sine";
    cOsc.frequency.setValueAtTime(chordFreqs[c] * 0.5, now + 0.1);
    cOsc.frequency.exponentialRampToValueAtTime(chordFreqs[c], now + 0.6);
    var cGain = audioCtx.createGain();
    cGain.gain.setValueAtTime(0.0001, now + 0.1);
    cGain.gain.linearRampToValueAtTime(0.06, now + 0.3);
    cGain.gain.exponentialRampToValueAtTime(0.005, now + 2.0);
    cOsc.connect(cGain);
    cGain.connect(audioCtx.destination);
    cOsc.start(now + 0.1);
    cOsc.stop(now + 2.2);
  }
  /* Sparkle shimmer overlay */
  var sparkBuf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 2), audioCtx.sampleRate);
  var sparkData = sparkBuf.getChannelData(0);
  for (var s = 0; s < sparkData.length; s++) sparkData[s] = (Math.random() * 2 - 1);
  var sparkSrc = audioCtx.createBufferSource();
  sparkSrc.buffer = sparkBuf;
  var sparkFilter = audioCtx.createBiquadFilter();
  sparkFilter.type = "bandpass";
  sparkFilter.frequency.setValueAtTime(4000, now + 0.3);
  sparkFilter.frequency.exponentialRampToValueAtTime(8000, now + 1.0);
  sparkFilter.frequency.exponentialRampToValueAtTime(3000, now + 2.0);
  sparkFilter.Q.value = 8;
  var sparkGain = audioCtx.createGain();
  sparkGain.gain.setValueAtTime(0.0001, now + 0.3);
  sparkGain.gain.linearRampToValueAtTime(0.04, now + 0.6);
  sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
  sparkSrc.connect(sparkFilter);
  sparkFilter.connect(sparkGain);
  sparkGain.connect(audioCtx.destination);
  sparkSrc.start(now + 0.3);
}

function playCollisionBump() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

/* NEW: Jump launch whoosh + ascending sweep */
function playJumpLaunch() {
  if (!audioCtx) return;
  var now = audioCtx.currentTime;
  /* Noise whoosh layer */
  var buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.1), audioCtx.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.03));
  var src = audioCtx.createBufferSource();
  src.buffer = buf;
  var filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(3000, now + 0.1);
  filter.Q.value = 1.5;
  var gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  src.start(now);
  /* Ascending pitch sweep 200 -> 600Hz */
  var sweep = audioCtx.createOscillator();
  sweep.type = "sine";
  sweep.frequency.setValueAtTime(200, now);
  sweep.frequency.exponentialRampToValueAtTime(600, now + 0.12);
  var sweepGain = audioCtx.createGain();
  sweepGain.gain.setValueAtTime(0.08, now);
  sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  sweep.connect(sweepGain);
  sweepGain.connect(audioCtx.destination);
  sweep.start(now);
  sweep.stop(now + 0.15);
}

/* NEW: Jump land thud + ground rumble */
function playJumpLand() {
  if (!audioCtx) return;
  var now = audioCtx.currentTime;
  /* Impact thud */
  var osc = audioCtx.createOscillator();
  var gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(55, now);
  osc.frequency.exponentialRampToValueAtTime(22, now + 0.12);
  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.18);
  /* Ground rumble layer (filtered noise) */
  var rumbleBuf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.15), audioCtx.sampleRate);
  var rumbleData = rumbleBuf.getChannelData(0);
  for (var i = 0; i < rumbleData.length; i++) rumbleData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.06));
  var rumbleSrc = audioCtx.createBufferSource();
  rumbleSrc.buffer = rumbleBuf;
  var rumbleFilter = audioCtx.createBiquadFilter();
  rumbleFilter.type = "lowpass";
  rumbleFilter.frequency.value = 150;
  var rumbleGain = audioCtx.createGain();
  rumbleGain.gain.setValueAtTime(0.1, now);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  rumbleSrc.connect(rumbleFilter);
  rumbleFilter.connect(rumbleGain);
  rumbleGain.connect(audioCtx.destination);
  rumbleSrc.start(now);
}

/* NEW: Barrier hit (deeper impact) */
function playBarrierHit() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.3);

  /* Add noise layer for impact */
  const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.15), audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.05));
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const nGain = audioCtx.createGain();
  nGain.gain.setValueAtTime(0.1, now);
  nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  const lp = audioCtx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 300;
  src.connect(lp);
  lp.connect(nGain);
  nGain.connect(audioCtx.destination);
  src.start(now);
}

/* NEW: Pickup collect ding — two-tone sparkle */
function playPickupDing() {
  if (!audioCtx) return;
  var now = audioCtx.currentTime;
  /* First tone: 1200Hz */
  var osc1 = audioCtx.createOscillator();
  var gain1 = audioCtx.createGain();
  osc1.type = "sine";
  osc1.frequency.value = 1200;
  gain1.gain.setValueAtTime(0.15, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.start(now);
  osc1.stop(now + 0.15);
  /* Second tone: 1600Hz (quick arpeggio) */
  var osc2 = audioCtx.createOscillator();
  var gain2 = audioCtx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = 1600;
  gain2.gain.setValueAtTime(0.12, now + 0.06);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(now + 0.06);
  osc2.stop(now + 0.25);
  /* Shimmer harmonic overlay */
  var shimmer = audioCtx.createOscillator();
  var shimGain = audioCtx.createGain();
  shimmer.type = "sine";
  shimmer.frequency.value = 2400;
  shimGain.gain.setValueAtTime(0.04, now);
  shimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  shimmer.connect(shimGain);
  shimGain.connect(audioCtx.destination);
  shimmer.start(now);
  shimmer.stop(now + 0.3);
}

/* ════════════════════════════════════════════════
   環境音效系統（車站氛圍）
   ════════════════════════════════════════════════ */
const ambientNodes = [];
let ambientRunning = false;
let nextPAChime = 0;

function startAmbientSounds() {
  if (!audioCtx || ambientRunning) return;
  ambientRunning = true;

  const crowdBufLen = audioCtx.sampleRate * 4;
  const crowdBuf = audioCtx.createBuffer(1, crowdBufLen, audioCtx.sampleRate);
  const crowdData = crowdBuf.getChannelData(0);
  for (let i = 0; i < crowdBufLen; i++) crowdData[i] = (Math.random() * 2 - 1);
  const crowdSrc = audioCtx.createBufferSource();
  crowdSrc.buffer = crowdBuf;
  crowdSrc.loop = true;
  const crowdFilter = audioCtx.createBiquadFilter();
  crowdFilter.type = "lowpass";
  crowdFilter.frequency.value = 400;
  const crowdFilter2 = audioCtx.createBiquadFilter();
  crowdFilter2.type = "highpass";
  crowdFilter2.frequency.value = 80;
  const crowdGain = audioCtx.createGain();
  crowdGain.gain.value = 0.04;
  crowdSrc.connect(crowdFilter);
  crowdFilter.connect(crowdFilter2);
  crowdFilter2.connect(crowdGain);
  crowdGain.connect(audioCtx.destination);
  crowdSrc.start();
  ambientNodes.push(crowdSrc, crowdFilter, crowdFilter2, crowdGain);

  const humOsc = audioCtx.createOscillator();
  humOsc.type = "sine";
  humOsc.frequency.value = 100;
  const humGain = audioCtx.createGain();
  humGain.gain.value = 0.015;
  humOsc.connect(humGain);
  humGain.connect(audioCtx.destination);
  humOsc.start();
  ambientNodes.push(humOsc, humGain);

  nextPAChime = audioCtx.currentTime + 12 + Math.random() * 5;
}

function playPAChime() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const ding = audioCtx.createOscillator();
  ding.type = "sine";
  ding.frequency.value = 880;
  const dingGain = audioCtx.createGain();
  dingGain.gain.setValueAtTime(0.06, now);
  dingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  ding.connect(dingGain);
  dingGain.connect(audioCtx.destination);
  ding.start(now);
  ding.stop(now + 0.9);
  const dong = audioCtx.createOscillator();
  dong.type = "sine";
  dong.frequency.value = 660;
  const dongGain = audioCtx.createGain();
  dongGain.gain.setValueAtTime(0.06, now + 0.5);
  dongGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
  dong.connect(dongGain);
  dongGain.connect(audioCtx.destination);
  dong.start(now + 0.5);
  dong.stop(now + 1.4);
}

function playTrainScreech() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 1.5, audioCtx.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1);
  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = noiseBuf;
  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 3000;
  bandpass.Q.value = 5;
  const screechGain = audioCtx.createGain();
  screechGain.gain.setValueAtTime(0.06, now);
  screechGain.gain.linearRampToValueAtTime(0.1, now + 0.3);
  screechGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  noiseSrc.connect(bandpass);
  bandpass.connect(screechGain);
  screechGain.connect(audioCtx.destination);
  noiseSrc.start(now);
}

function updateAmbientSounds() {
  if (!ambientRunning || !audioCtx) return;
  if (audioCtx.currentTime >= nextPAChime) {
    playPAChime();
    nextPAChime = audioCtx.currentTime + 13 + Math.random() * 5;
  }
}

function stopAmbientSounds() {
  ambientRunning = false;
  for (const node of ambientNodes) {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch (e) { /* ignore */ }
  }
  ambientNodes.length = 0;
}

/* ════════════════════════════════════════════════
   輸入系統 — NO BACKWARD, NO AUTO-RUN
   ════════════════════════════════════════════════ */
const keys = {};
let touchJoyX = 0, touchJoyY = 0;
let touchSprinting = false;
let touchJumping = false;

function triggerJump() {
  if (!state.isJumping && (state.phase === "running" || state.phase === "sprint2")) {
    state.isJumping = true;
    state.jumpVel = JUMP_VELOCITY;
    playJumpLaunch();
  }
}

window.addEventListener("keydown", function(e) {
  keys[e.code] = true;
  if (e.code === "KeyE") activateUltimate();
  if (e.code === "Space") {
    e.preventDefault();
    triggerJump();
  }
});
window.addEventListener("keyup", function(e) { keys[e.code] = false; });

function detectMobile() {
  isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (isMobile) {
    dom.touchCtrl.style.display = "block";
    dom.sprintBtn.style.display = "block";
    dom.jumpBtn.style.display = "block";
    dom.ultimateBtn.style.display = "block";
    dom.ultimateCount.style.display = "block";
    dom.breathHint.textContent = "\u5DE6\u624B\u6416\u687F\u79FB\u52D5 \u00B7 \u53F3\u624B\u885D\u523A \u00B7 \u8DF3\u8E8D \u00B7 \u5FC5\u6BBA\u6280[E]";
  } else {
    dom.breathHint.textContent = "A\uFF0FD \u5DE6\u53F3\u9583 \u00B7 W \u524D\u9032 \u00B7 Shift \u885D\u523A \u00B7 Space \u8DF3 \u00B7 E \u5FC5\u6BBA\u6280";
  }
}

let joyActive = false;
let joyCenter = { x: 0, y: 0 };
dom.joystickArea.addEventListener("touchstart", function(e) {
  e.preventDefault();
  joyActive = true;
  const r = dom.joystickArea.getBoundingClientRect();
  joyCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}, { passive: false });
dom.joystickArea.addEventListener("touchmove", function(e) {
  e.preventDefault();
  if (!joyActive) return;
  const t = e.targetTouches[0]; if (!t) return;   // 只取在搖桿上開始的觸點(targetTouches),先按住衝刺/跳/必殺那根手指不會被當搖桿手指→把拔不再亂飄
  const dx = t.clientX - joyCenter.x;
  const dy = t.clientY - joyCenter.y;
  const maxR = 50;
  const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxR);
  const angle = Math.atan2(dy, dx);
  touchJoyX = Math.cos(angle) * (dist / maxR);
  touchJoyY = Math.sin(angle) * (dist / maxR);
  dom.joystickKnob.style.transform = "translate(calc(-50% + " + (touchJoyX * 38) + "px), calc(-50% + " + (touchJoyY * 38) + "px))";
}, { passive: false });
const endJoy = function() { joyActive = false; touchJoyX = 0; touchJoyY = 0; dom.joystickKnob.style.transform = "translate(-50%,-50%)"; };
dom.joystickArea.addEventListener("touchend", endJoy);
dom.joystickArea.addEventListener("touchcancel", endJoy);

dom.sprintBtn.addEventListener("touchstart", function(e) { e.preventDefault(); touchSprinting = true; }, { passive: false });
dom.sprintBtn.addEventListener("touchend",   function() { touchSprinting = false; });
dom.sprintBtn.addEventListener("touchcancel", function() { touchSprinting = false; });

dom.jumpBtn.addEventListener("touchstart", function(e) { e.preventDefault(); initAudio(); triggerJump(); }, { passive: false });   // 跳是遊玩中最頻繁手勢:順手把被背景化 suspend 的 AudioContext 救回(initAudio 已 idempotent + resume)

dom.ultimateBtn.addEventListener("touchstart", function(e) { e.preventDefault(); activateUltimate(); }, { passive: false });

/* ════════════════════════════════════════════════
   敘事系統
   ════════════════════════════════════════════════ */
function showNarrative(text, duration) {
  duration = duration || 3;
  dom.narrText.textContent = text;
  dom.narrText.classList.add("show");
  state.narrTimer = duration;
}

function updateNarrative(dt) {
  if (state.narrTimer > 0) {
    state.narrTimer -= dt;
    if (state.narrTimer <= 0) {
      dom.narrText.classList.remove("show");
    }
  }
}

/* ════════════════════════════════════════════════
   碰撞偵測
   ════════════════════════════════════════════════ */
function checkCollisions() {
  /* 玩家 vs NPC 碰撞（推開） */
  for (var ci = 0; ci < npcs.length; ci++) {
    var npc = npcs[ci];
    var dx = father.position.x - npc.position.x;
    var dz = father.position.z - npc.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.8 && dist > 0.001) {
      var push = (0.8 - dist) * 0.7;
      father.position.x += (dx / dist) * push;
      father.position.z += (dz / dist) * push;
      /* 被推的 NPC 也要後退（真實碰撞） */
      npc.position.x -= (dx / dist) * push * 0.3;
      npc.position.z -= (dz / dist) * push * 0.3;

      if (state.collisionSlowTimer <= 0) {
        state.collisionSlowTimer = 1.0;
        state.cameraShake = 3;
        playCollisionBump();
      }
    }
  }

  /* 玩家 vs 警衛碰撞（推開，不穿透） */
  for (var gi = 0; gi < guards.length; gi++) {
    var guard = guards[gi];
    var gdx = father.position.x - guard.position.x;
    var gdz = father.position.z - guard.position.z;
    var gdist = Math.sqrt(gdx * gdx + gdz * gdz);
    if (gdist < 0.6 && gdist > 0.001) {
      var gpush = (0.6 - gdist) * 0.8;
      father.position.x += (gdx / gdist) * gpush;
      father.position.z += (gdz / gdist) * gpush;
    }
  }

  /* 月台邊界 — 絕不超出月台、絕不踩上軌道或火車 */
  var halfW = PLATFORM_W / 2 - 0.5;
  father.position.x = Math.max(-halfW, Math.min(halfW, father.position.x));

  var halfZ = PLATFORM_LEN / 2 - 2;
  father.position.z = Math.max(-halfZ, Math.min(halfZ, father.position.z));
}

/* ════════════════════════════════════════════════
   開場動畫
   ════════════════════════════════════════════════ */
let introScreechPlayed = false;
let introSeenOnce = false; // 本次瀏覽階段是否已完整看過一次開場（看過後續場才提供跳過）

function startIntro() {
  state.phase = "intro";
  if (window.__LEVEL_MECHANICS__) window.__LEVEL_MECHANICS__.deactivate(); /* 關卡氛圍 overlay 不得殘留到過場 */
  state.transitionFreeze = false; // 防卡：新一關 intro 開始一定解凍
  state.introTimer = 0;
  introScreechPlayed = false;
  document.body.classList.add("letterbox-on");
  state.trainSouthZ = PLATFORM_LEN * 0.8;
  state.trainNorthZ = -PLATFORM_LEN * 0.8;
  state.trainSouthArrived = false;
  state.trainNorthArrived = false;
  /* 已完整看過一次開場 → 之後每次開場提供「跳過」鈕 */
  dom.introSkip.style.display = introSeenOnce ? "block" : "none";
}

function updateIntro(dt) {
  state.introTimer += dt;
  const t = state.introTimer;

  if (t < 4) {
    const p = t / 4;
    camera.position.set(
      Math.sin(p * 0.3) * 8,
      15 - p * 5,
      PLATFORM_LEN / 2 - p * 30
    );
    camera.lookAt(0, 0, PLATFORM_LEN / 3);
    if (t > 1 && t < 3.5) showNarrative("\u5357\u4E0B\u7684\u706B\u8ECA\u6162\u6162\u6ED1\u9032\u53F0\u4E2D\u7AD9", 2);
  }

  if (!state.trainSouthArrived) {
    state.trainSouthZ -= dt * 25;
    if (!introScreechPlayed && state.trainSouthZ < PLATFORM_LEN * 0.4) {
      introScreechPlayed = true;
      playTrainScreech();
    }
    if (state.trainSouthZ <= 0) {
      state.trainSouthZ = 0;
      state.trainSouthArrived = true;
    }
    trainSouth.position.z = state.trainSouthZ;
  }

  if (t >= 4 && t < 7) {
    const p = (t - 4) / 3;
    camera.position.set(2, 2.5, state.playerZ + 5 - p * 3);
    camera.lookAt(father.position.x, 1.2, father.position.z);
    if (t > 4.5 && t < 6.5) showNarrative("\u6709\u4E00\u500B\u4EBA\u5F9E\u4E00\u865F\u8ECA\u5EC2\u885D\u4E86\u51FA\u4F86\u3002\u90A3\u662F\u628A\u62D4", 2.5);
  }

  if (t > 3 && !state.trainNorthArrived) {
    state.trainNorthZ += dt * 20;
    if (state.trainNorthZ >= 0) {
      state.trainNorthZ = 0;
      state.trainNorthArrived = true;
      state.trainNorthDoorOpen = true;
      state.doorPhase = 0;
    }
    trainNorth.position.z = state.trainNorthZ;
  }

  if (t >= 7 && t < 9) {
    const p = (t - 7) / 2;
    camera.position.set(
      THREE.MathUtils.lerp(2, 3, p),
      THREE.MathUtils.lerp(2.5, 2, p),
      THREE.MathUtils.lerp(state.playerZ + 2, DAUGHTER_Z + 8, p)
    );
    camera.lookAt(1, 0.5, DAUGHTER_Z);
    if (t > 7.5) showNarrative("\u6708\u53F0\u53E6\u4E00\u7AEF\uFF0C\u6709\u500B\u7C89\u7D05\u8272\u5C0F\u80CC\u5305\u5728\u7B49\u4ED6", 2);
  }

  if (t >= 9.5) {
    introSeenOnce = true; // 完整看完一次開場，之後的開場可跳過
    beginRunning();
  }
}

/* 進入跑步階段 — 開場自然結束（t>=9.5）與「跳過」共用同一份收尾設定 */
function beginRunning() {
  state.phase = "running";
  state.timeLeft = GAME_TIME;
  dom.introSkip.style.display = "none";
  dom.hud.style.display = "block";
  dom.sprintWrap.style.display = "block";
  dom.buffIndicators.style.display = "block";
  dom.breathHint.style.opacity = "1";
  dom.levelText.textContent = "\u7B2C " + state.currentLevel + " \u95DC";
  updateUltimateUI();
  if (isMobile) {
    dom.touchCtrl.style.display = "block";
    dom.sprintBtn.style.display = "block";
    dom.jumpBtn.style.display = "block";
    dom.ultimateBtn.style.display = "block";
    dom.ultimateCount.style.display = "block";
  }
  safeSetTimeout(function() { dom.breathHint.style.opacity = "0"; }, 4000);
  document.body.classList.remove("letterbox-on");
  if (state.currentLevel === 1) {
    showNarrative("\u8DD1\uFF01", 1.5);
    safeSetTimeout(function() {
      showNarrative("沿路的咖啡會讓把拔衝更快，一杯都別放過！", 2.8);
    }, 1700);
  } else {
    showNarrative("\u7B2C " + state.currentLevel + " \u95DC\u958B\u59CB\uFF01", 2);
  }
  if (window.__LEVEL_MECHANICS__) window.__LEVEL_MECHANICS__.activate(state.currentLevel);  // \u76F4\u547C,\u6DB5\u84CB\u6240\u6709\u95DC + \u4E0D\u4F9D\u8CF4 observer
  if (audioCtx) playDoorChime();
  startAmbientSounds();
  /* 開跑閒置提示：每關進入跑步階段重新計時 */
  idleHintTimer = 0;
  idleHintDone = false;
}

/* 跳過開場：把場景等效推進到開場 9.5 秒的結束點再開跑 */
function skipIntro() {
  if (state.phase !== "intro") return;
  state.introTimer = 9.5;
  introScreechPlayed = true;
  /* 兩列火車直接到位：南下停妥、北上進站並開門（對齊 updateIntro 跑完的狀態） */
  state.trainSouthZ = 0;
  state.trainSouthArrived = true;
  trainSouth.position.z = 0;
  state.trainNorthZ = 0;
  if (!state.trainNorthArrived) {
    state.trainNorthArrived = true;
    state.trainNorthDoorOpen = true;
    state.doorPhase = 0;
  }
  trainNorth.position.z = 0;
  /* 鏡頭直接落到跑步追焦基準位（與 updateCamera 的 running 公式同源） */
  camera.position.set(father.position.x * 0.3, 3.5, father.position.z + 6);
  camera.lookAt(father.position.x, 1.2, father.position.z - 8);
  beginRunning();
}

/* ════════════════════════════════════════════════
   門動畫
   ════════════════════════════════════════════════ */
function updateDoors(frameDt) {
  const dt = frameDt || 0.016;
  if (state.trainNorthDoorOpen && state.doorPhase < 1) {
    state.doorPhase = Math.min(1, state.doorPhase + dt * 1.5);
  }
  if (state.trainNorthLeaving && state.doorPhase > 0) {
    state.doorPhase = Math.max(0, state.doorPhase - dt * 2);
  }
  const offset = state.doorPhase * 0.65;
  for (const d of northDoors) {
    d.left.position.z  = d.z - 0.35 - offset;
    d.right.position.z = d.z + 0.35 + offset;
  }
}

/* ════════════════════════════════════════════════
   HUD 道具效果指示
   ════════════════════════════════════════════════ */
function updateBuffIndicators() {
  dom.buffIndicators.textContent = "";
  if (state.riceBallTimer > 0) {
    const el = document.createElement("div");
    el.className = "buff-item";
    el.textContent = "\u5FA1\u98EF\u7CF0 " + state.riceBallTimer.toFixed(1) + "s";
    dom.buffIndicators.appendChild(el);
  }
  if (state.coffeeTimer > 0) {
    const el = document.createElement("div");
    el.className = "buff-item";
    el.textContent = "\u7279\u5927\u71B1\u7F8E\u5F0F " + state.coffeeTimer.toFixed(1) + "s";
    dom.buffIndicators.appendChild(el);
  }
  if (state.ultimateTimer > 0) {
    const el = document.createElement("div");
    el.className = "buff-item";
    el.textContent = "\u2728 \u6211\u4E5F\u6703\u60F3\u59B3\u7684 " + state.ultimateTimer.toFixed(1) + "s";
    dom.buffIndicators.appendChild(el);
  }
  if (state.collisionSlowTimer > 0) {
    const el = document.createElement("div");
    el.className = "buff-item";
    el.style.color = "#e74c3c";
    el.textContent = "\u6E1B\u901F\u4E2D " + state.collisionSlowTimer.toFixed(1) + "s";
    dom.buffIndicators.appendChild(el);
  }
  if (state.luggageSlowTimer > 0) {
    const el = document.createElement("div");
    el.className = "buff-item";
    el.style.color = "#e74c3c";
    el.textContent = "\u884C\u674E\u7D46\u5012 " + state.luggageSlowTimer.toFixed(1) + "s";
    dom.buffIndicators.appendChild(el);
  }
  if (state.guardSlowTimer > 0) {
    const el = document.createElement("div");
    el.className = "buff-item";
    el.style.color = "#e74c3c";
    el.textContent = "\u26A0 \u8ACB\u52FF\u8DE8\u8D8A\u9EC3\u7DDA " + state.guardSlowTimer.toFixed(1) + "s";
    dom.buffIndicators.appendChild(el);
  }
  /* Desktop ultimate charges display */
  if (state.ultimateCharges > 0) {
    const el = document.createElement("div");
    el.className = "buff-item";
    el.style.color = "#ffd700";
    el.textContent = "\u2728 \u5FC5\u6BBA\u6280 [E] \u00D7" + state.ultimateCharges;
    dom.buffIndicators.appendChild(el);
  } else {
    const el = document.createElement("div");
    el.className = "buff-item";
    el.style.color = "#666";
    el.textContent = "\u5FC5\u6BBA\u6280 \u5DF2\u7528\u5B8C";
    dom.buffIndicators.appendChild(el);
  }
}

/* ════════════════════════════════════════════════
   跳躍物理更新
   ════════════════════════════════════════════════ */
function updateJump(dt) {
  if (state.isJumping) {
    state.jumpVel += JUMP_GRAVITY * dt;
    state.jumpY += state.jumpVel * dt;
    if (state.jumpY <= 0) {
      state.jumpY = 0;
      state.jumpVel = 0;
      state.isJumping = false;
      /* Play land sound */
      playJumpLand();
    }
  }
}

/* ════════════════════════════════════════════════
   遊戲邏輯更新 — NO AUTO-RUN, NO BACKWARD
   ════════════════════════════════════════════════ */
let footstepTimer = 0;
let sprint2HintShown = false;
let idleHintTimer = 0;    // 進入跑步階段後，尚未前進輸入的累計秒數
let idleHintDone = false; // 本關閒置提示是否已處理（已顯示過，或玩家已前進）

function updateGame(dt) {
  if (state.phase !== "running" && state.phase !== "sprint2") return;

  let moveX = 0, moveZ = 0;
  if (isMobile) {
    moveX = touchJoyX;
    /* Only allow forward (negative Y on joystick = up = forward), ignore backward */
    moveZ = touchJoyY < 0 ? touchJoyY : 0;
    state.sprinting = touchSprinting;
  } else {
    if (keys["KeyA"] || keys["ArrowLeft"])  moveX = -1;
    if (keys["KeyD"] || keys["ArrowRight"]) moveX =  1;
    if (keys["KeyW"] || keys["ArrowUp"])    moveZ = -1;
    /* NO backward: KeyS and ArrowDown are ignored */
    state.sprinting = !!(keys["ShiftLeft"] || keys["ShiftRight"]);
  }

  /* 開跑閒置提示：進入跑步後 3 秒內完全沒有前進輸入，提示一次（每關最多一次） */
  if (!idleHintDone) {
    if (moveZ < 0) {
      idleHintDone = true;
    } else {
      idleHintTimer += dt;
      if (idleHintTimer >= 3) {
        idleHintDone = true;
        showNarrative(isMobile ? "推住搖桿往前跑！" : "按住 W 往前跑！", 2.5);
      }
    }
  }

  /* Calculate speed multipliers */
  let speedMult = 1, drainMult = 1;
  if (state.coffeeTimer > 0) speedMult *= 2;
  if (state.riceBallTimer > 0) drainMult *= 0.5;
  if (state.ultimateTimer > 0) { speedMult *= 2; drainMult *= 0.5; }
  if (state.collisionSlowTimer > 0) speedMult *= 0.5;
  if (state.luggageSlowTimer > 0) speedMult *= 0.3;
  if (state.guardSlowTimer > 0) speedMult *= 0.1;

  /* Sprint only works when moving forward */
  if (state.sprinting && moveZ < 0 && state.sprint > 0) {
    state.sprint = Math.max(0, state.sprint - SPRINT_DRAIN * drainMult * dt);
  } else {
    state.sprinting = false;
    state.sprint = Math.min(SPRINT_MAX, state.sprint + SPRINT_REGEN * dt);
  }

  const baseSpeed = (state.sprinting && moveZ < 0) ? SPRINT_SPEED : RUN_SPEED;
  const speed = baseSpeed * speedMult;
  const carrying = state.gotDaughter ? 0.75 : 1;

  /* NO auto-run: only move if player is pressing forward */
  let vz = 0;
  if (moveZ < 0) {
    vz = -speed * carrying;
  }
  /* No backward: moveZ > 0 is ignored */

  father.position.z += vz * dt;
  father.position.x += moveX * DODGE_SPEED * speedMult * dt;

  /* sprint2: NO auto-steer, player must manually steer to train door */
  if (state.phase === "sprint2") {
    if (!sprint2HintShown) {
      sprint2HintShown = true;
      safeSetTimeout(function() {
        if (state.phase === "sprint2") {
          showNarrative("\u5F80\u53F3\u908A\uFF01\u885D\u5411\u5317\u4E0A\u81EA\u5F37\u865F\u7684\u8ECA\u9580\uFF01", 3);
        }
      }, 2800);
    }
  }

  checkCollisions();
  checkLuggageCollisions();
  checkBarrierCollisions();

  /* Update jump physics */
  updateJump(dt);

  state.timeLeft -= dt;

  const urgency = 1 - state.timeLeft / GAME_TIME;
  state.heartRate = 60 + urgency * 120;
  playHeartbeat();

  /* Footstep only when moving */
  const isMoving = (vz !== 0 || moveX !== 0);
  footstepTimer -= dt;
  if (footstepTimer <= 0 && !state.isJumping && isMoving) {
    if (state.sprinting) { playSprintFootstep(); } else { playFootstep(); }
    footstepTimer = state.sprinting ? 0.25 : 0.35;
  }

  /* Father position: grounded base + bob + jump */
  const bobFreq = state.sprinting ? 12 : 8;
  const bobAmt = (state.isJumping || !isMoving) ? 0 : (Math.abs(Math.sin(state.clock * bobFreq)) * 0.035);
  father.position.y = FATHER_BASE_Y + bobAmt + state.jumpY;
  father.rotation.z = (state.isJumping || !isMoving) ? 0 : (Math.sin(state.clock * bobFreq * 0.5) * 0.05);
  /* 接觸陰影釘地:抵銷 bob+跳躍位移(否則影子黏腳跟著飛);跳越高影子越小越淡 */
  if (fatherContactShadow) {
    fatherContactShadow.position.y = 0.02 - bobAmt - state.jumpY;
    const csK = Math.max(0.5, 1 - state.jumpY * 0.4);
    fatherContactShadow.scale.setScalar(csK);
    fatherContactShadow.material.opacity = Math.max(0.3, 1 - state.jumpY * 0.5);
  }

  /* Leg animation */
  if (state.isJumping) {
    fatherLeftLeg.rotation.x = 0.3;
    fatherRightLeg.rotation.x = 0.3;
    fatherLeftArm.rotation.x = -0.2;
    fatherRightArm.rotation.x = -0.2;
  } else if (isMoving) {
    const legSwing = Math.sin(state.clock * bobFreq) * 0.5;
    fatherLeftLeg.rotation.x = legSwing;
    fatherRightLeg.rotation.x = -legSwing;
    fatherLeftArm.rotation.x = -legSwing * 0.7;
    fatherRightArm.rotation.x = legSwing * 0.7;
  } else {
    /* Idle pose */
    fatherLeftLeg.rotation.x = 0;
    fatherRightLeg.rotation.x = 0;
    fatherLeftArm.rotation.x = 0;
    fatherRightArm.rotation.x = 0;
  }

  /* Father glow during ultimate */
  if (fatherGlowLight && state.ultimateTimer > 0) {
    fatherGlowLight.intensity = 3 + Math.sin(state.clock * 8) * 2;
    fatherGlowLight.color.setHSL(0.12 + Math.sin(state.clock * 3) * 0.03, 1, 0.6);
  }

  /* Ultimate particle effects */
  updateUltimateEffects(dt);

  const pct = Math.max(0, state.timeLeft / GAME_TIME) * 100;
  dom.timerFill.style.width = pct + "%";
  dom.timerText.textContent = Math.max(0, state.timeLeft).toFixed(1);
  dom.sprintFill.style.width = (state.sprint / SPRINT_MAX * 100) + "%";

  if (!state.gotDaughter) {
    const dist = Math.abs(father.position.z - DAUGHTER_Z);
    window.__PT_BOND__ = Math.max(0, Math.min(1, 1 - dist / 260)); // #7 紅線色溫：離女兒越近越暖越亮（/260 讓中段就開始暖，看得到「線一路都在」）
    dom.distText.textContent = "\u8DDD\u96E2\u5973\u5152 " + Math.max(0, dist).toFixed(0) + "m";
  } else {
    window.__PT_BOND__ = 1; // #7 抱到女兒：紅線最暖最亮
    let minD = Infinity;
    for (const d of northDoors) {
      const dWorldZ = trainNorth.position.z + d.z;
      const dz = Math.abs(father.position.z - dWorldZ);
      if (dz < minD) minD = dz;
    }
    dom.distText.textContent = "\u8DDD\u96E2\u8ECA\u9580 " + Math.max(0, minD).toFixed(0) + "m";
  }

  /* Vignette at 40% max for daytime */
  dom.vignette.style.opacity = state.timeLeft < 10 ? String((1 - state.timeLeft / 10) * 0.4) : "0";

  /* 車門紅閃倒數：最後 10 秒北上車門 emissive 脈動（3D 緊迫感，門材質皆獨立 clone 不影響全域） */
  {
    const doorUrgency = state.timeLeft < 10 ? 1 - Math.max(0, state.timeLeft) / 10 : 0;
    const doorPulse = doorUrgency > 0 ? (0.5 + 0.5 * Math.sin(performance.now() * 0.012)) * doorUrgency * 0.85 : 0;
    for (let dI = 0; dI < northDoors.length; dI++) {
      northDoors[dI].left.material.emissive.setRGB(doorPulse, doorPulse * 0.08, doorPulse * 0.06);
      northDoors[dI].right.material.emissive.setRGB(doorPulse, doorPulse * 0.08, doorPulse * 0.06);
    }
  }

  if (state.timeLeft < 8) {
    dom.timerText.style.color = "#e74c3c";
  } else if (state.timeLeft < 15) {
    dom.timerText.style.color = "#f39c12";
  }

  /* Power-ups */
  updatePowerups(dt);
  updateBuffIndicators();
  updateDoorMarker();
  updateAmbientSounds();

  if (!state.gotDaughter && Math.abs(father.position.z - DAUGHTER_Z) < 2.5) {
    state.gotDaughter = true;
    state.phase = "grabbed";
    state.grabSlow = 0.6; state.cameraShake = 2; ptVibe([18, 40, 70, 60, 140]); // 子彈時間 + 落地一震 + 手機漸強落地震：把「我趕上了」釘住一秒
    try { if (window.__PACTS__ && window.__PACTS__.catchMoment) window.__PACTS__.catchMoment(); } catch (e) {}
    showNarrative("\u628A\u62D4\u628A\u6211\u6574\u500B\u62B1\u8D77\u4F86", 2);
    playDaughterGrab();
    scene.remove(daughter);
    father.add(daughter);
    daughter.position.set(0.3, 0.6, 0.2);
    // 抱到女兒那一秒,一束暖光從兩人之間漫出來,blooms then 退去(additive,自己移除)
    try {
      const hugGlow = new THREE.PointLight(0xffd9a0, 0, 9);
      hugGlow.position.set(0.2, 1.0, 0.2);
      father.add(hugGlow);
      let hk = 0;
      const hugIv = setInterval(function () {
        hk += 1; const t = hk / 110; // ~3.5s
        // t 跑完 OR 中途重開/失敗(gotDaughter 被 resetGame 清掉)就收掉,不殘留到下一局
        if (t >= 1 || !state.gotDaughter) { father.remove(hugGlow); clearInterval(hugIv); return; }
        hugGlow.intensity = Math.sin(Math.min(1, t) * Math.PI) * 2.4; // 0 → 峰 → 0,壓低避免跟既有暖光疊爆
      }, 32);
    } catch (e) {}
    safeSetTimeout(function() {
      state.phase = "sprint2";
      showNarrative("\u5FEB\uFF01\u5317\u4E0A\u81EA\u5F37\u865F\u7684\u9580\u8981\u95DC\u4E86\uFF01", 2.5);
      ptVibe([20, 80, 20, 80, 20]); // \u95DC\u9580\u8B66\u793A\u9234\u65B7\u7E8C\u50AC\u4FC3,\u628A\u7DCA\u8FEB\u5F9E\u807D\u89BA\u5EF6\u4F38\u5230\u8EAB\u9AD4
      if (audioCtx) playDoorChime();
    }, 1500);
    return;
  }

  /* Victory detection */
  if (state.gotDaughter && state.phase === "sprint2") {
    for (const d of northDoors) {
      const doorWorldZ = trainNorth.position.z + d.z;
      const dz = Math.abs(father.position.z - doorWorldZ);
      if (father.position.x > 2 && dz < 5) {
        victory();
        return;
      }
    }
  }

  if (state.timeLeft <= 0) {
    failure();
  }
}

/* ════════════════════════════════════════════════
   排行榜 — localStorage TOP 10 (10關制)
   ════════════════════════════════════════════════ */
const LB_KEY = "platformRunLeaderboard_v2";

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch (e) { return []; }
}

function saveLeaderboard(entries) {
  try { localStorage.setItem(LB_KEY, JSON.stringify(entries)); } catch (e) { /* quota */ }
}

/* 標題畫面個人最佳：取排行榜第一名（已依分數排序）；沒有紀錄就留空，CSS :empty 自動隱藏 */
function updateTitleBest() {
  var el = document.getElementById("title-best");
  if (!el) return;
  var entries = loadLeaderboard();
  var best = entries.length > 0 ? entries[0] : null;
  el.textContent = best ? "你的最佳：第 " + best.level + " 關 · 總分 " + best.score : "";
}

/* Score = A(totalTimeBank) + B(totalItemsBank) = C */
function addScore(name, levelReached, levelTimes, totalTime, totalItems) {
  var entries = loadLeaderboard();
  var fastest = levelTimes.length > 0 ? Math.min.apply(null, levelTimes) : 0;
  var avg = levelTimes.length > 0 ? totalTime / levelTimes.length : 0;
  var score = Math.round((totalTime + totalItems) * 10) / 10;
  entries.push({
    name: name,
    level: levelReached,
    fastest: Math.round(fastest * 10) / 10,
    totalTime: Math.round(totalTime * 10) / 10,
    avgTime: Math.round(avg * 10) / 10,
    items: totalItems,
    score: score
  });
  /* Sort by score descending */
  entries.sort(function(a, b) { return b.score - a.score; });
  if (entries.length > 10) entries.length = 10;
  saveLeaderboard(entries);
  return entries;
}

function renderLeaderboard(highlightIndex) {
  dom.lbBody.textContent = "";
  var entries = loadLeaderboard();
  if (entries.length === 0) {
    var empty = document.createElement("div");
    empty.textContent = "\u9084\u6C92\u6709\u7D00\u9304\uFF0C\u5FEB\u4F86\u6311\u6230\uFF01";
    empty.style.color = "#8a7560";
    empty.style.padding = "20px";
    dom.lbBody.appendChild(empty);
    return;
  }
  /* 個人最佳：回訪玩家一眼看到要破的紀錄（entries 已依分數排序，[0] 即最佳）*/
  var best = entries[0];
  if (best) {
    var pb = document.createElement("div");
    pb.className = "lb-personal-best";
    pb.style.cssText = "margin:0 0 12px;padding:9px 14px;border:1px solid rgba(255,150,90,.4);border-radius:6px;background:rgba(255,150,90,.08);color:#ffd2a8;font-size:clamp(11px,1.6vw,13px);letter-spacing:.04em;text-align:center";
    pb.textContent = "★ 你的個人最佳 · 第" + best.level + "關 · 最快 " + best.fastest + "s · 分數 " + best.score;
    dom.lbBody.appendChild(pb);
  }
  var table = document.createElement("table");
  table.className = "lb-table";
  var thead = document.createElement("thead");
  var hrow = document.createElement("tr");
  ["\u540D\u6B21", "\u540D\u5B57", "\u904E\u95DC", "\u6700\u5FEB", "\u7E3D\u79D2", "\u5E73\u5747", "\u5BF6\u7269", "\u5206\u6578"].forEach(function(txt) {
    var th = document.createElement("th");
    th.textContent = txt;
    th.style.fontSize = "clamp(9px,1.2vw,12px)";
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);
  var tbody = document.createElement("tbody");
  var rank = 1;
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (i > 0 && entries[i - 1].score !== e.score) rank = i + 1;
    var tr = document.createElement("tr");
    if (i === highlightIndex) tr.className = "highlight";
    var cells = [
      rank,
      e.name,
      "\u7B2C" + e.level + "\u95DC",
      e.fastest + "s",
      e.totalTime + "s",
      e.avgTime + "s",
      e.items,
      e.score
    ];
    cells.forEach(function(val) {
      var td = document.createElement("td");
      td.textContent = val;
      td.style.fontSize = "clamp(9px,1.2vw,12px)";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  dom.lbBody.appendChild(table);
}

var lastSavedHighlight = -1;

/* ════════════════════════════════════════════════
   勝利 / 失敗 — BGM NEVER INTERRUPTED
   ════════════════════════════════════════════════ */
function victory() {
  /* Record this level's time remaining */
  var levelTimeLeft = Math.max(0, state.timeLeft);
  state.levelTimes.push(Math.round(levelTimeLeft * 10) / 10);
  state.totalTimeBank += levelTimeLeft;
  state.totalItemsBank += state.itemsCollected;

  /* Save carry-over state */
  state.carryRiceBall = state.riceBallTimer;
  state.carryCoffee = state.coffeeTimer;
  state.carryUltimate = state.ultimateTimer;

  state.phase = "victory";
  if (window.__LEVEL_MECHANICS__) window.__LEVEL_MECHANICS__.deactivate();
  state.victoryTimer = 0;
  state.victoryPhase = 0;
  document.body.classList.add("letterbox-on");
  dom.hud.style.display = "none";
  dom.sprintWrap.style.display = "none";
  dom.vignette.style.opacity = "0";
  dom.buffIndicators.style.display = "none";
  if (isMobile) {
    dom.touchCtrl.style.display = "none";
    dom.sprintBtn.style.display = "none";
    dom.jumpBtn.style.display = "none";
    dom.ultimateBtn.style.display = "none";
    dom.ultimateCount.style.display = "none";
  }
  playSuccess();
  stopAmbientSounds();

  /* Find nearest north door */
  var nearestDist = Infinity;
  var nearestDoorZ = 0;
  for (var di = 0; di < northDoors.length; di++) {
    var dWorldZ = trainNorth.position.z + northDoors[di].z;
    var ddz = Math.abs(father.position.z - dWorldZ);
    if (ddz < nearestDist) {
      nearestDist = ddz;
      nearestDoorZ = dWorldZ;
    }
  }
  state.victoryDoorX = PLATFORM_W / 2 - 1;
  state.victoryDoorZ = nearestDoorZ;

  showNarrative("\u300C\u6211\u8D95\u4E0A\u4E86\u3002\u300D", 3);
}

function updateVictoryAnimation(dt) {
  state.victoryTimer += dt;
  var t = state.victoryTimer;

  /* Phase 1 (0-3s): Father walks toward nearest north door */
  if (state.victoryPhase === 0) {
    var targetX = state.victoryDoorX;
    var targetZ = state.victoryDoorZ;
    father.position.x = THREE.MathUtils.lerp(father.position.x, targetX, dt * 2);
    father.position.z = THREE.MathUtils.lerp(father.position.z, targetZ, dt * 2);
    /* Leg walking animation */
    var legSwing = Math.sin(t * 10) * 0.4;
    fatherLeftLeg.rotation.x = legSwing;
    fatherRightLeg.rotation.x = -legSwing;
    fatherLeftArm.rotation.x = -legSwing * 0.5;
    fatherRightArm.rotation.x = legSwing * 0.5;
    father.position.y = FATHER_BASE_Y + Math.abs(Math.sin(t * 10)) * 0.02;

    if (t >= 3) {
      state.victoryPhase = 1;
      showNarrative("\u4ED6\u4E00\u908A\u5598\u6C23\uFF0C\u4E00\u908A\u7B11", 2);
    }
  }

  /* Phase 2 (3-5s): Father enters the train */
  if (state.victoryPhase === 1) {
    var enterX = PLATFORM_W / 2 + 2;
    father.position.x = THREE.MathUtils.lerp(father.position.x, enterX, dt * 3);
    var legSwing2 = Math.sin(t * 8) * 0.3;
    fatherLeftLeg.rotation.x = legSwing2;
    fatherRightLeg.rotation.x = -legSwing2;
    fatherLeftArm.rotation.x = -legSwing2 * 0.5;
    fatherRightArm.rotation.x = legSwing2 * 0.5;

    if (t >= 5) {
      father.visible = false;
      state.victoryPhase = 2;
      state.trainNorthDoorOpen = false;
    }
  }

  /* Phase 3 (5-7s): Doors close, train departs */
  if (state.victoryPhase === 2) {
    /* Doors closing handled by updateDoors via trainNorthDoorOpen=false + trainNorthLeaving */
    if (state.doorPhase <= 0.05 && !state.trainNorthLeaving) {
      state.trainNorthLeaving = true;
    }
    if (state.trainNorthLeaving) {
      var accel = Math.min((t - 5) * 3, 20);
      trainNorth.position.z += dt * accel;
    }

    if (t >= 7) {
      state.victoryPhase = 3;
    }
  }

  /* Phase 4 (7s+): Level transition or final result */
  if (state.victoryPhase === 3) {
    if (state.trainNorthLeaving) {
      trainNorth.position.z += dt * 25;
    }

    if (t >= 7.5 && !state._victoryHandled) {
      state._victoryHandled = true;

      if (state.currentLevel < state.maxLevel) {
        /* === LEVEL TRANSITION === */
        showLevelTransition();
      } else {
        /* === LEVEL 10 CLEARED: HIDDEN ENDING === */
        startHiddenEnding();
      }
    }
  }
}

/* ════════════════════════════════════════════════
   關卡過渡：顯示過關畫面，自動進入下一關
   ════════════════════════════════════════════════ */
/* 過關鉤子：每關過關時的一句倒敘情感台詞（女兒回看把拔月台奔跑，EP36 + EP16，逐關往下勾） */
var LEVEL_HOOKS = [
  "趕上了。他喘著氣笑了一下，又把那個好大的包甩回肩上。下一班，還要再趕。",
  "他從來沒讓我等太久。「再忍耐一下，把拔快換好了喔。」",
  "捷運男廁沒有尿布台，他把外套鋪上高高的櫃子，手臂撐成一座橋。「以後，把拔會越來越厲害的。」",
  "他真的越來越厲害了。為了我，他把每一件沒準備好的事，都練成趕得上的事。",
  "2017 年我要搬去台中那天，他在水槽前把水開得好大聲。「我也會想妳的。」",
  "搬多遠都沒關係。他用力跑的樣子，就是在說：這段距離，難不倒我。",
  "又是一個月台，又是一次門快要關上。他還是從一號車廂衝了出來。每一次都趕上。",
  "他從來沒看過未來，沒有一次知道趕不趕得上。他靠的不是「知道」，是「相信」。相信再跑一段，門就還沒關。",
];

/* 沒過關鉤子：失敗不是 game over，是把拔永遠不會放棄（EP36）。5 句輪播，避免重複。 */
var FAIL_HOOKS = [
  "這一班沒趕上沒關係。他從來不會因為一次沒趕上就不跑了，下一班車，他還會在月台上等。",
  "他停下來喘了兩口氣，把包重新背好。把拔的字典裡，沒有「放棄」這兩個字。",
  "門關上了，可是那條線一點都沒鬆。他轉身往回走，準備下一次再用力地跑。",
  "列車開走了，月台還在。只要他還願意這樣跑，就沒有真正的錯過。",
  "他沒趕上的背影，我記得最清楚。但他從來沒有蹲太久就站起來。我再陪他跑一次。",
];
var _failIdx = 0;

function showLevelTransition() {
  /* 把拔的回憶（LEVEL_HOOK）顯示期間凍結模擬：時間永遠暫停，過場結束（advanceToNextLevel）才解凍 */
  state.transitionFreeze = true;
  /* 第 9→10 關專屬電影化最終警告（韓劇導演級過場） */
  if (state.currentLevel === 9) {
    showFinalLevelWarning();
    return;
  }
  dom.levelClearText.textContent = "\u7B2C " + state.currentLevel + " \u95DC \u904E\u95DC\uFF01";
  dom.levelNextText.textContent = "\u5373\u5C07\u9032\u5165\u7B2C " + (state.currentLevel + 1) + " \u95DC...";
  /* Re-trigger animation by cloning */
  var clearClone = dom.levelClearText.cloneNode(true);
  dom.levelClearText.parentNode.replaceChild(clearClone, dom.levelClearText);
  dom.levelClearText = clearClone;
  var nextClone = dom.levelNextText.cloneNode(true);
  dom.levelNextText.parentNode.replaceChild(nextClone, dom.levelNextText);
  dom.levelNextText = nextClone;
  /* 過關鉤子：倒敘情感台詞（依關數 1-indexed）+ clone 重播淡入動畫 */
  if (dom.levelHookText) {
    dom.levelHookText.textContent = LEVEL_HOOKS[(state.currentLevel - 1) % LEVEL_HOOKS.length] || "";
    var hookClone = dom.levelHookText.cloneNode(true);
    dom.levelHookText.parentNode.replaceChild(hookClone, dom.levelHookText);
    dom.levelHookText = hookClone;
  }

  dom.levelTransition.classList.add("show");
  document.body.classList.remove("letterbox-on");

  safeSetTimeout(function() {
    dom.levelTransition.classList.remove("show");
    advanceToNextLevel();
  }, 3600);
}

/* ════════════════════════════════════════════════
   最終關卡警告：第 9→10 關電影化過場（韓劇導演級）
   時間線：
     0.0s  overlay 淡入、黑邊滑入
     0.4s  STAGE 9 · CLEARED
     1.0s  「10」從模糊放大聚焦
     1.8s  FINAL RUN · 最終關卡
     2.2s  金色分隔線左右拉開
     2.6s  為了抱起女兒
     3.3s  請用盡所有的力氣
     4.0s  狂 奔 吧！（爆發 + 紅暈震動）
     4.7s  紅色底線延展
     6.4s  advanceToNextLevel()
   ════════════════════════════════════════════════ */
function showFinalLevelWarning() {
  /* Clone overlay to restart CSS animations (defensive, same pattern as showLevelTransition) */
  var overlay = dom.finalLevelWarning;
  var clone = overlay.cloneNode(true);
  overlay.parentNode.replaceChild(clone, overlay);
  dom.finalLevelWarning = clone;

  clone.classList.add("show");
  document.body.classList.remove("letterbox-on");

  /* Duck BGM for dramatic breath */
  var prevVolume = bgm.volume;
  try { bgm.volume = 0.12; } catch (e) {}

  /* Cinematic heartbeats — slow opener, then accelerating toward climax */
  var beatTimings = [2400, 3150, 3850, 4150, 4450];
  var beatTimers = [];
  for (var bi = 0; bi < beatTimings.length; bi++) {
    (function(ms, idx) {
      beatTimers.push(safeSetTimeout(function() {
        ptVibe(idx < 3 ? 30 : 55); // 心跳震動,越後面越重(對齊 amp 漸強)
        if (!audioCtx) return;
        var now = audioCtx.currentTime;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(62, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);
        /* Later beats grow louder */
        var amp = 0.35 + idx * 0.04;
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }, ms));
    })(beatTimings[bi], bi);
  }

  /* Vignette red flash on climax */
  var vignetteTimer = safeSetTimeout(function() {
    ptVibe([60, 40, 160]); // 「狂奔吧！」爆發點:聲光震同時砸下
    if (dom.vignette) {
      dom.vignette.style.transition = "opacity 0.15s";
      dom.vignette.style.opacity = "0.9";
      safeSetTimeout(function() {
        if (dom.vignette) dom.vignette.style.opacity = "0";
      }, 600);
    }
  }, 4450);

  /* Auto-advance after full sequence */
  safeSetTimeout(function() {
    clone.classList.remove("show");
    try { bgm.volume = prevVolume; } catch (e) {}
    advanceToNextLevel();
  }, 6400);
}

function advanceToNextLevel() {
  state.transitionFreeze = false; // 過場（把拔的回憶）結束，解凍，下一關開始才讓時間重新流動
  state.currentLevel++;
  /* Grant +1 ultimate charge per level */
  state.ultimateCharges++;

  /* toni r17d:主線關鍵點自動浮現一段完整的把拔回憶 — 進第 2 關=父親節注音(tracing,小時候)、進第 5 關=不能穿越(cantTravel,長大後的距離)。
     各一次/局(resetGame 重置旗標),原本這 5 段只有手動點「💭 把拔的回憶」才看得到,主線永遠播不到。runChain 自帶暫停+逃生 watchdog,不會卡死。 */
  try {
    var _vig = { 2: "tracing", 5: "cantTravel" }[state.currentLevel];
    state._vigPlayed = state._vigPlayed || {};
    if (_vig && !state._vigPlayed[_vig] && window.__PACTS__ && window.__PACTS__.runChain) {
      state._vigPlayed[_vig] = true;
      safeSetTimeout(function () { try { window.__PACTS__.runChain([_vig], function () { }); } catch (e) { } }, 900);
    }
  } catch (e) { }

  /* Reset per-level state but keep carry-overs */
  state.phase = "title";
  if (window.__LEVEL_MECHANICS__) window.__LEVEL_MECHANICS__.deactivate();
  state.clock = 0;
  state.timeLeft = GAME_TIME;
  state.sprint = SPRINT_MAX;
  state.playerZ = PLATFORM_LEN / 2 - 10;
  state.playerX = 0;
  state.sprinting = false;
  state.gotDaughter = false;
  state.grabSlow = 0;
  state.introTimer = 0;
  state.narrTimer = 0;
  state.cameraShake = 0;
  state.heartRate = 60;
  state.trainSouthArrived = false;
  state.trainNorthArrived = false;
  state.trainNorthDoorOpen = false;
  state.trainNorthLeaving = false;
  state.doorPhase = 0;

  /* Carry over buff timers */
  state.riceBallTimer = state.carryRiceBall;
  state.coffeeTimer = state.carryCoffee;
  state.ultimateTimer = state.carryUltimate;
  state.collisionSlowTimer = 0;
  state.pickupNotifyTimer = 0;
  sprint2HintShown = false;

  /* Reset per-level items counter */
  state.itemsCollected = 0;

  /* Jump reset */
  state.jumpY = 0;
  state.jumpVel = 0;
  state.isJumping = false;
  state.wasJumping = false;
  state.luggageSlowTimer = 0;
  state.barrierHintShown = false;

  /* Victory reset */
  state.victoryTimer = 0;
  state.victoryPhase = 0;
  state.victoryDoorX = 0;
  state.victoryDoorZ = 0;
  state._victoryHandled = false;
  father.visible = true;

  /* Audio */
  nextBeat = 0;
  stopAmbientSounds();

  /* Ultimate effects cleanup */
  if (fatherGlowLight && fatherGlowLight.parent) { father.remove(fatherGlowLight); fatherGlowLight = null; }
  for (var upi = ultimateParticles.length - 1; upi >= 0; upi--) {
    if (ultimateParticles[upi].parent) scene.remove(ultimateParticles[upi]);
    ultimateParticles[upi].geometry.dispose();
    ultimateParticles[upi].material.dispose();
  }
  ultimateParticles = [];
  if (ultimateShockwave && ultimateShockwave.parent) {
    scene.remove(ultimateShockwave);
    ultimateShockwave.geometry.dispose();
    ultimateShockwave.material.dispose();
    ultimateShockwave = null;
  }
  dom.goldFlash.style.opacity = "0";
  dom.goldFlash.style.background = "radial-gradient(ellipse at center,rgba(255,215,0,0.5) 0%,transparent 70%)";
  document.body.style.filter = "";
  ultimateScreenPhase = 0;
  ultimateTrailTimer = 0;

  /* Position resets */
  father.position.set(0, FATHER_BASE_Y, state.playerZ);
  father.rotation.set(0, 0, 0);
  if (daughter.parent === father) { father.remove(daughter); scene.add(daughter); }
  daughter.position.set(1, 0, DAUGHTER_Z);

  /* Train positions */
  trainSouth.position.z = PLATFORM_LEN;
  trainNorth.position.z = -PLATFORM_LEN;

  /* Reset NPCs */
  for (var ni = 0; ni < npcs.length; ni++) {
    npcs[ni].position.x = npcs[ni].userData.baseX;
    npcs[ni].position.z = npcs[ni].userData.baseZ;
    npcs[ni].userData.wobblePhase = Math.random() * Math.PI * 2;
  }

  /* Rebuild guards with new level count */
  state.guardSlowTimer = 0;
  createGuards();

  /* Recreate power-ups and luggage with new barrier count */
  resetPowerups();
  resetLuggage();

  if (doorMarker) doorMarker.visible = false;

  /* Clear inputs */
  for (var key in keys) keys[key] = false;
  touchJoyX = 0; touchJoyY = 0; touchSprinting = false; touchJumping = false;
  dom.joystickKnob.style.transform = "translate(-50%,-50%)";

  /* DOM resets */
  dom.result.classList.remove("show");
  dom.resultBody.textContent = "";
  dom.vignette.style.opacity = "0";
  dom.timerText.style.color = "#c0392b";
  dom.narrText.classList.remove("show");
  dom.pickupNotify.classList.remove("show");
  dom.goldFlash.style.opacity = "0";
  dom.buffIndicators.style.display = "none";
  dom.buffIndicators.textContent = "";
  dom.nameInputWrap.classList.remove("show");
  dom.leaderboardPanel.classList.remove("show");
  document.body.classList.remove("letterbox-on");

  /* Update level display */
  dom.levelText.textContent = "\u7B2C " + state.currentLevel + " \u95DC";
  updateUltimateUI();

  footstepTimer = 0;
  introScreechPlayed = false;

  /* Skip title screen — go directly to intro */
  dom.title.style.display = "none";
  startIntro();
}

/* ════════════════════════════════════════════════
   隱藏結局（第10關通過後）
   ════════════════════════════════════════════════ */
function startHiddenEnding() {
  state.phase = "hidden_ending";
  if (window.__LEVEL_MECHANICS__) window.__LEVEL_MECHANICS__.deactivate();
  state.hiddenEndingPhase = 0;
  state.hiddenEndingTimer = 0;
  document.body.classList.remove("letterbox-on");
}

function updateHiddenEnding(dt) {
  state.hiddenEndingTimer += dt;
  var t = state.hiddenEndingTimer;

  /* Phase 0 (0-3s): Fade to black */
  if (state.hiddenEndingPhase === 0) {
    dom.hiddenEnding.classList.add("show");
    dom.hiddenEnding.style.opacity = Math.min(1, t / 2);
    if (t >= 3) {
      state.hiddenEndingPhase = 1;
      state.hiddenEndingTimer = 0;
      dom.hiddenEnding.style.opacity = "1";
      dom.hiddenEndingText.textContent = "\u3105\u311A\u02C7 \u3105\u311A\u02CA \u3128\u311B\u02C7 \u310F\u3128\u311F\u02CB \u3112\u3127\u3124\u02C7 \u310B\u3127\u02C7 \u3109\u311C\u02D9";
    }
  }

  /* Phase 1 (0-10s): Yellow text fade in, hold, fade out */
  if (state.hiddenEndingPhase === 1) {
    t = state.hiddenEndingTimer;
    if (t < 2) {
      /* Fade in */
      dom.hiddenEndingText.style.opacity = Math.min(1, t / 2);
      dom.hiddenEndingText.classList.add("show");
    } else if (t < 8) {
      /* Hold */
      dom.hiddenEndingText.style.opacity = "1";
    } else if (t < 10) {
      /* Fade out */
      dom.hiddenEndingText.style.opacity = Math.max(0, 1 - (t - 8) / 2);
    }

    if (t >= 10) {
      state.hiddenEndingPhase = 2;
      state.hiddenEndingTimer = 0;
      dom.hiddenEndingText.style.opacity = "0";
      dom.hiddenEnding.classList.remove("show");
      /* B: 注音之後，播「多年後回望」vignette，再開結算 */
      if (window.__PACTS__ && window.__PACTS__.yearsLater) {
        window.__PACTS__.yearsLater(function () { showFinalResult(); });
      } else {
        showFinalResult();
      }
    }
  }
}

function showFinalResult() {
  state.phase = "final_result";
  if (window.__LEVEL_MECHANICS__) window.__LEVEL_MECHANICS__.deactivate();
  dom.result.classList.add("show");
  dom.resultTitle.textContent = "\u5168\u90E8\u904E\u95DC\uFF01";
  dom.resultBody.textContent = "";
  /* \u7A4D\u6975 emotion\uFF1A\u7D50\u7B97\u5148\u7D66\u4E00\u53E5\u60C5\u7DD2\uFF0C\u518D\u5217\u6578\u5B57 \u2014 \u8B93\u901A\u95DC\u50CF\u6545\u4E8B\u7684\u4E00\u523B\uFF0C\u4E0D\u53EA\u662F\u5206\u6578 */
  /* \u4E09\u6BB5\u63A5\u529B ending \u8499\u592A\u5947\uFF1AC \u5148\u642D\u597D\u90A3\u7247\u5929\u7A7A \u2192 B \u96F6\u79D2\u5DEE \u2192 A \u9084\u662F\u76F8\u4FE1\uFF08\u4F9D\u5E8F\u6DE1\u5165\uFF0C\u843D\u5728\u300C\u76F8\u4FE1\u300D\uFF09 */
  try {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var opening = "（許多年後，女兒站在每一條時間線的上方，往下看著那個總是在奔跑的把拔。）";
    var stanzas = [
      { k: "女兒看著 2013・台北捷運男廁", t: "沒有尿布台，他就用兩隻手臂替妳撐出一座橋；沒有多的時間，他就用全部的力氣去換那三十秒。這個世界很少先為他準備好什麼，他卻把每一個「沒有準備好」，都跑成了妳的理所當然。" },
      { k: "女兒看著 2025・台中的夜", t: "火車可以開走，城市可以把你們隔開，那條粉紅色的線卻從來沒有量過距離。妳在輸入欄一個字一個字打著想念，他的那一句卻先一步抵達。" },
      { k: "女兒多年後才看懂・2018 月台", t: "沒有一班車承諾過會等他，他還是一次又一次往快關上的門狂奔。多年後妳才看懂，那個喘著氣的笑，他把它叫做相信。而今天，換妳在門關上前先伸手，接住他那句先一步到的「我也想妳」。" }
    ];
    var emoWrap = document.createElement("div");
    emoWrap.style.cssText = 'margin:2px 0 16px;padding:14px 16px;border-left:2px solid rgba(228,70,80,0.45);background:rgba(228,70,80,0.06);border-radius:2px;text-align:left;';
    var op = document.createElement("div");
    op.textContent = opening;
    op.style.cssText = 'font-family:"Noto Serif TC",serif;font-size:13px;line-height:1.85;letter-spacing:0.04em;color:rgba(248,224,216,0.7);margin-bottom:4px;' + (reduce ? "" : "opacity:0;transition:opacity 1.1s ease;");
    emoWrap.appendChild(op);
    if (!reduce) safeSetTimeout(function () { op.style.opacity = "1"; }, 350);
    stanzas.forEach(function (st, i) {
      var kk = document.createElement("div");
      kk.textContent = "〔" + st.k + "〕";
      kk.style.cssText = 'font-family:"Noto Sans TC",sans-serif;font-size:11px;letter-spacing:0.18em;color:rgba(248,168,152,0.78);' + "margin-top:" + (i > 0 ? "14px" : "10px") + ";" + (reduce ? "" : "opacity:0;transition:opacity 1.1s ease;");
      var p = document.createElement("div");
      p.textContent = st.t;
      p.style.cssText = 'font-family:"Noto Serif TC",serif;line-height:1.9;font-size:14px;letter-spacing:0.04em;color:rgba(244,222,210,0.92);margin-top:5px;' + (reduce ? "" : "opacity:0;transform:translateY(6px);transition:opacity 1.1s ease,transform 1.1s ease;");
      emoWrap.appendChild(kk);
      emoWrap.appendChild(p);
      if (!reduce) {
        safeSetTimeout(function () { kk.style.opacity = "1"; }, 900 + i * 2400);
        safeSetTimeout(function () { p.style.opacity = "1"; p.style.transform = "none"; }, 1120 + i * 2400);
      }
    });
    dom.resultBody.appendChild(emoWrap);
  } catch (e_emo) {}
  var totalAvg = state.levelTimes.length > 0 ? (state.totalTimeBank / state.levelTimes.length) : 0;
  var fastest = state.levelTimes.length > 0 ? Math.min.apply(null, state.levelTimes) : 0;
  var scoreC = Math.round((state.totalTimeBank + state.totalItemsBank) * 10) / 10;
  var lines = [
    "\u904E\u95DC\u7D00\u9304\uFF1A\u7B2C " + state.currentLevel + " \u95DC",
    "\u6700\u5FEB\u904E\u95DC\uFF1A" + fastest.toFixed(1) + " \u79D2",
    "\u7E3D\u5269\u9918\u79D2\u6578\uFF1A" + state.totalTimeBank.toFixed(1) + " \u79D2",
    "\u5E73\u5747\u904E\u95DC\uFF1A" + totalAvg.toFixed(1) + " \u79D2",
    "\u7E3D\u5BF6\u7269\uFF1A" + state.totalItemsBank,
    "\u7E3D\u5206\uFF1A" + scoreC
  ];
  lines.forEach(function(line) {
    var el = document.createElement("div");
    el.textContent = line;
    dom.resultBody.appendChild(el);
  });
  /* Name input for leaderboard */
  dom.nameInputWrap.classList.add("show");
  dom.nameInput.value = "";
  dom.nameInput.readOnly = false;
  dom.saveScoreBtn.disabled = false;
  dom.saveScoreBtn.textContent = "\u8A18\u9304\u6210\u7E3E";
  lastSavedHighlight = -1;
  /* Change retry text */
  dom.resultRetry.textContent = "\u518D\u73A9\u4E00\u6B21";

  /* A5 — Steam-3 manual: 月台 10 關通關後加 button「→ 進入 LM402 一眼瞬間」 */
  try {
    if (!document.getElementById('pt-bridge-lm402')) {
      var bridge = document.createElement('a');
      bridge.id = 'pt-bridge-lm402';
      bridge.href = '../../lm402.html?from=platform';
      bridge.textContent = '→ 進入 LM402 一眼瞬間';
      bridge.style.cssText = 'display:inline-block;margin-top:24px;padding:11px 30px;background:linear-gradient(135deg,rgba(228,70,80,0.18),rgba(170,31,45,0.10));border:1px solid rgba(228,70,80,0.55);border-radius:2px;color:rgba(248,168,152,0.96);font-family:"Cormorant Garamond","Noto Serif TC",serif;font-size:14px;letter-spacing:0.22em;text-indent:0.22em;text-decoration:none;cursor:pointer;transition:background 0.3s ease;';
      bridge.addEventListener('mouseover', function () { bridge.style.background = 'linear-gradient(135deg,rgba(228,70,80,0.32),rgba(170,31,45,0.20))'; });
      bridge.addEventListener('mouseout', function () { bridge.style.background = 'linear-gradient(135deg,rgba(228,70,80,0.18),rgba(170,31,45,0.10))'; });
      var bridgeWrap = document.createElement('div');
      bridgeWrap.style.cssText = 'text-align:center;margin-top:8px;';
      bridgeWrap.appendChild(bridge);
      var bridgeHint = document.createElement('div');
      bridgeHint.textContent = '30 秒的擁抱，帶你回到 2005 年的這一秒。';
      bridgeHint.style.cssText = 'margin-top:10px;font-size:11px;color:rgba(218,184,168,0.62);letter-spacing:0.18em;font-family:"Noto Serif TC",serif;';
      bridgeWrap.appendChild(bridgeHint);
      dom.resultBody.appendChild(bridgeWrap);
    }
  } catch (e_bridge) {
    console.warn('[bridge] platform→lm402 button setup failed:', e_bridge && e_bridge.message);
  }
}

function failure() {
  state.phase = "fail";
  if (dom.resultRetry) dom.resultRetry.textContent = "再拚這一關";
  if (window.__LEVEL_MECHANICS__) window.__LEVEL_MECHANICS__.deactivate();
  state.trainNorthLeaving = true;
  document.body.classList.add("letterbox-on");
  dom.hud.style.display = "none";
  dom.sprintWrap.style.display = "none";
  dom.vignette.style.opacity = "0";
  dom.buffIndicators.style.display = "none";
  if (isMobile) {
    dom.touchCtrl.style.display = "none";
    dom.sprintBtn.style.display = "none";
    dom.jumpBtn.style.display = "none";
    dom.ultimateBtn.style.display = "none";
    dom.ultimateCount.style.display = "none";
  }
  showNarrative("\u8ECA\u9580\u95DC\u4E0A\u4E86\u2026\u2026", 4);
  ptVibe([130, 90, 40]); // \u4E00\u8A18\u91CD\u60B6\u95DC\u9580\u649E\u64CA + \u9918\u9707:\u628A\u300C\u9580\u5728\u4F60\u9762\u524D\u95DC\u4E0A\u300D\u91D8\u9032\u624B\u5FC3
  stopAmbientSounds();

  /* BGM continues — do NOT pause */

  safeSetTimeout(function() {
    dom.result.classList.add("show");
    dom.resultTitle.textContent = "\u9019\u4E00\u73ED\uFF0C\u6C92\u8D95\u4E0A";
    dom.resultBody.textContent = "";
    var failLines = [
      "\u7B2C " + state.currentLevel + " \u95DC\u5931\u6557",
      state.levelTimes.length > 0 ? "\u5DF2\u904E " + state.levelTimes.length + " \u95DC" : "",
      "",
      FAIL_HOOKS[_failIdx % FAIL_HOOKS.length]
    ];
    _failIdx++;
    failLines.forEach(function(line) {
      var el = document.createElement("div");
      el.textContent = line || "\u00A0";
      dom.resultBody.appendChild(el);
    });
    /* On failure: show name input for partial record */
    if (state.levelTimes.length > 0) {
      /* Player cleared at least 1 level — record it */
      dom.nameInputWrap.classList.add("show");
      dom.nameInput.value = "";
      dom.nameInput.readOnly = false;
      dom.saveScoreBtn.disabled = false;
      dom.saveScoreBtn.textContent = "\u8A18\u9304\u6210\u7E3E";
      lastSavedHighlight = -1;
    } else {
      dom.nameInputWrap.classList.remove("show");
    }
    /* 失敗重試保留本關（resetGame "level"） */
    dom.resultRetry.textContent = "再拚這一關";
  }, 4000);
}

/* ════════════════════════════════════════════════
   攝影機系統
   ════════════════════════════════════════════════ */
const camTarget = new THREE.Vector3();
const camPos    = new THREE.Vector3();

function updateCamera(dt) {
  if (state.phase === "intro") return;

  if (state.phase === "running" || state.phase === "sprint2") {
    /* 韓影慢推軌：越接近女兒（__PT_BOND__ 0→1）鏡頭越貼越低，
       與紅線色溫條同源驅動，整段跑程是一個連續的 push-in */
    const bond = (typeof window !== "undefined" && window.__PT_BOND__) || 0;
    const behind = 6 - bond * 1.6;
    const height = 3.5 - bond * 0.7;
    const fovTarget = state.sprinting ? 68 : 58;
    camera.fov = THREE.MathUtils.lerp(camera.fov, fovTarget, dt * 3);
    camera.updateProjectionMatrix();

    camPos.set(
      father.position.x * 0.3,
      height,
      father.position.z + behind
    );
    camTarget.set(father.position.x, 1.2, father.position.z - 8);

    camera.position.lerp(camPos, dt * 5);
    camera.lookAt(camTarget);

    if (state.cameraShake > 0) {
      camera.position.x += (Math.random() - 0.5) * state.cameraShake * 0.1;
      camera.position.y += (Math.random() - 0.5) * state.cameraShake * 0.05;
      state.cameraShake *= 0.9;
      if (state.cameraShake < 0.01) state.cameraShake = 0;
    }
  }

  if (state.phase === "grabbed") {
    /* 抱起瞬間 1.6 秒環繞收特寫：從追逐後側 90° 掃到前側、收近收低，
       與 catchMoment DOM 定格同步，完成「30 秒擁抱」的視覺權重 */
    state.grabOrbit = (state.grabOrbit || 0) + dt;
    const gk = Math.min(1, state.grabOrbit / 1.6);
    const gEase = gk * gk * (3 - 2 * gk);
    const gAng = -Math.PI / 4 + gEase * (Math.PI * 0.75);
    const gR = 2.8 - 1.1 * gEase;
    camPos.set(
      father.position.x + Math.sin(gAng) * gR,
      2 - 0.55 * gEase,
      father.position.z + Math.cos(gAng) * gR
    );
    camera.position.lerp(camPos, dt * 3.2);
    camera.lookAt(father.position.x, 1 + 0.2 * gEase, father.position.z);
  } else if (state.grabOrbit) {
    state.grabOrbit = 0;
  }

  if (state.phase === "victory") {
    if (state.victoryPhase <= 1) {
      /* Orbit around father as he boards —
         韓影收尾：起手快、漸慢漸近漸低（等速圓周 → smoothstep 緩動） */
      var vT = Math.min(1, state.victoryTimer / 6);
      var vEase = vT * vT * (3 - 2 * vT);
      var vAngle = state.victoryTimer * (0.42 - 0.2 * vEase);
      var vR = 5 - 1.2 * vEase;
      camPos.set(
        father.position.x + Math.cos(vAngle) * vR,
        2.5 - 0.6 * vEase,
        father.position.z + Math.sin(vAngle) * vR
      );
      camera.position.lerp(camPos, dt * 2);
      camera.lookAt(father.position.x, 1.2 + 0.15 * vEase, father.position.z);
    } else {
      /* Watch train leave */
      camPos.set(trainNorth.position.x - 5, 4, trainNorth.position.z + 8);
      camera.position.lerp(camPos, dt * 1.5);
      camera.lookAt(trainNorth.position.x, 2, trainNorth.position.z);
    }
  }

  if (state.phase === "fail") {
    camPos.set(father.position.x, 4, father.position.z + 12);
    camera.position.lerp(camPos, dt * 1);
    camera.lookAt(trainNorth.position.x, 2, trainNorth.position.z);
  }
}

/* ════════════════════════════════════════════════
   NPC 微動 + idle animation
   ════════════════════════════════════════════════ */
function updateNPCs(dt) {
  /* Level-based NPC roaming: from level 2+, NPCs move freely
     Range = 0.2 * (level - 1) person widths per axis */
  var npcRoamRange = state.currentLevel >= 2 ? 0.2 * (state.currentLevel - 1) : 0;

  for (var ni = 0; ni < npcs.length; ni++) {
    var npc = npcs[ni];
    var d = npc.userData;
    d.wobblePhase += d.wobbleSpeed * dt;

    if (npcRoamRange > 0) {
      /* Free roaming: wander around baseX/baseZ within range */
      if (!d.roamTargetX) {
        d.roamTargetX = d.baseX;
        d.roamTargetZ = d.baseZ;
        d.roamTimer = 0;
      }
      d.roamTimer -= dt;
      if (d.roamTimer <= 0) {
        d.roamTargetX = d.baseX + (Math.random() - 0.5) * 2 * npcRoamRange;
        d.roamTargetZ = d.baseZ + (Math.random() - 0.5) * 2 * npcRoamRange;
        /* Clamp to platform bounds */
        var halfW = PLATFORM_W / 2 - 1;
        d.roamTargetX = Math.max(-halfW, Math.min(halfW, d.roamTargetX));
        d.roamTimer = 2 + Math.random() * 4;
      }
      npc.position.x += (d.roamTargetX - npc.position.x) * dt * 1.5;
      npc.position.z += (d.roamTargetZ - npc.position.z) * dt * 1.5;

      /* 月台邊界限制：NPC 絕不超出月台 */
      var npcHalfW = PLATFORM_W / 2 - 0.8;
      var npcHalfZ = PLATFORM_LEN / 2 - 3;
      npc.position.x = Math.max(-npcHalfW, Math.min(npcHalfW, npc.position.x));
      npc.position.z = Math.max(-npcHalfZ, Math.min(npcHalfZ, npc.position.z));

      /* Walking leg animation when moving */
      var isNpcMoving = Math.abs(d.roamTargetX - npc.position.x) > 0.05 || Math.abs(d.roamTargetZ - npc.position.z) > 0.05;
      var sway = isNpcMoving ? Math.sin(d.wobblePhase * 3) * 0.2 : Math.sin(d.wobblePhase * 1.5) * 0.08;
      if (d.leftLeg) d.leftLeg.rotation.x = sway;
      if (d.rightLeg) d.rightLeg.rotation.x = -sway;
      if (d.leftArm) d.leftArm.rotation.x = -sway * 0.5;
      if (d.rightArm) d.rightArm.rotation.x = sway * 0.5;
    } else {
      /* Original idle wobble */
      npc.position.x = d.baseX + Math.sin(d.wobblePhase) * 0.15;
      var sway2 = Math.sin(d.wobblePhase * 1.5) * 0.08;
      if (d.leftLeg) d.leftLeg.rotation.x = sway2;
      if (d.rightLeg) d.rightLeg.rotation.x = -sway2;
      if (d.leftArm) d.leftArm.rotation.x = -sway2 * 0.5;
      if (d.rightArm) d.rightArm.rotation.x = sway2 * 0.5;

      /* 閒置模式也要限制月台邊界 */
      var idleHalfW = PLATFORM_W / 2 - 0.8;
      npc.position.x = Math.max(-idleHalfW, Math.min(idleHalfW, npc.position.x));
    }
  }

  /* NPC 之間互相推開（簡易分離力） */
  for (var a = 0; a < npcs.length; a++) {
    for (var b = a + 1; b < npcs.length; b++) {
      var ddx = npcs[a].position.x - npcs[b].position.x;
      var ddz = npcs[a].position.z - npcs[b].position.z;
      var dd = Math.sqrt(ddx * ddx + ddz * ddz);
      if (dd < 0.7 && dd > 0.001) {
        var sepForce = (0.7 - dd) * 0.3;
        npcs[a].position.x += (ddx / dd) * sepForce;
        npcs[a].position.z += (ddz / dd) * sepForce;
        npcs[b].position.x -= (ddx / dd) * sepForce;
        npcs[b].position.z -= (ddz / dd) * sepForce;
      }
    }
  }
}

/* ════════════════════════════════════════════════
   火車離站動畫
   ════════════════════════════════════════════════ */
function updateTrainLeave(dt) {
  if (state.trainNorthLeaving) {
    trainNorth.position.z += dt * 15;
  }
}

/* ════════════════════════════════════════════════
   畫質設定系統
   ════════════════════════════════════════════════ */
let qualityPanelOpen = false;

function buildQualityPanel() {
  dom.qualityPanel.textContent = "";
  QUALITY_PRESETS.forEach(function(p, idx) {
    const btn = document.createElement("button");
    btn.className = "quality-opt";
    if (idx === state.quality) btn.className += " active";
    btn.textContent = p.label;
    btn.addEventListener("click", function() {
      applyQuality(idx);
      buildQualityPanel();
    });
    dom.qualityPanel.appendChild(btn);
  });
}

/* 美術強化按畫質檔位自動接線(這批效果原本只有 console 後門,從未預設啟用):
   全部檔位:基礎氛圍燈(車頭燈/天花板燈,低強度 iOS 友善)
   高級(2)+:靜態升級(火車物理材質/月台磁磚/車身標示/站牌/NPC 多樣化)
   全開(3)+:密度與氛圍(城市天際線/月台道具/較亮燈光)
   完美(4):動態氛圍(蒸汽/濕地反射/熱浪)
   永不自動開:CAMERA_BREATH/FOOT_IK/NPC_MOTION(自帶 RAF 會跟主迴圈搶寫位置)、
   VIGNETTE/MONTAI_GRAIN(完美檔 postfx 已有同效,疊加過暗) */
let _artTierApplied = -1;
function applyArtTier(level) {
  if (level === _artTierApplied) return;
  _artTierApplied = level;
  try { if (window.__ART_RESET_EVERYTHING__) window.__ART_RESET_EVERYTHING__(); } catch (e) {}
  try { if (window.__CAMERA_BREATH_OFF__) window.__CAMERA_BREATH_OFF__(); } catch (e) {}
  /* 基礎氛圍燈(所有檔位,維持原 init 預設) */
  try { window.__TRAIN_HEADLIGHT__(level >= 3 ? 2.5 : 1.5, '#fff5d6'); } catch (e) {}
  try { window.__CEILING_LIGHTS__(6, level >= 3 ? 3.0 : 2.0); } catch (e) {}
  if (level >= 2) {
    try { window.__TRAIN_PHYSICAL__(0.85, 0.35, 0.4); } catch (e) {}
    try { window.__PLATFORM_TILE__(0.7); } catch (e) {}
    try { window.__TRAIN_DECALS__('自強號'); } catch (e) {}
    try { window.__PLATFORM_SIGN__('時光月台', '通往 2005'); } catch (e) {}
  }
  if (level >= 3) {
    try { window.__CITY_SKYLINE__(40, 80); } catch (e) {}
    /* PROP_VARIETY 不自動開:它在跑道內隨機撒無碰撞道具(穿越式幽靈模型),
       視覺上像 bug;留 console 後門 */
  }
  if (level >= 4) {
    try { window.__STEAM__(150, 0.7); } catch (e) {}
    try { window.__WET_FLOOR__(0.3); } catch (e) {}
    try { window.__HEAT_HAZE__(0.4); } catch (e) {}
  }
}
function applyQuality(level) {
  state.quality = level;
  const p = QUALITY_PRESETS[level];

  renderer.setPixelRatio(p.pixelRatio);
  renderer.shadowMap.enabled = p.shadows;
  if (p.shadowType) renderer.shadowMap.type = p.shadowType;

  mainLight.shadow.mapSize.set(p.shadowSize || 1024, p.shadowSize || 1024);
  mainLight.shadow.map = null;

  if (p.fog) {
    // 對齊 sunset envmap/背景（原 0xc8dff0 是白天藍霧，切畫質會閃回白天色調）
    scene.fog = new THREE.FogExp2(0xb09878, 0.0025);
  } else {
    scene.fog = null;
  }

  /* Rebuild NPCs if count changed */
  const currentCount = npcs.length;
  if (currentCount !== p.npcCount) {
    rebuildNPCs(p.npcCount);
  }

  renderer.setSize(window.innerWidth, window.innerHeight);

  /* 美術強化跟檔位走(在 NPC rebuild 之後套,NPC_VARIETY 才吃得到新 NPC) */
  applyArtTier(level);

  /* 電影後製跟檔位走：最高檔開、降檔（含 adaptive 自動降）即關 */
  setPostfxEnabled(level >= POSTFX_MIN_QUALITY);
  postfxSetSize();
}

dom.qualityBtn.addEventListener("click", function() {
  qualityPanelOpen = !qualityPanelOpen;
  if (qualityPanelOpen) {
    buildQualityPanel();
    dom.qualityPanel.classList.add("show");
  } else {
    dom.qualityPanel.classList.remove("show");
  }
});

/* ════════════════════════════════════════════════
   主迴圈
   ════════════════════════════════════════════════ */
const gameClock = new THREE.Clock();

/* adaptive 品質 auto-step DOWN — 弱機持續低 FPS 自動降一級(long cooldown 防 NPC rebuild flapping,只降不升,使用者可手動調回) */
const _padQ = { samples: [], cooldown: 0, enabled: true };

function animate() {
  requestAnimationFrame(animate);
  let dt = Math.min(gameClock.getDelta(), 0.033);
  if (state.grabSlow > 0) { state.grabSlow = Math.max(0, state.grabSlow - dt); dt *= 0.34; } // 抱到女兒的子彈時間：真實 dt 遞減，歸 0 後自動恢復全速
  /* B：看「把拔的回憶」時凍結模擬（計時、火車、移動全停），只續 render，避免時間到沒接到女兒的出戲。
     兩個來源：window.__RUN_PAUSED__（💭 把拔的回憶 launcher 回憶鏈）、state.transitionFreeze（關卡過場 LEVEL_HOOK 把拔每關回憶）。*/
  if (window.__RUN_PAUSED__ || state.transitionFreeze) { renderFrame(); return; }
  state.clock += dt;

  /* adaptive 品質:90 幀 window avg FPS < 40 → applyQuality 降一級,cooldown 300 幀防 flapping */
  if (_padQ.enabled) {
    _padQ.samples.push(dt > 0 ? 1 / dt : 60);
    if (_padQ.samples.length > 90) _padQ.samples.shift();
    if (_padQ.cooldown > 0) { _padQ.cooldown -= 1; }
    else if (_padQ.samples.length >= 90) {
      const _avg = _padQ.samples.reduce(function(a, b) { return a + b; }, 0) / _padQ.samples.length;
      if (_avg < 40 && state.quality > 0) { applyQuality(state.quality - 1); _padQ.cooldown = 300; _padQ.samples.length = 0; }
    }
  }

  mainLight.position.set(father.position.x + 38, 26, father.position.z + 18); /* 同步午後斜陽角 */
  mainLight.target.position.copy(father.position);
  mainLight.target.updateMatrixWorld();
  warmFill.position.z = father.position.z;

  if (!state.gotDaughter && daughter.parent === scene) {
    const beaconLight = daughter.children.find(function(c) { return c.isLight; });
    if (beaconLight) beaconLight.intensity = 1.5 + Math.sin(state.clock * 4) * 0.8;
  }

  switch (state.phase) {
    case "intro":
      updateIntro(dt);
      updateDoors(dt);
      break;
    case "running":
    case "sprint2":
      updateGame(dt);
      updateDoors(dt);
      updateNPCs(dt);
      updateGuards(dt);
      updateCamera(dt);
      break;
    case "grabbed":
      updateDoors(dt);
      updateCamera(dt);
      break;
    case "victory":
      updateVictoryAnimation(dt);
      updateCamera(dt);
      updateDoors(dt);
      break;
    case "fail":
      updateTrainLeave(dt);
      updateDoors(dt);
      updateCamera(dt);
      break;
    case "hidden_ending":
      updateHiddenEnding(dt);
      break;
  }

  updateNarrative(dt);
  /* 倒數緊迫感 → 後製連動（雙向平滑：進 victory/fail 會自動衰減回基準）
     最壞疊加 guard：門紅閃 + DOM 紅暈同時最大時，chroma 上限 0.0022 仍遠低於
     console 建議區間下緣 0.002~0.006 的中值，vignette 增幅 0.10 不致黑框。 */
  if (postfxOn && postfx) {
    const fxU =
      (state.phase === "running" || state.phase === "sprint2") && state.timeLeft < 10
        ? 1 - Math.max(0, state.timeLeft) / 10
        : 0;
    state._fxUrgency = (state._fxUrgency || 0) + (fxU - (state._fxUrgency || 0)) * Math.min(1, dt * 4);
    postfx.tuning.chroma.strength = state._fxUrgency * 0.0022;
    postfx.tuning.vignette.darkness = 0.32 + state._fxUrgency * 0.1;
  }
  renderFrame();
}

/* ════════════════════════════════════════════════
   初始化與事件
   ════════════════════════════════════════════════ */
function init() {
  buildPlatform();
  buildBackground();
  setupTrains();
  buildCharacters();
  createGuards();
  spawnPowerups();
  spawnLuggage();
  createDoorMarker();
  detectMobile();
  buildQualityPanel();
  /* 標題畫面個人最佳 */
  updateTitleBest();
  /* 美術強化初始接線(檔位分級,含基礎氛圍燈) */
  applyArtTier(state.quality);
  /* 電影後製初始檔位判定(桌機預設「完美」→ 啟用) */
  setPostfxEnabled(state.quality >= POSTFX_MIN_QUALITY);
  animate();
}

function resetGame(keepCarryState) {
  state.transitionFreeze = false; // 防卡：重置遊戲一定解凍
  if (keepCarryState !== "level") state._vigPlayed = {};   // 從第 1 關重來(新局 / 全破重啟)就重置自動回憶旗標,讓主線回憶下次再播;失敗重拚同關不重播
  /* Level system reset */
  if (keepCarryState === "level") {
    /* 失敗重試：保留關卡與已存進度，重拚本關（不再整場歸零） */
  } else if (!keepCarryState) {
    state.currentLevel = 1;
    state.totalTimeBank = 0;
    state.totalItemsBank = 0;
    state.levelTimes = [];
    state.ultimateCharges = 1;
    state.carryRiceBall = 0;
    state.carryCoffee = 0;
    state.carryUltimate = 0;
  } else {
    /* After full clear (10 levels), restart from level 1 but keep carry state */
    state.currentLevel = 1;
    state.totalTimeBank = 0;
    state.totalItemsBank = 0;
    state.levelTimes = [];
    /* Keep ultimateCharges and carry buffs */
  }

  /* Core state reset */
  state.phase = "title";
  state.clock = 0;
  state.timeLeft = GAME_TIME;
  state.sprint = SPRINT_MAX;
  state.playerZ = PLATFORM_LEN / 2 - 10;
  state.playerX = 0;
  state.sprinting = false;
  state.gotDaughter = false;
  state.grabSlow = 0;
  state.introTimer = 0;
  state.narrTimer = 0;
  state.cameraShake = 0;
  state.heartRate = 60;
  state.trainSouthArrived = false;
  state.trainNorthArrived = false;
  state.trainNorthDoorOpen = false;
  state.trainNorthLeaving = false;
  state.doorPhase = 0;

  /* Power-up state reset */
  state.riceBallTimer = keepCarryState ? state.carryRiceBall : 0;
  state.coffeeTimer = keepCarryState ? state.carryCoffee : 0;
  state.collisionSlowTimer = 0;
  state.ultimateTimer = keepCarryState ? state.carryUltimate : 0;
  state.pickupNotifyTimer = 0;
  sprint2HintShown = false;

  /* Jump state reset */
  state.jumpY = 0;
  state.jumpVel = 0;
  state.isJumping = false;
  state.wasJumping = false;

  /* Luggage/barrier state reset */
  state.luggageSlowTimer = 0;
  state.barrierHintShown = false;

  /* Victory animation reset */
  state.victoryTimer = 0;
  state.victoryPhase = 0;
  state.victoryDoorX = 0;
  state.victoryDoorZ = 0;
  state._victoryHandled = false;
  state.hiddenEndingPhase = 0;
  state.hiddenEndingTimer = 0;
  father.visible = true;

  /* Leaderboard state reset */
  state.itemsCollected = 0;
  lastSavedHighlight = -1;

  /* Audio reset — do NOT touch bgm */
  nextBeat = 0;
  /* BGM continues, never paused on reset */

  /* Stop ambient sounds */
  stopAmbientSounds();

  /* Father glow cleanup */
  if (fatherGlowLight && fatherGlowLight.parent) {
    father.remove(fatherGlowLight);
    fatherGlowLight = null;
  }

  /* Ultimate effects cleanup */
  for (var upi = ultimateParticles.length - 1; upi >= 0; upi--) {
    if (ultimateParticles[upi].parent) scene.remove(ultimateParticles[upi]);
    ultimateParticles[upi].geometry.dispose();
    ultimateParticles[upi].material.dispose();
  }
  ultimateParticles = [];
  if (ultimateShockwave && ultimateShockwave.parent) {
    scene.remove(ultimateShockwave);
    ultimateShockwave.geometry.dispose();
    ultimateShockwave.material.dispose();
    ultimateShockwave = null;
  }
  dom.goldFlash.style.opacity = "0";
  dom.goldFlash.style.background = "radial-gradient(ellipse at center,rgba(255,215,0,0.5) 0%,transparent 70%)";
  document.body.style.filter = "";
  ultimateScreenPhase = 0;
  ultimateTrailTimer = 0;

  /* Position resets */
  father.position.set(0, FATHER_BASE_Y, state.playerZ);
  father.rotation.set(0, 0, 0);

  /* Restore daughter */
  if (daughter.parent === father) {
    father.remove(daughter);
    scene.add(daughter);
  }
  daughter.position.set(1, 0, DAUGHTER_Z);

  /* Train positions */
  trainSouth.position.z = PLATFORM_LEN;
  trainNorth.position.z = -PLATFORM_LEN;

  /* Reset NPC positions */
  for (const npc of npcs) {
    npc.position.x = npc.userData.baseX;
    npc.position.z = npc.userData.baseZ;
    npc.userData.wobblePhase = Math.random() * Math.PI * 2;
  }

  /* Reset guards */
  state.guardSlowTimer = 0;
  for (var gi = 0; gi < guards.length; gi++) {
    var g = guards[gi];
    var patrolRange = 10 + Math.random() * 20;
    g.position.z = g.userData.baseZ;
    g.position.x = g.userData.lineX;
    g.userData.patrolMin = g.userData.baseZ - patrolRange;
    g.userData.patrolMax = g.userData.baseZ + patrolRange;
    g.userData.patrolDir = Math.random() > 0.5 ? 1 : -1;
    g.userData.wanderX = 0;
    g.userData.wanderTarget = 0;
    g.userData.wanderTimer = Math.random() * 3;
  }

  /* Recreate power-ups and luggage */
  resetPowerups();
  resetLuggage();

  /* Door marker */
  if (doorMarker) doorMarker.visible = false;

  /* Clear keyboard states */
  for (const key in keys) keys[key] = false;
  touchJoyX = 0;
  touchJoyY = 0;
  touchSprinting = false;
  touchJumping = false;
  dom.joystickKnob.style.transform = "translate(-50%,-50%)";

  /* DOM resets */
  dom.result.classList.remove("show");
  dom.resultBody.textContent = "";
  dom.hud.style.display = "none";
  dom.sprintWrap.style.display = "none";
  dom.vignette.style.opacity = "0";
  dom.timerText.style.color = "#c0392b";
  dom.narrText.classList.remove("show");
  dom.pickupNotify.classList.remove("show");
  dom.goldFlash.style.opacity = "0";
  dom.buffIndicators.style.display = "none";
  dom.buffIndicators.textContent = "";
  dom.introSkip.style.display = "none";
  document.body.classList.remove("letterbox-on");

  /* Ultimate button reset */
  updateUltimateUI();

  /* Level UI reset */
  dom.levelText.textContent = "\u7B2C " + state.currentLevel + " \u95DC";
  dom.levelTransition.classList.remove("show");
  dom.hiddenEnding.classList.remove("show");
  dom.hiddenEndingText.style.opacity = "0";

  /* Rebuild guards for current level */
  createGuards();

  /* Leaderboard DOM reset */
  dom.nameInputWrap.classList.remove("show");
  dom.nameInputWrap.style.opacity = "";
  dom.nameInput.value = "";
  dom.nameInput.readOnly = false;
  dom.leaderboardPanel.classList.remove("show");

  /* Mobile UI fix: re-show mobile controls */
  if (isMobile) {
    dom.touchCtrl.style.display = "block";
    dom.sprintBtn.style.display = "block";
    dom.ultimateBtn.style.display = "block";
    dom.jumpBtn.style.display = "block";
    dom.ultimateCount.style.display = "block";
  }

  /* Title screen reset */
  dom.title.style.display = "flex";
  dom.title.classList.remove("hide");

  /* Force re-trigger animations by removing and re-adding children */
  const titleChildren = dom.title.children;
  for (let i = 0; i < titleChildren.length; i++) {
    const child = titleChildren[i];
    const clone = child.cloneNode(true);
    child.parentNode.replaceChild(clone, child);
  }

  /* 標題畫面個人最佳（節點重建後重新填值） */
  updateTitleBest();

  footstepTimer = 0;
  introScreechPlayed = false;
}

function startGameFromTitle() {
  if (dom.title.classList.contains("hide")) return; // 防重複觸發
  initAudio();
  /* Start BGM on first user gesture if not already started */
  if (!bgmStarted) {
    bgmStarted = true;
    bgm.currentTime = 0;
    bgm.volume = 0.3;
    bgm.muted = bgmMuted;
    bgm.play().catch(function() {});
  }
  dom.title.classList.add("hide");
  safeSetTimeout(function() {
    dom.title.style.display = "none";
    startIntro();
  }, 1200);
}
dom.title.addEventListener("click", startGameFromTitle);
dom.title.addEventListener("keydown", function(e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startGameFromTitle(); } });
dom.title.setAttribute("role", "button");
dom.title.setAttribute("tabindex", "0");
dom.title.setAttribute("aria-label", "點擊或按 Enter 開始月台上的狂奔");

/* 開場跳過鈕（看過一次完整開場後，startIntro 才會把它顯示出來） */
dom.introSkip.addEventListener("click", function() { skipIntro(); });
dom.introSkip.addEventListener("keydown", function(e) {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); skipIntro(); }
});

dom.resultRetry.addEventListener("click", function() {
  /* After level 10 clear: restart with carry state */
  if (state.phase === "final_result") {
    resetGame(true);
  } else {
    /* 失敗重試：保留本關進度，不繞回標題畫面，直接重拚這一關 */
    resetGame("level");
    dom.title.style.display = "none";
    dom.title.classList.add("hide");
    startIntro();
    skipIntro();
  }
});

/* ── 排行榜事件 ── */
/* Name input: only allow A-Z a-z and space */
dom.nameInput.addEventListener("input", function() {
  dom.nameInput.value = dom.nameInput.value.replace(/[^\u4e00-\u9fff\u3400-\u4dbfA-Za-z0-9 ]/g, "").slice(0, 10);
});

/* Save score button */
dom.saveScoreBtn.addEventListener("click", function() {
  if (state.phase !== "victory" && state.phase !== "fail" && state.phase !== "final_result") return;
  var name = dom.nameInput.value.replace(/[^\u4e00-\u9fff\u3400-\u4dbfA-Za-z0-9 ]/g, "").trim().slice(0, 10);
  if (!name) name = "\u73A9\u5BB6";
  /* For failure: record partial progress */
  var levelReached = state.currentLevel;
  var entries = addScore(name, levelReached, state.levelTimes, state.totalTimeBank, state.totalItemsBank);
  lastSavedHighlight = -1;
  var scoreC = Math.round((state.totalTimeBank + state.totalItemsBank) * 10) / 10;
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].name === name && entries[i].score === scoreC) {
      lastSavedHighlight = i;
      break;
    }
  }
  dom.saveScoreBtn.textContent = "\u2714 \u5DF2\u8A18\u9304";
  dom.saveScoreBtn.disabled = true;
  dom.nameInput.readOnly = true;
});

/* Show leaderboard panel */
dom.leaderboardBtn.addEventListener("click", function() {
  renderLeaderboard(lastSavedHighlight);
  dom.leaderboardPanel.classList.add("show");
});

/* Close leaderboard panel */
dom.lbClose.addEventListener("click", function() {
  dom.leaderboardPanel.classList.remove("show");
});

window.addEventListener("resize", function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  postfxSetSize();
});

init();

