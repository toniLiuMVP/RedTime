/**
 * polaroid.js — LM402 拍立得拍照模式（E10）
 *
 * 給玩家「把當下畫面變成有年份戳記的紀念品」的功能。
 *
 * 流程：
 *   點按鈕 → toDataURL 拿 canvas 像素（renderer 已設 preserveDrawingBuffer:true）
 *   → 畫到 offscreen canvas + 拍立得邊框 + 年份戳 + 副標 + 時間戳
 *   → toBlob 觸發瀏覽器下載
 *
 * 拍立得設計：
 *   - 比例：3:4 ≈ 經典 polaroid
 *   - 上 + 左右邊框 36px、下方 130px（戳記區）
 *   - 米白漸層 #fcf9f0 → #f4eee0（老照片質感）
 *   - 大字年份（Cormorant Garamond 56px）
 *   - 副標「LM402 · 一眼瞬間」（Noto Serif TC 20px）
 *   - 右下角微傾斜時間戳（橡皮章感）
 *
 * 公開 API：
 *   const cam = createPolaroidCapture({ getCanvas, getYear, subtitle });
 *   cam.snap();             → 回傳已畫好的 polaroid canvas（用於預覽）
 *   cam.snapAndDownload();  → 拍 + 觸發下載 PNG
 */

export function createPolaroidCapture(options = {}) {
  const getCanvas = options.getCanvas || (() => null);
  const getYear = options.getYear || (() => "2005");
  const subtitle = options.subtitle || "LM402 · 一眼瞬間";

  function buildPolaroid() {
    const sourceCanvas = getCanvas();
    if (!sourceCanvas) return null;

    const sw = sourceCanvas.width;
    const sh = sourceCanvas.height;
    if (sw === 0 || sh === 0) return null;

    const aspect = sw / sh;
    // 拍立得照片區寬度（自動配合 aspect）
    const photoW = 800;
    const photoH = Math.round(photoW / aspect);

    // 拍立得邊框
    const borderTop = 36;
    const borderSide = 36;
    const borderBottom = 130;
    const totalW = photoW + borderSide * 2;
    const totalH = photoH + borderTop + borderBottom;

    const out = document.createElement("canvas");
    out.width = totalW;
    out.height = totalH;
    const ctx = out.getContext("2d");

    // 1. 米白漸層邊框（老照片質感）
    const grd = ctx.createLinearGradient(0, 0, 0, totalH);
    grd.addColorStop(0, "#fcf9f0");
    grd.addColorStop(1, "#f4eee0");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, totalW, totalH);

    // 2. 微淡邊（老紙微氧化感）
    ctx.strokeStyle = "rgba(80,55,30,0.10)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, totalW - 1, totalH - 1);

    // 3. 照片區（drawImage 把 WebGL canvas 畫進來）
    try {
      ctx.drawImage(sourceCanvas, borderSide, borderTop, photoW, photoH);
    } catch (e) {
      console.error("[polaroid] drawImage failed:", e);
      return null;
    }

    // 4. 照片區微暗邊（老照片邊角壓暗）
    const photoVignette = ctx.createRadialGradient(
      totalW / 2, borderTop + photoH / 2, photoW * 0.35,
      totalW / 2, borderTop + photoH / 2, photoW * 0.7
    );
    photoVignette.addColorStop(0, "rgba(0,0,0,0)");
    photoVignette.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = photoVignette;
    ctx.fillRect(borderSide, borderTop, photoW, photoH);

    // 5. 大字年份（Cormorant Garamond 已在 lm402.html preload）
    const year = String(getYear() ?? "2005");
    ctx.fillStyle = "#3a2818";
    ctx.font = 'bold 56px "Cormorant Garamond", "Noto Serif TC", serif';
    ctx.textAlign = "center";
    ctx.fillText(year, totalW / 2, photoH + borderTop + 70);

    // 6. 副標
    ctx.fillStyle = "#7a6450";
    ctx.font = '20px "Noto Serif TC", serif';
    ctx.fillText(subtitle, totalW / 2, photoH + borderTop + 100);

    // 7. 右下角微傾斜時間戳（橡皮章感）
    ctx.save();
    ctx.translate(totalW - 90, totalH - 30);
    ctx.rotate(-0.06);
    ctx.fillStyle = "rgba(120,60,40,0.42)";
    ctx.font = '14px "Noto Serif TC", monospace';
    const ts = new Date().toISOString().split("T")[0];
    ctx.fillText(ts, 0, 0);
    ctx.restore();

    return out;
  }

  function snap() {
    return buildPolaroid();
  }

  function snapAndDownload() {
    const out = buildPolaroid();
    if (!out) {
      console.warn("[polaroid] snap failed - canvas not ready?");
      return false;
    }
    out.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ts = Date.now();
      a.download = `lm402-${getYear()}-${ts}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }, "image/png", 0.95);
    return true;
  }

  return { snap, snapAndDownload };
}
