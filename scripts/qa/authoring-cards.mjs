import assert from "node:assert/strict";

export async function verifyCardCreation(driver, scenario) {
  const {
    page,
    run,
    imagePath,
    image,
    setup,
    createModal,
    submit,
    linkedSource,
    disk,
    waitSource,
    waitDisk,
    openSource,
    command,
  } = driver;
  let textFixture;
  let textCard;
  let textMarkdown;
  await scenario("text card collision and duplicate occurrence", async () => {
    textFixture = await setup("text", "같은 문구, 두 번째 같은 문구를 연결합니다.\n", "같은 문구");
    const title = `${run} text`;
    const occupied = `Annotations/${title}.md`;
    await page.evaluate(
      async ({ occupied }) => {
        await app.vault.create(occupied, "Existing file stays intact.\n");
      },
      { occupied },
    );
    await createModal();
    await page.getByLabel("Card title", { exact: true }).fill(title);
    await page
      .getByLabel("Card text", { exact: true })
      .fill("한글 **본문** 📚\n\n독립 작성 텍스트입니다.");
    await submit();
    textCard = `Annotations/${title} (2).md`;
    await waitSource(linkedSource(textFixture, textCard));
    textMarkdown = await disk(textCard);
    assert.match(textMarkdown, /marginote-kind: text/);
    assert.match(textMarkdown, /marginote-id: [\da-f-]{36}/);
    assert.equal(await disk(occupied), "Existing file stays intact.\n");
    await waitDisk(textFixture.path, linkedSource(textFixture, textCard));
    return {
      source: textFixture.path,
      card: textCard,
      occupiedPreserved: true,
      markdown: textMarkdown,
    };
  });
  await scenario("keyboard undo and redo preserve the created card", async () => {
    await page.keyboard.press("Meta+z");
    await waitSource(textFixture.content);
    assert.equal(await disk(textCard), textMarkdown);
    await page.keyboard.press("Meta+Shift+z");
    await waitSource(linkedSource(textFixture, textCard));
    return { cardPreserved: true, undo: true, redo: true };
  });
  await scenario("image-only card and unlink preserve image and card", async () => {
    const fixture = await setup("image", `그림 ${run}을 확인합니다.\n`, `그림 ${run}`);
    await createModal();
    await page.getByLabel("Card type", { exact: true }).selectOption("image");
    await page.getByLabel("Local image path", { exact: true }).fill(imagePath);
    await submit();
    const card = `Annotations/${fixture.selection}.md`;
    await waitSource(linkedSource(fixture, card));
    const markdown = await disk(card);
    assert.match(markdown, /marginote-kind: image/);
    assert.equal(markdown.split("---\n")[2].trim(), `![[${imagePath}]]`);
    await openSource(fixture.path, fixture.selection);
    await command("Marginote: Unlink annotation card at cursor");
    await waitSource(fixture.content);
    assert.equal(await disk(card), markdown);
    assert.equal(await disk(imagePath), image);
    return { source: fixture.path, card, noForcedHeading: true, cardAndImagePreserved: true };
  });
  await scenario("mixed card combines local image and Markdown text", async () => {
    const fixture = await setup("mixed", "혼합 카드의 자료입니다.\n", "혼합 카드");
    const title = `${run} mixed`;
    await createModal();
    await page.getByLabel("Card type", { exact: true }).selectOption("mixed");
    await page.getByLabel("Card title", { exact: true }).fill(title);
    await page.getByLabel("Card text", { exact: true }).fill("혼합 **설명**입니다.");
    await page.getByLabel("Local image path", { exact: true }).fill(imagePath);
    await page.screenshot({ path: ".qa/evidence/authoring-modal.png" });
    await submit();
    const card = `Annotations/${title}.md`;
    await waitSource(linkedSource(fixture, card));
    const markdown = await disk(card);
    assert.match(markdown, /marginote-kind: mixed/);
    assert.ok(markdown.includes(`![[${imagePath}]]\n\n혼합 **설명**입니다.`));
    return { source: fixture.path, card, imageAndText: true };
  });
  return { textFixture, textCard, textMarkdown };
}
