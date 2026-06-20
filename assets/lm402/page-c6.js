// lm402.html inline classic #6 外部化（CSP 撤 unsafe-inline）
if ('serviceWorker' in navigator) {
  // 相對路徑同時支援 GitHub Pages (/RedTime/) 與本機伺服器 (/)
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(function (r) { try { if (r && r.update) r.update(); } catch (e) {} }).catch(function () {});
  if (navigator.serviceWorker.controller) { var _swR = false; navigator.serviceWorker.addEventListener('controllerchange', function () { if (!_swR) { _swR = true; location.reload(); } }); }
}
