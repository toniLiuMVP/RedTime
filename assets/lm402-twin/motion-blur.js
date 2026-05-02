/**
 * motion-blur.js — Motion blur(simplified accumulation blend)
 *
 * Accumulation blend 版:
 *   - prev frame 跟 current frame 線性混合(intensity 控制比例)
 *   - 視覺上有「拖影」感(persistence-of-vision style motion blur)
 *   - 不需 motion vector G-buffer,實作簡單(~150 行)
 *   - 缺點:相機快速移動時整個畫面糊,不只移動物件糊
 *
 * 進階版(motion vector G-buffer):
 *   - prev/current ViewProjMatrix → velocity per pixel → blur 沿 velocity
 *   - 只移動物件糊(角色頭髮搖晃 / 走進場景),靜止背景清楚
 *
 * 整合方式(2 種):
 *   A) 在 postfx.js 最終 pass 之前插入 — 改 postfx.js 加 motion blur uniforms + RT
 *   B) 在 renderer.js 主迴圈 render 完 postfx 後再跑 — 獨立 hook,風險低但需多一次 RT swap
 *
 * 預設 disabled(疊加效果預設關鎖紀律)。
 * console API:__MOTION_BLUR__.enable() / disable() / setIntensity(0.3)
 */

import * as THREE from "./vendor-three.module.js";

const VS_FULLSCREEN = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FS_MOTION_BLUR_BLEND = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D tCurrent;
  uniform sampler2D tPrev;
  uniform float uIntensity;
  void main() {
    vec3 cur = texture2D(tCurrent, vUv).rgb;
    vec3 prev = texture2D(tPrev, vUv).rgb;
    // Linear blend — simple,但對相機移動 / 物件移動均勻糊
    // intensity = 0   → 純 current(無 motion blur)
    // intensity = 1   → 純 prev(完全凍結 — 不該用)
    // intensity = 0.3 → 30% prev / 70% current(自然拖影)
    gl_FragColor = vec4(mix(cur, prev, uIntensity), 1.0);
  }
`;

/**
 * 建立 motion blur 模組。
 *
 * @param {Object} opts
 * @param {THREE.WebGLRenderer} opts.renderer
 * @param {number} opts.width  - canvas 寬(可呼叫 setSize 更新)
 * @param {number} opts.height
 * @param {number} [opts.defaultIntensity=0.0] - 預設 0(disabled,符合疊加效果預設關鎖)
 *
 * @returns {Object} motion blur instance
 *   - apply(inputTex, outputTarget):render motion blur 一 pass。回傳 mixed texture。
 *   - setIntensity(v):0-1
 *   - enable() / disable()
 *   - isEnabled() / getIntensity()
 *   - setSize(w, h):resize 用
 *   - dispose()
 */
export function createMotionBlur({ renderer, width, height, defaultIntensity = 0.0 }) {
  if (!renderer) throw new Error("[motion-blur] renderer is required");

  // 雙緩衝 RT(prev / current 切換)
  const rtA = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const rtB = rtA.clone();

  let prevRT = rtA;
  let curRT = rtB;
  let firstFrame = true;

  // Mix shader material
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      tCurrent: { value: null },
      tPrev: { value: null },
      uIntensity: { value: defaultIntensity },
    },
    vertexShader: VS_FULLSCREEN,
    fragmentShader: FS_MOTION_BLUR_BLEND,
    depthTest: false,
    depthWrite: false,
  });

  // Full-screen quad
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const quadMesh = new THREE.Mesh(quadGeo, mat);
  const quadScene = new THREE.Scene();
  quadScene.add(quadMesh);
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let enabled = false;
  let intensity = defaultIntensity;

  /**
   * 套用 motion blur。
   *
   * 呼叫時機:在 postfx 最終 pass 完成後,把 final tex 傳進來,本函數
   * 跟 prev frame 混合後寫進 outputTarget(若 null 則寫 canvas)。
   *
   * 第一 frame 沒 prev,bypass(直接複製 current 到 prev,不混合)。
   *
   * @param {THREE.Texture} inputTex - 當前 frame 的 final texture
   * @param {THREE.WebGLRenderTarget|null} outputTarget - 寫入目標(null = canvas)
   * @returns {THREE.Texture} 混合後的 texture(若 disabled 則回傳 inputTex)
   */
  function apply(inputTex, outputTarget) {
    if (!enabled || intensity <= 0.001) {
      return inputTex;  // bypass,不做任何 mix
    }

    if (firstFrame) {
      // 第一 frame:把 inputTex 複製到 prevRT 作初始狀態,不 mix
      mat.uniforms.tCurrent.value = inputTex;
      mat.uniforms.tPrev.value = inputTex;
      mat.uniforms.uIntensity.value = 0.0;  // 強制 0,純 current
      renderer.setRenderTarget(prevRT);
      renderer.render(quadScene, quadCamera);
      firstFrame = false;
      // 第一 frame 不寫 outputTarget(讓 postfx 接著跑)
      return inputTex;
    }

    // 第二 frame 起:mix(current, prev, intensity) → curRT
    mat.uniforms.tCurrent.value = inputTex;
    mat.uniforms.tPrev.value = prevRT.texture;
    mat.uniforms.uIntensity.value = intensity;

    renderer.setRenderTarget(curRT);
    renderer.render(quadScene, quadCamera);

    // 把 mix 結果寫到 outputTarget(若指定)
    if (outputTarget !== undefined) {
      // 用 simple copy(若 outputTarget 是 canvas null,renderer 會直接畫到 canvas)
      mat.uniforms.tCurrent.value = curRT.texture;
      mat.uniforms.tPrev.value = curRT.texture;
      mat.uniforms.uIntensity.value = 0.0;  // 純 current copy
      renderer.setRenderTarget(outputTarget);
      renderer.render(quadScene, quadCamera);
    }

    // swap RT(下 frame curRT 變 prevRT)
    const tmp = prevRT;
    prevRT = curRT;
    curRT = tmp;

    return prevRT.texture;
  }

  function setIntensity(v) {
    intensity = Math.max(0, Math.min(1, v));
  }

  function setSize(w, h) {
    rtA.setSize(w, h);
    rtB.setSize(w, h);
    firstFrame = true;  // 尺寸變動 → 重置(不然 prev 跟 cur 尺寸不一致)
  }

  function dispose() {
    rtA.dispose();
    rtB.dispose();
    mat.dispose();
    quadGeo.dispose();
  }

  return {
    apply,
    setIntensity,
    getIntensity: () => intensity,
    enable: () => {
      enabled = true;
      if (intensity <= 0.001) intensity = 0.3;  // 預設 0.3 自然拖影
      console.info(
        "%c[motion-blur] enabled",
        "color:#ffd49c;font-weight:bold;",
        `intensity=${intensity.toFixed(2)}`
      );
    },
    disable: () => {
      enabled = false;
      console.info("%c[motion-blur] disabled", "color:#9cb8e0;");
    },
    isEnabled: () => enabled,
    setSize,
    dispose,
  };
}
