import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { captureErrors, connectQa } from "./connect.mjs";
import { assertCard, closeCard, openNote, preferences, readingLink } from "./preview-driver.mjs";

const { browser, page } = await connectQa();
const errors = captureErrors(page),
  results = [];
async function renderReference(target) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.locator(".markdown-preview-view:visible").evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const link = readingLink(page, target);
    if (await link.count()) {
      const bounds = await link.boundingBox();
      const height = await page.evaluate(() => innerHeight);
      if (bounds && bounds.y >= 70 && bounds.y + bounds.height <= height) return;
    }
  }
  await readingLink(page, target).waitFor({ timeout: 3000 });
}
try {
  await openNote(page);
  await preferences(page, "cards", "click");
  await page.evaluate(() => {
    app.workspace.leftSplit.collapse();
    app.workspace.rightSplit.collapse();
  });
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => {
      document.body.classList.toggle("theme-light", theme === "light");
      document.body.classList.toggle("theme-dark", theme === "dark");
    }, theme);
    for (const width of [360, 768, 1440])
      for (const zoom of [1, 1.5]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate((zoom) => require("electron").webFrame.setZoomFactor(zoom), zoom);
        await renderReference("Annotations/Large image");
        await readingLink(page, "Annotations/Large image").click();
        await page.waitForFunction(
          () => document.querySelector(".marginote-card img")?.naturalWidth > 0,
        );
        const geometry = await assertCard(page, "image");
        assert.equal(await page.evaluate(() => require("electron").webFrame.getZoomFactor()), zoom);
        const color = await page.locator(".marginote-card").evaluate((node) => ({
          background: getComputedStyle(node).backgroundColor,
          text: getComputedStyle(node).color,
        }));
        results.push({ theme, width, zoom, geometry, color });
        if ((width === 1440 && zoom === 1) || (width === 360 && zoom === 1.5))
          await page.screenshot({
            path: `.qa/evidence/${theme}-${width}-${zoom}.png`,
            scale: "css",
          });
        await closeCard(page);
      }
  }
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.evaluate(() => require("electron").webFrame.setZoomFactor(1));
  await renderReference("Annotations/Long");
  await readingLink(page, "Annotations/Long").click();
  await assertCard(page, "text");
  assert.equal(
    await page.locator(".marginote-card").evaluate((node) => node.scrollHeight > node.clientHeight),
    true,
  );
  await page.locator(".marginote-card").hover();
  await page.mouse.wheel(0, 500);
  await page.waitForFunction(() => document.querySelector(".marginote-card")?.scrollTop > 0);
  results.push({
    scenario: "long interactive card has usable internal scrolling",
    status: "passed",
  });
  await closeCard(page);
  await renderReference("Annotations/Missing image");
  await readingLink(page, "Annotations/Missing image").click();
  assert.match(await page.locator(".marginote-content").innerText(), /Image unavailable/);
  await closeCard(page);
  assert.deepEqual(errors, []);
  console.log(`PASS ${results.length} appearance/scroll scenarios plus missing image fallback`);
} finally {
  await page.evaluate(() => {
    require("electron").webFrame.setZoomFactor(1);
    document.body.classList.remove("theme-dark");
    document.body.classList.add("theme-light");
  });
  await writeFile(".qa/evidence/appearance.json", JSON.stringify({ results, errors }, null, 2));
  await browser.close();
}
