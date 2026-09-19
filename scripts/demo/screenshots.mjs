import assert from "node:assert/strict";
import { mkdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import {
  assertCard,
  closeCard,
  openNote,
  preferences,
  readingLink,
} from "../qa/preview-driver.mjs";
import { assertEnglishSurface } from "./language.mjs";

export async function captureListingScreenshots(page, paths, directory) {
  await mkdir(directory, { recursive: true });
  const screenshots = [];
  const capture = async (name) => {
    assert.equal(await page.locator("#marginote-demo-cursor, #marginote-demo-caption").count(), 0);
    await assertEnglishSurface(page);
    const path = join(directory, `${name}.png`);
    await page.mouse.move(1150, 760);
    await page.screenshot({ path });
    const png = await readFile(path);
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    assert.equal(width, 1200);
    assert.equal(height, 800);
    const bytes = (await stat(path)).size;
    assert.ok(bytes <= 5_000_000, "Directory screenshots must be at most 5 MB.");
    screenshots.push({ filename: `${name}.png`, width, height, bytes });
  };
  await preferences(page, "both", "hover");
  await openNote(page, paths.source);
  for (const [name, target, kind] of [
    ["text-card", paths.text, "text"],
    ["image-card", paths.image, "image"],
    ["mixed-card", paths.mixed, "mixed"],
    ["ordinary-note", paths.note, "note"],
  ]) {
    await closeCard(page);
    await readingLink(page, target).click();
    await assertCard(page, kind);
    if (kind === "image" || kind === "mixed") {
      await page.waitForFunction(
        () => document.querySelector(".marginote-card img")?.naturalWidth > 0,
      );
      await assertCard(page, kind);
    }
    await capture(name);
  }
  await closeCard(page);
  await preferences(page, "cards", "nearby");
  await page.evaluate(() => {
    app.setting.open();
    app.setting.openTabById("marginote");
  });
  await page.getByLabel("Preview content", { exact: true }).waitFor();
  await capture("settings");
  await page.keyboard.press("Escape");
  return screenshots;
}
