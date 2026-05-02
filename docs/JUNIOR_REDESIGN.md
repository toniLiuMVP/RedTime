# 學妹外觀重新設計 · 雙時空架構極限探討

> **狀態**:設計探討(2026-05-02 18:00 toni round-3+1+1 ask)
> **toni 原話**:「學妹現在的設計不像『人』,在 LM402 雙時空重新設計學妹外表」
>「LM402 的學妹 3D 呈現才是最重要的,才會一眼瞬間」
> **重要對齊**:本 doc 跟 [F_SPRINT_PLAN.md](F_SPRINT_PLAN.md) 強耦合 — F sprint Phase 5「E 一眼瞬間精雕」隱含「學妹必須高 poly」前提

---

## 現狀(2026-05-02)

學妹是「**程式積木 N 個 primitives**」(SphereGeometry / BoxGeometry / TorusGeometry 等組成),非 SkinnedMesh、非 GLB 載入。

已實做(累積 9 個 milestone):
- **17 處 mesh 細節**(雙眼皮 / 鼻樑 / 顴骨 / 下巴 / cornea / 睫毛 / 牙齒 / 耳朵 / 鎖骨 / 飛揚髮絲...)
- **8 種半寫實材質**(M2)
- **A1 Subsurface Scattering** 強化(M13)
- **A2 Marschner hair approximation**(M13)
- **A3 Iris parallax**(M13)
- **A4 Skin pore detail**(M13)
- **A7 PCSS 軟陰影**(M13)
- **B8 Sweat / blush dynamic**(M10)
- **C5 Gaze focus AI**(M10)
- **C8 學妹發起互動 6 種情緒**(M15)

**為什麼仍「不像人」**:程式積木的根本限制 — 臉部 polygon flow 不像「藝術家雕塑」,sphere segments 邊界仍可見,deep-cheek / soft-temple / philtrum / nasolabial fold 等微妙結構 primitive 給不出。

---

## 4 路設計選擇

### 路 A:強化現有 primitive(架構內極限)

**做法**:
- mesh 細節 17 處 → 30+(nasolabial fold / philtrum / temple / under-eye bag / lip vermillion border)
- 提升 sphere segments(從 16/24 → 64/96)
- Layered SSS(2-3 層皮膚深度)
- Micro-shadowing(face occlusion mesh 2 層)
- 髮絲分群(3-4 group 取代單一 hair mesh)

**工程量**:1-2 週
**極限可達**:Genshin Impact 角色級(動畫卡通寫實風)
**保留**:程式生成優勢(無外部資產,GitHub Pages 友善,< 1 MB 場景)
**限制**:**仍不會「真像人」** — primitive 邊界仍可見,程式風存在

### 路 B:換 GLB 模型載入(雙時空 only)⭐ toni 訴求對應

**做法**:
- 用 high-poly GLB(50K-150K triangle 寫實人形 mesh)取代 primitive
- `characters/junior/exports/` 已有 placeholder GLB(從 GLTFLoader 載)
- expression-rig 改接 morph targets(blendshape)
- cloth-rig 改接 SkinnedMesh weights

**工程量取決於 GLB 來源**:

| GLB 來源 | 工程量 | 品質 | 成本 |
|---|---|---|---|
| toni 自己 Blender / ZBrush 建模 | 整合 2-3 週 | 完全 toni 設計 | toni 學習曲線 / 時間 |
| 外包 3D artist(以 toni 1994/2005/2025 學妹定稿 PNG 為參考)| 整合 1-2 週 + 外包 4-8 週 | 專業級 | $$$ + 溝通成本 |
| **AI 生成(RODIN / Tripo / Meshy)從 2D 圖** | 整合 1-2 週 + AI 嘗試 1 天 | 中等(可能需要修整) | 工具訂閱 ~$30 |
| 既有 asset library(VRoid / DAZ)再客製 | 整合 1-2 週 | 中等(有 generic 感) | 免費 / $20 |

**極限可達**:MetaHuman 風人物渲染(若 GLB 品質夠 + ML 表情)

**限制**:
- 失去「程式生成」優勢(GLB 約 5-50 MB)
- 需 LFS 或 CDN 託管
- expression-rig 重接是 risk
- ⚠️ **toni 的 1994/2005/2025 學妹定稿是 PNG 2D 圖**,不是 3D mesh source — 需要先轉 3D

### 路 C:混合(GLB 主體 + primitive 細節)

**做法**:GLB 頭/身基礎 + primitive 補強(髮絲 / 睫毛 / 衣物紋理 / 配件)

**工程量**:4-6 週
**極限**:Genshin/MetaHuman 之間
**何時選**:GLB 取得後但 toni 仍想保留部分程式生成優勢

### 路 D:AI 生成 GLB(2026 新工具)⭐ 低成本探索

**做法**:
1. toni 提供 1994/2005/2025 學妹定稿 4 張參考圖
2. 跑 **Tripo / RODIN / Hyper3D / Meshy** 等 AI image-to-3D 工具生 GLB
3. ZBrush / Blender 修整(可選)
4. 整合進 lm402-twin

**工程量**:1 天嘗試 + 1-2 週整合(若品質 OK)
**極限可達**:看 AI 工具品質,通常 70-85% 真實感
**風險**:
- AI 生成可能不像 toni 心目中的學妹(需 toni 視覺確認)
- 細節模糊(需 ZBrush 修)
- 動畫 rig 需手動加(AI 不出 rig)

**ROI 最高的選擇** — 1 天驗證可行性,可行就走路 B,不可行就確認需要外包 3D artist。

---

## 「程式積木」架構下的極限到底是什麼?

