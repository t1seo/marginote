// Adapted from library-of-alexandria/src/lib/magazine-term-geometry.ts
// at 8bf504c8aff07daf785194d646d9804a2182d2eb; bounded to the owner pane.
import { clamp, hasArea } from "./rect";
import type { Position, PreviewPositionInput } from "./types";

function boundAxis(value: number, start: number, end: number, cardLength: number): number {
  const available = Math.max(0, end - start - cardLength);
  const margin = Math.min(16, available / 2);
  return clamp(value, start + margin, start + available - margin);
}

/** Bounds are the intersection of the owner viewport and pane, in viewport coordinates. */
export function getPreviewPosition(input: PreviewPositionInput): Position {
  const { pointer, anchorRects, cardSize, bounds } = input;
  const rects = anchorRects.filter(hasArea);
  const [first, ...remaining] = rects;
  const fallback = {
    left: boundAxis(pointer.x + 14, bounds.left, bounds.right, cardSize.width),
    top: boundAxis(pointer.y + 12, bounds.top, bounds.bottom, cardSize.height),
  };
  if (first === undefined) return fallback;

  const anchor = remaining.reduce(
    (union, rect) => ({
      left: Math.min(union.left, rect.left),
      top: Math.min(union.top, rect.top),
      right: Math.max(union.right, rect.right),
      bottom: Math.max(union.bottom, rect.bottom),
    }),
    { left: first.left, top: first.top, right: first.right, bottom: first.bottom },
  );
  const left = pointer.x - cardSize.width - 14;
  const right = pointer.x + 14;
  const xs = [
    ...(pointer.x < (anchor.left + anchor.right) / 2 ? [left, right] : [right, left]),
    anchor.right + 12,
    anchor.left - cardSize.width - 12,
  ];
  const ys = [
    pointer.y + 12,
    pointer.y - cardSize.height - 12,
    anchor.bottom + 12,
    anchor.top - cardSize.height - 12,
  ];
  let position = fallback;
  let lowestScore = Number.POSITIVE_INFINITY;
  for (const y of ys) {
    for (const x of xs) {
      const bounded = {
        left: boundAxis(x, bounds.left, bounds.right, cardSize.width),
        top: boundAxis(y, bounds.top, bounds.bottom, cardSize.height),
      };
      const overlap = rects.reduce((total, rect) => {
        const width = Math.max(
          0,
          Math.min(bounded.left + cardSize.width, rect.right + 12) -
            Math.max(bounded.left, rect.left - 12),
        );
        const height = Math.max(
          0,
          Math.min(bounded.top + cardSize.height, rect.bottom + 12) -
            Math.max(bounded.top, rect.top - 12),
        );
        return total + width * height;
      }, 0);
      const score = overlap * 10 + Math.abs(bounded.left - x) + Math.abs(bounded.top - y);
      if (score < lowestScore) {
        position = bounded;
        lowestScore = score;
      }
    }
  }
  return position;
}
