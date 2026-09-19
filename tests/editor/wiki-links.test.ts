import { describe, expect, test } from "bun:test";
import {
  findWikiLinks,
  selectionTouchesLink,
  syntaxAllowsWikiLink,
} from "../../src/editor/wiki-links";

describe("Live Preview wiki link boundaries", () => {
  test("keeps UTF-16 positions, aliases and duplicate labels tied to targets", () => {
    const text = "🙂 [[Annotations/한 글|동일 문구]] 와 [[두 번째|동일 문구]]";
    const links = findWikiLinks(text, 17);
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.linktext)).toEqual(["Annotations/한 글", "두 번째"]);
    for (const link of links) {
      expect(text.slice(link.labelFrom - 17, link.labelTo - 17)).toBe("동일 문구");
      expect(text.slice(link.from - 17, link.to - 17)).toStartWith("[[");
    }
  });

  test("uses the target as the display range for an unaliased link", () => {
    expect(findWikiLinks("앞 [[Card note]] 뒤")).toEqual([
      { from: 2, to: 15, labelFrom: 4, labelTo: 13, linktext: "Card note" },
    ]);
  });

  test.each([
    "![[image.png]]",
    "\\[[Card]]",
    "[[Card#Heading|heading]]",
    "[[Card#^block|block]]",
    "[[|empty target]]",
    "[[Card|]]",
    "[[Card|one|two]]",
    "[[Card\nname]]",
    "[[[nested]]]]",
    "[[Card]broken]]",
    "[[unfinished",
    "[[Card\u0000name]]",
  ])("does not decorate unsupported or malformed syntax: %s", (text) => {
    expect(findWikiLinks(text)).toEqual([]);
  });

  test("an escaped backslash does not escape the following link", () => {
    expect(findWikiLinks("\\\\[[Card]]")).toHaveLength(1);
  });

  test("continues after malformed links without assigning their text to later links", () => {
    expect(findWikiLinks("[[bad [nested]] [[good|표시]]").map((link) => link.linktext)).toEqual([
      "good",
    ]);
  });

  test("requires host internal-link syntax and excludes protected contexts", () => {
    expect(syntaxAllowsWikiLink(["Document", "hmd-internal-link"])).toBe(true);
    expect(syntaxAllowsWikiLink(["Document", "hmd-internal-link_alias"])).toBe(true);
    expect(syntaxAllowsWikiLink(["Document", "list-1", "hmd-internal-link"])).toBe(true);
    expect(syntaxAllowsWikiLink(["Document", "Paragraph"])).toBe(false);
    for (const context of ["InlineCode", "FencedCode", "hmd-frontmatter", "comment", "HtmlBlock"]) {
      expect(syntaxAllowsWikiLink(["Document", context, "hmd-internal-link"])).toBe(false);
    }
  });

  test("preserves carets, ranged selections and all multi-cursor edit ranges", () => {
    const link = { from: 10, to: 25 };
    for (const selection of [
      { from: 10, to: 10 },
      { from: 18, to: 18 },
      { from: 25, to: 25 },
      { from: 5, to: 12 },
      { from: 20, to: 30 },
      { from: 0, to: 40 },
    ]) {
      expect(selectionTouchesLink(link, [selection])).toBe(true);
    }
    expect(
      selectionTouchesLink(link, [
        { from: 0, to: 9 },
        { from: 26, to: 30 },
      ]),
    ).toBe(false);
    expect(
      selectionTouchesLink(link, [
        { from: 0, to: 0 },
        { from: 12, to: 12 },
      ]),
    ).toBe(true);
  });
});
