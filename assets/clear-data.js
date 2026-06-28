/* 清除我的本機資料 — 共用模組（遊戲頁 lm402 / 月台 / 天堂路 載入用）。
   ⚠️ reader.html 有一份等價的 inline 實作；改 PREFIXES 或文案時，兩邊都要改。
   最高規最嚴謹：只動本站前綴白名單 key，絕不 localStorage.clear()（以免動到同源其他資料）；
   動手前完整列舉數量＋類別並要求明確確認；全程不連網、不上傳，資料本就只存在這台裝置。 */
(function () {
  function _collectMyDataKeys() {
    var PREFIXES = ["redtime", "lm402", "platformrun", "tiantanglu"];
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        var lk = k.toLowerCase();
        for (var p = 0; p < PREFIXES.length; p++) {
          if (lk.indexOf(PREFIXES[p]) === 0) { keys.push(k); break; }
        }
      }
    } catch (e) {}
    return keys;
  }
  function clearAllMyData() {
    var keys = _collectMyDataKeys();
    if (!keys.length) { alert("沒有找到任何本機紀錄，這裡很乾淨。"); return; }
    var msg = "即將永久清除這台裝置上《時間裡的兩個妳》的所有本機紀錄，共 " + keys.length + " 項：\n\n"
      + "· 閱讀進度與已讀章節\n"
      + "· 書籤與已解鎖彩蛋\n"
      + "· 鐵粉測驗成績與稱號\n"
      + "· LM402／月台／天堂路遊戲紀錄與設定\n"
      + "· 字級與日夜模式偏好\n\n"
      + "這些資料只存在你這台裝置、從未上傳，清除後無法復原。確定要清除嗎？";
    if (!window.confirm(msg)) return;
    var removed = 0;
    for (var j = 0; j < keys.length; j++) {
      try { localStorage.removeItem(keys[j]); removed++; } catch (e) {}
    }
    alert("已清除 " + removed + " 項本機紀錄。頁面將重新整理，回到乾淨的起點。");
    try { location.reload(); } catch (e) {}
  }
  window.clearAllMyData = clearAllMyData;
  // 自動掛載：帶 data-clear-data 屬性的元素直接綁定（避免 inline onclick，對齊嚴格 CSP script-src 'self'）
  function wire() {
    var els = document.querySelectorAll("[data-clear-data]");
    for (var i = 0; i < els.length; i++) {
      els[i].addEventListener("click", clearAllMyData);
      // <button> 的 link-look 樣式用 JS(CSSOM)套，繞過嚴格 style-src 'self'（HTML inline style 屬性會被擋）。
      // div 類(如天堂路 .story-open)交給該頁既有 class 樣式，不覆寫，但補鍵盤可達(Enter/Space)。
      if (els[i].tagName === "BUTTON") {
        var s = els[i].style;
        s.background = "none"; s.border = "none"; s.color = "inherit";
        s.textDecoration = "underline"; s.cursor = "pointer"; s.font = "inherit"; s.padding = "0";
      } else {
        els[i].addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clearAllMyData(); }
        });
      }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
