# reader.html — Lighthouse 無障礙診斷報告

- **診斷日期**：2026-04-09
- **工具版本**：Lighthouse 13.1.0 / axe-core 4.11.2
- **目標 URL**：https://toniliumvp.github.io/RedTime/reader.html

---

## 一、總覽分數

| 環境 | 無障礙分數 | 通過 | 失敗 | 不適用 | 需手動確認 |
|------|-----------|------|------|--------|-----------|
| **Desktop** | **94 / 100** | 20 | 2 | 41 | 10 |
| **Mobile**  | **89 / 100** | 19 | 3 | 41 | 10 |

> 失敗項目共 **3 個唯一 audit**（desktop 2 個、mobile 3 個，其中 1 個僅 mobile 失敗）。

---

## 二、失敗項目彙整表

| # | audit id | 標題 | Desktop 分數 | Mobile 分數 | 受影響元素數 |
|---|----------|------|:-----------:|:-----------:|:-----------:|
| 1 | `label` | 表單元素缺少關聯標籤 | 0 (FAIL) | 0 (FAIL) | 1 |
| 2 | `label-content-name-mismatch` | 可見文字標籤與無障礙名稱不符 | 0 (FAIL) | 0 (FAIL) | 1 |
| 3 | `link-name` | 連結缺乏可辨識名稱（僅 Mobile） | 1 (PASS) | 0 (FAIL) | 1 |

---

## 三、各失敗項目詳細說明

---

### [FAIL-1] `label` — 表單元素缺少關聯標籤

**嚴重程度**：高（WCAG 1.3.1 / 4.1.2）

**說明**：
> Labels ensure that form controls are announced properly by assistive technologies, like screen readers.
> 參考：https://dequeuniversity.com/rules/axe/4.11/label

**Desktop 與 Mobile 完全相同**，均有 1 個受影響元素。

#### 受影響元素

| 屬性 | 值 |
|------|-----|
| **CSS Selector** | `body > div#auto-panel > div.ap-speed-row > input#ap-slider` |
| **HTML Snippet** | `<input type="range" class="ap-slider" id="ap-slider" min="1" max="10" value="3" oninput="setAutoSpeed(+this.value)">` |

**axe-core 診斷訊息**：
```
Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
```

**問題分析**：
`#auto-panel` 中的自動播放速度 `<input type="range">` 滑桿（`#ap-slider`）完全缺少標籤。螢幕閱讀器無法得知此控制元件的用途，使用者只會聽到「滑桿，1 到 10」，不知道它是調整「自動播放速度」。

---

### [FAIL-2] `label-content-name-mismatch` — 可見文字與無障礙名稱不符

**嚴重程度**：高（WCAG 2.5.3）

**說明**：
> Visible text labels that do not match the accessible name can result in a confusing experience for screen reader users.
> 參考：https://dequeuniversity.com/rules/axe/4.11/label-content-name-mismatch

**Desktop 與 Mobile 完全相同**，均有 1 個受影響元素。

#### 受影響元素

| 屬性 | 值 |
|------|-----|
| **CSS Selector** | `div.hero-inner > div.hero-poster > div.hero-copy-col > button#resume-card` |
| **HTML Snippet** | `<button class="hero-resume show" id="resume-card" onclick="resumeReading()" aria-label="繼續上次閱讀進度">` |
| **按鈕可見文字** | `繼續閱讀` / `從 EP0 · 青春期少女 · 繼續` / `上次看到這一集，點一下就回到閱讀進度。` |
| **aria-label 值** | `繼續上次閱讀進度` |

**axe-core 診斷訊息**：
```
Fix any of the following:
  Text inside the element is not included in the accessible name
```

**問題分析**：
按鈕 `#resume-card` 的 `aria-label="繼續上次閱讀進度"` 與按鈕內可見文字（「繼續閱讀」）不相符。  
WCAG 2.5.3（Label in Name）要求：若控制元件有可見文字，其無障礙名稱**必須包含**可見文字。  
語音控制使用者（如 Dragon NaturallySpeaking）說「點一下 繼續閱讀」時可能無法觸發該按鈕，因為 AT 只看到 `aria-label` 的值。

---

