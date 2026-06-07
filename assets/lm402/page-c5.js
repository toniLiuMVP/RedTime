// lm402.html inline classic #5 外部化（CSP 撤 unsafe-inline）
// Ultimate safety net: force-kill intro overlay after 25s no matter what
// This catches cases where JS errors kill the tick loop before finishIntro runs
// C9: 只在使用者已進入玄關後才啟動，避免使用者停留在 gate 畫面時被誤觸發
setTimeout(function () {
  if (!window.__lm402GateEntered) return;
  var fx = document.getElementById("intro-fx");
  if (fx && fx.classList.contains("intro-fx-active")) {
console.warn("[safety] intro-fx still active after 25s — force removing");
fx.classList.remove("intro-fx-active");
fx.classList.add("intro-fx-done");
fx.style.opacity = "0";
fx.style.display = "none";
document.body.classList.remove("cinematic-mode");
  }
}, 25000);
