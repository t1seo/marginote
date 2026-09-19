import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { captureErrors, connectQa } from "./connect.mjs";
import { closeCard, openNote, preferences } from "./preview-driver.mjs";
import { verifyReviewContent } from "./review-content.mjs";
import { assertOriginals, ownerState, prepareReviewFixtures } from "./review-helpers.mjs";
import { verifyReviewWindows } from "./review-windows.mjs";

const { browser, page, receipt } = await connectQa();
const scope = process.argv[2] ?? "all";
const evidence = {
  scope,
  run: `ReviewQA-${Date.now()}`,
  started: new Date().toISOString(),
  vault: receipt.vault,
  results: [],
};
const errorGroups = [captureErrors(page)];
const popouts = [];
page.setDefaultTimeout(8000);

async function scenario(name, action) {
  try {
    const detail = await action();
    const status = detail?.pass === false ? "failed" : "passed";
    evidence.results.push({ name, status, detail });
    console.log(`${status.toUpperCase()} ${name}`);
  } catch (error) {
    evidence.results.push({ name, status: "failed", error: String(error) });
    await page.screenshot({ path: ".qa/evidence/review-failure.png", scale: "css" });
    throw error;
  }
}

try {
  await page.bringToFront();
  await page.setViewportSize({ width: 1200, height: 950 });
  await openNote(page);
  await preferences(page, "both", "click");
  await page.evaluate(() => {
    const active = app.workspace.activeLeaf;
    for (const leaf of app.workspace.getLeavesOfType("markdown"))
      if (leaf !== active) leaf.detach();
    app.workspace.leftSplit.collapse();
    app.workspace.rightSplit.collapse();
  });
  const fixture = await prepareReviewFixtures(page, evidence.run);
  evidence.fixture = fixture;
  if (scope !== "windows") await verifyReviewContent(page, fixture, scenario);
  await verifyReviewWindows(page, fixture, scenario, popouts, errorGroups);
  await scenario(
    "all independent review Markdown fixtures remain byte-for-byte unchanged",
    async () => ({ files: await assertOriginals(page, fixture.originals) }),
  );
  assert.deepEqual(errorGroups.flat(), []);
  assert.ok(
    evidence.results.every((result) => result.status === "passed"),
    "A review scenario failed; inspect its recorded details.",
  );
  evidence.status = "passed";
} catch (error) {
  evidence.status = "failed";
  evidence.failure = error instanceof Error ? error.stack : String(error);
  throw error;
} finally {
  for (const pop of popouts) if (!pop.isClosed()) await pop.evaluate(() => window.close());
  await page.bringToFront();
  await closeCard(page);
  await preferences(page, "cards", "hover");
  await openNote(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  evidence.finalOwners = await ownerState(page);
  evidence.errors = errorGroups.flat();
  evidence.finished = new Date().toISOString();
  await writeFile(
    `.qa/evidence/review-additional${scope === "all" ? "" : `-${scope}`}.json`,
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  await browser.close();
}
