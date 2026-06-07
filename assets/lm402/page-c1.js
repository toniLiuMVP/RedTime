// lm402.html inline classic #1 外部化（CSP 撤 unsafe-inline）
(function () {
const _OriginalAudio = window.Audio;
const _trackedAudios = new Set();
// Hook Audio constructor — 自動追蹤所有 new Audio()（即使 audio element 沒 attach 到 DOM 也能找到）
window.Audio = function (...args) {
  const a = new _OriginalAudio(...args);
  _trackedAudios.add(a);
  return a;
};
window.Audio.prototype = _OriginalAudio.prototype;

function stopAllAudio() {
  // 1. 透過 hook 追蹤的所有 new Audio() 實例
  _trackedAudios.forEach((a) => {
try { a.pause(); } catch (e) {}
  });
  // 2. DOM 內的 <audio> / <video> 元素（保險網）
  document.querySelectorAll("audio, video").forEach((el) => {
try { el.pause(); } catch (e) {}
  });
  // 3. Web Audio API path：suspend AudioContext（如果有 expose）
  if (window.__AUDIO_CONTEXT__ && typeof window.__AUDIO_CONTEXT__.suspend === "function") {
try { window.__AUDIO_CONTEXT__.suspend(); } catch (e) {}
  }
}

// visibilitychange：分頁切走 / 視窗最小化 → 停
document.addEventListener("visibilitychange", function () {
  if (document.hidden) stopAllAudio();
});
// pagehide：頁面卸載（關分頁、關視窗、退瀏覽器）→ 停
window.addEventListener("pagehide", stopAllAudio);
// beforeunload：再保險一道
window.addEventListener("beforeunload", stopAllAudio);
})();
