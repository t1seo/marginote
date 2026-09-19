import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";
import { mountReadingFixture } from "./adoption-fixture.mjs";

const bundle = await build({
  entryPoints: [fileURLToPath(new URL("../../src/reading/processor.ts", import.meta.url))],
  alias: { obsidian: fileURLToPath(new URL("./browser-host.ts", import.meta.url)) },
  bundle: true,
  write: false,
  format: "iife",
  globalName: "ReadingHarness",
});
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const source = bundle.outputFiles[0]?.text;
  assert.ok(source);
  await page.setContent("<main>Reading adoption regression</main>");
  await page.addScriptTag({ content: source });
  await page.evaluate(mountReadingFixture);
  const settle = async () =>
    page.evaluate(async () => {
      await new Promise((done) => setTimeout(done, 0));
      return window.readingFixture.snapshot();
    });
  const initial = await settle();
  assert.equal(initial.active, 3);
  await page.evaluate(() => window.readingFixture.open());
  const detached = await settle();
  assert.equal(
    detached.mismatched,
    0,
    "a detached main-document Reading section adopted into a popout must change binding owner",
  );
  assert.deepEqual(
    detached.owners.map(({ bound }) => bound),
    [1, 1, 1],
  );
  assert.equal(detached.created, initial.created + 1);
  assert.equal(detached.released, initial.released + 1);
  await page.evaluate(() => window.readingFixture.moveConnected());
  const moved = await settle();
  assert.equal(moved.mismatched, 0, "moving a connected Reading leaf must release its old owner");
  assert.deepEqual(
    moved.owners.map(({ bound }) => bound),
    [0, 1, 2],
  );
  assert.ok(moved.owners.every(({ created, active }) => created === 1 && active === 1));
  await page.evaluate(() => window.readingFixture.noise());
  const unchanged = await settle();
  assert.equal(
    unchanged.created,
    moved.created,
    "unrelated or same-document DOM changes do not rebind",
  );
  assert.equal(unchanged.released, moved.released);
  await page.evaluate(() => window.readingFixture.moveBack());
  const back = await settle();
  assert.deepEqual(
    back.owners.map(({ bound }) => bound),
    [1, 1, 1],
  );
  assert.equal(back.mismatched, 0);
  await page.evaluate(() => window.readingFixture.close());
  const closed = await settle();
  assert.deepEqual(
    closed.owners.map(({ bound }) => bound),
    [1, 1, 0],
  );
  assert.deepEqual(
    closed.owners.map(({ active }) => active),
    [1, 1, 0],
  );
  assert.equal(closed.owners[2].disconnected, 1);
  await page.evaluate(() => window.readingFixture.queueThenUnload());
  const unloaded = await settle();
  assert.equal(unloaded.active, 0);
  assert.equal(
    unloaded.created,
    closed.created,
    "pending observer records do not rebind after unload",
  );
  assert.ok(unloaded.owners.every(({ active }) => active === 0));
  await page.evaluate(() => window.readingFixture.unloadChildren());
  const final = await settle();
  assert.equal(final.created, final.released);
  assert.equal(final.duplicateReleases, 0);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({ checks: 9, initial, detached, moved, closed, final, errors }, null, 2),
  );
} finally {
  await browser.close();
}
