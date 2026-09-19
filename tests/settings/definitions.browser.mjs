import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../..", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `export * from "./src/settings.ts";
      export * from "./tests/settings/definitions-host.mjs";`,
    resolveDir: root,
  },
  alias: { obsidian: `${root}/tests/settings/definitions-host.mjs` },
  bundle: true,
  write: false,
  format: "iife",
  globalName: "SettingsHarness",
});
const source = bundle.outputFiles[0]?.text;
assert.ok(source);
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent('<aside id="legacy">Unopened tab</aside><main id="search"></main>');
  await page.addScriptTag({ content: source });
  const initial = await page.evaluate(() => {
    const {
      MarginoteSettingsTab,
      parseSettings,
      installHostDom,
      Setting,
      snapshot,
      settleChanges,
    } = SettingsHarness;
    installHostDom(document);
    const legacy = document.querySelector("#legacy");
    const search = document.querySelector("#search");
    const settings = parseSettings(null);
    const unloads = [];
    const saves = [];
    let completed = 0;
    let blocked = false;
    let release = () => {};
    const tab = new MarginoteSettingsTab(
      { containerEl: legacy },
      { register: (dispose) => unloads.push(dispose) },
      settings,
      async () => {
        saves.push({ ...settings });
        if (blocked)
          await new Promise((resolve) => {
            release = resolve;
          });
        completed++;
      },
    );
    window.fixture = {
      tab,
      settings,
      saves,
      unloads,
      legacy: () => snapshot(legacy),
      search: () => snapshot(search),
      flush: settleChanges,
      block: () => {
        blocked = true;
      },
      release: () => {
        blocked = false;
        release();
      },
      completed: () => completed,
      render(definitions) {
        search.replaceChildren();
        const cleanups = definitions.map((definition) =>
          definition.render(new Setting(search).setName(definition.name).setDesc(definition.desc)),
        );
        return () => {
          for (const cleanup of cleanups) cleanup?.();
        };
      },
    };
    return { method: typeof tab.getSettingDefinitions, html: document.body.innerHTML };
  });
  assert.equal(initial.method, "function", "settings must be indexed before the tab ever opens");
  const definitions = await page.evaluate(() => {
    window.definitions = window.fixture.tab.getSettingDefinitions();
    return {
      html: document.body.innerHTML,
      saves: window.fixture.saves.length,
      settings: { ...window.fixture.settings },
      items: window.definitions.map(({ name, desc, aliases, searchable, render }) => ({
        name,
        desc,
        aliases,
        searchable: searchable !== false,
        render: typeof render,
      })),
    };
  });
  assert.equal(definitions.html, initial.html, "indexing must not touch any DOM");
  assert.equal(definitions.saves, 0, "indexing must not write settings");
  assert.deepEqual(definitions.settings, { previewSource: "cards", previewTrigger: "nearby" });
  assert.deepEqual(
    definitions.items.map((item) => item.name),
    ["Preview content", "Automatic preview"],
  );
  assert.ok(definitions.items.every((item) => item.searchable && item.render === "function"));
  assert.ok(definitions.items.every((item) => item.desc && item.aliases.length > 0));
  await page.evaluate(() => {
    window.fixture.settings.previewSource = "notes";
    window.fixture.settings.previewTrigger = "hover";
    window.cleanupSearch = window.fixture.render(window.definitions);
  });
  const modern = await page.evaluate(() => window.fixture.search());
  assert.deepEqual(
    modern.controls.map((control) => control.value),
    ["notes", "hover"],
  );
  assert.deepEqual(
    modern.controls.map((control) => control.options),
    [
      [
        ["cards", "Annotation cards only"],
        ["notes", "Ordinary note links only"],
        ["both", "Both"],
      ],
      [
        ["nearby", "Near text · follows pointer"],
        ["hover", "Over link · stays in place"],
        ["click", "Off"],
      ],
    ],
  );
  assert.equal(modern.live, "polite");
  assert.match(modern.summary, /Only ordinary whole-note Markdown links.*Hover directly/);
  assert.equal(await page.locator("#legacy").textContent(), "Unopened tab");
  await page.evaluate(() => window.fixture.block());
  await page.locator("#search").getByLabel("Preview content", { exact: true }).selectOption("both");
  const pending = await page.evaluate(() => ({
    view: window.fixture.search(),
    saves: window.fixture.saves,
    completed: window.fixture.completed(),
  }));
  assert.match(pending.view.summary, /Annotation cards and ordinary whole-note/);
  assert.deepEqual(pending.saves, [{ previewSource: "both", previewTrigger: "hover" }]);
  assert.equal(pending.completed, 0, "the existing asynchronous save callback must be awaited");
  const changeSettled = await page.evaluate(async () => {
    let settled = false;
    window.pendingChange = window.fixture.flush().then(() => {
      settled = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    return settled;
  });
  assert.equal(changeSettled, false, "the native change callback must retain the save promise");
  await page.evaluate(async () => {
    window.fixture.release();
    await window.pendingChange;
  });
  await page
    .locator("#search")
    .getByLabel("Automatic preview", { exact: true })
    .selectOption("click");
  await page.evaluate(() => window.fixture.flush());
  assert.match(
    (await page.evaluate(() => window.fixture.search())).summary,
    /Automatic previews are off/,
  );
  await page.evaluate(() => window.fixture.tab.display());
  assert.deepEqual(
    await page.evaluate(() => window.fixture.legacy()),
    await page.evaluate(() => window.fixture.search()),
    "legacy and search views must expose the same controls, values, choices and summary",
  );
  await page
    .locator("#legacy")
    .getByLabel("Preview content", { exact: true })
    .selectOption("cards");
  await page.evaluate(() => window.fixture.flush());
  assert.deepEqual(
    await page.evaluate(() => window.fixture.legacy()),
    await page.evaluate(() => window.fixture.search()),
    "active render scopes must share the typed settings object",
  );
  await page.evaluate(() => window.cleanupSearch());
  const disposedSearch = await page.evaluate(() => window.fixture.search());
  await page
    .locator("#legacy")
    .getByLabel("Automatic preview", { exact: true })
    .selectOption("nearby");
  await page.evaluate(() => window.fixture.flush());
  assert.deepEqual(await page.evaluate(() => window.fixture.search()), disposedSearch);
  assert.match(
    (await page.evaluate(() => window.fixture.legacy())).summary,
    /card follows your pointer/,
  );
  await page.evaluate(() => {
    window.cleanupSearch = window.fixture.render(window.definitions);
  });
  assert.deepEqual(
    await page.evaluate(() => window.fixture.search()),
    await page.evaluate(() => window.fixture.legacy()),
  );
  await page.evaluate(() => window.fixture.tab.hide());
  const hiddenLegacy = await page.evaluate(() => window.fixture.legacy());
  await page
    .locator("#search")
    .getByLabel("Preview content", { exact: true })
    .selectOption("notes");
  await page.evaluate(() => window.fixture.flush());
  assert.deepEqual(await page.evaluate(() => window.fixture.legacy()), hiddenLegacy);
  assert.match(
    (await page.evaluate(() => window.fixture.search())).summary,
    /Only ordinary whole-note/,
  );
  await page.evaluate(() => {
    window.fixture.tab.display();
    window.fixture.tab.display();
  });
  assert.deepEqual(
    await page.evaluate(() => window.fixture.legacy()),
    await page.evaluate(() => window.fixture.search()),
  );
  const beforeUnload = await page.evaluate(() => {
    for (const dispose of window.fixture.unloads) dispose();
    return window.fixture.search();
  });
  await page
    .locator("#legacy")
    .getByLabel("Automatic preview", { exact: true })
    .selectOption("hover");
  await page.evaluate(() => window.fixture.flush());
  assert.deepEqual(await page.evaluate(() => window.fixture.search()), beforeUnload);
  const final = await page.evaluate(() => ({
    saves: window.fixture.saves.length,
    completed: window.fixture.completed(),
    settings: window.fixture.settings,
  }));
  assert.equal(final.saves, 6);
  assert.equal(final.completed, final.saves);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks: 13, modern, final, errors }, null, 2));
} finally {
  await browser.close();
}
