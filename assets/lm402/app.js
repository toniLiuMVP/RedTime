import {
  STORAGE_KEYS,
  WORLD,
  PHASES,
  HOTSPOTS,
  MEMORY_FRAGMENTS,
  INTERACTIONS,
  INTRO_BEATS,
  ENDINGS,
  CINEMATIC_TIMELINE,
  MOBILE_DENSITY_PRESETS,
  stairsWarp,
} from "./data.js";
import { createLm402Scene, WORLD_SCALE } from "./renderer.js";
import { initPanelSystem, syncPanelSystem } from "./ui-panels.js";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const scale = (value) => value * WORLD_SCALE;

const PLAYER_RADIUS = scale(22);
const PLAYER_EYE_HEIGHT = 1.62;
const DESKTOP_LOOK_SPEED = 1.9;
const MOBILE_LOOK_SPEED = 1.68;
const DRAG_LOOK_SPEED_X = 0.0034;
const DRAG_LOOK_SPEED_Y = 0.0026;
const LOCK_LOOK_SPEED_X = 0.00165;
const LOCK_LOOK_SPEED_Y = 0.00152;
const MIN_PITCH = -0.96;
const MAX_PITCH = 0.72;
const OBJECTIVE_AUTO_COMPACT_MS = 2000;
const LOOK_PRESETS = {
  slow: 0.78,
  standard: 1,
  fast: 1.26,
};
const LOOK_PRESET_LABELS = {
  slow: "慢",
  standard: "標準",
  fast: "快",
  custom: "自訂",
};

const WORLD_POINTS = {
  frontStair: {
    x: scale(-522),
    y: 0,
    z: scale(WORLD.stairs.front.landingZ),
  },
  backStair: {
    x: scale(-522),
    y: 0,
    z: scale(WORLD.stairs.back.landingZ),
  },
  frontDoor: {
    x: scale(WORLD.frontDoor.center.x),
    y: scale(WORLD.frontDoor.center.y),
    z: scale(WORLD.frontDoor.center.z),
  },
  backDoor: {
    x: scale(WORLD.backDoor.center.x),
    y: scale(WORLD.backDoor.center.y),
    z: scale(WORLD.backDoor.center.z),
  },
  doorPlaque: {
    x: scale(WORLD.plaque.x),
    y: scale(WORLD.plaque.y),
    z: scale(WORLD.plaque.z),
  },
  focusMark: {
    x: scale(WORLD.focusMark.x),
    y: 1.44,
    z: scale(WORLD.focusMark.z),
  },
  frontSpawn: {
    x: scale(-736),
    y: 0,
    z: scale(WORLD.frontDoor.center.z - 612),
  },
  corridorFront: {
    x: scale(-548),
    y: 0,
    z: scale(WORLD.frontDoor.center.z - 356),
  },
  juniorSeat: {
    x: scale(1896),
    y: 0,
    z: scale(2058),
  },
  frontLook: {
    x: scale(-256),
    y: 1.52,
    z: scale(WORLD.frontDoor.center.z - 4),
  },
  rearLook: {
    x: scale(24),
    y: 1.42,
    z: scale(WORLD.backDoor.center.z + 6),
  },
  eyeLook: {
    x: scale(92),
    y: 1.5,
    z: scale(WORLD.backDoor.center.z + 4),
  },
  perfectOrbit: {
    x: scale(108),
    y: 1.58,
    z: scale(WORLD.backDoor.center.z + 6),
  },
};

const HOTSPOT_MAP = Object.fromEntries(
  HOTSPOTS.map((hotspot) => [
    hotspot.id,
    {
      ...hotspot,
      x: scale(hotspot.x),
      y: scale(hotspot.y),
      z: scale(hotspot.z),
      radius: scale(hotspot.radius),
    },
  ])
);

let liveState = null;

const canvas = document.getElementById("scene-canvas");
const scene = createLm402Scene(canvas);

const dom = {
  body: document.body,
  stage: document.getElementById("stage"),
  rotateLock: document.getElementById("rotate-lock"),
  hud: document.getElementById("hud"),
  hudToggle: document.getElementById("hud-toggle"),
  pointerPill: document.getElementById("pointer-pill"),
  speedWidget: document.getElementById("speed-widget"),
  speedToggle: document.getElementById("speed-toggle"),
  speedToggleValue: document.getElementById("speed-toggle-value"),
  speedPanel: document.getElementById("speed-panel"),
  speedPresets: document.getElementById("speed-presets"),
  speedRange: document.getElementById("speed-range"),
  speedRangeValue: document.getElementById("speed-range-value"),
  audioWidget: document.getElementById("audio-widget"),
  audioToggle: document.getElementById("audio-toggle"),
  audioToggleValue: document.getElementById("audio-toggle-value"),
  musicPrompt: document.getElementById("music-prompt"),
  musicPromptButton: document.getElementById("music-prompt-button"),
  musicPromptClose: document.getElementById("music-prompt-close"),
  perfectEndingBtn: document.getElementById("perfect-ending-btn"),
  perfectEndingSideBtn: document.getElementById("perfect-ending-side-btn"),
  backStoryBtn: document.getElementById("back-story-btn"),
  objectivePrompt: document.getElementById("objective-prompt"),
  objectiveKicker: document.getElementById("objective-kicker"),
  objectiveTitle: document.getElementById("objective-title"),
  objectiveCopy: document.getElementById("objective-copy"),
  panelObjective: document.getElementById("panel-objective"),
  phaseStrip: document.getElementById("phase-strip"),
  memoryList: document.getElementById("memory-list"),
  hintPill: document.getElementById("hint-pill"),
  focusPrompt: document.getElementById("focus-prompt"),
  bottomDock: document.getElementById("bottom-dock"),
  ambienceBox: document.getElementById("ambience-box"),
  ambienceChip: document.getElementById("ambience-chip"),
  ambienceChipCopy: document.getElementById("ambience-chip-copy"),
  ambienceText: document.getElementById("ambience-text"),
  subtitleBox: document.getElementById("subtitle-box"),
  subtitleSource: document.getElementById("subtitle-source"),
  subtitleText: document.getElementById("subtitle-text"),
  transcriptDock: document.getElementById("transcript-dock"),
  transcriptToggle: document.getElementById("transcript-toggle"),
  transcriptStatus: document.getElementById("transcript-status"),
  transcriptBox: document.getElementById("transcript-box"),
  transcriptList: document.getElementById("transcript-list"),
  mobileControls: document.getElementById("mobile-controls"),
  moveStick: document.getElementById("move-stick"),
  lookStick: document.getElementById("look-stick"),
  interactBtn: document.getElementById("interact-btn"),
  inspectBtn: document.getElementById("inspect-btn"),
  centerBtn: document.getElementById("center-btn"),
  replayBtn: document.getElementById("replay-btn"),
  dialogueSheet: document.getElementById("dialogue-sheet"),
  dialogueScrim: document.getElementById("dialogue-scrim"),
  dialogueClose: document.getElementById("dialogue-close"),
  dialogueEyebrow: document.getElementById("dialogue-eyebrow"),
  dialogueTitle: document.getElementById("dialogue-title"),
  dialogueCopy: document.getElementById("dialogue-copy"),
  dialogueChoices: document.getElementById("dialogue-choices"),
  endingOverlay: document.getElementById("ending-overlay"),
  endingBlackout: document.getElementById("ending-blackout"),
  endingWhiteout: document.getElementById("ending-whiteout"),
  endingKicker: document.getElementById("ending-kicker"),
  endingTitle: document.getElementById("ending-title"),
  endingCopy: document.getElementById("ending-copy"),
  endingRetry: document.getElementById("ending-retry"),
  debugPanel: document.getElementById("debug-panel"),
  debugText: document.getElementById("debug-text"),
  introSkipBtn: document.getElementById("intro-skip-btn"),
  introFx: document.getElementById("intro-fx"),
  fontWidget: document.getElementById("font-widget"),
  fontToggle: document.getElementById("font-toggle"),
  fontToggleValue: document.getElementById("font-toggle-value"),
  qualityWidget: document.getElementById("quality-widget"),
  qualityToggle: document.getElementById("quality-toggle"),
  qualityToggleValue: document.getElementById("quality-toggle-value"),
  oneGazeOverlay: document.getElementById("one-gaze-overlay"),
  sidePanel: document.getElementById("side-panel"),
};

/* ── Font Scale System ── */
const FONT_SCALE_PRESETS = { small: 0.85, standard: 1, large: 1.2, xlarge: 1.4 };
const FONT_SCALE_ORDER = ["small", "standard", "large", "xlarge"];
const FONT_SCALE_LABELS = { small: "小", standard: "標準", large: "大", xlarge: "特大" };

/* ── Graphics Quality System ── */
const QUALITY_TIERS = {
  low:     { shadowMapSize: 256,  maxPixelRatio: 0.75, dustCount: 16,  mirrorOpacity: 0.04, portraitBoost: 1 },
  smooth:  { shadowMapSize: 512,  maxPixelRatio: 1.0,  dustCount: 32,  mirrorOpacity: 0.08, portraitBoost: 1 },
  high:    { shadowMapSize: 1024, maxPixelRatio: 1.5,  dustCount: 64,  mirrorOpacity: 0.10, portraitBoost: 1 },
  ultra:   { shadowMapSize: 2048, maxPixelRatio: 4.0,  dustCount: 128, mirrorOpacity: 0.14, portraitBoost: 1 },
  perfect: { shadowMapSize: 4096, maxPixelRatio: 8.0,  dustCount: 256, mirrorOpacity: 0.18, portraitBoost: 1.5 },
};
const QUALITY_ORDER = ["low", "smooth", "high", "ultra", "perfect"];
const QUALITY_LABELS = { low: "低", smooth: "順暢", high: "高級", ultra: "全開最高", perfect: "完美畫質" };
function getDefaultQuality() {
  const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile ? "smooth" : "ultra";
}
function loadQualitySetting() {
  try { const v = localStorage.getItem(STORAGE_KEYS.graphicsQuality); return QUALITY_TIERS[v] ? v : getDefaultQuality(); } catch { return getDefaultQuality(); }
}
function persistQualitySetting() {
  try { localStorage.setItem(STORAGE_KEYS.graphicsQuality, state.graphicsQuality); } catch {}
}
function applyQualityTier() {
  scene.setRuntimeConfig({ qualityTier: state.graphicsQuality, qualityTiers: QUALITY_TIERS });
  if (dom.qualityToggleValue) dom.qualityToggleValue.textContent = QUALITY_LABELS[state.graphicsQuality] || state.graphicsQuality;
}
function cycleQualityTier() {
  const idx = QUALITY_ORDER.indexOf(state.graphicsQuality);
  state.graphicsQuality = QUALITY_ORDER[(idx + 1) % QUALITY_ORDER.length];
  applyQualityTier();
  persistQualitySetting();
}

function loadFontScale() {
  try { const v = parseFloat(localStorage.getItem(STORAGE_KEYS.fontScale)); return Number.isFinite(v) ? v : 1; } catch { return 1; }
}
function persistFontScale() {
  try { localStorage.setItem(STORAGE_KEYS.fontScale, String(state.fontScale)); } catch {}
}
function applyFontScale() {
  document.documentElement.style.setProperty("--game-font-scale", String(state.fontScale));
  const label = Object.entries(FONT_SCALE_PRESETS).find(([, v]) => Math.abs(v - state.fontScale) < 0.01)?.[0] ?? "standard";
  if (dom.fontToggleValue) dom.fontToggleValue.textContent = FONT_SCALE_LABELS[label] || `${Math.round(state.fontScale * 100)}%`;
}
function cycleFontScale() {
  const current = FONT_SCALE_ORDER.findIndex(k => Math.abs(FONT_SCALE_PRESETS[k] - state.fontScale) < 0.01);
  const next = (current + 1) % FONT_SCALE_ORDER.length;
  state.fontScale = FONT_SCALE_PRESETS[FONT_SCALE_ORDER[next]];
  applyFontScale();
  persistFontScale();
}

/* ── Game Time Display ── */
function getGameTimeDisplay() {
  if (state.phase === "consciousness_market") {
    const minutes = Math.floor(state.phaseClock / 3) + 40;
    return `10:${String(Math.min(minutes, 59)).padStart(2, "0")}`;
  }
  if (state.phase === "front_call") return "11:00";
  if (state.phase === "rear_wait") return "11:05";
  if (state.phase === "eye_contact") return "11:07";
  return "10:40";
}
function updateTimeWatch() {
  const display = document.getElementById("time-watch-display");
  if (display) display.textContent = getGameTimeDisplay();
}

/* ── Stair Warp System ── */
let stairWarpCooldownUntil = 0;
function checkStairWarp() {
  if (!stairsWarp) return;
  const now = performance.now() / 1000;
  if (now < stairWarpCooldownUntil) return;
  const px = state.player.x / WORLD_SCALE;
  const pz = state.player.z / WORLD_SCALE;
  const pad = stairsWarp.triggerEdgePadding;
  /* 前後兩邊樓梯都觸發蟲洞 */
  const inBack  = pz >= (stairsWarp.back.z1  - pad) && pz <= (stairsWarp.back.z2  + pad);
  const inFront = pz >= (stairsWarp.front.z1 - pad) && pz <= (stairsWarp.front.z2 + pad);
  if (!inBack && !inFront) return;
  stairWarpCooldownUntil = now + stairsWarp.cooldown;
  scene.triggerWormhole(state.player.x, 0, state.player.z);
  safeTimeout(() => {
    state.player.x = scale(stairsWarp.returnPoint.x);
    state.player.z = scale(stairsWarp.returnPoint.z);
    scene.triggerWormhole(state.player.x, 0, state.player.z);
    setSubtitle(stairsWarp.subtitle.source, stairsWarp.subtitle.text, stairsWarp.subtitle.ttl);
  }, stairsWarp.effectReturnDelay * 1000);
}

/* ── Subtitle Background Adaptation ── */
let subtitleAdaptFrame = 0;
function adaptSubtitleBackground() {
  subtitleAdaptFrame++;
  if (subtitleAdaptFrame % 15 !== 0) return; // check every ~15 frames
  if (!canvas || !dom.subtitleBox || !dom.ambienceBox) return;
  try {
    const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!ctx) return;
    // Sample a small area near bottom-center of canvas
    const w = canvas.width, h = canvas.height;
    const sampleX = Math.floor(w * 0.4), sampleY = Math.floor(h * 0.15);
    const sampleW = Math.floor(w * 0.2), sampleH = Math.floor(h * 0.1);
    const pixels = new Uint8Array(sampleW * sampleH * 4);
    ctx.readPixels(sampleX, sampleY, sampleW, sampleH, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);
    // Calculate average brightness
    let totalBrightness = 0;
    const pixelCount = sampleW * sampleH;
    for (let i = 0; i < pixels.length; i += 4) {
      totalBrightness += (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
    }
    const avgBrightness = totalBrightness / pixelCount / 255;
    // Apply adaptive backdrop: darker backdrop when scene is bright
    const backdropAlpha = avgBrightness > 0.55 ? Math.min(0.85, 0.4 + avgBrightness * 0.6) : 0.25;
    const backdropColor = `rgba(8, 10, 14, ${backdropAlpha.toFixed(2)})`;
    dom.subtitleBox.style.setProperty("--subtitle-adaptive-bg", backdropColor);
    dom.ambienceBox.style.setProperty("--subtitle-adaptive-bg", backdropColor);
    // Also apply to cinematic subtitle if visible
    const cinematicSub = document.querySelector(".cinematic-subtitle-card");
    if (cinematicSub) cinematicSub.style.setProperty("--subtitle-adaptive-bg", backdropColor);
  } catch {}
}

function clampLookScalar(value) {
  return clamp(Number(value) || LOOK_PRESETS.standard, 0.55, 1.55);
}

function normalizeLookSetting(raw) {
  const scalar = clampLookScalar(raw?.scalar ?? LOOK_PRESETS.standard);
  const preset = Object.entries(LOOK_PRESETS).find(([, value]) => Math.abs(value - scalar) <= 0.035)?.[0] ?? raw?.preset ?? "custom";
  return {
    preset: LOOK_PRESETS[preset] ? preset : "custom",
    scalar,
  };
}

function loadLookSetting() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.lookSensitivity) || "null");
    return normalizeLookSetting(raw);
  } catch {
    return normalizeLookSetting(null);
  }
}

const initialLookSetting = loadLookSetting();
const initialAudioEnabled = localStorage.getItem(STORAGE_KEYS.audioEnabled) === "1";

function isMobileLayout() {
  return window.matchMedia("(max-width: 1080px)").matches || window.matchMedia("(pointer: coarse)").matches;
}

function wantsLandscape() {
  return isMobileLayout() && window.innerHeight > window.innerWidth;
}

function isMobileLandscape() {
  return isMobileLayout() && window.innerWidth >= window.innerHeight;
}

function currentDensityTier() {
  if (!isMobileLandscape()) {
    return "regular";
  }
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  if (shortSide <= 360) {
    return "tight";
  }
  if (shortSide <= 400) {
    return "compact";
  }
  return "regular";
}

