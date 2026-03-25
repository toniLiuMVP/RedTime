const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

const BASE_URL = process.env.LM402_BASE_URL || "http://127.0.0.1:8000";

test.use({
  launchOptions: {
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  },
});

async function waitForDebug(page) {
  await page.waitForLoadState("domcontentloaded");
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const state = await page.evaluate(() => ({
      debug: typeof window.__LM402_DEBUG__,
      hasSnapshot: typeof window.__LM402_DEBUG__?.snapshot,
      advanceTime: typeof window.advanceTime,
    }));
    if (state.debug === "object" && state.hasSnapshot === "function") return;
    await page.waitForTimeout(700);
  }
  throw new Error("LM402 debug API did not initialize in time.");
}

async function readDebug(page) {
  return page.evaluate(() => window.__LM402_DEBUG__.snapshot());
}

function diagnoseCloseup(snap, label) {
  const viewportHeight =
    snap?.renderer?.webglViewport?.height ?? snap?.webglViewport?.height ?? 0;
  const junior = snap?.renderer?.projectedNodes?.junior ?? snap?.projectedNodes?.junior;
  const juniorScreenY = junior?.screenY ?? null;
  const juniorVisible = junior?.visible ?? false;
  const juniorIsBelowFrame =
    Number.isFinite(juniorScreenY) && viewportHeight > 0
      ? juniorScreenY > viewportHeight * 0.82
      : false;

  const mostOffendingAxis = juniorVisible && juniorIsBelowFrame ? "camera" : "geometry";
  const rationale =
    mostOffendingAxis === "camera"
      ? "The junior anchor is consistently projected below the frame, so framing is the first thing pulling the close-up out of the scene. Geometry still looks harsh, but the camera is the dominant miss."
      : "The current frame keeps the face in view, so geometry is the main remaining miss.";

  return {
    label,
    mostOffendingAxis,
    rationale,
    evidence: {
      currentVariant: snap?.assetState?.currentVariant ?? null,
      endingShotPhase: snap?.endingShotPhase ?? null,
      cameraAnchor: snap?.cameraAnchor ?? null,
      cameraMode: snap?.cameraMode ?? null,
      renderErrorCount: snap?.renderErrorCount ?? null,
      juniorScreenY,
      viewportHeight,
      juniorVisible,
      juniorBelowFrame: juniorIsBelowFrame,
    },
  };
}

test("homepage desktop hero stays readable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1400);
  const heroSideTitle = page.locator(".hero-side-title");
  await expect(heroSideTitle).toContainText(/先把故事讀進去|你可以決定先讀故事/u);
  await page.screenshot({
    path: "output/playwright/index-home-verify-desktop.png",
    fullPage: false,
  });
});

test("reader desktop keeps guidance in overlay instead of a persistent right rail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/reader.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await expect(page.locator(".hero-guide-title")).toContainText("先讀正文");
  await expect(page.locator("#reader-rail")).toHaveCount(0);
  await page.getByRole("button", { name: "故事導覽" }).first().click();
  await expect(page.locator("#info-panel")).toHaveClass(/open/);
  await page.screenshot({
    path: "output/playwright/reader-desktop-guide-verify.png",
    fullPage: false,
  });
});

test("reader desktop auto mode scrolls the desktop reading host", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/reader.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const mainCol = page.locator("#main-col");
  await expect(mainCol).toBeVisible();

  const initial = await page.evaluate(() => {
    const host = document.getElementById("main-col");
    return {
      top: host?.scrollTop ?? 0,
      max: Math.max(0, (host?.scrollHeight ?? 0) - (host?.clientHeight ?? 0)),
    };
  });
  expect(initial.max).toBeGreaterThan(200);

  await page.locator("#dsk-auto-btn").click();
  await page.locator("#ap-play-btn").click();
  await page.waitForTimeout(1800);

  const afterPlay = await page.evaluate(() => {
    const host = document.getElementById("main-col");
    return host?.scrollTop ?? 0;
  });
  expect(afterPlay).toBeGreaterThan(initial.top + 20);

  await page.locator("#ap-play-btn").click();
  await page.locator("#tb-bottom").click();
  await page.waitForFunction(() => {
    const host = document.getElementById("main-col");
    if (!host) return false;
    const max = Math.max(0, host.scrollHeight - host.clientHeight);
    return host.scrollTop >= max * 0.75;
  });
  const nearBottom = await page.evaluate(() => {
    const host = document.getElementById("main-col");
    const top = host?.scrollTop ?? 0;
    const max = Math.max(0, (host?.scrollHeight ?? 0) - (host?.clientHeight ?? 0));
    return { top, max };
  });
  expect(nearBottom.top).toBeGreaterThan(nearBottom.max * 0.75);

  await page.locator("#tb-top").click();
  await page.waitForFunction(() => {
    const host = document.getElementById("main-col");
    return (host?.scrollTop ?? 9999) < 40;
  });
  const backTop = await page.evaluate(() => document.getElementById("main-col")?.scrollTop ?? 0);
  expect(backTop).toBeLessThan(40);

  await page.screenshot({
    path: "output/playwright/reader-auto-desktop-verify.png",
    fullPage: false,
  });
});

