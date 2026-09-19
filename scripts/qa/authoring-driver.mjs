import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export function createAuthoringDriver({ page, receipt, run, imagePath, image }) {
  async function openSource(path, selection) {
    await page.evaluate(
      async ({ path, selection }) => {
        const leaf = app.workspace.getMostRecentLeaf();
        await leaf.setViewState({
          type: "markdown",
          active: true,
          state: { file: path, mode: "source", source: false },
        });
        const editor = leaf.view.editor;
        const offset = editor.getValue().lastIndexOf(selection);
        if (offset < 0) throw new Error(`Missing selection: ${selection}`);
        editor.setSelection(
          editor.offsetToPos(offset),
          editor.offsetToPos(offset + selection.length),
        );
        editor.focus();
      },
      { path, selection },
    );
    await page.waitForFunction((path) => app.workspace.activeEditor?.file?.path === path, path);
  }

  async function setup(name, content, selection) {
    const path = `${run} ${name}.md`;
    await page.evaluate(
      async ({ path, content }) => {
        await app.vault.create(path, content);
      },
      { path, content },
    );
    await openSource(path, selection);
    return { path, content, selection };
  }

  async function command(name) {
    await page.keyboard.press("Meta+p");
    const input = page.locator(".prompt-input");
    await input.waitFor({ state: "visible" });
    await input.fill(name);
    await page
      .locator(".suggestion-item")
      .filter({ hasText: name.split(": ").at(-1) })
      .first()
      .waitFor({ state: "visible" });
    await page.keyboard.press("Enter");
    await input.waitFor({ state: "hidden" });
  }

  async function createModal() {
    await command("Marginote: Create annotation card from selection");
    await page.locator(".marginote-authoring").waitFor({ state: "visible" });
  }

  async function sourceValue() {
    return page.evaluate(() => app.workspace.activeEditor.editor.getValue());
  }

  async function disk(path) {
    return readFile(resolve(receipt.vault, path), "utf8");
  }

  async function waitSource(content) {
    await page.waitForFunction(
      (expected) => app.workspace.activeEditor?.editor?.getValue() === expected,
      content,
    );
  }

  async function waitDisk(path, content) {
    await page.waitForFunction(
      async ({ path, content }) => {
        const file = app.vault.getFileByPath(path);
        return file && (await app.vault.read(file)) === content;
      },
      { path, content },
    );
  }

  async function fileCount() {
    return page.evaluate(() => app.vault.getFiles().length);
  }

  async function submit() {
    await page.getByRole("button", { name: "Create card", exact: true }).click();
    await page.waitForFunction(
      () =>
        !document.querySelector(".marginote-authoring") ||
        document.querySelector(".marginote-authoring-error")?.textContent,
    );
    const alert = await page.evaluate(
      () => document.querySelector(".marginote-authoring-error")?.textContent ?? "",
    );
    assert.equal(alert, "", `Unexpected create error: ${alert}`);
  }

  function linkedSource(fixture, cardPath) {
    const start = fixture.content.lastIndexOf(fixture.selection);
    return (
      fixture.content.slice(0, start) +
      `[[${cardPath.replace(/\.md$/, "")}|${fixture.selection}]]` +
      fixture.content.slice(start + fixture.selection.length)
    );
  }
  return {
    page,
    receipt,
    run,
    imagePath,
    image,
    openSource,
    setup,
    command,
    createModal,
    sourceValue,
    disk,
    waitSource,
    waitDisk,
    fileCount,
    submit,
    linkedSource,
  };
}