function condensedCopy(text, length = 24) {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function cloneCharacters(characters) {
  return {
    senior: { ...characters.senior },
    junior: { ...characters.junior },
    fatherEcho: { ...characters.fatherEcho },
    auntEcho: { ...characters.auntEcho },
  };
}

function createInitialCharacters() {
  return {
    senior: {
      x: WORLD_POINTS.corridorFront.x,
      y: 0,
      z: WORLD_POINTS.corridorFront.z,
      rotationY: -1.32,
    },
    junior: {
      x: WORLD_POINTS.juniorSeat.x,
      y: 0,
      z: WORLD_POINTS.juniorSeat.z,
      rotationY: 0.04,
    },
    fatherEcho: {
      x: scale(-312),
      y: 0,
      z: scale(WORLD.backDoor.center.z + 2),
      rotationY: Math.PI / 2,
      alpha: 0,
    },
    auntEcho: {
      x: scale(-116),
      y: 0,
      z: scale(WORLD.backDoor.center.z + 26),
      rotationY: -Math.PI / 2,
      alpha: 0,
    },
  };
}

function yawToTarget(from, target) {
  const dx = target.x - from.x;
  const dz = target.z - from.z;
  return Math.atan2(-dx, -dz);
}

function pitchToTarget(from, target) {
  const dx = target.x - from.x;
  const dz = target.z - from.z;
  const dy = (target.y ?? 1.28) - PLAYER_EYE_HEIGHT;
  return clamp(Math.atan2(dy, Math.hypot(dx, dz)), MIN_PITCH, MAX_PITCH);
}

function angleDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff);
}

function phaseLookTarget(phase) {
  if (liveState?.characters) {
    if (phase === "eye_contact") {
      return {
        x: lerp(liveState.characters.junior.x, WORLD_POINTS.eyeLook.x, 0.38),
        y: WORLD_POINTS.eyeLook.y,
        z: lerp(liveState.characters.junior.z, WORLD_POINTS.eyeLook.z, 0.7),
      };
    }
    if (phase === "rear_wait") {
      return {
        x: lerp(liveState.characters.senior.x, WORLD_POINTS.rearLook.x, 0.72),
        y: WORLD_POINTS.rearLook.y,
        z: lerp(liveState.characters.senior.z, WORLD_POINTS.rearLook.z, 0.58),
      };
    }
    return {
      x:
        liveState.characters.senior.x * 0.3 +
        WORLD_POINTS.doorPlaque.x * 0.4 +
        WORLD_POINTS.frontDoor.x * 0.16 +
        WORLD_POINTS.frontLook.x * 0.14,
      y: WORLD_POINTS.frontLook.y,
      z:
        liveState.characters.senior.z * 0.26 +
        WORLD_POINTS.doorPlaque.z * 0.34 +
        WORLD_POINTS.frontDoor.z * 0.18 +
        WORLD_POINTS.frontLook.z * 0.22,
    };
  }
  if (phase === "eye_contact") {
    return WORLD_POINTS.eyeLook;
  }
  if (phase === "rear_wait") {
    return WORLD_POINTS.rearLook;
  }
  return WORLD_POINTS.frontLook;
}

function phaseDefaultPitch(phase, from = null) {
  const origin = from ?? state?.player ?? createInitialPlayer();
  const base = pitchToTarget(origin, phaseLookTarget(phase));
  if (phase === "eye_contact") {
    return clamp(base - 0.02, MIN_PITCH, MAX_PITCH);
  }
  if (phase === "rear_wait") {
    return clamp(base - 0.02, MIN_PITCH, MAX_PITCH);
  }
  return clamp(base - 0.03, MIN_PITCH, MAX_PITCH);
}

function movementRotation(dx, dz, fallback = 0) {
  if (Math.hypot(dx, dz) < 0.0001) {
    return fallback;
  }
  return Math.atan2(dx, dz);
}

function followPath(waypoints, t) {
  const n = waypoints.length - 1;
  if (n <= 0) return { x: waypoints[0].x, z: waypoints[0].z, yaw: 0 };
  const ct = clamp(t, 0, 1);
  const seg = Math.min(Math.floor(ct * n), n - 1);
  const localT = ct * n - seg;
  const a = waypoints[seg], b = waypoints[seg + 1];
  const x = lerp(a.x, b.x, localT);
  const z = lerp(a.z, b.z, localT);
  const yaw = movementRotation(b.x - a.x, b.z - a.z, a.yaw ?? 0);
  return { x, z, yaw };
}

function createInitialPlayer() {
  const player = {
    x: WORLD_POINTS.frontSpawn.x,
    y: 0,
    z: WORLD_POINTS.frontSpawn.z,
    yaw: 0,
    pitch: 0,
    velocity: { x: 0, z: 0 },
    lookInput: { x: 0, y: 0 },
    isGhostObserver: true,
  };
  player.yaw = yawToTarget(player, WORLD_POINTS.frontLook);
  player.pitch = phaseDefaultPitch("front_call", player);
  return player;
}

function createInitialFlags() {
  return {
    frontCallHeard: false,
    backdoorAnchored: false,
    juniorPrepared: false,
    rearWaitHintPlayed: false,
    eyeCuePlayed: false,
    perfectLinePlayed: false,
    oneGazeTextShown: false,
    autoFrontCall: false,
    rewindPlayed: false,
    daughterActive: false,
  };
}

function clearTransientInput() {
  state.input.moveX = 0;
  state.input.moveY = 0;
  state.input.lookX = 0;
  state.input.lookY = 0;
  state.player.lookInput.x = 0;
  state.player.lookInput.y = 0;
  state.player.velocity.x = 0;
  state.player.velocity.z = 0;
  state.dragLook = null;
}

const state = {
  mode: "intro",
  cameraMode: "intro",
  hudMode: "chip",
  subtitleMode: "full",
  transcriptExpanded: false,
  transcriptMaximized: false,
  pointerLockState: "free",
  pointerLockPending: false,
  boundaryCollisionState: null,
  lastContextMenu: 0,
  debugEvents: [],
  lookSensitivityPreset: initialLookSetting.preset,
  lookSensitivityScalar: initialLookSetting.scalar,
  audioEnabled: initialAudioEnabled,
  fontScale: loadFontScale(),
  graphicsQuality: loadQualitySetting(),
  phase: "consciousness_market",
  ending: null,
  endingSequence: null,
  controlMode: "ghost",
  juniorControlSnapshot: null,
  intro: {
    progress: 0,
    time: 0,
    replay: false,
    resume: null,
  },
  player: createInitialPlayer(),
  input: {
    moveX: 0,
    moveY: 0,
    lookX: 0,
    lookY: 0,
  },
  keyboard: Object.create(null),
  dragLook: null,
  activeHotspot: null,
  activeHotspotId: null,
  dialogue: null,
  subtitle: {
    source: "女兒",
    text: "我可以飛翔。沿著紅線，利瑪竇和 LM402 會在光裡慢慢長出來。",
    ttl: 3.6,
  },
  subtitleLog: [],
  ambience: {
    text: "粉筆味像一層薄雲，十一點的光正慢慢沿著百葉窗往教室裡推。",
  },
  memories: new Set(),
  flags: createInitialFlags(),
  characters: createInitialCharacters(),
  time: 0,
  phaseClock: 0,
  cinematicGlow: 0,
  mobileDockExpanded: false,
  mobileDensityTier: "regular",
  introBeatIndex: 0,
  introCameraTrack: INTRO_BEATS[0].id,
  sound: {
    playerStepAt: 0,
    seniorStepAt: 0,
    juniorStepAt: 0,
  },
};
liveState = state;

/* ── 歌曲定義 ── */
const SONGS = [
  { id: "flying_hearts", file: "飛進你們的心裡.mp3", label: "女兒", name: "飛進你們的心裡", defaultUnlocked: true },
  { id: "one_gaze_song", file: "一眼瞬間.mp3", label: "學妹", name: "一眼瞬間", defaultUnlocked: false },
];

function loadUnlockedSongs() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.unlockedSongs) || "null");
    if (Array.isArray(raw)) return raw;
  } catch {}
  return SONGS.filter(s => s.defaultUnlocked).map(s => s.id);
}

function persistUnlockedSongs(unlocked) {
  try { localStorage.setItem(STORAGE_KEYS.unlockedSongs, JSON.stringify(unlocked)); } catch {}
}

function createAudioSystem() {
  let audio = null;
  let context = null;
  let autoplayBlocked = false;
  let playAttempt = null;
  let promptDismissed = false;
  let promptReady = false;
  let currentSongId = null;
  let unlockedSongs = loadUnlockedSongs();
  /* 若玩家曾解鎖一眼瞬間，下次遊戲預設播放該曲 */
  if (unlockedSongs.includes("one_gaze_song")) currentSongId = "one_gaze_song";

  function songUrl(file) {
    return new URL("../../" + file, import.meta.url).href;
  }

  function ensureAudio(songId) {
    const target = songId || currentSongId || "flying_hearts";
    const song = SONGS.find(s => s.id === target) || SONGS[0];
    if (audio && currentSongId === song.id) return audio;
    const wasPlaying = audio && !audio.paused;
    if (audio) { audio.pause(); audio.src = ""; }
    audio = new Audio(songUrl(song.file));
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.84;
    audio.playsInline = true;
    currentSongId = song.id;
    audio.addEventListener("playing", () => {
      autoplayBlocked = false;
      syncMusicPrompt();
      syncSongUI();
    });
    audio.addEventListener("pause", () => {
      if (!state.audioEnabled) {
        autoplayBlocked = false;
        syncMusicPrompt();
      }
    });
    if (wasPlaying && state.audioEnabled) void tryPlay("switch");
    return audio;
  }

  function ensureContext() {
    if (context) return context;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    context = new AudioContextCtor();
    return context;
  }

  async function tryPlay(reason = "auto") {
    if (!state.audioEnabled) { syncMusicPrompt(); return false; }
    const player = ensureAudio();
    if (playAttempt) return playAttempt;
    playAttempt = player
      .play()
      .then(() => { autoplayBlocked = false; syncMusicPrompt(); logDebug("music", reason + ":playing:" + currentSongId); return true; })
      .catch(() => { autoplayBlocked = true; syncMusicPrompt(); logDebug("music", reason + ":blocked"); return false; })
      .finally(() => { playAttempt = null; });
    return playAttempt;
  }

  function syncMusicPrompt() {
    if (promptDismissed) return;
    const shouldShow = promptReady && (!state.audioEnabled || (state.audioEnabled && autoplayBlocked));
    dom.musicPrompt.classList.toggle("intro-mode", state.mode === "intro");
    if (shouldShow && dom.musicPrompt.hidden) {
      dom.musicPrompt.hidden = false;
      requestAnimationFrame(() => dom.musicPrompt.classList.add("show"));
    } else if (!shouldShow && !dom.musicPrompt.hidden) {
      dom.musicPrompt.classList.remove("show");
      setTimeout(() => { dom.musicPrompt.hidden = true; }, 420);
    }
  }

  function showMusicPrompt() { promptReady = true; syncMusicPrompt(); }
  function dismissMusicPrompt() { promptDismissed = true; dom.musicPrompt.classList.remove("show"); setTimeout(() => { dom.musicPrompt.hidden = true; }, 420); }

  function unlock() {
    const ctx = ensureContext();
    ctx?.resume?.().catch(() => {});
    void tryPlay("unlock");
  }

  function update() {
    if (!state.audioEnabled || !audio) return;
    if (!document.hidden && audio.paused && !autoplayBlocked) void tryPlay("resume");
  }

  function setEnabled(enabled) {
    state.audioEnabled = enabled;
    persistAudioSetting();
    syncAudioUI();
    if (!enabled) {
      autoplayBlocked = false;
      ensureAudio().pause();
      context?.suspend?.().catch(() => {});
      syncMusicPrompt();
      logDebug("music", "disabled");
      return;
    }
    ensureContext()?.resume?.().catch(() => {});
    void tryPlay("toggle");
  }

  /* ── 歌曲切換 ── */
  function switchSong(songId) {
    if (!unlockedSongs.includes(songId)) return;
    ensureAudio(songId);
    syncSongUI();
  }

  function unlockSong(songId) {
    if (unlockedSongs.includes(songId)) return false;
    unlockedSongs.push(songId);
    persistUnlockedSongs(unlockedSongs);
    syncSongUI();
    return true;
  }

  function isSongUnlocked(songId) { return unlockedSongs.includes(songId); }
  function getCurrentSongId() { return currentSongId || "flying_hearts"; }
  function getSongs() { return SONGS; }
  function getUnlockedSongs() { return [...unlockedSongs]; }

  /* ── 歌曲選擇 UI（使用安全 DOM 方法，不用 innerHTML）── */
  function syncSongUI() {
    const panel = document.getElementById("song-selector");
    if (!panel) return;
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    SONGS.forEach(song => {
      const isUnlocked = unlockedSongs.includes(song.id);
      const isCurrent = song.id === currentSongId;
      const row = document.createElement("button");
      row.className = "song-row" + (isCurrent ? " active" : "") + (isUnlocked ? "" : " locked");
      row.disabled = !isUnlocked;
      const lockSpan = document.createElement("span");
      lockSpan.className = "song-lock";
      lockSpan.textContent = isUnlocked ? "\u{1F513}" : "\u{1F512}";
      const labelSpan = document.createElement("span");
      labelSpan.className = "song-label";
      labelSpan.textContent = song.label;
      const nameSpan = document.createElement("span");
      nameSpan.className = "song-name";
      nameSpan.textContent = isUnlocked ? song.name : "???";
      row.appendChild(lockSpan);
      row.appendChild(labelSpan);
      row.appendChild(nameSpan);
      if (isUnlocked) {
        row.addEventListener("click", () => {
          if (isCurrent && state.audioEnabled) {
            /* 點擊正在播放的歌曲 → 停止音樂 */
            setEnabled(false);
            syncSongUI();
          } else {
            /* 點擊其他歌曲 → 切換並播放 */
            if (!state.audioEnabled) setEnabled(true);
            switchSong(song.id);
            void tryPlay("select");
          }
        });
      }
      panel.appendChild(row);
    });
  }

  function playEnvelope(ctx, { type = "sine", frequency = 440, duration = 0.12, gain = 0.04, when = 0, attack = 0.008, release = 0.08, detune = 0 }) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, when);
    osc.detune.setValueAtTime(detune, when);
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(gain, when + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + duration + release);
    osc.connect(amp).connect(ctx.destination);
    osc.start(when);
    osc.stop(when + duration + release + 0.03);
  }

  function playCue(type) {
    if (!state.audioEnabled) return;
    const ctx = ensureContext();
    if (!ctx || ctx.state !== "running") return;
    const when = ctx.currentTime + 0.01;
    if (type === "step") {
      playEnvelope(ctx, { type: "triangle", frequency: 110, duration: 0.04, gain: 0.018, when, attack: 0.004, release: 0.06 });
      playEnvelope(ctx, { type: "sine", frequency: 220, duration: 0.028, gain: 0.008, when: when + 0.006, attack: 0.004, release: 0.05 });
      return;
    }
    if (type === "phone") {
      playEnvelope(ctx, { type: "sine", frequency: 880, duration: 0.12, gain: 0.028, when, attack: 0.01, release: 0.08 });
      playEnvelope(ctx, { type: "sine", frequency: 1320, duration: 0.08, gain: 0.016, when: when + 0.04, attack: 0.008, release: 0.08 });
      return;
    }
    if (type === "ending") {
      playEnvelope(ctx, { type: "triangle", frequency: 392, duration: 0.18, gain: 0.018, when, attack: 0.02, release: 0.16 });
      playEnvelope(ctx, { type: "sine", frequency: 784, duration: 0.14, gain: 0.012, when: when + 0.06, attack: 0.02, release: 0.18 });
      return;
    }
    if (type === "thread") {
      playEnvelope(ctx, { type: "triangle", frequency: 294, duration: 0.08, gain: 0.012, when, attack: 0.01, release: 0.08 });
    }
  }

  return {
    unlock,
    update,
    setEnabled,
    playCue,
    tryPlay,
    syncPrompt: syncMusicPrompt,
    showPrompt: showMusicPrompt,
    dismissPrompt: dismissMusicPrompt,
    switchSong,
    unlockSong,
    isSongUnlocked,
    getCurrentSongId,
    getSongs,
    getUnlockedSongs,
    syncSongUI,
  };
}

const audioSystem = createAudioSystem();
const debugEnabled = new URLSearchParams(window.location.search).get("debug") === "1";
let objectiveCompactTimer = 0;

/* ── Timer Registry：追蹤所有 setTimeout，resetScene 時統一清除 ── */
const _pendingTimers = new Set();
function safeTimeout(fn, delay) {
  const id = window.setTimeout(() => { _pendingTimers.delete(id); fn(); }, delay);
  _pendingTimers.add(id);
  return id;
}
function clearAllPendingTimers() {
  for (const id of _pendingTimers) window.clearTimeout(id);
  _pendingTimers.clear();
}

function logDebug(type, detail = "") {
  const entry = {
    time: new Date().toISOString().slice(11, 19),
    type,
    detail,
  };
  state.debugEvents.push(entry);
  if (state.debugEvents.length > 18) {
    state.debugEvents.shift();
  }
}

