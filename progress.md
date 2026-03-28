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
- Centered the homepage hero stat cells (`41 章節 / 3 時間線 / 1 一眼瞬間`) in `index.html` and updated the non-reader landing copy to the exact line `這一次，依然遇見妳。`
- Removed the LM402 stair teleport loop from `assets/lm402/app.js`; stair motion now comes from `renderer.getStairY()` instead of silently warping the player between front/back stair endpoints.
- Added more 2005 junior close-up references to the asset manifest (`frontClose`, `leftFrontClose`, `rightFrontClose`, `sideClose`, `backClose`) and rebuilt the LM402 portrait shell as a multi-view, camera-facing hero layer in `assets/lm402/renderer.js`.
- Hid the procedural head meshes during hero close-ups so the new portrait shell no longer fights with the old 3D head blob in `eyes` / `senior_pov` shots.
- Perfect ending now guarantees the exact two key lines outside the reader text as well:
  - `也太像徐若瑄了吧！`
  - `這一次，依然遇見妳。`
- Validation artifacts added:
  - `output/playwright/index-top-latest.png` for the homepage stat centering check.
  - `output/playwright/lm402-perfect-eyes-latest.png` and `output/playwright/lm402-perfect-senior-pov-latest.png` for updated junior hero shots.
  - `output/playwright/lm402-endings-smoke-latest.json` confirms `perfect/canon/memory/missed` all open overlays with `renderErrorCount: 0`, and the perfect ending captures both mandatory subtitles.
  - `output/playwright/lm402-stair-grid-check.json` confirms the front stair now produces different camera heights across the upper flight, landing, and lower flight instead of teleporting.

TODO:
- Keep pushing the junior from "multi-view portrait shell + procedural body" toward a more convincing hero asset. Current result is improved, but still not a bespoke full 3D hand-built human model.
- Replace the temporary `window.advanceTime` stepping with a fully verified deterministic test harness once the intro/ending flows stop changing so quickly.

Updates:
- Reader desktop shell is now a true desktop-scrolling layout instead of a mobile-style center column. `reader.html` now uses a desktop right rail, mirrored resume card, dynamic current-chapter context, and a dedicated desktop scroll host in `#main-col`; `goToEp`, progress bar syncing, and auto-scroll now respect that desktop scroll container.
- Reader desktop hero no longer collapses back to a narrow mobile-sized poster at >=1360px. The later media query that had been squeezing `.hero-inner` back down was removed/overridden, and the desktop hero now keeps the wider dual-column composition.
- LM402 quick-fix worker-confirmed items are present in the main worktree: stair-end wormhole return to the LM402 front corridor, daughter subtitle `不管怎麼走，都會回到四樓耶。`, dedicated bottom cinematic subtitle layer, and the perfect-ending subtitle timing of `27.6s -> 32.6s -> 37.6s overlay`.
- Re-validated LM402 debug state on `lm402.html?debug=1`: `renderErrorCount: 0`, `assetState.status: "ready"`, `warpCooldown` and `cinematicSubtitleCue` are exposed in `window.__LM402_DEBUG__.snapshot()`.
- Re-ran perfect-ending subtitle checkpoints with Playwright/debug eval:
  - `28s` => `cinematicSubtitleCue: "line1"` / `也太像徐若瑄了吧！`
  - `33s` => `cinematicSubtitleCue: "line2"` / `這一次，依然遇見妳。`
- LM402 close-up rescue work continued in `assets/lm402/renderer.js`:
  - portrait shell stays suppressed during `perfect` ending shots
  - reference-junior front hair cap / face shell / fringe are hidden in `perfect` close-ups
  - reference-junior front hair volumes were reduced and the `eyes` shot was pulled back toward a safer medium close-up
- New validation artifacts from this round:
  - `output/playwright/index-desktop-1440.png`
  - `output/playwright/reader-desktop-1440.png`
  - `output/playwright/lm402-perfect-line1-1440.png`
  - `output/playwright/lm402-perfect-line2-1440-fixed.png`
  - `output/playwright/lm402-perfect-line1-1440-face-open.png`

