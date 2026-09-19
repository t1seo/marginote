import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { captureErrors, connectQa } from "./connect.mjs";
import { verifyNearbyDirections } from "./nearby-directions.mjs";
import {
  connectedInsidePane,
  createNearbyFixture,
  nearbyGuards,
  nearbySnapshot,
  observeNearbyEvents,
  openNearbyMode,
  positionAnchor,
  scroller,
  settle,
  stopNearbyEvents,
} from "./nearby-driver.mjs";
import { closeCard, openNote, preferences } from "./preview-driver.mjs";

const phase = process.argv[2] ?? "before";
assert.match(phase, /^[a-z0-9-]+$/);
const run = `Nearby-${Date.now()}`;
const destination = `.qa/release/proximity-0.1.1/${phase}-${run}`;
await mkdir(destination, { recursive: true });
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function contentHashes(folder, prefix = "") {
  const result = [];
  for (const item of await readdir(folder, { withFileTypes: true })) {
    if (item.name === ".obsidian") continue;
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) result.push(...(await contentHashes(join(folder, item.name), path)));
    else if (item.isFile())
      result.push({ path, sha256: sha(await readFile(join(folder, item.name))) });
  }
  return result;
}
const baseline = await contentHashes(".qa/vault");
await writeFile(`${destination}/content-before.json`, `${JSON.stringify(baseline, null, 2)}\n`);
const assets = [];
for (const name of ["main.js", "manifest.json", "styles.css"]) {
  assets.push({
    name,
    sha256: sha(await readFile(`.qa/vault/.obsidian/plugins/marginote/${name}`)),
  });
}
const { browser, page } = await connectQa();
const originalView = await page.evaluate(() => ({
  file: app.workspace.getActiveFile()?.path ?? "QA Reading.md",
  mode: app.workspace.activeLeaf?.getViewState().state.mode ?? "preview",
}));
const evidence = { run, phase, started: new Date().toISOString(), assets, results: [] };
const errors = captureErrors(page);
page.setDefaultTimeout(6000);
function record(name, passed, detail) {
  evidence.results.push({ name, status: passed ? "passed" : "failed", detail });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
}
async function move(point) {
  await page.mouse.move(point.x, point.y);
  await settle(page, 650);
}
try {
  await page.bringToFront();
  await page.setViewportSize({ width: 1440, height: 950 });
  await observeNearbyEvents(page);
  const fixture = await createNearbyFixture(page, run);
  evidence.fixture = fixture;
  for (const mode of ["preview", "source"]) {
    await openNearbyMode(page, fixture, mode);
    const toggles = [];
    for (const trigger of ["hover", "nearby", "hover"]) {
      await preferences(page, "cards", trigger);
      const placement = await positionAnchor(page, fixture, mode);
      await move({ x: 20, y: 20 });
      await move(placement.first);
      toggles.push({
        trigger,
        pointer: placement.first,
        state: await nearbySnapshot(page, fixture, mode),
      });
    }
    record(
      `${mode}: hover-nearby-hover toggles distant activation`,
      toggles[0].state.cards === 0 &&
        connectedInsidePane(toggles[1].state) &&
        toggles[1].state.intent === "nearby" &&
        toggles[2].state.cards === 0,
      toggles,
    );

    await preferences(page, "cards", "nearby");
    const placement = await positionAnchor(page, fixture, mode);
    await move({ x: 20, y: 20 });
    await move(placement.first);
    const first = await nearbySnapshot(page, fixture, mode);
    await page.mouse.move(placement.second.x, placement.second.y, { steps: 8 });
    await settle(page, 200);
    const second = await nearbySnapshot(page, fixture, mode);
    const pointerDistance = Math.hypot(
      placement.second.x - placement.first.x,
      placement.second.y - placement.first.y,
    );
    const cardDistance =
      first.card && second.card
        ? Math.hypot(second.card.left - first.card.left, second.card.top - first.card.top)
        : 0;
    record(
      `${mode}: nearby card follows a pointer move greater than 100px`,
      connectedInsidePane(first) &&
        connectedInsidePane(second) &&
        pointerDistance > 100 &&
        cardDistance > 75,
      { first, second, pointerDistance, cardDistance },
    );

    await move({ x: placement.rect.x + placement.rect.width / 2, y: placement.rect.y - 30 });
    const above = await nearbySnapshot(page, fixture, mode);
    await move({
      x: placement.rect.x + placement.rect.width + 310,
      y: placement.rect.y + placement.rect.height / 2,
    });
    const beyond = await nearbySnapshot(page, fixture, mode);
    record(
      `${mode}: above-anchor and beyond 300px points stay inactive`,
      above.cards === 0 && beyond.cards === 0,
      { above, beyond },
    );

    await scroller(page, mode).evaluate((node) => {
      node.scrollTop = 0;
    });
    await settle(page, 250);
    await move(placement.first);
    const entryBefore = await nearbySnapshot(page, fixture, mode);
    await scroller(page, mode).evaluate((node, top) => {
      node.scrollTop = top;
    }, placement.top);
    await settle(page, 700);
    const entryAfter = await nearbySnapshot(page, fixture, mode);
    record(
      `${mode}: stationary pointer activates an anchor scrolled into view`,
      entryBefore.cards === 0 &&
        connectedInsidePane(entryAfter) &&
        entryBefore.pointerEvents === entryAfter.pointerEvents,
      {
        before: entryBefore,
        after: entryAfter,
        noPointerMove: entryBefore.pointerEvents === entryAfter.pointerEvents,
      },
    );
    await page.screenshot({ path: `${destination}/${mode}-entry.png`, scale: "css" });

    await move({ x: 20, y: 20 });
    await move(placement.first);
    const active = await nearbySnapshot(page, fixture, mode);
    await scroller(page, mode).evaluate((node) => {
      node.scrollTop = 0;
    });
    await settle(page, 300);
    const away = await nearbySnapshot(page, fixture, mode);
    await scroller(page, mode).evaluate((node, top) => {
      node.scrollTop = top;
    }, placement.top);
    await settle(page, 700);
    const returned = await nearbySnapshot(page, fixture, mode);
    record(
      `${mode}: stationary pointer restores a nearby card after scroll away and back`,
      connectedInsidePane(active) &&
        away.cards === 0 &&
        connectedInsidePane(returned) &&
        active.pointerEvents === away.pointerEvents &&
        away.pointerEvents === returned.pointerEvents,
      { active, away, returned, noPointerMove: active.pointerEvents === returned.pointerEvents },
    );
    await page.screenshot({ path: `${destination}/${mode}-return.png`, scale: "css" });
    for (const result of await nearbyGuards(page, fixture, mode)) {
      record(result.name, result.passed, result.detail);
    }
    await verifyNearbyDirections(page, fixture, mode, destination, record);
  }
  const actual = await page.evaluate(
    async (paths) =>
      Object.fromEntries(
        await Promise.all(
          paths.map(async (path) => [
            path,
            await app.vault.read(app.vault.getAbstractFileByPath(path)),
          ]),
        ),
      ),
    Object.keys(fixture.originals),
  );
  assert.deepEqual(actual, fixture.originals);
  assert.deepEqual(errors, []);
  evidence.status = evidence.results.every((result) => result.status === "passed")
    ? "passed"
    : "failed";
  if (evidence.status === "failed") process.exitCode = 1;
} catch (error) {
  evidence.status = "failed";
  evidence.failure = String(error);
  throw error;
} finally {
  try {
    evidence.events = await stopNearbyEvents(page);
    await closeCard(page);
    await preferences(page, "cards", "nearby");
    await openNote(page, originalView.file, originalView.mode);
    await scroller(page, originalView.mode).evaluate((node) => {
      node.scrollTop = 0;
    });
    await page.mouse.move(20, 20);
    evidence.preservedFiles = 0;
    for (const file of baseline) {
      assert.equal(sha(await readFile(join(".qa/vault", file.path))), file.sha256);
      evidence.preservedFiles++;
    }
    for (const asset of assets)
      assert.equal(
        sha(await readFile(`.qa/vault/.obsidian/plugins/marginote/${asset.name}`)),
        asset.sha256,
      );
    evidence.assetsUnchanged = true;
    assert.deepEqual(errors, []);
  } catch (error) {
    evidence.status = "failed";
    evidence.cleanupFailure = String(error);
    process.exitCode = 1;
  } finally {
    evidence.errors = errors;
    evidence.finished = new Date().toISOString();
    try {
      await writeFile(`${destination}/result.json`, `${JSON.stringify(evidence, null, 2)}\n`);
    } finally {
      await browser.close();
    }
  }
  console.log(`Evidence: ${destination}/result.json`);
}