function transcriptTimeLabel(date = new Date()) {
  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function appendTranscriptEntry(source, text, kind = "subtitle") {
  const cleaned = `${text || ""}`.trim();
  if (!cleaned) {
    return;
  }
  const last = state.subtitleLog[state.subtitleLog.length - 1];
  if (last && last.source === source && last.text === cleaned && last.kind === kind) {
    return;
  }
  state.subtitleLog.push({
    id: `${Date.now()}-${state.subtitleLog.length}`,
    source,
    text: cleaned,
    kind,
    time: transcriptTimeLabel(),
  });
  if (state.subtitleLog.length > 120) {
    state.subtitleLog.shift();
  }
  renderTranscriptLog();
}

function renderTranscriptLog() {
  if (!dom.transcriptList) {
    return;
  }
  dom.transcriptList.innerHTML = "";
  if (!state.subtitleLog.length) {
    const empty = document.createElement("div");
    empty.className = "transcript-item";
    empty.innerHTML =
      `<div class="transcript-item-head"><span class="transcript-source">LM402</span><span class="transcript-time">等待開始</span></div>` +
      `<div class="transcript-text">當文字開始浮上來，它們都會留在這裡。</div>`;
    dom.transcriptList.appendChild(empty);
  } else {
    state.subtitleLog.forEach((item) => {
      const row = document.createElement("div");
      row.className = "transcript-item";
      row.innerHTML =
        `<div class="transcript-item-head"><span class="transcript-source">${escapeHtml(item.source)}</span><span class="transcript-time">${escapeHtml(item.time)}</span></div>` +
        `<div class="transcript-text">${escapeHtml(item.text).replace(/\n/g, "<br>")}</div>`;
      dom.transcriptList.appendChild(row);
    });
  }
  dom.transcriptStatus.textContent = state.transcriptExpanded
    ? `收起對話紀錄 · ${state.subtitleLog.length} 則`
    : state.subtitleLog.length
      ? `展開對話紀錄 · ${state.subtitleLog.length} 則`
      : "展開對話紀錄";
  if (state.transcriptExpanded) {
    dom.transcriptList.scrollTop = dom.transcriptList.scrollHeight;
  }
}

function syncTranscriptUI() {
  if (!dom.transcriptToggle || !dom.transcriptBox) {
    return;
  }
  dom.transcriptToggle.setAttribute("aria-expanded", String(state.transcriptExpanded));
  dom.transcriptDock?.classList.toggle("expanded", state.transcriptExpanded);
  dom.transcriptDock?.classList.toggle("maximized", state.transcriptMaximized);
  dom.transcriptBox.hidden = !state.transcriptExpanded;
  renderTranscriptLog();
}

function toggleTranscript(forceExpanded = null) {
  state.transcriptExpanded = forceExpanded ?? !state.transcriptExpanded;
  if (!state.transcriptExpanded) state.transcriptMaximized = false;
  syncTranscriptUI();
}

function toggleTranscriptMaximize() {
  state.transcriptMaximized = !state.transcriptMaximized;
  if (state.transcriptMaximized) state.transcriptExpanded = true;
  dom.transcriptDock?.classList.toggle("maximized", state.transcriptMaximized);
  syncTranscriptUI();
}

function setSubtitle(source, text, ttl = 5) {
  const resolvedTtl = Math.max(ttl, 5);
  state.subtitle = { source, text, ttl: resolvedTtl };
  dom.subtitleSource.textContent = source;
  dom.subtitleText.textContent = text;
  appendTranscriptEntry(source, text);
  state.subtitleMode = "full";
  syncDockState();
}

function setAmbience(text) {
  state.ambience.text = text;
  dom.ambienceText.textContent = text;
  dom.ambienceChipCopy.textContent = state.mobileDockExpanded ? "點一下收起" : condensedCopy(text);
}

/* ── 置中字幕（結局用） ── */
function showCenteredSubtitle(source, text, duration, position = "centered") {
  const layer = document.getElementById("cinematic-subtitle-layer");
  const srcEl = document.getElementById("cinematic-subtitle-source");
  const txtEl = document.getElementById("cinematic-subtitle-text");
  if (!layer || !txtEl) return;
  if (srcEl) srcEl.textContent = source || "";
  txtEl.textContent = text;
  layer.classList.remove("centered", "center-low");
  layer.classList.add(position);
  layer.hidden = false;
  appendTranscriptEntry(source, text);
  if (duration > 0) {
    safeTimeout(() => {
      layer.hidden = true;
      layer.classList.remove("centered", "center-low");
    }, duration * 1000);
  }
}

function hideCenteredSubtitle() {
  const layer = document.getElementById("cinematic-subtitle-layer");
  if (layer) {
    layer.hidden = true;
    layer.classList.remove("centered", "center-low");
  }
}

/* ── 結局隱藏/顯示全 UI ── */
function hideAllGameUI() {
  dom.bottomDock.style.display = "none";
  dom.hud?.style.setProperty("display", "none");
  if (dom.objectivePrompt) dom.objectivePrompt.style.display = "none";
  if (dom.mobileControls) dom.mobileControls.style.display = "none";
  if (dom.speedWidget) dom.speedWidget.style.display = "none";
  if (dom.audioWidget) dom.audioWidget.style.display = "none";
  if (dom.fontWidget) dom.fontWidget.style.display = "none";
  if (dom.qualityWidget) dom.qualityWidget.style.display = "none";
  if (dom.sidePanel) dom.sidePanel.style.display = "none";
  if (dom.hintPill) dom.hintPill.style.display = "none";
  if (dom.transcriptDock) dom.transcriptDock.style.display = "none";
}

function showAllGameUI() {
  dom.bottomDock.style.display = "";
  dom.hud?.style.setProperty("display", "");
  if (dom.objectivePrompt) dom.objectivePrompt.style.display = "";
  if (dom.mobileControls) dom.mobileControls.style.display = "";
  if (dom.speedWidget) dom.speedWidget.style.display = "";
  if (dom.audioWidget) dom.audioWidget.style.display = "";
  if (dom.fontWidget) dom.fontWidget.style.display = "";
  if (dom.qualityWidget) dom.qualityWidget.style.display = "";
  if (dom.sidePanel) dom.sidePanel.style.display = "";
  if (dom.hintPill) dom.hintPill.style.display = "";
  if (dom.transcriptDock) dom.transcriptDock.style.display = "";
}

function persistLookSetting() {
  localStorage.setItem(
    STORAGE_KEYS.lookSensitivity,
    JSON.stringify({
      preset: state.lookSensitivityPreset,
      scalar: Number(state.lookSensitivityScalar.toFixed(3)),
    })
  );
}

function closestLookPreset(scalar) {
  const match = Object.entries(LOOK_PRESETS).find(([, value]) => Math.abs(value - scalar) <= 0.035);
  return match?.[0] ?? "custom";
}

function syncSpeedUI() {
  const presetLabel = LOOK_PRESET_LABELS[state.lookSensitivityPreset] || LOOK_PRESET_LABELS.custom;
  const percentage = `${Math.round(state.lookSensitivityScalar * 100)}%`;
  dom.speedToggleValue.textContent = `${presetLabel} · ${percentage}`;
  dom.speedRange.value = String(Math.round(state.lookSensitivityScalar * 100));
  dom.speedRangeValue.textContent = percentage;
  dom.speedPanel.hidden = !dom.speedToggle.getAttribute("aria-expanded") || dom.speedToggle.getAttribute("aria-expanded") === "false";
  dom.speedPresets.querySelectorAll("[data-speed-preset]").forEach((button) => {
    button.classList.toggle("active", button.dataset.speedPreset === state.lookSensitivityPreset);
  });
}

function setLookSensitivity({ preset = null, scalar = null, persist = true } = {}) {
  const resolvedScalar = clampLookScalar(scalar ?? (preset ? LOOK_PRESETS[preset] : state.lookSensitivityScalar));
  state.lookSensitivityScalar = resolvedScalar;
  state.lookSensitivityPreset = preset ?? closestLookPreset(resolvedScalar);
  syncSpeedUI();
  if (persist) {
    persistLookSetting();
  }
  logDebug("look-speed", `${state.lookSensitivityPreset}:${resolvedScalar.toFixed(2)}`);
}

function toggleSpeedPanel(forceExpanded = null) {
  const expanded = forceExpanded ?? dom.speedToggle.getAttribute("aria-expanded") !== "true";
  dom.speedToggle.setAttribute("aria-expanded", String(expanded));
  dom.speedPanel.hidden = !expanded;
}

function currentLookScalar() {
  return state.lookSensitivityScalar;
}

function persistAudioSetting() {
  localStorage.setItem(STORAGE_KEYS.audioEnabled, state.audioEnabled ? "1" : "0");
}

function syncAudioUI() {
  dom.audioToggle.setAttribute("aria-pressed", String(state.audioEnabled));
  /* 按鈕文字由列表開關狀態決定，不在此處覆寫 */
  audioSystem.syncPrompt();
}

function rectSnapshot(node) {
  if (!node || node.hidden) {
    return null;
  }
  const rect = node.getBoundingClientRect();
  if (!rect.width && !rect.height) {
    return null;
  }
  return {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    right: Math.round(rect.right),
    bottom: Math.round(rect.bottom),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function currentControlBounds() {
  if (!isMobileLandscape()) {
    return null;
  }
  const leftCluster = dom.moveStick.closest(".control-cluster");
  const rightCluster = dom.lookStick.closest(".control-cluster");
  return {
    leftStick: rectSnapshot(leftCluster),
    rightStick: rectSnapshot(rightCluster),
    interact: rectSnapshot(dom.interactBtn),
    inspect: rectSnapshot(dom.inspectBtn),
    center: rectSnapshot(dom.centerBtn),
    replay: rectSnapshot(dom.replayBtn),
  };
}

function updatePointerHint() {
  if (isMobileLayout()) {
    dom.pointerPill.hidden = true;
    canvas.classList.remove("pointer-locked");
    return;
  }
  const locked = document.pointerLockElement === canvas;
  state.pointerLockState = locked ? "locked" : state.pointerLockPending ? "pending" : "free";
  dom.pointerPill.hidden = false;
  dom.pointerPill.textContent = locked
    ? "視角已鎖定 · 右鍵或 Esc 退出"
    : state.pointerLockPending
      ? "正在鎖定視角…"
      : "右鍵進入視角鎖定";
  dom.pointerPill.classList.toggle("locked", locked);
  canvas.classList.toggle("pointer-locked", locked);
}

function syncDockState() {
  const mobileLandscape = isMobileLandscape();
  const showSceneHint = !mobileLandscape;
  const expanded = showSceneHint && state.mobileDockExpanded;
  dom.bottomDock.classList.toggle("ambience-expanded", expanded);
  dom.bottomDock.classList.toggle("mobile-landscape", mobileLandscape);
  dom.bottomDock.classList.toggle("compact-subtitle", state.subtitleMode !== "full");
  dom.bottomDock.classList.toggle("hidden-subtitle", state.subtitleMode === "hidden");
  dom.ambienceChip.hidden = true;
  dom.ambienceBox.hidden = !showSceneHint;
  dom.ambienceChip.setAttribute("aria-expanded", "false");
  dom.ambienceChipCopy.textContent = condensedCopy(state.ambience.text);
}

function setHudCollapsed(collapsed) {
  dom.hud.classList.toggle("collapsed", collapsed);
  dom.hudToggle.setAttribute("aria-expanded", String(!collapsed));
  dom.hudToggle.querySelector(".hud-toggle-label").textContent = collapsed ? "展開任務" : "縮起資訊";
  dom.hudToggle.querySelector(".hud-toggle-icon").textContent = collapsed ? "+" : "−";
}

function syncObjectiveChip() {
  dom.objectivePrompt.classList.toggle("compact", state.hudMode === "chip");
}

function expandObjectiveTemporarily(duration = OBJECTIVE_AUTO_COMPACT_MS) {
  const actualDuration = isMobileLandscape() ? Math.min(duration, 1200) : duration;
  state.hudMode = "expanded";
  syncObjectiveChip();
  window.clearTimeout(objectiveCompactTimer);
  objectiveCompactTimer = window.setTimeout(() => {
    state.hudMode = "chip";
    syncObjectiveChip();
  }, actualDuration);
}

function toggleObjectivePrompt() {
  state.hudMode = state.hudMode === "expanded" ? "chip" : "expanded";
  syncObjectiveChip();
  if (state.hudMode === "expanded") {
    expandObjectiveTemporarily();
  }
}

function updateObjective(expand = false) {
  const phase = PHASES.find((item) => item.id === state.phase);
  dom.objectiveKicker.textContent = state.phase === "eye_contact" ? "最後一幕" : "目前任務";
  dom.objectiveTitle.textContent = phase.title;

  let copy = phase.copy;
  if (state.phase === "front_call") {
    copy = "先靠近剛從樓梯走到 LM402 前門外的學長，把那句「妳在哪裡？」真正聽見，也把門牌、門洞和矮牆外那片十一點日光一起收進來。";
  } else if (state.phase === "rear_wait") {
    copy = "進教室、站到另一端的後門旁，把學長會走過來的那段走廊、那道光和一點空白先留出來。";
  } else if (state.phase === "eye_contact") {
    copy = "留在後門視線點。別多跨一步，也別讓視線早一步撞到她；等十一點那一道光把她整個照亮。";
  }
  dom.objectiveCopy.textContent = copy;
  dom.panelObjective.textContent = copy;

  dom.phaseStrip.innerHTML = "";
  const currentIndex = PHASES.findIndex((item) => item.id === state.phase);
  PHASES.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "phase-row";
    if (item.id === state.phase) {
      row.classList.add("active");
    }
    if (index < currentIndex) {
      row.classList.add("done");
    }
    row.innerHTML =
      `<div class="phase-index">${escapeHtml(item.index)}</div>` +
      `<div class="phase-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.copy)}</span></div>`;
    dom.phaseStrip.appendChild(row);
  });

  if (expand) {
    expandObjectiveTemporarily();
  }
}

function updateMemoryList() {
  dom.memoryList.innerHTML = "";
  if (!state.memories.size) {
    const empty = document.createElement("div");
    empty.className = "memory-item";
    empty.innerHTML =
      `<div class="memory-kicker">還沒收進來</div>` +
      `<div class="memory-title">先去看門牌、黑板、靠窗座位、講義邊角或後門，把 LM402 這一層空氣收進來。</div>`;
    dom.memoryList.appendChild(empty);
    return;
  }
  [...state.memories].forEach((id) => {
    const memory = MEMORY_FRAGMENTS[id];
    const item = document.createElement("div");
    item.className = "memory-item";
    item.innerHTML =
      `<div class="memory-kicker">${escapeHtml(memory.kicker)}</div>` +
      `<div class="memory-title">${escapeHtml(memory.title)}</div>` +
      `<div class="memory-copy">${escapeHtml(memory.copy[0])}</div>`;
    dom.memoryList.appendChild(item);
  });
}

function revealHint(text) {
  dom.hintPill.textContent = text;
  dom.hintPill.classList.add("show");
  window.clearTimeout(revealHint.timer);
  revealHint.timer = window.setTimeout(() => dom.hintPill.classList.remove("show"), 2400);
}

function openDialogue(definition) {
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock?.();
  }
  state.dialogue = definition;
  state.cameraMode = "dialogue";
  dom.dialogueEyebrow.textContent = definition.eyebrow;
  dom.dialogueTitle.textContent = `${definition.speaker} · ${definition.title}`;
  dom.dialogueCopy.innerHTML = definition.copy.map((text) => `<p>${escapeHtml(text)}</p>`).join("");
  appendTranscriptEntry(definition.speaker, definition.copy.join("\n"), "dialogue");
  dom.dialogueChoices.innerHTML = "";
  definition.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dialogue-choice";
    button.innerHTML = `<strong>${index + 1}. ${escapeHtml(choice.label)}</strong><span>${escapeHtml(choice.detail)}</span>`;
    button.addEventListener("click", () => applyEffect(choice.effect));
    dom.dialogueChoices.appendChild(button);
  });
  dom.dialogueSheet.hidden = false;
  dom.body.classList.add("dialogue-open");
  logDebug("dialogue-open", definition.title);
}

function closeDialogue() {
  state.dialogue = null;
  if (!state.endingSequence) {
    state.cameraMode = state.mode === "intro" ? "intro" : "play";
  }
  dom.dialogueSheet.hidden = true;
  dom.body.classList.remove("dialogue-open");
  canvas.focus({ preventScroll: true });
  updatePointerHint();
}

function collectMemory(id) {
  if (!state.memories.has(id)) {
    state.memories.add(id);
    updateMemoryList();
    revealHint(`已收進來：${MEMORY_FRAGMENTS[id].title}`);
    logDebug("memory", id);
  }
}

function setPhase(id) {
  if (state.phase === id) {
    return;
  }
  state.phase = id;
  state.phaseClock = 0;
  state.cinematicGlow = 0;
  updateObjective(true);
  logDebug("phase", id);
}