TODO:
- The perfect-ending 3D junior close-up is improved versus the earlier giant black blob, but it is still stylized/procedural and not yet at the intended hand-built hero quality. The line1/line2 shot is now readable enough to validate subtitle timing, but the face/hair still need another dedicated art pass.

Updates:
- Added a new reference-junior close-up scaffold in `assets/lm402/renderer.js`:
  - hair-ribbon alpha generation
  - a dedicated hero-head builder for future 3D close-up work
  - extra pose refs for legacy face pieces so close-up-specific visibility can be controlled
- Reworked perfect / eye-contact visibility logic in `assets/lm402/renderer.js` so more of the legacy procedural face can be selectively suppressed instead of always leaking into close-up shots.
- Tightened portrait-shell weighting in `updateJuniorPortraitShell()` so non-dominant planes and glow are reduced more aggressively during close-up blending.
- Added a formal junior asset pipeline scaffold:
  - `assets/lm402/characters/junior/README.md`
  - `tools/export_junior_glb_placeholder.py`
- Fresh validation still shows the cinematic flow and required subtitles remain stable:
  - `endingShotPhase: eyes`
  - `cinematicSubtitleCue: line1`
  - `renderErrorCount: 0`
- New artifacts from this round:
  - `output/playwright/lm402-perfect-line1-1440-herorebuild.png`
  - `output/playwright/lm402-perfect-line1-1440-herorebuild2.png`
  - `output/playwright/lm402-perfect-line1-1440-herorebuild3.png`
  - `output/playwright/lm402-perfect-line1-1440-freshreload2.png`
  - `output/playwright/lm402-perfect-line1-1440-cleancloseup.png`
  - `output/playwright/lm402-perfect-line1-1440-shellsharpened.png`

TODO:
- The formal 3D junior close-up scaffold exists now, but this round did not reach a believable final hero face. The cleanest current result is still reference-driven and the close-up remains the main unresolved art problem.
- If continuing, decide between:
  - finishing the hybrid reference-shell shot for the perfect ending, or
  - replacing it with a true GLB-based hero head once Blender or a source model is available.

Updates:
- Added a formal junior asset-pipeline directory tree under `assets/lm402/characters/junior/` plus `tools/blender_export_junior.py` for a future Blender -> GLB workflow. This was done in a non-overlapping worker slice.
- Pushed another renderer pass on the reference-junior close-up in `assets/lm402/renderer.js`:
  - tracked and suppressed extra front hair strip meshes that were reading as black bars in the perfect close-up
  - re-tuned perfect-shot portrait-shell logic so the image-based shell no longer intentionally reappears during the perfect ending
  - tried both a hidden and visible `heroHeadRoot` path; the visible path still produced hybrid ghosting with the shell/reference stack, so it was left disabled again
  - restored the legacy face pieces in perfect mode after a regression where the close-up had collapsed into a blank head shell
- Validation from this pass:
  - `node --check assets/lm402/renderer.js` passes
  - Playwright/debug still reports `endingShotPhase: eyes`, `cinematicSubtitleCue: line1`, and `renderErrorCount: 0` at the 28s perfect-ending checkpoint
- Current artifacts from the latest experiments:
  - `output/playwright/lm402-perfect-closeup-pass4.png`
  - `output/playwright/lm402-perfect-closeup-final.png`
  - `output/playwright/lm402-perfect-closeup-final2.png`
  - `output/playwright/lm402-perfect-closeup-recover.png`
  - `output/playwright/lm402-perfect-closeup-best-effort.png`

TODO:
- The perfect-ending close-up is still the unresolved blocker. The current renderer can keep the ending stable and preserve subtitles, but the 3D junior face/hair hybrid is still not at believable hero quality.
- If continuing from here, the safest next move is to choose one of these paths and commit to it:
  - keep only one visual system for the perfect close-up (either pure procedural 3D or pure reference-driven shell), or
  - swap in a real GLB head and stop asking the runtime to reconcile multiple face systems at once.

Updates:
- LM402 quick-fix work landed for the current pass: perfect-ending line 2 now reads `這一次，依然再次遇見妳。`, the intro/play audio state now boots muted instead of trusting persisted preference, and the opening music prompt now explicitly tells players the experience starts silent.
- The `music-prompt` button now enables audio directly, while the static HTML toggle now starts as closed so the server-rendered state matches the runtime state before hydration.
- Next verification target is the intro/audio flow on desktop: fresh load, replay intro, and a manual `開啟音樂` click should all behave consistently without disturbing other endings.

