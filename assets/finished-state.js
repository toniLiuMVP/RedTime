/* 完讀判定(單一判準,index / reader 共用):
   redtime_read_eps_v1 含 EP41 且已讀集數 ≥ 42(EP0~EP41)。
   讀不到 localStorage 一律回 false(寧可當一般讀者,不誤稱完讀)。 */
(function () {
  "use strict";
  function hasFinished() {
    try {
      var raw = localStorage.getItem("redtime_read_eps_v1");
      if (!raw) return false;
      var eps = JSON.parse(raw);
      if (!Array.isArray(eps)) return false;
      return eps.indexOf(41) !== -1 && eps.length >= 42;
    } catch (e) { return false; }
  }
  if (typeof window !== "undefined") window.__REDTIME_FINISHED__ = hasFinished;
})();
