/* 完讀判定(單一判準,index / reader 共用):
   redtime_read_eps_v1 需 EP0~EP42 全 43 集逐一存在(Set 檢查,重複或髒值不會湊數)。
   讀不到 localStorage 一律回 false(寧可當一般讀者,不誤稱完讀)。 */
(function () {
  "use strict";
  function hasFinished() {
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
