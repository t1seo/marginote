# Isolated Obsidian QA

These commands launch the installed macOS Obsidian executable in `.qa/profile` and `.qa/vault`. They never open or install into an existing personal vault. They do not download or update Obsidian. `.qa` is ignored by Git.

```sh
bun run build
node scripts/qa/obsidian.mjs start
node scripts/qa/obsidian.mjs status
```

Only the `marginote` community plugin is enabled. Fixtures include text, image, mixed, long text, oversized image, missing image, repeated aliases, ordinary/missing links, invalid schemas, and fragments. All prose and SVG images are original QA data. Rerunning `start` preserves existing fixture files and refuses to launch while its recorded process is active.

After building a changed plugin, reload it in the running isolated app:

```sh
node scripts/qa/reload.mjs
```

Attach to the **real Obsidian renderer** from a Node module:

```js
import { connectQa, captureErrors } from "./scripts/qa/connect.mjs";
const { browser, page, receipt } = await connectQa();
try {
  const errors = captureErrors(page);
  // Use Playwright locators, mouse, keyboard, and screenshots against page.
  // Setup can use page.evaluate(() => app.workspace...).
  console.log(await page.title(), receipt.vault, errors);
} finally {
  await browser.close(); // disconnect CDP; the isolated Obsidian process stays open
}
```

The helper validates the vault's real runtime base path before returning a page. Endpoint: `http://127.0.0.1:19222`. Main renderer URL: `app://obsidian.md/index.html`. For pop-outs, identify the corresponding new page in `browser.contexts()` and validate its app/vault before interaction.

Cleanup only the recorded new QA process:

```sh
node scripts/qa/obsidian.mjs stop
```

`.qa/resource-receipt.json` records PID, child processes, profile, vault, endpoint, and log path. The stop command checks the PID's exact binary and isolated profile before signaling it. Fixture files are retained for evidence. A launch/attach smoke check does not constitute plugin feature QA; report actual scenarios separately.