function applyEffect(effect) {
  if (effect === "close_only") {
    closeDialogue();
    return;
  }
  if (effect === "collect_plaque" || effect === "memory_plaque") {
    collectMemory("plaque");
    setSubtitle("女兒", "門牌：LM402。粉筆味像一層薄雲。", 3.8);
    closeDialogue();
    return;
  }
  if (effect === "advance_front_call") {
    state.flags.frontCallHeard = true;
    setPhase("rear_wait");
    resetView();
    audioSystem.playCue("phone");
    setSubtitle("學妹", "「你走到後門。」", 3.6);
    safeTimeout(() => {
      if (state.mode === "play") {
        setSubtitle("女兒", "把拔的聲音聽起來好年輕。如果我沿著這條紅線走到後門，我是不是就能看見他們的一眼瞬間？", 5.0);
      }
    }, 4000);
    setAmbience("鐘聲剛落，前門那邊傳來探頭和腳步的動靜，風把教室裡的紙邊輕輕掀起。");
    closeDialogue();
    return;
  }
  if (effect === "memory_board" || effect === "memory_board_soft") {
    collectMemory("board");
    renderer.spawnHologram("board", state.time);
    if (effect === "memory_board") {
      setSubtitle("33 歲的聲音", "十一點整，下課鐘會響。他會先從前門探頭看，可是看不到妳。", 4.2);
    }
    closeDialogue();
    return;
  }
  if (effect === "memory_seat") {
    collectMemory("seat");
    renderer.spawnHologram("seat", state.time);
    setSubtitle("女兒", "原來阿姨當時就是站在這格光裡。用 29 歲的身體、18 歲的心跳，等著把拔走過來。", 5.0);
    closeDialogue();
    return;
  }
  if (effect === "memory_notes") {
    collectMemory("notes");
    renderer.spawnHologram("notes", state.time);
    audioSystem.playCue("thread");
    safeTimeout(() => {
      if (state.mode === "play") setSubtitle("把拔（心底的聲音）", "「這一次，依然再次遇見妳。」", 3.5);
    }, 500);
    safeTimeout(() => {
      if (state.mode === "play") setSubtitle("女兒", "原來阿姨當時在腦海裡開了一場『意識菜市場』會議，才緊張地把那句『你走到後門』練得這麼穩。", 5.0);
    }, 4200);
    closeDialogue();
    return;
  }
  if (effect === "advance_rear_wait") {
    state.flags.juniorPrepared = true;
    audioSystem.playCue("thread");
    setSubtitle("女兒", "深呼吸，就是這一秒了。", 3.6);
    revealHint("現在去後門，先把自己站穩。");
    closeDialogue();
    return;
  }
  if (effect === "memory_backdoor") {
    collectMemory("backdoor");
    closeDialogue();
    return;
  }
  if (effect === "memory_aunt_market") {
    setSubtitle("女兒", "就像命運阿嬤說的，不同年紀的阿姨都擠在這個菜市場裡，一起保護著這個最重要的時刻。", 4.5);
    closeDialogue();
    return;
  }
  if (effect === "collect_aunt_market") {
    collectMemory("aunt_market");
    setSubtitle("女兒", "我把阿姨在『意識菜市場』裡的溫度，悄悄收進了只有我看得見的時空口袋裡。", 4.5);
    closeDialogue();
    return;
  }
  if (effect === "anchor_backdoor") {
    collectMemory("backdoor");
    state.flags.backdoorAnchored = true;
    setPhase("eye_contact");
    resetView();
    audioSystem.playCue("ending");
    setSubtitle("女兒", "我停在後門旁，剛好能看到走廊的一小段。", 4.2);
    setAmbience("光從窗邊切進來，把地板照得有點過分地亮。所有版本的呼吸都慢慢安靜下來。");
    closeDialogue();
  }
  if (effect === "make_phone_call") {
    state.flags.frontCallHeard = true;
    state.flags.autoFrontCall = true;
    setPhase("front_call");
    audioSystem.playCue("phone");
    setSubtitle("學長", "「妳在哪裡？」", 4.0);
    safeTimeout(() => {
      if (state.mode === "play") {
        setSubtitle("女兒", "把拔的聲音聽起來好年輕喔，原來把拔年輕的時候，說話的聲音是這樣的。", 5.0);
      }
    }, 4500);
    setAmbience("鐘聲剛落，學長站在前門外，手機貼著耳朵。走廊的風把他的瀏海吹得微微晃動。");
    closeDialogue();
    return;
  }
  if (effect === "trigger_rear_wait") {
    setPhase("rear_wait");
    resetView();
    audioSystem.playCue("thread");
    setSubtitle("學妹", "「你走到後門。」", 3.6);
    safeTimeout(() => {
      if (state.mode === "play") {
        setSubtitle("女兒", "阿姨叫把拔走到後門，我也要趕快飛到後門那邊去看！", 5.0);
      }
    }, 4000);
    setAmbience("鐘聲剛落，前門那邊傳來探頭和腳步的動靜，風把教室裡的紙邊輕輕掀起。");
    closeDialogue();
    return;
  }
  if (effect === "trigger_ending_sequence") {
    setPhase("rear_wait");
    /* ── 玩家接管學妹：第一人稱（學妹的眼睛）── */
    state.controlMode = "junior";
    state.player.x = scale(1896);
    state.player.z = scale(2058);
    state.player.yaw = 0; // 朝向後門方向（-Z = 後門側）
    state.player.pitch = 0;
    state.player.velocity = { x: 0, z: 0 };
    state.player.isGhostObserver = false;
    /* 保存回溯快照（Choice B 用） */
    state.juniorControlSnapshot = {
      playerX: state.player.x,
      playerZ: state.player.z,
      playerYaw: state.player.yaw,
      phase: state.phase,
      phaseClock: state.phaseClock,
      characters: JSON.parse(JSON.stringify(state.characters)),
      flags: { ...state.flags },
      memories: new Set(state.memories),
    };
    audioSystem.playCue("phone");
    setSubtitle("學妹", "剛剛我叫學長到後門。", 4.0);
    safeTimeout(() => {
      if (state.mode === "play" && state.controlMode === "junior") {
        setSubtitle("", "走到後門找學長", 4.0);
      }
    }, 5000);
    setAmbience("話筒裡的聲音很輕，但已經足夠讓整條走廊開始轉向。他正在把腳步折向後門。");
    closeDialogue();
    return;
  }
  /* ── 三個新結局分支 ── */
  if (effect === "ending_perfect_eye") {
    closeDialogue();
    startEnding("perfect_eye", { manual: false });
    return;
  }
  if (effect === "ending_restrain") {
    closeDialogue();
    startEnding("restrain", { manual: false });
    return;
  }
  if (effect === "ending_secret_heart") {
    closeDialogue();
    startEnding("secret_heart", { manual: false });
    return;
  }
  if (effect === "listen_father_murmur") {
    setSubtitle("把拔（自言自語）", "也太像徐若瑄了吧！", 4.5);
    closeDialogue();
    return;
  }
  if (effect === "fly_into_father_heart") {
    setSubtitle("把拔（心底的聲音）", "這一次，依然再次遇見妳。", 5.0);
    setAmbience("飛進把拔的心裡，整個世界忽然變得很安靜。只有一個聲音，很遠很遠地傳過來。");
    closeDialogue();
    return;
  }

  /* ── Choice A：切換女兒視角 ── */
  if (effect === "switch_to_daughter") {
    closeDialogue();
    state.controlMode = "daughter";
    state.flags.daughterActive = true;

    /* ── 學妹和學長在後門互望（凍結位置）── */
    const JUNIOR_MEET_X = scale(74);
    const JUNIOR_MEET_Z = scale(WORLD.backDoor.center.z - 2);
    const SENIOR_DOOR_X = scale(-324);
    const SENIOR_DOOR_Z = scale(WORLD.backDoor.center.z);
    // 學妹面向學長
    state.characters.junior.x = JUNIOR_MEET_X;
    state.characters.junior.z = JUNIOR_MEET_Z;
    state.characters.junior.rotationY = Math.atan2(
      SENIOR_DOOR_X - JUNIOR_MEET_X, SENIOR_DOOR_Z - JUNIOR_MEET_Z
    );
    // 學長面向學妹
    state.characters.senior.x = SENIOR_DOOR_X;
    state.characters.senior.z = SENIOR_DOOR_Z;
    state.characters.senior.rotationY = Math.atan2(
      JUNIOR_MEET_X - SENIOR_DOOR_X, JUNIOR_MEET_Z - SENIOR_DOOR_Z
    );

    /* 女兒觀察點：就在學妹剛才走到後門的位置（保證不卡牆）
       只轉頭看向學妹和學長中間，不移動位置 */
    const midX = (JUNIOR_MEET_X + SENIOR_DOOR_X) / 2;
    const midZ = (JUNIOR_MEET_Z + SENIOR_DOOR_Z) / 2;
    state.player.yaw = Math.atan2(state.player.x - midX, state.player.z - midZ);
    state.player.pitch = -0.04;
    state.player.velocity = { x: 0, z: 0 };

    /* 把拔和阿姨的回憶影像浮現 */
    state.characters.fatherEcho.alpha = 0.6;
    state.characters.auntEcho.alpha = 0.6;
    setSubtitle("女兒", "我現在可以去找把拔跟阿姨說話。", 5.0);
    setAmbience("世界安靜了一秒。然後妳發現，自己的眼睛變了——看出去的光，比剛才多了二十年的溫度。");
    return;
  }

  /* ── Choice B：時間回溯（抱抱學長） ── */
  if (effect === "rewind_hug_attempt") {
    closeDialogue();
    state.flags.rewindPlayed = true;

    /* Step 1: 1.0s 螢幕全黑 */
    safeTimeout(() => {
      if (dom.endingBlackout) {
        dom.endingBlackout.hidden = false;
        dom.endingBlackout.style.opacity = "1";
      }
    }, 1000);

    /* Step 2: 2.5s 蟲洞爆炸（時間線碎裂） */
    safeTimeout(() => {
      if (state.mode === "play") {
        scene.triggerWormhole(state.player.x, 0, state.player.z);
      }
    }, 2500);

    /* Step 3: 4.0s 學妹獨白 */
    safeTimeout(() => {
      if (state.mode === "play") {
        setSubtitle("學妹", "我不可以這樣做。", 3.0);
      }
    }, 4000);

    /* Step 4: 7.0s 淡出黑幕 + 二次蟲洞（回溯視覺） */
    safeTimeout(() => {
      if (dom.endingBlackout) {
        dom.endingBlackout.style.opacity = "0";
        safeTimeout(() => { dom.endingBlackout.hidden = true; }, 600);
      }
      scene.triggerWormhole(state.player.x, 0, state.player.z);
    }, 7000);

    /* Step 5: 7.5s 從快照還原狀態 */
    safeTimeout(() => {
      const snap = state.juniorControlSnapshot;
      if (!snap) return;
      state.player.x = snap.playerX;
      state.player.z = snap.playerZ;
      state.player.yaw = snap.playerYaw;
      state.player.pitch = 0;
      state.player.velocity = { x: 0, z: 0 };
      state.phase = snap.phase;
      state.phaseClock = snap.phaseClock;
      state.characters = JSON.parse(JSON.stringify(snap.characters));
      state.flags = { ...snap.flags, rewindPlayed: true };
      state.memories = new Set(snap.memories);
      state.controlMode = "junior";
      /* 重新保存快照給下次使用 */
      state.juniorControlSnapshot = {
        playerX: state.player.x,
        playerZ: state.player.z,
        playerYaw: state.player.yaw,
        phase: state.phase,
        phaseClock: state.phaseClock,
        characters: JSON.parse(JSON.stringify(state.characters)),
        flags: { ...state.flags },
        memories: new Set(state.memories),
      };
      setSubtitle("", "時間倒轉了……", 3.0);
      setAmbience("蟲洞收攏，光重新鋪回教室。一切回到那一秒以前。");
    }, 7500);
    return;
  }
}

function getInteractionById(id) {
  /* ── 玩家控制學妹模式：只能跟學長互動 ── */
  if (state.controlMode === "junior") {
    if (id === "front_call") return INTERACTIONS.senior_backdoor_choices;
    return null; // 其他 hotspot 不可互動
  }
  /* ── 女兒視角模式 ── */
  if (state.controlMode === "daughter") {
    if (id === "front_call") return INTERACTIONS.daughter_father;
    if (id === "junior") return INTERACTIONS.junior_rear_choices;
    return null;
  }

  // 意識菜市場階段：學長不出現，學妹只有 pre-phone 對話
  if (id === "front_call" && state.phase === "consciousness_market") {
    return null;
  }
  if (id === "front_call" && state.phase === "front_call") {
    return INTERACTIONS.front_call;
  }
  // 學妹：11:00前只有意識菜市場對話
  if (id === "junior" && state.phase === "consciousness_market") {
    return INTERACTIONS.junior_prephone;
  }
  // 學妹：11:00後，必須先聽到學長來電才出現「你走到後門」
  if (id === "junior" && state.phase === "front_call") {
    if (state.flags.frontCallHeard) {
      return INTERACTIONS.junior;
    }
    return INTERACTIONS.junior_prephone;
  }
  // 後門等待/一眼瞬間：學妹三個結局選項
  if (id === "junior" && (state.phase === "rear_wait" || state.phase === "eye_contact")) {
    return INTERACTIONS.junior_rear_choices;
  }
  // 學長在後門附近（rear_wait 後）
  if (id === "front_call" && (state.phase === "rear_wait" || state.phase === "eye_contact")) {
    return INTERACTIONS.senior_rear;
  }
  if (id === "backdoor" && state.phase === "consciousness_market") {
    return INTERACTIONS.aunt_market;
  }
  if (id === "backdoor" && state.phase === "front_call") {
    return INTERACTIONS.aunt_market;
  }
  if (id === "backdoor" && state.phase !== "front_call") {
    return INTERACTIONS.backdoor;
  }
  return INTERACTIONS[id];
}

function hotspotVisible(hotspot) {
  /* ── 玩家控制學妹：只看到學長 hotspot ── */
  if (state.controlMode === "junior") {
    return hotspot.id === "front_call";
  }
  /* ── 女兒視角：看到學長(把拔) 和學妹(阿姨) ── */
  if (state.controlMode === "daughter") {
    return hotspot.id === "front_call" || hotspot.id === "junior";
  }
  // 學長（front_call hotspot）在 consciousness_market 階段不出現
  if (hotspot.id === "front_call" && state.phase === "consciousness_market") {
    return false;
  }
  return hotspot.revealIn.includes(state.phase) || (state.phase === "rear_wait" && hotspot.id === "backdoor");
}

function buildHotspotState() {
  return HOTSPOTS.map((hotspot) => {
    const base = HOTSPOT_MAP[hotspot.id];
    let x = base.x;
    let z = base.z;
    if (hotspot.id === "front_call") {
      x = state.characters.senior.x;
      z = state.characters.senior.z;
    } else if (hotspot.id === "junior") {
      x = state.characters.junior.x;
      z = state.characters.junior.z;
    }
    return {
      id: hotspot.id,
      type: hotspot.type,
      label: hotspot.label,
      prompt: hotspot.prompt,
      x,
      y: base.y,
      z,
      radius: base.radius,
      visible: hotspotVisible(hotspot),
    };
  });
}

function updateActionButtons() {
  const active = state.activeHotspot;
  dom.interactBtn.disabled = false;
  dom.inspectBtn.disabled = false;
  dom.interactBtn.textContent = active ? (active.type === "memory" ? "看" : "互") : "互";
  dom.interactBtn.setAttribute("aria-label", active ? active.prompt : "互動");
  dom.inspectBtn.setAttribute("aria-label", active ? `對焦 ${active.label}` : "對焦目前目標");
}

function updateActiveHotspot() {
  if (state.mode !== "play" || state.dialogue || state.ending) {
    state.activeHotspot = null;
    state.activeHotspotId = null;
    dom.focusPrompt.classList.remove("show");
    updateActionButtons();
    return;
  }

  const hotspots = buildHotspotState();
  const isThirdPerson = state.controlMode === "junior" || state.controlMode === "daughter";
  let picked;
  if (isThirdPerson) {
    /* 第三人稱模式：用玩家位置做純距離判定（跳過角度檢查） */
    let best = null;
    for (const h of hotspots) {
      if (!h.visible) continue;
      const dx = state.player.x - h.x;
      const dz = state.player.z - h.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const maxR = h.radius * 1.6;
      if (dist > maxR) continue;
      const score = -dist;
      if (!best || score > best.score || (h.id === state.activeHotspotId && score > best.score - 0.18)) {
        best = { id: h.id, score, distance: dist, label: h.label, prompt: h.prompt };
      }
    }
    picked = best;
  } else {
    picked = scene.pickHotspot(hotspots, state.player, state.activeHotspotId);
  }
  state.activeHotspotId = picked?.id ?? null;
  state.activeHotspot = picked ? hotspots.find((item) => item.id === picked.id) : null;

  if (state.activeHotspot) {
    dom.focusPrompt.textContent = `${state.activeHotspot.prompt} · F / 點一下互動`;
    dom.focusPrompt.classList.add("show");
  } else {
    dom.focusPrompt.classList.remove("show");
  }
  updateActionButtons();
}

function openActiveInteraction() {
  if (state.mode !== "play" || state.dialogue || state.ending) {
    return;
  }
  const hotspot = state.activeHotspot;
  if (!hotspot) {
    revealHint("先靠近前門、學妹、黑板、座位、講義或後門。");
    return;
  }
  const interaction = getInteractionById(hotspot.id);
  if (!interaction) {
    return;
  }
  openDialogue(interaction);
}

function lookToward(target, strength = 0.42) {
  const yaw = yawToTarget(state.player, target);
  const pitch = pitchToTarget(state.player, target);
  state.player.yaw = lerp(state.player.yaw, yaw, strength);
  state.player.pitch = lerp(state.player.pitch, pitch, strength);
}

function resetView() {
  const target = phaseLookTarget(state.phase);
  state.player.yaw = yawToTarget(state.player, target);
  state.player.pitch = phaseDefaultPitch(state.phase, state.player);
  revealHint("視線已帶回這一段的目標方向。");
}

function captureReplayState() {
  return {
    phase: state.phase,
    phaseClock: state.phaseClock,
    player: {
      x: state.player.x,
      y: state.player.y,
      z: state.player.z,
      yaw: state.player.yaw,
      pitch: state.player.pitch,
      velocity: { ...state.player.velocity },
    },
    subtitle: { ...state.subtitle },
    ambience: { ...state.ambience },
    activeHotspotId: state.activeHotspotId,
  };
}

