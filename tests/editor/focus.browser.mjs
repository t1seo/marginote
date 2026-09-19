import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  entryPoints: [fileURLToPath(new URL("./browser-imports.ts", import.meta.url))],
  bundle: true,
  write: false,
  format: "iife",
  globalName: "EditorHarness",
});
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const source = bundle.outputFiles[0]?.text;
  assert.ok(source);
  await page.setContent("<main></main><button>Other control</button>");
  await page.addScriptTag({ content: source });
  await page.evaluate(() => {
    const { Decoration, EditorState, EditorView, ViewPlugin, EditorAnchorBindings } = EditorHarness;
    const text = "Before linked text after";
    const link = { from: 7, to: 18, labelFrom: 7, labelTo: 18, linktext: "Card" };
    let tagName = "span";
    let restoreFocus;
    const plugin = ViewPlugin.define(
      (view) => {
        const bindings = new EditorAnchorBindings(view, (node, _target, _path, focusEditor) => {
          let current = node;
          const attach = () => {
            current.tabIndex = 0;
            current.setAttribute("data-bound", "true");
          };
          attach();
          restoreFocus = () => {
            if (focusEditor) focusEditor();
            else current.focus();
          };
          return {
            retarget(next) {
              current = next;
              attach();
            },
            release() {
              current.removeAttribute("data-bound");
            },
          };
        });
        const instance = {
          decorations: Decoration.none,
          update() {
            instance.decorations = Decoration.set([
              Decoration.mark({
                tagName,
                attributes: { "data-marginote-editor-anchor": "link" },
              }).range(link.from, link.to),
            ]);
            bindings.setAnchors(new Map([["link", { link, sourcePath: "Focus.md" }]]));
          },
          docViewUpdate() {
            bindings.schedule();
          },
          destroy() {
            bindings.destroy();
          },
        };
        instance.update();
        return instance;
      },
      { decorations: (instance) => instance.decorations },
    );
    const view = new EditorView({
      parent: document.querySelector("main"),
      state: EditorState.create({
        doc: text,
        extensions: [plugin, EditorState.allowMultipleSelections.of(true)],
      }),
    });
    window.focusFixture = {
      view,
      restore: () => restoreFocus(),
      replace() {
        tagName = tagName === "span" ? "mark" : "span";
        view.dispatch({});
      },
      snapshot: () => ({
        focused: document.activeElement === view.contentDOM && view.hasFocus,
        selection: view.state.selection.ranges.map(({ anchor, head }) => ({ anchor, head })),
        text: view.state.doc.toString(),
      }),
    };
  });
  await page.waitForFunction(() => document.querySelector("[data-bound]"));
  const restoreThenReplace = () =>
    page.evaluate(async () => {
      window.focusFixture.restore();
      window.focusFixture.replace();
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
      return window.focusFixture.snapshot();
    });
  const initial = await page.evaluate(() => window.focusFixture.snapshot());
  const restored = await restoreThenReplace();
  assert.equal(
    restored.focused,
    true,
    "explicit return must focus the stable CM editor after redraw",
  );
  assert.deepEqual(restored.selection, [{ anchor: 7, head: 7 }]);
  await page.evaluate(() => window.focusFixture.view.dispatch({ selection: { anchor: 10 } }));
  const caret = await restoreThenReplace();
  assert.deepEqual(caret.selection, [{ anchor: 10, head: 10 }]);
  await page.evaluate(() =>
    window.focusFixture.view.dispatch({ selection: { anchor: 2, head: 5 } }),
  );
  const range = await restoreThenReplace();
  assert.deepEqual(range.selection, [{ anchor: 2, head: 5 }]);
  await page.evaluate(() => {
    const { EditorSelection } = EditorHarness;
    window.focusFixture.view.dispatch({
      selection: EditorSelection.create([EditorSelection.cursor(1), EditorSelection.cursor(10)]),
    });
  });
  const multiple = await restoreThenReplace();
  assert.deepEqual(multiple.selection, [
    { anchor: 1, head: 1 },
    { anchor: 10, head: 10 },
  ]);
  assert.equal(multiple.text, initial.text, "focus restoration must not alter Markdown");
  await page.locator("button").focus();
  await page.evaluate(() => window.focusFixture.replace());
  await page.waitForTimeout(100);
  assert.equal(
    await page.locator("button").evaluate((node) => node === document.activeElement),
    true,
  );
  await page.evaluate(() => {
    window.focusFixture.view.destroy();
    window.focusFixture.restore();
  });
  assert.equal(
    await page.locator("button").evaluate((node) => node === document.activeElement),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks: 7, restored, caret, range, multiple, errors }, null, 2));
} finally {
  await browser.close();
}
