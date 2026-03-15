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
  CAMERA_PRESETS,
} from "./data.js";
import { createLm402Renderer } from "./renderer.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const canvas = document.getElementById("scene-canvas");
const renderer = createLm402Renderer(canvas);

const dom = {
  body: document.body,
  rotateLock: document.getElementById("rotate-lock"),
  hud: document.getElementById("hud"),
  hudToggle: document.getElementById("hud-toggle"),
  pointerPill: document.getElementById("pointer-pill"),
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
};

const state = {
  mode: localStorage.getItem(STORAGE_KEYS.introSeen) ? "play" : "intro",
  intro: {
    progress: 0,
    time: 0,
    replay: false,
  },
  phase: "front_call",
  ending: null,
  endingSequence: null,
  player: {
    x: -500,
    y: 150,
    z: 120,
    yaw: -0.7,
    pitch: 0.02,
    velocityX: 0,
    velocityZ: 0,
  },
  pointerLockMode: "free",
  input: {
    moveX: 0,
    moveY: 0,
    lookX: 0,
    lookY: 0,
  },
  keyboard: Object.create(null),
  dragLook: null,
  activeHotspot: null,
  dialogue: null,
  subtitle: {
    source: "女兒",
    text: "我可以飛翔，只要沿著那條紅線往前，LM402 就會在光裡慢慢長出來。",
    ttl: 3.6,
  },
  ambience: {
    text: "粉筆味像一層薄雲，十一點的光正慢慢沿著百葉窗往教室裡推。",
  },
  memories: new Set(),
  flags: {
    frontCallHeard: false,
    backdoorAnchored: false,
    juniorPrepared: false,
  },
  characters: {
    senior: {
      position: { x: -402, y: 0, z: 224 },
    },
    junior: {
      position: { x: 216, y: 0, z: 1038 },
    },
    fatherEcho: {
      position: { x: -348, y: 0, z: 1250 },
      alpha: 0,
    },
    auntEcho: {
      position: { x: -178, y: 0, z: 1258 },
      alpha: 0,
    },
  },
  sceneClock: 0,
  phaseClock: 0,
  mobileReady: false,
  introSeenNow: Boolean(localStorage.getItem(STORAGE_KEYS.introSeen)),
  cinematicGlow: 0,
  mobileDockExpanded: false,
  mobileDensityTier: "regular",
  introBeatIndex: 0,
  introCameraTrack: "daughter_glow",
};

