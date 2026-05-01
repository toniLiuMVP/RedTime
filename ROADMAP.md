# ROADMAP.md — 時間裡的兩個妳 · 路線圖

> 學自 PTT / JYQXZ 等專案的 ROADMAP 慣例。
> 完整 commit-level 進度看 git log；本檔給「milestone 級」全景。

最後更新：2026-05-02

---

## 三線分工（toni 決策）

```
LM402（正本）─────── WebGL2 + 程式生成 + 半寫實 ─────── 穩定保守升級
LM402-twin（雙時空）── WebGL2 走極限 + 意識菜市場 ───── 主推路線（最豐富）
LM402-parallel（平行）── WebGPU + 學妹學長精緻 ─────── 探索並行（重大改造）
```

---

## ✅ Milestone 完成歷史

### M1 — Tier 1 渲染管線（2026-04-28）
黃昏 HDR IBL + 電影派 Bloom/DOF/Vignette 後製
- `commit 0c03e15` envmap-sunset / postfx / postfx-focus / renderer 整合

### M2 — Tier 2 半寫實升級（2026-04-28）
8 種半寫實材質 + 17 處 mesh 細節（雙眼皮、鼻樑、顴骨、下巴、cornea、睫毛、牙齒、耳朵、鎖骨、飛揚髮絲）
- `commit 0c03e15`

### M3 — Tier 3 表情系統（2026-04-28）
眨眼/嘴/微笑/揚眉/視線 + 自動 idle（呼吸 + 眨眼）
- `commit 0c03e15`

### M4 — Tier 4 布料動態（2026-04-28）
- `commit 1c561f1` cloth-rig.js spring + 風 + mass 漸減馬尾

### M5 — Tier 5 電影級後製（2026-04-28）
- `commit 66cb20b` Hex bokeh + CA + Grain + Color Grade + MSAA

### M6 — Tier 6 寫實天花板（2026-04-28）
- `commit cddc0f4` Iridescence + Emissive + Lens Dirt

### M7 — Tier 7 Web 視覺終局（2026-04-28）
- `commit f2b735e` God Rays + Lens Flare + sun NDC 連動

### M8 — Audio 自動停 + Lens Dirt 預設關（2026-04-28）
- `commit 2ff99c7` lm402.html + audio Hook constructor
- `commit 5098593` demos 也加 audio hook

### M9 — Tier 8 行為活感 + Tier 9.1 VSM 軟陰影（2026-04-29）
- `commit 9299606` Eye tracking + Saccade + Micro-expressions + Head wobble + VSM

### M10 — 短期 5 項（C6/C5/B8/F7/E10）（2026-04-29）
- `commit c85c861` C6 Hover/click 反應
- `commit dd0cd5f` C5 Gaze focus AI
- `commit 1cddaea` B8 Sweat / blush dynamic
- `commit fce08dd` F7 Rain on lens
- `commit e73e3b4` E10 Polaroid 拍照

### M11 — 三線分工建立（2026-04-29）
- `commit 64decb6` LM402 副本 lm402-twin + lm402-parallel（方案 A 完整資料夾複製）

### M12 — 雙時空 B 系列：意識菜市場 3 派（2026-04-29 ~ 2026-04-30）
- `commit 8c818bd` B3 光柱派（5 盞 SpotLight）
- `commit 264298e` B2 粒子派（150 個記憶碎片）
- `commit 0788951` B4 文字派（12 sprite toni 原文短句）

### M13 — 雙時空 A 系列：視覺極限 6/7（2026-04-30）
- `commit cee0b62` A4 Skin pore detail
- `commit 685811e` A3 Iris parallax
- `commit 397f780` A5 Volumetric Fog
- `commit 36576c9` A1 Skin SSS 強化
- `commit 4c0ab55` A2 Hair Marschner approximation
- `commit d5e2759` A7 PCSS simplified

