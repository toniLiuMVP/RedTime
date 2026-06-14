/* A11Y-02：月台跑酷桌機 UI 控制鍵補鍵盤可達性。
   只處理「桌機可見 + 以 'click' 綁定」的 UI 控制（靜音 / 畫質 / 排行榜 / 重玩 / 關閉）。
   衝刺 / 跳躍 / 必殺是 touchstart 綁定的觸控專用鍵（桌機 display:none、鍵盤已有 WASD），不在此列。
   刻意「不改 game.js」，把與遊戲開發的合併衝突面降到最小。 */
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () {
    var LABELS = {
      "mute-btn": "靜音 / 取消靜音",
      "quality-btn": "畫質設定",
      "leaderboard-btn": "本機排行榜",
      "result-retry": "再陪他跑一次",
      "lb-close": "關閉排行榜",
    };
    Object.keys(LABELS).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (!el.hasAttribute("role")) el.setAttribute("role", "button");
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
      if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", LABELS[id]);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation(); // 避免事件冒泡到 window 的遊戲鍵盤控制（Space→跳躍）
          el.click();
        }
      });
    });
  });
})();
