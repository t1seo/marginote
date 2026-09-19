import assert from "node:assert/strict";
import { assertCard, closeCard, openNote, preferences, readingLink } from "./preview-driver.mjs";

export async function verifySettingsContent(page, fixture, scenario, requests) {
  await scenario("ordinary notes hide YAML and Open note follows the original file", async () => {
    await preferences(page, "notes", "click");
    await openNote(page, fixture.paths.source);
    await readingLink(page, fixture.paths.ordinary.slice(0, -3)).click();
    await assertCard(page, "note");
    const content = await page.locator(".marginote-content").innerText();
    assert.match(content, /A normal local Markdown note/);
    assert.doesNotMatch(content, new RegExp(fixture.yamlSentinel));
    assert.equal(await page.locator(".marginote-content strong").innerText(), "formatted text");
    await page.screenshot({ path: ".qa/evidence/note-preview.png", scale: "css" });
    await page.getByRole("button", { name: "Open note", exact: true }).click();
    await page.waitForFunction(
      (path) => app.workspace.activeLeaf?.getViewState().state.file === path,
      fixture.paths.ordinary,
    );
    assert.equal(await page.locator(".marginote-layer").count(), 0);
    await openNote(page, fixture.paths.source);
    return { openedPath: fixture.paths.ordinary };
  });

  await scenario("long note previews end at a paragraph and expose an excerpt notice", async () => {
    await readingLink(page, fixture.paths.long.slice(0, -3)).click();
    await assertCard(page, "note");
    const content = await page.locator(".marginote-content").innerText();
    assert.ok(content.includes(fixture.paragraph));
    assert.ok(content.length < 6000);
    assert.ok(!content.includes(fixture.yamlSentinel));
    assert.ok(!content.includes(fixture.tailSentinel));
    assert.match(await page.locator(".marginote-excerpt-note").innerText(), /Open the note/);
    await page.screenshot({ path: ".qa/evidence/note-excerpt.png", scale: "css" });
    await closeCard(page);
    return {
      renderedCharacters: content.length,
      sourceCharacters: fixture.fixtures[fixture.paths.long].length,
    };
  });

  await scenario("an empty existing note offers a clear empty-state message", async () => {
    await readingLink(page, fixture.paths.empty.slice(0, -3)).click();
    await assertCard(page, "note");
    assert.equal(await page.locator(".marginote-empty-note").innerText(), "This note is empty.");
    assert.equal(await page.getByRole("button", { name: "Open note", exact: true }).count(), 1);
    await closeCard(page);
  });

  await scenario(
    "malformed media markup and remote images create no external request",
    async () => {
      const start = requests.length;
      await readingLink(page, fixture.paths.media.slice(0, -3)).click();
      await assertCard(page, "note");
      assert.equal(await page.locator(".marginote-content img").count(), 0);
      const content = await page.locator(".marginote-content").innerText();
      assert.match(content, /Remote diagram/);
      assert.match(content, /Image unavailable/);
      assert.match(content, /<img src=/);
      assert.deepEqual(requests.slice(start), []);
      await page.screenshot({ path: ".qa/evidence/note-media.png", scale: "css" });
      await closeCard(page);
      return { remoteRequests: requests.slice(start) };
    },
  );

  await scenario("Cmd-click uses native note navigation instead of opening a card", async () => {
    const before = await page.evaluate(() => ({
      ids: app.workspace.getLeavesOfType("markdown").map((leaf) => leaf.id),
      sourceId: app.workspace.activeLeaf.id,
    }));
    await readingLink(page, fixture.paths.ordinary.slice(0, -3)).click({ modifiers: ["Meta"] });
    await page.waitForFunction(
      (path) =>
        app.workspace
          .getLeavesOfType("markdown")
          .some((leaf) => leaf.getViewState().state.file === path),
      fixture.paths.ordinary,
    );
    assert.equal(await page.locator(".marginote-card").count(), 0);
    const opened = await page.evaluate(
      (path) =>
        app.workspace
          .getLeavesOfType("markdown")
          .filter((leaf) => leaf.getViewState().state.file === path)
          .map((leaf) => leaf.id),
      fixture.paths.ordinary,
    );
    await page.evaluate(({ ids, sourceId }) => {
      for (const leaf of app.workspace.getLeavesOfType("markdown")) {
        if (!ids.includes(leaf.id)) leaf.detach();
      }
      const source = app.workspace.getLeafById(sourceId);
      if (source) app.workspace.setActiveLeaf(source, { focus: true });
    }, before);
    await openNote(page, fixture.paths.source);
    return { nativeLeaves: opened };
  });
}
