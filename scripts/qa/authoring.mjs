import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { verifyCardCreation } from "./authoring-cards.mjs";
import { createAuthoringDriver } from "./authoring-driver.mjs";
import { verifyCardMaintenance } from "./authoring-maintenance.mjs";
import { verifyAuthoringValidation } from "./authoring-validation.mjs";
import { captureErrors, connectQa } from "./connect.mjs";

const { browser, page, receipt } = await connectQa();
const errors = captureErrors(page);
const run = `Authoring-${Date.now()}`;
const evidence = {
  run,
  started: new Date().toISOString(),
  vault: receipt.vault,
  scenarios: [],
  errors,
};
const imagePath = `Attachments/${run} 그림.svg`;
const image =
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><rect width="80" height="60" fill="#637b70"/></svg>\n';
page.setDefaultTimeout(8_000);
await mkdir(".qa/evidence", { recursive: true });

const driver = createAuthoringDriver({ page, receipt, run, imagePath, image });

async function scenario(name, action) {
  try {
    const detail = await action();
    evidence.scenarios.push({ name, status: "passed", ...detail });
    console.log(`PASS ${name}`);
  } catch (error) {
    evidence.scenarios.push({ name, status: "failed", message: String(error) });
    throw error;
  }
}

try {
  await page.keyboard.press("Escape");
  evidence.app = await page.title();
  await page.evaluate(
    async ({ path, image }) => {
      await app.vault.create(path, image);
    },
    { path: imagePath, image },
  );
  await verifyAuthoringValidation(driver, scenario);
  const cards = await verifyCardCreation(driver, scenario);
  await verifyCardMaintenance(driver, scenario, cards);
  assert.equal(errors.length, 0, JSON.stringify(errors));
  evidence.status = "passed";
} catch (error) {
  evidence.status = "failed";
  evidence.failure = String(error);
  await page.screenshot({ path: ".qa/evidence/authoring-failure.png" });
  throw error;
} finally {
  evidence.finished = new Date().toISOString();
  await writeFile(".qa/evidence/authoring.json", `${JSON.stringify(evidence, null, 2)}\n`);
  await browser.close();
}
