/**
 * expression-rig.js — 學妹臉部表情控制系統（Tier 3）
 *
 * 為什麼不用 SkinnedMesh + Bone？
 *   學妹是「N 個獨立 primitives 拼起來」，不是統一網格 → 沒有 vertex weight 可綁骨骼。
 *   做傳統 rig 要先合併 mesh + 重 retopo + UV + skin weight，那是 Blender 工程。
 *
 *   這個 rig 是「程式積木角色」的天然解法：
 *     - 把每個 mesh 當作可獨立 transform 的「骨頭單位」
 *     - 紀錄 rest pose（休息姿態）→ 每幀 reset → 套用表情 state → 重新 transform
 *     - 自然支援眨眼、張嘴、微笑、揚眉、視線（每個都是幾個 mesh 的 position/scale/rotation 變化）
 *
 * 公開 API：
 *   const rig = createJuniorExpressionRig(headRefs);
 *   rig.setBlink(0.5);       // 眨眼進度 0=open, 1=closed
 *   rig.setMouthOpen(0.3);   // 張嘴進度 0=closed, 1=open
 *   rig.setSmile(0.7);       // 微笑 -1=苦臉, 0=平, +1=笑
 *   rig.setBrowRaise(0.4);   // 揚眉 0=平, 1=驚訝
 *   rig.setLookDir(0.3, 0);  // 視線 (-1=左/下 ~ +1=右/上)
 *   rig.update(time);        // 每幀呼叫（內部驅動自動眨眼 + 呼吸）
 *
 *   rig.state — 公開可讀寫的狀態
 *
 * 內建自動行為：
 *   - 自然眨眼：每 3.5~6.5 秒一次，閉合 60ms、張開 100ms
 *   - 微呼吸：頭部 y 微小浮動（sine wave）
 */

import * as THREE from "./vendor-three.module.js";

// ─── helpers ──────────────────────────────────────────
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function clampRange(v, a, b) { return Math.max(a, Math.min(b, v)); }

// reusable Vector3（避免 update() 內每幀 new 物件）
const _v3a = new THREE.Vector3();

/**
 * 紀錄每個 mesh 的初始 transform（深拷貝）
 * 這是表情系統的「原點」，每幀會 reset 回這個 pose 再套表情
 */
function captureRest(refs) {
  const rest = {};
  for (const [key, mesh] of Object.entries(refs)) {
    if (!mesh) continue;
    rest[key] = {
      pos: mesh.position?.clone?.() ?? null,
      scale: mesh.scale?.clone?.() ?? null,
      rotX: mesh.rotation?.x ?? 0,
      rotY: mesh.rotation?.y ?? 0,
      rotZ: mesh.rotation?.z ?? 0,
    };
  }
  return rest;
}

function resetToRest(refs, rest) {
  for (const [key, mesh] of Object.entries(refs)) {
    if (!mesh || !rest[key]) continue;
    if (rest[key].pos) mesh.position.copy(rest[key].pos);
    if (rest[key].scale) mesh.scale.copy(rest[key].scale);
    if (mesh.rotation) {
      mesh.rotation.x = rest[key].rotX;
      mesh.rotation.y = rest[key].rotY;
      mesh.rotation.z = rest[key].rotZ;
    }
  }
}

