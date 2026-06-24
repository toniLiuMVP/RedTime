/* LM402 clean 角色 一眼瞬間 — 實驗性 overlay（feature flag，預設 OFF）
 *
 * 安全契約：
 *  - 此檔載入時是「純 no-op」：只定義 window.__CLEAN_CHARS__ 這個休眠 API，不建立任何
 *    canvas、不載入任何資產、不碰主場景 renderer。訪客零影響。
 *  - 只有從 console 主動呼叫 window.__CLEAN_CHARS__.enable() 才會建立一個獨立的全螢幕
 *    overlay（自己的 canvas + three.js 場景），載入 clean 綁骨角色一眼瞬間。
 *  - 完全不觸碰 minified renderer.js / 主場景；overlay 疊在最上層，可 disable() 拆除。
 *  - GLB 在 assets/lm402/characters/onelook_scene.glb（已追蹤、會部署）；flag 仍預設 OFF，
 *    訪客零影響，GLB 只在 enable() / ?cleanchars 時才 lazy fetch（.glb 走 STATIC cache-first）。
 *  - enable() 任一步失敗（含 production 上 GLB 不存在）→ 一律走 disable() 完整拆除，
 *    不留卡死 overlay；所有 window listener 用 AbortController 綁，disable() 一次清掉。
 */
