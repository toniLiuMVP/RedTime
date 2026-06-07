// lm402.html inline classic #7 外部化（CSP 撤 unsafe-inline）
(function () {
  const btn = document.getElementById("lm402-polaroid-btn");
  const flash = document.getElementById("lm402-polaroid-flash");
  let busy = false;
  btn.addEventListener("click", async () => {
if (busy) return;
busy = true;
// 拍照閃光特效（白屏 100ms）
flash.classList.add("flash");
setTimeout(() => flash.classList.remove("flash"), 120);
try {
  const mod = await import("./assets/lm402/polaroid.js");
  const cam = mod.createPolaroidCapture({
    getCanvas: () => document.querySelector("canvas"),
    getYear: () => (window.__LM402_YEAR__ ?? "2005"),
    subtitle: "LM402 · 一眼瞬間",
  });
  const ok = cam.snapAndDownload();
  if (!ok) console.warn("[polaroid] 拍照失敗，請進入場景後再試");
} catch (e) {
  console.error("[polaroid] error:", e);
}
setTimeout(() => { busy = false; }, 600);
  });
})();