Updates:
- Began the mobile UI pass for LM402:
  - added mobile-only transcript dock drag/resize affordances in `lm402.html`
  - added a freeform mobile panel controller in `assets/lm402/app.js` with saved position/size state
  - made floating prompts and perfect-ending subtitles transparent, with smoother fade-in/fade-out transitions
  - made the ending overlay scrollable on mobile so the replay/read-story buttons can be reached
- `node --check assets/lm402/app.js` and `node --check assets/lm402/data.js` both pass after the mobile UI changes.
- I attempted a Playwright mobile-emulation verification pass, but the harness stalled while loading/inspecting the mobile state, so full interaction screenshots are still pending. The code path is in place; the next agent should re-run a smaller mobile browser probe if needed.

Updates:
- Expanded `assets/lm402/data.js` with a formal junior GLB manifest contract for `junior2005`, including `runtimeModelUrl`, `heroCloseupModelUrl`, `animationClips`, `materialProfiles`, `runtimeTierPolicy`, `fallbackPolicy`, `exportTargets`, and `audioBootPolicy: "always_off"`.
- Reworked `tools/blender_export_junior.py` into a dual-output Blender export skeleton that can dry-run outside Blender and documents the contract for `junior_2005_runtime.glb`, `junior_2005_hero_closeup.glb`, and the optional mobile derivative.
- Turned `assets/lm402/characters/junior/` into a proper handoff tree with reference, textures, work, and export subfolder READMEs so the next Blender pass can start from a clear structure instead of guesswork.
- Verified the new contract via `python3 -m py_compile tools/blender_export_junior.py`, a `--dry-run` exporter run, and a Node ESM import of `assets/lm402/data.js`.

TODO:
- The manifest now points to the future GLB locations, but the actual hero model still needs Blender work before the runtime can switch away from the current procedural/reference shell.

Updates:
- Reworked `tools/generate_junior_glb.mjs` so the hero close-up is now a dedicated head-and-shoulders bust instead of a stretched full-body close-up. The bust now has its own compact torso, collar, shoulder slope, and hair adjustments aimed at the 2005 reference direction.
- Re-generated the junior GLB outputs in `assets/lm402/characters/junior/exports/` after the bust refactor:
  - `junior_2005_runtime.glb`
  - `junior_2005_hero_closeup.glb`
  - `junior_2005_runtime_mobile.glb`
- Upgraded `junior_2005_export_manifest.json` and the generator-side manifest contract so the export roles are explicit: runtime, bust-style hero closeup, and mobile derivative.
- Verified the generator still passes `node --check`, and the regenerated GLBs now show a dedicated `junior_hero_bust` / `hero_bust_*` hierarchy in the hero close-up export.

TODO:
- The new bust is much closer to the intended close-up shape, but it is still procedural. The remaining risk is the final face read: whether the brows, eyes, and mouth need one more manual proportion pass in Blender to fully reach the 2005定稿 feeling.

Updates:
- Tightened `tools/generate_junior_glb.mjs` again for the hero export: smaller head sphere, narrower jaw and chin, reduced eye whites / irises, shorter brows/lashes, less hair-cap volume, thinner side locks, and a more compact ponytail / fringe treatment so the face reads less cartoonish and less column-like.
- Added explicit hero anchors into the generated GLB scene graph: `hero_face_anchor`, `hero_eyes_anchor`, `hero_bust_anchor`, and `hero_shoulders_anchor`.
- Re-generated `assets/lm402/characters/junior/exports/junior_2005_hero_closeup.glb` plus the matching runtime and mobile exports after the proportion pass.
- The hero export now reports a dedicated bust hierarchy in the GLB node list and the file size dropped a little from the previous bust pass, which is consistent with the tighter geometry.

TODO:
- The remaining risk is still facial likeness at hero distance: if the next renderer pass needs a precise focus anchor, the new anchors are ready, but the geometry is still procedural rather than hand-sculpted.

