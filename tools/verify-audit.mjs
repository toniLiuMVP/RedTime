#!/usr/bin/env node
/**
 * verify-audit.mjs — 網站品質基線自動驗證腳本
 *
 * 用途：每次重大改動後執行，30 秒內自動確認所有品質基線是否維持。
 * 執行：node tools/verify-audit.mjs
 *
 * 檢查項目：
 *   1. 四頁 canonical 標籤
 *   2. sitemap.xml 存在與格式
 *   3. fonts.css 四種字體 @font-face 宣告
 *   4. prefers-reduced-motion 實作
 *   5. Google Fonts CDN 殘留
 *   6. platform-run 安全檢查（確認使用 textContent 而非不安全的 DOM 方法）
 *   7. .docx/.doc 是否被 git 追蹤
 *   8. .gitignore 關鍵規則
 */

import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let passed = 0;
let failed = 0;
let warnings = 0;

function read(relPath) {
  const full = resolve(ROOT, relPath);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf-8');
}

function pass(msg) {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
  passed++;
}

function fail(msg) {
  console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
  failed++;
}

function warn(msg) {
  console.log(`  \x1b[33m!\x1b[0m ${msg}`);
  warnings++;
}

// ─── 1. Canonical 標籤 ───
console.log('\n\x1b[1m[1] Canonical 標籤\x1b[0m');
const canonicalPages = [
  { file: 'index.html', url: 'https://toniliumvp.github.io/RedTime/' },
  { file: 'reader.html', url: 'https://toniliumvp.github.io/RedTime/reader.html' },
  { file: 'lm402.html', url: 'https://toniliumvp.github.io/RedTime/lm402.html' },
  { file: 'demos/platform-run/index.html', url: 'https://toniliumvp.github.io/RedTime/demos/platform-run/index.html' },
];

for (const { file, url } of canonicalPages) {
  const content = read(file);
  if (!content) { fail(`${file} — 檔案不存在`); continue; }
  if (content.includes(`rel="canonical"`) && content.includes(url)) {
    pass(`${file} — canonical 正確`);
  } else {
    fail(`${file} — canonical 缺失或 URL 不正確`);
  }
}

// ─── 2. sitemap.xml ───
console.log('\n\x1b[1m[2] sitemap.xml\x1b[0m');
const sitemap = read('sitemap.xml');
if (!sitemap) {
  fail('sitemap.xml 不存在');
} else {
  if (sitemap.includes('<urlset')) pass('sitemap.xml 格式正確');
  else fail('sitemap.xml 缺少 <urlset> 根元素');

  const expectedUrls = ['/RedTime/', '/RedTime/reader.html', '/RedTime/lm402.html', '/RedTime/demos/platform-run/index.html'];
  for (const u of expectedUrls) {
    if (sitemap.includes(u)) pass(`sitemap 包含 ${u}`);
    else warn(`sitemap 未包含 ${u}`);
  }
}

