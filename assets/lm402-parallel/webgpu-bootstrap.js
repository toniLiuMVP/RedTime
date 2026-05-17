/**
 * webgpu-bootstrap.js — 平行世界 WebGPU 啟動器（F1 simplified）
 *
 * 第一階段：WebGPU 偵測 + fallback 提示。
 * 真正的 WebGPURenderer 改造留待 F1.2 / F2 / F3 dedicated sprint。
 *
 * 用法（lm402-parallel.html head 內）：
 *   import { detectWebGPU, showWebGPUFallback } from './assets/lm402-parallel/webgpu-bootstrap.js';
 *   const r = await detectWebGPU();
 *   if (!r.supported) showWebGPUFallback(r.reason);
 *   else console.log('[WebGPU] ready, adapter:', r.adapter);
 */

/**
 * 偵測 WebGPU 是否可用
 * @returns {Promise<{ supported: boolean, reason?: string, adapter?: GPUAdapter }>}
 */
export async function detectWebGPU() {
  if (!("gpu" in navigator)) {
    return { supported: false, reason: "navigator.gpu 不存在（瀏覽器不支援 WebGPU API）" };
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return { supported: false, reason: "navigator.gpu.requestAdapter() 回傳 null（系統 GPU 未啟用 WebGPU）" };
    }
    return { supported: true, adapter };
  } catch (e) {
    return { supported: false, reason: `WebGPU 初始化失敗：${e.message}` };
  }
}

/**
 * 顯示 fallback overlay：列出支援需求 + 引導切換到原始時間線/雙時空
 */
export function showWebGPUFallback(reason) {
  const overlay = document.createElement("div");
  overlay.id = "lm402-webgpu-fallback";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "linear-gradient(180deg, #1a1820 0%, #2a2228 100%)",
    color: "#f4eee0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Noto Serif TC', 'PingFang TC', serif",
    padding: "40px",
    textAlign: "center",
    zIndex: "99999",
  });

  const title = document.createElement("h1");
  title.textContent = "LM402 平行世界";
  Object.assign(title.style, {
    fontSize: "26px",
    marginBottom: "12px",
    color: "#ffd49c",
    letterSpacing: "0.06em",
    fontWeight: "500",
  });
  overlay.appendChild(title);

  const subtitle = document.createElement("p");
  subtitle.textContent = "用 WebGPU 重新繪製學妹學長的精緻版本";
  Object.assign(subtitle.style, {
    fontSize: "14px",
    marginBottom: "32px",
    opacity: "0.55",
    letterSpacing: "0.04em",
  });
  overlay.appendChild(subtitle);

  const requirements = document.createElement("div");
  Object.assign(requirements.style, {
    fontSize: "16px",
    lineHeight: "1.85",
    maxWidth: "480px",
    opacity: "0.88",
    marginBottom: "32px",
  });

  const intro = document.createElement("p");
  intro.textContent = "這個版本使用 WebGPU（下世代 GPU API），需要：";
  intro.style.marginBottom = "16px";
  requirements.appendChild(intro);

  const browserList = document.createElement("ul");
  Object.assign(browserList.style, {
    listStyle: "none",
    padding: "0",
    margin: "0 auto 16px",
    textAlign: "left",
    display: "inline-block",
  });
  ["Chrome 113+ / Edge 113+", "Safari 17.4+（macOS Sonoma+）", "Firefox 141+（2025 預計）"].forEach((b) => {
    const li = document.createElement("li");
    li.textContent = "• " + b;
    li.style.padding = "4px 0";
    browserList.appendChild(li);
  });
  requirements.appendChild(browserList);

  if (reason) {
    const reasonEl = document.createElement("p");
    reasonEl.textContent = `偵測訊息：${reason}`;
    Object.assign(reasonEl.style, {
      fontSize: "13px",
      opacity: "0.5",
      fontStyle: "italic",
      marginTop: "16px",
    });
    requirements.appendChild(reasonEl);
  }
  overlay.appendChild(requirements);

  const btnRow = document.createElement("div");
  Object.assign(btnRow.style, {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "center",
  });

  const mainBtn = document.createElement("a");
  mainBtn.href = "lm402.html";
  mainBtn.textContent = "→ 前往 LM402 原始時間線";
  Object.assign(mainBtn.style, {
    padding: "14px 36px",
    background: "#ffd49c",
    color: "#1a1820",
    textDecoration: "none",
    borderRadius: "4px",
    fontWeight: "500",
    fontSize: "16px",
    letterSpacing: "0.04em",
  });
  btnRow.appendChild(mainBtn);

  const twinBtn = document.createElement("a");
  twinBtn.href = "lm402-twin.html";
  twinBtn.textContent = "⏳ 前往 LM402 雙時空";
  Object.assign(twinBtn.style, {
    padding: "12px 32px",
    background: "rgba(255,212,156,0.16)",
    color: "#ffd49c",
    textDecoration: "none",
    borderRadius: "4px",
    fontSize: "15px",
    border: "1px solid rgba(255,212,156,0.3)",
  });
  btnRow.appendChild(twinBtn);

  overlay.appendChild(btnRow);
  document.body.appendChild(overlay);
}