function isMobileLayout() {
  return window.matchMedia("(max-width: 960px)").matches || window.matchMedia("(pointer: coarse)").matches;
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

function condensedCopy(text, length = 28) {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function setSubtitle(source, text, ttl = 3.6) {
  state.subtitle = { source, text, ttl };
  dom.subtitleSource.textContent = source;
  dom.subtitleText.textContent = text;
}

function setAmbience(text) {
  state.ambience.text = text;
  dom.ambienceText.textContent = text;
  dom.ambienceChipCopy.textContent = state.mobileDockExpanded ? "點一下收起" : condensedCopy(text);
}

function updatePointerHint() {
  if (isMobileLayout()) {
    dom.pointerPill.hidden = true;
    canvas.classList.remove("pointer-locked");
    return;
  }
  const locked = document.pointerLockElement === canvas;
  state.pointerLockMode = locked ? "locked" : "free";
  dom.pointerPill.hidden = false;
  dom.pointerPill.textContent = locked ? "視角已鎖定 · 右鍵或 Esc 退出" : "右鍵進入視角鎖定";
  dom.pointerPill.classList.toggle("locked", locked);
  canvas.classList.toggle("pointer-locked", locked);
}

function syncDockState() {
  const mobileLandscape = isMobileLandscape();
  const expanded = !mobileLandscape || state.mobileDockExpanded;
  dom.bottomDock.classList.toggle("ambience-expanded", expanded);
  dom.bottomDock.classList.toggle("mobile-landscape", mobileLandscape);
  dom.ambienceChip.hidden = !mobileLandscape;
  dom.ambienceBox.hidden = !expanded;
  dom.ambienceChip.setAttribute("aria-expanded", String(expanded));
  dom.ambienceChipCopy.textContent = expanded ? "點一下收起" : condensedCopy(state.ambience.text);
}

function updateObjective() {
  const phase = PHASES.find((item) => item.id === state.phase);
  dom.objectiveKicker.textContent = state.phase === "eye_contact" ? "最後一幕" : "目前任務";
  dom.objectiveTitle.textContent = phase.title;
  let copy = phase.copy;
  if (state.phase === "front_call") {
    copy = "先靠近 LM402 前門外的走廊，把電話真正聽見。";
  } else if (state.phase === "rear_wait") {
    copy = "進教室、收起筆記，走到後門旁，把那一點空白先留下來。";
  } else if (state.phase === "eye_contact") {
    copy = "留在後門視線點，別多跨一步，也別錯過那一道光。";
  }
  dom.objectiveCopy.textContent = copy;
  dom.panelObjective.textContent = copy;

  dom.phaseStrip.innerHTML = "";
  PHASES.forEach((item) => {
    const row = document.createElement("div");
    row.className = "phase-row";
    if (item.id === state.phase) {
      row.classList.add("active");
    }
    if (PHASES.findIndex((phaseItem) => phaseItem.id === item.id) < PHASES.findIndex((phaseItem) => phaseItem.id === state.phase)) {
      row.classList.add("done");
    }
    row.innerHTML = `<div class="phase-index">${item.index}</div><div class="phase-copy"><strong>${item.title}</strong><span>${item.copy}</span></div>`;
    dom.phaseStrip.appendChild(row);
  });
}

function updateMemoryList() {
  dom.memoryList.innerHTML = "";
  if (!state.memories.size) {
    const empty = document.createElement("div");
    empty.className = "memory-item";
    empty.innerHTML = `<div class="memory-kicker">還沒收進來</div><div class="memory-title">先去看門牌、黑板、靠窗座位或後門。</div>`;
    dom.memoryList.appendChild(empty);
    return;
  }
  [...state.memories].forEach((id) => {
    const memory = MEMORY_FRAGMENTS[id];
    const item = document.createElement("div");
    item.className = "memory-item";
    item.innerHTML = `<div class="memory-kicker">${memory.kicker}</div><div class="memory-title">${memory.title}</div><div class="memory-copy">${memory.copy[0]}</div>`;
    dom.memoryList.appendChild(item);
  });
}

function revealHint(text) {
  dom.hintPill.textContent = text;
  dom.hintPill.classList.add("show");
  clearTimeout(revealHint.timer);
  revealHint.timer = setTimeout(() => dom.hintPill.classList.remove("show"), 2600);
}

function attemptOrientationLock() {
  if (screen.orientation?.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }
}

function toggleHud(force) {
  const collapsed = force ?? !dom.hud.classList.contains("collapsed");
  dom.hud.classList.toggle("collapsed", collapsed);
  dom.hudToggle.setAttribute("aria-expanded", String(!collapsed));
  dom.hudToggle.querySelector(".hud-toggle-label").textContent = collapsed ? "展開任務" : "縮起資訊";
  dom.hudToggle.querySelector(".hud-toggle-icon").textContent = collapsed ? "+" : "−";
}

function openDialogue(definition) {
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock?.();
  }
  state.dialogue = definition;
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
}

function closeDialogue() {
  state.dialogue = null;
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
  }
}