test("LM402 desktop perfect ending keeps hero close-up active", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/lm402.html?debug=1`, {
    waitUntil: "domcontentloaded",
  });
  await waitForDebug(page);
  await page.waitForFunction(() => {
    const snap = window.__LM402_DEBUG__?.snapshot?.();
    return Boolean(snap?.assetState?.status && snap.assetState.status !== "loading_model");
  });
  await page.evaluate(() => window.__LM402_DEBUG__.triggerEnding("perfect"));
  await page.waitForTimeout(250);
  await page.evaluate(() => window.__LM402_DEBUG__.setEndingTime(28, true));
  await page.evaluate(() => window.advanceTime(1000 / 30));
  await page.waitForTimeout(350);
  let snap = await readDebug(page);
  fs.writeFileSync(
    "output/playwright/lm402-perfect-line1-verify.json",
    JSON.stringify(snap, null, 2),
  );
  expect(snap.renderErrorCount).toBe(0);
  expect(snap.cinematicSubtitle.text).toContain("也太像徐若瑄了吧！");
  expect(snap.assetState.currentVariant).toBe("runtime_glb");
  expect(snap.renderer?.heroCloseupRoots?.runtime?.visible).toBe(true);
  expect(snap.renderer?.heroCloseupRoots?.closeup?.visible).toBe(false);
  expect(snap.renderer?.heroCloseupRoots?.procedural?.visible).toBe(false);
  await page.screenshot({
    path: "output/playwright/lm402-perfect-line1-closeup-desktop.png",
    fullPage: false,
  });

  await page.evaluate(() => window.__LM402_DEBUG__.setEndingTime(33, true));
  await page.evaluate(() => window.advanceTime(1000 / 30));
  await page.waitForTimeout(350);
  snap = await readDebug(page);
  fs.writeFileSync(
    "output/playwright/lm402-perfect-line2-verify.json",
    JSON.stringify(snap, null, 2),
  );
  expect(snap.renderErrorCount).toBe(0);
  expect(snap.cinematicSubtitle.text).toContain("這一次，依然再次遇見妳。");
  expect(snap.assetState.currentVariant).toBe("runtime_glb");
  expect(snap.renderer?.heroCloseupRoots?.runtime?.visible).toBe(true);
  expect(snap.renderer?.heroCloseupRoots?.closeup?.visible).toBe(false);
  expect(snap.renderer?.heroCloseupRoots?.procedural?.visible).toBe(false);
  await page.screenshot({
    path: "output/playwright/lm402-perfect-line2-closeup-desktop.png",
    fullPage: false,
  });

  fs.writeFileSync(
    "output/playwright/lm402-closeup-diagnosis.json",
    JSON.stringify(
      {
        desktopLine1: diagnoseCloseup(
          JSON.parse(fs.readFileSync("output/playwright/lm402-perfect-line1-verify.json", "utf8")),
          "perfect-line1",
        ),
        desktopLine2: diagnoseCloseup(snap, "perfect-line2"),
      },
      null,
      2,
    ),
  );
});

test("LM402 mobile transcript dock drags/resizes and ending slider appears", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto(`${BASE_URL}/lm402.html?debug=1`, {
    waitUntil: "domcontentloaded",
  });
  await waitForDebug(page);
  await page.waitForTimeout(700);
  await page.evaluate(() => window.__LM402_DEBUG__.skipIntro());
  await page.waitForTimeout(120);
  await page.evaluate(() => window.__LM402_DEBUG__.setPhase("front_call"));
  await page.evaluate(() => window.advanceTime(1000 / 30));
  await page.waitForTimeout(600);

  const dock = page.locator("#transcript-dock");
  await expect(dock).toHaveClass(/mobile-freeform/);
  const before = await dock.boundingBox();
  expect(before).not.toBeNull();

  const bar = page.locator("#transcript-dock-bar");
  const barBox = await bar.boundingBox();
  expect(barBox).not.toBeNull();
  await page.mouse.move(barBox.x + barBox.width / 2, barBox.y + barBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(barBox.x + barBox.width / 2 + 36, barBox.y + barBox.height / 2 - 30, {
    steps: 8,
  });
  await page.mouse.up();
  await page.waitForTimeout(150);

  const moved = await dock.boundingBox();
  expect(moved).not.toBeNull();
  expect(Math.abs(moved.x - before.x) + Math.abs(moved.y - before.y)).toBeGreaterThan(8);

  const handle = page.locator("#transcript-resize-handle");
  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 28, handleBox.y + handleBox.height / 2 + 36, {
    steps: 8,
  });
  await page.mouse.up();
  await page.waitForTimeout(150);

  const resized = await dock.boundingBox();
  expect(resized).not.toBeNull();
  expect((resized.width - moved.width) + (resized.height - moved.height)).toBeGreaterThan(8);

  await page.evaluate(() => window.__LM402_DEBUG__.triggerEnding("perfect"));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__LM402_DEBUG__.setEndingTime(40, true));
  await page.evaluate(() => window.advanceTime(1000 / 30));
  await page.waitForTimeout(120);
  await page.evaluate(() => window.__LM402_DEBUG__.showEndingOverlay());
  await page.waitForTimeout(250);

  const slider = page.locator("#ending-scroll-control");
  await expect(slider).toBeVisible();
  const sliderState = await page.evaluate(() => {
    const card = document.getElementById("ending-card");
    const range = document.getElementById("ending-scroll-range");
    return {
      cardScrollHeight: card?.scrollHeight ?? 0,
      cardClientHeight: card?.clientHeight ?? 0,
      rangeMax: Number(range?.max ?? 0),
    };
  });
  expect(sliderState.cardScrollHeight).toBeGreaterThan(sliderState.cardClientHeight);
  expect(sliderState.rangeMax).toBeGreaterThan(0);

  await page.screenshot({
    path: "output/playwright/lm402-mobile-ending-verify.png",
    fullPage: false,
  });
});
