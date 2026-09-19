import { selectionTouchesLink, type TextRange } from "./wiki-links";

export function shouldKeepLinkMark(
  link: TextRange,
  selections: readonly TextRange[],
  held: TextRange | null,
  pointerDown: boolean,
): boolean {
  if (!selectionTouchesLink(link, selections)) return true;
  if (held?.from !== link.from || held.to !== link.to) return false;
  return pointerDown || selections.every((selection) => selection.from === selection.to);
}
