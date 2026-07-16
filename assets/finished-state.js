/* 完讀判定(單一判準,index / reader 共用):
   redtime_read_eps_v1 含 EP42 且已讀集數 ≥ 43(EP0~EP42)。
   讀不到 localStorage 一律回 false(寧可當一般讀者,不誤稱完讀)。 */
(function () {
  "use strict";
  function hasFinished() {
    try {
      var raw = localStorage.getItem("redtime_read_eps_v1");
      if (!raw) return false;
      var eps = JSON.parse(raw);
      if (!Array.isArray(eps)) return false;
      return eps.indexOf(42) !== -1 && eps.length >= 43;
    } catch (e) { return false; }
  }
  if (typeof window !== "undefined") window.__REDTIME_FINISHED__ = hasFinished;
})();
