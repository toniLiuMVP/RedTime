/* 完讀判定(單一判準,index / reader 共用):
   (a) redtime_read_eps_v1 需 EP0~EP42 全 43 集逐一存在(Set 檢查,重複或髒值不會湊數);或
   (b) redtime_finished_at_v1 已寫入 = 曾捲到結局卡(讀到最後)→ grandfather。
   (b) 讓「EP42 上線前就讀完(0~41)的舊完讀者」與「捲到最末的跳讀者」不被靜默降級;
   finished_at 只在真的走到結局卡時寫一次,無法靠隨意跳章偽造,也不誤標未讀集。
   讀不到 localStorage 一律回 false(寧可當一般讀者,不誤稱完讀)。 */
(function () {
  "use strict";
  function hasFinished() {
    try {
      // (b) grandfather:曾走到結局卡(讀到最後)即認完讀,不隨新增集數而降級
      if (localStorage.getItem("redtime_finished_at_v1")) return true;
    } catch (e) { /* fall through to (a) */ }
    try {
      var raw = localStorage.getItem("redtime_read_eps_v1");
      if (!raw) return false;
      var eps = JSON.parse(raw);
      if (!Array.isArray(eps)) return false;
      var seen = new Set(eps);
      for (var i = 0; i <= 42; i++) { if (!seen.has(i)) return false; }
      return true;
    } catch (e) { return false; }
  }
  if (typeof window !== "undefined") window.__REDTIME_FINISHED__ = hasFinished;
})();
