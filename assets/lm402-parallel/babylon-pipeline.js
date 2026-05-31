// babylon-pipeline.js — 平行世界「絕對天花板」線 · P3 後製 + 光影管線(Babylon 內建,原生 WGSL)
// 2026-05-31 r67 P3:DefaultRenderingPipeline(bloom / ACES tonemap / FXAA / grain / CA / DoF)
//                  + SSAO2RenderingPipeline + cinematic 3-point 補光。
// 全用 Babylon 9.x 內建管線(2024 起原生 WGSL)→ 不觸發 glslang/twgsl CDN 載入 → CSP-safe。
// DoF 預設關(console opt-in:__BJS_PIPELINE__.depthOfFieldEnabled = true)— 臉部景深盲調易過糊。
//
// export setupPipeline(BABYLON, scene, camera, focusTarget) → { pipeline, ssao }
// console 微調:__BJS_PIPELINE__ / __BJS_SSAO__ / __BJS_LIGHTS__

export function setupPipeline(BABYLON, scene, camera, focusTarget) {
  const V3 = BABYLON.Vector3;
  const C3 = BABYLON.Color3;

  // ── cinematic 補光:暖 key + 冷 fill + rim(一眼瞬間「又燙又美」暖調)──
  const rim = new BABYLON.DirectionalLight("rim", new V3(0.4, -0.2, 0.9), scene);
  rim.intensity = 1.1;
  rim.diffuse = new C3(1.0, 0.86, 0.72);   // 暖背光勾邊
  const fill = new BABYLON.HemisphericLight("fill", new V3(-0.3, 0.6, -0.4), scene);
  fill.intensity = 0.35;
  fill.diffuse = new C3(0.72, 0.8, 1.0);    // 冷補光(對比暖 key)
  fill.specular = new C3(0, 0, 0);
  window.__BJS_LIGHTS__ = { rim, fill };

  // ── DefaultRenderingPipeline(HDR)──
  const pipeline = new BABYLON.DefaultRenderingPipeline("ceiling-drp", true, scene, [camera]);

  // 抗鋸齒
  pipeline.fxaaEnabled = true;
  pipeline.samples = 4;

  // tone mapping + 影像處理(ACES,電影感)
  pipeline.imageProcessingEnabled = true;
  const ip = pipeline.imageProcessing;
  ip.toneMappingEnabled = true;
  ip.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
  ip.exposure = 1.12;
  ip.contrast = 1.16;
  ip.vignetteEnabled = true;
  ip.vignetteWeight = 2.4;
  ip.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);

  // bloom(保守,白塊紀律:threshold 高 + weight 低,不過曝)
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.84;
  pipeline.bloomWeight = 0.26;
  pipeline.bloomKernel = 64;
  pipeline.bloomScale = 0.5;

  // film grain(細微)
  pipeline.grainEnabled = true;
  pipeline.grain.intensity = 5;
  pipeline.grain.animated = true;

  // chromatic aberration(細微邊緣色散)
  pipeline.chromaticAberrationEnabled = true;
  pipeline.chromaticAberration.aberrationAmount = 10;
  pipeline.chromaticAberration.radialIntensity = 0.6;

  // depth of field — 預設關(臉部景深盲調易過糊,console opt-in 給 toni 真機調)
  pipeline.depthOfFieldEnabled = false;
  pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Medium;
  if (pipeline.depthOfField) {
    pipeline.depthOfField.focalLength = 50;
    pipeline.depthOfField.fStop = 2.2;
    pipeline.depthOfField.focusDistance = 4200; // 對焦 ~4.2 單位(相機半徑),真機微調
  }

  // ── SSAO2(接觸陰影,內建 WGSL)──
  let ssao = null;
  try {
    ssao = new BABYLON.SSAO2RenderingPipeline("ceiling-ssao", scene, { ssaoRatio: 0.75, blurRatio: 1 }, [camera]);
    ssao.radius = 0.6;
    ssao.totalStrength = 1.0;
    ssao.base = 0.12;
    ssao.samples = 16;
    ssao.maxZ = 60;
    ssao.expensiveBlur = true;
  } catch (e) {
    console.warn("[parallel-babylon] SSAO2 init skipped:", e && e.message);
  }

  window.__BJS_PIPELINE__ = pipeline;
  window.__BJS_SSAO__ = ssao;
  console.info("[parallel-babylon] P3 pipeline online — bloom/ACES/SSAO2/grain/CA (DoF opt-in)");
  return { pipeline, ssao };
}