(function () {
  'use strict';
  if (window.__CLEAN_CHARS__) return;

  var SCENE_URL = 'assets/lm402/characters/onelook_scene.glb'; // 部署版場景（refined 角色一眼瞬間）
  var state = { enabled: false, root: null, raf: 0, renderer: null, ac: null, observer: null };

  function byMat(obj, re) {
    var out = [];
    obj.traverse(function (o) {
      if (o.isMesh && o.material) {
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        if (mats.some(function (m) { return m && m.name && re.test(m.name); })) out.push(o);
      }
    });
    return out;
  }

  function disable() {
    state.enabled = false;
    if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
    if (state.ac) { try { state.ac.abort(); } catch (e) {} state.ac = null; }   // 一次移除所有 window listener
    if (state.renderer) { try { state.renderer.dispose(); state.renderer.forceContextLoss && state.renderer.forceContextLoss(); } catch (e) {} state.renderer = null; }
    if (state.root && state.root.parentNode) state.root.parentNode.removeChild(state.root);
    state.root = null;
    console.log('[clean-chars] overlay 已關閉');
  }

  async function enable(opts) {
    if (state.enabled) { console.warn('[clean-chars] 已啟用'); return; }
    state.enabled = true;
    var ac = new AbortController(); state.ac = ac; var sig = ac.signal;

    var THREE, GLTFLoader;
    try {
      THREE = await import('./vendor-three.module.js');
      GLTFLoader = (await import('./GLTFLoader.js')).GLTFLoader;
    } catch (e) { console.error('[clean-chars] three.js 模組載入失敗:', e); disable(); return; }

    // 全螢幕 overlay（z-index 拉滿蓋掉 live 頁面文字層）
    var host = document.createElement('div');
    host.id = 'clean-chars-overlay';
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:#b3a79c';
    var cv = document.createElement('canvas');
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    var bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:12px;top:12px;z-index:2147483647;display:flex;gap:8px';
    bar.innerHTML = '<button data-a="look" style="padding:8px 12px;border:0;border-radius:8px;background:#c87f4a;color:#fff">▶ 一眼瞬間</button>'
      + '<button data-a="close" style="padding:8px 12px;border:0;border-radius:8px;background:#2b2b33;color:#fff">關閉</button>';
    host.appendChild(bar);
    document.body.appendChild(host);
    state.root = host;

    var rig = { eyes: [], blush: [], boy: null, girl: null, boyB: null, girlB: null, t: 0, next: 1.5, blink: 1, look: -1 };
    // 關閉按鈕 listener 在任何 await 之前就綁好（GLB 失敗也關得掉）
    bar.addEventListener('click', function (e) {
      var a = e.target && e.target.getAttribute('data-a');
      if (a === 'look') rig.look = 0; else if (a === 'close') disable();
    }, { signal: sig });

    // 行動裝置自適應：降 pixelRatio + 陰影圖，減 GPU 負載（兩個 three.js 場景疊在手機上很吃）
    var mobile = (typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches) || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    var renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !mobile });
    state.renderer = renderer;
    renderer.setPixelRatio(Math.min(mobile ? 1.5 : 2, devicePixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    var scene = new THREE.Scene(); scene.background = new THREE.Color(0xe6e7e2);
    var camera = new THREE.PerspectiveCamera(46, 1, 0.05, 200);
    var sun = new THREE.DirectionalLight(0xfdfbf4, 5.0); sun.position.set(-6, 4, 3.5); sun.target.position.set(0.3, 1.2, 0); sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    var sc = sun.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -1; sc.near = 0.5; sc.far = 20;
    scene.add(sun, sun.target);
    scene.add(new THREE.HemisphereLight(0xeaf0ff, 0x8e887e, 0.72));
    var fill = new THREE.PointLight(0xfff4ea, 7, 6, 2); fill.position.set(0.15, 1.62, 0.85); scene.add(fill);
    var AX_Y = new THREE.Vector3(0, 1, 0), AX_X = new THREE.Vector3(1, 0, 0);
    var qa = function (ax, a) { return new THREE.Quaternion().setFromAxisAngle(ax, a); };

    var g;
    try { g = await new GLTFLoader().loadAsync(SCENE_URL); }
    catch (e) { console.error('[clean-chars] GLB 載入失敗（assets/lm402/characters/onelook_scene.glb）:', e); disable(); return; }
    if (!state.enabled) return;  // disable() 在 await 期間被呼叫
    scene.add(g.scene);
    g.scene.traverse(function (o) { if (o.isMesh) { o.castShadow = !(o.material && o.material.transparent); o.receiveShadow = true; } });
    rig.eyes = byMat(g.scene, /_(w|lash|i|p|hi)(\.\d+)?$/);   // 容忍前綴(z_/y_/f_)+ GLB 尾碼(.001)
    rig.eyes.forEach(function (o) { o.userData.sy0 = o.scale.y; });
    rig.blush = byMat(g.scene, /_blush(\.\d+)?$/);
    rig.blush.forEach(function (o) { o.material = o.material.clone(); o.userData.s0 = o.scale.clone(); o.userData.m = o.material; });
    var heads = [];
    g.scene.updateWorldMatrix(true, true);
    g.scene.traverse(function (o) { if (o.isBone && /^head(\b|[_.]|$)/.test(o.name)) heads.push(o); });
    heads.forEach(function (b) { var v = new THREE.Vector3(); b.getWorldPosition(v); b.userData.wx = v.x; });
    heads.sort(function (a, b) { return a.userData.wx - b.userData.wx; });
    if (heads.length >= 2) { rig.boy = heads[0]; rig.girl = heads[heads.length - 1]; rig.boyB = rig.boy.quaternion.clone(); rig.girlB = rig.girl.quaternion.clone(); }

    var az = 0.95, el = 0.04, dist = 2.3, target = new THREE.Vector3(0, 1.35, 0);
    function applyCam() { camera.position.set(target.x + dist * Math.cos(el) * Math.sin(az), target.y + dist * Math.sin(el), target.z + dist * Math.cos(el) * Math.cos(az)); camera.lookAt(target); }
    var drag = false, px = 0, py = 0;
    cv.addEventListener('pointerdown', function (e) { drag = true; px = e.clientX; py = e.clientY; }, { signal: sig });
    addEventListener('pointerup', function () { drag = false; }, { signal: sig });
    addEventListener('pointermove', function (e) { if (!drag) return; az -= (e.clientX - px) * 0.008; el = Math.max(-0.3, Math.min(1.2, el + (e.clientY - py) * 0.006)); px = e.clientX; py = e.clientY; applyCam(); }, { signal: sig });
    cv.addEventListener('wheel', function (e) { dist = Math.max(0.8, Math.min(7, dist + e.deltaY * 0.002)); applyCam(); e.preventDefault(); }, { passive: false, signal: sig });
    addEventListener('resize', function () { var w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }, { signal: sig });
    renderer.setSize(host.clientWidth, host.clientHeight, false); camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); applyCam();

    var last = performance.now();
    function loop(now) {
      if (!state.enabled) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      rig.t += dt; if (rig.t > rig.next) { rig.blink = 0; rig.t = 0; rig.next = 2 + Math.random() * 3; }
      rig.blink = Math.min(1, rig.blink + dt * 9);
      var ph = rig.blink, open = ph < 0.5 ? 1 - ph / 0.5 : (ph - 0.5) / 0.5, lid = 0.12 + 0.88 * open;
      rig.eyes.forEach(function (o) { o.scale.y = o.userData.sy0 * lid; });
      if (rig.look >= 0) {
        rig.look += dt; var DUR = 6.5, ct = Math.min(1, rig.look / DUR);
        var ss = function (a0, b0, x) { var u = Math.max(0, Math.min(1, (x - a0) / (b0 - a0))); return u * u * (3 - 2 * u); };
        // 拍2 學妹頭先回 → 拍3 學長後抬頭 → 拍4 臉紅墊底 → 運鏡廣角推近
        if (rig.girl) rig.girl.quaternion.copy(rig.girlB).multiply(qa(AX_Y, -0.9 * (1 - ss(0.15, 0.44, ct))));
        if (rig.boy) rig.boy.quaternion.copy(rig.boyB).multiply(qa(AX_X, -0.45 * (1 - ss(0.40, 0.62, ct))));
        var bf = ss(0.55, 0.84, ct);
        rig.blush.forEach(function (o) { o.scale.copy(o.userData.s0).multiplyScalar(1 + 0.42 * bf); var em = o.userData.m.emissive; if (em) em.setRGB(0.6 * bf, 0.2 * bf, 0.17 * bf); });
        var KF = [[0.0, 0.75, 0.12, 4.0, 0, 1.10], [0.42, 0.95, 0.05, 2.2, 0, 1.40], [0.68, 0.98, 0.04, 1.6, 0.0, 1.48], [1.0, 1.02, 0.04, 1.22, 0.0, 1.50]];
        var ki = 0; while (ki < KF.length - 1 && ct > KF[ki + 1][0]) ki++;
        var ka = KF[ki], kb = KF[Math.min(ki + 1, KF.length - 1)], ku = ss(ka[0], kb[0], ct);
        az = ka[1] + (kb[1] - ka[1]) * ku; el = ka[2] + (kb[2] - ka[2]) * ku; dist = ka[3] + (kb[3] - ka[3]) * ku;
        target.set(ka[4] + (kb[4] - ka[4]) * ku, ka[5] + (kb[5] - ka[5]) * ku, 0); applyCam();
        if (rig.look > DUR + 2.5) { rig.look = -1; if (rig.boy) rig.boy.quaternion.copy(rig.boyB); if (rig.girl) rig.girl.quaternion.copy(rig.girlB); }
      }
      renderer.render(scene, camera); state.raf = requestAnimationFrame(loop);
    }
    state.raf = requestAnimationFrame(loop);
    if (opts && opts.autoLook) rig.look = 0;   // 接 beat 自動觸發時直接播回頭
    console.log('[clean-chars] overlay 已啟用｜眼件 ' + rig.eyes.length + '、臉紅 ' + rig.blush.length + '、head 骨 ' + heads.length);
  }

  // ── Stage 3:非侵入接 live 11:00 一眼瞬間 beat ──
  // acts.js gaze() climax（玩家撐住凝視成功）會 append 一個 .gaze-flash 元素（只此一處）。
  // armed 時用 MutationObserver 偵測它出現 → 自動觸發 overlay。零編輯任何 live 檔。
  // 預設不 arm（純 no-op）；需 window.__CLEAN_CHARS__.arm() 才掛 observer。
  function arm() {
    if (state.observer) { console.warn('[clean-chars] 已 armed'); return; }
    var obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType === 1 && ((n.classList && n.classList.contains('gaze-flash')) || (n.querySelector && n.querySelector('.gaze-flash')))) {
            disarm();
            console.log('[clean-chars] 偵測到 11:00 一眼 climax → 觸發 overlay');
            enable({ autoLook: true });
            return;
          }
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    state.observer = obs;
    console.log('[clean-chars] armed:等待 11:00 一眼瞬間 climax（撐住凝視成功時自動觸發）');
  }
  function disarm() {
    if (state.observer) { state.observer.disconnect(); state.observer = null; console.log('[clean-chars] disarmed'); }
  }

  // 休眠 API：載入時不做任何事，等 console 呼叫 enable()
  window.__CLEAN_CHARS__ = {
    enable: enable,
    disable: disable,
    arm: arm,         // 接 live 11:00 beat：armed 後撐住凝視成功會自動觸發
    disarm: disarm,
    get enabled() { return state.enabled; },
    get armed() { return !!state.observer; }
  };

  // 測試入口（沿用專案 ?debug / ?webgpu=1 慣例）：無參數 = 純 no-op（訪客零影響）。
  // ?cleanchars=look → 載入後直接開 overlay；?cleanchars=arm → 接真實 11:00 beat。
  // 手機沒 console，靠此 URL 參數做真機 QA。
  try {
    var q = new URLSearchParams(location.search).get('cleanchars');
    if (q === 'look' || q === '1' || q === 'on') addEventListener('load', function () { enable({ autoLook: true }); });
    else if (q === 'arm') addEventListener('load', arm);
  } catch (e) {}
})();
