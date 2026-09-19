import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";
import { mountNearbyFixture } from "./nearby-fixture.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const baseline = process.argv.includes("--baseline");
const label = baseline ? "baseline" : process.argv.includes("--before") ? "before" : "after";
const bundle = await build({
  entryPoints: [fileURLToPath(new URL("./nearby-browser-imports.ts", import.meta.url))],
  alias: { obsidian: fileURLToPath(new URL("./nearby-browser-host.ts", import.meta.url)) },
  bundle: true,
  write: false,
  format: "iife",
  globalName: "NearbyHarness",
  plugins: baseline
    ? [
        {
          name: "read-only-baseline",
          setup(builder) {
            builder.onLoad(
              { filter: /src\/ui\/(automatic-preview|window-controller|overlay|manager)\.ts$/ },
              ({ path }) => ({
                contents: execFileSync("git", ["show", `HEAD:${relative(root, path)}`], {
                  cwd: root,
                  encoding: "utf8",
                }),
                loader: "ts",
                resolveDir: dirname(path),
              }),
            );
          },
        },
      ]
    : [],
});
const source = bundle.outputFiles[0]?.text;
assert.ok(source);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
const errors = [];
let page;
async function settle() {
  return page.evaluate(async () => {
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    return window.nearbyFixture.snapshot();
  });
}
async function scroll(top) {
  await page.evaluate((value) => window.nearbyFixture.scroll(value), top);
  return settle();
}
async function expectCards(count) {
  await page.waitForFunction(
    (expected) => document.querySelectorAll(".marginote-card").length === expected,
    count,
    { timeout: 1500 },
  );
  return settle();
}
async function scenario(name, action, options = {}) {
  page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  page.on("pageerror", (error) => errors.push({ name, message: error.message }));
  try {
    await page.setContent("<title>Nearby DOM regression</title>");
    await page.clock.install();
    await page.addScriptTag({ content: source });
    await page.evaluate(mountNearbyFixture, options);
    const evidence = await action();
    results.push({ name, status: "passed", evidence });
  } catch (error) {
    results.push({ name, status: "failed", message: error.message, state: await settle() });
  } finally {
    await page.evaluate(() => window.nearbyFixture.unload());
    const final = await settle();
    assert.equal(final.listeners, 0, "unload removes every fixture-registered DOM listener");
    assert.equal(final.controllers, 0, "unload releases every owner-document controller");
    assert.equal(final.cards, 0);
    await page.close();
  }
}
async function openNearby() {
  await scroll(400);
  await page.mouse.move(350, 250);
  return expectCards(1);
}
try {
  await scenario("scroll-in opens without a new pointer event", async () => {
    await page.mouse.move(350, 250);
    const initial = await settle();
    assert.equal(initial.cards, 0);
    await scroll(400);
    const entered = await expectCards(1);
    assert.equal(entered.pointerMoves, initial.pointerMoves);
    return { initial, entered };
  });
  for (const dismissal of ["Escape", "a", "selection"]) {
    await scenario(`${dismissal} before the first candidate forgets the pointer`, async () => {
      await page.mouse.move(350, 250);
      await settle();
      if (dismissal === "selection") await page.evaluate(() => window.nearbyFixture.select());
      else await page.keyboard.press(dismissal);
      await settle();
      await page.evaluate(() => document.getSelection().removeAllRanges());
      const returned = await scroll(400);
      assert.equal(returned.cards, 0);
      assert.equal(returned.point, null);
      return returned;
    });
  }
  await scenario("invisible anchor hides and scroll-back reopens", async () => {
    const initial = await openNearby();
    await scroll(0);
    const hidden = await expectCards(0);
    await scroll(400);
    const returned = await expectCards(1);
    assert.equal(returned.pointerMoves, initial.pointerMoves);
    return { initial, hidden, returned };
  });
  await scenario("expiry hides while preserving stationary scroll re-entry", async () => {
    const initial = await openNearby();
    await page.clock.fastForward(10001);
    const expired = await expectCards(0);
    await scroll(401);
    const returned = await expectCards(1);
    assert.equal(returned.pointerMoves, initial.pointerMoves);
    return { initial, expired, returned };
  });
  for (const secondary of [true, false]) {
    await scenario(
      `visible anchor rebind resumes with secondary=${secondary}`,
      async () => {
        const initial = await openNearby();
        await page.evaluate(() => window.nearbyFixture.rebind());
        const rebound = await expectCards(1);
        assert.equal(rebound.pointerMoves, initial.pointerMoves);
        return { initial, rebound };
      },
      { secondary },
    );
  }
  await scenario("detached retarget preserves a pending stationary preview", async () => {
    const initial = await openNearby();
    await page.evaluate(() => window.nearbyFixture.retarget());
    const retargeted = await expectCards(1);
    assert.equal(retargeted.pointerMoves, initial.pointerMoves);
    return { initial, retargeted };
  });
  for (const dismissal of ["Escape", "key", "pointerdown", "selection", "blur", "touch", "modal"]) {
    await scenario(`explicit ${dismissal} dismissal forgets the pointer`, async () => {
      await openNearby();
      if (dismissal === "Escape") await page.keyboard.press("Escape");
      else if (dismissal === "key") await page.keyboard.press("a");
      else if (dismissal === "pointerdown") await page.mouse.down();
      else if (dismissal === "selection") await page.evaluate(() => window.nearbyFixture.select());
      else if (dismissal === "blur")
        await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      else if (dismissal === "touch")
        await page.dispatchEvent("body", "pointermove", {
          pointerType: "touch",
          clientX: 350,
          clientY: 250,
        });
      else {
        await page.evaluate(() => window.nearbyFixture.modal(true));
        await scroll(401);
      }
      const dismissed = await expectCards(0);
      if (dismissal === "pointerdown") await page.mouse.up();
      if (dismissal === "selection")
        await page.evaluate(() => document.getSelection().removeAllRanges());
      if (dismissal === "modal") await page.evaluate(() => window.nearbyFixture.modal(false));
      await scroll(0);
      const returned = await scroll(400);
      assert.equal(returned.cards, 0);
      assert.equal(returned.point, null);
      return { dismissed, returned };
    });
  }
  await scenario("explicit card stays open while the pointer moves", async () => {
    await scroll(400);
    await page.locator("#anchor").click();
    const initial = await expectCards(1);
    await page.mouse.move(900, 450);
    const pinned = await settle();
    assert.equal(pinned.cards, 1);
    assert.equal(pinned.intent, "explicit");
    return { initial, pinned };
  });
  await scenario(
    "hover remains an interactive stationary card",
    async () => {
      await scroll(400);
      await page.locator("#anchor").hover();
      const initial = await expectCards(1);
      await page.locator(".marginote-card").hover();
      const entered = await settle();
      assert.equal(entered.intent, "hover");
      assert.equal(entered.left, initial.left);
      assert.equal(entered.top, initial.top);
      return { initial, entered };
    },
    { trigger: "hover" },
  );
  await scenario("releaseDocument cancels scheduled work and owner listeners", async () => {
    await openNearby();
    await page.evaluate(() => window.nearbyFixture.releaseDocument());
    await page.evaluate(() => {
      window.nearbyFixture.retarget();
      window.nearbyFixture.releaseBinding();
    });
    assert.equal(
      await page.locator(".marginote-anchor").count(),
      0,
      "a late binding must not reactivate a released document",
    );
    await page.mouse.move(351, 250);
    const released = await scroll(401);
    assert.equal(released.controllers, 0);
    assert.equal(released.listeners, 0);
    assert.equal(released.cards, 0);
    return released;
  });
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await mkdir(new URL("../../.qa/nearby-browser/", import.meta.url), { recursive: true });
  const report = { label, source: baseline ? "HEAD" : "worktree", results, errors };
  await writeFile(
    new URL(`../../.qa/nearby-browser/${label}.json`, import.meta.url),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
assert.ok(
  results.every((result) => result.status === "passed"),
  "every nearby DOM scenario must pass",
);
