import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sample = join(root, "examples/reading-vault/Marginote Demo");

export async function loadSample() {
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      assert.ok(!entry.isSymbolicLink(), "Sample files must not use symbolic links.");
      if (entry.isDirectory()) await visit(path);
      else {
        const content = await readFile(path, "utf8");
        assert.ok(
          !/[\u3131-\u318e\uac00-\ud7a3]/u.test(path + content),
          "Sample presentation must not contain Korean text.",
        );
        files.push({ path: relative(sample, path), content });
      }
    }
  }
  await visit(sample);
  const reading = files.find((file) => file.path === "Read without losing your place.md");
  assert.ok(reading);
  const paragraphs = reading.content.split(/\n\n+/u).filter((paragraph) => paragraph.length > 180);
  assert.ok(paragraphs.length >= 8, "The sample needs varied passages for real scrolling.");
  assert.equal(
    new Set(paragraphs).size,
    paragraphs.length,
    "Scrolling paragraphs must not repeat.",
  );
  assert.ok(!/^\d+\. /mu.test(reading.content), "The reading sample must not use numbered filler.");
  for (const kind of ["text", "image", "mixed"]) {
    assert.equal(
      files.filter((file) => file.content.includes(`marginote-kind: ${kind}`)).length,
      1,
    );
  }
  const existing = new Set(files.map((file) => file.path.replace(/\.md$/u, "")));
  for (const file of files) {
    for (const link of file.content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/gu)) {
      assert.ok(existing.has(link[1].replace(/^Marginote Demo\//u, "")), `Unresolved ${link[1]}`);
    }
  }
  return files;
}

export async function createDemoFixture(page) {
  const files = await loadSample();
  const folder = await page.evaluate(() => {
    let name = "Marginote Demo";
    for (let suffix = 2; app.vault.getAbstractFileByPath(name); suffix += 1) {
      name = `Marginote Demo ${suffix}`;
    }
    return name;
  });
  const copied = files.map((file) => ({
    path: `${folder}/${file.path}`,
    content: file.content
      .replaceAll("Marginote Demo/", `${folder}/`)
      .replace(/^marginote-id: .+$/mu, `marginote-id: ${randomUUID()}`),
  }));
  await page.evaluate(
    async ({ folder, files }) => {
      await app.vault.createFolder(folder);
      await app.vault.createFolder(`${folder}/Cards`);
      await app.vault.createFolder(`${folder}/Images`);
      for (const file of files) await app.vault.create(file.path, file.content);
    },
    { folder, files: copied },
  );
  const paths = {
    folder,
    source: `${folder}/Read without losing your place.md`,
    text: `${folder}/Cards/Learning by watching`,
    image: `${folder}/Cards/A simple diagram`,
    mixed: `${folder}/Cards/An illustrated note`,
    note: `${folder}/Reading journal`,
  };
  await page.waitForFunction(
    (paths) =>
      [paths.text, paths.image, paths.mixed].every((path) => {
        const file = app.metadataCache.getFirstLinkpathDest(path, paths.source);
        return file && app.metadataCache.getFileCache(file)?.frontmatter?.["marginote-card"] === 1;
      }) && app.metadataCache.getFirstLinkpathDest(paths.note, paths.source),
    paths,
  );
  return paths;
}