function startIntro(replay = false) {
  if (state.dialogue) {
    closeDialogue();
  }
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock?.();
  }
  clearTransientInput();
  state.mode = "intro";
  state.cameraMode = "intro";
  state.intro.progress = 0;
  state.intro.time = 0;
  state.intro.replay = replay;
  state.intro.resume = replay ? captureReplayState() : null;
  state.introBeatIndex = 0;
  state.introCameraTrack = INTRO_BEATS[0].id;
  state.cinematicGlow = 0;
  state.ending = null;
  state.endingSequence = null;
  dom.endingOverlay.hidden = true;
  dom.body.classList.remove("ending-open");
  setSubtitle(INTRO_BEATS[0].kicker, INTRO_BEATS[0].text, 0.2);
  setAmbience(INTRO_BEATS[0].ambience);
  state.subtitleMode = "full";
  syncDockState();
  logDebug("intro", replay ? "replay" : "start");
}

function finishIntro() {
  const resume = state.intro.replay ? state.intro.resume : null;
  clearTransientInput();
  state.mode = "play";
  state.cameraMode = "play";
  state.intro.replay = false;
  state.intro.resume = null;
  // Hide skip button when intro naturally ends or is skipped
  if (dom.introSkipBtn) {
    dom.introSkipBtn.hidden = true;
  }
  // Deactivate time-travel intro FX overlay
  if (dom.introFx) {
    dom.introFx.classList.remove("intro-fx-active");
    dom.introFx.classList.add("intro-fx-done");
    // Force hide immediately to prevent white screen stuck
    dom.introFx.style.display = "none";
    // Belt-and-suspenders: also hide after transition
    setTimeout(() => { if (dom.introFx) dom.introFx.style.display = "none"; }, 2000);
  }
  // 對話紀錄預設收合，玩家需要時自行展開
  state.transcriptExpanded = false;
  syncTranscriptUI();

  if (resume) {
    state.phase = resume.phase;
    state.phaseClock = resume.phaseClock;
    state.player.x = resume.player.x;
    state.player.y = resume.player.y;
    state.player.z = resume.player.z;
    state.player.yaw = resume.player.yaw;
    state.player.pitch = resume.player.pitch;
    state.player.velocity = { ...resume.player.velocity };
    setSubtitle(resume.subtitle.source, resume.subtitle.text, 2.8);
    setAmbience(resume.ambience.text);
  } else {
    state.player = {
      ...createInitialPlayer(),
      velocity: { x: 0, z: 0 },
      lookInput: { x: 0, y: 0 },
      isGhostObserver: true,
    };
    setSubtitle("女兒", "意識市集開始了，這是把拔跟阿姨的第一次見面。四周的記憶碎片正在浮現⋯⋯", 8);
    setAmbience("十點四十分，教室像一只剛被打開的舊鐘，所有指針還沒對準。走廊的風撥動粉筆灰，陽光沿著矮牆一格一格鋪進來。");
  }

  state.subtitleMode = "full";
  syncDockState();
  updateObjective(true);
  updatePointerHint();
}

function startEnding(type, options = {}) {
  if (state.endingSequence) {
    return;
  }
  const { manual = false } = options;
  state.ending = type;
  state.endingSequence = { type, time: 0, manual, shotPhase: type === "perfect" ? "walk-in" : "fade" };
  state.cameraMode = "ending";
  state.controlMode = "ghost"; // 結局期間回歸鬼魂觀察模式
  state.transcriptExpanded = true;
  syncTranscriptUI();
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock?.();
  }
  if (type === "perfect") {
    state.phase = "eye_contact";
    state.phaseClock = 0;
    state.flags.perfectLinePlayed = false;
    setSubtitle("女兒", "光先落在她身上，像整條四樓走廊和整間教室都往後慢慢退開，只剩她一個人被時間輕輕托住。", 6.2);
    setAmbience("四樓後門那一側忽然靜下來，只剩陽光沿著無天花板的走廊、玻璃和地面慢慢推進來，把她留在最亮的那一格。");
  } else if (type === "perfect_eye") {
    state.phase = "eye_contact";
    state.phaseClock = 0;
    state.flags.perfectLinePlayed = false;
    state.flags.oneGazeTextShown = false;
    state.flags.oneGazeUIHidden = false;
    hideAllGameUI();
    hideCenteredSubtitle();
    state.flags.oneGazeUIHidden = true;
  } else if (type === "one_gaze") {
    state.phase = "eye_contact";
    state.phaseClock = 0;
    state.flags.perfectLinePlayed = false;
    state.flags.oneGazeTextShown = false;
    state.flags.oneGazeUIHidden = false;
    hideAllGameUI();
    hideCenteredSubtitle();
    state.flags.oneGazeUIHidden = true;
  } else if (type === "restrain") {
    setSubtitle("女兒", "可是我的手……", 4.5);
    setAmbience("畫面開始變暗。");
  } else if (type === "secret_heart") {
    setSubtitle("女兒", "我飛進阿姨的心裡了！裡面好多好多彩色的線在飛！", 5);
    setAmbience("彩虹色的紅線在阿姨心裡飛舞，每一條都連向同一個方向。");
  } else {
    setSubtitle("女兒", type === "missed" ? "紅線先回彈了。" : "他出現在光裡。", 4.4);
  }
  logDebug("ending", type);
}

function startPerfectEnding() {
  if (state.dialogue) {
    closeDialogue();
  }
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock?.();
  }
  clearTransientInput();
  state.mode = "play";
  state.ending = null;
  state.endingSequence = null;
  dom.endingOverlay.hidden = true;
  dom.body.classList.remove("ending-open");
  startEnding("perfect", { manual: true });
}

/* Way B：從任務面板「飛到一眼瞬間那一秒」觸發 */
function startOneGazeEnding() {
  if (state.dialogue) closeDialogue();
  if (document.pointerLockElement === canvas) document.exitPointerLock?.();
  clearTransientInput();
  state.mode = "play";
  state.ending = null;
  state.endingSequence = null;
  dom.endingOverlay.hidden = true;
  dom.body.classList.remove("ending-open");
  startEnding("one_gaze", { manual: true });
}