function applyEffect(effect) {
  if (effect === "close_only") {
    closeDialogue();
    return;
  }
  if (effect === "collect_plaque") {
    collectMemory("plaque");
    setSubtitle("女兒", "門牌：LM402。粉筆味像一層薄雲。", 3.8);
    closeDialogue();
    return;
  }
  if (effect === "advance_front_call") {
    state.flags.frontCallHeard = true;
    state.phase = "rear_wait";
    state.phaseClock = 0;
    setSubtitle("學妹", "「你走到後門。」", 3.4);
    setAmbience("鐘聲剛落，前門那邊傳來探頭的動靜，風把教室裡的紙邊輕輕掀起。");
    updateObjective();
    closeDialogue();
    return;
  }
  if (effect === "memory_plaque") {
    collectMemory("plaque");
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
    setSubtitle("學妹", "「好，那妳等我。」", 3.4);
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
    state.phase = "eye_contact";
    state.phaseClock = 0;
    setSubtitle("女兒", "我停在後門旁，剛好能看到走廊的一小段。", 4.4);
    setAmbience("光從另一頭灑過來，把地板照得有點過分地亮。所有版本的呼吸都慢慢安靜下來。");
    updateObjective();
    closeDialogue();
    return;
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
    let x = hotspot.x;
    let z = hotspot.z;
    if (hotspot.id === "junior") {
      x = state.characters.junior.position.x;
      z = state.characters.junior.position.z;
    }
    return {
      ...hotspot,
      x,
      z,
      visible: hotspotVisible(hotspot),
      active: state.activeHotspot?.id === hotspot.id,
    };
  });
}

function distanceSquared(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

function angleToTarget(target) {
  const dx = target.x - state.player.x;
  const dz = target.z - state.player.z;
  return -Math.atan2(dx, dz);
}

function angularDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff);
}

function updateActiveHotspot() {
  const hotspots = buildHotspotState();
  let best = null;
  hotspots.forEach((hotspot) => {
    if (!hotspot.visible) return;
    const dist2 = distanceSquared(state.player.x, state.player.z, hotspot.x, hotspot.z);
    if (dist2 > hotspot.radius * hotspot.radius) return;
    const facing = angularDifference(state.player.yaw, angleToTarget(hotspot));
    if (facing > 1.18) return;
    if (!best || dist2 < best.dist2) {
      best = { ...hotspot, dist2 };
    }
  });
  state.activeHotspot = best;
  if (best) {
    dom.focusPrompt.textContent = `${best.prompt} · F / 點擊互動`;
    dom.focusPrompt.classList.add("show");
  } else {
    dom.focusPrompt.classList.remove("show");
  }
}

function openActiveInteraction() {
  if (state.mode !== "play" || state.dialogue || state.ending) {
    return;
  }
  const hotspot = state.activeHotspot;
  if (!hotspot) {
    revealHint("先靠近前門、學妹、黑板、座位或後門。");
    return;
  }
  const interaction = getInteractionById(hotspot.id);
  if (!interaction) {
    return;
  }
  openDialogue(interaction);
}

function resetView() {
  let targetYaw = 0;
  if (state.phase === "front_call") {
    targetYaw = angleToTarget({ x: -402, z: 224 });
  } else if (state.phase === "rear_wait") {
    targetYaw = angleToTarget(WORLD.focusMark);
  } else {
    targetYaw = angleToTarget({ x: -300, z: 1256 });
  }
  state.player.yaw = targetYaw;
  state.player.pitch = 0.02;
}

function startIntro(replay = false) {
  state.mode = "intro";
  state.intro.progress = 0;
  state.intro.time = 0;
  state.intro.replay = replay;
  state.introBeatIndex = 0;
  state.introCameraTrack = INTRO_BEATS[0].id;
  state.cinematicGlow = 0;
  state.ending = null;
  state.endingSequence = null;
  dom.endingOverlay.hidden = true;
  dom.body.classList.remove("ending-open");
  closeDialogue();
  setSubtitle(INTRO_BEATS[0].kicker, INTRO_BEATS[0].text, 0.2);
  setAmbience(INTRO_BEATS[0].ambience);
  syncDockState();
}

