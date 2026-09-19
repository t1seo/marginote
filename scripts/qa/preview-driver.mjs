import assert from "node:assert/strict";

export async function openNote(page, file = "QA Reading.md", mode = "preview") {
  await page.evaluate(
    async ({ file, mode }) => {
      app.setting.close();
      const leaf = app.workspace.getLeaf(false);
      await leaf.setViewState({ type: "markdown", state: { file, mode, source: false } });
      app.workspace.setActiveLeaf(leaf, { focus: true });
    },
    { file, mode },
  );
  await page.waitForFunction(
    ({ file, mode }) =>
      app.workspace.activeLeaf?.getViewState().state.file === file &&
      app.workspace.activeLeaf?.getViewState().state.mode === mode,
    { file, mode },
  );
}

export async function preferences(page, source, trigger) {
  await page.evaluate(() => {
    app.setting.open();
    app.setting.openTabById("marginote");
  });
  await page.getByLabel("Preview content", { exact: true }).selectOption(source, { timeout: 3000 });
  await page
    .getByLabel("Automatic preview", { exact: true })
    .selectOption(trigger, { timeout: 3000 });
  await page.waitForFunction(
    async ({ source, trigger }) => {
      const data = await app.plugins.plugins.marginote.loadData();
      return data.previewSource === source && data.previewTrigger === trigger;
    },
    { source, trigger },
  );
  await page.keyboard.press("Escape");
  await page.locator(".modal-container").waitFor({ state: "hidden" });
}

export function readingLink(page, target, occurrence = 0) {
  return page.locator(`.markdown-preview-view:visible a[data-href="${target}"]`).nth(occurrence);
}

export async function closeCard(page) {
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelectorAll(".marginote-layer").length === 0);
}

export async function assertCard(page, kind) {
  await page.locator(`.marginote-card[data-kind="${kind}"]`).waitFor({ timeout: 3000 });
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  const geometry = await page.evaluate(() => {
    const card = document.querySelector(".marginote-card");
    const rect = card.getBoundingClientRect();
    const line = document.querySelector(".marginote-connector line");
    const x = Number(line?.getAttribute("x2"));
    const y = Number(line?.getAttribute("y2"));
    return {
      count: document.querySelectorAll(".marginote-card").length,
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
      width: innerWidth,
      height: innerHeight,
      line: Boolean(line),
      corner:
        Math.min(Math.abs(x - rect.left), Math.abs(x - rect.right)) < 1 &&
        Math.min(Math.abs(y - rect.top), Math.abs(y - rect.bottom)) < 1,
    };
  });
  assert.equal(geometry.count, 1);
  assert.equal(geometry.line, true);
  assert.equal(geometry.corner, true);
  assert.ok(geometry.rect.left >= 0 && geometry.rect.top >= 0, JSON.stringify(geometry));
  assert.ok(
    geometry.rect.right <= geometry.width + 1 && geometry.rect.bottom <= geometry.height + 1,
    JSON.stringify(geometry),
  );
  return geometry;
}
