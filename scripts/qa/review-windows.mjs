import assert from "node:assert/strict";
import { captureErrors } from "./connect.mjs";
import { assertCard, closeCard, openNote, preferences, readingLink } from "./preview-driver.mjs";
import {
  assertOriginals,
  editorAnchor,
  localImage,
  ownerState,
  resetReviewCursor,
  waitEditorAnchors,
} from "./review-helpers.mjs";

export async function verifyReviewWindows(page, fixture, scenario, popouts, errorGroups) {
  await preferences(page, "both", "click");
  await openNote(page, fixture.source, "source");
  await resetReviewCursor(page);
  const leafId = await page.evaluate(async () => {
    const source = app.workspace.activeLeaf;
    const baseline = app.workspace.getLeaf("split", "vertical");
    await baseline.setViewState({
      type: "markdown",
      state: { file: "QA Reading.md", mode: "preview" },
    });
    app.workspace.setActiveLeaf(source, { focus: true });
    return source.id;
  });
  let pop;
  await scenario(
    "moving an existing Live Preview leaf to a real popout changes its document owner",
    async () => {
      await editorAnchor(page, "Image preview QA").click();
      await localImage(page);
      await assertCard(page, "image");
      const before = await ownerState(page);
      const popPromise = page.context().waitForEvent("page", { timeout: 10000 });
      await page.evaluate((id) => {
        app.workspace.moveLeafToPopout(app.workspace.getLeafById(id), {
          size: { width: 900, height: 800 },
        });
      }, leafId);
      pop = await popPromise;
      popouts.push(pop);
      errorGroups.push(captureErrors(pop));
      await pop.waitForFunction(() => Boolean(window.app?.workspace.layoutReady));
      assert.equal(
        await pop.evaluate(() => app.vault.adapter.basePath),
        await page.evaluate(() => app.vault.adapter.basePath),
      );
      await pop.setViewportSize({ width: 900, height: 800 });
      await pop.bringToFront();
      await waitEditorAnchors(pop);
      await page.waitForFunction(() => document.querySelectorAll(".marginote-layer").length === 0);
      await editorAnchor(pop, "Image preview QA").click();
      const images = await localImage(pop);
      const geometry = await assertCard(pop, "image");
      const after = await ownerState(page);
      assert.equal(after.length, 2);
      assert.ok(after.every((owner) => !owner.closed && owner.mismatchedOwners === 0));
      assert.equal(await page.locator(".marginote-layer").count(), 0);
      const moved = await pop.evaluate((id) => {
        const leaf = app.workspace.getLeafById(id);
        return {
          id: leaf.id,
          sameDocument: leaf.view.containerEl.ownerDocument === document,
          source: leaf.view.editor.getValue(),
        };
      }, leafId);
      assert.equal(moved.sameDocument, true);
      assert.equal(moved.source, fixture.originals[fixture.source]);
      await pop.screenshot({ path: ".qa/evidence/review-moved-live-image.png", scale: "css" });
      await closeCard(pop);
      return { leafId, before, after, images, geometry };
    },
  );
  await scenario(
    "Source Mode and Live Preview transitions in the moved popout preserve the original source",
    async () => {
      await editorAnchor(pop, "Mixed preview QA").click();
      await localImage(pop);
      await assertCard(pop, "mixed");
      await pop.evaluate(async (id) => {
        const leaf = app.workspace.getLeafById(id);
        const state = leaf.getViewState();
        await leaf.setViewState({
          ...state,
          state: { ...state.state, mode: "source", source: true },
        });
      }, leafId);
      await waitEditorAnchors(pop, 0);
      assert.equal(await pop.locator(".marginote-layer").count(), 0);
      assert.equal(
        await pop.evaluate((id) => app.workspace.getLeafById(id).view.editor.getValue(), leafId),
        fixture.originals[fixture.source],
      );
      await pop.evaluate(async (id) => {
        const leaf = app.workspace.getLeafById(id);
        const state = leaf.getViewState();
        await leaf.setViewState({
          ...state,
          state: { ...state.state, mode: "source", source: false },
        });
      }, leafId);
      await resetReviewCursor(pop);
      await waitEditorAnchors(pop);
      await editorAnchor(pop, "Mixed preview QA").click();
      const images = await localImage(pop);
      await assertCard(pop, "mixed");
      await pop.screenshot({ path: ".qa/evidence/review-popout-live-mixed.png", scale: "css" });
      await closeCard(pop);
      return { images, unchanged: await assertOriginals(page, fixture.originals) };
    },
  );
  await scenario(
    "source preferences update the already open Live Preview popout immediately",
    async () => {
      const counts = [];
      for (const [source, count] of [
        ["cards", 6],
        ["notes", 1],
        ["both", 7],
      ]) {
        await page.bringToFront();
        await page.evaluate(() => {
          const leaf = app.workspace
            .getLeavesOfType("markdown")
            .find((leaf) => leaf.view.containerEl.ownerDocument === document);
          app.workspace.setActiveLeaf(leaf, { focus: true });
        });
        await preferences(page, source, "click");
        await waitEditorAnchors(pop, count);
        await pop.bringToFront();
        const name = source === "notes" ? "Ordinary" : "Image";
        await editorAnchor(pop, `${name} preview QA`).click();
        await assertCard(pop, source === "notes" ? "note" : "image");
        await closeCard(pop);
        counts.push({ source, anchors: count });
      }
      return { counts };
    },
  );
  await scenario(
    "closing an active Live Preview popout releases its document and leaves the main window usable",
    async () => {
      await editorAnchor(pop, "Image preview QA").click();
      await localImage(pop);
      await assertCard(pop, "image");
      const before = await ownerState(page);
      await pop.evaluate(() => window.close());
      await page.waitForFunction(() => {
        const manager = app.plugins.plugins.marginote._children.find(
          (child) => child.controllers instanceof Map,
        );
        return (
          manager.controllers.size === 1 &&
          [...manager.controllers.keys()].every((doc) => !doc.defaultView?.closed)
        );
      });
      await page.bringToFront();
      await readingLink(page, "Annotations/Text").click();
      await assertCard(page, "text");
      const after = await ownerState(page);
      assert.equal(after.length, 1);
      assert.equal(after[0].current, true);
      assert.equal(after[0].mismatchedOwners, 0);
      await closeCard(page);
      return { before, after, unchanged: await assertOriginals(page, fixture.originals) };
    },
  );
}
