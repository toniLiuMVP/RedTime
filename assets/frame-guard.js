/* frame-guard：clickjacking 最低防線。
   GitHub Pages 無法送 X-Frame-Options / CSP frame-ancestors（兩者皆 HTTP header-only，
   透過 <meta> 無效），此為純前端唯一可行的等效防護。
   注意：sandbox 屬性的 iframe 仍可能繞過，這只是縱深防禦的一層。 */
(function () {
  try {
    if (window.self !== window.top) {
      window.top.location = window.self.location.href;
    }
  } catch (e) {
    /* 跨來源無法讀 top.location → 至少把內容藏起來，避免被覆蓋誘導點擊 */
    document.documentElement.style.display = "none";
  }
})();
