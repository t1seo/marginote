import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { captureErrors, connectQa } from "./connect.mjs";
import { assertCard, closeCard, openNote, preferences } from "./preview-driver.mjs";

const { browser, page } = await connectQa();
const results = [],
  errors = captureErrors(page);
let fixtureReady = null;
let failure = null;
const file = `Editor QA ${Date.now()}.md`;
const original =
  "# 편집 검증\n\n[[Annotations/Text|인지적 도제]]와 [[Ordinary note|노트 링크]]를 읽습니다.\n\n여기에서 한글 입력과 선택을 확인합니다.\n";
try {
  await page.setViewportSize({ width: 1100, height: 900 });
  await preferences(page, "both", "click");
  fixtureReady = await page.evaluate(
    ({ file, original }) =>
      new Promise((resolve, reject) => {
        const finish = () => {
          const fixture = app.vault.getAbstractFileByPath(file);
          const cache = fixture && app.metadataCache.getFileCache(fixture);
          const links = app.metadataCache.resolvedLinks[file];
          if (
            cache?.links?.length !== 2 ||
            links?.["Annotations/Text.md"] !== 1 ||
            links?.["Ordinary note.md"] !== 1
          )
            return;
          app.metadataCache.offref(resolved);
          clearTimeout(timeout);
          resolve({ indexedLinks: cache.links.length, resolvedLinks: links });
        };
        const resolved = app.metadataCache.on("resolved", finish);
        const timeout = setTimeout(() => {
          app.metadataCache.offref(resolved);
          reject(new Error(`Metadata did not finish resolving the new editor fixture: ${file}`));
        }, 5000);
        app.vault.create(file, original).catch((error) => {
          app.metadataCache.offref(resolved);
          clearTimeout(timeout);
          reject(error);
        });
      }),
    { file, original },
  );
  await openNote(page, file, "source");
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".workspace-leaf.mod-active [data-marginote-editor-anchor]")
        .length === 2,
  );
  const anchor = page.locator(".workspace-leaf.mod-active [data-marginote-editor-anchor]").first();
  await anchor.click();
  await assertCard(page, "text");
  await closeCard(page);
  results.push({ scenario: "primary Live Preview click opens a card", status: "passed" });
  await page.evaluate(() => app.workspace.activeEditor.editor.setCursor({ line: 0, ch: 0 }));
  await page.locator(".workspace-leaf.mod-active .cm-content").focus();
  await page.keyboard.insertText("앞부분 📚 ");
  await page.waitForFunction(() =>
    app.workspace.activeEditor.editor.getValue().startsWith("앞부분 📚 "),
  );
  await page.waitForFunction(
    () => document.querySelectorAll(".workspace-leaf.mod-active .marginote-anchor").length === 2,
  );
  await anchor.click();
  await assertCard(page, "text");
  await closeCard(page);
  await page.locator(".workspace-leaf.mod-active .cm-content").focus();
  await page.keyboard.press("Meta+z");
  await page.waitForFunction(
    (original) => app.workspace.activeEditor.editor.getValue() === original,
    original,
  );
  await page.keyboard.press("Meta+Shift+z");
  await page.waitForFunction(() =>
    app.workspace.activeEditor.editor.getValue().startsWith("앞부분 📚 "),
  );
  await page.keyboard.press("Meta+z");
  await page.waitForFunction(
    (original) => app.workspace.activeEditor.editor.getValue() === original,
    original,
  );
  results.push({
    scenario: "text before anchors repositions links and supports undo redo",
    status: "passed",
  });
  await page.evaluate(() => app.workspace.activeEditor.editor.setCursor({ line: 2, ch: 5 }));
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".workspace-leaf.mod-active [data-marginote-editor-anchor]")
        .length === 1,
  );
  assert.equal(await page.evaluate(() => app.workspace.activeEditor.editor.getValue()), original);
  results.push({ scenario: "cursor inside link preserves editable source", status: "passed" });
  await page.evaluate(async () => {
    const leaf = app.workspace.activeLeaf;
    const current = leaf.getViewState();
    await leaf.setViewState({
      ...current,
      state: { ...current.state, mode: "source", source: true },
    });
  });
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".workspace-leaf.mod-active [data-marginote-editor-anchor]")
        .length === 0,
  );
  assert.equal(await page.evaluate(() => app.workspace.activeEditor.editor.getValue()), original);
  results.push({
    scenario: "Source Mode keeps source untouched with no preview decorations",
    status: "passed",
  });
  await openNote(page, file, "source");
  await page.evaluate(() => {
    const editor = app.workspace.activeEditor.editor;
    editor.setCursor({ line: 4, ch: 0 });
    editor.focus();
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.imeSetComposition", { text: "하", selectionStart: 1, selectionEnd: 1 });
  await cdp.send("Input.imeSetComposition", { text: "한", selectionStart: 1, selectionEnd: 1 });
  await cdp.send("Input.insertText", { text: "한글 " });
  await page.waitForFunction(() =>
    app.workspace.activeEditor.editor.getLine(4).startsWith("한글 "),
  );
  assert.ok(
    (await page.evaluate(() => app.workspace.activeEditor.editor.getValue())).includes(
      "[[Annotations/Text|인지적 도제]]",
    ),
  );
  await cdp.detach();
  results.push({
    scenario: "Chromium IME composition preserves Korean and links",
    status: "passed",
  });
  await page.evaluate(() => {
    app.workspace.activeEditor.editor.setCursor({ line: 0, ch: 0 });
  });
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".workspace-leaf.mod-active [data-marginote-editor-anchor]")
        .length === 2,
  );
  await page.locator(".workspace-leaf.mod-active [data-marginote-editor-anchor]").nth(1).click();
  await assertCard(page, "note");
  await closeCard(page);
  await page.screenshot({ path: ".qa/evidence/live-preview.png", scale: "css" });
  results.push({ scenario: "ordinary note previews work in Live Preview", status: "passed" });
  assert.deepEqual(errors, []);
  console.log(`PASS ${results.length} editor scenarios`);
} catch (error) {
  failure = error instanceof Error ? error.stack : String(error);
  throw error;
} finally {
  await writeFile(
    ".qa/evidence/editor.json",
    JSON.stringify({ file, fixtureReady, results, errors, failure }, null, 2),
  );
  await browser.close();
}
