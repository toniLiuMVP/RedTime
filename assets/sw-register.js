// Service Worker register(可共用 across pages)
// 抽自 inline `<script>`(round 26 CSP 收斂)
// 相對路徑同時支援 GitHub Pages (/RedTime/) 與本機伺服器 (/)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(function () {});
}
