import assert from "node:assert/strict";
import { setTimeout as pause } from "node:timers/promises";
import { assertCard, closeCard, openNote, readingLink } from "../qa/preview-driver.mjs";
import { assertEnglishSurface } from "./language.mjs";
import { caption } from "./overlays.mjs";

async function showFollow(page, target, move, mark, stage) {
  const anchor = await target.boundingBox();
  assert.ok(anchor, `${stage}: the annotation link must be visible.`);
  const pane = await target.evaluate((node) => {
    const bounds = node.closest(".workspace-leaf-content").getBoundingClientRect();
    return { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom };
  });
  const points = [
    { direction: "left", x: anchor.x - 150, y: anchor.y + anchor.height / 2 },
    { direction: "below", x: anchor.x + anchor.width / 2, y: anchor.y + anchor.height + 150 },
    { direction: "right", x: anchor.x + anchor.width + 150, y: anchor.y + anchor.height / 2 },
  ];
  const samples = [];
  for (const point of points) {
    assert.ok(
      point.x > pane.left &&
        point.x < pane.right &&
        point.y > pane.top &&
        point.y < Math.min(pane.bottom, 740),
      `${stage}/${point.direction}: the 150px pointer position must remain in the reading pane.`,
    );
    const distance = Math.hypot(
      Math.max(anchor.x - point.x, 0, point.x - anchor.x - anchor.width),
      Math.max(anchor.y - point.y, 0, point.y - anchor.y - anchor.height),
    );
    assert.equal(distance, 150);
    await move(point.x, point.y, 950);
    await assertCard(page, "mixed");
    await page.waitForFunction(
      () => document.querySelector(".marginote-card img")?.naturalWidth > 0,
    );
    const geometry = await assertCard(page, "mixed");
    assert.match(await page.locator(".marginote-content").innerText(), /A sketch with a purpose/);
    const rendering = await page.locator(".marginote-layer").evaluate((layer) => {
      const line = layer.querySelector(".marginote-connector line");
      return {
        passive:
          layer.classList.contains("is-preview") &&
          layer.inert &&
          layer.getAttribute("aria-hidden") === "true" &&
          getComputedStyle(layer.querySelector(".marginote-card")).pointerEvents === "none",
        connector: { x: Number(line.getAttribute("x2")), y: Number(line.getAttribute("y2")) },
      };
    });
    assert.equal(rendering.passive, true);
    assert.equal(await page.locator(".hover-popover:visible").count(), 0);
    await assertEnglishSurface(page);
    const previous = samples.at(-1);
    const movement = previous
      ? {
          card: Math.hypot(
            geometry.rect.left - previous.geometry.rect.left,
            geometry.rect.top - previous.geometry.rect.top,
          ),
          connector: Math.hypot(
            rendering.connector.x - previous.rendering.connector.x,
            rendering.connector.y - previous.rendering.connector.y,
          ),
        }
      : null;
    if (movement) {
      assert.ok(
        movement.card > 40,
        `${stage}/${point.direction}: the card must follow the pointer.`,
      );
      assert.ok(
        movement.connector > 40,
        `${stage}/${point.direction}: the connector must follow the card.`,
      );
    }
    samples.push({ point, distance, geometry, rendering, movement });
    await mark(`${stage}-${point.direction}`);
    await pause(750);
  }
  return { stage, alias: "an illustrated note", anchor, pane, samples };
}

export async function showNearby(page, paths, move, mark) {
  await caption(page, "01 · Reading view — near text, the card follows your pointer");
  await pause(650);
  const text = await readingLink(page, paths.text).boundingBox();
  assert.ok(text);
  await move(text.x + text.width + 150, text.y + text.height / 2, 800);
  await assertCard(page, "text");
  await mark("nearby-text");
  await pause(650);
  const image = await readingLink(page, paths.image).boundingBox();
  assert.ok(image);
  await move(image.x + image.width + 130, image.y + image.height / 2, 850);
  await assertCard(page, "image");
  await page.waitForFunction(() => document.querySelector(".marginote-card img")?.naturalWidth > 0);
  await assertCard(page, "image");
  await mark("nearby-image");
  await pause(650);
  await closeCard(page);
  await move(50, 100, 300);
  await caption(page, "Move left, below, and right — the card follows the same text");
  const reading = await showFollow(
    page,
    readingLink(page, paths.mixed),
    move,
    mark,
    "reading-nearby",
  );
  await closeCard(page);
  await move(50, 100, 250);

  await caption(page, "02 · Live Preview — left, below, and right while you write");
  await openNote(page, paths.source, "source");
  await page.evaluate(() => {
    app.workspace.activeEditor.editor.setCursor({ line: 0, ch: 0 });
    app.workspace.activeEditor.editor.scrollTo(0, 0);
  });
  const editorLink = page
    .locator(".workspace-leaf.mod-active [data-marginote-editor-anchor]")
    .filter({ hasText: /^an illustrated note$/u });
  await editorLink.waitFor();
  await page.waitForFunction(
    () => document.querySelector(".workspace-leaf.mod-active .cm-content")?.spellcheck === false,
  );
  const editing = await showFollow(page, editorLink, move, mark, "live-preview-nearby");
  await closeCard(page);
  await move(50, 100, 250);
  await openNote(page, paths.source);
  await readingLink(page, paths.text).waitFor();
  return [reading, editing];
}
