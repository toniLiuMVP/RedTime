import {
  STORAGE_KEYS as e,
  WORLD as t,
  PHASES as n,
  HOTSPOTS as o,
  MEMORY_FRAGMENTS as i,
  INTERACTIONS as a,
  INTRO_BEATS as r,
  ENDINGS as c,
  CINEMATIC_TIMELINE as l,
  MOBILE_DENSITY_PRESETS as s,
  RENDER_QUALITY_TIERS as renderQualityTiers,
  CHARACTER_ASSET_MANIFEST as characterAssetManifest,
  UI_VISIBILITY_PRESETS as uiVisibilityPresets,
} from "./data.js";
import { createLm402Scene as d, WORLD_SCALE as u } from "./renderer.js";
import { initPanelSystem } from "./ui-panels.js";
const p = (e, t, n) => Math.min(n, Math.max(t, e)),
  m = (e, t, n) => e + (t - e) * n,
  y = (e, t, n) => {
    const o = p((n - e) / (t - e), 0, 1);
    return o * o * (3 - 2 * o);
  },
  g = (e) => e * u,
  h = [
    { x: g(1896), z: g(2058) },
    { x: g(t.classroom.aisleX), z: g(2058) },
    { x: g(t.classroom.aisleX), z: g(t.backDoor.center.z) },
    { x: g(74), z: g(t.backDoor.center.z - 2) },
  ],
  k = [
    { x: g(1896), z: g(2058) },
    { x: g(t.classroom.aisleX), z: g(2058) },
    { x: g(t.classroom.aisleX), z: g(t.backDoor.center.z) },
    { x: g(64), z: g(t.backDoor.center.z - 4) },
  ];
function b(e, t) {
  const n = p(t, 0, 1),
    o = [];
  let i = 0;
  for (let t = 1; t < e.length; t++) {
    const n = e[t].x - e[t - 1].x,
      a = e[t].z - e[t - 1].z,
      r = Math.hypot(n, a);
    (o.push(r), (i += r));
  }
  const a = n * i;
  let r = 0;
  for (let t = 0; t < o.length; t++) {
    if (r + o[t] >= a || t === o.length - 1) {
      const n = o[t] > 0 ? (a - r) / o[t] : 0;
      return {
        x: m(e[t].x, e[t + 1].x, n),
        z: m(e[t].z, e[t + 1].z, n),
        dx: e[t + 1].x - e[t].x,
        dz: e[t + 1].z - e[t].z,
      };
    }
    r += o[t];
  }
  const c = e[e.length - 1];
  return { x: c.x, z: c.z, dx: 0, dz: 0 };
}
const f = g(22),
  v = -0.96,
  x = 0.72,
  E = { slow: 0.78, standard: 1, fast: 1.26 },
  L = { slow: "慢", standard: "標準", fast: "快", custom: "自訂" },
  S = {
    frontStair: { x: g(-522), y: 0, z: g(t.stairs.front.landingZ) },
    backStair: { x: g(-522), y: 0, z: g(t.stairs.back.landingZ) },
    frontDoor: {
      x: g(t.frontDoor.center.x),
      y: g(t.frontDoor.center.y),
      z: g(t.frontDoor.center.z),
    },
    backDoor: {
      x: g(t.backDoor.center.x),
      y: g(t.backDoor.center.y),
      z: g(t.backDoor.center.z),
    },
    doorPlaque: { x: g(t.plaque.x), y: g(t.plaque.y), z: g(t.plaque.z) },
    focusMark: { x: g(t.focusMark.x), y: 1.44, z: g(t.focusMark.z) },
    frontSpawn: { x: g(-736), y: 0, z: g(t.frontDoor.center.z - 612) },
    corridorFront: { x: g(-548), y: 0, z: g(t.frontDoor.center.z - 356) },
    juniorSeat: { x: g(1896), y: 0, z: g(2058) },
    frontLook: { x: g(-256), y: 1.52, z: g(t.frontDoor.center.z - 4) },
    rearLook: { x: g(24), y: 1.42, z: g(t.backDoor.center.z + 6) },
    eyeLook: { x: g(92), y: 1.5, z: g(t.backDoor.center.z + 4) },
    perfectOrbit: { x: g(108), y: 1.58, z: g(t.backDoor.center.z + 6) },
  },
  w = Object.fromEntries(
    o.map((e) => [
      e.id,
      { ...e, x: g(e.x), y: g(e.y), z: g(e.z), radius: g(e.radius) },
    ]),
  );
