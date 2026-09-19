import { describe, expect, test } from "bun:test";
import { prepareCardMarkdown, previewDuration } from "../../src/ui/content";

describe("card media boundary", () => {
  test("keeps local wiki images when the vault resolves an image file", () => {
    const markdown = "설명\n![[Attachments/그림 🖼.svg|320]]";
    const result = prepareCardMarkdown(markdown, (path) => path === "Attachments/그림 🖼.svg");
    expect(result).toBe(markdown);
  });

  test("makes remote and reference images explicit links instead of loading them", () => {
    const markdown =
      "![photo](https://example.org/photo.png)\n![diagram][figure]\n[figure]: https://example.org/a.png";
    const result = prepareCardMarkdown(markdown, () => false);
    expect(result).toBe(
      "\\![photo](https://example.org/photo.png)\n\\![diagram][figure]\n[figure]: https://example.org/a.png",
    );
  });

  test("escapes raw HTML before the host renderer can create media elements", () => {
    const result = prepareCardMarkdown('<img src="https://example.org/photo.png">', () => false);
    expect(result).toBe('&lt;img src="https://example.org/photo.png">');
  });

  test("shows an understandable fallback for missing files and non-image embeds", () => {
    const result = prepareCardMarkdown("![[missing.png]]\n![[some-note]]", () => false);
    expect(result).toContain("Image unavailable: missing.png");
    expect(result).not.toContain("![[");
  });

  test("preserves code examples verbatim without enabling their media", () => {
    const markdown = '`![demo](https://example.org/a.png)`\n```html\n<img src="demo">\n```';
    const result = prepareCardMarkdown(markdown, () => false);
    expect(result).toBe(markdown);
  });

  test("transforms media when backticks in fence info make the opening invalid", () => {
    const markdown = '```text `sample\n<img src="fixture.png">\n![sample](fixture.png)\n```';

    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toBe(
      '```text `sample\n&lt;img src="fixture.png">\n\\![sample](fixture.png)\n```',
    );
  });

  test("does not treat backticks across separate paragraphs as one code span", () => {
    const markdown = '`sample\n\n<img src="fixture.png">\n`';

    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toBe('`sample\n\n&lt;img src="fixture.png">\n`');
  });

  test("transforms media following an earlier closing fence", () => {
    const markdown = '```text\nexample\n````\n<img src="fixture.png">\n```';

    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toBe('```text\nexample\n````\n&lt;img src="fixture.png">\n```');
  });

  test.each([
    '~~~html\n<img src="fixture.png">\n~~~',
    '````html\n<img src="fixture.png">\n```\nmore code\n````',
    '```html\n<img src="fixture.png">',
    '   ~~~html\n   <img src="fixture.png">\n   ~~~',
    '```html\r\n<img src="fixture.png">\r\n```',
    '``<img src="fixture.png"> and `tick` ``',
    '\\\\`<img src="fixture.png">`',
  ])("preserves a valid fenced or inline code sample: %s", (markdown) => {
    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toBe(markdown);
  });

  test("stops exempting an indented fence when a line exits its possible container", () => {
    const markdown = '- Example\n  ```html\n  sample\n\n<img src="fixture.png">\n  ```';

    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toContain('&lt;img src="fixture.png">');
  });

  test("preserves escaped media punctuation as literal text", () => {
    const markdown = '\\![sample](fixture.png) and \\<img src="fixture.png">';

    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toBe(markdown);
  });

  test("does not accept URI-like wiki targets even if the resolver accepts the string", () => {
    const markdown = "![[sample:fixture.png]]";

    const result = prepareCardMarkdown(markdown, () => true);

    expect(result).toBe("Image unavailable: sample:fixture.png");
  });

  test("rejects wiki aliases that contain media markup", () => {
    const markdown = '![[fixture.png|<img src="another.png">]]';

    const result = prepareCardMarkdown(markdown, (path) => path === "fixture.png");

    expect(result).toBe("Image unavailable: fixture.png");
  });

  test("escapes Markdown image markers inside other image labels", () => {
    const markdown = "![outer ![inner](fixture.png)](another.png)";

    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toBe("\\![outer \\![inner](fixture.png)](another.png)");
  });

  test.each([
    { markdown: "!![sample](fixture.png)", expected: "!\\![sample](fixture.png)" },
    { markdown: "!!![sample](fixture.png)", expected: "!!\\![sample](fixture.png)" },
    { markdown: "!!!!!!!![sample](fixture.png)", expected: "!!!!!!!\\![sample](fixture.png)" },
  ])("retains a literal boundary after repeated prefixes: $markdown", ({ markdown, expected }) => {
    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toBe(expected);
  });

  test("keeps repeated prefixes literal inside a nested label", () => {
    const markdown = "!![outer !![inner](fixture.png)](another.png)";

    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toBe("!\\![outer !\\![inner](fixture.png)](another.png)");
  });

  test("handles each following image without rebuilding a marker at the previous boundary", () => {
    const markdown = "!![first](fixture.png)![second](another.png)";

    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toBe("!\\![first](fixture.png)\\![second](another.png)");
  });

  test("retains the local wiki image before converting the next Markdown image", () => {
    const markdown = "!![[fixture.png]]![second](another.png)";

    const result = prepareCardMarkdown(markdown, (path) => path === "fixture.png");

    expect(result).toBe("!![[fixture.png]]\\![second](another.png)");
  });

  test("keeps escaped prefixes and code examples unchanged beside a converted image", () => {
    const markdown = "\\![literal](fixture.png) `!![code](fixture.png)` !![sample](another.png)";

    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toBe(
      "\\![literal](fixture.png) `!![code](fixture.png)` !\\![sample](another.png)",
    );
  });

  test("retains the literal boundary when repeated prefixes precede a reference image", () => {
    const markdown = "!![sample][figure]\n[figure]: fixture.png";

    const result = prepareCardMarkdown(markdown, () => false);

    expect(result).toBe("!\\![sample][figure]\n[figure]: fixture.png");
  });
});

describe("reading time", () => {
  test.each([
    [10, 10000],
    [200, 10000],
    [201, 15000],
    [401, 20000],
  ])("allows reading %i characters for %i ms", (length, duration) => {
    const result = previewDuration("가".repeat(length));
    expect(result).toBe(duration);
  });
});