function finishIntro() {
  state.mode = "play";
  state.introSeenNow = true;
  localStorage.setItem(STORAGE_KEYS.introSeen, "1");
  setSubtitle("女兒", "前門來電，要先從那句「妳在哪裡？」開始。", 3.8);
  setAmbience("十一點的風正從樓梯口往後門吹，光在右手邊的窗上慢慢發亮。");
  syncDockState();
}

function startEnding(type) {
  state.ending = type;
  state.endingSequence = { type, time: 0 };
  const ending = ENDINGS[type];
  setSubtitle("女兒", type === "missed" ? "紅線先回彈了。" : "他出現在光裡。", 4.4);
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
  state.mode = "play";
  state.phase = "front_call";
  state.phaseClock = 0;
  state.sceneClock = 0;
  state.ending = null;
  state.endingSequence = null;
  state.dialogue = null;
  state.flags.frontCallHeard = false;
  state.flags.backdoorAnchored = false;
  state.flags.juniorPrepared = false;
  state.player.x = -500;
  state.player.z = 120;
  state.player.yaw = -0.7;
  state.player.pitch = 0.02;
  state.player.velocityX = 0;
  state.player.velocityZ = 0;
  state.characters.senior.position = { x: -402, y: 0, z: 224 };
  state.characters.junior.position = { x: 216, y: 0, z: 1038 };
  state.characters.fatherEcho.alpha = 0;
  state.characters.auntEcho.alpha = 0;
  state.cinematicGlow = 0;
  state.mobileDockExpanded = false;
  state.introBeatIndex = 0;
  state.introCameraTrack = INTRO_BEATS[0].id;
  dom.endingOverlay.hidden = true;
  dom.body.classList.remove("ending-open");
  dom.dialogueSheet.hidden = true;
  dom.body.classList.remove("dialogue-open");
  updateObjective();
  updateMemoryList();
  setSubtitle("女兒", "先讓前門那句電話響起來。", 3.6);
  setAmbience("粉筆味像一層薄雲，樓梯口那邊有風，十一點的光才剛準備進來。");
  syncDockState();
  updatePointerHint();
}

function collidesWithDivider(nx, nz) {
  const crossed = (state.player.x < WORLD.dividerX && nx >= WORLD.dividerX) || (state.player.x > WORLD.dividerX && nx <= WORLD.dividerX);
  if (!crossed) {
    return false;
  }
  const inFrontDoor = nz >= WORLD.frontDoor.z1 && nz <= WORLD.frontDoor.z2;
  const inBackDoor = nz >= WORLD.backDoor.z1 && nz <= WORLD.backDoor.z2;
  return !(inFrontDoor || inBackDoor);
}

