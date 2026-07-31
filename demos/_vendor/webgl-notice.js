/* WebGL 可用性檢查:不支援 3D 的瀏覽器/裝置,在標題畫面頂端顯示一句提示,
   引導到頁面既有的「我只想讀這一段 / 回首頁」出口(那些是真 <a href>,即使遊戲模組
   在 WebGL 失敗時中止仍可點)。純外部檔(CSP script-src 'self'),不依賴任何遊戲模組。
   【R5 W4】判據從 webgl2||webgl 改成只認 webgl2:vendored three 是 r184,
   r163 起已移除 WebGL1 支援(WebGLState 無條件 texImage3D → WebGL1 context 直接
   TypeError)。實測 --disable-webgl2 下三款遊戲全部開不起來,而舊判據判「有 WebGL」
   不出聲 → WebGL1-only 裝置只看到靜默黑畫面。真正的門檻就是 WebGL2。
   探測用 failIfMajorPerformanceCaveat:false(預設)+ 獨立 canvas,不碰遊戲的 canvas。 */
(function () {
  "use strict";
  function webglOK() {
    try {
      if (!window.WebGL2RenderingContext) return false;
      var c = document.createElement("canvas");
      return !!c.getContext("webgl2");
    } catch (e) { return false; }
  }
  function showNotice() {
    if (document.getElementById("webgl-unsupported-notice")) return;
    var n = document.createElement("div");
    n.id = "webgl-unsupported-notice";
    n.setAttribute("role", "alert");
    // 逐一設 style property(非 cssText/setAttribute style)— 直接屬性賦值不受 style-src CSP 限制,
    // 月台頁 style-src 'self' 無 unsafe-inline,用 cssText 會被整段丟棄。
    var s = n.style;
    s.position = "fixed"; s.left = "0"; s.right = "0"; s.top = "0"; s.zIndex = "99998";
    s.padding = "12px 16px"; s.textAlign = "center";
    s.background = "rgba(20,16,14,.95)"; s.color = "#f0e6d6";
    s.font = "14px/1.7 'Noto Sans TC','Noto Sans CJK TC',sans-serif"; s.letterSpacing = ".02em";
    s.borderBottom = "1px solid rgba(224,113,78,.5)";
    n.textContent = "你的瀏覽器或裝置不支援 3D（需要 WebGL2），這個場景無法顯示。可以改用頁面上的「我只想讀這一段」讀故事，或回首頁。";
    (document.body || document.documentElement).appendChild(n);
  }
  function run() { if (!webglOK()) showNotice(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
