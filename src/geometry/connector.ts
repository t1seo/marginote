// Adapted from library-of-alexandria/src/lib/magazine-term-geometry.ts
// at 8bf504c8aff07daf785194d646d9804a2182d2eb; extended to wrapped anchors.
import { clamp, hasArea } from "./rect";
import type { Connector, Rect } from "./types";

/** The anchor endpoint touches the outline, which extends 3px horizontally and 1px vertically. */
export function getConnector(anchorRects: readonly Rect[], cardRect: Rect): Connector | null {
  const corners = [
    { x: cardRect.left, y: cardRect.top },
    { x: cardRect.right, y: cardRect.top },
    { x: cardRect.left, y: cardRect.bottom },
    { x: cardRect.right, y: cardRect.bottom },
  ];
  let connector: Connector | null = null;
  let shortest = Number.POSITIVE_INFINITY;
  for (const card of corners) {
    for (const rect of anchorRects) {
      if (!hasArea(rect)) continue;
      const anchor = {
        x: clamp(card.x, rect.left - 3, rect.right + 3),
        y: clamp(card.y, rect.top - 1, rect.bottom + 1),
      };
      const distance = Math.hypot(card.x - anchor.x, card.y - anchor.y);
      if (distance < shortest) {
        connector = { anchor, card };
        shortest = distance;
      }
    }
  }
  return connector;
}