function updateMovement(dt) {
  if (state.mode !== "play" || state.dialogue || state.ending) {
    state.player.velocityX *= 0.84;
    state.player.velocityZ *= 0.84;
    return;
  }
  if (wantsLandscape()) {
    state.player.velocityX *= 0.78;
    state.player.velocityZ *= 0.78;
    return;
  }
  const keyMoveX = (state.keyboard.KeyD || state.keyboard.ArrowRight ? 1 : 0) - (state.keyboard.KeyA || state.keyboard.ArrowLeft ? 1 : 0);
  const keyMoveY = (state.keyboard.KeyW || state.keyboard.ArrowUp ? 1 : 0) - (state.keyboard.KeyS || state.keyboard.ArrowDown ? 1 : 0);
  const moveX = clamp(state.input.moveX + keyMoveX, -1, 1);
  const moveY = clamp(state.input.moveY + keyMoveY, -1, 1);
  const lookX = state.input.lookX + ((state.keyboard.KeyE ? 1 : 0) - (state.keyboard.KeyQ ? 1 : 0)) * 0.8;
  const lookY = state.input.lookY + ((state.keyboard.PageUp ? 1 : 0) - (state.keyboard.PageDown ? 1 : 0)) * 0.8;

  state.player.yaw += lookX * dt * 2.1;
  state.player.pitch = clamp(state.player.pitch - lookY * dt * 1.55, -0.68, 0.54);

  const speed = state.phase === "eye_contact" ? 160 : 224;
  const forwardX = Math.sin(state.player.yaw);
  const forwardZ = Math.cos(state.player.yaw);
  const strafeX = Math.cos(state.player.yaw);
  const strafeZ = -Math.sin(state.player.yaw);
  const targetVX = (forwardX * moveY + strafeX * moveX) * speed;
  const targetVZ = (forwardZ * moveY + strafeZ * moveX) * speed;

  state.player.velocityX = lerp(state.player.velocityX, targetVX, 0.16);
  state.player.velocityZ = lerp(state.player.velocityZ, targetVZ, 0.16);

  const nx = state.player.x + state.player.velocityX * dt;
  const nz = state.player.z + state.player.velocityZ * dt;
  const boundedX = clamp(nx, WORLD.minX + 18, WORLD.maxX - 18);
  const boundedZ = clamp(nz, WORLD.minZ + 18, WORLD.maxZ - 18);

  if (!collidesWithDivider(boundedX, boundedZ)) {
    state.player.x = boundedX;
    state.player.z = boundedZ;
  } else if (!collidesWithDivider(boundedX, state.player.z)) {
    state.player.x = boundedX;
  } else if (!collidesWithDivider(state.player.x, boundedZ)) {
    state.player.z = boundedZ;
  }
}

function updateCharacters(dt) {
  if (state.phase === "front_call") {
    state.characters.senior.position = { x: -402, y: 0, z: 224 };
    state.characters.junior.position = { x: 216, y: 0, z: 1038 };
  } else if (state.phase === "rear_wait") {
    const walk = smoothstep(0, 4.2, state.phaseClock);
    state.characters.senior.position = {
      x: -402,
      y: 0,
      z: lerp(248, 1010, walk * 0.5),
    };
    state.characters.junior.position = {
      x: lerp(216, 138, smoothstep(0.9, 3.8, state.phaseClock)),
      y: 0,
      z: lerp(1038, 1146, smoothstep(0.9, 3.8, state.phaseClock)),
    };
  } else if (state.phase === "eye_contact") {
    const seniorT = smoothstep(0.6, 3.3, state.phaseClock);
    const juniorT = smoothstep(0.1, 2.8, state.phaseClock);
    state.characters.senior.position = {
      x: -390,
      y: 0,
      z: lerp(1040, 1258, seniorT),
    };
    state.characters.junior.position = {
      x: lerp(138, -164, juniorT),
      y: 0,
      z: lerp(1146, 1258, juniorT),
    };
    const echoAlpha = smoothstep(1.9, 3.1, state.phaseClock) * (1 - smoothstep(4.1, 5.0, state.phaseClock));
    state.characters.fatherEcho.alpha = echoAlpha * 0.6;
    state.characters.auntEcho.alpha = echoAlpha * 0.74;
  }

  if (state.endingSequence) {
    const fade = 1 - smoothstep(CINEMATIC_TIMELINE.duration - 0.8, CINEMATIC_TIMELINE.duration, state.endingSequence.time);
    state.characters.fatherEcho.alpha *= fade;
    state.characters.auntEcho.alpha *= fade;
  }
}

