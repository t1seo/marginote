import { copyFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { captureErrors, connectQa } from "./connect.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { browser, page, receipt } = await connectQa();
try {
  const errors = captureErrors(page);
  await page.evaluate(() => app.plugins.disablePlugin("marginote"));
  const directory = join(receipt.vault, ".obsidian/plugins/marginote");
  for (const filename of ["main.js", "manifest.json", "styles.css"]) {
    await copyFile(join(root, filename), join(directory, filename));
  }
  await page.evaluate(() => app.plugins.enablePlugin("marginote"));
  await page.waitForFunction(() => Boolean(app.plugins.plugins.marginote));
  if (errors.length > 0) throw new Error(JSON.stringify(errors));
  console.log("Reloaded current build in the isolated fixture vault.");
} finally {
  await browser.close();
}
