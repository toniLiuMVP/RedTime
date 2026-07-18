/* 三道試煉印:結算畫面上「還沒走過、又有去處」的印,補一條可點的「前往」。
   對位 LM402 assets/lm402/app.js renderTrialSeals 的可點模式。
   純外部檔(CSP script-src 'self',不能 inline);不動 minified scene.js,
   只在 #clear 開啟後升級靜態 seal DOM(seal-ren→LM402 / seal-zhui→月台);
   seal-ao 是天堂路本身,不給連結。三印判準 SSOT:docs/three-seals.md。 */
(function () {
  var HREF = { "seal-ren": "../../../lm402.html", "seal-zhui": "../../platform-run/index.html" };
  var NAME = { "seal-ren": "LM402", "seal-zhui": "月台上的狂奔" };
  function earned(id) {
    try {
      if (id === "seal-ren") {
        var a = JSON.parse(localStorage.getItem("lm402_endings_completed_v1") || "[]");
        return Array.isArray(a) && a.length > 0;
      }
      if (id === "seal-zhui") return localStorage.getItem("platformRunCleared_v1") === "1";
    } catch (e) { }
    return false;
  }
  var st = document.createElement("style");
  st.textContent =
    ".cs-seal .cs-go{font-style:normal;font-size:10px;letter-spacing:.1em;color:#cfa46e;text-decoration:none;" +
    "border-bottom:1px solid rgba(207,164,110,.5);padding-bottom:1px;transition:color .2s,border-color .2s}" +
    ".cs-seal .cs-go:hover,.cs-seal .cs-go:focus-visible{color:#e0714e;border-color:rgba(224,113,78,.7)}";
  (document.head || document.documentElement).appendChild(st);

  function upgrade() {
    Object.keys(HREF).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var em = el.querySelector("em");
      var go = el.querySelector("a.cs-go");
      if (earned(id)) {              // 已走過:移除連結,交還 refreshSeals 寫的「已落印」文字
        if (go) go.remove();
        if (em) em.style.display = "";
        return;
      }
      if (em) em.style.display = "none";   // 未走過:藏掉「還在路上」,改給一條可點的路
      if (!go) {
        go = document.createElement("a");
        go.className = "cs-go";
        go.href = HREF[id];
        go.textContent = "前往";
        go.setAttribute("aria-label", "前往 " + NAME[id]);
        el.appendChild(go);
      }
    });
  }

  var clearEl = document.getElementById("clear");
  if (clearEl && window.MutationObserver) {
    new MutationObserver(function () {
      // 延一拍:讓 scene.js 的 refreshSeals 先把 <em> 文字寫完,再升級未得印
      if (clearEl.classList.contains("on")) setTimeout(upgrade, 0);
    }).observe(clearEl, { attributes: true, attributeFilter: ["class"] });
  }
})();
