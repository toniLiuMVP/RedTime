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
} from "./data.js";
import { createLm402Scene, WORLD_SCALE } from "./renderer.js";

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
    x: scale(-824),
    y: 0,
    z: scale(1012),
  },
  corridorFront: {
    x: scale(-404),
    y: 0,
    z: scale(WORLD.frontDoor.center.z),
  },
  juniorSeat: {
    x: scale(1536),
    y: 0,
    z: scale(622),
  },
  frontLook: {
    x: scale(-246),
    y: 1.34,
    z: scale(796),
  },
  rearLook: {
    x: scale(-84),
    y: 1.38,
    z: scale(550),
  },
  eyeLook: {
    x: scale(64),
    y: 1.48,
    z: scale(548),
  },
  perfectOrbit: {
    x: scale(64),
    y: 1.58,
    z: scale(548),
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
  endingKicker: document.getElementById("ending-kicker"),
  endingTitle: document.getElementById("ending-title"),
  endingCopy: document.getElementById("ending-copy"),
  endingRetry: document.getElementById("ending-retry"),
  endingPerfectBtn: document.getElementById("ending-perfect-btn"),
  debugPanel: document.getElementById("debug-panel"),
  debugText: document.getElementById("debug-text"),
};

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
const initialAudioEnabled = localStorage.getItem(STORAGE_KEYS.audioEnabled) !== "0";

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
      rotationY: -1.18,
    },
    junior: {
      x: WORLD_POINTS.juniorSeat.x,
      y: 0,
      z: WORLD_POINTS.juniorSeat.z,
      rotationY: 0,
    },
    fatherEcho: {
      x: scale(-312),
      y: 0,
      z: scale(540),
      rotationY: Math.PI / 2,
      alpha: 0,
    },
    auntEcho: {
      x: scale(-116),
      y: 0,
      z: scale(560),
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
        WORLD_POINTS.doorPlaque.x * 0.34 +
        WORLD_POINTS.frontLook.x * 0.22 +
        (WORLD_POINTS.frontSpawn.x + scale(212)) * 0.14,
      y: WORLD_POINTS.frontLook.y,
      z:
        liveState.characters.senior.z * 0.44 +
        WORLD_POINTS.doorPlaque.z * 0.18 +
        WORLD_POINTS.frontLook.z * 0.26 +
        WORLD.frontDoor.center.z * WORLD_SCALE * 0.12,
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
  pointerLockState: "free",
  boundaryCollisionState: null,
  lastContextMenu: 0,
  debugEvents: [],
  lookSensitivityPreset: initialLookSetting.preset,
  lookSensitivityScalar: initialLookSetting.scalar,
  audioEnabled: initialAudioEnabled,
  phase: "front_call",
  ending: null,
  endingSequence: null,
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

function createAudioSystem() {
  let audio = null;
  let context = null;
  let autoplayBlocked = false;
  let playAttempt = null;

  function ensureAudio() {
    if (audio) {
      return audio;
    }
    audio = new Audio(new URL("../../飛進你們的心裡.mp3", import.meta.url).href);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.84;
    audio.playsInline = true;
    audio.addEventListener("playing", () => {
      autoplayBlocked = false;
      syncMusicPrompt();
    });
    audio.addEventListener("pause", () => {
      if (!state.audioEnabled) {
        autoplayBlocked = false;
        syncMusicPrompt();
      }
    });
    return audio;
  }

  function ensureContext() {
    if (context) {
      return context;
    }
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }
    context = new AudioContextCtor();
    return context;
  }

  async function tryPlay(reason = "auto") {
    if (!state.audioEnabled) {
      syncMusicPrompt();
      return false;
    }
    const player = ensureAudio();
    if (playAttempt) {
      return playAttempt;
    }
    playAttempt = player
      .play()
      .then(() => {
        autoplayBlocked = false;
        syncMusicPrompt();
        logDebug("music", `${reason}:playing`);
        return true;
      })
      .catch(() => {
        autoplayBlocked = true;
        syncMusicPrompt();
        logDebug("music", `${reason}:blocked`);
        return false;
      })
      .finally(() => {
        playAttempt = null;
      });
    return playAttempt;
  }

  function syncMusicPrompt() {
    const shouldShow = state.audioEnabled && autoplayBlocked;
    dom.musicPrompt.classList.toggle("intro-mode", state.mode === "intro");
    dom.musicPrompt.hidden = !shouldShow;
  }

  function unlock() {
    const ctx = ensureContext();
    ctx?.resume?.().catch(() => {});
    void tryPlay("unlock");
  }

  function update() {
    if (!state.audioEnabled || !audio) {
      return;
    }
    if (!document.hidden && audio.paused && !autoplayBlocked) {
      void tryPlay("resume");
    }
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
    if (!state.audioEnabled) {
      return;
    }
    const ctx = ensureContext();
    if (!ctx || ctx.state !== "running") {
      return;
    }
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
  };
}

