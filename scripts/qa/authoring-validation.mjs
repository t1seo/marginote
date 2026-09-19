import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function verifyAuthoringValidation(driver, scenario) {
  const {
    page,
    receipt,
    run,
    setup,
    createModal,
    command,
    sourceValue,
    disk,
    waitSource,
    fileCount,
  } = driver;
  await scenario("cancel preserves source and selection", async () => {
    const fixture = await setup("cancel", "취소할 문구를 여기에 둡니다.\n", "취소할 문구");
    const count = await fileCount();
    await createModal();
    await page.getByLabel("Card text", { exact: true }).fill("Discard this draft.");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await waitSource(fixture.content);
    assert.equal(
      await page.evaluate(() => app.workspace.activeEditor.editor.getSelection()),
      fixture.selection,
    );
    assert.equal(await fileCount(), count);
    assert.equal(await disk(fixture.path), fixture.content);
    return { source: fixture.path, selection: fixture.selection, sourceUnchanged: true };
  });
  await scenario("invalid form and missing image preserve source", async () => {
    const fixture = await setup("invalid", "입력 실패를 확인합니다.\n", "입력 실패");
    const count = await fileCount();
    await createModal();
    await page.getByRole("button", { name: "Create card", exact: true }).click();
    await page
      .locator(".marginote-authoring-error")
      .filter({ hasText: "Enter the card's text" })
      .waitFor();
    await page.getByLabel("Card type", { exact: true }).selectOption("image");
    await page
      .getByLabel("Local image path", { exact: true })
      .fill("https://example.invalid/picture.png");
    await page.getByRole("button", { name: "Create card", exact: true }).click();
    await page
      .locator(".marginote-authoring-error")
      .filter({ hasText: "vault image path" })
      .waitFor();
    await page.getByLabel("Local image path", { exact: true }).fill(`${run} missing.png`);
    await page.getByRole("button", { name: "Create card", exact: true }).click();
    await page
      .locator(".marginote-authoring-error")
      .filter({ hasText: "existing image" })
      .waitFor();
    assert.equal(await sourceValue(), fixture.content);
    assert.equal(await fileCount(), count);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    return {
      source: fixture.path,
      rejected: ["empty text", "remote path", "missing local image"],
      sourceUnchanged: true,
    };
  });
  await scenario("code and existing links are rejected", async () => {
    for (const [name, content, selection] of [
      ["code", "Before `코드 문구` after.\n", "코드 문구"],
      ["link", "Before [[Ordinary note|기존 링크]] after.\n", "기존 링크"],
    ]) {
      const fixture = await setup(name, content, selection);
      const count = await fileCount();
      await command("Marginote: Create annotation card from selection");
      await page.locator(".notice").filter({ hasText: "Select plain text" }).last().waitFor();
      assert.equal(await page.locator(".marginote-authoring").count(), 0);
      assert.equal(await sourceValue(), fixture.content);
      assert.equal(await fileCount(), count);
    }
    return { sourceUnchanged: true };
  });
  await scenario("stale source aborts creation", async () => {
    const fixture = await setup("stale", "기존 선택을 보존합니다.\n", "기존 선택");
    const count = await fileCount();
    await createModal();
    await page.getByLabel("Card text", { exact: true }).fill("A valid draft.");
    const external = "External fixture update preserved.\n";
    await writeFile(resolve(receipt.vault, fixture.path), external);
    await waitSource(external);
    await page.getByRole("button", { name: "Create card", exact: true }).click();
    await page
      .locator(".marginote-authoring-error")
      .filter({ hasText: "source or selection changed" })
      .waitFor();
    assert.equal(await sourceValue(), external);
    assert.equal(await fileCount(), count);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    return { source: fixture.path, externalUpdatePreserved: true, createdCards: 0 };
  });
}