function updatePhaseLogic(dt) {
  state.phaseClock += dt;
  state.sceneClock += dt;

  if (state.phase === "rear_wait" && state.phaseClock > 1.2 && !state.flags.juniorPrepared) {
    setSubtitle("39 歲的聲音", "難的是『站好』。等一下他真的往這裡走的時候，妳全身都會想往前衝。", 4.6);
    state.flags.juniorPrepared = true;
  }

  if (state.phase === "eye_contact") {
    const targetYaw = angleToTarget({ x: -300, z: 1258 });
    const targetPitch = 0.01;
    const aligned =
      angularDifference(state.player.yaw, targetYaw) < 0.28 &&
      Math.abs(state.player.pitch - targetPitch) < 0.22 &&
      distanceSquared(state.player.x, state.player.z, WORLD.focusMark.x, WORLD.focusMark.z) < 120 * 120;
    state.cinematicGlow = smoothstep(CINEMATIC_TIMELINE.successWindow[0], CINEMATIC_TIMELINE.successWindow[1], state.phaseClock);

    if (state.phaseClock >= CINEMATIC_TIMELINE.lockWindow && !state.endingSequence) {
      if (aligned) {
        startEnding(state.memories.size >= 4 ? "memory" : "canon");
      } else {
        startEnding("missed");
      }
    }
  }
}

function updateEndingSequence(dt) {
  if (!state.endingSequence) {
    return;
  }
  state.endingSequence.time += dt;
  const t = state.endingSequence.time;
  const target = state.ending === "missed" ? { x: -340, z: 1238, pitch: 0.04 } : { x: -300, z: 1258, pitch: 0.02 };
  state.player.yaw = lerp(state.player.yaw, angleToTarget(target), 0.05);
  state.player.pitch = lerp(state.player.pitch, target.pitch, 0.06);
  if (t > CINEMATIC_TIMELINE.duration && dom.endingOverlay.hidden) {
    finishEndingSequence();
  }
}

function updateIntro(dt) {
  state.intro.time += dt;
  state.intro.progress = clamp(state.intro.time / CINEMATIC_TIMELINE.introDuration, 0, 1);
  const beatIndex = INTRO_BEATS.findIndex(
    (beat) => state.intro.time >= beat.start && state.intro.time < beat.end
  );
  const nextBeatIndex = beatIndex === -1 ? INTRO_BEATS.length - 1 : beatIndex;
  if (nextBeatIndex !== state.introBeatIndex) {
    state.introBeatIndex = nextBeatIndex;
    state.introCameraTrack = INTRO_BEATS[nextBeatIndex].id;
    setSubtitle(INTRO_BEATS[nextBeatIndex].kicker, INTRO_BEATS[nextBeatIndex].text, 0.2);
    setAmbience(INTRO_BEATS[nextBeatIndex].ambience);
  }
  if (state.intro.progress >= 1) {
    finishIntro();
  }
}

function buildCamera() {
  const mobileLandscape = isMobileLandscape();
  const preset = mobileLandscape ? CAMERA_PRESETS.mobile : CAMERA_PRESETS.desktop;
  const base = {
    x: state.player.x,
    y: preset.baseHeight,
    z: state.player.z,
    yaw: state.player.yaw,
    pitch: state.player.pitch,
  };
  if (state.mode === "intro") {
    const p = state.intro.progress;
    return {
      x: lerp(CAMERA_PRESETS.intro.start.x, CAMERA_PRESETS.intro.end.x, smoothstep(0.12, 0.92, p)),
      y: lerp(CAMERA_PRESETS.intro.start.y, CAMERA_PRESETS.intro.end.y, smoothstep(0.08, 0.94, p)),
      z: lerp(CAMERA_PRESETS.intro.start.z, CAMERA_PRESETS.intro.end.z, smoothstep(0.18, 0.92, p)),
      yaw: lerp(CAMERA_PRESETS.intro.start.yaw, CAMERA_PRESETS.intro.end.yaw, smoothstep(0.1, 0.9, p)),
      pitch: lerp(CAMERA_PRESETS.intro.start.pitch, CAMERA_PRESETS.intro.end.pitch, smoothstep(0.12, 0.92, p)),
    };
  }
  if (state.phase === "front_call" && !state.flags.frontCallHeard) {
    base.pitch = preset.frontCallPitch;
  }
  if (state.endingSequence && state.ending !== "missed") {
    return {
      x: lerp(base.x, -270, 0.06),
      y: lerp(base.y, 152, 0.06),
      z: lerp(base.z, 1186, 0.06),
      yaw: lerp(base.yaw, 0.95, 0.08),
      pitch: lerp(base.pitch, 0.04, 0.08),
    };
  }
  return base;
}

