import assert from "node:assert/strict";
import { setTimeout as pause } from "node:timers/promises";
import { assertCard, closeCard, readingLink } from "../qa/preview-driver.mjs";
import { assertEnglishSurface } from "./language.mjs";
import { caption } from "./overlays.mjs";

export function createPointer(page) {
  let previous = { x: 1050, y: 650 };
  return async (x, y, milliseconds = 800) => {
    const start = previous;
    const steps = Math.max(1, Math.round(milliseconds / 40));
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      const eased = progress * progress * (3 - 2 * progress);
      await page.mouse.move(start.x + (x - start.x) * eased, start.y + (y - start.y) * eased);
      await pause(milliseconds / steps);
    }
    previous = { x, y };
  };
}

async function bounds(locator) {
  const result = await locator.boundingBox();
  assert.ok(result, "The recorded UI target must be visible.");
  return { ...result, centerX: result.x + result.width / 2, centerY: result.y + result.height / 2 };
}

async function showSetting(page, move, label, value, mark) {
  await page.evaluate(() => {
    app.setting.open();
    app.setting.openTabById("marginote");
  });
  const select = page.getByLabel(label, { exact: true });
  await select.waitFor();
  await pause(400);
  const box = await bounds(select);
  await move(box.centerX, box.centerY, 450);
  await select.selectOption(value);
  await assertEnglishSurface(page);
  mark();
  await pause(850);
  await page.keyboard.press("Escape");
  await page.locator(".modal-container").waitFor({ state: "hidden" });
}

export async function performDemo(page, paths, recording) {
  const markers = [];
  const mark = (name) => markers.push({ name, seconds: recording.elapsed() });
  const move = createPointer(page);
  await caption(page, "01 · Near the text — an optional way to explore");
  await pause(1000);
  const text = await bounds(readingLink(page, paths.text));
  await move(text.centerX - 125, text.y + text.height + 14, 1000);
  await assertCard(page, "text");
  await assertEnglishSurface(page);
  mark("nearby-text");
  await move(text.centerX + 110, text.y + text.height + 24, 1500);
  await pause(600);

  const image = await bounds(readingLink(page, paths.image));
  await move(image.centerX + 125, image.y + image.height + 8, 1200);
  await assertCard(page, "image");
  await page.waitForFunction(() => document.querySelector(".marginote-card img")?.naturalWidth > 0);
  await assertEnglishSurface(page);
  mark("nearby-image");
  await move(image.centerX - 70, image.y + image.height + 10, 1300);
  await pause(700);
  assert.equal(await page.locator(".hover-popover:visible").count(), 0);
  await closeCard(page);

  await caption(page, "02 · On hover by default — read the card, then click to pin");
  await showSetting(page, move, "Automatic preview", "hover", () => mark("hover-settings"));
  const hoverText = await bounds(readingLink(page, paths.text));
  await move(hoverText.centerX, hoverText.centerY, 900);
  await assertCard(page, "text");
  await pause(500);
  const hoverCard = await bounds(page.locator(".marginote-content"));
  await move(hoverCard.centerX, hoverCard.centerY, 180);
  await pause(1220);
  assert.equal(await page.locator(".marginote-card").count(), 1);
  await page.mouse.click(hoverCard.centerX, hoverCard.centerY);
  mark("hover-pinned");
  await move(1090, 650, 900);
  await pause(1400);
  assert.equal(await page.locator(".marginote-card").count(), 1);
  await assertEnglishSurface(page);
  await closeCard(page);

  await caption(page, "03 · Preview ordinary notes — choose the links you want");
  await showSetting(page, move, "Preview content", "notes", () => mark("note-settings"));
  const note = await bounds(readingLink(page, paths.note));
  await move(note.centerX, note.centerY, 1000);
  await assertCard(page, "note");
  assert.match(await page.locator(".marginote-note-title").innerText(), /Reading journal/);
  await assertEnglishSurface(page);
  mark("ordinary-note");
  await pause(900);
  const noteCard = await bounds(page.locator(".marginote-content"));
  await move(noteCard.centerX, noteCard.centerY, 180);
  await pause(2070);
  assert.equal(await page.locator(".marginote-card").count(), 1);
  await caption(page, "Keep your place. Bring the details closer. · Marginote");
  await pause(1800);
  return markers;
}
