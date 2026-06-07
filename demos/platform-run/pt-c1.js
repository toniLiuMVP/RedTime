// platform-run 外部化 inline script #1（CSP 撤 unsafe-inline）
(function () {
const _OriginalAudio = window.Audio;
const _trackedAudios = new Set();
window.Audio = function (...args) {
  const a = new _OriginalAudio(...args);
  _trackedAudios.add(a);
  return a;
};
window.Audio.prototype = _OriginalAudio.prototype;
function stopAllAudio() {
  _trackedAudios.forEach((a) => { try { a.pause(); } catch (e) {} });
  document.querySelectorAll("audio, video").forEach((el) => { try { el.pause(); } catch (e) {} });
  if (window.__AUDIO_CONTEXT__ && typeof window.__AUDIO_CONTEXT__.suspend === "function") {
    try { window.__AUDIO_CONTEXT__.suspend(); } catch (e) {}
  }
}
document.addEventListener("visibilitychange", function () {
  if (document.hidden) stopAllAudio();
});
window.addEventListener("pagehide", stopAllAudio);
window.addEventListener("beforeunload", stopAllAudio);
})();
