// lm402.html inline classic #3 外部化（CSP 撤 unsafe-inline）
// C9: side-panel 收合／展開切換 — 讓玩家可手動隱藏右側關卡進度欄
(function () {
  var STORAGE_KEY = "lm402.sidePanelCollapsed";
  var panel = document.getElementById("side-panel");
  var collapseBtn = document.getElementById("side-panel-collapse-btn");
  var revealBtn = document.getElementById("side-panel-reveal");
  if (!panel || !collapseBtn || !revealBtn) return;

  function setCollapsed(collapsed, persist) {
if (collapsed) {
  panel.classList.add("is-collapsed");
  document.body.classList.add("side-panel-collapsed");
  panel.setAttribute("aria-hidden", "true");
  collapseBtn.setAttribute("aria-expanded", "false");
  revealBtn.classList.add("is-visible");
} else {
  panel.classList.remove("is-collapsed");
  document.body.classList.remove("side-panel-collapsed");
  panel.removeAttribute("aria-hidden");
  collapseBtn.setAttribute("aria-expanded", "true");
  revealBtn.classList.remove("is-visible");
}
if (persist !== false) {
  try { localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0"); } catch (e) { /* noop */ }
}
// 告訴 Three.js renderer 重新計算 canvas 尺寸（stage 剛剛改變寬度）
// 立刻打一次讓 canvas backing store 立刻同步，避免拉伸；
// 再在 CSS transition 結束後補一次，確保最終尺寸正確
window.dispatchEvent(new Event("resize"));
setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 400);
  }

  // 還原先前狀態
  try {
if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true, false);
  } catch (e) { /* noop */ }

  collapseBtn.addEventListener("click", function (e) {
e.stopPropagation();
setCollapsed(true, true);
revealBtn.focus();
  });

  revealBtn.addEventListener("click", function (e) {
e.stopPropagation();
setCollapsed(false, true);
collapseBtn.focus();
  });

  // 快捷鍵：Tab 旁邊的反引號 ` 或 T 鍵切換（不攔截 WASD/F/R/G 等遊戲鍵）
  document.addEventListener("keydown", function (e) {
if (e.key !== "`" && e.key !== "~") return;
var target = e.target;
if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
e.preventDefault();
setCollapsed(!panel.classList.contains("is-collapsed"), true);
  });
})();