function render() {
  const scene = {
    mode: state.mode,
    phase: state.phase,
    intro: state.intro,
    introBeatIndex: state.introBeatIndex,
    introCameraTrack: state.introCameraTrack,
    camera: buildCamera(),
    characters: state.characters,
    hotspots: buildHotspotState(),
    cinematicGlow: state.cinematicGlow,
    layout: {
      mobile: isMobileLayout(),
      mobileLandscape: isMobileLandscape(),
      density: state.mobileDensityTier,
      focalScale: (isMobileLandscape() ? CAMERA_PRESETS.mobile : CAMERA_PRESETS.desktop).focalScale,
      pointerLocked: state.pointerLockMode === "locked",
    },
  };
  renderer.render(scene);
}

function tick(now) {
  if (!tick.last) {
    tick.last = now;
  }
  const dt = Math.min((now - tick.last) / 1000, 0.033);
  tick.last = now;

  dom.rotateLock.hidden = !wantsLandscape();
  dom.body.classList.toggle("landscape-prompt", wantsLandscape());

  if (state.mode === "intro") {
    updateIntro(dt);
  } else {
    if (state.subtitle.ttl > 0) {
      state.subtitle.ttl = Math.max(0, state.subtitle.ttl - dt);
    }
    updateMovement(dt);
    updateCharacters(dt);
    if (!state.endingSequence) {
      updatePhaseLogic(dt);
    }
    updateEndingSequence(dt);
    updateActiveHotspot();
  }

  render();
  requestAnimationFrame(tick);
}

function bindKeyboard() {
  window.addEventListener("keydown", (event) => {
    state.keyboard[event.code] = true;
    if (event.code === "KeyF" || event.code === "Enter") {
      event.preventDefault();
      openActiveInteraction();
    } else if (event.code === "KeyR") {
      event.preventDefault();
      resetView();
    } else if (event.code === "KeyG") {
      event.preventDefault();
      startIntro(true);
    } else if (state.dialogue && /^Digit[1-9]$/.test(event.code)) {
      const index = Number(event.code.replace("Digit", "")) - 1;
      const button = dom.dialogueChoices.querySelectorAll("button")[index];
      button?.click();
    } else if (event.code === "Escape" && state.dialogue) {
      closeDialogue();
    } else if (event.code === "Escape" && document.pointerLockElement === canvas) {
      document.exitPointerLock?.();
    }
  });
  window.addEventListener("keyup", (event) => {
    state.keyboard[event.code] = false;
  });
}

function bindPointerLook() {
  canvas.addEventListener("click", () => {
    attemptOrientationLock();
    canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  canvas.addEventListener("mousedown", (event) => {
    if (event.button === 2 && !isMobileLayout()) {
      event.preventDefault();
      canvas.focus({ preventScroll: true });
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock?.();
      } else if (!state.dialogue && !state.ending && state.mode === "play") {
        canvas.requestPointerLock?.();
      }
      return;
    }
    if (event.button !== 0 || event.pointerType === "touch") {
      return;
    }
    state.dragLook = { x: event.clientX, y: event.clientY };
  });
  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== canvas || state.dialogue || state.mode !== "play") {
      return;
    }
    state.player.yaw += event.movementX * 0.00195;
    state.player.pitch = clamp(state.player.pitch - event.movementY * 0.00178, -0.74, 0.62);
  });
  document.addEventListener("pointerlockchange", updatePointerHint);
  document.addEventListener("pointerlockerror", () => revealHint("瀏覽器沒有成功鎖定視角。"));
  canvas.addEventListener("pointermove", (event) => {
    if (!state.dragLook || document.pointerLockElement === canvas || state.dialogue || state.mode !== "play") {
      return;
    }
    const dx = event.clientX - state.dragLook.x;
    const dy = event.clientY - state.dragLook.y;
    state.dragLook = { x: event.clientX, y: event.clientY };
    state.player.yaw += dx * 0.0036;
    state.player.pitch = clamp(state.player.pitch - dy * 0.0028, -0.74, 0.62);
  });
  window.addEventListener("pointerup", () => {
    state.dragLook = null;
  });
}