// ─── 3. fonts.css 字體宣告 ───
console.log('\n\x1b[1m[3] fonts.css 字體 @font-face 宣告\x1b[0m');
const fontsCss = read('fonts/fonts.css');
if (!fontsCss) {
  fail('fonts/fonts.css 不存在');
} else {
  const requiredFonts = ['Noto Serif TC', 'Noto Sans TC', 'Cormorant Garamond', 'DM Mono'];
  for (const font of requiredFonts) {
    const regex = new RegExp(`font-family:\\s*'${font.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g');
    const matches = fontsCss.match(regex);
    if (matches && matches.length > 0) {
      pass(`${font} — ${matches.length} 組 @font-face 宣告`);
    } else {
      fail(`${font} — 未找到 @font-face 宣告`);
    }
  }

  if (fontsCss.includes('font-display: swap') || fontsCss.includes('font-display:swap')) {
    pass('font-display: swap 已設定');
  } else {
    warn('未找到 font-display: swap');
  }
}

// ─── 4. prefers-reduced-motion ───
console.log('\n\x1b[1m[4] prefers-reduced-motion 實作\x1b[0m');
const motionFiles = ['index.html', 'reader.html', 'assets/lm402/lm402.css'];
for (const file of motionFiles) {
  const content = read(file);
  if (!content) { fail(`${file} — 檔案不存在`); continue; }
  if (content.includes('prefers-reduced-motion')) {
    pass(`${file} — prefers-reduced-motion 已實作`);
  } else {
    fail(`${file} — 未找到 prefers-reduced-motion`);
  }
}

// ─── 5. Google Fonts CDN 殘留 ───
console.log('\n\x1b[1m[5] Google Fonts CDN 殘留檢查\x1b[0m');
const htmlFiles = ['index.html', 'reader.html', 'lm402.html'];
let cdnClean = true;
for (const file of htmlFiles) {
  const content = read(file);
  if (!content) continue;
  if (content.includes('fonts.googleapis.com') || content.includes('fonts.gstatic.com')) {
    fail(`${file} — 仍有 Google Fonts CDN 引用`);
    cdnClean = false;
  }
}
if (cdnClean) pass('所有 HTML 頁面無 Google Fonts CDN 殘留');

// ─── 6. platform-run 安全檢查 ───
console.log('\n\x1b[1m[6] platform-run 安全檢查\x1b[0m');
const platformRun = read('demos/platform-run/index.html');
if (!platformRun) {
  warn('demos/platform-run/index.html 不存在');
} else {
  // 檢查是否使用安全的 textContent 而非不安全的 DOM 注入
  const unsafePattern = /\.innerHTML\s*=/g;
  const unsafeMatches = platformRun.match(unsafePattern);
  if (!unsafeMatches) {
    pass('platform-run 未使用不安全的 DOM 注入方式（安全）');
  } else {
    warn(`platform-run 發現 ${unsafeMatches.length} 處可能的不安全 DOM 操作，請人工確認`);
  }

  if (platformRun.includes('maxlength=')) {
    pass('輸入欄位有 maxlength 限制');
  } else {
    warn('未找到 maxlength 輸入限制');
  }
}

// ─── 6.5 platform-run 外部依賴檢查（供應鏈透明化）───
console.log('\n\x1b[1m[6.5] platform-run 外部依賴檢查\x1b[0m');
if (platformRun) {
  if (platformRun.includes('cdn.jsdelivr.net') || platformRun.includes('unpkg.com') || platformRun.includes('cdnjs.cloudflare.com')) {
    warn('platform-run 使用第三方 CDN（請確認版本鎖定與必要性）');
  } else {
    pass('platform-run 未檢出第三方 CDN 依賴（已 self-host）');
  }
}

// ─── 6.6 platform-run SEO meta 檢查 ───
console.log('\n\x1b[1m[6.6] platform-run SEO meta\x1b[0m');
if (platformRun) {
  if (platformRun.includes('name="description"')) {
    pass('platform-run 有 meta description');
  } else {
    fail('platform-run 缺少 meta description');
  }
  if (platformRun.includes('og:title') && platformRun.includes('og:description')) {
    pass('platform-run 有 Open Graph 標籤');
  } else {
    fail('platform-run 缺少 Open Graph 標籤');
  }
  if (platformRun.includes('twitter:card')) {
    pass('platform-run 有 Twitter Card 標籤');
  } else {
    warn('platform-run 缺少 Twitter Card 標籤');
  }
}

// ─── 7. .docx/.doc git 追蹤 ───
console.log('\n\x1b[1m[7] 敏感檔案 git 追蹤檢查\x1b[0m');
try {
  const tracked = execFileSync('git', ['ls-files', '*.docx', '*.doc'], { cwd: ROOT, encoding: 'utf-8' }).trim();
  if (tracked) {
    fail(`以下檔案仍被 git 追蹤:\n      ${tracked.split('\n').join('\n      ')}`);
  } else {
    pass('無 .docx/.doc 檔案被 git 追蹤');
  }
} catch {
  warn('無法執行 git ls-files（非 git repo？）');
}

// ─── 8. .gitignore 關鍵規則 ───
console.log('\n\x1b[1m[8] .gitignore 規則\x1b[0m');
const gitignore = read('.gitignore');
if (!gitignore) {
  fail('.gitignore 不存在');
} else {
  const rules = ['.DS_Store', 'Backup/', '*.docx', 'node_modules/'];
  for (const rule of rules) {
    if (gitignore.includes(rule)) {
      pass(`.gitignore 包含 ${rule}`);
    } else {
      warn(`.gitignore 缺少 ${rule}`);
    }
  }
}

// ─── Summary ───
console.log('\n' + '─'.repeat(50));
console.log(`\x1b[1m結果：\x1b[32m${passed} 通過\x1b[0m / \x1b[31m${failed} 失敗\x1b[0m / \x1b[33m${warnings} 警告\x1b[0m`);
if (failed > 0) {
  console.log('\x1b[31m有檢查項目未通過，請修復後重新執行。\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32m所有品質基線維持正常。\x1b[0m');
}