Updates:
- Homepage pass:
  - changed the hero-side copy to `你可以決定先讀故事，還是先感受「一眼瞬間」。`
  - removed the `桌機電影感優先` copy
  - changed the timeline copy from `如果那三分鐘沒有接到` to `如果沒有接到`
  - added a homepage font-size control widget (`小 / 中 / 大 / 特大 / 超大`) in `index.html`
  - reworked the `把那一眼，先走一遍` card toward a cleaner corridor / doorway composition and tightened its mobile text wrapping
- LM402 mobile/UI pass:
  - verified the transcript/history window can run in `mobile-freeform` mode with drag + resize handles on mobile landscape
  - kept floating prompts and perfect-ending subtitles on transparent backgrounds
  - added / validated the mobile ending scroll range so replay / read-story actions remain reachable
  - intro audio still boots muted and the explicit `開啟音樂` prompt remains visible on entry
- LM402 validation tooling:
  - installed local Playwright test support for validation only (`npm install --no-save @playwright/test`)
  - added `tools/lm402-ui-verify.spec.js` to capture desktop homepage, desktop perfect-ending subtitles, and mobile landscape transcript/ending overlay behavior
  - added auto-debug URL params in `assets/lm402/app.js` (`autoskipintro`, `autophase`, `autoending`, `autoendingtime`, `autoendingoverlay`, `autotranscript`) so screenshots and scripted validation can jump to precise LM402 states
  - fixed a browser boot regression where `urlParams` had been named `H` and collided with the existing `H()` character builder; this had silently prevented `window.__LM402_DEBUG__` from registering in-browser
- Formal junior GLB pass:
  - added browser-loadable `assets/lm402/GLTFLoader.js`
  - added procedural export tooling in `tools/generate_junior_glb.mjs`
  - generated live runtime assets at:
    - `assets/lm402/characters/junior/exports/junior_2005_runtime.glb`
    - `assets/lm402/characters/junior/exports/junior_2005_hero_closeup.glb`
    - `assets/lm402/characters/junior/exports/junior_2005_runtime_mobile.glb`
  - confirmed via Playwright + LM402 debug snapshots that the perfect-ending line 1 / line 2 checkpoints now report:
    - `assetState.loaderAvailable = true`
    - `loadedModels = ["runtime", "hero_closeup"]`
    - `currentVariant = "hero_closeup_glb"` during the `eyes` phase after a forced frame advance
    - `renderErrorCount = 0`

TODO:
- The formal GLB path is now real and verified, but the hero close-up is still visually wrong. The browser is switching to `hero_closeup_glb`, yet the resulting framing still reads as an empty classroom / ceiling-light composition instead of a believable close-up of the junior. This is now a camera-anchor / hero-asset alignment problem, not a loader problem.
- Best next move from here:
  - add a dedicated hero-face anchor to the GLB debug snapshot (or expose the hero node world position), then align the perfect `eyes` camera to that anchor rather than to the generic junior root, or
  - replace the current generated `junior_2005_hero_closeup.glb` with a true hand-sculpted / hand-placed head-and-shoulders asset from Blender, because the current procedural close-up model still does not produce a usable face shot.

Updates:
- Added a focused verification pass in `tools/lm402-ui-verify.spec.js` for the current close-up state:
  - desktop line1 / line2 screenshots now land in `output/playwright/lm402-perfect-line1-closeup-desktop.png` and `output/playwright/lm402-perfect-line2-closeup-desktop.png`
  - a new `output/playwright/lm402-closeup-diagnosis.json` file records the latest close-up judgment
  - the mobile ending result image remains `output/playwright/lm402-mobile-ending-verify.png`
- Current close-up diagnosis from the fresh Playwright + debug pass:
  - the most out-of-line axis is `geometry`
  - evidence: in both perfect line checkpoints the GLB loader stays healthy and `currentVariant` remains `hero_closeup_glb`, but the close-up still reads as a heavy black shell / silhouette instead of a face; `renderErrorCount` remains `0`
  - camera framing is still a secondary concern, but the first-order miss is the close-up geometry rather than lighting

