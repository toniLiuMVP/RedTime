const { test } = require("@playwright/test");
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

async function captureCanvas(page, stem) {
  const payload = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    return {
      dataUrl: canvas?.toDataURL("image/png") ?? null,
      snap: window.__LM402_DEBUG__.snapshot(),
    };
  });

  fs.writeFileSync(
    `output/playwright/lm402-perfect-facecard-${stem}.json`,
    JSON.stringify(payload.snap, null, 2),
  );

  if (payload.dataUrl) {
    const base64 = payload.dataUrl.split(",")[1];
    fs.writeFileSync(
      `output/playwright/lm402-perfect-facecard-${stem}.png`,
      Buffer.from(base64, "base64"),
    );
  }
}

test("capture current LM402 perfect close-up", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/lm402.html?debug=1`, {
    waitUntil: "domcontentloaded",
  });
  await waitForDebug(page);

  await page.evaluate(() => window.__LM402_DEBUG__.triggerEnding("perfect"));

  for (const [time, stem] of [
    [28, "line1"],
    [33, "line2"],
  ]) {
    await page.evaluate((endingTime) => {
      window.__LM402_DEBUG__.setEndingTime(endingTime, true);
      window.advanceTime(1000 / 30);
    }, time);
    await page.waitForTimeout(450);
    await captureCanvas(page, stem);
  }
});
