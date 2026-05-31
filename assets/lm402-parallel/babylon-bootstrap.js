// babylon-bootstrap.js — 平行世界「絕對天花板」線 · Babylon.js WebGPU 引導
// 2026-05-31 r67 toni 拍板:平行世界用 Babylon.js 挑戰極限,WebGPU-ONLY,不 fallback。
// 啟用:lm402-parallel.html?webgpu=1(opt-in;預設仍走 Three.js app.js,不動)。
//
// P1 scaffold:證明 Babylon WebGPU pipeline 在真機通(PBR 球 + 地面 + 燈光 + ArcRotate 相機)。
// 後續 P2 起才在此基礎重建學妹 / 場景 / postfx / path tracer。
// headless 無 GPU 驗不了畫面 — 此檔的綠燈 = 載入無 JS error + gate 邏輯對;畫面由 toni 真機驗。

import { buildJunior } from "./babylon-junior.js";
import { setupPipeline } from "./babylon-pipeline.js";
import { setupConsciousness } from "./babylon-particles.js";
import { setupCloseup } from "./babylon-closeup.js";

const BABYLON_VENDOR = "./assets/lm402-parallel/vendor/babylon.9.10.1.js";

// Babylon UMD(掛 window.BABYLON,非 ESM)→ 動態注入 script 後用 global。
function loadBabylonUMD() {
  if (window.BABYLON) return Promise.resolve(window.BABYLON);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = BABYLON_VENDOR;
    s.async = true;
    s.onload = () => (window.BABYLON ? resolve(window.BABYLON) : reject(new Error("BABYLON global missing")));
    s.onerror = () => reject(new Error("babylon vendor load failed"));
    document.head.appendChild(s);
  });
}

// WebGPU-only gate:跑不動就擋,不 fallback(toni Q-4)。純 createElement + textContent,無 innerHTML。
function showGate(reason) {
  const wrap = document.createElement("div");
  wrap.id = "babylon-webgpu-gate";
  wrap.style.cssText =
    "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;" +
    "background:#0a0a0f;color:#f0e6d8;font-family:'Noto Serif TC',serif;text-align:center;padding:32px;";

  const box = document.createElement("div");
  box.style.maxWidth = "34em";

  const kicker = document.createElement("div");
  kicker.style.cssText = "font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.22em;color:rgba(248,192,160,.7)";
  kicker.textContent = "PARALLEL · ABSOLUTE CEILING";

  const h2 = document.createElement("h2");
  h2.style.cssText = "font-weight:480;letter-spacing:.06em;margin:10px 0 14px;font-size:26px";
  h2.textContent = "平行世界 · 絕對天花板";

  const p1 = document.createElement("p");
  p1.style.cssText = "opacity:.82;line-height:1.85;margin:0";
  p1.textContent = reason;

  const p2 = document.createElement("p");
  p2.style.cssText = "opacity:.6;line-height:1.85;margin:16px 0 0";
  p2.textContent = "這條線刻意不為相容妥協 — 請用桌機 Chrome / Edge,或 Safari 26+(macOS Tahoe / iOS 26)。";

  const p3 = document.createElement("p");
  p3.style.cssText = "opacity:.6;line-height:1.85;margin:10px 0 0";
  p3.append("想要穩定相容版？回 ");
  const aTwin = document.createElement("a");
  aTwin.href = "lm402-twin.html";
  aTwin.style.color = "#e89a78";
  aTwin.textContent = "雙時空";
  const aMain = document.createElement("a");
  aMain.href = "lm402.html";
  aMain.style.color = "#e89a78";
  aMain.textContent = "正本";
  p3.append(aTwin, " 或 ", aMain, "。");

  box.append(kicker, h2, p1, p2, p3);
  wrap.appendChild(box);
  document.body.appendChild(wrap);
}

async function detectWebGPU() {
  if (!navigator.gpu) return { ok: false, reason: "此瀏覽器不支援 WebGPU(找不到 navigator.gpu)。" };
  try {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) return { ok: false, reason: "取不到 GPU adapter(可能是硬體或驅動限制)。" };
    return { ok: true, adapter };
  } catch (e) {
    return { ok: false, reason: "WebGPU 偵測發生錯誤。" };
  }
}

function ensureCanvas() {
  let canvas = document.getElementById("lm402-canvas") || document.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "lm402-canvas";
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none;";
    document.body.appendChild(canvas);
  }
  return canvas;
}

