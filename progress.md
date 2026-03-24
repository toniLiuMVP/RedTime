Original prompt: 1 你現在是Steam最暢銷遊戲公司+得了無數電影最多獎項的電影公司＋史上最暢銷出版社＋文學博士＋物理博士＋天文學博士＋心理學博士+程式專家＋資訊安全專家。
2 先瀏覽整個網站含LM402遊戲及時間裡的兩個妳故事文本。
3 整個網站有需要優化的地方可以不用確認直接優化。
4 網站內的故事文本不可動，非故事文本外的文案部分不需判斷的可以直接優化，需要判斷的列表問我，因為我就是作者。
5 LM402遊戲以玩家體驗及流暢度為最優先考量，但學妹的3D模型希望可以參照資料夾內的2005年學妹定稿照來製作出全3D精緻寫實超美的學妹，包含外表,臉型,長相,頭髮,服裝,全身，讓玩家一看會覺得難怪故事裡的學長會說也太像徐若瑄了,學妹站在教室的光影要自帶聚光燈。
6 優化全部遊戲的物件及美術，以寫實為目標。
7 優化開場動畫，女兒的視線就是鏡頭，玩家一看到開場動畫就會很想玩下去。
8 優化結局動畫，要有韓劇的節奏,韓劇般的光影,韓劇的慢動作，學長看到學妹的那一眼瞬間，讓學長往後的每一個後來：「每當我閉上眼鏡，我就可以看見妳。」
9 依照故事文本優化或新增一眼瞬間相關劇情對白。
10 驗證所有劇情真的能夠達成。
11 最後的成品會讓 Claude Code檢查並評分你製作的完不完美。
12 給你所有的權限，目標製作出最動人,最揪心的《時間裡的兩個妳》網站及LM402的一眼瞬間。

Notes:
- Reader episode body text must remain unchanged.
- Author requested review before applying new narrative/dialogue additions outside the existing story text.
- Device priority: desktop cinematic quality first, mobile stays playable and readable.
- Character direction: 2005 junior should push harder toward the "也太像徐若瑄了吧" shock while staying anchored to local reference art.

TODO:
- Reformat LM402 source files so cinematic/state fixes are safe.
- Upgrade homepage and reader shell hierarchy without touching episode body text.
- Rebuild LM402 asset/camera/UI flow and fix perfect-ending instability.

Updates:
- Reformatted `assets/lm402/app.js`, `assets/lm402/data.js`, `assets/lm402/renderer.js`, and `assets/lm402/lm402.css` with Prettier so the existing cinematic/game loop can be safely edited.
- Added LM402 data-layer config for quality tiers, reference-driven junior asset manifests, UI visibility presets, and an author-review dialogue draft list without touching story body text.
- Reworked LM402 app state so intro/play/ending each drive their own UI visibility preset, debug snapshots now expose quality tier / asset state / render error counts, and ending render failures now preserve the achieved ending instead of collapsing back to a missed flow.
- Upgraded LM402 renderer with reference-image portrait shell loading for the 2005 junior, dedicated spotlight/rim lighting around the back-door reveal, tighter perfect-ending phase timing, and canvas sizing that matches the stage more closely to reduce false mobile black-region detection.
- Removed invalid security meta tags from `index.html`, `reader.html`, and `lm402.html`; the site now expects real security headers to come from hosting instead of pretending via `<meta http-equiv>`.
- Rebuilt the first-screen shell for `index.html` and `reader.html` so both pages behave more like cinematic posters with clearer CTA hierarchy and faster orientation into LM402 / reading / continue-reading flows.
- Fixed a browser parse regression in `assets/lm402/app.js` after refactoring the startup loop. `window.__LM402_DEBUG__` and `window.advanceTime` now register correctly again, and LM402 boots back into `intro` instead of silently falling back to a static shell.
- Changed LM402 intro timing to progress from frame time instead of `performance.now()` catch-up. Fresh desktop snapshots now enter with `mode: intro`, `cameraAnchor: daughter_glow`, `renderErrorCount: 0`, and no startup render error.
- Reworked the two stair zones in `assets/lm402/renderer.js` so each stairwell now reads as a 90-degree turned landing with split up/down flights instead of a staircase visually running into the wall. Probe captures live in `output/playwright/front-stair-*.png` and `output/playwright/back-stair-*.png`.
- Centered the reader hero stat cells (`41 集 / 3 線 / 20 年 / 5 彩蛋`) by making `.hero-stat` a flex-centered column container; confirmed in `output/playwright/reader-hero-check.png`.

TODO:
- Keep pushing the junior from "reference-shell + strong lighting" toward a more convincing hero asset. Current result is improved, but still not a bespoke full 3D human model.
- Replace the temporary `window.advanceTime` stepping with a fully verified deterministic test harness once the intro/ending flows stop changing so quickly.
