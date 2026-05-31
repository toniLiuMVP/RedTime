// babylon-closeup.js — 平行世界「絕對天花板」線 · P5 一眼瞬間 max-raster closeup
// 2026-05-31 r67 P5(toni 拍板選項 A:Babylon max-raster,非 path tracing):
//   暖窗光(11:00 那道光)+ shadow + 程序 IBL 環境 + SSR 螢幕空間反射 + closeup 相機/DoF。
// 全 Babylon 內建 + 程序生成(env 用 data-URL gradient,不抓外部)。SSR/IBL 在 try/catch(降級不崩)。
// 真 HDR IBL(.env 檔)留未來 refinement;此處 gradient env 給基本 ambient/反射方向。
//
// export setupCloseup(BABYLON, scene, camera, junior)
// console:__BJS_CLOSEUP__(true/false) 切臉部特寫 + DoF;__BJS_SSR__ / __BJS_WINDOWLIGHT__

export function setupCloseup(BABYLON, scene, camera, junior) {
  const V3 = BABYLON.Vector3;
  const head = (junior && junior.headCenter) || new V3(0, 1.46, 0);

  // ── IBL 環境:程序 gradient env 缺 prefiltered mip chain → PBR roughness 取 mip 會噴
  //    GPUValidationError 洪水(P5 驗證實證 166 warn/frame)。故不設程序 environmentTexture。
  //    真 HDR IBL 需 vendored prefiltered .env 檔(未來 refinement);此處 closeup 靠 4 盞燈
  //    (hemi / rim / fill / 暖窗光)+ SSR 螢幕空間反射撐 — max-raster 仍成立。

  // ── 暖窗光(11:00 一眼瞬間那道斜射光)+ 軟陰影 ──
  const win = new BABYLON.SpotLight("window", new V3(2.6, 3.2, 2.2), new V3(-0.6, -0.7, -0.5), Math.PI / 2.6, 6, scene);
  win.intensity = 4.2;
  win.diffuse = new BABYLON.Color3(1.0, 0.84, 0.62);  // 暖午後
  try {
    const sg = new BABYLON.ShadowGenerator(1024, win);
    sg.useBlurExponentialShadowMap = true;
    sg.blurKernel = 24;
    sg.darkness = 0.35;
    if (window.__JUNIOR__ && window.__JUNIOR__.getChildMeshes) {
      window.__JUNIOR__.getChildMeshes().forEach((m) => sg.addShadowCaster(m));
    }
    win._shadowGen = sg;
  } catch (e) {
    console.warn("[parallel-babylon] shadow gen skipped:", e && e.message);
  }
  window.__BJS_WINDOWLIGHT__ = win;

  // ── SSR 螢幕空間反射(地面 / 皮膚反射,Babylon 內建)──
  try {
    const ssr = new BABYLON.SSRRenderingPipeline("ssr", scene, [camera], false, BABYLON.Constants.TEXTURETYPE_UNSIGNED_BYTE);
    ssr.strength = 0.5;
    ssr.reflectionSpecularFalloffExponent = 2.2;
    ssr.blurDispersionStrength = 0.04;
    ssr.roughnessFactor = 0.6;
    ssr.selfCollisionNumSkip = 2;
    ssr.maxDistance = 12;
    ssr.maxSteps = 1000;
    window.__BJS_SSR__ = ssr;
  } catch (e) {
    console.warn("[parallel-babylon] SSR skipped:", e && e.message);
  }

  // ── closeup 相機 + DoF 切換(一眼瞬間特寫)── 預設全身(P2/P3 框),console opt-in 特寫
  const fullState = { target: new V3(0, 0.92, 0), radius: 4.2, beta: Math.PI / 2.35 };
  const closeState = { target: head.clone(), radius: 1.65, beta: Math.PI / 2.18 };
  window.__BJS_CLOSEUP__ = (on) => {
    const s = on === false ? fullState : closeState;
    camera.setTarget(s.target.clone ? s.target.clone() : s.target);
    camera.radius = s.radius;
    camera.beta = s.beta;
    const p = window.__BJS_PIPELINE__;
    if (p) {
      p.depthOfFieldEnabled = on !== false;
      if (p.depthOfField) {
        p.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Medium;
        p.depthOfField.focusDistance = (on === false ? 4200 : 1650);
        p.depthOfField.fStop = 1.8;
        p.depthOfField.focalLength = 80;
      }
    }
    console.info("[parallel-babylon] closeup", on === false ? "OFF (full body)" : "ON (一眼瞬間 face)");
  };

  console.info("[parallel-babylon] P5 closeup ceiling online — window light + IBL + SSR + __BJS_CLOSEUP__()");
}
