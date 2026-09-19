import { describe, expect, test } from "bun:test";
import { annotationLinkAt } from "../../src/authoring/existing-link";

describe("card edit and unlink targets", () => {
  test("restores the exact Unicode alias for the selected occurrence", () => {
    const content = "same [[Annotations/First|같은 말 📚]] then [[Annotations/Second|같은 말 📚]]";
    const from = content.indexOf("Second");
    const result = annotationLinkAt(content, from, from);
    expect(result).toEqual({
      from: content.lastIndexOf("[["),
      to: content.length,
      target: "Annotations/Second",
      alias: "같은 말 📚",
    });
  });

  test.each([
    "![[Card|alias]]",
    "[[Card#Heading|alias]]",
    "[[Card]]",
    "`[[Card|alias]]`",
    "```\n[[Card|alias]]\n```",
    "---\nvalue: [[Card|alias]]\n---",
    "\\[[Card|alias]]",
  ])("leaves unsupported source syntax intact %#", (content) => {
    const caret = content.indexOf("Card") + 1;
    const result = annotationLinkAt(content, caret, caret);
    expect(result).toBeNull();
  });
});
