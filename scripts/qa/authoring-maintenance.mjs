import assert from "node:assert/strict";

export async function verifyCardMaintenance(driver, scenario, cards) {
  const { page, run, imagePath, image, openSource, command, disk } = driver;
  const { textFixture, textMarkdown } = cards;
  let { textCard } = cards;
  await scenario("edit opens the original card file", async () => {
    await openSource(textFixture.path, textFixture.selection);
    await command("Marginote: Edit annotation card at cursor");
    await page.waitForFunction((path) => app.workspace.getActiveFile()?.path === path, textCard);
    return { opened: textCard, identityUnchanged: (await disk(textCard)) === textMarkdown };
  });
  await scenario("host rename updates source links and preserves UUID", async () => {
    const renamed = `${run} renamed`;
    await command("Rename file");
    await page.locator(".workspace-leaf.mod-active .inline-title").fill(renamed);
    await page.keyboard.press("Enter");
    const path = `Annotations/${renamed}.md`;
    await page.waitForFunction((path) => app.workspace.getActiveFile()?.path === path, path);
    await page.waitForFunction(
      async ({ source, target }) => {
        const content = await app.vault.read(app.vault.getFileByPath(source));
        const link = /\[\[([^|\]]+)\|/.exec(content)?.[1];
        return link && app.metadataCache.getFirstLinkpathDest(link, source)?.path === target;
      },
      { source: textFixture.path, target: path },
    );
    assert.equal(await disk(path), textMarkdown);
    const oldPath = textCard;
    textCard = path;
    return {
      oldPath,
      newPath: path,
      sourceLinksUpdated: true,
      sourceMarkdown: await disk(textFixture.path),
      originalMarkdownAndUuidPreserved: true,
    };
  });
  await scenario("deleting only the disposable card restores host fallback", async () => {
    assert.ok(textCard.includes(run));
    await command("Delete current file");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForFunction((path) => !app.vault.getFileByPath(path), textCard);
    await openSource(textFixture.path, textFixture.selection);
    await page.keyboard.press("Meta+e");
    const unresolved = page
      .locator(".workspace-leaf.mod-active .markdown-reading-view a.internal-link.is-unresolved")
      .filter({ hasText: textFixture.selection });
    await unresolved.waitFor({ state: "visible" });
    assert.equal(
      (await unresolved.getAttribute("data-href")).split("/").at(-1),
      textCard.replace(/\.md$/, "").split("/").at(-1),
    );
    assert.equal(
      await unresolved.evaluate((element) => element.classList.contains("marginote-anchor")),
      false,
    );
    assert.equal(await disk(imagePath), image);
    return {
      deleted: textCard,
      unresolvedHostLink: true,
      customAnchorRemoved: true,
      imagePreserved: true,
    };
  });
}
