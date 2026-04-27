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

// ─── helpers ──────────────────────────────────────────
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function clampRange(v, a, b) { return Math.max(a, Math.min(b, v)); }

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
export function createJuniorExpressionRig(refs) {
  if (!refs) {
    console.warn("[expression-rig] No refs provided, rig disabled.");
    return makeNoOpRig();
  }
  const rest = captureRest(refs);

  // 公開狀態（toni 可從 console 直接修改）
  const state = {
    blink: 0,        // 0=open, 1=closed
    mouthOpen: 0,    // 0=closed, 1=open
    smile: 0,        // -1=frown, 0=neutral, +1=smile
    browRaise: 0,    // 0=neutral, 1=raised (驚訝)
    lookX: 0,        // -1=左 ~ +1=右
    lookY: 0,        // -1=下 ~ +1=上
    autoBlink: true, // 自動眨眼開關
    autoBreath: true,
  };

  // idle 狀態機
  let lastTime = 0;
  let nextBlinkAt = 3 + Math.random() * 3;
  let blinkPhase = 0;       // 0=等待, 1=閉合, 2=張開
  let blinkPhaseTime = 0;
  let breathPhase = 0;
  let manualBlinkOverride = false;

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
