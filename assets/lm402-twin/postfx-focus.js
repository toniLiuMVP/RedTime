/**
 * postfx-focus.js — DOF 焦點規則（電影派後製的靈魂決策）
 *
 * ═══════════════════════════════════════════════════════════════
 *  ⚠️  這是「我幫你準備好的學習互動點」
 *      DOF（景深）的焦點對在哪裡，是電影感的最大關鍵。
 *      這個決策沒有「正確答案」— 取決於你的敘事意圖。
 * ═══════════════════════════════════════════════════════════════
 *
 * 三種主流策略（你選一個或自創）：
 *
 *   A.「主角優先」— 永遠對學妹（Hero Focus）
 *      適合：劇情中段、學妹對話場景
 *      缺點：當學妹在畫面邊緣時，中心物件反而模糊
 *
 *   B.「視覺中心」— 對畫面中央的物件（Reticle Focus）
 *      適合：探索場景，玩家視角主導
 *      缺點：玩家轉視角時焦點會跳，需要平滑
 *
 *   C.「敘事主導」— 根據劇情切換（Narrative Focus）
 *      適合：你的「時間裡的兩個妳」雙線敘事
 *      可以「年輕線對學妹近、現代線拉遠」做時間穿越的視覺隱喻
 *
 * 預設：A（最穩、無突跳）。你想換的話編輯下面的函式即可。
 */

/**
 * @param {Object} ctx
 * @param {THREE.PerspectiveCamera} ctx.camera
 * @param {THREE.Vector3 | null}    ctx.juniorAnchor   學妹頭部世界座標（無學妹時為 null）
 * @param {THREE.Vector3 | null}    ctx.lookAtTarget   相機正在 lookAt 的點（若有）
 * @param {number}                  ctx.time           時間秒（可用於 lerp 平滑）
 * @param {number}                  ctx.lastFocal      上一幀的 focal（用於平滑插值）
 * @returns {number} 對焦距離（從相機算起，世界單位）
 */
export function focalProvider(ctx) {
  const { camera, juniorAnchor, lastFocal } = ctx;

  // ─── 預設策略 A：對學妹頭部，平滑追焦 ───
  let target = 6.0;
  if (juniorAnchor) {
    target = camera.position.distanceTo(juniorAnchor);
  }

  // 平滑插值：避免相機/學妹瞬移時焦點突跳（值越大越快收斂）
  const SMOOTH = 0.12;
  return lastFocal + (target - lastFocal) * SMOOTH;
}

// ──────────────────────────────────────────────────────────────────
// 你可以參考下面的「策略 B」和「策略 C」改寫上面的函式：
// ──────────────────────────────────────────────────────────────────
//
// // 策略 B（視覺中心）：
// export function focalProvider(ctx) {
//   if (ctx.lookAtTarget) {
//     return ctx.camera.position.distanceTo(ctx.lookAtTarget);
//   }
//   return ctx.lastFocal; // 維持上一幀
// }
//
// // 策略 C（敘事主導，需要你自己暴露 chapter 變數）：
// export function focalProvider(ctx) {
//   const isYoung = (window.__CHAPTER__ ?? 'now') === 'young';
//   const target = ctx.juniorAnchor
//     ? ctx.camera.position.distanceTo(ctx.juniorAnchor)
//     : 6.0;
//   // 年輕線：清晰追焦；現代線：刻意留 +3 單位讓學妹微離焦（疏離感）
//   return ctx.lastFocal + ((isYoung ? target : target + 3) - ctx.lastFocal) * 0.08;
// }
