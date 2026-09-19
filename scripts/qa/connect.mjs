import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export async function connectQa() {
  const receipt = JSON.parse(await readFile(resolve(root, ".qa/resource-receipt.json"), "utf8"));
  const expectedVault = resolve(root, ".qa/vault");
  if (receipt.vault !== expectedVault || receipt.endpoint !== "http://127.0.0.1:19222") {
    throw new Error("QA receipt does not point to this repository's isolated fixture.");
  }
  const browser = await chromium.connectOverCDP(receipt.endpoint);
  try {
    const page = browser
      .contexts()
      .flatMap((context) => context.pages())
      .find((candidate) => candidate.url() === "app://obsidian.md/index.html");
    if (!page) throw new Error("The isolated Obsidian page is missing.");
    await page.waitForFunction(() => window.app?.workspace.layoutReady);
    const vault = await page.evaluate(() => window.app.vault.adapter.basePath);
    if (vault !== expectedVault)
      throw new Error(`Refusing to operate on unexpected vault: ${vault}`);
    return { browser, page, receipt };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export function captureErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push({ type: "pageerror", message: error.message }));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push({ type: "console", message: message.text() });
  });
  return errors;
}