### M14 — 雙時空 H 系列：文學擴充 7/7（2026-04-30）
- `commit 8820ec4` H1+H3 字幕 + 打字機
- `commit 4d44a73` H2+H4 章節 fade + 記憶閃回
- `commit 13a925b` H6+H7+H8 書信日記 + 環境音 + 動態 BGM

### M15 — 雙時空 C8 + E3（2026-04-30）
- `commit 4a42bf9` C8 學妹發起互動（6 種情緒）
- `commit 73bb406` E3 季節時間環境（5 preset）

### M16 — 平行世界 F1.1（2026-04-30）
- `commit b90b3fa` WebGPU detection + fallback overlay

### M17 — 文件補強（2026-04-30）
- ROADMAP.md / PENDING.md / CLAUDE.md 跨專案 lessons

### M18 — 雙時空白塊修復 nuclear default（2026-05-01）
toni 連續 3 輪反映「畫面濛 / 學妹被特效蓋過 / 學妹完全被覆蓋（白塊）」。
診斷：B2 + B3 + B4 三派同 anchor（學妹頭部）+ AdditiveBlending → 過曝白塊。
- `commit bf0e0c4` 第 1 輪：A5 Volumetric Fog 修「濛濛一片」
- `commit f284d3d` 第 2 輪：5 個 effect 大幅降低
- `commit da94815` 第 3 輪：bloom/DOF/exposure/fog 再降
- `commit 41ab5ed` 第 4 輪：**nuclear default** — 所有過曝 effect 預設 = 0，console opt-in
- CLAUDE.md 動工紀律加第 6 條（預設值要算最壞情況疊加）

---

## 🚧 進行中 / 待開工

詳見 [PENDING.md](PENDING.md)。簡述：

- **A6** Motion blur — 跳過真做（工程量大，效果有限）
- **E4** 場景變換 — 留待劇情需要時做
- **C7** Idle pose — 架構限制（需 SkinnedMesh）
- **F1.2 → F4** 平行世界 WebGPU 改造 — **4-6 週 dedicated sprint**
- **E** 一眼瞬間 WebGPU 精雕 — 依賴 F4

---

## 📅 預期里程碑（猜測）

| 時間 | 里程碑 |
|---|---|
| 2026-05 | B2/B3/B4 平衡點調校 + USAGE/FAQ 補強 |
| 2026-05~06 | 真做平行世界 F1.2-F4（如果 toni 願意 4-6 週投入） |
| 2026-06+ | E 一眼瞬間 WebGPU 精雕（依賴 F4） |
| 2026-Q3 | 月台狂奔同模式三線分工 |

---

## console API 速查（雙時空）

```
window.__POSTFX__          // Tier 1-7 後製管線 tuning
window.__JUNIOR_RIG__       // 表情 + 互動 + 情緒
window.__CLOTH_RIG__        // 布料動態
window.__CONSC_LIGHTS__     // B3 意識光柱
window.__CONSC_PARTICLES__  // B2 意識粒子
window.__CONSC_TEXT__       // B4 意識文字
window.__NARRATIVE__        // H1+H3 字幕 + 打字機
window.__TRANSITIONS__      // H2+H4 章節 fade + 記憶閃回
window.__LETTER__           // H6 書信日記
window.__AUDIO_LAYER__      // H7+H8 環境音 + BGM
window.__INITIATED__        // C8 學妹發起互動
window.__ENV__              // E3 季節時間 5 preset
```

---

## 跨專案參考

- **PAL_2026 仙劍** `/Volumes/Mac Mini M4/PAL_2026/` — 跨平台懶人包架構參考
- **JYQXZ 金庸** `/Volumes/Work/JYQXZ/` — 雙向同步 + PENDING.md 慣例
- **LD 俠客遊 II** `/Volumes/Work/LD/` — 「絕對規則」CLAUDE.md 模式
- **PTT** `/Volumes/Work/PTT/` — ARCHITECTURE / ROADMAP / SECURITY 文件分立
- **Work-Projects.md** `/Volumes/Work/Work-Projects.md` — 工作 SSD 專案總覽
