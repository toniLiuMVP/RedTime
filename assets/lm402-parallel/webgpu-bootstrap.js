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
  // 注入一次性 style sheet — 對齊 index.html 設計系統(grain / radial / fadeUp / palette)
  if (!document.getElementById("lm402-webgpu-placeholder-style")) {
    const style = document.createElement("style");
    style.id = "lm402-webgpu-placeholder-style";
    style.textContent = `
      #lm402-webgpu-placeholder {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: clamp(40px, 8vw, 80px);
        text-align: center;
        color: #eae6de;
        font-family: "Noto Serif TC", "PingFang TC", serif;
        background:
          radial-gradient(ellipse 90% 70% at 50% 30%, rgba(8, 28, 14, 0.95) 0%, transparent 65%),
          radial-gradient(ellipse 60% 60% at 20% 80%, rgba(8, 6, 18, 0.8) 0%, transparent 50%),
          radial-gradient(ellipse 70% 50% at 80% 90%, rgba(16, 8, 4, 0.7) 0%, transparent 50%),
          #050508;
      }
      #lm402-webgpu-placeholder::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
        background-size: 200px 200px;
        opacity: 0.55;
        mix-blend-mode: overlay;
      }
      #lm402-webgpu-placeholder::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background:
          radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(5,5,8,0.6) 100%),
          linear-gradient(180deg, rgba(5,5,8,0.3) 0%, transparent 12%, transparent 88%, rgba(5,5,8,0.5) 100%);
      }
      #lm402-webgpu-placeholder > * { position: relative; z-index: 2; }

      #lm402-webgpu-placeholder .pl-eyebrow {
        font-family: "DM Mono", monospace;
        font-size: 10px;
        letter-spacing: 0.5em;
        text-transform: uppercase;
        color: #8c8a88;
        margin-bottom: 28px;
        opacity: 0;
        animation: plFadeUp 0.9s 0.2s forwards;
      }
      #lm402-webgpu-placeholder .pl-title {
        font-family: "Noto Serif TC", serif;
        font-weight: 400;
        font-size: clamp(2rem, 5vw, 3rem);
        letter-spacing: 0.08em;
        color: #eae6de;
        margin: 0 0 22px;
        opacity: 0;
        animation: plFadeUp 0.9s 0.4s forwards;
      }
      #lm402-webgpu-placeholder .pl-sub {
        font-family: "Cormorant Garamond", serif;
        font-style: italic;
        font-size: clamp(1.05rem, 2vw, 1.3rem);
        letter-spacing: 0.04em;
        color: #b4b0a8;
        margin: 0 0 36px;
        opacity: 0;
        animation: plFadeUp 0.9s 0.6s forwards;
      }
      #lm402-webgpu-placeholder .pl-adapter {
        font-family: "DM Mono", monospace;
        font-size: 9.5px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: rgba(140, 138, 136, 0.55);
        margin-bottom: 32px;
        opacity: 0;
        animation: plFadeUp 0.9s 0.7s forwards;
      }
      #lm402-webgpu-placeholder .pl-btn-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
        opacity: 0;
        animation: plFadeUp 0.9s 0.8s forwards;
      }
      #lm402-webgpu-placeholder .pl-btn {
        font-family: "DM Mono", monospace;
        font-size: 9.5px;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        padding: 11px 22px;
        border-radius: 3px;
        background: rgba(22, 168, 100, 0.06);
        color: #16a864;
        border: 1px solid rgba(22, 168, 100, 0.4);
        text-decoration: none;
        transition: background 0.18s, border-color 0.18s, color 0.18s;
      }
      #lm402-webgpu-placeholder .pl-btn:hover,
      #lm402-webgpu-placeholder .pl-btn:focus-visible {
        background: rgba(22, 168, 100, 0.14);
        border-color: rgba(22, 168, 100, 0.65);
        outline: none;
      }
      #lm402-webgpu-placeholder .pl-btn-ghost {
        background: transparent;
        color: #8c8a88;
        border-color: rgba(234, 230, 222, 0.14);
      }
      #lm402-webgpu-placeholder .pl-btn-ghost:hover,
      #lm402-webgpu-placeholder .pl-btn-ghost:focus-visible {
        color: #eae6de;
        background: rgba(234, 230, 222, 0.04);
        border-color: rgba(234, 230, 222, 0.32);
      }
      @keyframes plFadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        #lm402-webgpu-placeholder .pl-eyebrow,
        #lm402-webgpu-placeholder .pl-title,
        #lm402-webgpu-placeholder .pl-sub,
        #lm402-webgpu-placeholder .pl-adapter,
        #lm402-webgpu-placeholder .pl-btn-row {
          animation: none;
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement("div");
  overlay.id = "lm402-webgpu-placeholder";

  const eyebrow = document.createElement("div");
  eyebrow.className = "pl-eyebrow";
  eyebrow.textContent = "LM402 · PARALLEL · WebGPU";
  overlay.appendChild(eyebrow);

  const title = document.createElement("h1");
  title.className = "pl-title";
  title.textContent = "🌌 LM402 平行世界";
  overlay.appendChild(title);

  const subtitle = document.createElement("p");
  subtitle.className = "pl-sub";
  subtitle.textContent = "建置中";
  overlay.appendChild(subtitle);

  if (adapter) {
    const adapterInfo = document.createElement("div");
    adapterInfo.className = "pl-adapter";
    adapterInfo.textContent = `GPU · ${adapter.name || "ready"}`;
    overlay.appendChild(adapterInfo);
  }

  const btnRow = document.createElement("div");
  btnRow.className = "pl-btn-row";

  const links = [
    { href: "lm402.html", text: "→ LM402 原始時間線", primary: true },
    { href: "lm402-twin.html", text: "⏳ LM402 雙時空", primary: false },
    { href: "lm402-time.html", text: "← 回三線選擇", primary: false },
  ];
  for (const { href, text, primary } of links) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    a.className = primary ? "pl-btn" : "pl-btn pl-btn-ghost";
    btnRow.appendChild(a);
  }
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
