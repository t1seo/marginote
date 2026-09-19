import assert from "node:assert/strict";
import { setTimeout as pause } from "node:timers/promises";
import { assertCard, closeCard } from "../qa/preview-driver.mjs";
import { assertEnglishSurface } from "./language.mjs";
import { caption } from "./overlays.mjs";

export async function showScrolling(page, paths, move, mark) {
  await caption(page, "04 · Keep reading — the next detail is further down");
  await move(1080, 610, 400);
  const view = page.locator(".markdown-preview-view:visible");
  const target = page
    .locator(`.markdown-preview-view:visible a[data-href="${paths.text}"]`)
    .filter({ hasText: /^return to the observation$/u });
  for (let step = 0; step < 7; step += 1) {
    await page.mouse.wheel(0, 360);
    await pause(230);
    if (step === 1) {
      await mark("scrolling-passages");
      await pause(900);
    }
    if (step >= 2 && (await target.count())) {
      const bounds = await target.boundingBox();
      if (bounds && bounds.y > 70 && bounds.y + bounds.height < 740) break;
    }
  }
  assert.ok(await view.evaluate((node) => node.scrollTop > 600));
  const bounds = await target.boundingBox();
  assert.ok(bounds && bounds.y > 70 && bounds.y + bounds.height < 740);
  await move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, 600);
  await assertCard(page, "text");
  await assertEnglishSurface(page);
  await caption(page, "The annotation is still beside the words you are reading");
  await mark("scrolled-card");
  await pause(1600);
  await closeCard(page);
  await move(1080, 610, 300);
  const scrollTop = await view.evaluate((node) => node.scrollTop);
  for (let step = 0; step < 5; step += 1) {
    await page.mouse.wheel(0, -scrollTop / 5 - 2);
    await pause(180);
  }
  assert.equal(await view.evaluate((node) => Math.round(node.scrollTop)), 0);
  await pause(350);
}