Updates:
- Fixed a real browser-breaking regression in `assets/lm402/renderer.js`: `attachJuniorGltfModel()` had duplicated the identifier `l`, which prevented `window.__LM402_DEBUG__` from ever registering in-browser even though the page HTML loaded. After the fix, the debug API came back and desktop perfect-ending validation was runnable again.
- Reworked the hero-anchor path so close-up anchors are now treated in the correct coordinate space:
  - `attachJuniorGltfModel()` now stores root-local anchor positions after the GLB scene node is attached and transformed
  - `resolveJuniorHeroAnchor()` now converts GLB anchors through world space instead of pretending the model root local position was already world space
- Unified the production junior path again in `assets/lm402/renderer.js`:
  - gameplay and ending anchor resolution now force the runtime junior root instead of selecting closeup/procedural heads
  - legacy hero closeup roots are hidden inside the renderer visibility logic so they cannot leak into production shots
  - `updateJuniorHeroFaceCard()` now keys off the runtime root only
- Regenerated the junior exports via `tools/generate_junior_glb.mjs` so `junior_2005_hero_closeup.glb` mirrors the full-body runtime bundle instead of exporting a bust-only variant.
- Verified with Playwright after the renderer/export update:
  - `tools/lm402-model-consistency.spec.js` => `1 passed`
  - `tools/lm402-hero-capture.spec.js` => `1 passed`
  - fresh `output/playwright/lm402-model-consistency.json` now confirms `rear_wait`, `eye_contact`, `perfect`, `canon`, `memory`, and `missed` all stay on `runtime_glb` with `runtimeVisible = true`, `closeupVisible = false`, `proceduralVisible = false`, `renderErrorCount = 0`
- Visual spot-check:
  - `output/playwright/lm402-rear-wait-runtime.png` now shows a full-body runtime junior in gameplay
  - `output/playwright/lm402-perfect-facecard-line1.png` shows the perfect close-up still using the same runtime junior path without a detached procedural head or portrait-shell swap
- Removed the old hard-coded hero-closeup root shove (`y = -0.82`) that had been forcing the bust below the floor plane and pulling the camera toward empty space.
- Reframed the perfect `eyes` / `overlay` camera into a more honest medium close-up:
  - the camera now sits farther back and slightly lower
  - the close-up no longer collapses into ceiling / wall geometry
  - current debug evidence in `output/playwright/lm402-perfect-line1-verify.json` shows `heroCloseupTarget` populated, `currentVariant = "hero_closeup_glb"`, and `renderErrorCount = 0`
- Did another proportion pass on `tools/generate_junior_glb.mjs` and regenerated all three junior exports:
  - reduced the hero hair-cap volume and back-hair mass
  - narrowed the face, jaw, chin, eyes, brows, nose, and lip geometry toward a less cartoonish read
  - thinned and moved the hero bangs so they stop cutting directly across the eyes
  - toned down hero hair / face material gloss so the close-up reads less like a plastic shell
- Current validation status after the latest pass:
  - `npx playwright test tools/lm402-ui-verify.spec.js --reporter=line --workers=1` => `3 passed`
  - latest key images:
    - `output/playwright/lm402-perfect-line1-closeup-desktop.png`
    - `output/playwright/lm402-perfect-line2-closeup-desktop.png`
    - `output/playwright/lm402-mobile-ending-verify.png`

TODO:
- The perfect-ending junior is materially better than the earlier black-shell / giant-head failures, but it is still not at the requested “hand-built photoreal hero” level. The current state is:
  - stable
  - fully validated in-browser
  - clearly using the formal GLB close-up path
  - still stylized / procedural rather than convincingly realistic
- The cleanest remaining route to the true target quality is still a real Blender-authored head-and-shoulders hero asset that replaces the procedural hero face geometry outright, rather than further proportion tweaks on the generated mesh.

Updates:
- Continued the junior close-up push with a renderer-first cleanup:
  - perfect ending now prefers the formal `hero_closeup_glb` path over the temporary procedural hero head whenever the GLB bundle is ready
  - `resolveJuniorHeroAnchor()` now prefers visible GLB roots before falling back to the procedural hero root, so the perfect `eyes` camera is aligned to the active runtime asset rather than to a hidden fallback node
  - `setJuniorHeroLeadVisibility()` now supports hiding the procedural hero head while still suppressing the old legacy face geometry, which keeps the runtime state coherent during perfect close-up shots
