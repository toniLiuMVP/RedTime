// lm402.html inline module #2 外部化（CSP 撤 unsafe-inline）；放 root 保留 ./assets/lm402/ dynamic import 路徑
const idle = (cb) =>
  ("requestIdleCallback" in window)
? requestIdleCallback(cb, { timeout: 3000 })
: setTimeout(cb, 2000);
// H1+H3 文學旁白系統 — 啟動後暴露 window.__NARRATIVE__
idle(() => {
  import("./assets/lm402/narrative-overlay.js")
.then((mod) => { window.__NARRATIVE__ = mod.createNarrativeOverlay(); })
.catch((e) => console.warn("[narrative] init failed:", e));
});
// H2+H4 章節 fade + 記憶閃回 — 啟動後暴露 window.__TRANSITIONS__
idle(() => {
  import("./assets/lm402/narrative-transitions.js")
.then((mod) => { window.__TRANSITIONS__ = mod.createTransitions(); })
.catch((e) => console.warn("[transitions] init failed:", e));
});
// H6 書信日記模式 — 啟動後暴露 window.__LETTER__
idle(() => {
  import("./assets/lm402/narrative-letter.js")
.then((mod) => { window.__LETTER__ = mod.createNarrativeLetter(); })
.catch((e) => console.warn("[letter] init failed:", e));
});
// H7+H8 環境音層次 + 動態 BGM — 啟動後暴露 window.__AUDIO_LAYER__
idle(() => {
  import("./assets/lm402/narrative-audio.js")
.then((mod) => { window.__AUDIO_LAYER__ = mod.createNarrativeAudio(); })
.catch((e) => console.warn("[audio-layer] init failed:", e));
});
// C8 學妹發起互動 — 暴露 window.__INITIATED__（手動 start 才開始）
idle(() => {
  import("./assets/lm402/initiated-interactions.js")
.then((mod) => { window.__INITIATED__ = mod.createInitiatedInteractions(); })
.catch((e) => console.warn("[initiated] init failed:", e));
});
