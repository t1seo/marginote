import { describe, expect, test } from "bun:test";
import { selectionError } from "../../src/authoring/selection";

describe("plain-text authoring selections", () => {
  test("accepts Unicode text beside an existing link", () => {
    const content = "기존 [[Other|표시]] 뒤에 인지적 도제 📚가 있습니다.";
    const from = content.indexOf("인지적");
    const result = selectionError(content, from, from + "인지적 도제 📚".length);
    expect(result).toBeNull();
  });

  test.each([
    "before [[Card|selected]] after",
    "before ![[selected]] after",
    "before [selected](target) after",
    "before [a [nested] selected](target) after",
    "before [label](selected) after",
    "before `selected` after",
    "before ``selected ` code`` after",
    "before `multi\nselected\ncode` after",
    "```markdown\nselected\n```",
    "~~~markdown\nselected\n~~~",
    "---\ntitle: selected\n---\nProse",
    "---\ntitle: selected",
    "    selected",
    "\tselected",
    "<!--\nselected\n-->",
    "%%\nselected\n%%",
    "<span>selected</span>",
    "[reference]: selected",
    "$$\nselected\n$$",
    "$multi\nselected\nline$",
    "https://selected.example/path",
  ])("rejects protected Markdown context %#", (content) => {
    const from = content.indexOf("selected");
    const result = selectionError(content, from, from + "selected".length);
    expect(result).not.toBeNull();
  });

  test.each(["", "  ", "one\n\ntwo", "one\ntwo", "a|b", "[nested]", "`code`", "**bold**"])(
    "rejects a selection that cannot be a plain wiki alias %#",
    (content) => {
      const result = selectionError(content, 0, content.length);
      expect(result).not.toBeNull();
    },
  );

  test("accepts prose following closed YAML and fenced code", () => {
    const content = "---\ntitle: Example\n---\n\n```\ncode\n```\n\nselected text";
    const from = content.indexOf("selected");
    const result = selectionError(content, from, from + 8);
    expect(result).toBeNull();
  });
});
