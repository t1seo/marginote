import assert from "node:assert/strict";
import { openNote, preferences, readingLink } from "./preview-driver.mjs";

async function settingsValues(page) {
  await page.evaluate(() => {
    app.setting.open();
    app.setting.openTabById("marginote");
  });
  return {
    source: await page.getByLabel("Preview content", { exact: true }).inputValue(),
    trigger: await page.getByLabel("Automatic preview", { exact: true }).inputValue(),
    summary: await page.locator(".marginote-settings-summary").innerText(),
    dropdowns: await page.locator(".vertical-tab-content:visible select").count(),
  };
}

export async function verifySettingsPreferences(page, fixture, scenario) {
  await scenario("all nine preference pairs save and update existing source bindings", async () => {
    const pairs = [];
    await openNote(page, fixture.paths.source);
    for (const source of ["cards", "notes", "both"]) {
      for (const trigger of ["hover", "click", "nearby"]) {
        await page.mouse.move(20, 20);
        await preferences(page, source, trigger);
        const card = readingLink(page, "Annotations/Text");
        const note = readingLink(page, fixture.paths.ordinary.slice(0, -3));
        await page.waitForFunction(
          ({ cardEnabled, noteEnabled, notePath }) => {
            const card = document.querySelector('a[data-href="Annotations/Text"]');
            const note = document.querySelector(`a[data-href="${notePath}"]`);
            return (
              card?.classList.contains("marginote-anchor") === cardEnabled &&
              note?.classList.contains("marginote-anchor") === noteEnabled
            );
          },
          {
            cardEnabled: source !== "notes",
            noteEnabled: source !== "cards",
            notePath: fixture.paths.ordinary.slice(0, -3),
          },
        );
        const values = await settingsValues(page);
        assert.equal(values.source, source);
        assert.equal(values.trigger, trigger);
        assert.equal(values.dropdowns, 2);
        assert.ok(values.summary.length > 25);
        if (trigger === "click") assert.match(values.summary, /Click, tap or use Enter\/Space/);
        pairs.push({
          ...values,
          cardClass: await card.getAttribute("class"),
          noteClass: await note.getAttribute("class"),
        });
        await page.keyboard.press("Escape");
        await page.locator(".modal-container").waitFor({ state: "hidden" });
      }
    }
    return { pairs };
  });

  await scenario(
    "choices made through dropdowns persist across plugin disable and enable",
    async () => {
      await preferences(page, "notes", "click");
      await page.evaluate(async () => {
        await app.plugins.disablePlugin("marginote");
        await app.plugins.enablePlugin("marginote");
      });
      await page.waitForFunction(() => Boolean(app.plugins.plugins.marginote));
      const values = await settingsValues(page);
      assert.equal(values.source, "notes");
      assert.equal(values.trigger, "click");
      await page.screenshot({ path: ".qa/evidence/settings.png", scale: "css" });
      await page.keyboard.press("Escape");
      await openNote(page, "Ordinary note.md");
      await openNote(page, fixture.paths.source);
      const note = readingLink(page, fixture.paths.ordinary.slice(0, -3));
      assert.match(await note.getAttribute("class"), /marginote-anchor/);
      assert.doesNotMatch(
        await readingLink(page, "Annotations/Text").getAttribute("class"),
        /marginote-anchor/,
      );
      return { values };
    },
  );
}
