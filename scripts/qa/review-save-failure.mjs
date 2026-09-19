import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { captureErrors, connectQa } from "./connect.mjs";
import { assertCard, closeCard, openNote, preferences, readingLink } from "./preview-driver.mjs";

const { browser, page } = await connectQa();
const evidence = { errors: captureErrors(page) };
page.setDefaultTimeout(8000);
try {
  await openNote(page);
  await preferences(page, "cards", "click");
  evidence.before = await page.evaluate(async () => {
    const plugin = app.plugins.plugins.marginote;
    const before = await plugin.loadData();
    window.marginoteReviewSave = { plugin, original: plugin.saveData };
    plugin.saveData = async () => {
      throw new Error("Isolated QA persistence failure");
    };
    app.setting.open();
    app.setting.openTabById("marginote");
    return before;
  });
  await page.getByLabel("Preview content", { exact: true }).selectOption("notes");
  await page
    .locator(".notice")
    .filter({ hasText: "Your choices apply to this session only" })
    .waitFor();
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const card = document.querySelector('a[data-href="Annotations/Text"]');
    const note = document.querySelector('a[data-href="Ordinary note"]');
    return (
      !card?.classList.contains("marginote-anchor") && note?.classList.contains("marginote-anchor")
    );
  });
  await readingLink(page, "Ordinary note").click();
  await assertCard(page, "note");
  evidence.after = await page.evaluate(() => app.plugins.plugins.marginote.loadData());
  assert.deepEqual(evidence.after, evidence.before);
  await page.screenshot({ path: ".qa/evidence/review-save-failure.png", scale: "css" });
  assert.deepEqual(evidence.errors, []);
  evidence.status = "passed";
  console.log("PASS saveData rejection reports a notice and applies preferences for the session");
} catch (error) {
  evidence.status = "failed";
  evidence.failure = String(error);
  throw error;
} finally {
  await page.evaluate(() => {
    const saved = window.marginoteReviewSave;
    if (saved) saved.plugin.saveData = saved.original;
    delete window.marginoteReviewSave;
  });
  await closeCard(page);
  await preferences(page, "cards", "hover");
  await openNote(page);
  await writeFile(
    ".qa/evidence/review-save-failure.json",
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  await browser.close();
}
