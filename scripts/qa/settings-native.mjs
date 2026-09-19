import assert from "node:assert/strict";
import { assertCard, closeCard, openNote, preferences, readingLink } from "./preview-driver.mjs";

export async function verifyNativePreview(page, fixture, scenario) {
  await scenario("core Page preview remains available only for excluded targets", async () => {
    const enabled = await page.evaluate(() => app.internalPlugins.plugins["page-preview"]?.enabled);
    assert.equal(enabled, true, "The isolated fixture must enable Obsidian Page preview.");
    await preferences(page, "cards", "hover");
    await openNote(page, fixture.paths.source);
    await page.mouse.move(20, 20);
    await page.keyboard.down("Meta");
    try {
      await readingLink(page, "Annotations/Text").hover();
      await assertCard(page, "text");
      await assert.rejects(
        page.locator(".hover-popover:visible").waitFor({ state: "visible", timeout: 750 }),
        { name: "TimeoutError" },
      );
    } finally {
      await page.keyboard.up("Meta");
    }
    await closeCard(page);
    await page.mouse.move(20, 20);
    await page.keyboard.down("Meta");
    try {
      await readingLink(page, fixture.paths.ordinary.slice(0, -3)).hover();
      await page.locator(".hover-popover:visible").waitFor({ timeout: 5000 });
      assert.equal(await page.locator(".marginote-card").count(), 0);
      assert.match(await page.locator(".hover-popover:visible").innerText(), /Ordinary fixture/);
      await page.screenshot({ path: ".qa/evidence/native-note-preview.png", scale: "css" });
    } finally {
      await page.keyboard.up("Meta");
      await page.mouse.move(20, 20);
    }
    await page.keyboard.press("Escape");
    await page.locator(".hover-popover:visible").waitFor({ state: "hidden" });
    return { corePagePreviewEnabled: enabled, duplicatePreviewObservationMs: 750 };
  });
}
