import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { captureErrors, connectQa } from "./connect.mjs";
import { assertCard, closeCard, openNote, preferences, readingLink } from "./preview-driver.mjs";

const { browser, page } = await connectQa();
const results = [],
  errors = captureErrors(page);
const popouts = [];
const errorGroups = [errors];
const paneLink = (index) =>
  page
    .locator(".markdown-preview-view:visible")
    .nth(index)
    .locator('a[data-href="Annotations/Text"]')
    .first();
async function scenario(name, action) {
  await action();
  results.push({ name, status: "passed" });
  console.log(`PASS ${name}`);
}
async function state(target) {
  return target.evaluate(() => {
    const plugin = app.plugins.plugins.marginote;
    const manager = plugin?._children.find((child) => child.controllers instanceof Map);
    return {
      documents: manager?.controllers.size ?? 0,
      anchors: [...(manager?.controllers.values() ?? [])].map((owner) => owner.anchors.size),
      layers: document.querySelectorAll(".marginote-layer").length,
      commands: Object.keys(app.commands.commands).filter((key) => key.startsWith("marginote:")),
    };
  });
}
try {
  await page.setViewportSize({ width: 1440, height: 950 });
  await openNote(page);
  await preferences(page, "both", "click");
  await page.evaluate(() => {
    const active = app.workspace.activeLeaf;
    for (const leaf of app.workspace.getLeavesOfType("markdown"))
      if (leaf !== active) leaf.detach();
    app.workspace.leftSplit.collapse();
    app.workspace.rightSplit.collapse();
  });
  await scenario(
    "split panes share one card while keeping placement inside its source pane",
    async () => {
      await page.evaluate(async () => {
        const leaf = app.workspace.getLeaf("split", "vertical");
        await leaf.setViewState({
          type: "markdown",
          state: { file: "QA Reading.md", mode: "preview" },
        });
      });
      await paneLink(1).waitFor();
      for (const index of [0, 1]) {
        const link = paneLink(index);
        await link.click();
        await assertCard(page, "text");
        const pane = await link.evaluate((node) => {
          const bounds = node.closest(".workspace-leaf-content").getBoundingClientRect();
          const card = node.ownerDocument.querySelector(".marginote-card").getBoundingClientRect();
          return { contained: card.left >= bounds.left && card.right <= bounds.right + 1 };
        });
        assert.equal(pane.contained, true);
      }
      await closeCard(page);
    },
  );
  await scenario("closing an active source pane releases its card and anchors", async () => {
    await paneLink(1).click();
    await assertCard(page, "text");
    const before = await state(page);
    await page.evaluate(() => app.workspace.getLeavesOfType("markdown")[1].detach());
    await page.waitForFunction(() => document.querySelectorAll(".marginote-layer").length === 0);
    const after = await state(page);
    assert.ok(after.anchors[0] < before.anchors[0]);
    assert.equal(after.documents, 1);
  });
  await scenario(
    "a real pop-out renders in its owner document and releases that document on close",
    async () => {
      const context = page.context();
      const popPromise = context.waitForEvent("page", { timeout: 10000 });
      await page.evaluate(async () => {
        const leaf = app.workspace.openPopoutLeaf({ size: { width: 900, height: 750 } });
        await leaf.setViewState({
          type: "markdown",
          state: { file: "QA Reading.md", mode: "preview" },
        });
      });
      const pop = await popPromise;
      popouts.push(pop);
      errorGroups.push(captureErrors(pop));
      await pop.waitForFunction(() =>
        document.querySelector('.marginote-anchor[data-href="Annotations/Text"]'),
      );
      assert.equal(
        await pop.evaluate(() => app.vault.adapter.basePath),
        await page.evaluate(() => app.vault.adapter.basePath),
      );
      await readingLink(pop, "Annotations/Text").click();
      await assertCard(pop, "text");
      assert.equal(await page.locator(".marginote-layer").count(), 0);
      assert.equal((await state(page)).documents, 2);
      await pop.screenshot({ path: ".qa/evidence/popout.png", scale: "css" });
      await pop.evaluate(() => window.close());
      await page.waitForFunction(() => {
        const manager = app.plugins.plugins.marginote._children.find(
          (child) => child.controllers instanceof Map,
        );
        return manager.controllers.size === 1;
      });
      await page.bringToFront();
      await readingLink(page, "Annotations/Text").click();
      await assertCard(page, "text");
      await closeCard(page);
    },
  );
  await scenario(
    "disable and re-enable three times clean layers, timers, listeners and commands",
    async () => {
      const session = await page.context().newCDPSession(page);
      const snapshots = [];
      const eventCounts = async () => {
        await page.waitForFunction(() => document.querySelectorAll(".hover-popover").length === 0);
        const result = await session.send("Runtime.evaluate", {
          expression: `JSON.stringify([document,window].map(target=>{
                const entries=Object.entries(getEventListeners(target));
                const ignored=(key,entry)=>target===window && ["click","mousemove","contextmenu"].includes(key) && String(entry.listener).includes("_hitTargetInterceptor");
                return {
                  raw:Object.fromEntries(entries.map(([key,value])=>[key,value.length])),
                  counts:Object.fromEntries(entries.map(([key,value])=>[key,value.filter(entry=>!ignored(key,entry)).length])),
                  automation:Object.fromEntries(entries.map(([key,value])=>[key,value.filter(entry=>ignored(key,entry)).length]))
                };
              }))`,
          includeCommandLineAPI: true,
          returnByValue: true,
        });
        return JSON.parse(result.result.value);
      };
      try {
        for (let cycle = 0; cycle < 3; cycle++) {
          await readingLink(page, "Annotations/Text").click();
          await assertCard(page, "text");
          await page.mouse.move(20, 20);
          const cleanup = await page.evaluate(async () => {
            const plugin = app.plugins.plugins.marginote;
            const manager = plugin._children.find((child) => child.controllers instanceof Map);
            const owners = [...manager.controllers.values()];
            await app.plugins.disablePlugin("marginote");
            return {
              documents: manager.controllers.size,
              anchors: owners.map((owner) => owner.anchors.size),
              active: owners.some((owner) => owner.active || owner.requested),
              automatic: owners.some((owner) => owner.automatic.frame || owner.automatic.pending),
            };
          });
          assert.equal(cleanup.documents, 0);
          assert.equal(cleanup.active, false);
          assert.equal(cleanup.automatic, false);
          assert.ok(cleanup.anchors.every((count) => count === 0));
          assert.equal((await state(page)).layers, 0);
          assert.equal((await state(page)).commands.length, 0);
          snapshots.push({ cycle, disabled: await eventCounts() });
          await page.evaluate(() => app.plugins.enablePlugin("marginote"));
          await openNote(page, "Ordinary note.md");
          await openNote(page);
          await readingLink(page, "Annotations/Text").waitFor();
          await page.waitForFunction(() =>
            document.querySelector('a.marginote-anchor[data-href="Annotations/Text"]'),
          );
          assert.equal((await state(page)).commands.length, 3);
          snapshots[cycle].enabled = await eventCounts();
        }
        results.push({ name: "listener counts", snapshots });
        for (const snapshot of snapshots.slice(1)) {
          assert.deepEqual(
            snapshot.enabled.map((entry) => entry.counts),
            snapshots[0].enabled.map((entry) => entry.counts),
          );
          assert.deepEqual(
            snapshot.disabled.map((entry) => entry.counts),
            snapshots[0].disabled.map((entry) => entry.counts),
          );
        }
      } finally {
        await session.detach();
      }
    },
  );
  assert.deepEqual(errorGroups.flat(), []);
} finally {
  for (const pop of popouts) if (!pop.isClosed()) await pop.evaluate(() => window.close());
  await writeFile(
    ".qa/evidence/lifecycle.json",
    JSON.stringify({ results, errors: errorGroups.flat() }, null, 2),
  );
  await browser.close();
}
