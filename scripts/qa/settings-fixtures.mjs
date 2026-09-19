import { createHash } from "node:crypto";

export async function prepareSettingsFixtures(page, run) {
  const paths = {
    source: `${run} Source.md`,
    ordinary: `${run} Ordinary.md`,
    long: `${run} Long.md`,
    empty: `${run} Empty.md`,
    media: `${run} Media.md`,
  };
  const yamlSentinel = `${run}-hidden-frontmatter`;
  const tailSentinel = `${run}-beyond-preview`;
  const paragraph = "가".repeat(4200);
  const fixtures = {
    [paths.source]: `# Marginote settings QA\n\n[[Annotations/Text|Annotation fixture]]\n\n${Object.entries(
      paths,
    )
      .filter(([name]) => name !== "source")
      .map(([name, path]) => `[[${path.slice(0, -3)}|${name} note fixture]]`)
      .join("\n\n")}\n`,
    [paths.ordinary]: `---\nqa-private-property: ${yamlSentinel}\n---\n# Ordinary fixture\n\nA normal local Markdown note, with **formatted text**.\n`,
    [paths.long]: `---\nqa-private-property: ${yamlSentinel}\n---\n# Long fixture\n\n${paragraph}\n\n${"나".repeat(4200)}\n\n${tailSentinel}\n`,
    [paths.empty]: "",
    [paths.media]: `# Local preview media\n\n![Remote diagram](https://marginote-qa.invalid/remote.png)\n\n<img src="https://marginote-qa.invalid/html.png" alt="remote HTML">\n\n![[https://marginote-qa.invalid/wiki.png]]\n\n![unfinished](https://marginote-qa.invalid/incomplete.png\n\n\`\`\`md\n![Sample](https://marginote-qa.invalid/code.png)\n\`\`\`\n\n![[${run} Missing image.png]]\n`,
  };
  await page.evaluate(async (contents) => {
    for (const [path, content] of Object.entries(contents)) {
      await app.vault.create(path, content);
    }
  }, fixtures);
  await page.waitForFunction(
    (files) => files.every((path) => Boolean(app.vault.getAbstractFileByPath(path))),
    Object.values(paths),
  );
  return { paths, fixtures, yamlSentinel, tailSentinel, paragraph };
}

export async function readFixtureContents(page, paths) {
  return page.evaluate(async (files) => {
    const contents = {};
    for (const path of files) {
      const file = app.vault.getAbstractFileByPath(path);
      if (!file) throw new Error(`QA fixture disappeared: ${path}`);
      contents[path] = await app.vault.read(file);
    }
    return contents;
  }, paths);
}

export function fixtureHashes(contents) {
  return Object.fromEntries(
    Object.entries(contents).map(([path, content]) => [
      path,
      createHash("sha256").update(content).digest("hex"),
    ]),
  );
}
