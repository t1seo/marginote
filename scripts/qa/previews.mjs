import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { captureErrors, connectQa } from "./connect.mjs";
import { assertCard, closeCard, openNote, preferences, readingLink } from "./preview-driver.mjs";

const { browser, page } = await connectQa();
const results = [];
const errors = captureErrors(page);
async function scenario(name, action) {
  await action();
  results.push({ name, status: "passed" });
  console.log(`PASS ${name}`);
}
try {
  await page.setViewportSize({ width: 1440, height: 950 });
  await openNote(page);
  await scenario("settings select card sources and explicit-only mode", async () => {
    await preferences(page, "cards", "click");
    await readingLink(page, "Annotations/Text").waitFor();
    assert.ok(
      (await readingLink(page, "Annotations/Text").getAttribute("class")).includes(
        "marginote-anchor",
      ),
    );
    assert.ok(
      !(await readingLink(page, "Ordinary note").getAttribute("class")).includes(
        "marginote-anchor",
      ),
    );
  });
  await scenario("text image and mixed cards show connectors and native Markdown", async () => {
    for (const [target, kind] of [
      ["Text", "text"],
      ["Image", "image"],
      ["Mixed", "mixed"],
    ]) {
      await readingLink(page, `Annotations/${target}`).click();
      await assertCard(page, kind);
      if (kind !== "text")
        await page.waitForFunction(() =>
          [...document.querySelectorAll(".marginote-card img")].some(
            (img) => img.complete && img.naturalWidth > 0,
          ),
        );
      await page.screenshot({ path: `.qa/evidence/reading-${kind}-light.png`, scale: "css" });
      await closeCard(page);
    }
  });
  await scenario("identical aliases resolve to distinct cards", async () => {
    await readingLink(page, "Annotations/Other text").click();
    assert.match(await page.locator(".marginote-content").innerText(), /Another perspective/);
    await closeCard(page);
  });
  await scenario("keyboard Space and Escape restore the anchor focus", async () => {
    const link = readingLink(page, "Annotations/Text");
    await link.focus();
    await page.keyboard.press("Space");
    await assertCard(page, "text");
    assert.equal(await page.locator(".marginote-card button:focus").count(), 1);
    await closeCard(page);
    assert.equal(await link.evaluate((node) => node === node.ownerDocument.activeElement), true);
  });
  await scenario(
    "note-only mode keeps card links native and previews ordinary note content",
    async () => {
      await preferences(page, "notes", "click");
      assert.ok(
        !(await readingLink(page, "Annotations/Text").getAttribute("class")).includes(
          "marginote-anchor",
        ),
      );
      await readingLink(page, "Ordinary note").click();
      await assertCard(page, "note");
      assert.equal(await page.locator(".marginote-note-title").innerText(), "Ordinary note");
      await page.getByRole("button", { name: "Open note", exact: true }).click();
      await page.waitForFunction(
        () => app.workspace.activeLeaf?.getViewState().state.file === "Ordinary note.md",
      );
      await openNote(page);
    },
  );
  await scenario("both mode applies live and invalid targets retain host behavior", async () => {
    await preferences(page, "both", "click");
    for (const target of ["Annotations/Text", "Ordinary note"])
      assert.ok(
        (await readingLink(page, target).getAttribute("class")).includes("marginote-anchor"),
      );
    for (const target of [
      "Missing note",
      "Annotations/Bad schema",
      "Annotations/Bad kind",
      "Annotations/Text#Learning by observation",
    ])
      assert.ok(
        !(await readingLink(page, target).getAttribute("class")).includes("marginote-anchor"),
      );
  });
  await scenario("hover allows entry into the card and click pins it", async () => {
    await preferences(page, "both", "hover");
    const link = readingLink(page, "Annotations/Text");
    await link.hover();
    await assertCard(page, "text");
    await page.locator(".marginote-card").hover();
    assert.equal(await page.locator(".marginote-layer").getAttribute("aria-hidden"), null);
    await page.locator(".marginote-content").click();
    await page.mouse.move(50, 50);
    await page.waitForFunction(() => document.querySelectorAll(".marginote-card").length === 1);
    await closeCard(page);
  });
  await scenario(
    "nearby mode keeps passive content noninteractive and hidden from accessibility",
    async () => {
      await preferences(page, "cards", "nearby");
      await page.mouse.move(40, 40);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const bounds = await readingLink(page, "Annotations/Text").boundingBox();
      assert.ok(bounds);
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height + 8);
      await assertCard(page, "text");
      assert.equal(await page.locator(".marginote-layer").getAttribute("aria-hidden"), "true");
      assert.equal(
        await page
          .locator(".marginote-card")
          .evaluate((node) => getComputedStyle(node).pointerEvents),
        "none",
      );
      await closeCard(page);
    },
  );
  assert.deepEqual(errors, []);
} finally {
  await writeFile(".qa/evidence/previews.json", JSON.stringify({ results, errors }, null, 2));
  await browser.close();
}