function finishEndingSequence() {
  /* ── 一眼瞬間結局 → 解鎖新音樂 ── */
  if (state.ending === "one_gaze" || state.ending === "perfect_eye") {
    const justUnlocked = audioSystem.unlockSong("one_gaze_song");
    if (justUnlocked) {
      showCenteredSubtitle("", "\u{1F3B5} 已解鎖新音樂：一眼瞬間", 4.0, "center-low");
      audioSystem.switchSong("one_gaze_song");
    }
  }
  // one_gaze 與 perfect_eye 共用同一張結局卡；fallback 確保任何未知 type 不崩潰
  const endingKey = state.ending === "one_gaze" ? "perfect_eye" : (state.ending ?? "canon");
  const ending = ENDINGS[endingKey] ?? ENDINGS["canon"];
  dom.endingKicker.textContent = ending.kicker;
  dom.endingTitle.textContent = ending.title;
  dom.endingCopy.textContent = ending.copy;
  state.endingSequence = null;
  state.cameraMode = "play";
  // Reset blackout/whiteout overlays
  if (dom.endingBlackout) { dom.endingBlackout.hidden = true; dom.endingBlackout.style.opacity = "0"; }
  if (dom.endingWhiteout) { dom.endingWhiteout.hidden = true; dom.endingWhiteout.style.opacity = "0"; dom.endingWhiteout.classList.remove("sky"); }
  dom.bottomDock.classList.remove("above-blackout");
  // 清除置中字幕並恢復 UI
  hideCenteredSubtitle();
  showAllGameUI();
  dom.endingOverlay.hidden = false;
  dom.body.classList.add("ending-open");
  // 確保按鈕區域在手機上可見：等動畫完成後自動滾到結局操作按鈕
  safeTimeout(() => {
    const actions = document.querySelector(".ending-actions");
    if (actions) actions.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 1600);
}

function resetScene() {
  clearAllPendingTimers();
  clearTransientInput();
  state.mode = "play";
  state.cameraMode = "play";
  state.phase = "consciousness_market";
  state.phaseClock = 0;
  state.time = 0;
  state.ending = null;
  state.endingSequence = null;
  state.dialogue = null;
  state.flags = createInitialFlags();
  state.player = {
    ...createInitialPlayer(),
    velocity: { x: 0, z: 0 },
    lookInput: { x: 0, y: 0 },
    isGhostObserver: true,
  };
  state.characters = createInitialCharacters();
  state.controlMode = "ghost";
  state.juniorControlSnapshot = null;
  state.cinematicGlow = 0;
  state.mobileDockExpanded = false;
  state.introBeatIndex = 0;
  state.introCameraTrack = INTRO_BEATS[0].id;
  state.transcriptExpanded = false;
  state.memories = new Set();
  state.activeHotspot = null;
  state.activeHotspotId = null;
  state.boundaryCollisionState = null;
  dom.endingOverlay.hidden = true;
  if (dom.endingBlackout) { dom.endingBlackout.hidden = true; dom.endingBlackout.style.opacity = "0"; }
  if (dom.endingWhiteout) { dom.endingWhiteout.hidden = true; dom.endingWhiteout.style.opacity = "0"; dom.endingWhiteout.classList.remove("sky"); }
  dom.bottomDock.classList.remove("above-blackout");
  dom.body.classList.remove("ending-open");
  hideCenteredSubtitle();
  showAllGameUI();
  dom.dialogueSheet.hidden = true;
  dom.body.classList.remove("dialogue-open");
  updateObjective(true);
  updateMemoryList();
  setSubtitle("女兒", "意識市集開始了，這是把拔跟阿姨的第一次見面。四周的記憶碎片正在浮現⋯⋯", 5);
  setAmbience("十點四十分的教室只有陽光和粉筆灰，走廊的風帶著校園樹葉的氣味，一切還停在被喚醒之前。");
  syncDockState();
  updatePointerHint();
  logDebug("scene", "reset");
}

function updateMovement(dt) {
  if (state.mode !== "play" || state.dialogue || state.endingSequence || wantsLandscape()) {
    const friction = 1 - Math.min(1, 6.4 * dt);
    state.player.velocity.x *= friction;
    state.player.velocity.z *= friction;
    if (Math.abs(state.player.velocity.x) < 0.0001) state.player.velocity.x = 0;
    if (Math.abs(state.player.velocity.z) < 0.0001) state.player.velocity.z = 0;
    state.subtitleMode = state.subtitle.ttl > 0.12 ? "full" : wantsLandscape() ? "hidden" : "compact";
    syncDockState();
    return;
  }

  const keyMoveX = (state.keyboard.KeyD || state.keyboard.ArrowRight ? 1 : 0) - (state.keyboard.KeyA || state.keyboard.ArrowLeft ? 1 : 0);
  const keyMoveY = (state.keyboard.KeyW || state.keyboard.ArrowUp ? 1 : 0) - (state.keyboard.KeyS || state.keyboard.ArrowDown ? 1 : 0);
  const keyLookX = (state.keyboard.KeyE ? 1 : 0) - (state.keyboard.KeyQ ? 1 : 0);
  const keyLookY = (state.keyboard.PageUp ? 1 : 0) - (state.keyboard.PageDown ? 1 : 0);
  const moveX = clamp(state.input.moveX + keyMoveX, -1, 1);
  const moveY = clamp(state.input.moveY + keyMoveY, -1, 1);
  const lookX = clamp(state.input.lookX + keyLookX * 0.85, -1, 1);
  const lookY = clamp(state.input.lookY + keyLookY * 0.85, -1, 1);

  state.player.lookInput.x = lookX;
  state.player.lookInput.y = lookY;

  const lookSpeed = (isMobileLayout() ? MOBILE_LOOK_SPEED : DESKTOP_LOOK_SPEED) * currentLookScalar();
  const lookSmooth = 1 - Math.exp(-14 * dt);
  state.player.yaw -= lookX * dt * lookSpeed;
  state.player.pitch = clamp(state.player.pitch - lookY * dt * 1.34 * currentLookScalar(), MIN_PITCH, MAX_PITCH);

  const forwardX = -Math.sin(state.player.yaw);
  const forwardZ = -Math.cos(state.player.yaw);
  const rightX = Math.cos(state.player.yaw);
  const rightZ = -Math.sin(state.player.yaw);
  const baseSpeed = state.phase === "eye_contact" ? scale(168) : scale(264);
  const inputMag = Math.min(1, Math.hypot(moveX, moveY));

  const targetVX = (forwardX * moveY + rightX * moveX) * baseSpeed;
  const targetVZ = (forwardZ * moveY + rightZ * moveX) * baseSpeed;

  const isAccelerating = inputMag > 0.05;
  const accelRate = isAccelerating ? 1 - Math.exp(-5.8 * dt) : 0;
  const decelRate = isAccelerating ? 0 : 1 - Math.exp(-4.2 * dt);
  const blendRate = isAccelerating ? accelRate : decelRate;

  if (isAccelerating) {
    state.player.velocity.x = lerp(state.player.velocity.x, targetVX, blendRate);
    state.player.velocity.z = lerp(state.player.velocity.z, targetVZ, blendRate);
  } else {
    const friction = 1 - Math.min(1, 4.2 * dt);
    state.player.velocity.x *= friction;
    state.player.velocity.z *= friction;
    if (Math.abs(state.player.velocity.x) < 0.0002) state.player.velocity.x = 0;
    if (Math.abs(state.player.velocity.z) < 0.0002) state.player.velocity.z = 0;
  }

  const desired = {
    x: state.player.x + state.player.velocity.x * dt,
    z: state.player.z + state.player.velocity.z * dt,
  };
  const resolved = scene.resolveMotion({ x: state.player.x, z: state.player.z }, desired, PLAYER_RADIUS);
  if (resolved.collided) {
    state.player.velocity.x *= 0.3;
    state.player.velocity.z *= 0.3;
  }
  state.player.x = resolved.x;
  state.player.z = resolved.z;
  state.boundaryCollisionState = resolved.collided ? resolved.label : null;

  /* ── 角色間物理碰撞：學妹不可穿過學長 ── */
  if (state.controlMode === "junior" || state.controlMode === "daughter") {
    const CHARACTER_RADIUS = scale(36);
    const sr = state.characters.senior;
    const cdx = state.player.x - sr.x;
    const cdz = state.player.z - sr.z;
    const cDist = Math.sqrt(cdx * cdx + cdz * cdz);
    const minDist = CHARACTER_RADIUS * 2;
    if (cDist < minDist && cDist > 0.001) {
      const push = minDist - cDist + 0.002;
      state.player.x += (cdx / cDist) * push;
      state.player.z += (cdz / cDist) * push;
      state.player.velocity.x *= 0.2;
      state.player.velocity.z *= 0.2;
    }
  }

  /* ── 玩家控制學妹時：同步學妹模型位置 ── */
  if (state.controlMode === "junior") {
    state.characters.junior.x = state.player.x;
    state.characters.junior.z = state.player.z;
    state.characters.junior.rotationY = state.player.yaw;
  }

  const currentSpeed = Math.hypot(state.player.velocity.x, state.player.velocity.z);
  const moving = currentSpeed > scale(26);
  const looking = Math.abs(lookX) > 0.18 || Math.abs(lookY) > 0.18 || Boolean(state.dragLook) || document.pointerLockElement === canvas;
  if (state.subtitle.ttl > 0.12) {
    state.subtitleMode = "full";
  } else if (isMobileLandscape()) {
    state.subtitleMode = "hidden";
  } else if (moving || looking) {
    state.subtitleMode = "compact";
  } else {
    state.subtitleMode = "compact";
  }
  syncDockState();

  const stepInterval = moving ? Math.max(0.28, 0.52 - currentSpeed * 0.6) : 0.42;
  if (moving && state.time - state.sound.playerStepAt > stepInterval) {
    state.sound.playerStepAt = state.time;
    audioSystem.playCue("step");
  }
}

function setCharacterPose(name, x, z, rotationY, alpha = 1) {
  state.characters[name].x = x;
  state.characters[name].z = z;
  state.characters[name].rotationY = rotationY;
  if ("alpha" in state.characters[name]) {
    state.characters[name].alpha = alpha;
  }
}

function updateCharacters() {
  // 意識菜市場：學長不出現（遠距離、透明）
  if (state.phase === "consciousness_market") {
    setCharacterPose("senior", scale(-9999), scale(-9999), 0, 0);
    setCharacterPose("junior", scale(1896), scale(2058), Math.PI);
    setCharacterPose("fatherEcho", scale(-272), scale(WORLD.backDoor.center.z + 2), Math.PI / 2, 0);
    setCharacterPose("auntEcho", scale(-116), scale(WORLD.backDoor.center.z + 26), -Math.PI / 2, 0);
    return;
  }

  if (state.endingSequence?.type === "perfect") {
    const et = state.endingSequence.time;
    /* 常數 */
    const SENIOR_START_X  = scale(-334);
    const SENIOR_START_Z  = scale(WORLD.frontDoor.center.z - 44);
    const SENIOR_END_X    = scale(-318);
    const SENIOR_END_Z    = scale(WORLD.backDoor.center.z + 4);
    const JUNIOR_DOOR_X   = scale(100);
    const JUNIOR_DOOR_Z   = scale(WORLD.backDoor.center.z - 4);
    /* 學長初始面向教室方向，結束時面向學妹 */
    const SR_INIT_YAW = Math.atan2(scale(1896) - SENIOR_START_X, scale(2058) - SENIOR_START_Z);
    const SR_DOOR_YAW = Math.atan2(JUNIOR_DOOR_X - SENIOR_END_X, JUNIOR_DOOR_Z - SENIOR_END_Z);
    /* ── 學長：站前門 → 轉身面後門 → 慢走到後門 → 轉身面學妹 ── */
    let srX, srZ, srYaw;
    if (et < 1.62) {
      srX = SENIOR_START_X; srZ = SENIOR_START_Z; srYaw = SR_INIT_YAW;
    } else if (et < 4.86) {
      const t = smoothstep(1.62, 4.86, et);
      srX = SENIOR_START_X; srZ = SENIOR_START_Z;
      srYaw = lerp(SR_INIT_YAW, Math.PI, t);
    } else if (et < 31.5) {
      const t = smoothstep(4.86, 31.5, et);
      srX = lerp(SENIOR_START_X, SENIOR_END_X, t);
      srZ = lerp(SENIOR_START_Z, SENIOR_END_Z, t);
      srYaw = Math.PI;
    } else if (et < 39.0) {
      const t = smoothstep(31.5, 39.0, et);
      srX = SENIOR_END_X; srZ = SENIOR_END_Z;
      srYaw = lerp(Math.PI, SR_DOOR_YAW, t);
    } else {
      srX = SENIOR_END_X; srZ = SENIOR_END_Z; srYaw = SR_DOOR_YAW;
    }
    /* ── 學妹：像 one_gaze 的分段走路動畫（速度 ×3，共 45 秒） ── */
    const SEAT_X      = scale(1896);
    const SEAT_Z      = scale(2058);
    const WALL_Z      = scale(WORLD.classroom.backZ ?? 2484);
    const AISLE_X     = scale(WORLD.classroom.aisleX ?? 1180);
    const NEAR_DOOR_Z = scale(780);
    let jrX, jrZ, jrYaw;
    if (et < 3.0) {
      jrX = SEAT_X; jrZ = SEAT_Z; jrYaw = 0;
    } else if (et < 5.4) {
      const t = smoothstep(3.0, 5.4, et);
      jrX = SEAT_X; jrZ = SEAT_Z; jrYaw = lerp(0, Math.PI, t);
    } else if (et < 13.5) {
      const t = smoothstep(5.4, 13.5, et);
      jrX = SEAT_X; jrZ = lerp(SEAT_Z, WALL_Z, t); jrYaw = Math.PI;
    } else if (et < 16.5) {
      jrX = SEAT_X; jrZ = WALL_Z; jrYaw = Math.PI;
    } else if (et < 18.9) {
      const t = smoothstep(16.5, 18.9, et);
      jrX = SEAT_X; jrZ = WALL_Z; jrYaw = lerp(Math.PI, 3 * Math.PI / 2, t);
    } else if (et < 25.5) {
      const t = smoothstep(18.9, 25.5, et);
      jrX = lerp(SEAT_X, AISLE_X, t); jrZ = WALL_Z; jrYaw = 3 * Math.PI / 2;
    } else if (et < 27.9) {
      const t = smoothstep(25.5, 27.9, et);
      jrX = AISLE_X; jrZ = WALL_Z; jrYaw = lerp(3 * Math.PI / 2, 2 * Math.PI, t);
    } else if (et < 40.5) {
      const t = smoothstep(27.9, 40.5, et);
      jrX = AISLE_X; jrZ = lerp(WALL_Z, NEAR_DOOR_Z, t); jrYaw = 0;
    } else if (et < 42.6) {
      const t = smoothstep(40.5, 42.6, et);
      jrX = AISLE_X; jrZ = NEAR_DOOR_Z; jrYaw = lerp(0, -Math.PI / 2, t);
    } else {
      const t = smoothstep(42.6, 45.0, et);
      jrX = lerp(AISLE_X, JUNIOR_DOOR_X, t);
      jrZ = lerp(NEAR_DOOR_Z, JUNIOR_DOOR_Z, t);
      jrYaw = -Math.PI / 2;
    }
    setCharacterPose("senior", srX, srZ, srYaw);
    setCharacterPose("junior", jrX, jrZ, jrYaw);
    setCharacterPose("fatherEcho", scale(-272), scale(WORLD.backDoor.center.z + 2), Math.PI / 2, 0);
    setCharacterPose("auntEcho", scale(-116), scale(WORLD.backDoor.center.z + 26), -Math.PI / 2, 0);
    return;
  }

  /* ── Way A / Way B：perfect_eye / one_gaze 結局角色動畫 ── */
  if (state.endingSequence?.type === "perfect_eye" || state.endingSequence?.type === "one_gaze") {
    const et = state.endingSequence.time;
    /* 學長隱藏在景深外 */
    setCharacterPose("senior", scale(-9999), scale(-9999), 0, 0);
    setCharacterPose("fatherEcho", scale(-272), scale(WORLD.backDoor.center.z + 2), Math.PI / 2, 0);
    setCharacterPose("auntEcho", scale(-116), scale(WORLD.backDoor.center.z + 26), -Math.PI / 2, 0);

    /* 學妹維持在當前位置（玩家已操控走到後門） — 面向學長 */
    const srPos = state.characters.senior;
    const jrFaceYaw = Math.atan2(srPos.x - state.characters.junior.x, srPos.z - state.characters.junior.z);
    setCharacterPose("junior", state.characters.junior.x, state.characters.junior.z, jrFaceYaw);
    return;
  }

  if (state.phase === "front_call") {
    /* ── 11:00 跑步過場：學長從後樓梯衝過來，跑到 LM402 前門
         過場時間：0 ~ 2.4s  (跑步)
         2.4s 後：轉身打電話的正常動畫                                    ── */
    const RUN_END = 2.4;
    if (state.phaseClock < RUN_END) {
      /* 起跑點：後樓梯出口 (唯一可見的樓梯) */
      const runStartX = scale(-360);
      const runStartZ = scale(WORLD.stairs.back.landingZ);           // 後樓梯登陸點 ~3196
      /* 終點：LM402 前門外稍前一點 */
      const runEndX   = scale(-336);
      const runEndZ   = scale(WORLD.frontDoor.center.z - 42);        // ~2292
      const runT = smoothstep(0, RUN_END, state.phaseClock);
      const runEase = 1 - Math.pow(1 - runT, 2.8);
      const srX = lerp(runStartX, runEndX, runEase);
      const srZ = lerp(runStartZ, runEndZ, runEase);
      /* 跑步方向：從後樓梯往前門跑（-Z 方向） */
      const runYaw = Math.PI;
      setCharacterPose("senior", srX, srZ, runYaw);
      setCharacterPose("junior", scale(1896), scale(2058), Math.PI);
      setCharacterPose("fatherEcho", scale(-272), scale(WORLD.backDoor.center.z + 2), Math.PI / 2, 0);
      setCharacterPose("auntEcho", scale(-116), scale(WORLD.backDoor.center.z + 26), -Math.PI / 2, 0);
      return;
    }
    /* RUN_END 之後：學長站在走廊前門，轉身面向學妹座位 */
    const pc = state.phaseClock - RUN_END;
    const turnT = smoothstep(0, 1.5, pc);
    const seniorStandX = scale(-336);
    const seniorStandZ = scale(WORLD.frontDoor.center.z - 42);
    const juniorFaceYaw = Math.atan2(scale(1896) - seniorStandX, scale(2058) - seniorStandZ);
    const seniorYaw = lerp(Math.PI, juniorFaceYaw, turnT);
    setCharacterPose("senior", seniorStandX, seniorStandZ, seniorYaw);
    setCharacterPose("junior", scale(1896), scale(2058), Math.PI);
    setCharacterPose("fatherEcho", scale(-272), scale(WORLD.backDoor.center.z + 2), Math.PI / 2, 0);
    setCharacterPose("auntEcho", scale(-116), scale(WORLD.backDoor.center.z + 26), -Math.PI / 2, 0);
    return;
  }

  if (state.phase === "rear_wait") {
    const pc = state.phaseClock;
    /* ── 學長：轉身面後門 → 慢走到後門 → 轉身面學妹（共 ~17.4s）── */
    const SR_START_X  = scale(-342);
    const SR_START_Z  = scale(WORLD.frontDoor.center.z - 42);
    const SR_END_X    = scale(-324);
    const SR_END_Z    = scale(WORLD.backDoor.center.z);
    const MEET_X      = scale(74);
    const MEET_Z      = scale(WORLD.backDoor.center.z - 2);
    const SR_INIT_YAW = Math.atan2(scale(1896) - SR_START_X, scale(2058) - SR_START_Z);
    const SR_END_YAW  = Math.atan2(MEET_X - SR_END_X, MEET_Z - SR_END_Z);
    let srX, srZ, srYaw;
    if (pc < 0.3) {
      srX = SR_START_X; srZ = SR_START_Z; srYaw = SR_INIT_YAW;
    } else if (pc < 3.0) {
      const t = smoothstep(0.3, 3.0, pc);
      srX = SR_START_X; srZ = SR_START_Z;
      srYaw = lerp(SR_INIT_YAW, Math.PI, t);
    } else if (pc < 15.6) {
      const t = smoothstep(3.0, 15.6, pc);
      srX = lerp(SR_START_X, SR_END_X, t);
      srZ = lerp(SR_START_Z, SR_END_Z, t);
      srYaw = Math.PI;
    } else if (pc < 17.4) {
      const t = smoothstep(15.6, 17.4, pc);
      srX = SR_END_X; srZ = SR_END_Z;
      srYaw = lerp(Math.PI, SR_END_YAW, t);
    } else {
      srX = SR_END_X; srZ = SR_END_Z; srYaw = SR_END_YAW;
    }
    setCharacterPose("senior", srX, srZ, srYaw);

    /* ── 玩家控制學妹 / 女兒視角：跳過學妹腳本動畫 ── */
    if (state.controlMode === "junior" || state.controlMode === "daughter") {
      if (state.controlMode === "daughter") {
        /* 女兒視角：學妹和學長凍結在後門互望 */
        const JM_X = scale(74);
        const JM_Z = scale(WORLD.backDoor.center.z - 2);
        const SD_X = scale(-324);
        const SD_Z = scale(WORLD.backDoor.center.z);
        setCharacterPose("junior", JM_X, JM_Z,
          Math.atan2(SD_X - JM_X, SD_Z - JM_Z));
        setCharacterPose("senior", SD_X, SD_Z,
          Math.atan2(JM_X - SD_X, JM_Z - SD_Z));
      }
      /* junior 模式：學妹位置由 updateMovement() 同步，學長照腳本走 */
      const echoAlpha = state.controlMode === "daughter" ? 0.6 : 0;
      setCharacterPose("fatherEcho", scale(-272), scale(WORLD.backDoor.center.z + 2), Math.PI / 2, echoAlpha);
      setCharacterPose("auntEcho", scale(-116), scale(WORLD.backDoor.center.z + 26), -Math.PI / 2, echoAlpha * 0.9);
      return;
    }

    /* ── 原始腳本模式：學妹分段走路動畫（速度 ×3，共 45 秒）── */
    const SEAT_X      = scale(1896);
    const SEAT_Z      = scale(2058);
    const WALL_Z      = scale(WORLD.classroom.backZ ?? 2484);
    const AISLE_X     = scale(WORLD.classroom.aisleX ?? 1180);
    const JUNIOR_DOOR_X   = scale(74);
    const JUNIOR_DOOR_Z   = scale(WORLD.backDoor.center.z - 2);
    const NEAR_DOOR_Z = scale(780);
    let jrX, jrZ, jrYaw;
    if (pc < 3.0) {
      jrX = SEAT_X; jrZ = SEAT_Z; jrYaw = 0;
    } else if (pc < 5.4) {
      const t = smoothstep(3.0, 5.4, pc);
      jrX = SEAT_X; jrZ = SEAT_Z; jrYaw = lerp(0, Math.PI, t);
    } else if (pc < 13.5) {
      const t = smoothstep(5.4, 13.5, pc);
      jrX = SEAT_X; jrZ = lerp(SEAT_Z, WALL_Z, t); jrYaw = Math.PI;
    } else if (pc < 16.5) {
      jrX = SEAT_X; jrZ = WALL_Z; jrYaw = Math.PI;
    } else if (pc < 18.9) {
      const t = smoothstep(16.5, 18.9, pc);
      jrX = SEAT_X; jrZ = WALL_Z; jrYaw = lerp(Math.PI, 3 * Math.PI / 2, t);
    } else if (pc < 25.5) {
      const t = smoothstep(18.9, 25.5, pc);
      jrX = lerp(SEAT_X, AISLE_X, t); jrZ = WALL_Z; jrYaw = 3 * Math.PI / 2;
    } else if (pc < 27.9) {
      const t = smoothstep(25.5, 27.9, pc);
      jrX = AISLE_X; jrZ = WALL_Z; jrYaw = lerp(3 * Math.PI / 2, 2 * Math.PI, t);
    } else if (pc < 40.5) {
      const t = smoothstep(27.9, 40.5, pc);
      jrX = AISLE_X; jrZ = lerp(WALL_Z, NEAR_DOOR_Z, t); jrYaw = 0;
    } else if (pc < 42.6) {
      const t = smoothstep(40.5, 42.6, pc);
      jrX = AISLE_X; jrZ = NEAR_DOOR_Z; jrYaw = lerp(0, -Math.PI / 2, t);
    } else {
      const t = smoothstep(42.6, 45.0, pc);
      jrX = lerp(AISLE_X, JUNIOR_DOOR_X, t);
      jrZ = lerp(NEAR_DOOR_Z, JUNIOR_DOOR_Z, t);
      jrYaw = -Math.PI / 2;
    }
    setCharacterPose("junior", jrX, jrZ, jrYaw);
    setCharacterPose("fatherEcho", scale(-272), scale(WORLD.backDoor.center.z + 2), Math.PI / 2, 0);
    setCharacterPose("auntEcho", scale(-116), scale(WORLD.backDoor.center.z + 26), -Math.PI / 2, 0);
    return;
  }

  const seniorT = smoothstep(0.8, 4.0, state.phaseClock);
  const juniorT = smoothstep(0.2, 3.4, state.phaseClock);
  const seniorX = lerp(scale(-356), scale(-332), seniorT * 0.8);
  const seniorZ = lerp(scale(WORLD.backDoor.center.z + 4), scale(WORLD.backDoor.center.z), seniorT);
  const juniorX = lerp(scale(84), scale(58), juniorT);
  const juniorZ = lerp(scale(WORLD.backDoor.center.z + 2), scale(WORLD.backDoor.center.z - 2), juniorT);
  const echoAlpha = smoothstep(2.2, 4.0, state.phaseClock) * (1 - smoothstep(5.2, 6.1, state.phaseClock));

  setCharacterPose("senior", seniorX, seniorZ, movementRotation(juniorX - seniorX, juniorZ - seniorZ, 0));
  setCharacterPose("junior", juniorX, juniorZ, movementRotation(seniorX - juniorX, seniorZ - juniorZ, -Math.PI / 2));
  setCharacterPose("fatherEcho", scale(-272), scale(WORLD.backDoor.center.z + 2), Math.PI / 2, echoAlpha * 0.6);
  setCharacterPose("auntEcho", scale(-116), scale(WORLD.backDoor.center.z + 26), -Math.PI / 2, echoAlpha * 0.74);
}

function updateCharacterAudio(dt) {
  if (state.mode === "intro") {
    if (state.intro.time > 10.2 && state.intro.time < 17.2 && state.time - state.sound.seniorStepAt > 0.48) {
      state.sound.seniorStepAt = state.time;
      audioSystem.playCue("step");
    }
    return;
  }

  const seniorWalking =
    (state.phase === "front_call" && state.phaseClock < 2.4) ||
    (state.phase === "rear_wait" && state.phaseClock > 3.0 && state.phaseClock < 15.6) ||
    (state.phase === "eye_contact" && state.phaseClock < 2.8) ||
    (state.endingSequence?.type === "perfect" && state.endingSequence.time > 4.86 && state.endingSequence.time < 31.5);
  const juniorWalking =
    (state.phase === "rear_wait" && state.controlMode === "ghost" && state.phaseClock > 5.4 && state.phaseClock < 42.6) ||
    (state.endingSequence?.type === "perfect" && state.endingSequence.time > 5.4 && state.endingSequence.time < 42.6);

  if (seniorWalking && state.time - state.sound.seniorStepAt > 0.48) {
    state.sound.seniorStepAt = state.time;
    audioSystem.playCue("step");
  }
  if (juniorWalking && state.time - state.sound.juniorStepAt > 0.72) {
    state.sound.juniorStepAt = state.time;
    audioSystem.playCue("step");
  }
}

function updatePhaseLogic(dt) {
  state.phaseClock += dt;

  // 意識菜市場自動過渡到 front_call：phaseClock 60s = 遊戲時間 11:00
  if (state.phase === "consciousness_market" && state.phaseClock >= 60 && !state.flags.autoFrontCall) {
    state.flags.autoFrontCall = true;
    setPhase("front_call");
    audioSystem.playCue("phone");
    setSubtitle("學長", "「妳在哪裡？」", 4.0);
    safeTimeout(() => {
      if (state.mode === "play") {
        setSubtitle("女兒", "11 點鐘響了！把拔從前面的樓梯走上來，站在前門打電話。", 5.0);
      }
    }, 4500);
    setAmbience("鐘聲響了。走廊那一端傳來腳步聲，有人正在打電話。菜市場裡的聲音同時安靜下來，只剩 29 歲輕輕說：『來了。』");
  }

  if (state.phase === "rear_wait" && state.phaseClock > 1.2 && !state.flags.rearWaitHintPlayed) {
    state.flags.rearWaitHintPlayed = true;
    setSubtitle("39 歲的聲音", "難的是『站好』。等一下他真的往這裡走的時候，妳全身都會想往前衝。", 4.6);
  }

  if (state.phase === "eye_contact") {
    if (state.phaseClock > 0.6 && !state.flags.eyeCuePlayed) {
      state.flags.eyeCuePlayed = true;
      setSubtitle("49 歲的聲音", "站好。留一點空白給命運，也留一點空白給妳自己。", 4.6);
    }

    const target = WORLD_POINTS.eyeLook;
    const aligned =
      angleDifference(state.player.yaw, yawToTarget(state.player, target)) < 0.3 &&
      Math.abs(state.player.pitch - pitchToTarget(state.player, target)) < 0.26 &&
      Math.hypot(state.player.x - WORLD_POINTS.focusMark.x, state.player.z - WORLD_POINTS.focusMark.z) < scale(122);

    state.cinematicGlow = smoothstep(CINEMATIC_TIMELINE.successWindow[0], CINEMATIC_TIMELINE.successWindow[1], state.phaseClock);
    if (state.phaseClock >= CINEMATIC_TIMELINE.lockWindow && !state.endingSequence) {
      if (aligned) {
        startEnding(state.memories.size >= 4 ? "memory" : "canon");
      } else {
        startEnding("missed");
      }
    }
  } else {
    state.cinematicGlow = 0;
  }
}

function updateEndingSequence(dt) {
  if (!state.endingSequence) {
    return;
  }
  if (!Number.isFinite(state.endingSequence.time)) {
    finishEndingSequence();
    return;
  }
  state.endingSequence.time += dt;
  if (state.ending === "perfect") {
    // 完美結局：跟拍鏡頭 → 學妹停門口 → 拍臉 5 秒 → 金句
    const PERFECT_WALK_END = 45.0;
    const PERFECT_QUOTE_AT = PERFECT_WALK_END + 5.0; // 50 秒後顯示金句
    const PERFECT_TOTAL    = PERFECT_QUOTE_AT + 13.0; // 63 秒後結束
    state.endingSequence.shotPhase = state.endingSequence.time < PERFECT_WALK_END ? "walk" : "face";
    if (!state.flags.perfectLine1Played && state.endingSequence.time >= (CINEMATIC_TIMELINE.perfectLine1At ?? 27.6)) {
      state.flags.perfectLine1Played = true;
      setSubtitle("學長（心底的聲音）", "也太像徐若瑄了吧！", 5.0);
      setAmbience("學長心裡先跳出一句很不正經的念頭。他還不知道，這一秒會記二十年。");
    }
    if (!state.flags.perfectLine2Played && state.endingSequence.time >= PERFECT_QUOTE_AT) {
      state.flags.perfectLine2Played = true;
      setSubtitle("", "這一次，依然再次遇見妳。", 10.0);
      setAmbience("這一次，依然再次遇見妳。");
    }
    if (state.endingSequence.time > PERFECT_TOTAL && dom.endingOverlay.hidden) {
      finishEndingSequence();
    }
    return;
  }

  /* ── Way A：perfect_eye（從對話選項「乖乖站著不動」觸發）
     玩家已自己走到後門，不需走路動畫 → 靜態臉部特寫 5 秒 → 字幕 10 秒   ── */
  if (state.ending === "perfect_eye") {
    const FACE_DUR  = 5.0;
    const TEXT_START = FACE_DUR;
    const TEXT_DUR   = 5.0;
    const TOTAL_DUR  = TEXT_START + TEXT_DUR;
    state.endingSequence.shotPhase = "face";

    /* 隱藏全部 UI（含字幕） */
    if (!state.flags.oneGazeUIHidden) {
      state.flags.oneGazeUIHidden = true;
      hideAllGameUI();
      hideCenteredSubtitle();
    }

    /* 5 秒後顯示唯一一行文字，置中下方 */
    if (!state.flags.oneGazeTextShown && state.endingSequence.time >= TEXT_START) {
      state.flags.oneGazeTextShown = true;
      showCenteredSubtitle("", "這一次，依然再次遇見妳。", TEXT_DUR, "center-low");
    }

    if (state.endingSequence.time > TOTAL_DUR && dom.endingOverlay.hidden) {
      hideCenteredSubtitle();
      showAllGameUI();
      finishEndingSequence();
    }
    return;
  }

  /* ── Way B：one_gaze（從任務面板「飛到一眼瞬間那一秒」觸發）
     學長視角看學妹眼睛、無 UI、置中偏下字幕 ── */
  if (state.ending === "one_gaze") {
    const FACE_DUR  = 5.0;
    const TEXT_START = FACE_DUR;
    const TEXT_DUR   = 5.0;
    const TOTAL_DUR  = TEXT_START + TEXT_DUR;
    state.endingSequence.shotPhase = "face";

    /* 隱藏全部 UI（含字幕） */
    if (!state.flags.oneGazeUIHidden) {
      state.flags.oneGazeUIHidden = true;
      hideAllGameUI();
      hideCenteredSubtitle();
    }

    /* 5 秒後顯示唯一一行文字，置中下方 */
    if (!state.flags.oneGazeTextShown && state.endingSequence.time >= TEXT_START) {
      state.flags.oneGazeTextShown = true;
      showCenteredSubtitle("", "這一次，依然再次遇見妳。", TEXT_DUR, "center-low");
    }

    if (state.endingSequence.time > TOTAL_DUR && dom.endingOverlay.hidden) {
      hideCenteredSubtitle();
      showAllGameUI();
      finishEndingSequence();
    }
    return;
  }

  if (state.ending === "restrain") {
    state.endingSequence.shotPhase = "blackout";
    // 結局B: 全黑 → "我的手慢慢在消失了。" → 5秒後 → "阿姨好像忍住沒有抱把拔..."
    if (!state.flags.restrainBlackout && state.endingSequence.time >= 1.5) {
      state.flags.restrainBlackout = true;
      // Force black screen via CSS
      if (dom.endingBlackout) {
        dom.endingBlackout.hidden = false;
        dom.endingBlackout.style.opacity = "1";
      }
      dom.bottomDock.classList.add("above-blackout");
    }
    if (!state.flags.perfectLine1Played && state.endingSequence.time >= 3) {
      state.flags.perfectLine1Played = true;
      showCenteredSubtitle("女兒", "我的手慢慢在消失了。", 5.0, "centered");
    }
    if (!state.flags.perfectLine2Played && state.endingSequence.time >= 8) {
      state.flags.perfectLine2Played = true;
      showCenteredSubtitle("女兒", "阿姨好像忍住沒有抱把拔，我的手又跑出來了，好像在變魔術喔。", 5.0, "centered");
    }
    if (state.endingSequence.time > 13 && dom.endingOverlay.hidden) {
      hideCenteredSubtitle();
      finishEndingSequence();
    }
    return;
  }

  if (state.ending === "secret_heart") {
    state.endingSequence.shotPhase = "rainbow";
    // 結局C: 彩虹紅線特效 → 字幕 → 漸白 → 彩虹文字
    if (!state.flags.perfectLine1Played && state.endingSequence.time >= 2) {
      state.flags.perfectLine1Played = true;
      showCenteredSubtitle("女兒", "我在阿姨的心裡飛來飛去，阿姨的心底都是滿滿把拔", 6, "centered");
    }
    if (!state.flags.secretWhiteout && state.endingSequence.time >= 9) {
      state.flags.secretWhiteout = true;
      // 藍天彩虹背景（取代全白）
      if (dom.endingWhiteout) {
        dom.endingWhiteout.classList.add("sky");
        dom.endingWhiteout.hidden = false;
        dom.endingWhiteout.style.opacity = "1";
      }
      dom.bottomDock.classList.add("above-blackout");
    }
    if (!state.flags.perfectLine2Played && state.endingSequence.time >= 11) {
      state.flags.perfectLine2Played = true;
      showCenteredSubtitle("", "原來阿姨跟把拔互相是一眼瞬間", 8, "centered");
    }
    if (state.endingSequence.time > 20 && dom.endingOverlay.hidden) {
      hideCenteredSubtitle();
      finishEndingSequence();
    }
    return;
  }

  const target =
    state.ending === "missed"
      ? { x: scale(-368), y: 1.34, z: scale(756), pitch: -0.04 }
      : { x: WORLD_POINTS.eyeLook.x, y: 1.38, z: WORLD_POINTS.eyeLook.z, pitch: -0.06 };

  state.player.yaw = lerp(state.player.yaw, yawToTarget(state.player, target), 0.04);
  state.player.pitch = lerp(state.player.pitch, target.pitch, 0.05);

  if (state.endingSequence.time > CINEMATIC_TIMELINE.duration && dom.endingOverlay.hidden) {
    finishEndingSequence();
  }
}

function updateIntro(dt) {
  state.intro.time += dt;
  state.intro.progress = clamp(state.intro.time / CINEMATIC_TIMELINE.introDuration, 0, 1);
  const nextBeatIndex = INTRO_BEATS.findIndex((beat) => state.intro.time >= beat.start && state.intro.time < beat.end);
  const beatIndex = nextBeatIndex === -1 ? INTRO_BEATS.length - 1 : nextBeatIndex;
  if (beatIndex !== state.introBeatIndex) {
    state.introBeatIndex = beatIndex;
    state.introCameraTrack = INTRO_BEATS[beatIndex].id;
    setSubtitle(INTRO_BEATS[beatIndex].kicker, INTRO_BEATS[beatIndex].text, 0.2);
    setAmbience(INTRO_BEATS[beatIndex].ambience);
  }
  if (state.intro.progress >= 1) {
    finishIntro();
    return;
  }
  // Safety: if tick loop stalls, force-end intro after introDuration + 2s
  if (state.intro.time > CINEMATIC_TIMELINE.introDuration + 2) {
    finishIntro();
  }
}

function buildSceneState() {
  return {
    mode: state.mode,
    phase: state.phase,
    intro: state.intro,
    introBeatIndex: state.introBeatIndex,
    introCameraTrack: state.introCameraTrack,
    player: state.player,
    characters: state.characters,
    hotspots: buildHotspotState(),
    activeHotspotId: state.activeHotspotId,
    cinematicGlow: state.cinematicGlow,
    endingSequence: state.endingSequence,
    ending: state.ending,
    controlMode: state.controlMode,
    time: state.time,
    phaseClock: state.phaseClock,
  };
}

function buildLayoutSnapshot() {
  return {
    stageBounds: rectSnapshot(document.getElementById("stage")),
    canvasBounds: rectSnapshot(canvas),
    subtitleBounds: rectSnapshot(dom.subtitleBox),
    ambienceBounds: rectSnapshot(dom.ambienceBox.hidden ? dom.ambienceChip : dom.ambienceBox),
    objectiveBounds: rectSnapshot(dom.objectivePrompt),
    controlBounds: currentControlBounds(),
  };
}

function renderDebugPanel() {
  if (!debugEnabled) {
    dom.debugPanel.hidden = true;
    return;
  }
  dom.debugPanel.hidden = false;
  const snapshot = scene.getDebugSnapshot();
  const layout = buildLayoutSnapshot();
  const text = {
    mode: state.mode,
    phase: state.phase,
    cameraMode: state.cameraMode,
    cameraAnchor:
      state.mode === "intro" ? state.introCameraTrack : state.phase === "eye_contact" ? "eye_contact" : state.phase,
    hudMode: state.hudMode,
    subtitleMode: state.subtitleMode,
    pointerLockState: state.pointerLockState,
    lastContextMenu: state.lastContextMenu,
    boundaryCollisionState: state.boundaryCollisionState,
    collisionLabel: state.boundaryCollisionState,
    activeHotspot: state.activeHotspotId,
    cameraYaw: Number(state.player.yaw.toFixed(3)),
    cameraPitch: Number(state.player.pitch.toFixed(3)),
    lookSensitivityPreset: state.lookSensitivityPreset,
    lookSensitivityScalar: Number(state.lookSensitivityScalar.toFixed(3)),
    audioEnabled: state.audioEnabled,
    mobileDensityTier: state.mobileDensityTier,
    objectiveCompact: dom.objectivePrompt.classList.contains("compact"),
    subtitleLogCount: state.subtitleLog.length,
    transcriptExpanded: state.transcriptExpanded,
    stageViewport: layout.stageBounds,
    canvasViewport: layout.canvasBounds,
    subtitleBounds: layout.subtitleBounds,
    controlBounds: layout.controlBounds,
    webglViewport: snapshot.webglViewport,
    mobileBlackRegionDetected: snapshot.mobileBlackRegionDetected,
    projectedNodes: snapshot.projectedNodes,
    hotspotLOS: snapshot.hotspotLOS,
    currentRoomIds: snapshot.currentRoomIds,
    endingShotPhase: snapshot.endingShotPhase,
    renderer: snapshot,
    events: state.debugEvents,
  };
  dom.debugText.textContent = JSON.stringify(text, null, 2);
}

function snapshotDebug() {
  const layout = buildLayoutSnapshot();
  const renderSnapshot = scene.getDebugSnapshot();
  return {
    mode: state.mode,
    phase: state.phase,
    cameraMode: state.cameraMode,
    cameraAnchor:
      state.mode === "intro" ? state.introCameraTrack : state.phase === "eye_contact" ? "eye_contact" : state.phase,
    hudMode: state.hudMode,
    subtitleMode: state.subtitleMode,
    pointerLockState: state.pointerLockState,
    lastContextMenu: state.lastContextMenu,
    boundaryCollisionState: state.boundaryCollisionState,
    collisionLabel: state.boundaryCollisionState,
    activeHotspot: state.activeHotspotId,
    cameraYaw: state.player.yaw,
    cameraPitch: state.player.pitch,
    lookSensitivityPreset: state.lookSensitivityPreset,
    lookSensitivityScalar: state.lookSensitivityScalar,
    audioEnabled: state.audioEnabled,
    objectiveCompact: dom.objectivePrompt.classList.contains("compact"),
    subtitleLogCount: state.subtitleLog.length,
    transcriptExpanded: state.transcriptExpanded,
    mobileDensityTier: state.mobileDensityTier,
    subtitle: state.subtitle.text,
    stageViewport: layout.stageBounds,
    canvasViewport: layout.canvasBounds,
    subtitleBounds: layout.subtitleBounds,
    controlBounds: layout.controlBounds,
    ambienceBounds: layout.ambienceBounds,
    objectiveBounds: layout.objectiveBounds,
    webglViewport: renderSnapshot.webglViewport,
    mobileBlackRegionDetected: renderSnapshot.mobileBlackRegionDetected,
    projectedNodes: renderSnapshot.projectedNodes,
    hotspotLOS: renderSnapshot.hotspotLOS,
    currentRoomIds: renderSnapshot.currentRoomIds,
    endingShotPhase: renderSnapshot.endingShotPhase,
    renderer: renderSnapshot,
    events: [...state.debugEvents],
  };
}

/* ── Debug API：僅在 URL 帶 ?debug=1 時暴露遊戲控制函數 ── */
if (debugEnabled) {
  window.__LM402_DEBUG__ = {
    snapshot: snapshotDebug,
    reset: resetScene,
    replayIntro: () => startIntro(true),
    skipIntro: () => { if (state.mode === "intro") finishIntro(); },
    setPhase: (id) => setPhase(id),
    applyEffect: (effect) => applyEffect(effect),
    setLookSensitivity: (scalar, preset = null) => setLookSensitivity({ scalar, preset }),
    toggleObjective: toggleObjectivePrompt,
  };
} else {
  window.__LM402_DEBUG__ = { snapshot: snapshotDebug };
}

function renderFrame() {
  try {
    scene.render(buildSceneState());
  } catch (error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    logDebug("render_error", detail.slice(0, 180));
    if (state.endingSequence) {
      state.endingSequence = null;
      state.cinematicGlow = 0;
      if (!state.ending) {
        state.ending = "canon";
      }
      finishEndingSequence();
      setSubtitle("LM402", "鏡頭先退回現場，但這一眼還是被留下來了。", 5.2);
      return;
    }
    throw error;
  }
  renderDebugPanel();
}

function tick(now) {
  try {
    if (!tick.last) {
      tick.last = now;
    }
    const dt = Math.min((now - tick.last) / 1000, 0.033);
    tick.last = now;
    state.time += dt;

    dom.rotateLock.hidden = !wantsLandscape();
    dom.body.classList.toggle("landscape-prompt", wantsLandscape());

    if (state.mode === "intro") {
      updateIntro(dt);
    } else {
      if (state.subtitle.ttl > 0) {
        state.subtitle.ttl = Math.max(0, state.subtitle.ttl - dt);
      }
      updateMovement(dt);
      updateCharacters();
      if (!state.endingSequence) {
        updatePhaseLogic(dt);
      }
      updateEndingSequence(dt);
      updateActiveHotspot();
      checkStairWarp();
      updateTimeWatch();
    }

    adaptSubtitleBackground();
    audioSystem.update(dt);
    updateCharacterAudio(dt);
    renderFrame();
  } catch (err) {
    console.error("[tick] error:", err);
    // If intro is stuck due to error, force finish it
    if (state.mode === "intro") {
      console.warn("[tick] forcing finishIntro due to tick error");
      try { finishIntro(); } catch (_) { state.mode = "play"; }
    }
  }
  requestAnimationFrame(tick);
}

function bindKeyboard() {
  window.addEventListener("keydown", (event) => {
    audioSystem.unlock();
    state.keyboard[event.code] = true;
    if (event.code === "KeyF" || event.code === "Enter") {
      event.preventDefault();
      openActiveInteraction();
      return;
    }
    if (event.code === "KeyR") {
      event.preventDefault();
      resetView();
      return;
    }
    if (event.code === "KeyG") {
      event.preventDefault();
      startIntro(true);
      return;
    }
    if (state.dialogue && /^Digit[1-9]$/.test(event.code)) {
      const index = Number(event.code.replace("Digit", "")) - 1;
      const button = dom.dialogueChoices.querySelectorAll("button")[index];
      button?.click();
      return;
    }
    if (event.code === "Escape" && state.dialogue) {
      event.preventDefault();
      closeDialogue();
      return;
    }
    if (event.code === "Escape" && document.pointerLockElement === canvas) {
      event.preventDefault();
      document.exitPointerLock?.();
    }
  });

  window.addEventListener("keyup", (event) => {
    state.keyboard[event.code] = false;
  });

  window.addEventListener("blur", () => {
    state.keyboard = Object.create(null);
    clearTransientInput();
  });
}

function attemptOrientationLock() {
  if (isMobileLayout() && screen.orientation?.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }
}

function isStageUiTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(
    target.closest(
      ".speed-widget, .speed-panel, .audio-widget, .music-prompt, .objective-prompt, .bottom-dock, .mobile-controls, button, a, input, label"
    )
  );
}