async function main() {
  const det = await detectWebGPU();
  if (!det.ok) {
    showGate(det.reason);
    console.warn("[parallel-babylon] WebGPU gate:", det.reason);
    return;
  }

  let BABYLON;
  try {
    BABYLON = await loadBabylonUMD();
  } catch (e) {
    showGate("Babylon 引擎載入失敗。");
    console.error("[parallel-babylon] babylon load error:", e);
    return;
  }

  const canvas = ensureCanvas();
  const engine = new BABYLON.WebGPUEngine(canvas, { antialias: true, stencil: true });
  // P4: glslang/twgsl transpiler 指向本機 vendor(GPUParticleSystem 等 GLSL shader 需要)
  // → 不從 cdn.babylonjs.com 抓(CSP connect-src 'self' 會擋),改用同源本機檔。
  const V = "./assets/lm402-parallel/vendor";
  await engine.initAsync(
    { jsPath: V + "/glslang/glslang.js", wasmPath: V + "/glslang/glslang.wasm" },
    { jsPath: V + "/twgsl/twgsl.js", wasmPath: V + "/twgsl/twgsl.wasm" }
  );
  window.__BABYLON_ENGINE__ = engine;

  // P1 minimal scene: PBR sphere + ground + lights (prove WebGPU PBR pipeline)
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.035, 1);

  const camera = new BABYLON.ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 2.35, 6, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 3;
  camera.upperRadiusLimit = 14;
  camera.wheelDeltaPercentage = 0.01;

  const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0.3, 1, 0.2), scene);
  hemi.intensity = 0.85;
  hemi.diffuse = new BABYLON.Color3(1.0, 0.93, 0.84);
  const key = new BABYLON.DirectionalLight("key", new BABYLON.Vector3(-0.5, -1, -0.35), scene);
  key.intensity = 1.5;
  key.position = new BABYLON.Vector3(5, 8, 4);

  // P2: 程序學妹(取代 P1 placeholder 球)
  const junior = buildJunior(BABYLON, scene);
  window.__JUNIOR__ = junior.root;
  camera.setTarget(new BABYLON.Vector3(0, 0.92, 0));
  camera.radius = 4.2;

  const ground = BABYLON.MeshBuilder.CreateGround("g", { width: 14, height: 14 }, scene);
  const gm = new BABYLON.PBRMetallicRoughnessMaterial("gm", scene);
  gm.baseColor = new BABYLON.Color3(0.08, 0.08, 0.11);
  gm.metallic = 0.0;
  gm.roughness = 0.85;
  ground.material = gm;
  ground.receiveShadows = true; // P5 Codex fix: 讓 ShadowGenerator 的陰影真的投在地面上

  // P3: 後製 + 光影管線(bloom / ACES tonemap / SSAO2 / grain / CA + cinematic 補光)
  setupPipeline(BABYLON, scene, camera, junior.headCenter);
  // P4: 意識菜市場 compute 粒子(GPUParticleSystem,環繞頭部記憶碎片風暴)
  setupConsciousness(BABYLON, scene, junior.headCenter);
  // P5: 一眼瞬間 max-raster closeup(暖窗光 + 程序 IBL + SSR + DoF closeup toggle)
  setupCloseup(BABYLON, scene, camera, junior);

  // ⚠️ 隱藏 #lm402-loader 載入畫面 — Three.js app.js 有做(line 3444+),Babylon 路徑必須複製,
  //    否則 loader 永遠蓋住場景 → 真機卡在載入畫面(toni 2026-05-31 回報)。
  //    用 executeWhenReady 等場景 mesh/material 真備妥才淡出,避免黑閃。
  scene.executeWhenReady(() => {
    const loaderEl = document.getElementById("lm402-loader");
    if (!loaderEl) return;
    if (window.__lm402LoaderTipTimer) {
      clearInterval(window.__lm402LoaderTipTimer);
      window.__lm402LoaderTipTimer = null;
    }
    loaderEl.style.transition = "opacity 0.9s ease";
    loaderEl.style.opacity = "0";
    loaderEl.style.pointerEvents = "none";
    setTimeout(() => { if (loaderEl.parentNode) loaderEl.remove(); }, 1000);
  });

  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());

  window.__lm402Ready = true;
  window.__lm402GateEntered = true;
  const ver = (BABYLON.Engine && BABYLON.Engine.Version) || "9.x";
  console.info("%c[parallel-babylon] P2 junior online — Babylon " + ver + " WebGPU", "color:#a8c5ff;font-weight:bold");
  console.info("  GPU adapter:", (det.adapter && det.adapter.info) || "(info n/a)");
  console.info("  LM402-parallel P1-P5 online · __BJS_CLOSEUP__() 切一眼瞬間特寫 · next: Q-series 月台");
}

main();