const audioSystem = createAudioSystem();
const debugEnabled = new URLSearchParams(window.location.search).get("debug") === "1";
let objectiveCompactTimer = 0;

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

function setSubtitle(source, text, ttl = 3.6) {
  state.subtitle = { source, text, ttl };
  dom.subtitleSource.textContent = source;
  dom.subtitleText.textContent = text;
  if (isMobileLandscape() && state.mode !== "intro") {
    state.subtitleMode = "compact";
    syncDockState();
  }
}

function setAmbience(text) {
  state.ambience.text = text;
  dom.ambienceText.textContent = text;
  dom.ambienceChipCopy.textContent = state.mobileDockExpanded ? "點一下收起" : condensedCopy(text);
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
  dom.audioToggleValue.textContent = state.audioEnabled ? "開啟" : "關閉";
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
  state.pointerLockState = locked ? "locked" : "free";
  dom.pointerPill.hidden = false;
  dom.pointerPill.textContent = locked ? "視角已鎖定 · 右鍵或 Esc 退出" : "右鍵進入視角鎖定";
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
      `<div class="phase-index">${item.index}</div>` +
      `<div class="phase-copy"><strong>${item.title}</strong><span>${item.copy}</span></div>`;
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
      `<div class="memory-kicker">${memory.kicker}</div>` +
      `<div class="memory-title">${memory.title}</div>` +
      `<div class="memory-copy">${memory.copy[0]}</div>`;
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
  dom.dialogueCopy.innerHTML = definition.copy.map((text) => `<p>${text}</p>`).join("");
  dom.dialogueChoices.innerHTML = "";
  definition.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dialogue-choice";
    button.innerHTML = `<strong>${index + 1}. ${choice.label}</strong><span>${choice.detail}</span>`;
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
    setAmbience("鐘聲剛落，前門那邊傳來探頭和腳步的動靜，風把教室裡的紙邊輕輕掀起。");
    closeDialogue();
    return;
  }
  if (effect === "memory_board" || effect === "memory_board_soft") {
    collectMemory("board");
    if (effect === "memory_board") {
      setSubtitle("33 歲的聲音", "十一點整，下課鐘會響。他會先從前門探頭看，可是看不到妳。", 4.2);
    }
    closeDialogue();
    return;
  }
  if (effect === "memory_seat") {
    collectMemory("seat");
    closeDialogue();
    return;
  }
  if (effect === "memory_notes") {
    collectMemory("notes");
    closeDialogue();
    return;
  }
  if (effect === "advance_rear_wait") {
    state.flags.juniorPrepared = true;
    audioSystem.playCue("thread");
    setSubtitle("學妹", "「好，那妳等我。」", 3.6);
    revealHint("現在去後門，先把自己站穩。");
    closeDialogue();
    return;
  }
  if (effect === "memory_backdoor") {
    collectMemory("backdoor");
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
}

function getInteractionById(id) {
  if (id === "front_call" && state.phase === "front_call") {
    return INTERACTIONS.front_call;
  }
  if (id === "junior" && state.phase !== "eye_contact") {
    return INTERACTIONS.junior;
  }
  if (id === "backdoor" && state.phase !== "front_call") {
    return INTERACTIONS.backdoor;
  }
  return INTERACTIONS[id];
}

