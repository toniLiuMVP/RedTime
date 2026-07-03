// platform-run 演出補強 #6:慢速重看(通關後解鎖;約 0.5x 慢速、不留分數,純粹再看一次)
// 計時與世界同尺度收慢,難度等同原速,計時條照常顯示讓玩家有時間回饋。
// 純外掛 module:透過共用 three Clock 的時間尺度收慢整場,不動 game.js 邏輯。
import * as THREE from "../_vendor/three.module.js";

const KEY_CLEARED = "platformRunCleared_v1";
const SLOW_SCALE = 0.5;

/* 全域時間尺度:包一層 Clock.getDelta,只在慢速重看時 < 1,平常完全等價原行為 */
const _getDelta = THREE.Clock.prototype.getDelta;
THREE.Clock.prototype.getDelta = function () {
  const d = _getDelta.call(this);
  const s = window.__PT_TIMESCALE__;
  return (typeof s === "number" && s > 0 && s < 1) ? d * s : d;
};

const st = document.createElement("style");
st.id = "pt-slow-style";
st.textContent = [
  /* 慢速重看:隱藏留名與排行榜(不留分數);計時條保留,玩家看得到剩餘時間 */
  ".pt-slow #name-input-wrap,.pt-slow #leaderboard-btn{display:none!important}",
  ".title-slow-entry{background:none;border:none;cursor:pointer;font-family:inherit;",
  "color:#8a7560;font-size:clamp(11px,1.5vw,13px);letter-spacing:.14em;padding:6px 4px;",
  "border-bottom:1px dotted rgba(138,117,96,.45);transition:color .3s ease}",
  ".title-slow-entry:hover,.title-slow-entry:focus{color:#c8b89a;outline:none}",
  "#pt-slow-chip{position:fixed;top:64px;left:12px;z-index:70;display:flex;align-items:center;gap:10px;",
  "padding:6px 12px;background:rgba(8,9,12,.72);border:1px solid rgba(138,117,96,.35);border-radius:3px;",
  "color:#c8b89a;font-size:11px;letter-spacing:.16em}",
  "#pt-slow-chip[hidden]{display:none}",
  "#pt-slow-chip button{background:none;border:none;cursor:pointer;font-family:inherit;",
  "color:#8a7560;font-size:11px;letter-spacing:.12em;padding:2px 4px;border-bottom:1px dotted rgba(138,117,96,.45)}",
  "#pt-slow-chip button:hover,#pt-slow-chip button:focus{color:#e8c988;outline:none}"
].join("");
(document.head || document.documentElement).appendChild(st);

function clearedBefore() {
  try { return localStorage.getItem(KEY_CLEARED) === "1"; } catch (e) { return false; }
}

/* 通關留鑰:結果標題出現「全部過關！」時記一把本機鑰匙(三印「追」的判準) */
const resultTitle = document.getElementById("result-title");
if (resultTitle && window.MutationObserver) {
  new MutationObserver(() => {
    if ((resultTitle.textContent || "") === "全部過關！") {
      try { localStorage.setItem(KEY_CLEARED, "1"); } catch (e) {}
    }
  }).observe(resultTitle, { childList: true, characterData: true, subtree: true });
}

/* 慢速重看狀態 */
let chip = null;
function ensureChip() {
  if (chip) return chip;
  chip = document.createElement("div");
  chip.id = "pt-slow-chip";
  chip.hidden = true;
  const label = document.createElement("span");
  label.textContent = "慢速重看";
  const exit = document.createElement("button");
  exit.type = "button";
  exit.textContent = "恢復原速";
  exit.setAttribute("aria-label", "離開慢速重看，恢復原速");
  exit.addEventListener("click", stopSlow);
  chip.appendChild(label);
  chip.appendChild(exit);
  (document.body || document.documentElement).appendChild(chip);
  return chip;
}
function startSlow() {
  window.__PT_TIMESCALE__ = SLOW_SCALE;
  document.body.classList.add("pt-slow");
  ensureChip().hidden = false;
  const t = document.getElementById("title-screen");
  if (t) t.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}
function stopSlow() {
  window.__PT_TIMESCALE__ = 1;
  document.body.classList.remove("pt-slow");
  if (chip) chip.hidden = true;
}

/* 入口:低調放在標題選項下方,只在通關過的裝置出現 */
(function addEntry() {
  if (!clearedBefore()) return;
  const choices = document.querySelector("#title-screen .title-choices");
  if (!choices) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "title-slow-entry";
  btn.textContent = "慢速重看 · 放慢一半，再看一次";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    startSlow();
  });
  choices.appendChild(btn);
})();
