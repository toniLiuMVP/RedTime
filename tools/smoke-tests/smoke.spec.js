// tools/smoke-tests/smoke.spec.js
// 三瀏覽器 Smoke Test — RedTime GitHub Pages
// 目標網址: https://toniliumvp.github.io/RedTime/
// 執行方式: npx playwright test tools/smoke-tests/smoke.spec.js --config tools/smoke-tests/playwright.config.js

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://toniliumvp.github.io/RedTime';

// 全域 console error 收集（每頁獨立，彙整到 global）
let consoleErrorLog = [];

function getOutputDir(browserName) {
  return path.resolve(__dirname, '../../output/smoke', browserName);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 建立收集 console error 的監聽器，回傳 errors 陣列 (by reference)
function attachConsoleListener(page, browserName, pageName) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const entry = {
        browser: browserName,
        page: pageName,
        level: 'error',
        text: msg.text(),
      };
      errors.push(entry);
      consoleErrorLog.push(entry);
    }
  });
  page.on('pageerror', (err) => {
    const entry = {
      browser: browserName,
      page: pageName,
      level: 'pageerror',
      text: err.message,
    };
    errors.push(entry);
    consoleErrorLog.push(entry);
  });
  return errors;
}

// ──────────────────────────────────────────────
// Page 1: 首頁 /
// ──────────────────────────────────────────────
test('index — 首頁基本檢查', async ({ page, browserName }) => {
  const outDir = getOutputDir(browserName);
  ensureDir(outDir);
  const errors = attachConsoleListener(page, browserName, 'index');

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });

  // 主要導覽連結可見
  const readerLink = page.locator('a[href*="reader"]').first();
  const lm402Link = page.locator('a[href*="lm402"]').first();
  const platformLink = page.locator('a[href*="platform"]').first();
  await expect(readerLink).toBeVisible({ timeout: 10000 });
  await expect(lm402Link).toBeVisible({ timeout: 10000 });
  await expect(platformLink).toBeVisible({ timeout: 10000 });

  // Service Worker
  const swState = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'not_supported';
    try {
      const reg = await navigator.serviceWorker.getRegistration('/RedTime/');
      if (reg) return 'registered';
      // 可能尚未完成註冊，等一下
      return 'no_registration_yet';
    } catch (e) {
      return 'error: ' + e.message;
    }
  });
  console.log(`[${browserName}] index SW state: ${swState}`);

  // 截圖
  await page.screenshot({ path: path.join(outDir, 'index.png'), fullPage: true });

  // 沒有 console error
  if (errors.length > 0) {
    console.warn(`[${browserName}] index console errors:`, errors.map(e => e.text));
  }
  expect(errors.filter(e => e.level === 'pageerror').length).toBe(0);
});

// ──────────────────────────────────────────────
// Page 2: /reader.html
// ──────────────────────────────────────────────
test('reader — A11y 元素 + aria-label', async ({ page, browserName }) => {
  const outDir = getOutputDir(browserName);
  ensureDir(outDir);
  const errors = attachConsoleListener(page, browserName, 'reader');

  await page.goto(`${BASE_URL}/reader.html`, { waitUntil: 'networkidle', timeout: 30000 });

  // #ap-slider 存在且有 aria-label
  const slider = page.locator('#ap-slider');
  await expect(slider).toBeAttached({ timeout: 10000 });
  const sliderAriaLabel = await slider.getAttribute('aria-label');
  expect(sliderAriaLabel, '#ap-slider 應有 aria-label').toBeTruthy();

  // #resume-card 存在（hidden 也 OK）
  const resumeCard = page.locator('#resume-card');
  await expect(resumeCard).toBeAttached({ timeout: 10000 });

  // .nav-home-btn 存在且有 aria-label
  const navHomeBtn = page.locator('.nav-home-btn').first();
  await expect(navHomeBtn).toBeAttached({ timeout: 10000 });
  const navAriaLabel = await navHomeBtn.getAttribute('aria-label');
  expect(navAriaLabel, '.nav-home-btn 應有 aria-label').toBeTruthy();

  // 截圖
  await page.screenshot({ path: path.join(outDir, 'reader.png'), fullPage: false });

  // pageerror 不允許
  if (errors.length > 0) {
    console.warn(`[${browserName}] reader console errors:`, errors.map(e => e.text));
  }
  expect(errors.filter(e => e.level === 'pageerror').length).toBe(0);
});

