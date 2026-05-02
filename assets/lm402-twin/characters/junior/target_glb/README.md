# 學妹重新設計 GLB 目標目錄

> **狀態**:Phase 0 等待 toni 跑外部 AI 工具(2026-05-02 22:00 設立)
> **設計文件**:[../../../../../docs/JUNIOR_REDESIGN.md](../../../../../docs/JUNIOR_REDESIGN.md)
> **路線**:推薦路 D(AI 生成 GLB)+ 路 B(整合進 lm402-twin)

## 預留位置

未來 GLB 檔放這個目錄,例如:
```
target_glb/
├── junior_2005_v1.glb         # AI 生成 v1
├── junior_2005_v1_meta.json   # 來源工具 / 提示詞 / 評分
├── junior_2005_v2.glb         # 修整 v2
└── README.md                   # 本檔
```

## Phase 0 — toni 該做的事(1 天 dedicated)

### Step 1:準備 reference 圖

學妹定稿在 SMB:
```
/Volumes/Mac Mini M4/Red Time/2005年學妹定稿/
```

含 9 張 5 MB PNG(右前 / 左側 / 左前 / 正面 / 背面 各 1 張 + 特寫 4 張)。

**為什麼選 2005 年版本** — 11:00 一眼瞬間是 2005 年 29 歲學妹(LESSONS 已記)。1994 / 2025 版本可作為時序變化參考但不該是 GLB 主源。

### Step 2:選 AI 工具

| 工具 | URL | 強項 | 適合度 |
|---|---|---|---|
| **Tripo** | https://tripo3d.ai | 從 2D 圖生 GLB,人形品質佳 | ⭐⭐⭐ 推薦先試 |
| **RODIN** | https://hyper3d.ai | 高細節 sculpting | ⭐⭐ 細節好但要修 |
| **Meshy** | https://meshy.ai | 快速 + texture 完整 | ⭐⭐ 速度快但人形普通 |
| **Hyper3D** | (RODIN 同公司產品) | 多視角融合 | ⭐⭐ |

建議 toni 各跑 1 次(免費 tier 足夠 1 張 image-to-3D)比較結果。

### Step 3:評分 + 選 v1

| 指標 | 評分標準 |
|---|---|
| **臉部 polygon flow** | 是否像「人臉」軟組織結構,不像 sphere 切割 |
| **眼部** | 雙眼皮 / 上瞼 / 內外眥的解剖正確性 |
| **鼻部** | 鼻翼 / 鼻樑 / 鼻尖立體感 |
| **嘴部** | 唇紅 / philtrum / nasolabial fold |
| **整體比例** | 跟學妹定稿 PNG 對比一致性(臉長 / 五官距離) |
| **mesh 品質** | poly count(50K-150K)/ topology(quad-dominant)/ UV |

**通過標準**:5 個指標 ≥ 3 達 4 分(滿分 5)→ 進入 Phase 1 整合。
**未通過**:回 Step 2 試另一工具,或考慮路 B 外包 3D artist。

### Step 4:GLB 整理進 repo

```bash
# 從 AI 工具下載 GLB 到本目錄
cp ~/Downloads/junior_v1.glb /Volumes/Work/RedTime/assets/lm402-twin/characters/junior/target_glb/junior_2005_v1.glb

# 寫 meta.json 紀錄來源
cat > junior_2005_v1_meta.json <<EOF
{
  "source_tool": "Tripo / RODIN / Meshy",
  "source_image": "2005年學妹正面長袖襯衫定稿特寫.png",
  "prompt": "anime-style young woman, 29-year-old, Asian features, ...",
  "generated_at": "2026-05-XX",
  "scoring": {
    "polygon_flow": 4,
    "eyes": 3,
    "nose": 4,
    "mouth": 3,
    "proportion": 5,
    "mesh_quality": 4
  },
  "decision": "proceed-to-phase-1 / try-another-tool / outsource"
}
EOF
```

### Step 5:回報 + 進 Phase 1

toni 跑完 Phase 0 後告訴 Claude:
- 哪個工具用了
- 評分結果
- 選 v1 / 重試 / 外包

→ Claude 進 Phase 1(GLB 整合到 lm402-twin,2-3 週)。

## 不該放這目錄的東西

❌ Reference PNG(在 SMB,單張 5 MB,git LFS 化前不該 cp 進 repo)
❌ Blender / ZBrush 工程檔(`.blend` / `.zpr`,toni 可放 SMB workspace)
❌ 過時 GLB 版本(用 git history 即可)

## 容量估計

GLB 一個版本 5-50 MB(取決於 poly count + texture)。預估 v1-v3 累積 20-150 MB。**git LFS 化** 在進 Phase 1 前評估。

## 跟其他系統的關係

- **expression-rig.js**:GLB 載入後改接 morph targets(blendshape)替代現在 primitive 的 sphere scale
- **cloth-rig.js**:接 SkinnedMesh weights 取代 primitive cloth
- **junior-materials-hr.js**:GLB 自帶 material 跟現有 PBR layer 整合(SSS / Iridescence)
- **F sprint Phase 5 E 一眼瞬間精雕**:dependent on this Phase 0 + 1 完成
