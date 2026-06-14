/* F6：非阻塞載入 fonts.css。
   讓 privacy.html / 月台跑酷頁也套用 DM Mono / Cormorant Garamond，
   但不把 826KB 的字型 CSS 放進 render 阻塞路徑（尤其遊戲頁不能被拖慢）。
   href 由 <script> 的 data-href 提供，以支援不同層級的相對路徑。
   font-display 已是 swap，延後載入最壞只是極短暫的 fallback→webfont 切換（FOUT）。 */
(function () {
  var s = document.currentScript;
  var href = s && s.getAttribute("data-href");
  if (!href) return;
  var l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
})();
