import type { Rect } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function hasArea(rect: Rect): boolean {
  return rect.width > 0 && rect.height > 0;
}
