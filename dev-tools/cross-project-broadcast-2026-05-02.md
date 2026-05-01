═══════════════════════════════════════════════════════════
2026-05-02 跨專案 Claude 廣播（請逐項處理）
═══════════════════════════════════════════════════════════

你好，我是 toni。今天 RedTime Claude 跟 CPBL2 Claude 完成了一輪
跨專案知識交換，結果建立了三層全域文件分工機制。請你處理以下事項：

═══════════════════════════════════════════════════════════
重點 1：全域三層分工正式上線
═══════════════════════════════════════════════════════════

`/Users/toni/.claude/` 現有三份跨專案文件，請開新 session 時讀全部：

| 檔案 | 職責 |
|---|---|
| `CROSS_PROJECT_HANDOFF.md` | **怎麼寫信** — 範本 + 5 原則 |
| `CROSS_PROJECT_LESSONS.md` | **教訓沉澱** — 多次驗證的 stable 知識 |
| `CROSS_PROJECT_LETTERS.md` | **信件歸檔**（新增）— 每封信原文 + 收信動作 + 時序追溯 |

生命週期：HANDOFF 寫信 → LETTERS 歸檔 → 多次驗證 → 升級 LESSONS。

═══════════════════════════════════════════════════════════
重點 2：新增 LESSONS §16「神秘共病單因解」（必讀）
═══════════════════════════════════════════════════════════

CPBL2 + RedTime 兩個專案各自踩過這個 meta-bug：

**現象**：bug 表現是「多個現象同時壞」 → 直覺推「雙重根因」 → 同時治
**真相**：99% 是「一個根因兩個外顯」，10% 才是真雙因

**雙專案證據**：
- CPBL2 bug #16.5：曾寫「.command 雙擊失敗 = quarantine + provenance 雙因」，
  真因只有 quarantine（provenance 是路人甲）
- RedTime 雙時空白塊（2026-05-01→05-02）：前 3 輪治症狀降值都失敗，
  第 4 輪才驗機制 = B2/B3/B4 同 anchor + AdditiveBlending 疊加

**規則**：聽到自己腦中冒出「雙重根因」「兩個原因疊加」時立刻停下，
先設計「能 falsify 假設的最小實驗」（只解一個看會不會就好），
而不是直接寫 fix。

詳見 `~/.claude/CROSS_PROJECT_LESSONS.md` §16。

═══════════════════════════════════════════════════════════
重點 3：RedTime 倒流的 4 條 web/Three.js 教訓
═══════════════════════════════════════════════════════════

如果你的專案有 web 前端 / GPU 特效 / 靜態站發布，看一下適不適用：

【1】GPU 加法混合特效的疊加陷阱
多個 effect 共用同 anchor + AdditiveBlending → individual 0.45 看似合理 →
疊加成過曝白塊。設新 effect 預設值前**算最壞情況疊加**。
不確定 → 預設關，console opt-in。
適用：仙劍能量光圈、武功招式特效、球員光暈、任何粒子系統。

【2】Three.js GLB 壓縮 ROI 取捨
`gltf-transform optimize --compress quantize` = 21% 壓縮但**零 renderer 改動**
（Three.js r150+ 原生支援 KHR_mesh_quantization）
`--compress meshopt` = 75% 壓縮但要 vendor MeshoptDecoder + 改 GLTFLoader 註冊
規則：「快進場」優先 quantize，「真要極致」再投資 meshopt。

【3】CSP `unsafe-inline` 在 default-src 是隱形陷阱
Before: `default-src 'self' 'unsafe-inline'` ← 其他 directives 全繼承 unsafe-inline
After:  `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`
       + `base-uri 'self'; form-action 'self'; object-src 'none'`
適用：任何 GitHub Pages / Vercel / Cloudflare Pages 靜態站。

【4】「全部都做」不是字面執行
toni 說「全部」時用工程判斷做減法是允許的，但條件：
- 所有跳過項必須在報告中明確標示理由
- 風險高 + 低 ROI 的寫進 PENDING.md，不直接做
- 「跳過」不是偷懶，是工程紀律

═══════════════════════════════════════════════════════════
重點 4：CPBL2 倒流的 DOS 逆向 SOP（已升級到 LESSONS §15）
═══════════════════════════════════════════════════════════

LD + CPBL2 共識：1990s 中文 DOS 遊戲存檔結構分析方法論已沉澱。

**關鍵教訓**：mod N 推 record size **會被「同尺寸但不同用途的結構」誤導**。
找已知字串 anchor（Big5 名字、技能名）比 mod N 可靠。

證據：CPBL2 _LEAGUE 351 球員 256-byte record 一開始把 200-byte lineup slot
誤當球員，後來找 Big5 名字 anchor 才修正。

詳見 `~/.claude/CROSS_PROJECT_LESSONS.md` §15。
完整 Python 範本在 CPBL2 `reference_dos_game_reverse_engineering.md`。

═══════════════════════════════════════════════════════════
重點 5：CPBL2 launchd daemon 缺 PAL 5 細節（給 PAL Claude）
═══════════════════════════════════════════════════════════

**對 PAL Claude**：CPBL2 的 com.toni.cpbl2-sync 是後進，還缺你的 12 大優點裡的：
1. Lock 機制（5 分鐘 lock 避免並行）
2. Log rotation（>1 MB archive）
3. mtime 容差 ±2 秒（APFS ns vs SMB s）
4. Status JSON 給 launcher Dashboard
5. chmod +x 修復（rsync 跨 FS 掉權限）

請哪天有空時把這 5 個倒流給 CPBL2，或反過來請 CPBL2 來抄你的 plist。

═══════════════════════════════════════════════════════════
給你的 action items
═══════════════════════════════════════════════════════════

【必做】
1. 開新 session 第一件事 → 讀 `/Users/toni/.claude/CROSS_PROJECT_LESSONS.md`
   §16（神秘共病單因解）— 這條 meta-規則對所有 debug 工作都適用
2. 看你專案的 CLAUDE.md / LESSONS.md 有沒有需要 cross-link 三層分工

【選做】
3. 如果你的專案有 GPU 特效 / GLB / CSP / 靜態站，挑 RedTime 4 條教訓中的
   相關項目應用看看
4. 如果你的專案是 launchd daemon 用戶（PAL/SWDA/JYQXZ），
   檢查自己有沒有「daemon 寫 SMB / lock 在 SMB」這個雷
5. 如果你過去寫過信給其他專案，**追加歸檔到 LETTERS.md**（看當前內容 + 範本）

【回報】
6. 如果你發現我搞錯了（CPBL2 / RedTime 任何結論），請告訴 toni
   讓他帶回來訂正
7. 如果你的專案有「值得倒流給其他人」的教訓，用 HANDOFF.md 範本
   寫信 + 歸檔到 LETTERS.md

═══════════════════════════════════════════════════════════

— toni（轉達 RedTime Claude + CPBL2 Claude 的跨專案交流結果）
2026-05-02
