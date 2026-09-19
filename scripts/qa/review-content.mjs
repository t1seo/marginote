import assert from "node:assert/strict";
import { assertCard, closeCard, openNote, preferences, readingLink } from "./preview-driver.mjs";
import { verifyReviewFocus } from "./review-focus.mjs";
import {
  assertOriginals,
  editorAnchor,
  localImage,
  longAlias,
  resetReviewCursor,
  waitEditorAnchors,
} from "./review-helpers.mjs";

export async function verifyReviewContent(page, fixture, scenario) {
  await openNote(page, fixture.source, "source");
  await resetReviewCursor(page);
  for (const [name, kind] of [
    ["Image", "image"],
    ["Mixed", "mixed"],
  ]) {
    await scenario(`Live Preview ${kind} loads a local image and connected card`, async () => {
      await editorAnchor(page, `${name} preview QA`).click();
      const images = await localImage(page);
      const geometry = await assertCard(page, kind);
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 250)));
      const accessibility = await editorAnchor(page, `${name} preview QA`).evaluate((node) => ({
        expanded: node.getAttribute("aria-expanded"),
        popup: node.getAttribute("aria-haspopup"),
        connected: node.isConnected,
        range: node.getAttribute("data-marginote-editor-anchor").split(":").map(Number),
      }));
      if (kind === "mixed")
        assert.match(
          await page.locator(".marginote-content").innerText(),
          /Three folded pages share one continuous line/,
        );
      await page.screenshot({ path: `.qa/evidence/review-live-${kind}.png`, scale: "css" });
      if (kind === "image") await closeCard(page);
      else await page.getByRole("button", { name: "Close annotation", exact: true }).click();
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 250)));
      const restoredFocus = await page.evaluate(
        ({ source, range }) => {
          const editor = app.workspace.activeEditor.editor;
          const cursorOffset = editor.posToOffset(editor.getCursor());
          return {
            editorFocused: editor.hasFocus(),
            contentFocused: Boolean(document.activeElement.closest(".cm-content")),
            cursorOffset,
            withinLink: cursorOffset >= range[0] && cursorOffset <= range[1],
            sourceUnchanged: editor.getValue() === source,
          };
        },
        { source: fixture.originals[fixture.source], range: accessibility.range },
      );
      return {
        pass:
          accessibility.expanded === "true" &&
          accessibility.popup === "dialog" &&
          accessibility.connected &&
          restoredFocus.editorFocused &&
          restoredFocus.contentFocused &&
          restoredFocus.withinLink &&
          restoredFocus.sourceUnchanged,
        images,
        geometry,
        accessibility,
        restoredFocus,
        closeMethod: kind === "image" ? "Escape" : "Close button",
        settledObservationMs: 250,
      };
    });
  }
  await verifyReviewFocus(page, fixture, scenario);
  await scenario(
    "Live Preview rapid switching and repeated click toggle retain one correct card",
    async () => {
      const choices = [
        ["Text", "text"],
        ["Other", "text"],
        ["Image", "image"],
        ["Mixed", "mixed"],
        ["Ordinary", "note"],
        ["Markdown", "text"],
      ];
      for (let round = 0; round < 2; round++) {
        for (const [name, kind] of choices) {
          const anchor = editorAnchor(page, `${name} preview QA`);
          await anchor.click();
          await assertCard(page, kind);
          if (name === "Other")
            assert.match(
              await page.locator(".marginote-content").innerText(),
              /Another perspective/,
            );
        }
      }
      const final = editorAnchor(page, "Markdown preview QA");
      await final.click();
      await page.waitForFunction(() => document.querySelectorAll(".marginote-layer").length === 0);
      await final.click();
      await assertCard(page, "text");
      await final.click();
      await page.waitForFunction(() => document.querySelectorAll(".marginote-layer").length === 0);
      return { switchClicks: choices.length * 2, toggleClicks: 3 };
    },
  );
  await scenario(
    "Live Preview content choices update existing anchors without restarting",
    async () => {
      const counts = [];
      for (const [source, count] of [
        ["cards", 6],
        ["notes", 1],
        ["both", 7],
      ]) {
        await preferences(page, source, "click");
        await waitEditorAnchors(page, count);
        counts.push({
          source,
          anchors: await page.locator("[data-marginote-editor-anchor]").count(),
        });
        const name = source === "notes" ? "Ordinary" : "Image";
        await editorAnchor(page, `${name} preview QA`).click();
        await assertCard(page, source === "notes" ? "note" : "image");
        await closeCard(page);
      }
      return { counts };
    },
  );
  await scenario(
    "Live Preview Off suppresses automatic hover while explicit click remains",
    async () => {
      await page.mouse.move(20, 20);
      await editorAnchor(page, "Text preview QA").hover();
      await assert.rejects(
        page.locator(".marginote-card").waitFor({ state: "visible", timeout: 600 }),
        { name: "TimeoutError" },
      );
      await editorAnchor(page, "Text preview QA").click();
      await assertCard(page, "text");
      await closeCard(page);
      return { noAutomaticCardObservationMs: 600 };
    },
  );
  await scenario(
    "wrapped aliases draw an outline for every visible line in both real app modes",
    async () => {
      await page.setViewportSize({ width: 500, height: 950 });
      const results = [];
      for (const mode of ["preview", "source"]) {
        await openNote(page, fixture.source, mode);
        if (mode === "source") await resetReviewCursor(page);
        const anchor =
          mode === "source"
            ? editorAnchor(page, longAlias)
            : readingLink(page, "Annotations/Text", 1);
        await anchor.click();
        const geometry = await assertCard(page, "text");
        const detailHandle = await page.waitForFunction(() => {
          const manager = app.plugins.plugins.marginote._children.find(
            (child) => typeof child.controllers?.get === "function",
          );
          const node = manager.controllers.get(document)?.active?.anchor.node;
          const container = node?.closest(".workspace-leaf-content");
          if (!node?.isConnected || !container) return null;
          const pane = container.getBoundingClientRect();
          const rects = [...node.getClientRects()].filter(
            (rect) =>
              rect.width > 0 &&
              rect.height > 0 &&
              rect.bottom > Math.max(0, pane.top) &&
              rect.top < Math.min(innerHeight, pane.bottom),
          );
          return {
            lines: rects.length,
            outlines: document.querySelectorAll(
              ".marginote-connector rect:not(.marginote-endpoint)",
            ).length,
            endpoints: document.querySelectorAll(".marginote-endpoint").length,
          };
        });
        const detail = await detailHandle.jsonValue();
        await detailHandle.dispose();
        assert.ok(detail.lines > 1, JSON.stringify(detail));
        assert.equal(detail.outlines, detail.lines);
        assert.equal(detail.endpoints, 2);
        await page.screenshot({ path: `.qa/evidence/review-wrapped-${mode}.png`, scale: "css" });
        await closeCard(page);
        results.push({ mode, geometry, ...detail });
      }
      await page.setViewportSize({ width: 1200, height: 950 });
      return { modes: results };
    },
  );
  await scenario(
    "Markdown lists checkboxes and local links render without rewriting the card",
    async () => {
      const results = [];
      for (const mode of ["preview", "source"]) {
        await openNote(page, fixture.source, mode);
        if (mode === "source") await resetReviewCursor(page);
        const anchor =
          mode === "source"
            ? editorAnchor(page, "Markdown preview QA")
            : readingLink(page, fixture.card.slice(0, -3));
        await anchor.click();
        await assertCard(page, "text");
        assert.equal(await page.locator(".marginote-content ul > li").count(), 3);
        assert.equal(await page.locator(".marginote-content ol > li").count(), 2);
        assert.equal(await page.locator(".marginote-content strong").innerText(), "bold content");
        const boxes = page.locator(".marginote-content input[type=checkbox]");
        assert.equal(await boxes.count(), 2);
        assert.equal(await boxes.nth(0).isChecked(), false);
        assert.equal(await boxes.nth(1).isChecked(), true);
        const disabled = await boxes.first().isDisabled();
        if (!disabled) await boxes.first().click();
        await assertOriginals(page, fixture.originals);
        await page.screenshot({ path: `.qa/evidence/review-markdown-${mode}.png`, scale: "css" });
        await page
          .locator(".marginote-content a")
          .filter({ hasText: "Local Markdown link" })
          .click();
        await page.waitForFunction(
          () => app.workspace.activeLeaf?.getViewState().state.file === "Ordinary note.md",
        );
        await page.waitForFunction(
          () => document.querySelectorAll(".marginote-layer").length === 0,
        );
        results.push({ mode, checkboxDisabled: disabled, opened: "Ordinary note.md" });
      }
      return { modes: results, unchanged: await assertOriginals(page, fixture.originals) };
    },
  );
}