/**
 * 顯示「WebGPU ready」提示（給 dev 看）— 真 WebGPU renderer 還沒做
 */
export function showWebGPUPlaceholder(adapter) {
  const overlay = document.createElement("div");
  overlay.id = "lm402-webgpu-placeholder";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "linear-gradient(180deg, #0a1018 0%, #1a2030 100%)",
    color: "#f4eee0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Noto Serif TC', 'PingFang TC', serif",
    padding: "40px",
    textAlign: "center",
    zIndex: "99999",
  });

  const title = document.createElement("h1");
  title.textContent = "🌌 LM402 平行世界";
  Object.assign(title.style, {
    fontSize: "32px",
    marginBottom: "12px",
    color: "#a8c5ff",
    letterSpacing: "0.06em",
    fontWeight: "500",
  });
  overlay.appendChild(title);

  const subtitle = document.createElement("p");
  subtitle.textContent = "建置中";
  Object.assign(subtitle.style, {
    fontSize: "16px",
    marginBottom: "32px",
    opacity: "0.7",
    letterSpacing: "0.04em",
  });
  overlay.appendChild(subtitle);

  if (adapter) {
    const adapterInfo = document.createElement("div");
    Object.assign(adapterInfo.style, {
      fontSize: "12px",
      opacity: "0.4",
      marginBottom: "24px",
      fontFamily: "ui-monospace, Menlo, monospace",
    });
    adapterInfo.textContent = `GPU adapter: ${adapter.name || "(unnamed)"}`;
    overlay.appendChild(adapterInfo);
  }

  const btnRow = document.createElement("div");
  Object.assign(btnRow.style, {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
  });

  ["lm402.html", "lm402-twin.html"].forEach((href, i) => {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = i === 0 ? "→ LM402 原始時間線" : "⏳ LM402 雙時空";
    Object.assign(a.style, {
      padding: "12px 28px",
      background: i === 0 ? "#ffd49c" : "rgba(168,197,255,0.16)",
      color: i === 0 ? "#1a1820" : "#a8c5ff",
      textDecoration: "none",
      borderRadius: "4px",
      fontSize: "15px",
      border: i === 0 ? "none" : "1px solid rgba(168,197,255,0.3)",
    });
    btnRow.appendChild(a);
  });
  overlay.appendChild(btnRow);

  document.body.appendChild(overlay);
}

/**
 * F2 起步:WebGPURenderer standalone smoke test
 * 不影響主 runtime — 在 hidden offscreen canvas 跑一個 cube,證明 WebGPU stack 完整 work
 *
 * Console call:`__WEBGPU_DEMO__()` 啟動 smoke test
 *
 * @returns {Promise<{success: boolean, frames: number, ms: number, fps?: number, error?: string}>}
 */
export async function runWebGPUSmokeTest() {
  const detection = await detectWebGPU();
  if (!detection.supported) {
    return { success: false, frames: 0, ms: 0, error: detection.reason };
  }

  // 動態 import vendor(避免主 runtime 載入 webgpu vendor)
  const THREE = await import("./vendor/three.webgpu.min.js");

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  let renderer = null;
  let frames = 0;
  const t0 = performance.now();

  try {
    renderer = new THREE.WebGPURenderer({ canvas, antialias: false });
    await renderer.init();
    renderer.setSize(64, 64, false);
    renderer.setClearColor(0x1a1820, 1);

    const scene = new THREE.Scene();
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffd49c })
    );
    scene.add(cube);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);

    for (let i = 0; i < 60; i++) {
      cube.rotation.y = i * 0.05;
      await renderer.renderAsync(scene, camera);
      frames++;
    }

    const ms = performance.now() - t0;
    const fps = frames / (ms / 1000);
    console.info(
      "%c[WebGPU smoke test] success",
      "color:#a8c5ff;font-weight:bold;",
      `\n  REVISION=${THREE.REVISION}` +
      `\n  frames=${frames}` +
      `\n  ms=${ms.toFixed(1)}` +
      `\n  fps=${fps.toFixed(1)}`
    );

    cube.geometry.dispose();
    cube.material.dispose();
    renderer.dispose();

    return { success: true, frames, ms, fps };
  } catch (err) {
    console.error("[WebGPU smoke test] failed:", err);
    return { success: false, frames, ms: performance.now() - t0, error: err.message };
  }
}

if (typeof window !== "undefined") {
  window.__WEBGPU_DEMO__ = runWebGPUSmokeTest;
}
