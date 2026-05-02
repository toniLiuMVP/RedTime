/**
 * parallel-init.js — F2 起步框架(2026-05-03 round-5+2)
 *
 * 🟧 LM402 平行世界專用 — toni confirm「F 全做」啟動 phase 1.5
 *
 * 設計:
 *   - 獨立檔,**不**接 lm402-parallel.html(避免 break runtime)
 *   - 提供 createParallelRenderer() 工廠函數
 *   - F2 phase 完成時:lm402-parallel.html import 此檔取代 WebGLRenderer
 *   - 處理 WebGPURenderer 跟 WebGLRenderer API 差異
 *
 * 來源:F1.2 vendor verified(commit 50dcf72,Safari + Chrome 5 ✅)
 * 後續:F3 phase GLSL → WGSL 重寫時,本檔的 shader 也一起 WGSL 化
 *
 * NOT YET WIRED — 本 file 是 F2 phase preparation,等 dedicated session
 * 跟 lm402-parallel.html / lm402-parallel/renderer.js 整合
 */

import * as THREE from "./vendor/three.webgpu.min.js";

/**
 * 建立平行世界 WebGPURenderer(取代原 WebGLRenderer)
 *
 * 跟 WebGLRenderer 的差異(F2 phase 要處理):
 * 1. init() 是 async — 必須 await
 * 2. setPixelRatio / setSize 行為類似但內部 backend 不同
 * 3. outputColorSpace 仍存在但 WebGPU backend 處理可能不同
 * 4. toneMapping enum 對應不變
 * 5. shadowMap.type 仍存在但 PCSS 等需 review
 * 6. ShaderMaterial 失效 — 必須改 WGSL(F3 phase)
 *
 * @param {Object} opts
 * @param {HTMLCanvasElement} opts.canvas
 * @param {boolean} [opts.antialias=true]
 * @param {number} [opts.pixelRatio=window.devicePixelRatio]
 *
 * @returns {Promise<THREE.WebGPURenderer>}
 */
export async function createParallelRenderer({ canvas, antialias = true, pixelRatio } = {}) {
  if (!canvas) throw new Error("[parallel-init] canvas is required");
  if (!navigator.gpu) {
    throw new Error("[parallel-init] WebGPU not available — should be caught by F1.1 fallback");
  }

  const renderer = new THREE.WebGPURenderer({ canvas, antialias });
  await renderer.init();

  // 對齊現有 lm402-parallel renderer.js 設定(F2 phase 要驗證 API 一致)
  renderer.setPixelRatio(pixelRatio ?? window.devicePixelRatio ?? 1);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setClearColor(0x1a1820, 1);

  // outputColorSpace — WebGPU backend 該也支援,F2 phase 驗證
  if ("outputColorSpace" in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  // toneMapping — F2 phase 確認 WebGPU 的 ACES 對齊 WebGL2 版本
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;  // 對齊 envmap-sunset 預設

  console.info(
    "%c[parallel-init] WebGPURenderer ready",
    "color:#a8c5ff;font-weight:bold;",
    `\n  REVISION=${THREE.REVISION}` +
    `\n  pixelRatio=${renderer.getPixelRatio()}` +
    `\n  size=${canvas.clientWidth}x${canvas.clientHeight}`
  );

  return renderer;
}

/**
 * 工具:檢查 WebGPU adapter 性能等級(F4 phase compute shader 要評估)
 *
 * @returns {Promise<{tier: 'high'|'medium'|'low', adapter: GPUAdapter}>}
 */
export async function probeGPUTier() {
  if (!navigator.gpu) return { tier: "none", adapter: null };

  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  });
  if (!adapter) return { tier: "none", adapter: null };

  // 簡化的 tier 推斷(基於 limits)
  const maxBufferSize = adapter.limits?.maxBufferSize ?? 0;
  let tier = "low";
  if (maxBufferSize >= 1024 * 1024 * 1024) tier = "high";       // 1 GB+
  else if (maxBufferSize >= 256 * 1024 * 1024) tier = "medium"; // 256 MB+

  return { tier, adapter };
}

/**
 * F2 phase 整合 checklist(實作前先看)
 *
 * 1. lm402-parallel.html 改 import:
 *      <script type="module" src="./assets/lm402-parallel/parallel-init.js"></script>
 *
 * 2. lm402-parallel/renderer.js init 改:
 *      // Before
 *      const renderer = new THREE.WebGLRenderer({...});
 *      // After
 *      const renderer = await createParallelRenderer({ canvas, antialias: true });
 *
 * 3. main render loop 不變(renderer.render(scene, camera))
 *
 * 4. ⚠️ 所有 ShaderMaterial 失效 → F3 phase 才修
 *
 * 5. ⚠️ postfx.js 整套失效 → F3 phase 才修
 *
 * 6. F1.1 fallback overlay 已偵測 + 引導,F2 整合期 fallback 仍生效
 *
 * 完整 sprint plan:docs/F_SPRINT_PLAN.md
 */