let B = null;
const runtimeTimerRegistry = new Map();
const z = document.getElementById("scene-canvas"),
  initialQualityTier =
    window.matchMedia("(max-width: 1080px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
      ? "mobile"
      : "desktop",
  M = d(z, {
    qualityTier: initialQualityTier,
    qualityTiers: renderQualityTiers,
    characterAssets: characterAssetManifest,
  }),
  P = {
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
    fontWidget: document.getElementById("font-widget"),
    fontToggle: document.getElementById("font-toggle"),
    fontToggleValue: document.getElementById("font-toggle-value"),
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
    endingKicker: document.getElementById("ending-kicker"),
    endingTitle: document.getElementById("ending-title"),
    endingCopy: document.getElementById("ending-copy"),
    endingRetry: document.getElementById("ending-retry"),
    endingPerfectBtn: document.getElementById("ending-perfect-btn"),
    debugPanel: document.getElementById("debug-panel"),
    debugText: document.getElementById("debug-text"),
    introSkipBtn: document.getElementById("intro-skip-btn"),
    introFx: document.getElementById("intro-fx"),
    timeWatch: document.getElementById("time-watch"),
    timeWatchDisplay: document.getElementById("time-watch-display"),
    hudTimePill: document.getElementById("hud-time-pill"),
  };
function C(e) {
  return p(Number(e) || E.standard, 0.55, 1.55);
}
function I(e) {
  const t = C(e?.scalar ?? E.standard),
    n =
      Object.entries(E).find(([, e]) => Math.abs(e - t) <= 0.035)?.[0] ??
      e?.preset ??
      "custom";
  return { preset: E[n] ? n : "custom", scalar: t };
}
const T = (function () {
    try {
      return I(JSON.parse(localStorage.getItem(e.lookSensitivity) || "null"));
    } catch {
      return I(null);
    }
  })(),
  D = "1" === localStorage.getItem(e.audioEnabled);
function _() {
  return (
    window.matchMedia("(max-width: 1080px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}
function q() {
  return _() && window.innerHeight > window.innerWidth;
}
function j() {
  return _() && window.innerWidth >= window.innerHeight;
}
function detectQualityTier() {
  return _() ? "mobile" : "desktop";
}
function scheduleManagedTimeout(e, t, n) {
  const o = window.setTimeout(() => {
    (runtimeTimerRegistry.delete(o), n());
  }, t);
  return (runtimeTimerRegistry.set(o, e), o);
}
function clearManagedTimeouts(e = null) {
  runtimeTimerRegistry.forEach((t, n) => {
    (!e || e.includes(t)) &&
      (window.clearTimeout(n), runtimeTimerRegistry.delete(n));
  });
}
function A(e, t = 24) {
  return e.length > t ? `${e.slice(0, t - 1)}…` : e;
}
function H() {
  return {
    senior: {
      x: S.corridorFront.x,
      y: 0,
      z: S.corridorFront.z,
      rotationY: -1.32,
      alpha: 1,
    },
    junior: { x: S.juniorSeat.x, y: 0, z: S.juniorSeat.z, rotationY: 0.04 },
    fatherEcho: {
      x: g(-312),
      y: 0,
      z: g(t.backDoor.center.z + 2),
      rotationY: Math.PI / 2,
      alpha: 0,
    },
    auntEcho: {
      x: g(-116),
      y: 0,
      z: g(t.backDoor.center.z + 26),
      rotationY: -Math.PI / 2,
      alpha: 0,
    },
  };
}
function $(e, t) {
  const n = t.x - e.x,
    o = t.z - e.z;
  return Math.atan2(-n, -o);
}
function O(e, t) {
  const n = t.x - e.x,
    o = t.z - e.z,
    i = (t.y ?? 1.28) - 1.62;
  return p(Math.atan2(i, Math.hypot(n, o)), v, x);
}
function W(e) {
  return "consciousness_market" === e
    ? S.juniorSeat
    : B?.characters
      ? "eye_contact" === e
        ? {
            x: m(B.characters.junior.x, S.eyeLook.x, 0.38),
            y: S.eyeLook.y,
            z: m(B.characters.junior.z, S.eyeLook.z, 0.7),
          }
        : "rear_wait" === e
          ? {
              x: m(B.characters.senior.x, S.rearLook.x, 0.72),
              y: S.rearLook.y,
              z: m(B.characters.senior.z, S.rearLook.z, 0.58),
            }
          : {
              x:
                0.3 * B.characters.senior.x +
                0.4 * S.doorPlaque.x +
                0.16 * S.frontDoor.x +
                0.14 * S.frontLook.x,
              y: S.frontLook.y,
              z:
                0.26 * B.characters.senior.z +
                0.34 * S.doorPlaque.z +
                0.18 * S.frontDoor.z +
                0.22 * S.frontLook.z,
            }
      : "eye_contact" === e
        ? S.eyeLook
        : "rear_wait" === e
          ? S.rearLook
          : S.frontLook;
}
function R(e, t = null) {
  const n = O(t ?? Y?.player ?? F(), W(e));
  return p(
    "eye_contact" === e || "rear_wait" === e ? n - 0.02 : n - 0.03,
    v,
    x,
  );
}
function V(e, t, n = 0) {
  return Math.hypot(e, t) < 1e-4 ? n : Math.atan2(e, t);
}
function F() {
  const e = {
    x: S.frontSpawn.x,
    y: 0,
    z: S.frontSpawn.z,
    yaw: 0,
    pitch: 0,
    velocity: { x: 0, z: 0 },
    lookInput: { x: 0, y: 0 },
    isGhostObserver: !0,
  };
  return (
    (e.yaw = $(e, S.juniorSeat)),
    (e.pitch = R("consciousness_market", e)),
    e
  );
}
function N() {
  ((Y.input.moveX = 0),
    (Y.input.moveY = 0),
    (Y.input.lookX = 0),
    (Y.input.lookY = 0),
    (Y.player.lookInput.x = 0),
    (Y.player.lookInput.y = 0),
    (Y.player.velocity.x = 0),
    (Y.player.velocity.z = 0),
    (Y.dragLook = null));
}
const Y = {
  mode: "intro",
  cameraMode: "intro",
  hudMode: "chip",
  subtitleMode: "full",
  uiVisibilityPreset: "intro",
  transcriptExpanded: !0,
  pointerLockState: "free",
  pointerLockPending: !1,
  boundaryCollisionState: null,
  lastContextMenu: 0,
  debugEvents: [],
  renderErrorCount: 0,
  renderErrors: [],
  lookSensitivityPreset: T.preset,
  lookSensitivityScalar: T.scalar,
  audioEnabled: D,
  qualityTier: initialQualityTier,
  phase: "consciousness_market",
  ending: null,
  endingSequence: null,
  intro: {
    progress: 0,
    time: 0,
    startedAt: 0,
    deadlineAt: 0,
    replay: !1,
    resume: null,
  },
  player: F(),
  input: { moveX: 0, moveY: 0, lookX: 0, lookY: 0 },
  keyboard: Object.create(null),
  dragLook: null,
  activeHotspot: null,
  activeHotspotId: null,
  dialogue: null,
  subtitle: {
    source: "女兒",
    text: "現在時空手錶顯示10:40，現在阿姨在教室裡面，怎麼我會這麼緊張^_^",
    ttl: 5,
  },
  subtitleLog: [],
  ambience: {
    text: "粉筆味像一層薄雲，十一點的光正慢慢沿著百葉窗往教室裡推。",
  },
  memories: new Set(),
  flags: {
    frontCallHeard: !1,
    backdoorAnchored: !1,
    juniorPrepared: !1,
    rearWaitHintPlayed: !1,
    eyeCuePlayed: !1,
    perfectLinePlayed: !1,
    lastMarketLine: -1,
  },
  characters: H(),
  gameTime: { hours: 10, minutes: 40, frozen: !1, realElapsed: 0 },
  heartbeat: { lastBeatTime: 0, active: !1 },
  time: 0,
  phaseClock: 0,
  cinematicGlow: 0,
  mobileDockExpanded: !1,
  mobileDensityTier: "regular",
  introBeatIndex: 0,
  introCameraTrack: r[0].id,
  sound: { playerStepAt: 0, seniorStepAt: 0, juniorStepAt: 0 },
};
B = Y;
function getUiPreset() {
  return uiVisibilityPresets[Y.uiVisibilityPreset] ?? uiVisibilityPresets.play;
}
function uiAllows(e) {
  return Boolean(getUiPreset()[e]);
}
function getPerfectShotPhase(e = 0) {
  return e < (l.perfectOrbitEnd ?? 14.2)
    ? "orbit"
    : e < (l.perfectTransitionEnd ?? 17.4)
      ? "transition"
      : e < (l.perfectSeniorPovEnd ?? 27.6)
        ? "senior_pov"
        : e < (l.perfectOverlayAt ?? 34.8)
          ? "eyes"
          : "overlay";
}
function getEndingSequenceTime(e = performance.now()) {
  if (!Y.endingSequence) return null;
  if (Number.isFinite(Y.endingSequence.scrubTime))
    return Y.endingSequence.scrubTime;
  const t = Y.endingSequence.startedAt ?? e,
    n = Y.endingSequence.timeOffset ?? 0;
  return Math.max(0, n + (e - t) / 1e3);
}
function syncEndingSequenceClock(e = performance.now()) {
  if (!Y.endingSequence) return null;
  const t = getEndingSequenceTime(e);
  return (
    Number.isFinite(t)
      ? ((Y.endingSequence.time = t),
        (Y.endingSequence.shotPhase =
          "perfect" === Y.endingSequence.type
            ? getPerfectShotPhase(t)
            : "overlay"))
      : (Y.endingSequence.time = 0),
    t
  );
}
function scrubEndingSequence(e, t = !0) {
  if (!Y.endingSequence) return null;
  const n = Math.max(0, Number(e) || 0);
  return (
    clearManagedTimeouts(["ending"]),
    (Y.endingSequence.timeOffset = n),
    (Y.endingSequence.startedAt = performance.now()),
    (Y.endingSequence.scrubTime = t ? n : null),
    syncEndingSequenceClock(),
    n
  );
}
function forceSceneRender() {
  return (
    Y.endingSequence && syncEndingSequenceClock(),
    $e(),
    Ve(),
    window.__LM402_DEBUG__?.snapshot?.() ?? null
  );
}
function syncRendererRuntime() {
  const e = detectQualityTier();
  ((Y.qualityTier = e),
    M.setRuntimeConfig?.({
      qualityTier: e,
      qualityTiers: renderQualityTiers,
      characterAssets: characterAssetManifest,
    }));
}
function applyUiVisibilityPreset(e) {
  const t = uiVisibilityPresets[e] ?? uiVisibilityPresets.play;
  ((Y.uiVisibilityPreset = e), (P.body.dataset.uiPreset = e));
  const n = [
    [P.hud, t.hud],
    [P.speedWidget, t.speedWidget],
    [P.audioWidget, t.audioWidget],
    [P.fontWidget, t.fontWidget],
    [P.timeWatch, t.timeWatch],
    [P.objectivePrompt, t.objectivePrompt],
    [P.bottomDock, t.bottomDock],
    [P.transcriptDock, t.transcriptDock],
  ];
  n.forEach(([e, t]) => {
    e && (e.hidden = !t);
  });
  ((P.focusPrompt &&
    ((P.focusPrompt.hidden = !t.focusPrompt), t.focusPrompt)) ||
    P.focusPrompt?.classList.remove("show"),
    P.debugPanel && !t.debugPanel && (P.debugPanel.hidden = !0),
    P.mobileControls &&
      (P.mobileControls.hidden = !(_() && Boolean(t.mobileControls))),
    "ending" === e &&
      (document.pointerLockElement === z && document.exitPointerLock?.(),
      P.focusPrompt?.classList.remove("show"),
      (Y.hudMode = "chip")),
    "intro" === e && (Y.hudMode = "chip"),
    ke(),
    ge(),
    ee(),
    ye());
}
const X = (function () {
    let t = null,
      n = null,
      o = !1,
      i = null;
    function a() {
      return (
        t ||
        ((t = new Audio(
          new URL("../../飛進你們的心裡.mp3", import.meta.url).href,
        )),
        (t.loop = !0),
        (t.preload = "auto"),
        (t.volume = 0.84),
        (t.playsInline = !0),
        t.addEventListener("playing", () => {
          ((o = !1), l());
        }),
        t.addEventListener("pause", () => {
          Y.audioEnabled || ((o = !1), l());
        }),
        t)
      );
    }
    function r() {
      if (n) return n;
      const e = window.AudioContext || window.webkitAudioContext;
      return e ? ((n = new e()), n) : null;
    }
    async function c(e = "auto") {
      if (!Y.audioEnabled) return (l(), !1);
      const t = a();
      return (
        i ||
        ((i = t
          .play()
          .then(() => ((o = !1), l(), U("music", `${e}:playing`), !0))
          .catch(() => ((o = !0), l(), U("music", `${e}:blocked`), !1))
          .finally(() => {
            i = null;
          })),
        i)
      );
    }
    function l() {
      const e = Y.audioEnabled && o;
      (P.musicPrompt.classList.toggle("intro-mode", "intro" === Y.mode),
        (P.musicPrompt.hidden = !e));
    }
    function s(
      e,
      {
        type: t = "sine",
        frequency: n = 440,
        duration: o = 0.12,
        gain: i = 0.04,
        when: a = 0,
        attack: r = 0.008,
        release: c = 0.08,
        detune: l = 0,
      },
    ) {
      const s = e.createOscillator(),
        d = e.createGain();
      ((s.type = t),
        s.frequency.setValueAtTime(n, a),
        s.detune.setValueAtTime(l, a),
        d.gain.setValueAtTime(1e-4, a),
        d.gain.exponentialRampToValueAtTime(i, a + r),
        d.gain.exponentialRampToValueAtTime(1e-4, a + o + c),
        s.connect(d).connect(e.destination),
        s.start(a),
        s.stop(a + o + c + 0.03));
    }
    return {
      unlock: function () {
        const e = r();
        (e?.resume?.().catch(() => {}), c("unlock"));
      },
      update: function () {
        Y.audioEnabled &&
          t &&
          (document.hidden || !t.paused || o || c("resume"));
      },
      setEnabled: function (t) {
        if (
          ((Y.audioEnabled = t),
          localStorage.setItem(e.audioEnabled, Y.audioEnabled ? "1" : "0"),
          ce(),
          !t)
        )
          return (
            (o = !1),
            a().pause(),
            n?.suspend?.().catch(() => {}),
            l(),
            void U("music", "disabled")
          );
        (r()
          ?.resume?.()
          .catch(() => {}),
          c("toggle"));
      },
      playCue: function (e) {
        if (!Y.audioEnabled) return;
        const t = r();
        if (!t || "running" !== t.state) return;
        const n = t.currentTime + 0.01;
        return "step" === e
          ? (s(t, {
              type: "triangle",
              frequency: 110,
              duration: 0.04,
              gain: 0.018,
              when: n,
              attack: 0.004,
              release: 0.06,
            }),
            void s(t, {
              type: "sine",
              frequency: 220,
              duration: 0.028,
              gain: 0.008,
              when: n + 0.006,
              attack: 0.004,
              release: 0.05,
            }))
          : "phone" === e
            ? (s(t, {
                type: "sine",
                frequency: 880,
                duration: 0.12,
                gain: 0.028,
                when: n,
                attack: 0.01,
                release: 0.08,
              }),
              void s(t, {
                type: "sine",
                frequency: 1320,
                duration: 0.08,
                gain: 0.016,
                when: n + 0.04,
                attack: 0.008,
                release: 0.08,
              }))
            : "ending" === e
              ? (s(t, {
                  type: "triangle",
                  frequency: 392,
                  duration: 0.18,
                  gain: 0.018,
                  when: n,
                  attack: 0.02,
                  release: 0.16,
                }),
                void s(t, {
                  type: "sine",
                  frequency: 784,
                  duration: 0.14,
                  gain: 0.012,
                  when: n + 0.06,
                  attack: 0.02,
                  release: 0.18,
                }))
              : void (
                  "thread" === e &&
                  s(t, {
                    type: "triangle",
                    frequency: 294,
                    duration: 0.08,
                    gain: 0.012,
                    when: n,
                    attack: 0.01,
                    release: 0.08,
                  })
                );
      },
      tryPlay: c,
      syncPrompt: l,
      ensureContext: r,
      playEnvelope: s,
    };
  })(),
  G = "1" === new URLSearchParams(window.location.search).get("debug");
let K = 0;
function U(e, t = "") {
  const n = {
    time: new Date().toISOString().slice(11, 19),
    type: e,
    detail: t,
  };
  (Y.debugEvents.push(n), Y.debugEvents.length > 18 && Y.debugEvents.shift());
}
function Z(e = new Date()) {
  return e.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: !1,
  });
}
function J(e, t, n = "subtitle") {
  const o = `${t || ""}`.trim();
  if (!o) return;
  const i = Y.subtitleLog[Y.subtitleLog.length - 1];
  (i && i.source === e && i.text === o && i.kind === n) ||
    (Y.subtitleLog.push({
      id: `${Date.now()}-${Y.subtitleLog.length}`,
      source: e,
      text: o,
      kind: n,
      time: Z(),
    }),
    Y.subtitleLog.length > 120 && Y.subtitleLog.shift(),
    Q());
}
function Q() {
  if (P.transcriptList) {
    if (((P.transcriptList.innerHTML = ""), Y.subtitleLog.length))
      Y.subtitleLog.forEach((e) => {
        const t = document.createElement("div");
        ((t.className = "transcript-item"),
          (t.innerHTML = `<div class="transcript-item-head"><span class="transcript-source">${e.source}</span><span class="transcript-time">${e.time}</span></div><div class="transcript-text">${e.text.replace(/\n/g, "<br>")}</div>`),
          P.transcriptList.appendChild(t));
      });
    else {
      const e = document.createElement("div");
      ((e.className = "transcript-item"),
        (e.innerHTML =
          '<div class="transcript-item-head"><span class="transcript-source">LM402</span><span class="transcript-time">等待字幕</span></div><div class="transcript-text">當文字開始浮上來，它們都會留在這裡。</div>'),
        P.transcriptList.appendChild(e));
    }
    ((P.transcriptStatus.textContent = Y.transcriptExpanded
      ? `收起對話紀錄 · ${Y.subtitleLog.length} 則`
      : Y.subtitleLog.length
        ? `展開對話紀錄 · ${Y.subtitleLog.length} 則`
        : "展開對話紀錄"),
      Y.transcriptExpanded &&
        (P.transcriptList.scrollTop = P.transcriptList.scrollHeight));
  }
}
function ee() {
  if (!uiAllows("transcriptDock"))
    return (
      P.transcriptDock && (P.transcriptDock.hidden = !0),
      void P.transcriptToggle?.setAttribute("aria-expanded", "false")
    );
  P.transcriptToggle &&
    P.transcriptBox &&
    (P.transcriptToggle.setAttribute(
      "aria-expanded",
      String(Y.transcriptExpanded),
    ),
    P.transcriptDock?.classList.toggle("expanded", Y.transcriptExpanded),
    (P.transcriptBox.hidden = !Y.transcriptExpanded),
    Q());
}
function te(e, t, n = 5) {
  const o = Math.max(n, 5);
  ((Y.subtitle = { source: e, text: t, ttl: o }),
    (P.subtitleSource.textContent = e),
    (P.subtitleText.textContent = t),
    J(e, t),
    (Y.subtitleMode = "full"),
    ge());
}
function ne(e) {
  ((Y.ambience.text = e),
    (P.ambienceText.textContent = e),
    (P.ambienceChipCopy.textContent = Y.mobileDockExpanded
      ? "點一下收起"
      : A(e)));
}
function oe() {
  const e = L[Y.lookSensitivityPreset] || L.custom,
    t = `${Math.round(100 * Y.lookSensitivityScalar)}%`;
  ((P.speedToggleValue.textContent = `${e} · ${t}`),
    (P.speedRange.value = String(Math.round(100 * Y.lookSensitivityScalar))),
    (P.speedRangeValue.textContent = t),
    (P.speedPanel.hidden =
      !P.speedToggle.getAttribute("aria-expanded") ||
      "false" === P.speedToggle.getAttribute("aria-expanded")),
    P.speedPresets.querySelectorAll("[data-speed-preset]").forEach((e) => {
      e.classList.toggle(
        "active",
        e.dataset.speedPreset === Y.lookSensitivityPreset,
      );
    }));
}
function ie({ preset: t = null, scalar: n = null, persist: o = !0 } = {}) {
  const i = C(n ?? (t ? E[t] : Y.lookSensitivityScalar));
  ((Y.lookSensitivityScalar = i),
    (Y.lookSensitivityPreset =
      t ??
      (function (e) {
        const t = Object.entries(E).find(([, t]) => Math.abs(t - e) <= 0.035);
        return t?.[0] ?? "custom";
      })(i)),
    oe(),
    o &&
      localStorage.setItem(
        e.lookSensitivity,
        JSON.stringify({
          preset: Y.lookSensitivityPreset,
          scalar: Number(Y.lookSensitivityScalar.toFixed(3)),
        }),
      ),
    U("look-speed", `${Y.lookSensitivityPreset}:${i.toFixed(2)}`));
}
function ae(e = null) {
  const t = e ?? "true" !== P.speedToggle.getAttribute("aria-expanded");
  (P.speedToggle.setAttribute("aria-expanded", String(t)),
    (P.speedPanel.hidden = !t));
}
function re() {
  return Y.lookSensitivityScalar;
}
function ce() {
  (P.audioToggle.setAttribute("aria-pressed", String(Y.audioEnabled)),
    (P.audioToggleValue.textContent = Y.audioEnabled ? "開啟" : "關閉"),
    X.syncPrompt());
}
const le = [
  { key: "small", scale: 0.85, label: "小" },
  { key: "normal", scale: 1, label: "標準" },
  { key: "large", scale: 1.15, label: "大" },
  { key: "xlarge", scale: 1.35, label: "超大" },
  { key: "xxlarge", scale: 1.6, label: "特大" },
];
let se = (function () {
  try {
    const t = localStorage.getItem(e.fontScale);
    if (null !== t) {
      const e = le.findIndex((e) => e.key === t);
      if (-1 !== e) return e;
    }
  } catch {}
  return 1;
})();
function de() {
  const t = le[se];
  (document.documentElement.style.setProperty(
    "--game-font-scale",
    String(t.scale),
  ),
    (P.fontToggleValue.textContent = t.label));
  try {
    localStorage.setItem(e.fontScale, t.key);
  } catch {}
}
function ue() {
  ((se = (se + 1) % le.length), de());
}
function pe(e) {
  if (!e || e.hidden) return null;
  const t = e.getBoundingClientRect();
  return t.width || t.height
    ? {
        left: Math.round(t.left),
        top: Math.round(t.top),
        right: Math.round(t.right),
        bottom: Math.round(t.bottom),
        width: Math.round(t.width),
        height: Math.round(t.height),
      }
    : null;
}
function me() {
  if (!j()) return null;
  const e = P.moveStick.closest(".control-cluster"),
    t = P.lookStick.closest(".control-cluster");
  return {
    leftStick: pe(e),
    rightStick: pe(t),
    interact: pe(P.interactBtn),
    inspect: pe(P.inspectBtn),
    center: pe(P.centerBtn),
    replay: pe(P.replayBtn),
  };
}
function ye() {
  if (!uiAllows("pointerPill"))
    return (
      P.pointerPill && (P.pointerPill.hidden = !0),
      void z.classList.remove("pointer-locked")
    );
  if (_())
    return (
      (P.pointerPill.hidden = !0),
      void z.classList.remove("pointer-locked")
    );
  const e = document.pointerLockElement === z;
  ((Y.pointerLockState = e
    ? "locked"
    : Y.pointerLockPending
      ? "pending"
      : "free"),
    (P.pointerPill.hidden = !1),
    (P.pointerPill.textContent = e
      ? "視角已鎖定 · 右鍵或 Esc 退出"
      : Y.pointerLockPending
        ? "正在鎖定視角…"
        : "右鍵進入視角鎖定"),
    P.pointerPill.classList.toggle("locked", e),
    z.classList.toggle("pointer-locked", e));
}
function ge() {
  if (!uiAllows("bottomDock"))
    return (
      P.bottomDock && (P.bottomDock.hidden = !0),
      P.focusPrompt && (P.focusPrompt.hidden = !0),
      void P.ambienceChip?.setAttribute("aria-expanded", "false")
    );
  const e = j(),
    t = !e,
    n = t && Y.mobileDockExpanded;
  (P.bottomDock.classList.toggle("ambience-expanded", n),
    P.bottomDock.classList.toggle("mobile-landscape", e),
    P.bottomDock.classList.toggle(
      "compact-subtitle",
      "full" !== Y.subtitleMode,
    ),
    P.bottomDock.classList.toggle(
      "hidden-subtitle",
      "hidden" === Y.subtitleMode,
    ),
    (P.ambienceChip.hidden = !0),
    (P.ambienceBox.hidden = !t),
    P.ambienceChip.setAttribute("aria-expanded", "false"),
    (P.ambienceChipCopy.textContent = A(Y.ambience.text)));
}
function he(e) {
  (P.hud.classList.toggle("collapsed", e),
    P.hudToggle.setAttribute("aria-expanded", String(!e)),
    (P.hudToggle.querySelector(".hud-toggle-label").textContent = e
      ? "展開任務"
      : "縮起資訊"),
    (P.hudToggle.querySelector(".hud-toggle-icon").textContent = e
      ? "+"
      : "−"));
}
function ke() {
  P.objectivePrompt.classList.toggle("compact", "chip" === Y.hudMode);
}
function be(e = 2e3) {
  const t = j() ? Math.min(e, 1200) : e;
  ((Y.hudMode = "expanded"),
    ke(),
    window.clearTimeout(K),
    (K = window.setTimeout(() => {
      ((Y.hudMode = "chip"), ke());
    }, t)));
}
function fe() {
  ((Y.hudMode = "expanded" === Y.hudMode ? "chip" : "expanded"),
    ke(),
    "expanded" === Y.hudMode && be());
}
function ve(e = !1) {
  const t = n.find((e) => e.id === Y.phase);
  ((P.objectiveKicker.textContent =
    "eye_contact" === Y.phase
      ? "最後一幕"
      : "consciousness_market" === Y.phase
        ? "意識菜市場"
        : "目前任務"),
    (P.objectiveTitle.textContent = t.title));
  let o = t.copy;
  ("consciousness_market" === Y.phase
    ? (o =
        "10:40，一束光打在阿姨身上。意識菜市場正在開市，不同年紀的自己正在七嘴八舌。在教室裡感受這場內心風暴，等時空手錶走到 11:00。")
    : "front_call" === Y.phase
      ? (o =
          "時空手錶停在 11:00。鐘響了，學長從樓梯走過來，站在 LM402 前門外，打了那通電話。靠近前門把那句話真正聽見。")
      : "rear_wait" === Y.phase
        ? (o =
            "進教室、站到另一端的後門旁，把學長會走過來的那段走廊、那道光和一點空白先留出來。")
        : "eye_contact" === Y.phase &&
          (o =
            "留在後門視線點。別多跨一步，也別讓視線早一步撞到她；等十一點那一道光把她整個照亮。"),
    (P.objectiveCopy.textContent = o),
    (P.panelObjective.textContent = o),
    (P.phaseStrip.innerHTML = ""));
  const i = n.findIndex((e) => e.id === Y.phase);
  (n.forEach((e, t) => {
    const n = document.createElement("div");
    ((n.className = "phase-row"),
      e.id === Y.phase && n.classList.add("active"),
      t < i && n.classList.add("done"),
      (n.innerHTML = `<div class="phase-index">${e.index}</div><div class="phase-copy"><strong>${e.title}</strong><span>${e.copy}</span></div>`),
      P.phaseStrip.appendChild(n));
  }),
    e && be());
}
function xe() {
  if (((P.memoryList.innerHTML = ""), !Y.memories.size)) {
    const e = document.createElement("div");
    return (
      (e.className = "memory-item"),
      (e.innerHTML =
        '<div class="memory-kicker">還沒收進來</div><div class="memory-title">先去看門牌、黑板、靠窗座位、講義邊角或後門，把 LM402 這一層空氣收進來。</div>'),
      void P.memoryList.appendChild(e)
    );
  }
  [...Y.memories].forEach((e) => {
    const t = i[e],
      n = document.createElement("div");
    ((n.className = "memory-item"),
      (n.innerHTML = `<div class="memory-kicker">${t.kicker}</div><div class="memory-title">${t.title}</div><div class="memory-copy">${t.copy[0]}</div>`),
      P.memoryList.appendChild(n));
  });
}
function Ee(e) {
  ((P.hintPill.textContent = e),
    P.hintPill.classList.add("show"),
    window.clearTimeout(Ee.timer),
    (Ee.timer = window.setTimeout(
      () => P.hintPill.classList.remove("show"),
      2400,
    )));
}
function Le() {
  ((Y.dialogue = null),
    Y.endingSequence || (Y.cameraMode = "intro" === Y.mode ? "intro" : "play"),
    (P.dialogueSheet.hidden = !0),
    P.body.classList.remove("dialogue-open"),
    z.focus({ preventScroll: !0 }),
    ye());
}
function Se(e) {
  Y.memories.has(e) ||
    (Y.memories.add(e), xe(), Ee(`已收進來：${i[e].title}`), U("memory", e));
}
function we(e) {
  Y.phase !== e &&
    ((Y.phase = e),
    (Y.phaseClock = 0),
    (Y.cinematicGlow = 0),
    ve(!0),
    U("phase", e));
}
function Be(e) {
  if ("close_only" !== e)
    return "collect_plaque" === e || "memory_plaque" === e
      ? (Se("plaque"),
        te("女兒", "門牌：LM402。粉筆味像一層薄雲。", 3.8),
        void Le())
      : "make_phone_call" === e
        ? ((Y.flags.phoneCallMade = !0),
          X.playCue("phone"),
          te("學長", "「喂？妳在哪裡？」", 3.6),
          scheduleManagedTimeout("narrative", 4e3, () => {
            "play" === Y.mode &&
              !Y.ending &&
              Ee("去找學妹，把那句台詞說出來。");
          }),
          void Le())
        : "trigger_ending_sequence" === e
          ? ((Y.flags.frontCallHeard = !0),
            te("學妹", "「你走到後門。」", 3.6),
            X.playCue("thread"),
            Le(),
            void scheduleManagedTimeout("ending", 1200, () => {
              qe();
            }))
          : "advance_front_call" === e
            ? ((Y.flags.frontCallHeard = !0),
              we("rear_wait"),
              Ie(),
              X.playCue("phone"),
              te("學妹", "「你走到後門。」", 3.6),
              scheduleManagedTimeout("narrative", 4e3, () => {
                "play" === Y.mode &&
                  !Y.ending &&
                  te(
                    "女兒",
                    "把拔的聲音聽起來好年輕。如果我沿著這條紅線走到後門，我是不是就能看見他們的一眼瞬間？",
                    5,
                  );
              }),
              ne(
                "鐘聲剛落，前門那邊傳來探頭和腳步的動靜，風把教室裡的紙邊輕輕掀起。",
              ),
              void Le())
            : "memory_board" === e || "memory_board_soft" === e
              ? (Se("board"),
                renderer.spawnHologram("board", Y.time),
                "memory_board" === e &&
                  te(
                    "33 歲的聲音",
                    "十一點整，下課鐘會響。他會先從前門探頭看，可是看不到妳。",
                    4.2,
                  ),
                void Le())
              : "memory_seat" === e
                ? (Se("seat"),
                  renderer.spawnHologram("seat", Y.time),
                  te(
                    "女兒",
                    "原來阿姨當時就是站在這格光裡。用 29 歲的身體、18 歲的心跳，等著把拔走過來。",
                    5,
                  ),
                  void Le())
                : "memory_notes" === e
                  ? (Se("notes"),
                    renderer.spawnHologram("notes", Y.time),
                    X.playCue("thread"),
                    scheduleManagedTimeout("narrative", 500, () => {
                      "play" === Y.mode &&
                        !Y.ending &&
                        te(
                          "把拔（心底的聲音）",
                          "「這一次，依然再次遇見妳。」",
                          3.5,
                        );
                    }),
                    scheduleManagedTimeout("narrative", 4200, () => {
                      "play" === Y.mode &&
                        !Y.ending &&
                        te(
                          "女兒",
                          "原來阿姨當時在腦海裡開了一場『意識菜市場』會議，才緊張地把那句『你走到後門』練得這麼穩。",
                          5,
                        );
                    }),
                    void Le())
                  : "advance_rear_wait" === e
                    ? ((Y.flags.juniorPrepared = !0),
                      X.playCue("thread"),
                      te("女兒", "深呼吸，就是這一秒了。", 3.6),
                      Ee("現在去後門，先把自己站穩。"),
                      void Le())
                    : "memory_backdoor" === e
                      ? (Se("backdoor"), void Le())
                      : "memory_aunt_market" === e
                        ? (te(
                            "女兒",
                            "就像命運阿嬤說的，不同年紀的阿姨都擠在這個菜市場裡，一起保護著這個最重要的時刻。",
                            4.5,
                          ),
                          void Le())
                        : "collect_aunt_market" === e
                          ? (Se("aunt_market"),
                            te(
                              "女兒",
                              "我把阿姨在『意識菜市場』裡的溫度，悄悄收進了只有我看得見的時空口袋裡。",
                              4.5,
                            ),
                            void Le())
                          : void (
                              "anchor_backdoor" === e &&
                              (Se("backdoor"),
                              (Y.flags.backdoorAnchored = !0),
                              we("eye_contact"),
                              Ie(),
                              X.playCue("ending"),
                              te(
                                "女兒",
                                "我停在後門旁，剛好能看到走廊的一小段。",
                                4.2,
                              ),
                              ne(
                                "光從窗邊切進來，把地板照得有點過分地亮。所有版本的呼吸都慢慢安靜下來。",
                              ),
                              Le())
                            );
  Le();
}
function ze(e) {
  return (
    e.revealIn.includes(Y.phase) ||
    ("rear_wait" === Y.phase && "backdoor" === e.id)
  );
}
function Me() {
  return o.map((e) => {
    const t = w[e.id];
    let n = t.x,
      o = t.z;
    return (
      "front_call" === e.id
        ? ((n = Y.characters.senior.x), (o = Y.characters.senior.z))
        : "junior" === e.id &&
          ((n = Y.characters.junior.x), (o = Y.characters.junior.z)),
      {
        id: e.id,
        type: e.type,
        label: e.label,
        prompt: e.prompt,
        x: n,
        y: t.y,
        z: o,
        radius: t.radius,
        visible: ze(e),
      }
    );
  });
}
function Pe() {
  const e = Y.activeHotspot;
  ((P.interactBtn.disabled = !1),
    (P.inspectBtn.disabled = !1),
    (P.interactBtn.textContent = e && "memory" === e.type ? "看" : "互"),
    P.interactBtn.setAttribute("aria-label", e ? e.prompt : "互動"),
    P.inspectBtn.setAttribute(
      "aria-label",
      e ? `對焦 ${e.label}` : "對焦目前目標",
    ));
}
function Ce() {
  if ("play" !== Y.mode || Y.dialogue || Y.ending) return;
  const e = Y.activeHotspot;
  if (!e) return void Ee("先靠近前門、學妹、黑板、座位、講義或後門。");
  const t =
    "front_call" === (n = e.id) && "front_call" === Y.phase
      ? a.front_call
      : "junior" === n && "consciousness_market" === Y.phase
        ? a.junior_prephone
        : "junior" !== n || Y.flags.phoneCallMade
          ? "junior" === n && "eye_contact" !== Y.phase
            ? a.junior
            : "backdoor" !== n ||
                ("front_call" !== Y.phase && "consciousness_market" !== Y.phase)
              ? "backdoor" === n &&
                "front_call" !== Y.phase &&
                "consciousness_market" !== Y.phase
                ? a.backdoor
                : a[n]
              : a.aunt_market
          : a.junior_prephone;
  var n, o;
  t &&
    ((o = t),
    document.pointerLockElement === z && document.exitPointerLock?.(),
    (Y.dialogue = o),
    (Y.cameraMode = "dialogue"),
    (P.dialogueEyebrow.textContent = o.eyebrow),
    (P.dialogueTitle.textContent = `${o.speaker} · ${o.title}`),
    (P.dialogueCopy.innerHTML = o.copy.map((e) => `<p>${e}</p>`).join("")),
    J(o.speaker, o.copy.join("\n"), "dialogue"),
    (P.dialogueChoices.innerHTML = ""),
    o.choices.forEach((e, t) => {
      const n = document.createElement("button");
      ((n.type = "button"),
        (n.className = "dialogue-choice"),
        (n.innerHTML = `<strong>${t + 1}. ${e.label}</strong><span>${e.detail}</span>`),
        n.addEventListener("click", () => Be(e.effect)),
        P.dialogueChoices.appendChild(n));
    }),
    (P.dialogueSheet.hidden = !1),
    P.body.classList.add("dialogue-open"),
    U("dialogue-open", o.title));
}
function Ie() {
  const e = W(Y.phase);
  ((Y.player.yaw = $(Y.player, e)),
    (Y.player.pitch = R(Y.phase, Y.player)),
    Ee("視線已帶回這一段的目標方向。"));
}
function Te(e = !1) {
  const t = performance.now();
  (Y.dialogue && Le(),
    clearManagedTimeouts(["narrative", "ending"]),
    document.pointerLockElement === z && document.exitPointerLock?.(),
    N(),
    (Y.mode = "intro"),
    (Y.cameraMode = "intro"),
    (Y.intro.progress = 0),
    (Y.intro.time = 0),
    (Y.intro.startedAt = t),
    (Y.intro.deadlineAt = t + 1e3 * l.introDuration + 1400),
    (Y.intro.replay = e),
    (Y.intro.resume = e
      ? {
          phase: Y.phase,
          phaseClock: Y.phaseClock,
          player: {
            x: Y.player.x,
            y: Y.player.y,
            z: Y.player.z,
            yaw: Y.player.yaw,
            pitch: Y.player.pitch,
            velocity: { ...Y.player.velocity },
          },
          subtitle: { ...Y.subtitle },
          ambience: { ...Y.ambience },
          activeHotspotId: Y.activeHotspotId,
        }
      : null),
    (Y.introBeatIndex = 0),
    (Y.introCameraTrack = r[0].id),
    (Y.cinematicGlow = 0),
    (Y.ending = null),
    (Y.endingSequence = null),
    (P.endingOverlay.hidden = !0),
    P.body.classList.remove("ending-open"),
    P.introFx &&
      (P.introFx.classList.remove("intro-fx-done"),
      P.introFx.classList.add("intro-fx-active")),
    P.introSkipBtn && (P.introSkipBtn.hidden = !1),
    te(r[0].kicker, r[0].text, 0.2),
    ne(r[0].ambience),
    (Y.subtitleMode = "full"),
    applyUiVisibilityPreset("intro"),
    ge(),
    U("intro", e ? "replay" : "start"));
}
function De() {
  const e = Y.intro.replay ? Y.intro.resume : null;
  (N(),
    (Y.mode = "play"),
    (Y.cameraMode = "play"),
    (Y.intro.replay = !1),
    (Y.intro.resume = null),
    (Y.intro.startedAt = 0),
    (Y.intro.deadlineAt = 0),
    P.introSkipBtn && (P.introSkipBtn.hidden = !0),
    P.introFx &&
      (P.introFx.classList.remove("intro-fx-active"),
      P.introFx.classList.add("intro-fx-done")),
    (Y.transcriptExpanded = !0),
    applyUiVisibilityPreset("play"),
    ee(),
    e
      ? ((Y.phase = e.phase),
        (Y.phaseClock = e.phaseClock),
        (Y.player.x = e.player.x),
        (Y.player.y = e.player.y),
        (Y.player.z = e.player.z),
        (Y.player.yaw = e.player.yaw),
        (Y.player.pitch = e.player.pitch),
        (Y.player.velocity = { ...e.player.velocity }),
        te(e.subtitle.source, e.subtitle.text, 2.8),
        ne(e.ambience.text))
      : ((Y.player = {
          ...F(),
          velocity: { x: 0, z: 0 },
          lookInput: { x: 0, y: 0 },
          isGhostObserver: !0,
        }),
        te(
          "女兒",
          "現在時空手錶顯示10:40，現在阿姨在教室裡面，怎麼我會這麼緊張^_^",
          5,
        ),
        ne(
          "十一點的陽光灑在走廊和教室裡，微風輕輕吹過四樓的窗戶，帶著校園裡樹葉的氣味。",
        )),
    (Y.subtitleMode = "full"),
    ge(),
    ve(!0),
    ye(),
    Y.audioEnabled || (P.musicPrompt.hidden = !1));
}
function _e(e, t = {}) {
  if (Y.endingSequence) return;
  const { manual: n = !1 } = t,
    o = performance.now();
  clearManagedTimeouts(["narrative", "ending"]);
  ((Y.ending = e),
    (Y.endingSequence = {
      type: e,
      time: 0,
      timeOffset: 0,
      startedAt: o,
      scrubTime: null,
      manual: n,
      shotPhase: "perfect" === e ? getPerfectShotPhase(0) : "overlay",
    }),
    (Y.cameraMode = "ending"),
    (Y.transcriptExpanded = !0),
    applyUiVisibilityPreset("ending"),
    ee(),
    document.pointerLockElement === z && document.exitPointerLock?.(),
    "perfect" === e
      ? ((Y.phase = "eye_contact"),
        (Y.phaseClock = 0),
        (Y.flags.perfectLinePlayed = !1),
        (Y.flags.perfectLine1Played = !1),
        (Y.flags.perfectLine2Played = !1),
        te(
          "女兒",
          "光先落在她身上，像整條四樓走廊和整間教室都往後慢慢退開，只剩她一個人被時間輕輕托住。",
          6.2,
        ),
        scheduleManagedTimeout("ending", 1e3 * (l.perfectLine1At ?? 1), () => {
          Y.endingSequence &&
            "perfect" === Y.ending &&
            !Y.flags.perfectLine1Played &&
            ((Y.flags.perfectLine1Played = !0),
            te("學長", "也太像徐若瑄了吧！", 5));
        }),
        scheduleManagedTimeout("ending", 1e3 * (l.perfectLine2At ?? 6), () => {
          Y.endingSequence &&
            "perfect" === Y.ending &&
            !Y.flags.perfectLine2Played &&
            ((Y.flags.perfectLine2Played = !0),
            te("把拔（心底的聲音）", "這一次，依然再次遇見妳。", 5));
        }),
        scheduleManagedTimeout(
          "ending",
          1e3 * (l.perfectOverlayAt ?? l.perfectDuration),
          () => {
            Y.endingSequence &&
              "perfect" === Y.ending &&
              P.endingOverlay.hidden &&
              je();
          },
        ),
        ne(
          "四樓後門那一側忽然靜下來，只剩陽光沿著無天花板的走廊、玻璃和地面慢慢推進來，把她留在最亮的那一格。",
        ))
      : (te("女兒", "missed" === e ? "紅線先回彈了。" : "他出現在光裡。", 4.4),
        scheduleManagedTimeout("ending", 1e3 * l.duration, () => {
          Y.endingSequence && P.endingOverlay.hidden && je();
        })),
    syncEndingSequenceClock(o),
    U("ending", e));
}
function qe() {
  (Y.dialogue && Le(),
    clearManagedTimeouts(["narrative", "ending"]),
    document.pointerLockElement === z && document.exitPointerLock?.(),
    N(),
    (Y.mode = "play"),
    (Y.ending = null),
    (Y.endingSequence = null),
    (P.endingOverlay.hidden = !0),
    P.body.classList.remove("ending-open"),
    applyUiVisibilityPreset("play"),
    _e("perfect", { manual: !0 }));
}
function je() {
  const e = c[Y.ending];
  ((P.endingKicker.textContent = e.kicker),
    (P.endingTitle.textContent = e.title),
    (P.endingCopy.textContent = e.copy),
    clearManagedTimeouts(["ending"]),
    (Y.endingSequence = null),
    (Y.cameraMode = "ending_overlay"),
    (P.endingOverlay.hidden = !1),
    P.body.classList.add("ending-open"),
    applyUiVisibilityPreset("ending"));
  try {
    const _ek = e.endingsCompleted;
    const _es = JSON.parse(localStorage.getItem(_ek) || "{}");
    _es[Y.ending] = {
      completedAt: Date.now(),
      count: (_es[Y.ending]?.count || 0) + 1,
    };
    localStorage.setItem(_ek, JSON.stringify(_es));
    updateEndingTracker();
  } catch (_ex) {}
}
function Ae() {
  (N(),
    clearManagedTimeouts(["narrative", "ending"]),
    (Y.mode = "play"),
    (Y.cameraMode = "play"),
    (Y.phase = "consciousness_market"),
    (Y.phaseClock = 0),
    (Y.time = 0),
    (Y.ending = null),
    (Y.endingSequence = null),
    (Y.dialogue = null),
    (Y.flags = {
      frontCallHeard: !1,
      backdoorAnchored: !1,
      juniorPrepared: !1,
      rearWaitHintPlayed: !1,
      eyeCuePlayed: !1,
      perfectLinePlayed: !1,
      lastMarketLine: -1,
    }),
    (Y.player = {
      ...F(),
      velocity: { x: 0, z: 0 },
      lookInput: { x: 0, y: 0 },
      isGhostObserver: !0,
    }),
    (Y.characters = H()),
    (Y.cinematicGlow = 0.6),
    (Y.mobileDockExpanded = !1),
    (Y.introBeatIndex = 0),
    (Y.introCameraTrack = r[0].id),
    (Y.transcriptExpanded = !0),
    (Y.memories = new Set()),
    (Y.activeHotspot = null),
    (Y.activeHotspotId = null),
    (Y.boundaryCollisionState = null),
    (Y.gameTime = { hours: 10, minutes: 40, frozen: !1, realElapsed: 0 }),
    (Y.renderErrorCount = 0),
    (Y.renderErrors = []),
    (P.endingOverlay.hidden = !0),
    P.body.classList.remove("ending-open"),
    (P.dialogueSheet.hidden = !0),
    P.body.classList.remove("dialogue-open"),
    applyUiVisibilityPreset("play"),
    ve(!0),
    xe(),
    te(
      "女兒",
      "現在時空手錶顯示10:40，現在阿姨在教室裡面，怎麼我會這麼緊張^_^",
      5,
    ),
    ne(
      "粉筆味像一層薄雲，四樓長走廊有風，沒有天花板的日光正沿著矮牆、前門門洞和教室兩側一起往裡推。",
    ),
    ge(),
    ye(),
    U("scene", "reset"));
}
function He(e, t, n, o, i = 1) {
  ((Y.characters[e].x = t),
    (Y.characters[e].z = n),
    (Y.characters[e].rotationY = o),
    "alpha" in Y.characters[e] && (Y.characters[e].alpha = i));
}
function $e() {
  if ("perfect" === Y.endingSequence?.type) {
    const e = y(0.36, 23.4, Y.endingSequence.time),
      n = y(0.8, 15.4, Y.endingSequence.time),
      o = m(g(-334), g(-318), 0.82 * e),
      i = m(g(t.frontDoor.center.z - 44), g(t.backDoor.center.z + 4), e),
      a = b(k, n),
      r = a.x,
      c = a.z,
      l = V(r - o, c - i, 0),
      s = V(a.dx, a.dz, -Math.PI / 2);
    return (
      He("senior", o, i, l),
      He("junior", r, c, s),
      He("fatherEcho", g(-272), g(t.backDoor.center.z + 2), Math.PI / 2, 0),
      void He("auntEcho", g(-116), g(t.backDoor.center.z + 26), -Math.PI / 2, 0)
    );
  }
  if ("consciousness_market" === Y.phase)
    return (
      He("senior", g(-520), g(t.stairs.front.landingZ), 0, 0),
      He("junior", g(1896), g(2058), 0.03),
      He("fatherEcho", g(-272), g(t.backDoor.center.z + 2), Math.PI / 2, 0),
      void He("auntEcho", g(-116), g(t.backDoor.center.z + 26), -Math.PI / 2, 0)
    );
  if ("front_call" === Y.phase) {
    const e = y(0.16, 7.6, Y.phaseClock),
      n = m(g(-520), g(-336), e),
      o = m(g(t.frontDoor.center.z - 286), g(t.frontDoor.center.z - 42), e);
    return (
      He(
        "senior",
        n,
        o,
        V(g(-236) - n, g(t.frontDoor.center.z + 10) - o, -1.08),
      ),
      He("junior", g(1896), g(2058), 0.03),
      He("fatherEcho", g(-272), g(t.backDoor.center.z + 2), Math.PI / 2, 0),
      void He("auntEcho", g(-116), g(t.backDoor.center.z + 26), -Math.PI / 2, 0)
    );
  }
  if ("rear_wait" === Y.phase) {
    const e = y(0.2, 11.6, Y.phaseClock),
      n = y(1.2, 9.6, Y.phaseClock),
      o = m(g(-342), g(-324), 0.84 * e),
      i = m(g(t.frontDoor.center.z - 42), g(t.backDoor.center.z), e),
      a = (function (e) {
        return b(h, e);
      })(n),
      r = a.x,
      c = a.z;
    return (
      He("senior", o, i, V(r - o, c - i, -0.12)),
      He("junior", r, c, V(a.dx, a.dz, -Math.PI / 2)),
      He("fatherEcho", g(-272), g(t.backDoor.center.z + 2), Math.PI / 2, 0),
      void He("auntEcho", g(-116), g(t.backDoor.center.z + 26), -Math.PI / 2, 0)
    );
  }
  const e = y(1.6, 8, Y.phaseClock),
    n = y(0.4, 6.8, Y.phaseClock),
    o = m(g(-356), g(-332), 0.8 * e),
    i = m(g(t.backDoor.center.z + 4), g(t.backDoor.center.z), e),
    a = m(g(84), g(58), n),
    r = m(g(t.backDoor.center.z + 2), g(t.backDoor.center.z - 2), n),
    c = y(2.2, 4, Y.phaseClock) * (1 - y(5.2, 6.1, Y.phaseClock));
  (He("senior", o, i, V(a - o, r - i, 0)),
    He("junior", a, r, V(o - a, i - r, -Math.PI / 2)),
    He("fatherEcho", g(-272), g(t.backDoor.center.z + 2), Math.PI / 2, 0.6 * c),
    He(
      "auntEcho",
      g(-116),
      g(t.backDoor.center.z + 26),
      -Math.PI / 2,
      0.74 * c,
    ));
}
function Oe(e) {
  if (((Y.phaseClock += e), "consciousness_market" === Y.phase)) {
    Y.cinematicGlow = 0.6;
    const e = a.consciousness_market.lines,
      t = 9,
      n = Math.floor(Y.phaseClock / t);
    if (n < e.length && n !== Y.flags.lastMarketLine) {
      Y.flags.lastMarketLine = n;
      const o = e[n];
      te(o.speaker, o.text, t - 1);
    }
    return void (
      Y.gameTime.frozen &&
      (we("front_call"),
      te("女兒", "時空手錶停了。鐘響了。有人從樓梯走過來……", 4))
    );
  }
  if (
    ("rear_wait" === Y.phase &&
      Y.phaseClock > 1.2 &&
      !Y.flags.rearWaitHintPlayed &&
      ((Y.flags.rearWaitHintPlayed = !0),
      te(
        "39 歲的聲音",
        "難的是『站好』。等一下他真的往這裡走的時候，妳全身都會想往前衝。",
        4.6,
      )),
    "rear_wait" === Y.phase &&
      Y.phaseClock > 13 &&
      !Y.flags.autoBackdoorTriggered &&
      ((Y.flags.autoBackdoorTriggered = !0),
      Se("backdoor"),
      (Y.flags.backdoorAnchored = !0),
      we("eye_contact"),
      Ie(),
      X.playCue("ending"),
      te("女兒", "我停在後門旁，剛好能看到走廊的一小段。", 4.2),
      ne(
        "光從窗邊切進來，把地板照得有點過分地亮。所有版本的呼吸都慢慢安靜下來。",
      )),
    "eye_contact" === Y.phase)
  ) {
    Y.phaseClock > 0.6 &&
      !Y.flags.eyeCuePlayed &&
      ((Y.flags.eyeCuePlayed = !0),
      te("49 歲的聲音", "站好。留一點空白給命運，也留一點空白給妳自己。", 4.6));
    const e = S.eyeLook,
      t =
        (function (e, t) {
          let n = e - t;
          for (; n > Math.PI; ) n -= 2 * Math.PI;
          for (; n < -Math.PI; ) n += 2 * Math.PI;
          return Math.abs(n);
        })(Y.player.yaw, $(Y.player, e)) < 0.5 &&
        Math.abs(Y.player.pitch - O(Y.player, e)) < 0.4 &&
        Math.hypot(Y.player.x - S.focusMark.x, Y.player.z - S.focusMark.z) <
          g(200);
    if (
      ((Y.cinematicGlow = y(
        l.successWindow[0],
        l.successWindow[1],
        Y.phaseClock,
      )),
      Y.flags.autoBackdoorTriggered && Y.phaseClock > 3 && !Y.endingSequence)
    )
      return void qe();
    (Y.phaseClock >= l.lockWindow &&
      !Y.endingSequence &&
      _e(t ? (Y.memories.size >= 4 ? "memory" : "canon") : "missed"),
      Y.phaseClock >= l.lockWindow + 8 &&
        !Y.endingSequence &&
        !Y.ending &&
        _e("missed"));
  } else Y.cinematicGlow = 0;
}
function We() {
  return {
    stageBounds: pe(document.getElementById("stage")),
    canvasBounds: pe(z),
    subtitleBounds: pe(P.subtitleBox),
    ambienceBounds: pe(P.ambienceBox.hidden ? P.ambienceChip : P.ambienceBox),
    objectiveBounds: pe(P.objectivePrompt),
    controlBounds: me(),
  };
}
function Re() {
  if (!G || !uiAllows("debugPanel")) return void (P.debugPanel.hidden = !0);
  Y.endingSequence && syncEndingSequenceClock();
  P.debugPanel.hidden = !1;
  const e = M.getDebugSnapshot(),
    t = We(),
    n = {
      mode: Y.mode,
      phase: Y.phase,
      phaseClock: Number(Y.phaseClock.toFixed(3)),
      clockTime: Number(Y.time.toFixed(3)),
      cameraMode: Y.cameraMode,
      cameraAnchor:
        "intro" === Y.mode
          ? Y.introCameraTrack
          : "eye_contact" === Y.phase
            ? "eye_contact"
            : Y.phase,
      hudMode: Y.hudMode,
      subtitleMode: Y.subtitleMode,
      pointerLockState: Y.pointerLockState,
      lastContextMenu: Y.lastContextMenu,
      boundaryCollisionState: Y.boundaryCollisionState,
      collisionLabel: Y.boundaryCollisionState,
      activeHotspot: Y.activeHotspotId,
      cameraYaw: Number(Y.player.yaw.toFixed(3)),
      cameraPitch: Number(Y.player.pitch.toFixed(3)),
      lookSensitivityPreset: Y.lookSensitivityPreset,
      lookSensitivityScalar: Number(Y.lookSensitivityScalar.toFixed(3)),
      audioEnabled: Y.audioEnabled,
      mobileDensityTier: Y.mobileDensityTier,
      objectiveCompact: P.objectivePrompt.classList.contains("compact"),
      subtitleLogCount: Y.subtitleLog.length,
      transcriptExpanded: Y.transcriptExpanded,
      stageViewport: t.stageBounds,
      canvasViewport: t.canvasBounds,
      subtitleBounds: t.subtitleBounds,
      controlBounds: t.controlBounds,
      webglViewport: e.webglViewport,
      mobileBlackRegionDetected: e.mobileBlackRegionDetected,
      projectedNodes: e.projectedNodes,
      hotspotLOS: e.hotspotLOS,
      currentRoomIds: e.currentRoomIds,
      endingShotPhase: e.endingShotPhase,
      endingSequenceTime: Number((Y.endingSequence?.time ?? 0).toFixed(3)),
      renderer: e,
      events: Y.debugEvents,
    };
  P.debugText.textContent = JSON.stringify(n, null, 2);
}
let _lastStairLoop = 0;
function _stairLoop() {
  if (M.triggerWormhole)
    M.triggerWormhole(Y.player.x, Y.player.stairY || 0, Y.player.z);
  const now = performance.now();
  if (now - _lastStairLoop < 8e3) return;
  _lastStairLoop = now;
  const lines = [
    "不管怎麼走都會回到四樓耶。",
    "欸⋯⋯又是四樓。",
    "樓梯好像只連到這一層。",
    "上去也是四樓，下去也是四樓⋯⋯",
    "這裡的時間只有四樓。",
  ];
  const line = lines[Math.floor(Math.random() * lines.length)];
  te("女兒", line, 3.5);
  const _flash = document.getElementById("stage");
  if (_flash) {
    _flash.style.transition = "filter .15s";
    _flash.style.filter = "brightness(3) saturate(0.2)";
    setTimeout(() => {
      _flash.style.transition = "filter 1.2s";
      _flash.style.filter = "";
    }, 150);
  }
}
function updateEndingTracker() {
  try {
    const key = e.endingsCompleted;
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const all = ["perfect", "canon", "memory", "missed"];
    const render = (id) => {
      const done = !!saved[id];
      const ending = c[id];
      const count = saved[id]?.count || 0;
      return `<div class="et-item ${done ? "done" : ""}" title="${ending.title}${count ? " (×" + count + ")" : ""}"><span class="et-dot ${id}"></span><span class="et-lbl">${ending.kicker}</span><span class="et-chk">${done ? "✓" : "—"}</span></div>`;
    };
    const html = all.map(render).join("");
    const completed = all.filter((id) => saved[id]).length;
    const sumText =
      completed === 4 ? "🎉 全結局達成！" : completed + "/4 結局已達成";
    ["ending-tracker", "ending-tracker-side"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
    ["ending-tracker-summary", "ending-tracker-side-summary"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = sumText;
    });
  } catch (ex) {}
}
function Ve() {
  try {
    M.render({
      mode: Y.mode,
      phase: Y.phase,
      intro: Y.intro,
      introBeatIndex: Y.introBeatIndex,
      introCameraTrack: Y.introCameraTrack,
      player: Y.player,
      characters: Y.characters,
      hotspots: Me(),
      activeHotspotId: Y.activeHotspotId,
      cinematicGlow: Y.cinematicGlow,
      endingSequence: Y.endingSequence,
      ending: Y.ending,
      time: Y.time,
      qualityTier: Y.qualityTier,
      uiVisibilityPreset: Y.uiVisibilityPreset,
    });
  } catch (e) {
    const t = (
      e instanceof Error ? `${e.name}: ${e.message}` : String(e)
    ).slice(0, 180);
    ((Y.renderErrorCount += 1),
      Y.renderErrors.push({
        time: Number(Y.time.toFixed(2)),
        message: t,
      }),
      Y.renderErrors.length > 10 && Y.renderErrors.shift());
    if ((U("render_error", t), Y.endingSequence))
      return (
        (Y.ending ||= Y.endingSequence.type || "canon"),
        (Y.cinematicGlow = 0),
        (Y.endingSequence = null),
        applyUiVisibilityPreset("ending"),
        je(),
        void te("LM402", "鏡頭先退回現場，但這一眼還是被留下來了。", 5.2)
      );
    throw e;
  }
  Re();
}
function Fe() {
  if (!Y.audioEnabled) return;
  const e = X.ensureContext();
  if (!e || "running" !== e.state) return;
  const t = e.currentTime + 0.01;
  (X.playEnvelope(e, {
    type: "sine",
    frequency: 60,
    duration: 0.08,
    gain: 0.06,
    when: t,
    attack: 0.006,
    release: 0.1,
  }),
    X.playEnvelope(e, {
      type: "sine",
      frequency: 40,
      duration: 0.06,
      gain: 0.03,
      when: t,
      attack: 0.006,
      release: 0.08,
    }),
    X.playEnvelope(e, {
      type: "sine",
      frequency: 55,
      duration: 0.06,
      gain: 0.04,
      when: t + 0.12,
      attack: 0.006,
      release: 0.08,
    }),
    X.playEnvelope(e, {
      type: "sine",
      frequency: 35,
      duration: 0.05,
      gain: 0.02,
      when: t + 0.12,
      attack: 0.006,
      release: 0.07,
    }),
    P.timeWatch &&
      (P.timeWatch.classList.add("pulse"),
      setTimeout(() => {
        P.timeWatch && P.timeWatch.classList.remove("pulse");
      }, 150)));
}
function Ne(e) {
  const t = Y.gameTime;
  if (t.frozen) return;
  if ("play" !== Y.mode) return;
  t.realElapsed += e;
  for (t.minutes += e * (7 / 60); t.minutes >= 60; )
    ((t.minutes -= 60), (t.hours += 1));
  const n = 60 * t.hours + t.minutes;
  if (n >= 640 && n < 660) {
    const e = Y.heartbeat,
      t = 2 + -1.67 * ((n - 640) / 20),
      o = performance.now() / 1e3;
    e.active
      ? o - e.lastBeatTime >= t && ((e.lastBeatTime = o), Fe())
      : ((e.active = !0), (e.lastBeatTime = o), Fe());
  }
  (t.hours > 11 || (11 === t.hours && t.minutes >= 0)) &&
    ((t.hours = 11),
    (t.minutes = 0),
    (t.frozen = !0),
    (Y.heartbeat.active = !1),
    P.timeWatch && P.timeWatch.classList.add("frozen"));
  const o =
    ((i = t.hours),
    (a = t.minutes),
    String(i).padStart(2, "0") + ":" + String(Math.floor(a)).padStart(2, "0"));
  var i, a;
  (P.timeWatchDisplay && (P.timeWatchDisplay.textContent = o),
    P.hudTimePill && (P.hudTimePill.textContent = o + " 陽光"));
}
function Ye() {
  _() &&
    screen.orientation?.lock &&
    screen.orientation.lock("landscape").catch(() => {});
}
function Xe(e) {
  return (
    e instanceof HTMLElement &&
    Boolean(
      e.closest(
        ".speed-widget, .speed-panel, .audio-widget, .music-prompt, .objective-prompt, .bottom-dock, .mobile-controls, button, a, input, label",
      ),
    )
  );
}
function Ge() {
  if (_()) return;
  z.focus({ preventScroll: !0 });
  if (
    (document.pointerLockElement ||
      document.webkitPointerLockElement ||
      document.mozPointerLockElement) === z
  ) {
    Y.pointerLockPending = !1;
    const e =
      document.exitPointerLock ||
      document.webkitExitPointerLock ||
      document.mozExitPointerLock;
    return (e?.call(document), void ye());
  }
  if ("play" !== Y.mode || Y.dialogue || Y.endingSequence || Y.ending) return;
  if (Y.pointerLockPending) return;
  const e =
    z.requestPointerLock ||
    z.webkitRequestPointerLock ||
    z.mozRequestPointerLock;
  if ("function" != typeof e)
    return (Ee("這個瀏覽器目前不支援視角鎖定。"), void ye());
  ((Y.pointerLockPending = !0), ye());
  const t = e.bind(z);
  ((
    (() => {
      try {
        const e = t({ unadjustedMovement: !0 });
        if (e && "function" == typeof e.then) return e;
      } catch (e) {}
      return null;
    })() ??
    (() => {
      try {
        return Promise.resolve(t());
      } catch (e) {
        return Promise.reject();
      }
    })()
  ).catch(() => {
    ((Y.pointerLockPending = !1),
      Ee("視角鎖定不可用，改用按住左鍵拖曳看四周。"),
      ye());
  }),
    window.setTimeout(() => {
      document.pointerLockElement !== z && ((Y.pointerLockPending = !1), ye());
    }, 520));
}
function Ke(e, t) {
  const n = e.querySelector(".joystick-thumb"),
    o = { id: null },
    i = (o, i) => {
      const a = e.getBoundingClientRect(),
        r = Math.max(28, 0.28 * a.width),
        c = o - (a.left + a.width / 2),
        l = i - (a.top + a.height / 2),
        s = Math.hypot(c, l),
        d = s > r ? r / s : 1,
        u = (c * d) / r,
        p = (l * d) / r;
      ((n.style.transform = `translate(${u * r}px, ${p * r}px)`), t(u, p));
    },
    a = () => {
      ((o.id = null), (n.style.transform = "translate(0px, 0px)"), t(0, 0));
    };
  (e.addEventListener("pointerdown", (t) => {
    (Ye(),
      X.unlock(),
      (o.id = t.pointerId),
      e.setPointerCapture(t.pointerId),
      i(t.clientX, t.clientY));
  }),
    e.addEventListener("pointermove", (e) => {
      o.id === e.pointerId && i(e.clientX, e.clientY);
    }),
    e.addEventListener("pointerup", (e) => {
      o.id === e.pointerId && a();
    }),
    e.addEventListener("pointercancel", a));
}
function Ue() {
  const e = _(),
    t = j(),
    n = P.body.classList.contains("is-mobile-landscape");
  Y.mobileDensityTier = (function () {
    if (!j()) return "regular";
    const e = Math.min(window.innerWidth, window.innerHeight);
    return e <= 360 ? "tight" : e <= 400 ? "compact" : "regular";
  })();
  const o = s[Y.mobileDensityTier],
    i = document.getElementById("stage").getBoundingClientRect();
  ((P.body.dataset.mobileTier = Y.mobileDensityTier),
    P.body.classList.toggle("is-mobile", e),
    P.body.classList.toggle("is-mobile-landscape", t),
    P.body.classList.toggle("is-mobile-portrait", e && !t),
    P.body.style.setProperty("--joystick-size", `${o.stickSize}px`),
    P.body.style.setProperty("--joystick-thumb", `${o.thumbSize}px`),
    P.body.style.setProperty("--action-size", `${o.actionSize}px`),
    P.body.style.setProperty(
      "--controls-clearance",
      `${o.controlsClearance}px`,
    ),
    P.body.style.setProperty("--rail-min-height", `${o.railMinHeight}px`),
    P.body.style.setProperty("--stage-width", `${Math.round(i.width)}px`),
    P.body.style.setProperty("--stage-height", `${Math.round(i.height)}px`),
    P.mobileControls.setAttribute("aria-hidden", String(!e)),
    e ? he(!0) : N(),
    j() || (Y.mobileDockExpanded = !1),
    t && !n && (Y.transcriptExpanded = !1),
    !t && n && (Y.transcriptExpanded = !0),
    syncRendererRuntime(),
    applyUiVisibilityPreset(Y.uiVisibilityPreset),
    ye(),
    ge(),
    ee(),
    M.resize(),
    window.requestAnimationFrame(() => {
      (M.resize(), Re());
    }),
    Re(),
    U("resize", `${window.innerWidth}x${window.innerHeight}`));
}
((window.__LM402_DEBUG__ = {
  snapshot: function () {
    Y.endingSequence && syncEndingSequenceClock();
    const e = We(),
      t = M.getDebugSnapshot();
    return {
      mode: Y.mode,
      phase: Y.phase,
      phaseClock: Number(Y.phaseClock.toFixed(3)),
      clockTime: Number(Y.time.toFixed(3)),
      cameraMode: Y.cameraMode,
      cameraAnchor:
        "intro" === Y.mode
          ? Y.introCameraTrack
          : "eye_contact" === Y.phase
            ? "eye_contact"
            : Y.phase,
      hudMode: Y.hudMode,
      subtitleMode: Y.subtitleMode,
      pointerLockState: Y.pointerLockState,
      lastContextMenu: Y.lastContextMenu,
      boundaryCollisionState: Y.boundaryCollisionState,
      collisionLabel: Y.boundaryCollisionState,
      activeHotspot: Y.activeHotspotId,
      playerX: Y.player.x,
      playerZ: Y.player.z,
      cameraYaw: Y.player.yaw,
      cameraPitch: Y.player.pitch,
      lookSensitivityPreset: Y.lookSensitivityPreset,
      lookSensitivityScalar: Y.lookSensitivityScalar,
      audioEnabled: Y.audioEnabled,
      qualityTier: Y.qualityTier,
      uiVisibilityPreset: Y.uiVisibilityPreset,
      renderErrorCount: Y.renderErrorCount,
      renderErrors: [...Y.renderErrors],
      assetState: t.assetState,
      objectiveCompact: P.objectivePrompt.classList.contains("compact"),
      subtitleLogCount: Y.subtitleLog.length,
      transcriptExpanded: Y.transcriptExpanded,
      mobileDensityTier: Y.mobileDensityTier,
      subtitle: Y.subtitle.text,
      stageViewport: e.stageBounds,
      canvasViewport: e.canvasBounds,
      subtitleBounds: e.subtitleBounds,
      controlBounds: e.controlBounds,
      ambienceBounds: e.ambienceBounds,
      objectiveBounds: e.objectiveBounds,
      webglViewport: t.webglViewport,
      mobileBlackRegionDetected: t.mobileBlackRegionDetected,
      projectedNodes: t.projectedNodes,
      hotspotLOS: t.hotspotLOS,
      currentRoomIds: t.currentRoomIds,
      endingShotPhase: t.endingShotPhase,
      endingSequenceTime: Number((Y.endingSequence?.time ?? 0).toFixed(3)),
      endingSequenceStartedAt: Y.endingSequence?.startedAt ?? null,
      renderer: t,
      events: [...Y.debugEvents],
    };
  },
  reset: Ae,
  replayIntro: () => Te(!0),
  skipIntro: () => {
    "intro" === Y.mode && De();
  },
  setPhase: (e) => we(e),
  setPhaseClock: (e) => {
    Y.phaseClock = Math.max(0, Number(e) || 0);
  },
  applyEffect: (e) => Be(e),
  setLookSensitivity: (e, t = null) => ie({ scalar: e, preset: t }),
  toggleObjective: fe,
  triggerEnding: (e = "perfect") => {
    "intro" === Y.mode && De();
    return "perfect" === e ? qe() : _e(e, { manual: !0 });
  },
  setEndingTime: (e, t = !0) => scrubEndingSequence(e, t),
  showEndingOverlay: () => {
    Y.endingSequence && syncEndingSequenceClock();
    Y.ending || (Y.ending = Y.endingSequence?.type ?? "perfect");
    je();
  },
  resumeEndingClock: () => {
    Y.endingSequence &&
      ((Y.endingSequence.timeOffset = Y.endingSequence.time ?? 0),
      (Y.endingSequence.startedAt = performance.now()),
      (Y.endingSequence.scrubTime = null));
  },
  render: forceSceneRender,
  teleport: (e, t, n, o) => {
    ((Y.player.x = e),
      (Y.player.z = t),
      void 0 !== n && (Y.player.yaw = n),
      void 0 !== o && (Y.player.pitch = o));
  },
}),
  ve(!0),
  xe(),
  window.addEventListener("keydown", (e) => {
    if (
      (X.unlock(),
      (Y.keyboard[e.code] = !0),
      "KeyF" === e.code || "Enter" === e.code)
    )
      return (e.preventDefault(), void Ce());
    if ("KeyR" === e.code) return (e.preventDefault(), void Ie());
    if ("KeyG" === e.code) return (e.preventDefault(), void Te(!0));
    if (Y.dialogue && /^Digit[1-9]$/.test(e.code)) {
      const t = Number(e.code.replace("Digit", "")) - 1,
        n = P.dialogueChoices.querySelectorAll("button")[t];
      return void n?.click();
    }
    if ("Escape" === e.code && Y.dialogue)
      return (e.preventDefault(), void Le());
    "Escape" === e.code &&
      document.pointerLockElement === z &&
      (e.preventDefault(), document.exitPointerLock?.());
  }),
  window.addEventListener("keyup", (e) => {
    Y.keyboard[e.code] = !1;
  }),
  window.addEventListener("blur", () => {
    ((Y.keyboard = Object.create(null)), N());
  }),
  (function () {
    let e = 0;
    (z.addEventListener("click", () => {
      (Ye(), X.unlock(), z.focus({ preventScroll: !0 }));
    }),
      P.stage.addEventListener(
        "mousedown",
        (t) => {
          if (
            !(
              2 !== t.button ||
              Xe(t.target) ||
              (t.preventDefault(),
              t.stopPropagation(),
              z.focus({ preventScroll: !0 }),
              X.unlock(),
              "play" !== Y.mode || Y.dialogue || Y.endingSequence || Y.ending)
            )
          ) {
            const t = Date.now();
            t - e >= 180 &&
              ((e = t),
              (Y.lastContextMenu = t),
              U(
                "contextmenu",
                document.pointerLockElement === z ? "exit" : "enter",
              ),
              Ge());
          }
        },
        !0,
      ),
      P.stage.addEventListener(
        "contextmenu",
        (t) => {
          Xe(t.target) ||
            (t.preventDefault(),
            t.stopPropagation(),
            (document.pointerLockElement !== z &&
              ("play" !== Y.mode ||
                Y.dialogue ||
                Y.endingSequence ||
                Y.ending)) ||
              ((t) => {
                if ((t.preventDefault(), t.stopPropagation(), _())) return;
                const n = Date.now();
                n - e < 180 ||
                  ((e = n),
                  (Y.lastContextMenu = n),
                  U(
                    "contextmenu",
                    document.pointerLockElement === z ? "exit" : "enter",
                  ),
                  X.unlock(),
                  z.focus({ preventScroll: !0 }),
                  Ge());
              })(t));
        },
        !0,
      ),
      P.stage.addEventListener(
        "auxclick",
        (e) => {
          2 !== e.button ||
            Xe(e.target) ||
            (e.preventDefault(), e.stopPropagation());
        },
        !0,
      ),
      z.addEventListener("mousedown", (e) => {
        0 !== e.button ||
          _() ||
          document.pointerLockElement === z ||
          (X.unlock(),
          z.focus({ preventScroll: !0 }),
          (Y.dragLook = { x: e.clientX, y: e.clientY }));
      }),
      z.addEventListener("pointermove", (e) => {
        if (
          !Y.dragLook ||
          document.pointerLockElement === z ||
          Y.dialogue ||
          "play" !== Y.mode ||
          _()
        )
          return;
        const t = e.clientX - Y.dragLook.x,
          n = e.clientY - Y.dragLook.y;
        ((Y.dragLook = { x: e.clientX, y: e.clientY }),
          (Y.player.yaw -= 0.0034 * t * re()),
          (Y.player.pitch = p(Y.player.pitch - 0.0026 * n * re(), v, x)));
      }),
      document.addEventListener("mousemove", (e) => {
        document.pointerLockElement !== z ||
          Y.dialogue ||
          "play" !== Y.mode ||
          ((Y.player.yaw -= 0.00165 * e.movementX * re()),
          (Y.player.pitch = p(
            Y.player.pitch - 0.00152 * e.movementY * re(),
            v,
            x,
          )));
      }),
      window.addEventListener("pointerup", () => {
        Y.dragLook = null;
      }));
    const t = () => {
        ((Y.pointerLockPending = !1), ye());
        U(
          "pointerlock",
          (document.pointerLockElement ||
            document.webkitPointerLockElement ||
            document.mozPointerLockElement) === z
            ? "locked"
            : "free",
        );
      },
      n = () => {
        ((Y.pointerLockPending = !1),
          Ee("瀏覽器沒有成功鎖定視角。"),
          U("pointerlock", "error"),
          ye());
      };
    (document.addEventListener("pointerlockchange", t),
      document.addEventListener("webkitpointerlockchange", t),
      document.addEventListener("mozpointerlockchange", t),
      document.addEventListener("pointerlockerror", n),
      document.addEventListener("webkitpointerlockerror", n),
      document.addEventListener("mozpointerlockerror", n));
  })(),
  he(!0),
  ce(),
  P.hudToggle.addEventListener("click", () => {
    he(!P.hud.classList.contains("collapsed"));
  }),
  P.speedToggle.addEventListener("click", () => {
    ae();
  }),
  P.speedPresets.querySelectorAll("[data-speed-preset]").forEach((e) => {
    e.addEventListener("click", () => {
      ie({ preset: e.dataset.speedPreset, scalar: E[e.dataset.speedPreset] });
    });
  }),
  P.speedRange.addEventListener("input", () => {
    ie({ preset: null, scalar: Number(P.speedRange.value) / 100 });
  }),
  P.audioToggle.addEventListener("click", () => {
    X.setEnabled(!Y.audioEnabled);
  }),
  P.fontToggle.addEventListener("click", ue),
  de(),
  P.musicPromptButton.addEventListener("click", () => {
    X.unlock();
  }),
  P.perfectEndingBtn.addEventListener("click", qe),
  P.perfectEndingSideBtn.addEventListener("click", qe),
  P.objectivePrompt.addEventListener("click", fe),
  P.transcriptToggle?.addEventListener("click", () =>
    (function (e = null) {
      ((Y.transcriptExpanded = e ?? !Y.transcriptExpanded), ee());
    })(),
  ),
  P.introSkipBtn &&
    ((P.introSkipBtn.hidden = "intro" !== Y.mode),
    P.introSkipBtn.addEventListener("click", () => {
      (X.unlock(), (P.introSkipBtn.hidden = !0), De());
    })),
  P.interactBtn.addEventListener("click", Ce),
  P.inspectBtn.addEventListener("click", () => {
    Y.activeHotspot
      ? ((function (e, t = 0.42) {
          const n = $(Y.player, e),
            o = O(Y.player, e);
          ((Y.player.yaw = m(Y.player.yaw, n, t)),
            (Y.player.pitch = m(Y.player.pitch, o, t)));
        })(Y.activeHotspot, 0.56),
        Ee(`視線帶向：${Y.activeHotspot.label}`))
      : Ee("附近還沒有可看的目標。");
  }),
  P.centerBtn.addEventListener("click", Ie),
  P.replayBtn.addEventListener("click", () => Te(!0)),
  P.dialogueClose.addEventListener("click", Le),
  P.dialogueScrim.addEventListener("click", Le),
  P.endingRetry.addEventListener("click", Ae),
  P.endingPerfectBtn.addEventListener("click", qe),
  Ke(P.moveStick, (e, t) => {
    ((Y.input.moveX = e), (Y.input.moveY = -t));
  }),
  Ke(P.lookStick, (e, t) => {
    ((Y.input.lookX = e), (Y.input.lookY = t));
  }),
  document.addEventListener("click", (e) => {
    P.speedWidget.contains(e.target) || ae(!1);
  }),
  oe(),
  Ue(),
  window.addEventListener("resize", Ue),
  window.visualViewport?.addEventListener("resize", Ue),
  "intro" === Y.mode
    ? (te(r[0].kicker, r[0].text, 0.2), ne(r[0].ambience))
    : ((Y.cameraMode = "play"),
      te(
        "女兒",
        "現在時空手錶顯示10:40，現在阿姨在教室裡面，怎麼我會這麼緊張^_^",
        5,
      ),
      ne("粉筆味像一層薄雲，樓梯口那邊有風，十一點的光才剛準備進來。")),
  ge(),
  ee(),
  ke(),
  ye(),
  Pe(),
  X.tryPlay("startup"),
  requestAnimationFrame(function e(t) {
    e.last || (e.last = t);
    const n = Math.min((t - e.last) / 1e3, 0.033);
    ((e.last = t),
      (Y.time += n),
      (P.rotateLock.hidden = !q()),
      P.body.classList.toggle("landscape-prompt", q()),
      "intro" === Y.mode
        ? (function (e) {
            const t = performance.now();
            Y.intro.startedAt ||
              ((Y.intro.startedAt = t),
              (Y.intro.deadlineAt = t + 1e3 * l.introDuration + 1400));
            const n = Math.max(0, (t - Y.intro.startedAt) / 1e3);
            ((Y.intro.time = Math.max(Y.intro.time + e, n)),
              (Y.intro.progress = p(Y.intro.time / l.introDuration, 0, 1)));
            const o = r.findIndex(
                (e) => Y.intro.time >= e.start && Y.intro.time < e.end,
              ),
              i = -1 === o ? r.length - 1 : o;
            (i !== Y.introBeatIndex &&
              ((Y.introBeatIndex = i),
              (Y.introCameraTrack = r[i].id),
              te(r[i].kicker, r[i].text, 0.2),
              ne(r[i].ambience)),
              (Y.intro.progress >= 1 || t >= Y.intro.deadlineAt) && De());
          })(n)
        : (Y.subtitle.ttl > 0 &&
            (Y.subtitle.ttl = Math.max(0, Y.subtitle.ttl - n)),
          (function (e) {
            if ("play" !== Y.mode || Y.dialogue || Y.endingSequence || q()) {
              const t = 1 - Math.min(1, 6.4 * e);
              return (
                (Y.player.velocity.x *= t),
                (Y.player.velocity.z *= t),
                Math.abs(Y.player.velocity.x) < 1e-4 &&
                  (Y.player.velocity.x = 0),
                Math.abs(Y.player.velocity.z) < 1e-4 &&
                  (Y.player.velocity.z = 0),
                (Y.subtitleMode =
                  Y.subtitle.ttl > 0.12 ? "full" : q() ? "hidden" : "compact"),
                void ge()
              );
            }
            const t =
                (Y.keyboard.KeyD || Y.keyboard.ArrowRight ? 1 : 0) -
                (Y.keyboard.KeyA || Y.keyboard.ArrowLeft ? 1 : 0),
              n =
                (Y.keyboard.KeyW || Y.keyboard.ArrowUp ? 1 : 0) -
                (Y.keyboard.KeyS || Y.keyboard.ArrowDown ? 1 : 0),
              o = (Y.keyboard.KeyE ? 1 : 0) - (Y.keyboard.KeyQ ? 1 : 0),
              i = (Y.keyboard.PageUp ? 1 : 0) - (Y.keyboard.PageDown ? 1 : 0),
              a = p(Y.input.moveX + t, -1, 1),
              r = p(Y.input.moveY + n, -1, 1),
              c = p(Y.input.lookX + 0.85 * o, -1, 1),
              l = p(Y.input.lookY + 0.85 * i, -1, 1);
            ((Y.player.lookInput.x = c), (Y.player.lookInput.y = l));
            const s = (_() ? 1.68 : 1.9) * re();
            (Math.exp(-14 * e),
              (Y.player.yaw -= c * e * s),
              (Y.player.pitch = p(Y.player.pitch - l * e * 1.34 * re(), v, x)));
            const d = -Math.sin(Y.player.yaw),
              u = -Math.cos(Y.player.yaw),
              y = Math.cos(Y.player.yaw),
              h = -Math.sin(Y.player.yaw),
              k = "eye_contact" === Y.phase ? g(168) : g(264),
              b = (d * r + y * a) * k,
              E = (u * r + h * a) * k,
              L = Math.min(1, Math.hypot(a, r)) > 0.05,
              S = L ? 1 - Math.exp(-5.8 * e) : 0,
              w = L ? 0 : 1 - Math.exp(-4.2 * e),
              B = L ? S : w;
            if (L)
              ((Y.player.velocity.x = m(Y.player.velocity.x, b, B)),
                (Y.player.velocity.z = m(Y.player.velocity.z, E, B)));
            else {
              const t = 1 - Math.min(1, 4.2 * e);
              ((Y.player.velocity.x *= t),
                (Y.player.velocity.z *= t),
                Math.abs(Y.player.velocity.x) < 2e-4 &&
                  (Y.player.velocity.x = 0),
                Math.abs(Y.player.velocity.z) < 2e-4 &&
                  (Y.player.velocity.z = 0));
            }
            const z = {
                x: Y.player.x + Y.player.velocity.x * e,
                z: Y.player.z + Y.player.velocity.z * e,
              },
              P = M.resolveMotion({ x: Y.player.x, z: Y.player.z }, z, f);
            (P.collided &&
              ((Y.player.velocity.x *= 0.3), (Y.player.velocity.z *= 0.3)),
              (Y.player.x = P.x),
              (Y.player.z = P.z),
              (Y.boundaryCollisionState = P.collided ? P.label : null));
            if (M.getStairY) {
              Y.player.stairY = M.getStairY(Y.player.x, Y.player.z);
            }
            const _sFL = g(196),
              _sFE = g(72),
              _sBL = g(3196),
              _sBE = g(3328),
              Q_ = g(-860) + 0.3,
              ee_ = g(-210) - 0.3;
            if (
              Y.player.z <= _sFE + 0.35 &&
              Y.player.x > Q_ &&
              Y.player.x < ee_
            ) {
              Y.player.z = _sFL;
              Y.player.stairY = 0;
              _stairLoop();
            } else if (
              Y.player.z >= _sBE - 0.35 &&
              Y.player.x > Q_ &&
              Y.player.x < ee_
            ) {
              Y.player.z = _sBL;
              Y.player.stairY = 0;
              _stairLoop();
            }
            const C = Math.hypot(Y.player.velocity.x, Y.player.velocity.z),
              I = C > g(26);
            (Math.abs(c) > 0.18 ||
              Math.abs(l) > 0.18 ||
              Boolean(Y.dragLook) ||
              document.pointerLockElement,
              Y.subtitle.ttl > 0.12
                ? (Y.subtitleMode = "full")
                : j()
                  ? (Y.subtitleMode = "hidden")
                  : (Y.subtitleMode = "compact"),
              ge());
            const T = I ? Math.max(0.28, 0.52 - 0.6 * C) : 0.42;
            I &&
              Y.time - Y.sound.playerStepAt > T &&
              ((Y.sound.playerStepAt = Y.time), X.playCue("step"));
          })(n),
          $e(),
          Y.ending || Oe(n),
          (function (e) {
            if (!Y.endingSequence) return;
            if (!Number.isFinite(syncEndingSequenceClock())) return void je();
            if ("perfect" === Y.ending)
              return (
                !Y.flags.perfectLine1Played &&
                  Y.endingSequence.time >= (l.perfectLine1At ?? 1) &&
                  ((Y.flags.perfectLine1Played = !0),
                  te("學長", "也太像徐若瑄了吧！", 5)),
                !Y.flags.perfectLine2Played &&
                  Y.endingSequence.time >= (l.perfectLine2At ?? 6) &&
                  ((Y.flags.perfectLine2Played = !0),
                  te("把拔（心底的聲音）", "這一次，依然再次遇見妳。", 5)),
                void (
                  Y.endingSequence.time >
                    (l.perfectOverlayAt ?? l.perfectDuration) &&
                  P.endingOverlay.hidden &&
                  je()
                )
              );
            const t =
              "missed" === Y.ending
                ? { x: g(-368), y: 1.34, z: g(756), pitch: -0.04 }
                : { x: S.eyeLook.x, y: 1.38, z: S.eyeLook.z, pitch: -0.06 };
            ((Y.player.yaw = m(Y.player.yaw, $(Y.player, t), 0.04)),
              (Y.player.pitch = m(Y.player.pitch, t.pitch, 0.05)),
              Y.endingSequence.time > l.duration &&
                P.endingOverlay.hidden &&
                je());
          })(n),
          (function () {
            if ("play" !== Y.mode || Y.dialogue || Y.ending)
              return (
                (Y.activeHotspot = null),
                (Y.activeHotspotId = null),
                P.focusPrompt.classList.remove("show"),
                void Pe()
              );
            const e = Me(),
              t = M.pickHotspot(e, Y.player, Y.activeHotspotId);
            ((Y.activeHotspotId = t?.id ?? null),
              (Y.activeHotspot = t ? e.find((e) => e.id === t.id) : null),
              Y.activeHotspot
                ? ((P.focusPrompt.textContent = `${Y.activeHotspot.prompt} · F / 點一下互動`),
                  P.focusPrompt.classList.add("show"))
                : P.focusPrompt.classList.remove("show"),
              Pe());
          })()),
      Ne(n),
      X.update(n),
      (function () {
        if ("intro" === Y.mode) return;
        const e =
            ("front_call" === Y.phase && Y.phaseClock < 7.6) ||
            ("rear_wait" === Y.phase && Y.phaseClock < 11.6) ||
            ("eye_contact" === Y.phase && Y.phaseClock < 5.6) ||
            ("perfect" === Y.endingSequence?.type &&
              Y.endingSequence.time < 16.4),
          t =
            ("rear_wait" === Y.phase &&
              Y.phaseClock > 1 &&
              Y.phaseClock < 9.6) ||
            ("perfect" === Y.endingSequence?.type &&
              Y.endingSequence.time > 0.6 &&
              Y.endingSequence.time < 10.8);
        (e &&
          Y.time - Y.sound.seniorStepAt > 0.48 &&
          ((Y.sound.seniorStepAt = Y.time), X.playCue("step")),
          t &&
            Y.time - Y.sound.juniorStepAt > 0.56 &&
            ((Y.sound.juniorStepAt = Y.time), X.playCue("step")));
      })(),
      Ve(),
      requestAnimationFrame(e));
  }));
try {
  window._dbg = {
    get p() {
      return Y.player;
    },
    set px(v) {
      Y.player.x = v;
    },
    set pz(v) {
      Y.player.z = v;
    },
    set pa(v) {
      Y.player.yaw = v;
    },
    get M() {
      return M;
    },
  };
  initPanelSystem();
} catch (ex) {}
try {
  updateEndingTracker();
} catch (ex) {}