### [FAIL-3] `link-name` — 連結缺乏可辨識名稱（**僅 Mobile**）

**嚴重程度**：中（WCAG 2.4.4 / 4.1.2）

**說明**：
> Link text (and alternate text for images, when used as links) that is discernible, unique, and focusable improves the navigation experience for screen reader users.
> 參考：https://dequeuniversity.com/rules/axe/4.11/link-name

**Desktop**：PASS（Desktop 導覽列結構不同，未觸發）  
**Mobile**：FAIL（行動版專屬的 `#topnav-mobile` 導覽列）

#### 受影響元素

| 屬性 | 值 |
|------|-----|
| **CSS Selector** | `div#main-col > div#topnav-mobile > div.nav-actions > a.nav-btn` |
| **HTML Snippet** | `<a class="nav-btn nav-home-btn" href="index.html">` |

**axe-core 診斷訊息**：
```
Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
```

**問題分析**：
行動版頂部導覽列的「回首頁」連結 `<a class="nav-btn nav-home-btn" href="index.html">` 內部只有圖示（可能是 icon font 或 SVG），沒有文字、`aria-label`、`title` 或 `aria-labelledby`。  
螢幕閱讀器使用者只會聽到「連結」，無法得知連結目的地或功能。  
Desktop 版的同等連結可能以不同 HTML 結構呈現，因此未被偵測到。

---

## 四、需手動確認的項目（Manual Audits）

以下 10 個項目 Lighthouse 標記為「需手動確認」，自動工具無法檢測，建議後續人工審查：

| audit id | 說明 |
|----------|------|
| `custom-controls-labels` | 自訂互動元件是否有正確標籤（如自訂 player 按鈕） |
| `custom-controls-roles` | 自訂互動元件是否有正確 ARIA role |
| `focus-traps` | 模態對話框等是否有焦點陷阱問題 |
| `focusable-controls` | 所有互動元件是否可被鍵盤聚焦 |
| `interactive-element-affordance` | 互動元件的視覺提示是否充分 |
| `logical-tab-order` | Tab 順序是否符合視覺邏輯 |
| `managed-focus` | 動態內容變更後焦點是否被正確管理 |
| `offscreen-content-hidden` | 螢幕外內容是否對 AT 隱藏（`aria-hidden`） |
| `use-landmarks` | 頁面是否使用適當的 ARIA landmarks |
| `visual-order-follows-dom` | 視覺順序是否與 DOM 順序一致 |

---

## 五、修正優先建議（**等待確認，暫不修改任何源碼**）

| 優先順序 | audit id | 建議修正方向 | 預期影響 |
|---------|----------|------------|---------|
| P1（高） | `label` | 為 `#ap-slider` 加上 `aria-label="自動播放速度"` 或搭配可見 `<label for="ap-slider">` | 螢幕閱讀器可正確朗讀滑桿用途；分數 +3~5 分 |
| P1（高） | `label-content-name-mismatch` | 修改 `#resume-card` 的 `aria-label` 使其**包含**可見文字，例如 `aria-label="繼續閱讀 — 上次閱讀進度"` | 符合 WCAG 2.5.3，語音控制可正常使用 |
| P2（中） | `link-name` | 為 `.nav-home-btn` 加上 `aria-label="回到首頁"` 或在連結內加隱藏文字 `<span class="sr-only">首頁</span>` | Mobile 螢幕閱讀器可識別首頁連結；Mobile 分數 +3~5 分 |

> **注意**：以上所有建議僅為診斷結果，**等待 toni 確認後才執行修正**。請勿在確認前對 `reader.html` 或任何 CSS 做任何改動。

---

## 六、附錄：測試環境說明

| 項目 | Desktop | Mobile |
|------|---------|--------|
| 測試時間 | 2026-04-09T13:01:43Z | 2026-04-09T13:02:13Z |
| User Agent | HeadlessChrome/146 (macOS) | HeadlessChrome/146 模擬 moto g power (2022) Android 11 |
| Viewport | 桌機標準 | 行動版模擬 |
| Lighthouse 版本 | 13.1.0 | 13.1.0 |
| axe-core 版本 | 4.11.2 | 4.11.2 |
