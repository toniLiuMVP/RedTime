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
  // r45 (toni request):整體優化對齊 index.html 首頁視覺風格 + 移除 emoji 圖案
  // 設計 tokens 對齊 index:--ink/--parchment/--warm/--mist/--jade/--rose + Noto Serif TC + Cormorant Garamond + DM Mono
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
          radial-gradient(ellipse 80% 60% at 50% 40%, rgba(10, 32, 18, 0.92) 0%, transparent 60%),
          radial-gradient(ellipse 50% 70% at 75% 50%, rgba(80, 18, 28, 0.18) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 20% 85%, rgba(10, 8, 20, 0.7) 0%, transparent 50%),
          #050508;
      }
      /* film grain texture (對齊 index.html) */
      #lm402-webgpu-placeholder::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
        background-size: 200px 200px;
        opacity: 0.5;
        mix-blend-mode: overlay;
      }
      /* LM402 紅光線 hint(對應紅線敘事,從右側微微滲入)*/
      #lm402-webgpu-placeholder::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background:
          radial-gradient(ellipse 35% 8% at 95% 52%, rgba(224, 72, 96, 0.28) 0%, transparent 70%),
          radial-gradient(ellipse 80% 80% at 50% 50%, transparent 45%, rgba(5,5,8,0.55) 100%),
          linear-gradient(180deg, rgba(5,5,8,0.25) 0%, transparent 14%, transparent 86%, rgba(5,5,8,0.45) 100%);
      }
      #lm402-webgpu-placeholder > * { position: relative; z-index: 2; }

      #lm402-webgpu-placeholder .pl-eyebrow {
        font-family: "DM Mono", monospace;
        font-size: 11px;
        letter-spacing: 0.55em;
        text-transform: uppercase;
        color: #8c8a88;
        margin: 0 0 18px;
        opacity: 0;
        animation: plFadeUp 0.9s 0.15s forwards;
      }
      #lm402-webgpu-placeholder .pl-en {
        font-family: "Cormorant Garamond", serif;
        font-style: italic;
        font-weight: 300;
        font-size: clamp(0.95rem, 1.6vw, 1.15rem);
        letter-spacing: 0.18em;
        color: rgba(234, 230, 222, 0.62);
        margin: 0 0 18px;
        opacity: 0;
        animation: plFadeUp 0.9s 0.3s forwards;
      }
      #lm402-webgpu-placeholder .pl-title {
        font-family: "Noto Serif TC", "PingFang TC", serif;
        font-weight: 300;
        font-size: clamp(2.6rem, 7vw, 4.2rem);
        letter-spacing: 0.22em;
        line-height: 1.15;
        color: #eae6de;
        margin: 0 0 28px;
        opacity: 0;
        animation: plFadeUp 1.0s 0.45s forwards;
        text-shadow: 0 0 30px rgba(22, 168, 100, 0.12);
      }
      #lm402-webgpu-placeholder .pl-divider {
        width: 64px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(234, 230, 222, 0.35), transparent);
        margin: 0 auto 26px;
        opacity: 0;
        animation: plFadeUp 0.9s 0.6s forwards;
      }
      #lm402-webgpu-placeholder .pl-sub {
        font-family: "Noto Serif TC", serif;
        font-weight: 300;
        font-size: clamp(1rem, 1.6vw, 1.18rem);
        letter-spacing: 0.08em;
        line-height: 1.85;
        color: #b4b0a8;
        max-width: 540px;
        margin: 0 auto 32px;
        opacity: 0;
        animation: plFadeUp 0.9s 0.75s forwards;
      }
      #lm402-webgpu-placeholder .pl-adapter {
        font-family: "DM Mono", monospace;
        font-size: 9.5px;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        color: rgba(22, 168, 100, 0.55);
        margin: 0 0 38px;
        padding: 6px 14px;
        border: 1px solid rgba(22, 168, 100, 0.18);
        border-radius: 2px;
        display: inline-block;
        opacity: 0;
        animation: plFadeUp 0.9s 0.9s forwards;
      }
      #lm402-webgpu-placeholder .pl-btn-row {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        justify-content: center;
        opacity: 0;
        animation: plFadeUp 0.9s 1.0s forwards;
      }
      #lm402-webgpu-placeholder .pl-btn {
        font-family: "DM Mono", monospace;
        font-size: 11px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        padding: 14px 28px;
        border-radius: 2px;
        background: rgba(22, 168, 100, 0.08);
        color: #16a864;
        border: 1px solid rgba(22, 168, 100, 0.45);
        text-decoration: none;
        transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
        cursor: pointer;
      }
      #lm402-webgpu-placeholder .pl-btn:hover,
      #lm402-webgpu-placeholder .pl-btn:focus-visible {
        background: rgba(22, 168, 100, 0.18);
        border-color: rgba(22, 168, 100, 0.75);
        color: #25c878;
        transform: translateY(-1px);
        outline: none;
      }
      #lm402-webgpu-placeholder .pl-btn-ghost {
        background: transparent;
        color: #8c8a88;
        border-color: rgba(234, 230, 222, 0.16);
      }
      #lm402-webgpu-placeholder .pl-btn-ghost:hover,
      #lm402-webgpu-placeholder .pl-btn-ghost:focus-visible {
        color: #eae6de;
        background: rgba(234, 230, 222, 0.05);
        border-color: rgba(234, 230, 222, 0.36);
        transform: translateY(-1px);
      }
      @keyframes plFadeUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        #lm402-webgpu-placeholder .pl-eyebrow,
        #lm402-webgpu-placeholder .pl-en,
        #lm402-webgpu-placeholder .pl-title,
        #lm402-webgpu-placeholder .pl-divider,
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
  eyebrow.textContent = "LM402 · 平行時間線";
  overlay.appendChild(eyebrow);

  const en = document.createElement("div");
  en.className = "pl-en";
  en.textContent = "The Parallel World";
  overlay.appendChild(en);

  const title = document.createElement("h1");
  title.className = "pl-title";
  title.textContent = "平行世界";
  overlay.appendChild(title);

  const divider = document.createElement("div");
  divider.className = "pl-divider";
  overlay.appendChild(divider);

  const subtitle = document.createElement("p");
  subtitle.className = "pl-sub";
  // 安全 DOM (避免 innerHTML XSS):textContent + <br> element 構造
  subtitle.appendChild(document.createTextNode("用 WebGPU,重新繪製學妹學長的精緻版本。"));
  subtitle.appendChild(document.createElement("br"));
  subtitle.appendChild(document.createTextNode("渲染管線正在悄悄成形,先從另一條路看見那一秒。"));
  overlay.appendChild(subtitle);

  if (adapter) {
    const adapterInfo = document.createElement("div");
    adapterInfo.className = "pl-adapter";
    adapterInfo.textContent = `GPU · ${adapter.name || "ready"}`;
    overlay.appendChild(adapterInfo);
  }

  const btnRow = document.createElement("div");
  btnRow.className = "pl-btn-row";

  // CTA:primary 雙時空(toni 主推副本)+ 原始時間線 + 回三線
  const links = [
    { href: "lm402-twin.html", text: "→ 走進雙時空", primary: true },
    { href: "lm402.html", text: "原始時間線", primary: false },
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
  let cube = null;
  let frames = 0;
  const t0 = performance.now();

  // Fix 6 (r29 Codex finding):safe error serialization(非 Error throw 也能讀 message)
  const safeErrorMessage = (e) => {
    if (e == null) return "unknown";
    if (e instanceof Error) return e.message || String(e);
    if (typeof e === "string") return e;
    try { return JSON.stringify(e); } catch { return String(e); }
  };

  try {
    renderer = new THREE.WebGPURenderer({ canvas, antialias: false });
    await renderer.init();
    renderer.setSize(64, 64, false);
    renderer.setClearColor(0x1a1820, 1);

    const scene = new THREE.Scene();
    cube = new THREE.Mesh(
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

    return { success: true, frames, ms, fps };
  } catch (err) {
    console.error("[WebGPU smoke test] failed:", err);
    return { success: false, frames, ms: performance.now() - t0, error: safeErrorMessage(err) };
  } finally {
    // Fix 6 (r29):finally 保證 dispose,init / render 中途錯也釋放 GPU 資源
    try { cube?.geometry?.dispose(); } catch {}
    try { cube?.material?.dispose(); } catch {}
    try { renderer?.dispose(); } catch {}
  }
}

if (typeof window !== "undefined") {
  window.__WEBGPU_DEMO__ = runWebGPUSmokeTest;
}
