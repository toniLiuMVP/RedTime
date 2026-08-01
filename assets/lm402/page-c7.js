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
  // 【R6 修復】classic script 的 dynamic import 以「腳本自身 URL」解析(不是文件 URL)。
  // 本檔在 assets/lm402/ 之下,原本的 "./assets/lm402/polaroid.js" 會解析成
  // /RedTime/assets/lm402/assets/lm402/polaroid.js → 404,拍立得按鈕自 CSP 外部化
  // 以來一直是壞的(catch 吞掉、只留 console error)。
  // 對照:lm402-mod1.js 刻意放 root 就是為了讓這種 "./assets/lm402/…" 路徑成立;
  // 本檔沒跟著搬,specifier 就得用腳本相對路徑。
  const mod = await import("./polaroid.js");
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
