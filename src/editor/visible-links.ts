import type { Line, Text } from "@codemirror/state";
import { findWikiLinks, type TextRange, type WikiLinkRange } from "./wiki-links";

export function findVisibleWikiLinks(
  doc: Text,
  visibleRanges: readonly TextRange[],
): readonly WikiLinkRange[] {
  const lines = new Map<number, Line>();
  for (const visible of visibleRanges) {
    let line = doc.lineAt(visible.from);
    while (line.from <= visible.to) {
      lines.set(line.number, line);
      if (line.number === doc.lines) break;
      line = doc.line(line.number + 1);
    }
  }
  return [...lines.values()]
    .sort((left, right) => left.from - right.from)
    .flatMap((line) => findWikiLinks(line.text, line.from))
    .filter((link) =>
      visibleRanges.some((visible) => link.to > visible.from && link.from < visible.to),
    );
}
