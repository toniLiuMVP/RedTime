// babylon-particles.js — 平行世界「絕對天花板」線 · P4 意識菜市場 compute 粒子
// 2026-05-31 r67 P4:GPUParticleSystem(WebGPU 下走 compute shader)環繞學妹頭部的「記憶碎片風暴」。
// 5 年紀色(暖橙青春 / 暖白現在 / 淡綠記憶 / 淡紫夢境 / 月光藍未來,對應 CLAUDE.md 意識菜市場規格)。
// 貼圖用 DynamicTexture 程序畫(同源,不碰 CSP);blend = ADD 但 size/rate/alpha 保守(白塊紀律)。
//
// export setupConsciousness(BABYLON, scene, anchor) → ps(GPUParticleSystem | null)
// console 微調:__BJS_CONSC__.emitRate / .minSize / .maxSize;__BJS_CONSC_STOP__()

// 程序光點貼圖(radial gradient,同源 DynamicTexture,無外部資源)
function makeDotTexture(BABYLON, scene) {
  const tex = new BABYLON.DynamicTexture("consc-dot", 64, scene, false);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  tex.hasAlpha = true;
  tex.update();
  return tex;
}

export function setupConsciousness(BABYLON, scene, anchor) {
  // GPUParticleSystem 需 WebGPU / WebGL2 compute 支援
  if (!BABYLON.GPUParticleSystem || !BABYLON.GPUParticleSystem.IsSupported) {
    console.warn("[parallel-babylon] GPUParticleSystem unsupported — skip consciousness particles");
    return null;
  }

  let ps;
  try {
    ps = new BABYLON.GPUParticleSystem("consciousness", { capacity: 12000 }, scene);
  } catch (e) {
    console.warn("[parallel-babylon] consciousness particle init skipped:", e && e.message);
    return null;
  }

  ps.particleTexture = makeDotTexture(BABYLON, scene);

  // 環繞頭部上方(意識在頭頂浮現)
  const head = anchor || new BABYLON.Vector3(0, 1.46, 0);
  ps.emitter = head.clone();
  ps.createSphereEmitter(0.55, 0.6);

  // 5 年紀色 gradient(時間軸 0→1 循環不同年紀的自己)
  ps.addColorGradient(0.0, new BABYLON.Color4(1.0, 0.62, 0.28, 0.0)); // 暖橙 青春(淡入)
  ps.addColorGradient(0.25, new BABYLON.Color4(1.0, 0.95, 0.88, 0.5)); // 暖白 現在
  ps.addColorGradient(0.5, new BABYLON.Color4(0.62, 0.86, 0.66, 0.5)); // 淡綠 記憶
  ps.addColorGradient(0.75, new BABYLON.Color4(0.74, 0.66, 0.95, 0.45)); // 淡紫 夢境
  ps.addColorGradient(1.0, new BABYLON.Color4(0.62, 0.74, 1.0, 0.0)); // 月光藍 未來(淡出)

  // 保守 size / rate / lifetime(白塊紀律:ADD blend 環繞頭部不過曝)
  ps.minSize = 0.012;
  ps.maxSize = 0.05;
  ps.minLifeTime = 2.4;
  ps.maxLifeTime = 5.5;
  ps.emitRate = 220;
  ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

  // 緩慢上飄 + 微旋(記憶碎片風暴)
  ps.gravity = new BABYLON.Vector3(0, 0.12, 0);
  ps.direction1 = new BABYLON.Vector3(-0.25, 0.5, -0.25);
  ps.direction2 = new BABYLON.Vector3(0.25, 0.9, 0.25);
  ps.minEmitPower = 0.08;
  ps.maxEmitPower = 0.28;
  ps.minAngularSpeed = -1.2;
  ps.maxAngularSpeed = 1.2;
  ps.updateSpeed = 0.012;

  ps.start();

  window.__BJS_CONSC__ = ps;
  window.__BJS_CONSC_STOP__ = () => ps.stop();
  console.info("[parallel-babylon] P4 consciousness particles online — GPU compute, 5-age palette");
  return ps;
}