- Did another 2005-reference proportion pass in `tools/generate_junior_glb.mjs` and regenerated all junior exports:
  - smaller hero head, jaw, chin, nose, lips, brows, and irises
  - reduced hero hair-cap and back-hair volume
  - thinner / less intrusive hero bangs and side locks
  - narrower hero bust / shoulder profile so the close-up reads lighter and closer to the white-shirt reference
- Added `tools/lm402-hero-capture.spec.js` as a dedicated LM402 perfect-ending capture harness so future close-up passes can dump line1 / line2 images and JSON without reusing the general UI verification output names

Lessons from this pass:
- A temporary experiment that re-enabled a reference-photo face overlay during the perfect close-up was tested and then intentionally rolled back. It produced large residual portrait artifacts / misaligned overlays that were worse than the stable GLB-only result.
- The current stable close-up is therefore still the GLB-led version in:
  - `output/playwright/lm402-perfect-line1-closeup-desktop.png`
  - `output/playwright/lm402-perfect-line2-closeup-desktop.png`
  - validation remains green: `npx playwright test tools/lm402-ui-verify.spec.js --reporter=line --workers=1 --grep "LM402 desktop perfect ending keeps hero close-up active"` => `1 passed`

Current status:
- The junior close-up is no longer running through the procedural hero-head path during perfect. Debug snapshots now consistently show:
  - `assetState.currentVariant = "hero_closeup_glb"`
  - `renderErrorCount = 0`
  - perfect line1 / line2 subtitles both present
- The visual quality is improved versus the earlier floating-head / black-shell failures, but it is still far from the requested "perfect, ultra-beautiful, hand-built 3D junior" target. The remaining gap is now mostly asset quality:
  - facial likeness
  - hair silhouette / fringe behavior
  - neck-to-shoulder transitions
  - overall realism of the hero bust

Updates:
- Re-centered the current priority around consistency instead of swapping heads in the ending:
  - disabled the separate perfect-ending close-up route in `assets/lm402/renderer.js`
  - the junior now stays on the same runtime GLB path in gameplay and in all four endings
  - detached procedural head visibility is forced off while the runtime model remains active
  - the temporary face-card experiment is no longer part of the runtime path
- Validation now explicitly checks "same model, no face/body split":
  - `tools/lm402-ui-verify.spec.js` now asserts that the perfect ending uses `runtime_glb`, with `runtimeVisible = true`, `closeupVisible = false`, `proceduralVisible = false`
  - added `tools/lm402-model-consistency.spec.js` to verify visible gameplay phases plus all four endings (`perfect`, `canon`, `memory`, `missed`) against the same runtime junior model
- Latest verification results:
  - `npx playwright test tools/lm402-ui-verify.spec.js --reporter=line --workers=1 --grep "LM402 desktop perfect ending keeps hero close-up active|LM402 mobile transcript dock drags/resizes and ending slider appears"` => `2 passed`
  - `npx playwright test tools/lm402-model-consistency.spec.js --reporter=line --workers=1` => `1 passed`
  - `output/playwright/lm402-model-consistency.json` confirms:
    - `rear_wait.variant = "runtime_glb"`
    - `eye_contact.variant = "runtime_glb"`
    - `perfect/canon/memory/missed.variant = "runtime_glb"`
    - all four endings keep `runtimeVisible = true`, `closeupVisible = false`, `proceduralVisible = false`, `renderErrorCount = 0`

Updates:
- Landed the `LM402 透明 UI + 學妹同模 + reader 閱讀優先` pass:
  - `assets/lm402/lm402.css` now keeps major LM402 surfaces on transparent or near-transparent fills instead of heavy dark panels:
    - objective prompt
    - subtitle / cinematic subtitle
    - transcript dock / transcript items
    - dialogue / ending cards
    - memory / control widgets
    - music / speed / audio / font widgets
  - readability is preserved with thin borders, lighter shadows, and reduced scrim weight instead of solid dark blocks
