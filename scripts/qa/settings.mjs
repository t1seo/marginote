import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { captureErrors, connectQa } from "./connect.mjs";
import { closeCard, openNote, preferences } from "./preview-driver.mjs";
import { verifySettingsContent } from "./settings-content.mjs";
import {
  fixtureHashes,
  prepareSettingsFixtures,
  readFixtureContents,
} from "./settings-fixtures.mjs";
import { verifyNativePreview } from "./settings-native.mjs";
import { verifySettingsPreferences } from "./settings-preferences.mjs";

const { browser, page, receipt } = await connectQa();
const errors = captureErrors(page);
const requests = [];
const externalPattern = /^https?:\/\//;
const evidence = {
  run: `SettingsQA-${Date.now()}`,
  started: new Date().toISOString(),
  vault: receipt.vault,
  scenarios: [],
  requests,
  errors,
};
const blockExternal = async (route) => {
  requests.push({ url: route.request().url(), type: route.request().resourceType() });
  await route.abort("blockedbyclient");
};
page.setDefaultTimeout(8000);
await mkdir(".qa/evidence", { recursive: true });
await page.route(externalPattern, blockExternal);

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
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.keyboard.press("Escape");
  evidence.app = await page.title();
  const fixture = await prepareSettingsFixtures(page, evidence.run);
  evidence.beforeHashes = fixtureHashes(fixture.fixtures);
  await verifySettingsPreferences(page, fixture, scenario);
  await verifySettingsContent(page, fixture, scenario, requests);
  await verifyNativePreview(page, fixture, scenario);
  await scenario("all original fixture Markdown is byte-for-byte unchanged", async () => {
    const contents = await readFixtureContents(page, Object.keys(fixture.fixtures));
    evidence.afterHashes = fixtureHashes(contents);
    assert.deepEqual(contents, fixture.fixtures);
    return { fileCount: Object.keys(contents).length };
  });
  assert.deepEqual(errors, []);
  evidence.status = "passed";
} catch (error) {
  evidence.status = "failed";
  evidence.failure = String(error);
  await page.screenshot({ path: ".qa/evidence/settings-failure.png", scale: "css" });
  throw error;
} finally {
  try {
    await page.keyboard.up("Meta");
    await closeCard(page);
    await preferences(page, "cards", "hover");
    await openNote(page);
    await page.unroute(externalPattern, blockExternal);
  } finally {
    evidence.finished = new Date().toISOString();
    await writeFile(".qa/evidence/settings.json", `${JSON.stringify(evidence, null, 2)}\n`);
    await browser.close();
  }
}
