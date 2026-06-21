/* frame-guard：clickjacking 最低防線。
   GitHub Pages 無法送 X-Frame-Options / CSP frame-ancestors（兩者皆 HTTP header-only，
   透過 <meta> 無效），此為純前端唯一可行的等效防護。
   注意：sandbox 屬性的 iframe 仍可能繞過，這只是縱深防禦的一層。 */
(function () {
  try {
    if (window.self !== window.top) {
      /* 例外：遊戲內故事閱讀器是「同源、刻意」用 ?embed=1 嵌在遊戲 iframe 裡的(回到天堂路/月台/LM402 的 bar + postMessage 都靠它)。
         不可把這個合法嵌入彈出去,否則一開閱讀就把玩家踢出遊戲、毀掉遊戲狀態。
         跨來源攻擊者即使框 reader.html?embed=1 也撈不到好處:embed 模式只顯示單一集公開故事文(本就公開),且跨來源讀 top.location 會 throw → 落到 catch 把內容藏掉。 */
      if (new URLSearchParams(window.location.search).get("embed") === "1") return;
      window.top.location = window.self.location.href;
    }
  } catch (e) {
    /* 跨來源無法讀 top.location → 至少把內容藏起來，避免被覆蓋誘導點擊 */
    document.documentElement.style.display = "none";
  }
})();