function bindJoystick(root, assign) {
  const thumb = root.querySelector(".joystick-thumb");
  const pointerState = { id: null };

  const setVector = (clientX, clientY) => {
    const rect = root.getBoundingClientRect();
    const radius = Math.max(30, rect.width * 0.28);
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
  toggleHud(true);
  dom.hudToggle.addEventListener("click", () => toggleHud());
  dom.ambienceChip.addEventListener("click", () => {
    state.mobileDockExpanded = !state.mobileDockExpanded;
    syncDockState();
  });
  dom.interactBtn.addEventListener("click", openActiveInteraction);
  dom.inspectBtn.addEventListener("click", () => {
    if (state.activeHotspot) {
      const targetYaw = angleToTarget(state.activeHotspot);
      state.player.yaw = lerp(state.player.yaw, targetYaw, 0.5);
      revealHint(`視線帶向：${state.activeHotspot.label}`);
    } else {
      revealHint("附近還沒有可看的目標。");
    }
  });
  dom.centerBtn.addEventListener("click", resetView);
  dom.replayBtn.addEventListener("click", () => startIntro(true));
  dom.dialogueClose.addEventListener("click", closeDialogue);
  dom.dialogueScrim.addEventListener("click", closeDialogue);
  dom.endingRetry.addEventListener("click", () => {
    resetScene();
  });
  bindJoystick(dom.moveStick, (x, y) => {
    state.input.moveX = x;
    state.input.moveY = -y;
  });
  bindJoystick(dom.lookStick, (x, y) => {
    state.input.lookX = x;
    state.input.lookY = y;
  });
}

function handleResize() {
  state.mobileDensityTier = currentDensityTier();
  const preset = MOBILE_DENSITY_PRESETS[state.mobileDensityTier];
  dom.body.dataset.mobileTier = state.mobileDensityTier;
  dom.body.classList.toggle("is-mobile", isMobileLayout());
  dom.body.classList.toggle("is-mobile-landscape", isMobileLandscape());
  dom.body.classList.toggle("is-mobile-portrait", isMobileLayout() && !isMobileLandscape());
  dom.body.style.setProperty("--joystick-size", `${preset.stickSize}px`);
  dom.body.style.setProperty("--joystick-thumb", `${preset.thumbSize}px`);
  dom.body.style.setProperty("--action-size", `${preset.actionSize}px`);
  dom.body.style.setProperty("--controls-clearance", `${preset.controlsClearance}px`);
  dom.body.style.setProperty("--rail-min-height", `${preset.railMinHeight}px`);
  dom.mobileControls.setAttribute("aria-hidden", String(!isMobileLayout()));
  if (isMobileLayout()) {
    toggleHud(true);
  }
  if (!isMobileLandscape()) {
    state.mobileDockExpanded = false;
  }
  syncDockState();
  updatePointerHint();
}

updateObjective();
updateMemoryList();
bindKeyboard();
bindPointerLook();
bindUI();
handleResize();
window.addEventListener("resize", handleResize);

if (state.mode === "intro") {
  setSubtitle(INTRO_BEATS[0].kicker, INTRO_BEATS[0].text, 0.2);
  setAmbience(INTRO_BEATS[0].ambience);
} else {
  setSubtitle("女兒", "先讓前門那句電話響起來。", 3.2);
  setAmbience("粉筆味像一層薄雲，樓梯口那邊有風，十一點的光才剛準備進來。");
}

syncDockState();
updatePointerHint();
requestAnimationFrame(tick);
