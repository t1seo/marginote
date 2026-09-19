import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { createAuthoringDriver } from "./authoring-driver.mjs";
import { captureErrors, connectQa } from "./connect.mjs";
import { openNote, preferences } from "./preview-driver.mjs";

const { browser, page, receipt } = await connectQa();
const run = `ReviewListFence-${Date.now()}`;
const evidence = { run, results: [], errors: captureErrors(page) };
const driver = createAuthoringDriver({ page, receipt, run });
page.setDefaultTimeout(8000);
try {
  await page.bringToFront();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  const content = "- ~~~\n\n  selected\n  [[Annotations/Text|alias]]\n\n  ~~~\n\noutside prose\n";
  const fixture = await driver.setup("source", content, "selected");
  const count = await driver.fileCount();
  await driver.command("Marginote: Create annotation card from selection");
  await page.locator(".notice").filter({ hasText: "Select plain text" }).last().waitFor();
  assert.equal(await page.locator(".marginote-authoring").count(), 0);
  assert.equal(await driver.sourceValue(), content);
  assert.equal(await driver.fileCount(), count);
  evidence.results.push({
    name: "list-contained fenced-code selection is rejected",
    status: "passed",
  });
  await driver.openSource(fixture.path, "alias");
  await page.keyboard.press("Meta+p");
  await page.locator(".prompt-input").fill("Marginote: Unlink annotation card at cursor");
  await page.getByText("No commands found.", { exact: true }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await driver.sourceValue(), content);
  assert.equal(await driver.fileCount(), count);
  assert.equal(await driver.disk(fixture.path), content);
  evidence.results.push({
    name: "list-contained fenced-code wikilink is not unlinked",
    status: "passed",
  });
  await driver.openSource(fixture.path, "outside prose");
  await driver.createModal();
  await page.getByLabel("Card text", { exact: true }).fill("Outside-list-fence annotation body.");
  await driver.submit();
  const result = await driver.sourceValue();
  assert.ok(result.startsWith(content.slice(0, content.indexOf("outside prose"))));
  assert.match(result, /\[\[Annotations\/[^\]]+\|outside prose\]\]/);
  assert.equal(await driver.fileCount(), count + 1);
  await driver.waitDisk(fixture.path, result);
  evidence.results.push({
    name: "plain text after the closed list fence can create a card",
    status: "passed",
    result,
  });
  await page.screenshot({ path: ".qa/evidence/review-list-fence.png", scale: "css" });
  assert.deepEqual(evidence.errors, []);
  evidence.status = "passed";
  console.log(`PASS ${evidence.results.length} list-fence authoring scenarios`);
} catch (error) {
  evidence.status = "failed";
  evidence.failure = String(error);
  throw error;
} finally {
  await page.keyboard.press("Escape");
  await preferences(page, "cards", "hover");
  await openNote(page);
  await writeFile(
    ".qa/evidence/review-authoring-edge.json",
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  await browser.close();
}