// ─── factory ──────────────────────────────────────────
export function createJuniorExpressionRig(refs, options = {}) {
  if (!refs) {
    console.warn("[expression-rig] No refs provided, rig disabled.");
    return makeNoOpRig();
  }
  const rest = captureRest(refs);

  // Tier 8 options：getCamera() 提供 camera ref（給 eye tracking 算注視方向）
  const getCamera = options.getCamera ?? null;
  // C6 Hover/click options：canvas + getJuniorHead 給 raycaster 用
  const canvasEl = options.canvas ?? null;
  const getJuniorHead = options.getJuniorHead ?? null;

  // 公開狀態（toni 可從 console 直接修改）
  const state = {
    blink: 0,        // 0=open, 1=closed
    mouthOpen: 0,    // 0=closed, 1=open
    smile: 0,        // -1=frown, 0=neutral, +1=smile
    browRaise: 0,    // 0=neutral, 1=raised (驚訝)
    lookX: 0,        // -1=左 ~ +1=右
    lookY: 0,        // -1=下 ~ +1=上
    autoBlink: true,
    autoBreath: true,
    // Tier 8 新行為開關
    autoEyeTrack: true,   // 眼睛跟隨相機
    autoSaccade: true,    // 隨機眼跳（saccade）
    autoMicro: true,      // 隨機微表情
    autoHeadWobble: true, // 頭部點頭傾頭微動
    eyeTrackStrength: 0.5, // 眼睛追蹤強度（0=不動，1=全跟）
  };

  // idle 狀態機
  let lastTime = 0;
  let nextBlinkAt = 3 + Math.random() * 3;
  let blinkPhase = 0;       // 0=等待, 1=閉合, 2=張開
  let blinkPhaseTime = 0;
  let breathPhase = 0;
  let manualBlinkOverride = false;

  // Tier 8.1 Eye tracking：學妹頭部世界座標暫存
  const _headWorld = { x: 0, y: 0, z: 0 };
  // Tier 8.2 Saccade（眼跳）狀態
  let saccadeTimer = 1.5 + Math.random() * 2;
  let saccadeTargetX = 0;
  let saccadeTargetY = 0;
  let saccadeCurX = 0;
  let saccadeCurY = 0;
  // Tier 8.3 Micro-expression 狀態
  let microTimer = 5 + Math.random() * 8;
  let currentMicro = null; // { kind, start, duration }
  // Tier 8.4 頭部 wobble 相位
  let headWobbleX = 0;
  let headWobbleZ = 0;
  // C6 Hover/click 狀態
  let isHovered = false;            // 玩家滑鼠在學妹頭部上
  let hoverStrengthCur = 0.5;       // 當前 eyeTrackStrength（會 lerp 到 hover 目標）
  const _raycaster = new THREE.Raycaster();
  const _ndc = new THREE.Vector2();

  // C6 raycaster + click reaction 註冊
  if (canvasEl && getCamera && getJuniorHead) {
    canvasEl.addEventListener("pointermove", (event) => {
      const rect = canvasEl.getBoundingClientRect();
      _ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const cam = getCamera();
      const head = getJuniorHead();
      if (!cam || !head) return;
      _raycaster.setFromCamera(_ndc, cam);
      const hits = _raycaster.intersectObject(head, true);
      isHovered = hits.length > 0;
    }, { passive: true });

    canvasEl.addEventListener("click", () => {
      if (!isHovered) return;
      // 觸發 click reaction（surprise / shy / happy 隨機，比一般 micro 強）
      const big = ["surprise", "shy", "happy"];
      currentMicro = {
        kind: big[Math.floor(Math.random() * big.length)],
        start: lastTime,
        duration: 1.0 + Math.random() * 0.5,
      };
      microTimer = 12 + Math.random() * 8; // 重置計時，避免馬上又被 auto micro 蓋掉
    });
  }

  // ─── 套用 state 到 mesh transform ───
  function apply() {
    resetToRest(refs, rest);

    const blink = clamp01(state.blink);
    const mo = clamp01(state.mouthOpen);
    const sm = clampRange(state.smile, -1, 1);
    const br = clamp01(state.browRaise);
    const lx = clampRange(state.lookX, -1, 1);
    const ly = clampRange(state.lookY, -1, 1);

    // === 眨眼（左右眼通用） ===
    for (const side of ["L", "R"]) {
      const upper = refs[`heroUpperLid${side}`];
      const lower = refs[`heroLowerLid${side}`];
      const iris = refs[`heroIris${side}`];
      const pupil = refs[`heroPupil${side}`];
      const cornea = refs[`heroCornea${side}`];
      const lash = refs[`heroLash${side}`];
      const dlid = refs[`heroDoubleLid${side}`];

      if (upper) {
        upper.position.y -= blink * 0.013;
        upper.scale.y *= 1 + blink * 0.4;
      }
      if (lower) lower.position.y += blink * 0.005;
      if (iris) iris.scale.y *= 1 - blink * 0.92;
      if (pupil) pupil.scale.y *= 1 - blink * 0.92;
      if (cornea) cornea.scale.y *= 1 - blink * 0.6;
      if (lash) lash.position.y -= blink * 0.012;
      if (dlid) dlid.position.y -= blink * 0.013;
    }

    // === 張嘴 ===
    if (refs.heroLowerLip) refs.heroLowerLip.position.y -= mo * 0.014;
    if (refs.heroUpperLip) refs.heroUpperLip.position.y += mo * 0.002;
    if (refs.heroLipLine)  refs.heroLipLine.position.y  -= mo * 0.006;
    if (refs.jawShell)     refs.jawShell.rotation.x = rest.jawShell.rotX + mo * 0.06;

    // === 微笑（嘴角上揚 / 下垂） ===
    if (refs.heroLipLine) {
      refs.heroLipLine.rotation.z = sm * 0.05;
      refs.heroLipLine.scale.x   *= 1 + Math.abs(sm) * 0.04;
    }
    if (refs.heroUpperLip) refs.heroUpperLip.rotation.z = sm * 0.06;
    if (refs.heroLowerLip) refs.heroLowerLip.rotation.z = sm * 0.06;

    // === 揚眉 ===
    if (refs.heroBrowL) refs.heroBrowL.position.y += br * 0.007;
    if (refs.heroBrowR) refs.heroBrowR.position.y += br * 0.007;
    if (refs.heroUpperLidL) refs.heroUpperLidL.position.y += br * 0.003;
    if (refs.heroUpperLidR) refs.heroUpperLidR.position.y += br * 0.003;

    // === 視線 ===
    for (const side of ["L", "R"]) {
      for (const part of ["heroIris", "heroPupil", "heroCornea"]) {
        const m = refs[part + side];
        if (!m) continue;
        m.position.x += lx * 0.0028;
        m.position.y += ly * 0.0024;
      }
    }
  }

  // ─── 每幀更新（驅動 idle + apply） ───
  function update(time) {
    if (lastTime === 0) lastTime = time;
    const dt = Math.min(0.1, time - lastTime);
    lastTime = time;

    // 自動眨眼狀態機
    if (state.autoBlink && !manualBlinkOverride) {
      if (blinkPhase === 0) {
        nextBlinkAt -= dt;
        if (nextBlinkAt <= 0) {
          blinkPhase = 1;
          blinkPhaseTime = 0;
        }
      } else if (blinkPhase === 1) {
        // 閉合 60ms（指數曲線收斂）
        blinkPhaseTime += dt;
        const t = clamp01(blinkPhaseTime / 0.06);
        state.blink = t * t;       // 加速閉
        if (t >= 1) { blinkPhase = 2; blinkPhaseTime = 0; }
      } else if (blinkPhase === 2) {
        // 張開 100ms
        blinkPhaseTime += dt;
        const t = clamp01(blinkPhaseTime / 0.10);
        state.blink = (1 - t) * (1 - t); // 加速張
        if (t >= 1) {
          blinkPhase = 0;
          state.blink = 0;
          nextBlinkAt = 3 + Math.random() * 3.5;
        }
      }
    }

    // 微呼吸：頭部 y 微浮動
    if (state.autoBreath) {
      breathPhase += dt;
      const b = Math.sin(breathPhase * 0.65) * 0.5 + 0.5;
      if (refs.headShell && rest.headShell?.pos) {
        refs.headShell.position.y = rest.headShell.pos.y + b * 0.0008;
      }
    }

    // === C6 Hover lerp：滑鼠 hover 學妹時 eyeTrackStrength 提升 0.5 → 1.0 ===
    {
      const target = isHovered ? 1.0 : 0.5;
      hoverStrengthCur += (target - hoverStrengthCur) * Math.min(1, dt * 4);
      state.eyeTrackStrength = hoverStrengthCur;
    }

    // === Tier 8.1 Eye tracking — 學妹眼睛跟隨相機 ===
    if (state.autoEyeTrack && getCamera) {
      const cam = getCamera();
      if (cam && refs.headShell) {
        // 學妹頭部世界座標
        refs.headShell.getWorldPosition(_v3a);
        _headWorld.x = _v3a.x; _headWorld.y = _v3a.y; _headWorld.z = _v3a.z;
        // 從學妹眼睛指向相機的單位向量
        const dx = cam.position.x - _headWorld.x;
        const dy = cam.position.y - _headWorld.y;
        const dz = cam.position.z - _headWorld.z;
        const len = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
        const nx = dx / len, ny = dy / len;
        // 轉成 lookX/Y（學妹本身朝 +Z，所以左右 = world x，上下 = world y）
        const targetX = clampRange(nx * 0.85, -1, 1) * state.eyeTrackStrength;
        const targetY = clampRange(ny * 0.85, -1, 1) * state.eyeTrackStrength;
        // 平滑追隨（每幀補 8% 差距，自然不突兀）
        state.lookX += (targetX - state.lookX) * 0.08;
        state.lookY += (targetY - state.lookY) * 0.08;
      }
    }

    // === Tier 8.2 Saccade — 隨機眼跳（人眼自然抖動，每秒 3-4 次微跳） ===
    if (state.autoSaccade) {
      saccadeTimer -= dt;
      if (saccadeTimer <= 0) {
        saccadeTargetX = (Math.random() - 0.5) * 0.35;
        saccadeTargetY = (Math.random() - 0.5) * 0.22;
        saccadeTimer = 1.2 + Math.random() * 2.5; // 每 1.2~3.7 秒一次
      }
      // 平滑收斂到 saccade target（快速到達後保持，等下次切換）
      saccadeCurX += (saccadeTargetX - saccadeCurX) * 0.18;
      saccadeCurY += (saccadeTargetY - saccadeCurY) * 0.18;
      state.lookX += saccadeCurX * 0.06;
      state.lookY += saccadeCurY * 0.06;
    }

    // === Tier 8.3 Micro-expression — 隨機觸發小表情（每 8-20 秒一次） ===
    if (state.autoMicro) {
      microTimer -= dt;
      if (microTimer <= 0 && !currentMicro) {
        const choices = ["briefSmile", "lipPress", "browTwitch", "tinyHmm"];
        currentMicro = {
          kind: choices[Math.floor(Math.random() * choices.length)],
          start: time,
          duration: 0.6 + Math.random() * 0.6, // 0.6~1.2 秒
        };
        microTimer = 8 + Math.random() * 12;
      }
      if (currentMicro) {
        const elapsed = time - currentMicro.start;
        const t = elapsed / currentMicro.duration;
        if (t >= 1) {
          currentMicro = null;
        } else {
          // sin(t*PI) 升降曲線（中段最強，兩端 0）
          const wave = Math.sin(t * Math.PI);
          switch (currentMicro.kind) {
            case "briefSmile":
              state.smile = Math.max(state.smile, wave * 0.32);
              break;
            case "lipPress":
              state.mouthOpen = Math.min(state.mouthOpen, -wave * 0.12);
              break;
            case "browTwitch":
              state.browRaise = Math.max(state.browRaise, wave * 0.45);
              break;
            case "tinyHmm":
              state.lookY = clampRange(state.lookY - wave * 0.08, -1, 1);
              break;
            // C6 click reactions（玩家點學妹觸發，比 auto micro 更明顯）
            case "surprise":
              state.browRaise = Math.max(state.browRaise, wave * 0.75);
              state.mouthOpen = Math.max(state.mouthOpen, wave * 0.30);
              state.smile = 0;
              break;
            case "shy":
              state.smile = Math.max(state.smile, wave * 0.42);
              state.lookY = clampRange(state.lookY - wave * 0.18, -1, 1);
              state.lookX = clampRange(state.lookX + wave * 0.12, -1, 1);
              break;
            case "happy":
              state.smile = Math.max(state.smile, wave * 0.65);
              state.browRaise = Math.max(state.browRaise, wave * 0.22);
              break;
          }
        }
      }
    }

    // === Tier 8.4 頭部 idle wobble — 微微點頭 + 偶爾傾頭 ===
    if (state.autoHeadWobble && refs.headShell && rest.headShell) {
      headWobbleX = Math.sin(breathPhase * 0.4 + 0.3) * 0.014;   // 點頭（rot.x）
      headWobbleZ = Math.sin(breathPhase * 0.27 + 1.1) * 0.008;  // 傾頭（rot.z）
      refs.headShell.rotation.x = rest.headShell.rotX + headWobbleX;
      refs.headShell.rotation.z = rest.headShell.rotZ + headWobbleZ;
    }

    apply();
  }

  // ─── 公開 API ───
  return {
    state,
    update,
    setBlink:    (v) => { state.blink = v; manualBlinkOverride = true; apply(); },
    setMouthOpen:(v) => { state.mouthOpen = v; apply(); },
    setSmile:    (v) => { state.smile = v; apply(); },
    setBrowRaise:(v) => { state.browRaise = v; apply(); },
    setLookDir:  (x, y) => { state.lookX = x; state.lookY = y; apply(); },
    releaseManualBlink: () => { manualBlinkOverride = false; },
    inspectRest: () => Object.keys(rest),
  };
}

// 防呆：refs 為 null 時不爆
function makeNoOpRig() {
  return {
    state: {},
    update: () => {},
    setBlink: () => {}, setMouthOpen: () => {}, setSmile: () => {},
    setBrowRaise: () => {}, setLookDir: () => {},
    releaseManualBlink: () => {}, inspectRest: () => [],
  };
}