function hotspotVisible(hotspot) {
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
  const picked = scene.pickHotspot(hotspots, state.player, state.activeHotspotId);
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
  state.subtitleMode = isMobileLandscape() ? "hidden" : "full";
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
    setSubtitle("女兒", "前門來電，要先從那句「妳在哪裡？」開始。", 3.8);
    setAmbience("十一點的風沿著四樓矮牆和六間教室長度的走廊往後門吹，外面的樹影、前門門洞和教室兩側的陽光一起慢慢亮起來。");
  }

  state.subtitleMode = isMobileLandscape() ? "hidden" : "full";
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
  state.endingSequence = { type, time: 0, manual };
  state.cameraMode = "ending";
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock?.();
  }
  if (type === "perfect") {
    state.phase = "eye_contact";
    state.phaseClock = 0;
    setSubtitle("學長", "這一次,依然再次遇見妳.", 6.2);
    setAmbience("四樓後門那一側忽然靜下來，只剩陽光慢慢落在她的白襯衫、頭髮和眼睛上。");
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

function finishEndingSequence() {
  const ending = ENDINGS[state.ending];
  dom.endingKicker.textContent = ending.kicker;
  dom.endingTitle.textContent = ending.title;
  dom.endingCopy.textContent = ending.copy;
  dom.endingOverlay.hidden = false;
  dom.body.classList.add("ending-open");
}

function resetScene() {
  clearTransientInput();
  state.mode = "play";
  state.cameraMode = "play";
  state.phase = "front_call";
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
  state.cinematicGlow = 0;
  state.mobileDockExpanded = false;
  state.introBeatIndex = 0;
  state.introCameraTrack = INTRO_BEATS[0].id;
  state.memories = new Set();
  state.activeHotspot = null;
  state.activeHotspotId = null;
  state.boundaryCollisionState = null;
  dom.endingOverlay.hidden = true;
  dom.body.classList.remove("ending-open");
  dom.dialogueSheet.hidden = true;
  dom.body.classList.remove("dialogue-open");
  updateObjective(true);
  updateMemoryList();
  setSubtitle("女兒", "先讓前門那句電話響起來。", 3.6);
  setAmbience("粉筆味像一層薄雲，四樓長走廊有風，十一點的光正沿著矮牆、前門門洞和教室兩側一起往裡推。");
  syncDockState();
  updatePointerHint();
  logDebug("scene", "reset");
}

function updateMovement(dt) {
  if (state.mode !== "play" || state.dialogue || state.endingSequence || wantsLandscape()) {
    state.player.velocity.x *= 0.72;
    state.player.velocity.z *= 0.72;
    state.subtitleMode = state.mode === "intro" && isMobileLandscape() ? "hidden" : "full";
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
  state.player.yaw -= lookX * dt * lookSpeed;
  state.player.pitch = clamp(state.player.pitch - lookY * dt * 1.34 * currentLookScalar(), MIN_PITCH, MAX_PITCH);

  const forwardX = -Math.sin(state.player.yaw);
  const forwardZ = -Math.cos(state.player.yaw);
  const rightX = Math.cos(state.player.yaw);
  const rightZ = -Math.sin(state.player.yaw);
  const speed = state.phase === "eye_contact" ? scale(182) : scale(278);

  const targetVX = (forwardX * moveY + rightX * moveX) * speed;
  const targetVZ = (forwardZ * moveY + rightZ * moveX) * speed;
  state.player.velocity.x = lerp(state.player.velocity.x, targetVX, 0.18);
  state.player.velocity.z = lerp(state.player.velocity.z, targetVZ, 0.18);

  const desired = {
    x: state.player.x + state.player.velocity.x * dt,
    z: state.player.z + state.player.velocity.z * dt,
  };
  const resolved = scene.resolveMotion({ x: state.player.x, z: state.player.z }, desired, PLAYER_RADIUS);
  state.player.x = resolved.x;
  state.player.z = resolved.z;
  state.boundaryCollisionState = resolved.collided ? resolved.label : null;

  const moving = Math.hypot(state.player.velocity.x, state.player.velocity.z) > scale(26);
  const looking = Math.abs(lookX) > 0.18 || Math.abs(lookY) > 0.18 || Boolean(state.dragLook) || document.pointerLockElement === canvas;
  if (isMobileLandscape()) {
    state.subtitleMode = moving || looking ? "hidden" : state.subtitle.ttl > 0.12 ? "compact" : "hidden";
  } else {
    state.subtitleMode = "full";
  }
  syncDockState();

  if (moving && state.time - state.sound.playerStepAt > 0.42) {
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
  if (state.endingSequence?.type === "perfect") {
    const seniorWalkT = smoothstep(0.12, 4.8, state.endingSequence.time);
    const juniorWalkT = smoothstep(0.42, 4.1, state.endingSequence.time);
    const seniorX = lerp(scale(-392), scale(-386), seniorWalkT);
    const seniorZ = lerp(scale(770), scale(548), seniorWalkT);
    const juniorX = lerp(scale(1536), scale(64), juniorWalkT);
    const juniorZ = lerp(scale(622), scale(548), juniorWalkT);
    const seniorFacing = movementRotation(juniorX - seniorX, juniorZ - seniorZ, 0);
    const juniorFacing = movementRotation(seniorX - juniorX, seniorZ - juniorZ, -Math.PI / 2);
    setCharacterPose("senior", seniorX, seniorZ, seniorFacing);
    setCharacterPose("junior", juniorX, juniorZ, juniorFacing);
    setCharacterPose("fatherEcho", scale(-272), scale(540), Math.PI / 2, 0);
    setCharacterPose("auntEcho", scale(-116), scale(560), -Math.PI / 2, 0);
    return;
  }

  if (state.phase === "front_call") {
    setCharacterPose("senior", scale(-346), scale(786), -1.18);
    setCharacterPose("junior", scale(1536), scale(622), 0.06);
    setCharacterPose("fatherEcho", scale(-272), scale(540), Math.PI / 2, 0);
    setCharacterPose("auntEcho", scale(-116), scale(560), -Math.PI / 2, 0);
    return;
  }

  if (state.phase === "rear_wait") {
    const seniorT = smoothstep(0.1, 4.0, state.phaseClock);
    const juniorT = smoothstep(0.6, 3.5, state.phaseClock);
    const seniorX = lerp(scale(-404), scale(-392), seniorT * 0.76);
    const seniorZ = lerp(scale(772), scale(550), seniorT);
    const juniorX = lerp(scale(1536), scale(58), juniorT);
    const juniorZ = lerp(scale(622), scale(550), juniorT);
    setCharacterPose("senior", seniorX, seniorZ, movementRotation(juniorX - seniorX, juniorZ - seniorZ, -0.12));
    setCharacterPose("junior", juniorX, juniorZ, movementRotation(seniorX - juniorX, seniorZ - juniorZ, -Math.PI / 2));
    setCharacterPose("fatherEcho", scale(-272), scale(540), Math.PI / 2, 0);
    setCharacterPose("auntEcho", scale(-116), scale(560), -Math.PI / 2, 0);
    return;
  }

  const seniorT = smoothstep(0.6, 3.2, state.phaseClock);
  const juniorT = smoothstep(0.2, 2.8, state.phaseClock);
  const seniorX = lerp(scale(-392), scale(-392), seniorT * 0.8);
  const seniorZ = lerp(scale(550), scale(548), seniorT);
  const juniorX = lerp(scale(58), scale(46), juniorT);
  const juniorZ = lerp(scale(550), scale(548), juniorT);
  const echoAlpha = smoothstep(1.9, 3.1, state.phaseClock) * (1 - smoothstep(4.1, 5.0, state.phaseClock));

  setCharacterPose("senior", seniorX, seniorZ, movementRotation(juniorX - seniorX, juniorZ - seniorZ, 0));
  setCharacterPose("junior", juniorX, juniorZ, movementRotation(seniorX - juniorX, seniorZ - juniorZ, -Math.PI / 2));
  setCharacterPose("fatherEcho", scale(-272), scale(540), Math.PI / 2, echoAlpha * 0.6);
  setCharacterPose("auntEcho", scale(-116), scale(560), -Math.PI / 2, echoAlpha * 0.74);
}

function updateCharacterAudio(dt) {
  if (state.mode === "intro") {
    if (state.intro.time > 7.1 && state.intro.time < 11.6 && state.time - state.sound.seniorStepAt > 0.48) {
      state.sound.seniorStepAt = state.time;
      audioSystem.playCue("step");
    }
    return;
  }

  const seniorWalking =
    (state.phase === "rear_wait" && state.phaseClock < 4.1) ||
    (state.phase === "eye_contact" && state.phaseClock < 2.2) ||
    (state.endingSequence?.type === "perfect" && state.endingSequence.time < 4.3);
  const juniorWalking =
    (state.phase === "rear_wait" && state.phaseClock > 0.5 && state.phaseClock < 3.6) ||
    (state.endingSequence?.type === "perfect" && state.endingSequence.time > 0.3 && state.endingSequence.time < 3.4);

  if (seniorWalking && state.time - state.sound.seniorStepAt > 0.48) {
    state.sound.seniorStepAt = state.time;
    audioSystem.playCue("step");
  }
  if (juniorWalking && state.time - state.sound.juniorStepAt > 0.56) {
    state.sound.juniorStepAt = state.time;
    audioSystem.playCue("step");
  }
}

function updatePhaseLogic(dt) {
  state.phaseClock += dt;

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
  state.endingSequence.time += dt;
  if (state.ending === "perfect") {
    if (state.endingSequence.time > CINEMATIC_TIMELINE.perfectDuration && dom.endingOverlay.hidden) {
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
    time: state.time,
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
    stageViewport: layout.stageBounds,
    canvasViewport: layout.canvasBounds,
    subtitleBounds: layout.subtitleBounds,
    controlBounds: layout.controlBounds,
    webglViewport: snapshot.webglViewport,
    mobileBlackRegionDetected: snapshot.mobileBlackRegionDetected,
    projectedNodes: snapshot.projectedNodes,
    hotspotLOS: snapshot.hotspotLOS,
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
    renderer: renderSnapshot,
    events: [...state.debugEvents],
  };
}

window.__LM402_DEBUG__ = {
  snapshot: snapshotDebug,
  reset: resetScene,
  replayIntro: () => startIntro(true),
  skipIntro: () => {
    if (state.mode === "intro") {
      finishIntro();
    }
  },
  setPhase: (id) => setPhase(id),
  applyEffect: (effect) => applyEffect(effect),
  setLookSensitivity: (scalar, preset = null) => setLookSensitivity({ scalar, preset }),
  toggleObjective: toggleObjectivePrompt,
};

function renderFrame() {
  scene.render(buildSceneState());
  renderDebugPanel();
}

function tick(now) {
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
  }

  audioSystem.update(dt);
  updateCharacterAudio(dt);
  renderFrame();
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

function togglePointerLock() {
  if (isMobileLayout()) {
    return;
  }
  canvas.focus({ preventScroll: true });
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock?.();
    return;
  }
  if (state.mode !== "play" || state.dialogue || state.endingSequence || state.ending) {
    return;
  }
  canvas.requestPointerLock?.();
}

function bindPointerLook() {
  canvas.addEventListener("click", () => {
    attemptOrientationLock();
    audioSystem.unlock();
    canvas.focus({ preventScroll: true });
  });

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (isMobileLayout()) {
      return;
    }
    state.lastContextMenu = Date.now();
    logDebug("contextmenu", document.pointerLockElement === canvas ? "exit" : "enter");
    togglePointerLock();
  });

  canvas.addEventListener("mousedown", (event) => {
    if (event.button !== 0 || isMobileLayout()) {
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

  document.addEventListener("pointerlockchange", () => {
    updatePointerHint();
    logDebug("pointerlock", document.pointerLockElement === canvas ? "locked" : "free");
  });
  document.addEventListener("pointerlockerror", () => {
    revealHint("瀏覽器沒有成功鎖定視角。");
    logDebug("pointerlock", "error");
  });
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
    audioSystem.setEnabled(!state.audioEnabled);
  });
  dom.musicPromptButton.addEventListener("click", () => {
    audioSystem.unlock();
  });
  dom.perfectEndingBtn.addEventListener("click", startPerfectEnding);
  dom.perfectEndingSideBtn.addEventListener("click", startPerfectEnding);
  dom.objectivePrompt.addEventListener("click", toggleObjectivePrompt);
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
  dom.endingPerfectBtn.addEventListener("click", startPerfectEnding);

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
  state.mobileDensityTier = currentDensityTier();
  const preset = MOBILE_DENSITY_PRESETS[state.mobileDensityTier];
  const stageNode = document.getElementById("stage");
  const stageRect = stageNode.getBoundingClientRect();
  dom.body.dataset.mobileTier = state.mobileDensityTier;
  dom.body.classList.toggle("is-mobile", mobileLayout);
  dom.body.classList.toggle("is-mobile-landscape", isMobileLandscape());
  dom.body.classList.toggle("is-mobile-portrait", mobileLayout && !isMobileLandscape());
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
  updatePointerHint();
  syncDockState();
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
syncObjectiveChip();
updatePointerHint();
updateActionButtons();
void audioSystem.tryPlay("startup");
requestAnimationFrame(tick);
