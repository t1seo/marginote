import assert from "node:assert/strict";

export const longAlias =
  "긴 표시 문구의 줄 감김을 실제 Obsidian 편집기에서 확인하며 연결선과 각 줄의 테두리가 원래 링크를 따라 유지되는지 살펴보는 독립 QA 문장입니다 "
    .repeat(3)
    .trim();

export async function prepareReviewFixtures(page, run) {
  const source = `${run} Source.md`;
  const card = `Annotations/${run} Markdown.md`;
  const originals = {
    [card]:
      "---\nmarginote-card: 1\nmarginote-id: aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\nmarginote-kind: text\n---\n# Markdown content QA\n\n- Unordered item with **bold content**\n- [ ] Pending task\n- [x] Completed task\n\n1. Ordered first\n2. Ordered second\n\n[Local Markdown link](Ordinary%20note.md)\n\n[[Ordinary note|Local wiki link]]\n",
    [source]: `# Independent final QA\n\n[[Annotations/Text|Text preview QA]] [[Annotations/Image|Image preview QA]] [[Annotations/Mixed|Mixed preview QA]]\n\n[[Annotations/Other text|Other preview QA]] [[${card.slice(0, -3)}|Markdown preview QA]] [[Ordinary note|Ordinary preview QA]]\n\n[[Annotations/Text|${longAlias}]]\n\nPreserve this exact source 📚 한글.\n`,
  };
  await page.evaluate(async (contents) => {
    for (const [path, content] of Object.entries(contents)) await app.vault.create(path, content);
  }, originals);
  await page.waitForFunction(
    ({ source, card }) => {
      const file = app.vault.getAbstractFileByPath(source);
      const links = app.metadataCache.resolvedLinks[source];
      return (
        app.metadataCache.getFileCache(file)?.links?.length === 7 &&
        links?.["Annotations/Text.md"] === 2 &&
        links?.[card] === 1
      );
    },
    { source, card },
  );
  return { source, card, originals };
}

export function editorAnchor(page, text) {
  return page.locator(".workspace-leaf [data-marginote-editor-anchor]").filter({ hasText: text });
}

export async function resetReviewCursor(page) {
  await page.evaluate(() => {
    const leaf = app.workspace
      .getLeavesOfType("markdown")
      .find(
        (leaf) =>
          leaf.view.containerEl.ownerDocument === document &&
          leaf.getViewState().state.mode === "source",
      );
    leaf.view.editor.setCursor({ line: 0, ch: 0 });
  });
  await waitEditorAnchors(page);
}

export async function waitEditorAnchors(page, count = 7) {
  await page.waitForFunction((count) => {
    const nodes = [...document.querySelectorAll("[data-marginote-editor-anchor]")];
    const manager = app.plugins.plugins.marginote._children.find(
      (child) => typeof child.controllers?.get === "function",
    );
    const bound = [...(manager.controllers.get(document)?.anchors ?? [])];
    return (
      nodes.length === count && nodes.every((node) => bound.some((anchor) => anchor.node === node))
    );
  }, count);
}

export async function localImage(page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".marginote-card img")].some(
      (img) => img.complete && img.naturalWidth > 0,
    ),
  );
  const images = await page.locator(".marginote-card img").evaluateAll((nodes) =>
    nodes.map((image) => ({
      src: image.src,
      width: image.naturalWidth,
      height: image.naturalHeight,
      complete: image.complete,
    })),
  );
  assert.ok(images.length > 0);
  assert.ok(
    images.every((image) => image.complete && image.width > 0 && image.src.startsWith("app://")),
  );
  return images;
}

export async function ownerState(page) {
  return page.evaluate(() => {
    const manager = app.plugins.plugins.marginote?._children.find(
      (child) => typeof child.controllers?.get === "function",
    );
    return [...(manager?.controllers.entries() ?? [])].map(([doc, owner]) => ({
      current: doc === document,
      closed: doc.defaultView?.closed ?? true,
      anchors: owner.anchors.size,
      mismatchedOwners: [...owner.anchors].filter((anchor) => anchor.node.ownerDocument !== doc)
        .length,
      layers: doc.querySelectorAll(".marginote-layer").length,
      pending: Boolean(owner.requested),
    }));
  });
}

export async function assertOriginals(page, originals) {
  const actual = await page.evaluate(async (paths) => {
    const content = {};
    for (const path of paths)
      content[path] = await app.vault.read(app.vault.getAbstractFileByPath(path));
    return content;
  }, Object.keys(originals));
  assert.deepEqual(actual, originals);
  return Object.keys(actual);
}
