# Three.js r179 WebGPU vendor

**來源**:`npm install three@0.179.0`(2026-05-02 22:00)
**取自**:`node_modules/three/build/three.webgpu{.min,}.js`

## 重大發現(round-3+1+1+1 - F sprint Phase 1)

原 F_SPRINT_PLAN.md 估 F1.2 vendor copy 工程量 **3 天**(從 `examples/jsm/renderers/webgpu/` 拷整套依賴樹 10+ 檔)。

**實測 r179 改成 single-file vendor**:
- `three.webgpu.min.js`(552 KB)— WebGPURenderer + 全依賴 + Node system + WebGPUBackend
- `three.webgpu.js`(1.74 MB)— unminified for debug
- `three.webgpu.nodes.js`(同尺寸)— node-system focused 變體

F1.2 工程量 **3 天 → 30 分鐘**(從 examples 樹複製 → cp 一個檔)。

## 用法(F2 phase 開始時)

```html
<script type="importmap">
{
  "imports": {
    "three": "./vendor/three.webgpu.min.js",
    "three/webgpu": "./vendor/three.webgpu.min.js"
  }
}
</script>
<script type="module">
  import * as THREE from "three";
  // THREE.WebGPURenderer 直接可用
  const renderer = new THREE.WebGPURenderer({ canvas });
  await renderer.init();
  // ... 跟 WebGLRenderer 大致同 API,但 init() 是 async
</script>
```

## 跟 lm402-parallel.html 整合(F2 phase)

未來 F2 切換 WebGLRenderer → WebGPURenderer 時:
1. 改 import 從 `three.core.js` → `three.webgpu.min.js`
2. `new THREE.WebGLRenderer` → `new THREE.WebGPURenderer` + `await renderer.init()`
3. 處理 API 差異(outputColorSpace / toneMapping / shadowMap)

**postfx.js 全部 ShaderMaterial 仍用 GLSL** — F2 完成那刻 postfx 失效,F3 GLSL→WGSL 才修。

## 測試

`webgpu-test.html` 跑 minimal cube 確認 vendor 可載入 + WebGPURenderer 初始化 OK。

## 注意

- r179 仍 alpha,API 可能破壞變更 — 鎖定版本不跟隨 upgrade
- Safari WebGPU 仍 partial,F1.1 偵測 + fallback 已 cover
- 檔案大,CDN 化 / lazy-load 可在 F2 phase 評估
