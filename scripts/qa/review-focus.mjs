import assert from "node:assert/strict";
import { assertCard, closeCard } from "./preview-driver.mjs";
import { editorAnchor, resetReviewCursor } from "./review-helpers.mjs";

export async function verifyReviewFocus(page, fixture, scenario) {
  await scenario(
    "Live Preview close preserves an existing text selection and multiple cursors",
    async () => {
      const cases = [
        [{ anchor: { line: 8, ch: 0 }, head: { line: 8, ch: 8 } }],
        [
          { anchor: { line: 8, ch: 0 }, head: { line: 8, ch: 8 } },
          { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } },
        ],
      ];
      const results = [];
      for (const selections of cases) {
        await resetReviewCursor(page);
        await editorAnchor(page, "Text preview QA").click();
        await assertCard(page, "text");
        const before = await page.evaluate((selections) => {
          const editor = app.workspace.activeEditor.editor;
          editor.setSelections(selections);
          return editor.listSelections();
        }, selections);
        assert.equal(before.length, selections.length);
        assert.ok(
          before.some(
            (selection) =>
              selection.anchor.line !== selection.head.line ||
              selection.anchor.ch !== selection.head.ch,
          ),
        );
        await assertCard(page, "text");
        await closeCard(page);
        await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 250)));
        const after = await page.evaluate(() => {
          const editor = app.workspace.activeEditor.editor;
          return {
            selections: editor.listSelections(),
            editorFocused: editor.hasFocus(),
            source: editor.getValue(),
          };
        });
        assert.deepEqual(after.selections, before);
        assert.equal(after.editorFocused, true);
        assert.equal(after.source, fixture.originals[fixture.source]);
        results.push({ before, after: after.selections, editorFocused: after.editorFocused });
      }
      await resetReviewCursor(page);
      return { cases: results, settledObservationMs: 250 };
    },
  );
}
