// platform-run 外部化 inline script #2（CSP 撤 unsafe-inline）
if ('serviceWorker' in navigator) {
// 相對路徑同時支援 GitHub Pages (/RedTime/) 與本機伺服器 (/)
navigator.serviceWorker.register('../../sw.js', { updateViaCache: 'none' }).catch(() => {});
}
