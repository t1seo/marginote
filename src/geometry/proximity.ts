// Adapted from library-of-alexandria/src/lib/magazine-term-geometry.ts
// at 8bf504c8aff07daf785194d646d9804a2182d2eb; extended to wrapped anchors.
import { hasArea } from "./rect";
import type { Point, Proximity, Rect } from "./types";

export function compareProximity(left: Proximity, right: Proximity): number {
  return left.verticalDistance - right.verticalDistance || left.distance - right.distance;
}

/** Callers supply visible line boxes in the owner window's viewport coordinates. */
export function getProximity(pointer: Point, rects: readonly Rect[]): Proximity | null {
  let nearest: Proximity | null = null;
  for (const rect of rects) {
    if (!hasArea(rect) || pointer.y < rect.top) continue;
    const verticalDistance = Math.max(0, pointer.y - rect.bottom);
    const distance = Math.hypot(
      Math.max(rect.left - pointer.x, 0, pointer.x - rect.right),
      verticalDistance,
    );
    if (distance > 300) continue;
    const candidate = { verticalDistance, distance };
    if (nearest === null || compareProximity(candidate, nearest) < 0) nearest = candidate;
  }
  return nearest;
}