// ──────────────────────────────────────────────
// Page 3: /lm402.html
// ──────────────────────────────────────────────
test('lm402 — Three.js canvas + API 偵測', async ({ page, browserName }) => {
  const outDir = getOutputDir(browserName);
  ensureDir(outDir);
  const errors = attachConsoleListener(page, browserName, 'lm402');

  await page.goto(`${BASE_URL}/lm402.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 等待 Three.js 初始化（等待 canvas 出現，或最多 8 秒）
  try {
    await page.waitForSelector('canvas', { timeout: 8000 });
  } catch {
    console.warn(`[${browserName}] lm402: canvas 未在 8 秒內出現`);
  }

  // canvas 元素存在
  const canvas = page.locator('canvas').first();
  const canvasAttached = await canvas.count() > 0;
  expect(canvasAttached, 'Three.js canvas 應存在').toBe(true);

  // importmap 解析：Three.js module 是否載入
  // 透過 window 物件或 canvas 有無內容來間接驗證
  const threejsLoaded = await page.evaluate(() => {
    // 若 Three.js module 成功載入，renderer.js 通常會設定 window.__lm402Ready 或類似旗標
    // 或者確認 canvas 在 DOM 中
    const c = document.querySelector('canvas');
    return !!c;
  });
  console.log(`[${browserName}] lm402: Three.js canvas exists = ${threejsLoaded}`);

  // Pointer Lock API 偵測
  const pointerLockInfo = await page.evaluate(() => {
    const supported = 'pointerLockElement' in document;
    const hasRequestMethod = typeof document.documentElement.requestPointerLock === 'function';
    return { supported, hasRequestMethod };
  });
  console.log(`[${browserName}] lm402: Pointer Lock supported = ${pointerLockInfo.supported}, requestPointerLock = ${pointerLockInfo.hasRequestMethod}`);

  // Web Audio API 偵測
  const audioContextExists = await page.evaluate(() => {
    return !!(window.AudioContext || window.webkitAudioContext);
  });
  console.log(`[${browserName}] lm402: AudioContext = ${audioContextExists}`);
  expect(audioContextExists, 'Web Audio API 應存在').toBe(true);

  // 等候載入器結束（額外 4 秒）
  await page.waitForTimeout(4000);

  // 截圖
  await page.screenshot({ path: path.join(outDir, 'lm402.png'), fullPage: false });

  // lm402 允許 WebGL warning（console.warn/info），但 pageerror 不行
  const pageErrors = errors.filter(e => e.level === 'pageerror');
  if (pageErrors.length > 0) {
    console.warn(`[${browserName}] lm402 pageerrors:`, pageErrors.map(e => e.text));
  }
  expect(pageErrors.length).toBe(0);
});

// ──────────────────────────────────────────────
// Page 4: /demos/platform-run/index.html
// ──────────────────────────────────────────────
test('platform-run — canvas + aria-label', async ({ page, browserName }) => {
  const outDir = getOutputDir(browserName);
  ensureDir(outDir);
  const errors = attachConsoleListener(page, browserName, 'platform-run');

  await page.goto(`${BASE_URL}/demos/platform-run/index.html`, { waitUntil: 'networkidle', timeout: 30000 });

  // canvas 存在且有 aria-label
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeAttached({ timeout: 10000 });
  const ariaLabel = await canvas.getAttribute('aria-label');
  expect(ariaLabel, 'canvas 應有 aria-label').toBeTruthy();
  console.log(`[${browserName}] platform-run: canvas aria-label = "${ariaLabel}"`);

  // 截圖
  await page.screenshot({ path: path.join(outDir, 'platform-run.png'), fullPage: false });

  // pageerror 不允許
  if (errors.length > 0) {
    console.warn(`[${browserName}] platform-run console errors:`, errors.map(e => e.text));
  }
  expect(errors.filter(e => e.level === 'pageerror').length).toBe(0);
});

// ──────────────────────────────────────────────
// 測試全部結束後寫出 console-log.json
// ──────────────────────────────────────────────
test.afterAll(async () => {
  const logDir = path.resolve(__dirname, '../../output/smoke');
  ensureDir(logDir);
  const logPath = path.join(logDir, 'console-log.json');

  let existing = [];
  if (fs.existsSync(logPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    } catch { existing = []; }
  }

  const merged = [...existing, ...consoleErrorLog];
  fs.writeFileSync(logPath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`console-log.json 已更新，共 ${merged.length} 筆 error 記錄`);
});
