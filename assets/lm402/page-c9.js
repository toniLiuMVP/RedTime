// lm402.html inline classic #9 外部化（CSP 撤 unsafe-inline）
// C1 — GLB scene render still placeholder
// 用法 (console)：__LM402_PHOTO__.capture()
//   options： { filename }
//   高倍率 supersample 留 later 真實作， 目前僅輸出 canvas.toBlob 原解析度。
(function () {
const LINE = 'twin';
const LABEL = 'LM402 Twin';
function findCanvas() {
  // Three.js attaches a canvas. Prefer one inside #app or first canvas.
  const inApp = document.querySelector('#app canvas, main canvas, #stage canvas');
  if (inApp) return inApp;
  const all = document.getElementsByTagName('canvas');
  for (const c of all) {
if (c.width > 16 && c.height > 16) return c;
  }
  return null;
}
function timestamp() {
  const d = new Date();
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function capture(opts) {
  opts = opts || {};
  const canvas = findCanvas();
  if (!canvas) {
console.warn('[__LM402_PHOTO__] canvas not found， 場景尚未載入？');
return Promise.reject(new Error('canvas-not-found'));
  }
  const year = (window.__LM402_YEAR__ || '2005');
  const fname = opts.filename
|| `lm402-${LINE}-${year}-${timestamp()}.png`;
  return new Promise((resolve, reject) => {
try {
  canvas.toBlob(function (blob) {
    if (!blob) {
      reject(new Error('toBlob-null'));
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 200);
    console.info(`[__LM402_PHOTO__] saved ${fname} (${blob.size} bytes)`);
    resolve({ filename: fname, size: blob.size, line: LINE });
  }, 'image/png');
} catch (e) {
  reject(e);
}
  });
}
window.__LM402_PHOTO__ = {
  line: LINE,
  label: LABEL,
  capture: capture,
  version: 'v1'
};
// Brief boot log only when devtools likely open (no production noise).
if (window.__lm402DebugPhoto) {
  console.info(`[__LM402_PHOTO__] ready (line=${LINE}, label=${LABEL})`);
}
})();
