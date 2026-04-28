/**
 * cloth-rig.js — 學妹軟體動態系統（Tier 4：布料 / 頭髮 spring physics）
 *
 * 為什麼自寫而不用 Cannon.js / Rapier？
 *   - GitHub Pages 純靜態 + 體積敏感（Cannon 200KB+、Rapier 800KB+）
 *   - 學妹的 cloth 需求只有「微妙擺動」，不需要碰撞、布料解算、約束系統
 *   - 純 spring 模型 + 環境風 noise 已經足夠視覺說服力
 *
 * 模型：每個可動 mesh 是一個 mass-spring point
 *   每幀：F = k * (rest - pos) + windForce(time)
 *         v = v + F/m * dt
 *         v *= damping^(dt*60)
 *         pos += v * dt
 *
 * 跟 expression-rig 的關係：
 *   expression-rig 只動「臉部 mesh」（眼睛、嘴、眉毛、jawShell、headShell）
 *   cloth-rig 只動「頭髮 mesh」（瀏海 ribbon、鬢角髮、馬尾、飛揚髮絲）
 *   → 兩個 rig 不會衝突
 *
 * 識別可動 mesh：traverse head Group，找 userData.cloth === true 的 mesh
 *   buildJuniorHairRibbon 內自動 set；馬尾 capsule 在 caller 端 set
 *
 * 公開 API：
 *   const rig = createClothRig(headGroup, options);
 *   rig.update(time, dt);                  // 每幀呼叫
 *   rig.tuning.windAmp = 0.003;            // 風力幅度
 *   rig.tuning.stiffness = 8;              // 彈性
 *   rig.setWindGust(0.8);                  // 突發強風（測試用）
 */

import * as THREE from "./vendor-three.module.js";

class ClothPoint {
  constructor(mesh, options = {}) {
    this.mesh = mesh;
    // 紀錄 rest local position（mesh 在 parent 座標系內的初始位置）
    this.rest = mesh.position.clone();
    this.velocity = new THREE.Vector3();
    // 個體屬性（可被 tuning 影響，但每點有獨立 phase 避免同步擺動）
    this.windPhase = Math.random() * Math.PI * 2;
    this.windFreqMul = 0.85 + Math.random() * 0.3; // 0.85~1.15 倍頻率變化
    this.massInv = 1 / (options.mass ?? 1);        // 預乘倒數加速計算
  }

  update(dt, time, tuning, gust) {
    const { stiffness, damping, windAmp, windFreq } = tuning;

    // 1. Spring force toward rest
    const delta = this.rest.clone().sub(this.mesh.position);
    const force = delta.multiplyScalar(stiffness);

    // 2. 環境風（多軸 sine + 個體 phase 偏移避免「整片頭髮同步」）
    const t = time * windFreq * this.windFreqMul + this.windPhase;
    force.x += Math.sin(t) * windAmp * 60;
    force.z += Math.sin(t * 0.73 + 1.0) * windAmp * 42;
    force.y += Math.sin(t * 0.41) * windAmp * 18;

    // 3. 突發強風（toni 從 console 設 gust 可觸發）
    if (gust > 0) {
      force.x += gust * windAmp * 240;
      force.z += gust * windAmp * 120;
    }

    // 4. v += F/m * dt
    this.velocity.addScaledVector(force, dt * this.massInv);

    // 5. damping（exp 衰減，frame-rate independent）
    const dampingPerFrame = Math.pow(damping, dt * 60);
    this.velocity.multiplyScalar(dampingPerFrame);

    // 6. position += v * dt
    this.mesh.position.addScaledVector(this.velocity, dt);

    // 7. clamp 防止 mesh 飄出 rest 太遠（極端 spring 失控時的安全網）
    const distSq = this.mesh.position.distanceToSquared(this.rest);
    const maxDistSq = 0.012 * 0.012; // 12mm 上限（在頭部 0.62 scale 後約 7.4mm 視覺）
    if (distSq > maxDistSq) {
      const dir = this.mesh.position.clone().sub(this.rest).normalize();
      this.mesh.position.copy(this.rest).addScaledVector(dir, Math.sqrt(maxDistSq));
      this.velocity.multiplyScalar(0.5); // 撞到上限，減半速度
    }
  }
}

/**
 * 建立 cloth rig，自動 traverse head Group 找 userData.cloth = true 的 mesh
 */
export function createClothRig(rootGroup, options = {}) {
  if (!rootGroup) {
    console.warn("[cloth-rig] rootGroup is null, cloth rig disabled.");
    return makeNoOpRig();
  }

  const tuning = {
    stiffness: options.stiffness ?? 11,
    damping: options.damping ?? 0.84,
    windAmp: options.windAmp ?? 0.0014,
    windFreq: options.windFreq ?? 0.55,
    enabled: true,
  };

  // traverse 找所有標記 cloth 的 mesh
  const points = [];
  rootGroup.traverse((m) => {
    if (m.isMesh && m.userData?.cloth === true) {
      // 個別 mesh 可在 userData 內覆寫 mass（重的擺慢、輕的擺快）
      points.push(new ClothPoint(m, { mass: m.userData?.clothMass ?? 1 }));
    }
  });

  let lastTime = 0;
  let gust = 0;

  function update(time) {
    if (!tuning.enabled) return;
    if (lastTime === 0) lastTime = time;
    const dt = Math.min(0.05, time - lastTime); // clamp dt 上限避免大跳幀爆炸
    lastTime = time;

    // 突發風 decay
    if (gust > 0) gust = Math.max(0, gust - dt * 1.5);

    for (const p of points) p.update(dt, time, tuning, gust);
  }

  return {
    update,
    tuning,
    setWindGust: (intensity) => {
      gust = Math.max(gust, intensity);
    },
    pointCount: points.length,
    inspect: () => ({
      points: points.length,
      tuning: { ...tuning },
      gust,
    }),
  };
}

function makeNoOpRig() {
  return {
    update: () => {},
    tuning: { enabled: false },
    setWindGust: () => {},
    pointCount: 0,
    inspect: () => ({ points: 0, tuning: { enabled: false }, gust: 0 }),
  };
}