function togglePointerLock() {
  if (isMobileLayout()) {
    return;
  }
  canvas.focus({ preventScroll: true });
  const lockElement = document.pointerLockElement || document.webkitPointerLockElement || document.mozPointerLockElement;
  if (lockElement === canvas) {
    state.pointerLockPending = false;
    const exitLock = document.exitPointerLock || document.webkitExitPointerLock || document.mozExitPointerLock;
    exitLock?.call(document);
    updatePointerHint();
    return;
  }
  if (state.mode !== "play" || state.dialogue || state.endingSequence || state.ending) {
    return;
  }
  if (state.pointerLockPending) {
    return;
  }
  const requestLockFn = canvas.requestPointerLock || canvas.webkitRequestPointerLock || canvas.mozRequestPointerLock;
  if (typeof requestLockFn !== "function") {
    revealHint("這個瀏覽器目前不支援視角鎖定。");
    updatePointerHint();
    return;
  }
  state.pointerLockPending = true;
  updatePointerHint();
  const requestLock = requestLockFn.bind(canvas);
  // Safari requires the call without options; Chrome/Edge accept {unadjustedMovement: true}.
  // Try with unadjustedMovement first, fall back to plain call for Safari.
  const tryWithOptions = () => {
    try {
      const r = requestLock({ unadjustedMovement: true });
      if (r && typeof r.then === "function") return r;
    } catch (_) {/* ignore */}
    return null;
  };
  const plain = () => {
    try { return Promise.resolve(requestLock()); } catch (_) { return Promise.reject(); }
  };
  const p = tryWithOptions() ?? plain();
  p.catch(() => {
    state.pointerLockPending = false;
    // Safari may silently deny — fall back to drag-look mode silently.
    revealHint("視角鎖定不可用，改用按住左鍵拖曳看四周。");
    updatePointerHint();
  });
  window.setTimeout(() => {
    if (document.pointerLockElement !== canvas) {
      state.pointerLockPending = false;
      updatePointerHint();
    }
  }, 520);
}

