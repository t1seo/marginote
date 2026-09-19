import assert from "node:assert/strict";

export async function assertEnglishSurface(page) {
  const visible = await page.locator("body").innerText();
  assert.ok(
    !/[\u3131-\u318e\uac00-\ud7a3]/u.test(visible),
    "The recorded surface contains Korean text.",
  );
  assert.ok(
    !/Demo-\d{10,}/u.test(visible),
    "Timestamped fixture names must not appear in the recording.",
  );
}

export async function verifyEnglishHost(page) {
  await page.evaluate(() => {
    app.setting.open();
    app.setting.openTabById("about");
  });
  const general = await page.locator(".vertical-tab-content").innerText();
  const version = general.match(/\bVersion (\d+\.\d+\.\d+)\b/u)?.[1];
  assert.ok(version, "The installed app must show its version in General settings.");
  const language = await page
    .locator(".setting-item")
    .filter({ hasText: "Change the display language." })
    .locator("select")
    .evaluate((select) => select.selectedOptions[0].textContent);
  assert.equal(language, "English");
  await page.evaluate(() => {
    app.setting.openTabById("marginote");
  });
  for (const label of ["General", "Core plugins", "Community plugins"]) {
    await page
      .locator(".vertical-tab-nav-item")
      .filter({ hasText: new RegExp(`^${label}$`, "u") })
      .waitFor();
  }
  await assertEnglishSurface(page);
  const versions = await page.evaluate(() => ({
    plugin: app.plugins.plugins.marginote.manifest.version,
    electron: process.versions.electron,
    chromium: process.versions.chrome,
    node: process.versions.node,
  }));
  await page.keyboard.press("Escape");
  await page.locator(".modal-container").waitFor({ state: "hidden" });
  return {
    selectedHostLanguage: language,
    verifiedHostLabels: ["General", "Core plugins", "Community plugins"],
    versions: { obsidian: version, ...versions },
  };
}