直接答:**Genshin Impact 角色級**(高品質動畫卡通寫實),但**不會像「真人」**。

原因:
- primitive 的 polygon flow 是球體 / 立方體切分,不是肌肉/骨骼線
- sphere 的 isohedral pattern 在臉頰 / 鼻翼曲線時無法消除
- 沒有 sculpt 工具的 microsurface(toni 雕「人臉」級 vs primitive 切「形狀」級)

「不像人」的視覺訊號:
- **平直邊**:sphere 邊界與表情線不重合
- **缺乏軟組織暗示**:沒有 cheek 層次、philtrum 凹凸、nasolabial fold 動感
- **均勻反射**:沒有「皮膚 vs 黏膜」漸變(雖 SSS 已模擬一部分)

要突破這些 → 必須換 mesh source(路 B/C/D)。

---

## 雙時空架構下的極限階段(WebGL2 + WebGPU)

| 層級 | 描述 | 達成方法 |
|---|---|---|
| **L1 程式生成卡通**(現狀) | 整潔 / 一眼可辨 / 但不像真人 | M2-M15 已達 |
| **L2 程式生成寫實**(路 A 極限) | Genshin 卡通寫實 / 藝術風 | 路 A,1-2 週 |
| **L3 GLB 卡通**(路 B 中等品質) | VRoid 風日系角色 | 路 B + asset library,2-3 週 |
| **L4 GLB 寫實**(路 B + AI 生成) | 接近真人但仍可分辨 | 路 D + 路 B,3-4 週 |
| **L5 MetaHuman**(路 B 專業 GLB + WebGPU + ML 表情) | 像看真人 / 「劇場級」 | 路 B 外包 + F sprint,8-12 週 |
| **L6 path-traced 真實感**(L5 + ray tracing + 4K 微觀) | 電影級 close-up | L5 + 加 path tracing,需 dedicated GPU |

**11:00 一眼瞬間的目標應該是 L4-L5**(整個人被釘在原地那種看見)。

---

## 跟 F sprint 的強耦合

F_SPRINT_PLAN.md 的 Phase 5「E 一眼瞬間精雕」設計:
- 11:00 鐘響 dedicated camera
- 4K-level PBR 學妹/學長
- ML lip-sync(若可行)
- 高解析度光線追蹤

**問題**:這些技術建立在「**學妹是高 poly mesh**」前提。在 primitive 上套 4K texture 沒意義(low-poly 顯示不出 4K 細節)。

所以:
- **路 A 強化 primitive** + F sprint = F4/E 投入回報降低 50%(高技術但 low-poly mesh 看不出差異)
- **路 B/C/D GLB 化** + F sprint = F4/E 真正發揮(L5 MetaHuman 級)

⚠️ **toni 既要 F 全做,又要學妹重新設計** — 兩件事必須一起做才有意義。

---

## 我的建議(toni 決定)

### 推薦組合:**路 D(AI 試)→ 路 B(GLB 整合)→ F 全做**

**Phase 0 — AI 生成嘗試**(1 天)
- toni 提供 4 張定稿圖
- 跑 Tripo / RODIN / Meshy 各生一個
- 看哪個最像 toni 心目中的學妹
- **Exit**:1 個 GLB 候選,toni 視覺確認

**Phase 1 — GLB 整合到 lm402-twin**(2-3 週)
- 載入 GLB 取代 primitive 學妹
- expression-rig 接 morph targets
- cloth-rig 接 SkinnedMesh
- 維持 lm402.html 原始時間線(primitive 版,作為對照組)

**Phase 2 — F1.2-F4 WebGPU 改造**(4-5 週)
- Phase 1 GLB 完成後,F sprint 開始
- F2/F3 切換 + shader 重寫
- F4 compute shader 跑 GLB 髮絲 / SSGI

**Phase 3 — E 一眼瞬間精雕**(2 週)
- 4K texture 精細化
- 微表情 amplification(11:00 那秒眼神聚焦)
- dedicated camera + lighting
- ML lip-sync(可選)

**總工程量**:**8-12 週 dedicated sprint**(含路 B + F sprint + E)

### 退而求其次:路 A 強化 primitive(保守)

如果不想投 8-12 週:
- 路 A 強化現有 primitive(1-2 週)
- 達 L2 程式寫實,Genshin 級
- 「一眼瞬間」用「程式生成的學妹」傳達情感(藝術風,不像真人但有獨特風格)
- 跳過 F sprint(不切 WebGPU)
- 總工程量 1-2 週

---

## 跟其他系統的關係

- **A6 Motion blur(toni 已 confirm 真做)**:GLB 化後 motion blur 更有意義(布料/髮絲動感)
- **F1~F4(toni 已 confirm 全做)**:必須跟 GLB 化一起做,否則 ROI 降低 50%
- **E4 場景變換(simplified 設計骨架)**:GLB 學妹 + E4 prop mesh 配合,氛圍更完整
- **B3 預設 0.30(本 session 改的)**:GLB 學妹 + 意識光柱配合,「七嘴八舌」具象化

---

## 下一步建議

1. toni 看本 doc + F_SPRINT_PLAN.md 確認方向(路 D + B + F + E 全做 = 8-12 週?)
2. 提供 1994/2005/2025 學妹定稿 4 張高解析度 PNG
3. dedicated session 跑 Phase 0(AI 生成嘗試)— 1 天
4. AI 結果評估後決定走 GLB 整合 or 找外包 artist or 退路 A

**本 session 不真做** — 8-12 週工程不該在日常 session 啟動半成品。給設計骨架 + 等 toni 決定。