- Tightened the junior live-render policy:
  - `assets/lm402/data.js` now marks `junior2005.liveDisplayPolicy = "runtime_only"`
  - `assets/lm402/renderer.js` now preserves the runtime GLB root's base transform instead of shoving the live model upward during hero-lead states
  - runtime hero anchor resolution now prefers `runtimeModelRoot` before any close-up or procedural fallback root
  - result: gameplay + all four endings stay on the same grounded runtime junior path, with no separate live close-up head
- Hardened LM402 DOM rendering in `assets/lm402/app.js`:
  - transcript rendering now uses DOM node construction instead of `innerHTML`
  - phase strip rows now use explicit DOM nodes
  - memory items now use explicit DOM nodes
  - dialogue copy / choices now use explicit DOM nodes
  - ending tracker now uses DOM node construction instead of string-built HTML
- Reworked `reader.html` toward the selected reading-first desktop mode:
  - the persistent desktop right rail has been removed from the live layout
  - desktop reading now keeps the left sidebar + central reading column, with guidance moved into the hero and the existing `故事導覽` overlay
  - the desktop guide state is now validated via `tools/lm402-ui-verify.spec.js`
- Added targeted frontend hardening in `reader.html` without touching story body content:
  - icon/button helpers now build SVG buttons with DOM APIs instead of `innerHTML`
  - sidebar / jump-grid episode entries now build DOM nodes directly
  - timeline / traversal / modal string templates now escape dynamic text fields
  - external `_blank` links now use `rel="noopener noreferrer"`
- Expanded verification artifacts:
  - `output/playwright/lm402-rear-wait-runtime.png`
  - `output/playwright/lm402-eye-contact-runtime.png`
  - `output/playwright/lm402-ending-perfect-runtime.png`
  - `output/playwright/lm402-ending-canon-runtime.png`
  - `output/playwright/lm402-ending-memory-runtime.png`
  - `output/playwright/lm402-ending-missed-runtime.png`
  - `output/playwright/reader-desktop-guide-verify.png`
- Current verification status after this pass:
  - `npx playwright test tools/lm402-model-consistency.spec.js tools/lm402-ui-verify.spec.js --reporter=line --workers=1` => `5 passed`
  - `output/playwright/lm402-model-consistency.json` still confirms:
    - `rear_wait.variant = "runtime_glb"`
    - `eye_contact.variant = "runtime_glb"`
    - `perfect/canon/memory/missed.variant = "runtime_glb"`
    - all endings keep `runtimeVisible = true`, `closeupVisible = false`, `proceduralVisible = false`, `renderErrorCount = 0`

TODO:
- The junior is now consistent and grounded, but the art quality is still far from the requested “完美版 3D 精緻超美學妹”. The remaining gap is primarily asset quality, not runtime stability.
- `reader.html` is safer than before, but a strict deployment CSP is still blocked by the large inline script / inline handler architecture. The eventual fix is to move reader logic into external JS and replace inline event attributes with event listeners.

Updates:
- Fixed a desktop-reader regression introduced by the layout refactor:
  - desktop auto mode was reading `#main-col` for current scroll position, but still using `document.documentElement.scrollHeight` as its end-of-scroll limit
  - this caused desktop autoplay to stop too early or behave as if it were already at the bottom
- `reader.html` now uses shared desktop/mobile scroll helpers:
  - `getScrollMetrics()`
  - `scrollToReaderTop()`
  - `scrollToReaderBottom()`
  - desktop autoplay, top, and bottom controls all now target the real desktop scroll host (`#main-col`) instead of the window/document root
- Expanded verification in `tools/lm402-ui-verify.spec.js`:
  - added a dedicated desktop reader autoplay test
  - it verifies that autoplay advances `#main-col.scrollTop`
  - it also verifies the desktop top/bottom controls now act on the same desktop reading host
- Latest reader-specific validation:
  - `npx playwright test tools/lm402-ui-verify.spec.js --reporter=line --workers=1 --grep "reader desktop auto mode scrolls the desktop reading host|reader desktop keeps guidance in overlay instead of a persistent right rail|homepage desktop hero stays readable"` => `3 passed`
  - latest artifact: `output/playwright/reader-auto-desktop-verify.png`
