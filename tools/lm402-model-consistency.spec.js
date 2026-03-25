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
  await page.waitForFunction(() => {
    const dbg = window.__LM402_DEBUG__;
    const snap = dbg?.snapshot?.();
    return Boolean(
      dbg &&
        typeof dbg.triggerEnding === "function" &&
        snap?.assetState?.status &&
        snap.assetState.status !== "loading_model",
    );
  });
}

function assertUnifiedJuniorModel(snap, label, options = {}) {
  const requireVisible = options.requireVisible !== false;
  expect(
    snap.renderErrorCount,
    `${label} should not produce render errors`,
  ).toBe(0);
  expect(
    snap.assetState.currentVariant,
    `${label} should use the runtime junior model`,
  ).toBe("runtime_glb");
  if (requireVisible) {
    expect(
      snap.renderer?.heroCloseupRoots?.runtime?.visible,
      `${label} should keep the runtime junior visible`,
    ).toBe(true);
  }
  expect(
    snap.renderer?.heroCloseupRoots?.closeup?.visible,
    `${label} should not swap to a separate closeup head`,
  ).toBe(false);
  expect(
    snap.renderer?.heroCloseupRoots?.procedural?.visible,
    `${label} should not show a detached procedural head`,
  ).toBe(false);
}

test("LM402 keeps the same junior model in gameplay and all endings", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/lm402.html?debug=1`, {
    waitUntil: "domcontentloaded",
  });
  await waitForDebug(page);

  const summary = {};

  await page.evaluate(() => window.__LM402_DEBUG__.skipIntro());
  await page.waitForTimeout(120);

  await page.evaluate(() => {
    window.__LM402_DEBUG__.setPhase("rear_wait");
    window.advanceTime(1000 / 30);
  });
  await page.waitForTimeout(150);
  let snap = await page.evaluate(() => window.__LM402_DEBUG__.snapshot());
  assertUnifiedJuniorModel(snap, "rear_wait");
  summary.rear_wait = {
    variant: snap.assetState.currentVariant,
    runtimeVisible: snap.renderer?.heroCloseupRoots?.runtime?.visible ?? null,
  };

  await page.evaluate(() => {
    window.__LM402_DEBUG__.setPhase("eye_contact");
    window.advanceTime(1000 / 30);
  });
  await page.waitForTimeout(150);
  snap = await page.evaluate(() => window.__LM402_DEBUG__.snapshot());
  assertUnifiedJuniorModel(snap, "eye_contact");
  summary.eye_contact = {
    variant: snap.assetState.currentVariant,
    runtimeVisible: snap.renderer?.heroCloseupRoots?.runtime?.visible ?? null,
  };

  for (const ending of ["perfect", "canon", "memory", "missed"]) {
    await page.evaluate((endingType) => {
      window.__LM402_DEBUG__.triggerEnding(endingType);
      if (endingType === "perfect") {
        window.__LM402_DEBUG__.setEndingTime(28, true);
      }
      window.advanceTime(1000 / 30);
    }, ending);
    await page.waitForTimeout(220);
    if (ending !== "perfect") {
      snap = await page.evaluate(() => window.__LM402_DEBUG__.snapshot());
      assertUnifiedJuniorModel(snap, `${ending}_scene`, { requireVisible: false });
      await page.evaluate(() => window.__LM402_DEBUG__.showEndingOverlay());
      await page.waitForTimeout(120);
    }
    snap = await page.evaluate(() => window.__LM402_DEBUG__.snapshot());
    assertUnifiedJuniorModel(snap, ending, { requireVisible: ending === "perfect" });
    summary[ending] = {
      ending: snap.ending,
      variant: snap.assetState.currentVariant,
      runtimeVisible: snap.renderer?.heroCloseupRoots?.runtime?.visible ?? null,
      closeupVisible: snap.renderer?.heroCloseupRoots?.closeup?.visible ?? null,
      proceduralVisible: snap.renderer?.heroCloseupRoots?.procedural?.visible ?? null,
      renderErrorCount: snap.renderErrorCount,
    };
  }

  fs.writeFileSync(
    "output/playwright/lm402-model-consistency.json",
    JSON.stringify(summary, null, 2),
  );
});
