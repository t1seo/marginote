import { describe, expect, test } from "bun:test";
import { cardLink, wholeNoteLink } from "../../src/cards/links";

describe("plain whole-note wiki links", () => {
  test("preserves Unicode and spaces in a vault path", () => {
    const path = "Annotations/인지적 도제 📚.md";
    const result = cardLink(path, "인지적 도제");
    expect(result).toBe("[[Annotations/인지적 도제 📚|인지적 도제]]");
  });

  test.each(["Annotations/한글 카드", "Annotations/한글 카드.md"])(
    "accepts a whole-note target %s",
    (target) => {
      const result = wholeNoteLink(target);
      expect(result).toBe(target);
    },
  );

  test.each([
    "",
    "![[card]]",
    "[[card]]",
    "card#heading",
    "card#^block",
    "card|alias",
    "https://example.com/card",
    "//example.com/card",
    "file:///card",
    "../card",
    "Annotations/../card",
    "card\nother",
    "card^block",
    "card\\bad",
  ])("leaves unsupported links to the host: %s", (target) => {
    const result = wholeNoteLink(target);
    expect(result).toBeNull();
  });
});
