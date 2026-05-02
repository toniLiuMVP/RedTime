# Three.js r179 WebGPU vendor

**來源**:`npm install three@0.179.0`(2026-05-02 22:00)
**取自**:`node_modules/three/build/three.webgpu{.min,}.js`

## 重大發現(round-3+1+1+1 - F sprint Phase 1)

原 F_SPRINT_PLAN.md 估 F1.2 vendor copy 工程量 **3 天**(從 `examples/jsm/renderers/webgpu/` 拷整套依賴樹 10+ 檔)。

**實測 r179 vendor 結構**:不是 examples 樹,但**也不是 single-file**(我前面誤稱 single-file 是 over-claim)。

- `three.webgpu.min.js`(566 KB)— WebGPURenderer + WebGPUBackend,**import `./three.core.min.js`**
- `three.core.min.js`(380 KB)— Three.js 核心(scene / camera / mesh / shader 等)
- `three.tsl.min.js`(21 KB)— Three Shader Language(WebGPU shader DSL)— 可選,webgpu.min 不直接 import 但 nodes 變體需要
- `three.webgpu.js`(1.74 MB)— unminified webgpu for debug

**Import 鏈**(grep -E 驗證):
```
three.webgpu.min.js → "./three.core.min.js"   (依賴)
three.core.min.js   → (self-contained,無依賴)
```

F1.2 工程量校正:**3 天 → 30 分鐘 + 修 5 分鐘**(我 round-3+1+1+1 第一次 cp 漏 three.core.min.js,toni 跑 test.html 抓到 404,本次補拷)。

**meta 教訓**(對齊 LESSONS §3.13 round-4):**寫「single-file」claim 前必 grep import 鏈**,不該假設 minified 就是 single-file。

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