function bindPointerLook() {
  let lastRightLockAt = 0;
  const handleRightLockGesture = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isMobileLayout()) {
      return;
    }
    const now = Date.now();
    if (now - lastRightLockAt < 180) {
      return;
    }
    lastRightLockAt = now;
    state.lastContextMenu = now;
    logDebug("contextmenu", document.pointerLockElement === canvas ? "exit" : "enter");
    audioSystem.unlock();
    canvas.focus({ preventScroll: true });
    togglePointerLock();
  };

  canvas.addEventListener("click", () => {
    attemptOrientationLock();
    audioSystem.unlock();
    canvas.focus({ preventScroll: true });
  });

  dom.stage.addEventListener(
    "mousedown",
    (event) => {
      if (event.button !== 2 || isStageUiTarget(event.target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      canvas.focus({ preventScroll: true });
      audioSystem.unlock();
      // Safari fix: also trigger pointer lock here on right mousedown
      // (contextmenu event alone is insufficient in Safari)
      if (
        state.mode === "play" && !state.dialogue && !state.endingSequence && !state.ending
      ) {
        const now = Date.now();
        if (now - lastRightLockAt >= 180) {
          lastRightLockAt = now;
          state.lastContextMenu = now;
          logDebug("contextmenu", document.pointerLockElement === canvas ? "exit" : "enter");
          togglePointerLock();
        }
      }
    },
    true
  );

  dom.stage.addEventListener(
    "contextmenu",
    (event) => {
      if (isStageUiTarget(event.target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (
        document.pointerLockElement === canvas ||
        (state.mode === "play" && !state.dialogue && !state.endingSequence && !state.ending)
      ) {
        handleRightLockGesture(event);
      }
    },
    true
  );

  dom.stage.addEventListener(
    "auxclick",
    (event) => {
      if (event.button === 2 && !isStageUiTarget(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  canvas.addEventListener("mousedown", (event) => {
    if (event.button !== 0 || isMobileLayout() || document.pointerLockElement === canvas) {
      return;
    }
    audioSystem.unlock();
    canvas.focus({ preventScroll: true });
    state.dragLook = { x: event.clientX, y: event.clientY };
  });

  canvas.addEventListener("pointermove", (event) => {
    if (
      !state.dragLook ||
      document.pointerLockElement === canvas ||
      state.dialogue ||
      state.mode !== "play" ||
      isMobileLayout()
    ) {
      return;
    }
    const dx = event.clientX - state.dragLook.x;
    const dy = event.clientY - state.dragLook.y;
    state.dragLook = { x: event.clientX, y: event.clientY };
    state.player.yaw -= dx * DRAG_LOOK_SPEED_X * currentLookScalar();
    state.player.pitch = clamp(state.player.pitch - dy * DRAG_LOOK_SPEED_Y * currentLookScalar(), MIN_PITCH, MAX_PITCH);
  });

  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== canvas || state.dialogue || state.mode !== "play") {
      return;
    }
    state.player.yaw -= event.movementX * LOCK_LOOK_SPEED_X * currentLookScalar();
    state.player.pitch = clamp(state.player.pitch - event.movementY * LOCK_LOOK_SPEED_Y * currentLookScalar(), MIN_PITCH, MAX_PITCH);
  });

  window.addEventListener("pointerup", () => {
    state.dragLook = null;
  });

  const onLockChange = () => {
    state.pointerLockPending = false;
    updatePointerHint();
    const locked = (document.pointerLockElement || document.webkitPointerLockElement || document.mozPointerLockElement) === canvas;
    logDebug("pointerlock", locked ? "locked" : "free");
  };
  const onLockError = () => {
    state.pointerLockPending = false;
    revealHint("瀏覽器沒有成功鎖定視角。");
    logDebug("pointerlock", "error");
    updatePointerHint();
  };
  document.addEventListener("pointerlockchange", onLockChange);
  document.addEventListener("webkitpointerlockchange", onLockChange);
  document.addEventListener("mozpointerlockchange", onLockChange);
  document.addEventListener("pointerlockerror", onLockError);
  document.addEventListener("webkitpointerlockerror", onLockError);
  document.addEventListener("mozpointerlockerror", onLockError);
}

function bindJoystick(root, assign) {
  const thumb = root.querySelector(".joystick-thumb");
  const pointerState = { id: null };

  const setVector = (clientX, clientY) => {
    const rect = root.getBoundingClientRect();
    const radius = Math.max(28, rect.width * 0.28);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const distance = Math.hypot(dx, dy);
    const limited = distance > radius ? radius / distance : 1;
    const x = (dx * limited) / radius;
    const y = (dy * limited) / radius;
    thumb.style.transform = `translate(${x * radius}px, ${y * radius}px)`;
    assign(x, y);
  };

  const release = () => {
    pointerState.id = null;
    thumb.style.transform = "translate(0px, 0px)";
    assign(0, 0);
  };

  root.addEventListener("pointerdown", (event) => {
    attemptOrientationLock();
    audioSystem.unlock();
    pointerState.id = event.pointerId;
    root.setPointerCapture(event.pointerId);
    setVector(event.clientX, event.clientY);
  });
  root.addEventListener("pointermove", (event) => {
    if (pointerState.id !== event.pointerId) return;
    setVector(event.clientX, event.clientY);
  });
  root.addEventListener("pointerup", (event) => {
    if (pointerState.id !== event.pointerId) return;
    release();
  });
  root.addEventListener("pointercancel", release);
}

function bindUI() {
  setHudCollapsed(true);
  syncAudioUI();
  dom.hudToggle.addEventListener("click", () => {
    setHudCollapsed(!dom.hud.classList.contains("collapsed"));
  });
  dom.speedToggle.addEventListener("click", () => {
    toggleSpeedPanel();
  });
  dom.speedPresets.querySelectorAll("[data-speed-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      setLookSensitivity({ preset: button.dataset.speedPreset, scalar: LOOK_PRESETS[button.dataset.speedPreset] });
    });
  });
  dom.speedRange.addEventListener("input", () => {
    setLookSensitivity({ preset: null, scalar: Number(dom.speedRange.value) / 100 });
  });
  dom.audioToggle.addEventListener("click", () => {
    /* 按鈕僅切換歌曲列表顯示/隱藏（音樂開關由歌曲列表內控制） */
    const sel = document.getElementById("song-selector");
    if (sel) {
      sel.hidden = !sel.hidden;
      if (!sel.hidden) audioSystem.syncSongUI();
      dom.audioToggleValue.textContent = sel.hidden ? "開啟音樂選單" : "關閉音樂選單";
    }
  });
  /* 音樂選單預設收合：玩家點擊「開啟音樂選單」後展開 */
  { const selInit = document.getElementById("song-selector");
    if (selInit) { selInit.hidden = true; }
  }
  dom.musicPromptButton.addEventListener("click", () => {
    if (!state.audioEnabled) {
      audioSystem.setEnabled(true);
    }
    audioSystem.unlock();
    audioSystem.dismissPrompt();
  });
  dom.musicPromptClose?.addEventListener("click", () => {
    audioSystem.dismissPrompt();
  });
  dom.perfectEndingBtn.addEventListener("click", resetScene);
  dom.perfectEndingSideBtn.addEventListener("click", resetScene);
  dom.objectivePrompt.addEventListener("click", toggleObjectivePrompt);
  dom.transcriptToggle?.addEventListener("click", () => toggleTranscript());
  dom.transcriptToggle?.addEventListener("dblclick", (e) => {
    e.preventDefault();
    toggleTranscriptMaximize();
  });
  // Intro skip button
  if (dom.introSkipBtn) {
    dom.introSkipBtn.hidden = state.mode !== "intro";
    dom.introSkipBtn.addEventListener("click", () => {
      audioSystem.unlock();
      dom.introSkipBtn.hidden = true;
      finishIntro();
    });
  }
  dom.interactBtn.addEventListener("click", openActiveInteraction);
  dom.inspectBtn.addEventListener("click", () => {
    if (state.activeHotspot) {
      lookToward(state.activeHotspot, 0.56);
      revealHint(`視線帶向：${state.activeHotspot.label}`);
    } else {
      revealHint("附近還沒有可看的目標。");
    }
  });
  dom.centerBtn.addEventListener("click", resetView);
  dom.replayBtn.addEventListener("click", () => startIntro(true));
  dom.dialogueClose.addEventListener("click", closeDialogue);
  dom.dialogueScrim.addEventListener("click", closeDialogue);
  dom.endingRetry.addEventListener("click", resetScene);
  if (dom.fontToggle) {
    dom.fontToggle.addEventListener("click", cycleFontScale);
  }
  applyFontScale();
  if (dom.qualityToggle) {
    dom.qualityToggle.addEventListener("click", cycleQualityTier);
  }
  applyQualityTier();

  /* ── D2: 按鈕發光管理 — 點擊後移除光暈 ── */
  document.querySelectorAll(
    ".ending-button, .panel-action, .action-glyph"
  ).forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.add("glow-off");
    }, { once: true });
  });

  /* ── D2: side-panel 拖移（桌機模式） ── */
  (function initSidePanelDrag() {
    const panel = dom.sidePanel;
    if (!panel) return;
    // 只在桌機上啟用浮動拖移
    if (window.innerWidth < 800) return;
    panel.classList.add("ui-float");
    // 加入拖把手提示
    const firstCard = panel.querySelector(".panel-card");
    if (firstCard) {
      const hint = document.createElement("div");
      hint.className = "ui-drag-handle-hint";
      firstCard.insertBefore(hint, firstCard.firstChild);
    }
    let dragging = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;
    const handle = firstCard || panel;
    handle.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, a, input, select")) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      origLeft = rect.left; origTop = rect.top;
      panel.style.left = origLeft + "px";
      panel.style.right = "auto";
      panel.style.top = origTop + "px";
      panel.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    panel.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      const newLeft = Math.max(0, Math.min(window.innerWidth - 60, origLeft + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - 60, origTop + dy));
      panel.style.left = newLeft + "px";
      panel.style.top = newTop + "px";
    });
    panel.addEventListener("pointerup", () => { dragging = false; });
    panel.addEventListener("pointercancel", () => { dragging = false; });
  })();

  bindJoystick(dom.moveStick, (x, y) => {
    state.input.moveX = x;
    state.input.moveY = -y;
  });
  bindJoystick(dom.lookStick, (x, y) => {
    state.input.lookX = x;
    state.input.lookY = y;
  });

  document.addEventListener("click", (event) => {
    if (dom.speedWidget.contains(event.target)) {
      return;
    }
    toggleSpeedPanel(false);
  });

  syncSpeedUI();
}

function handleResize() {
  const mobileLayout = isMobileLayout();
  const mobileLandscape = isMobileLandscape();
  const wasMobileLandscape = dom.body.classList.contains("is-mobile-landscape");
  state.mobileDensityTier = currentDensityTier();
  const preset = MOBILE_DENSITY_PRESETS[state.mobileDensityTier];
  const stageNode = document.getElementById("stage");
  const stageRect = stageNode.getBoundingClientRect();
  dom.body.dataset.mobileTier = state.mobileDensityTier;
  dom.body.classList.toggle("is-mobile", mobileLayout);
  dom.body.classList.toggle("is-mobile-landscape", mobileLandscape);
  dom.body.classList.toggle("is-mobile-portrait", mobileLayout && !mobileLandscape);
  dom.body.style.setProperty("--joystick-size", `${preset.stickSize}px`);
  dom.body.style.setProperty("--joystick-thumb", `${preset.thumbSize}px`);
  dom.body.style.setProperty("--action-size", `${preset.actionSize}px`);
  dom.body.style.setProperty("--controls-clearance", `${preset.controlsClearance}px`);
  dom.body.style.setProperty("--rail-min-height", `${preset.railMinHeight}px`);
  dom.body.style.setProperty("--stage-width", `${Math.round(stageRect.width)}px`);
  dom.body.style.setProperty("--stage-height", `${Math.round(stageRect.height)}px`);
  dom.mobileControls.setAttribute("aria-hidden", String(!mobileLayout));
  if (mobileLayout) {
    setHudCollapsed(true);
  } else {
    clearTransientInput();
  }
  if (!isMobileLandscape()) {
    state.mobileDockExpanded = false;
  }
  if (mobileLandscape && !wasMobileLandscape) {
    state.transcriptExpanded = false;
  }
  if (!mobileLandscape && wasMobileLandscape) {
    state.transcriptExpanded = true;
  }
  updatePointerHint();
  syncDockState();
  syncTranscriptUI();
  scene.resize();
  window.requestAnimationFrame(() => {
    scene.resize();
    renderDebugPanel();
  });
  renderDebugPanel();
  logDebug("resize", `${window.innerWidth}x${window.innerHeight}`);
}

updateObjective(true);
updateMemoryList();
bindKeyboard();
bindPointerLook();
bindUI();
initPanelSystem();
// Show music prompt after loader fades (~1400ms)
setTimeout(() => audioSystem.showPrompt(), 1400);
handleResize();
window.addEventListener("resize", handleResize);
window.visualViewport?.addEventListener("resize", handleResize);

if (state.mode === "intro") {
  setSubtitle(INTRO_BEATS[0].kicker, INTRO_BEATS[0].text, 0.2);
  setAmbience(INTRO_BEATS[0].ambience);
} else {
  state.cameraMode = "play";
  setSubtitle("女兒", "先讓前門那句電話響起來。", 3.2);
  setAmbience("粉筆味像一層薄雲，樓梯口那邊有風，十一點的光才剛準備進來。");
}

syncDockState();
syncTranscriptUI();
syncObjectiveChip();
updatePointerHint();
updateActionButtons();
void audioSystem.tryPlay("startup");

/* ── WebGL Context Loss Detection ── */
canvas.addEventListener("webglcontextlost", (e) => {
  console.error("[WebGL] CONTEXT LOST!", e);
  e.preventDefault();
});
canvas.addEventListener("webglcontextrestored", () => {
  console.warn("[WebGL] context restored");
});

requestAnimationFrame(tick);

/* ── Loader dismiss ── */
window.__lm402Ready = true;
(function dismissLoader() {
  const loaderEl = document.getElementById("lm402-loader");
  if (!loaderEl) return;
  const fillEl = document.getElementById("loader-fill");
  if (fillEl) fillEl.style.width = "100%";
  setTimeout(() => {
    loaderEl.style.opacity = "0";
    loaderEl.style.pointerEvents = "none";
    setTimeout(() => loaderEl.remove(), 1200);
  }, 600);
})();
