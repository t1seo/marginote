import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { captureErrors, connectQa } from "./connect.mjs";
import { assertCard, closeCard, openNote, preferences, readingLink } from "./preview-driver.mjs";

const { browser, page } = await connectQa();
const results = [],
  errors = captureErrors(page);
async function scenario(name, action) {
  if (process.argv[2] && !name.includes(process.argv[2])) return;
  await action();
  results.push({ name, status: "passed" });
  console.log(`PASS ${name}`);
}
async function elapsed(duration) {
  const start = await page.evaluate(() => performance.now());
  await page.waitForFunction(
    ({ start, duration }) => performance.now() - start > duration,
    { start, duration },
    { timeout: duration + 3000 },
  );
}
try {
  await page.setViewportSize({ width: 1440, height: 950 });
  await openNote(page);
  await preferences(page, "both", "hover");
  await scenario(
    "drag selection across an annotation preserves text and suppresses automatic cards",
    async () => {
      const paragraph = page
        .locator(".markdown-preview-view:visible p")
        .filter({ hasText: "읽기 중" })
        .first();
      await paragraph.scrollIntoViewIfNeeded();
      const bounds = await paragraph.boundingBox();
      assert.ok(bounds);
      await page.mouse.move(bounds.x + 1, bounds.y + bounds.height / 2);
      await page.mouse.down();
      await page.mouse.move(bounds.x + bounds.width - 1, bounds.y + bounds.height / 2, {
        steps: 15,
      });
      await page.mouse.up();
      const selected = await page.evaluate(() => getSelection().toString());
      assert.ok(selected.includes("인지적 도제"), selected);
      await readingLink(page, "Annotations/Text").hover();
      await elapsed(400);
      assert.equal(await page.locator(".marginote-card").count(), 0);
      assert.equal(await page.evaluate(() => getSelection().toString()), selected);
      await page.evaluate(() => getSelection().removeAllRanges());
    },
  );
  await scenario(
    "hover remains readable for 30 seconds and Escape suppresses reopening",
    async () => {
      await readingLink(page, "Annotations/Text").hover();
      await assertCard(page, "text");
      await page.locator(".marginote-card").hover();
      await elapsed(31000);
      await assertCard(page, "text");
      await closeCard(page);
      await elapsed(500);
      assert.equal(await page.locator(".marginote-card").count(), 0);
    },
  );
  await scenario("moving across a gap to another link switches the automatic preview", async () => {
    await page.mouse.move(40, 40);
    await elapsed(50);
    await readingLink(page, "Annotations/Text").hover();
    await assertCard(page, "text");
    await page.mouse.move(50, 80);
    await elapsed(50);
    await readingLink(page, "Annotations/Image").hover();
    await page.waitForFunction(
      () => document.querySelector('.marginote-card[data-kind="image"]'),
      null,
      { timeout: 2000 },
    );
    assert.equal(await page.locator(".marginote-card").count(), 1);
    await closeCard(page);
  });
  await scenario(
    "Chromium touch input opens and closes an explicit preview without source changes",
    async () => {
      await preferences(page, "cards", "click");
      const before = await page.evaluate(() =>
        app.vault.cachedRead(app.vault.getAbstractFileByPath("QA Reading.md")),
      );
      const session = await page.context().newCDPSession(page);
      try {
        await session.send("Emulation.setTouchEmulationEnabled", { enabled: true });
        await readingLink(page, "Annotations/Text").scrollIntoViewIfNeeded();
        const bounds = await readingLink(page, "Annotations/Text").boundingBox();
        assert.ok(bounds);
        await session.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
        });
        await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await assertCard(page, "text");
        await page.getByRole("button", { name: "Close annotation", exact: true }).click();
        await page.waitForFunction(
          () => document.querySelectorAll(".marginote-layer").length === 0,
        );
        assert.equal(
          await page.evaluate(() =>
            app.vault.cachedRead(app.vault.getAbstractFileByPath("QA Reading.md")),
          ),
          before,
        );
      } finally {
        await session.send("Emulation.setTouchEmulationEnabled", { enabled: false });
        await session.detach();
      }
    },
  );
  await scenario("stationary-pointer nearby preview responds to scroll and expires", async () => {
    await preferences(page, "cards", "nearby");
    await readingLink(page, "Annotations/Text").scrollIntoViewIfNeeded();
    const bounds = await readingLink(page, "Annotations/Text").boundingBox();
    assert.ok(bounds);
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height + 20);
    await assertCard(page, "text");
    await page.locator(".markdown-preview-view:visible").evaluate((node) => {
      node.scrollTop = node.scrollHeight / 2;
    });
    await page.waitForFunction(() => document.querySelectorAll(".marginote-layer").length === 0);
    await readingLink(page, "Annotations/Text").scrollIntoViewIfNeeded();
    const after = await readingLink(page, "Annotations/Text").boundingBox();
    assert.ok(after);
    await page.mouse.move(after.x + after.width / 2, after.y + after.height + 20);
    await assertCard(page, "text");
    await page.waitForFunction(
      () => document.querySelectorAll(".marginote-layer").length === 0,
      null,
      { timeout: 16000 },
    );
  });
  assert.deepEqual(errors, []);
} finally {
  await writeFile(".qa/evidence/interactions.json", JSON.stringify({ results, errors }, null, 2));
  await browser.close();
}
