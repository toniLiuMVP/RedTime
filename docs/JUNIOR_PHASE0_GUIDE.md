# 學妹 Phase 0 — toni 動手 step-by-step 引導

> **狀態**:toni round-5+1 ask「引導我學妹外觀重新設計」(2026-05-03)
> **適用**:🟪 LM402 雙時空(原始時間線維持 primitive 對照組)
> **背景設計**:[JUNIOR_REDESIGN.md](JUNIOR_REDESIGN.md)
> **AI 工具比較**:[target_glb/README.md](../assets/lm402-twin/characters/junior/target_glb/README.md)

## ⏱ 時間 + 預期成果

- 1 天工作量(toni 自己跑,我不能代跑)
- 產出 1 個 GLB 候選檔(若 AI 結果可接受)
- 產出 meta.json 紀錄評分

---

## Step 1 — 整理 reference image(15 分鐘)

學妹定稿 PNG 在 SMB:

```
/Volumes/Mac Mini M4/Red Time/2005年學妹定稿/
```

9 張 PNG(右前 / 左側 / 左前 / 正面 / 背面 各 1 張 + 特寫 4 張)。

**Step 1.1**:挑 4 張代表性圖(正面特寫 + 左側特寫 + 右前特寫 + 背面)。AI 工具通常吃 1-4 張多視角圖。

**Step 1.2**:確認解析度(Finder 看資訊應 ≥ 2048×2048,單張 4-5 MB → 已 OK)

**Step 1.3**:不要修圖,AI 喜歡原圖

---

## Step 2 — 跑 AI 工具(各 5-15 分鐘,免費 tier)

| 工具 | URL | 推薦度 | 備註 |
|---|---|---|---|
| **Tripo** | https://tripo3d.ai | ⭐⭐⭐ 先試 | 從 image 生 GLB,人形品質佳;免費 tier 每天 ~10 次 |
| **RODIN** | https://hyper3d.ai | ⭐⭐ 細節高 | 高 sculpting 細節但臉可能要修 |
| **Meshy** | https://meshy.ai | ⭐⭐ 速度快 | 5 分鐘出 GLB,texture 完整但人形普通 |

**建議**:Tripo 跑正面特寫 + 試 multi-view(若工具支援多圖)。RODIN / Meshy 各跑 1 次比較。

**prompt 提示**(若工具要求):
```
Anime-style young Asian woman, 29 years old, long black hair,
white long-sleeve shirt, looking forward, full body or head close-up.
Half-realistic style (between anime and realistic),
suitable for game character GLB export.
```

---

## Step 3 — 評分(20 分鐘)

開 GLB 在以下任一 viewer:
- **VS Code**:`gltf-viewer` 套件
- **Blender**(若有):File > Import > glTF
- **線上**:https://gltf-viewer.donmccurdy.com/(拖檔上去)

按 6 維度打分(滿分 5):

| 指標 | 看什麼 |
|---|---|
| **臉部 polygon flow** | 像「人臉」軟組織結構,不像 sphere 切割 |
| **眼部** | 雙眼皮 / 上瞼 / 內外眥的解剖正確性 |
| **鼻部** | 鼻翼 / 鼻樑 / 鼻尖立體感 |
| **嘴部** | 唇紅 / philtrum / nasolabial fold |
| **整體比例** | 跟學妹定稿 PNG 對比一致性(臉長 / 五官距離) |
| **mesh 品質** | poly count(50K-150K)/ topology(quad-dominant)/ UV |

通過標準:**5 個指標 ≥ 3 達 4 分**(滿分 5)→ 進 Step 4。

未通過:回 Step 2 試另一工具,或跳 Step 5「外包 3D artist」決策。

---

## Step 4 — GLB 整理進 repo(5 分鐘)

```bash
cp ~/Downloads/junior_v1.glb /Volumes/Work/RedTime/assets/lm402-twin/characters/junior/target_glb/junior_2005_v1.glb
```

寫 meta.json(套用 [target_glb/README.md](../assets/lm402-twin/characters/junior/target_glb/README.md) 範本):

```bash
cat > /Volumes/Work/RedTime/assets/lm402-twin/characters/junior/target_glb/junior_2005_v1_meta.json <<EOF
{
  "source_tool": "Tripo",
  "source_image": "2005年學妹正面長袖襯衫定稿特寫.png",
  "prompt": "...上面的 prompt...",
  "generated_at": "$(date '+%Y-%m-%d')",
  "scoring": {
    "polygon_flow": 4,
    "eyes": 3,
    "nose": 4,
    "mouth": 3,
    "proportion": 5,
    "mesh_quality": 4,
    "average": 3.83
  },
  "decision": "proceed-to-phase-1"
}
EOF
```

commit + push:

```bash
cd /Volumes/Work/RedTime && git add assets/lm402-twin/characters/junior/target_glb/ && git commit -m "feat(junior): Phase 0 GLB v1 候選 (Tripo,平均 3.83)" && git push
```

---

## Step 5 — 回報給 Claude(進 Phase 1)

跟 Claude 說:

```
學妹 Phase 0 完成
工具:Tripo / RODIN / Meshy(填用了哪個)
評分:6 維度平均 X.X
決定:proceed-to-phase-1 / try-another / outsource
```

→ Claude dedicated session 進 Phase 1(GLB 整合到 lm402-twin,2-3 週):
- 載入 GLB 取代 primitive 學妹
- expression-rig.js 改接 morph targets(blendshape)
- cloth-rig.js 改接 SkinnedMesh weights
- 維持 lm402.html 原始時間線(primitive 版,作為對照組)

---

## ⚠️ 不通過 / 不滿意時

如果 AI 生成 3 個工具都不到 4 分平均:
- **選項 A**:**外包 3D artist**(把 PNG 給專業 3D 模型師,成本 $200-1000 USD,耗時 2-4 週)
- **選項 B**:**找既有 asset library 客製**(VRoid / DAZ 角色 + 改五官,$0-50 USD)
- **選項 C**:**保留現狀**(primitive 學妹維持,放棄 MetaHuman 級「一眼瞬間」目標,只做平行世界 F2/F3 視覺持平 lm402-twin 但跑 WebGPU)

選項 B/C 比較省時但達不到 toni「LM402 學妹 3D 才是一眼瞬間核心」的願景 L4-L5 等級。

---

## 跟 F sprint 的時序

```
學妹 Phase 0(toni 1 天)— 本 doc
    ↓ 通過評分
學妹 Phase 1(Claude dedicated session 2-3 週) — GLB 整合 lm402-twin
    ↓ GLB 學妹活在 lm402-twin
F2-F4 + E sprint(Claude dedicated 6-9 週)— 平行世界 WebGPU 改造
    ↓ 整個 sprint 完成
✨ 11:00 一眼瞬間達 L5 MetaHuman 級
```

---

**toni 該做的下一個動作**:打開 `/Volumes/Mac Mini M4/Red Time/2005年學妹定稿/`,挑 4 張代表圖,開 https://tripo3d.ai 試跑。
