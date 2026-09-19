import { describe, expect, test } from "bun:test";
import { noteExcerpt } from "../../src/preview/excerpt";

describe("bounded ordinary note previews", () => {
  test("preserves Markdown when the complete note fits", () => {
    // Given a short note body after the host removed frontmatter.
    const markdown = "# 제목\n\n본문 **강조**와 ![[그림.png]]\n";

    // When its preview excerpt is prepared.
    const result = noteExcerpt(markdown);

    // Then the complete Markdown remains usable by the host renderer.
    expect(result).toEqual({ markdown, truncated: false });
  });

  test("keeps the complete body when it exactly reaches the bound", () => {
    // Given an exactly 6000-character note.
    const markdown = "가".repeat(6000);

    // When its preview excerpt is prepared.
    const result = noteExcerpt(markdown);

    // Then truncation is not reported for a complete note.
    expect(result).toEqual({ markdown, truncated: false });
  });

  test("ends at a complete paragraph when a long note exceeds the bound", () => {
    // Given a useful complete paragraph followed by a large second paragraph.
    const paragraph = "가".repeat(4200);
    const markdown = `${paragraph}\n\n${"나".repeat(4000)}`;

    // When its preview excerpt is prepared.
    const result = noteExcerpt(markdown);

    // Then the excerpt ends cleanly and tells the UI there is more to read.
    expect(result).toEqual({ markdown: paragraph, truncated: true });
  });

  test("ends at a complete line when no useful paragraph boundary exists", () => {
    // Given a long Markdown list without blank lines.
    const completeLines = `${"- 한글 항목\n".repeat(700)}`;
    const markdown = `${completeLines}${"more".repeat(1000)}`;

    // When its preview excerpt is prepared.
    const result = noteExcerpt(markdown);

    // Then truncation does not cut a list item in half.
    expect(result).toEqual({ markdown: completeLines.trimEnd(), truncated: true });
  });

  test("does not split a surrogate pair when an unbroken paragraph must be cut", () => {
    // Given an emoji crossing the maximum UTF-16 boundary.
    const markdown = `${"가".repeat(5999)}📚${"나".repeat(100)}`;

    // When its preview excerpt is prepared.
    const result = noteExcerpt(markdown);

    // Then the bounded preview contains only complete characters.
    expect(result).toEqual({ markdown: "가".repeat(5999), truncated: true });
  });
});
