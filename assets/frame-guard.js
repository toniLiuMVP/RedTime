/* frame-guard：clickjacking 防線（default-deny 版）。
   GitHub Pages 無法送 X-Frame-Options / CSP frame-ancestors（兩者皆 HTTP header-only，
   透過 <meta> 無效），此為純前端唯一可行的等效防護。
   策略：被框時先把內容藏起來，只有「未被框」或「同源 ?embed=1」確認後才顯示，
   如此即使 sandbox iframe 擋掉 frame-bust（write 被靜默阻擋、不 throw），
   也不會露出任何可被誘導點擊的內容。注意：這是縱深防禦的一層。 */
(function () {
  function show() { try { var s = document.documentElement.style; s.visibility = ""; s.pointerEvents = ""; } catch (e) {} }
  function hide() { try { var s = document.documentElement.style; s.visibility = "hidden"; s.pointerEvents = "none"; } catch (e) {} }
  try {
    if (window.self === window.top) { show(); return; } /* 沒被框 → 正常顯示 */

    /* 被框 → 先 default-deny 把內容藏起來 */
    hide();

    /* 例外：遊戲內故事閱讀器是「同源、刻意」用 ?embed=1 嵌在遊戲 iframe 裡的
       (回到天堂路/月台/LM402 的 bar + postMessage 都靠它)。只放行「同源」embed，
       跨來源即使框 reader.html?embed=1 也不顯示。 */
    if (new URLSearchParams(window.location.search).get("embed") === "1") {
      try {
        if (window.top.location.origin === window.location.origin) show();
      } catch (e) { /* 跨源讀 top.location 會 throw → 保持藏 */ }
      return;
    }

    /* 非 embed 被框 → 嘗試把自己彈成 top；若 sandbox 擋住（不 throw）則保持藏。 */
    window.top.location = window.self.location.href;
  } catch (e) {
    /* 任何意外（跨源讀取 throw 等）→ 保持藏 */
    hide();
  }
})();
