import { describe, expect, test } from "bun:test";
import { getPreviewPosition } from "../../src/geometry";
import { rect } from "./fixtures";

describe("preview position", () => {
  test("preserves the original right-side placement when a left-hand term has a tall card", () => {
    const anchor = rect(192, 484, 109, 31);

    const position = getPreviewPosition({
      pointer: { x: 74, y: 521 },
      anchorRects: [anchor],
      cardSize: { width: 390, height: 483 },
      bounds: rect(0, 0, 1536, 1000),
    });

    expect(position).toEqual({ left: 313, top: 26 });
  });

  test.each([
    { name: "top left", anchor: rect(16, 16, 110, 24) },
    { name: "top right", anchor: rect(898, 16, 110, 24) },
    { name: "bottom left", anchor: rect(16, 728, 110, 24) },
    { name: "bottom right", anchor: rect(898, 728, 110, 24) },
  ])("keeps the card visible without covering an anchor at $name", ({ anchor }) => {
    const cardSize = { width: 320, height: 240 };

    const position = getPreviewPosition({
      pointer: { x: anchor.left + 40, y: anchor.bottom },
      anchorRects: [anchor],
      cardSize,
      bounds: rect(0, 0, 1024, 768),
    });

    expect(position.left).toBeGreaterThanOrEqual(16);
    expect(position.top).toBeGreaterThanOrEqual(16);
    expect(position.left + cardSize.width).toBeLessThanOrEqual(1008);
    expect(position.top + cardSize.height).toBeLessThanOrEqual(752);
    expect(
      position.left + cardSize.width <= anchor.left - 12 ||
        position.left >= anchor.right + 12 ||
        position.top + cardSize.height <= anchor.top - 12 ||
        position.top >= anchor.bottom + 12,
    ).toBe(true);
  });

  test("honors a pane's nonzero origin when the pointer is outside the pane", () => {
    const bounds = rect(400, 200, 600, 400);

    const position = getPreviewPosition({
      pointer: { x: 0, y: 900 },
      anchorRects: [],
      cardSize: { width: 200, height: 100 },
      bounds,
    });

    expect(position).toEqual({ left: 416, top: 484 });
  });

  test("reduces margins when a card almost fills a small pane", () => {
    const bounds = rect(300, 120, 200, 100);

    const position = getPreviewPosition({
      pointer: { x: 470, y: 200 },
      anchorRects: [rect(450, 180, 30, 20)],
      cardSize: { width: 190, height: 90 },
      bounds,
    });

    expect(position).toEqual({ left: 305, top: 125 });
  });

  test("pins an oversized card to a tiny pane's origin instead of reversing clamp limits", () => {
    const bounds = rect(300, 120, 20, 10);

    const position = getPreviewPosition({
      pointer: { x: 310, y: 125 },
      anchorRects: [rect(303, 122, 5, 4)],
      cardSize: { width: 390, height: 483 },
      bounds,
    });

    expect(position).toEqual({ left: 300, top: 120 });
  });

  test("returns finite coordinates when a pane has zero area", () => {
    const bounds = rect(400, 200, 0, 0);

    const position = getPreviewPosition({
      pointer: { x: 500, y: 300 },
      anchorRects: [],
      cardSize: { width: 390, height: 483 },
      bounds,
    });

    expect(position).toEqual({ left: 400, top: 200 });
  });

  test("avoids all line boxes when an anchor wraps across lines", () => {
    const anchors = [rect(300, 200, 200, 24), rect(200, 230, 180, 24)];
    const cardSize = { width: 220, height: 180 };

    const position = getPreviewPosition({
      pointer: { x: 250, y: 235 },
      anchorRects: anchors,
      cardSize,
      bounds: rect(0, 0, 1000, 800),
    });

    for (const anchor of anchors) {
      expect(
        position.left + cardSize.width <= anchor.left - 12 ||
          position.left >= anchor.right + 12 ||
          position.top + cardSize.height <= anchor.top - 12 ||
          position.top >= anchor.bottom + 12,
      ).toBe(true);
    }
  });

  test("uses the first zero-score candidate when placements are tied", () => {
    const anchor = rect(480, 380, 40, 40);

    const position = getPreviewPosition({
      pointer: { x: 500, y: 440 },
      anchorRects: [anchor],
      cardSize: { width: 100, height: 80 },
      bounds: rect(0, 0, 1000, 800),
    });

    expect(position).toEqual({ left: 514, top: 452 });
  });

  test("falls back beside the pointer when no anchor rectangles remain", () => {
    const bounds = rect(0, 0, 1000, 800);

    const position = getPreviewPosition({
      pointer: { x: 200, y: 200 },
      anchorRects: [],
      cardSize: { width: 100, height: 80 },
      bounds,
    });

    expect(position).toEqual({ left: 214, top: 212 });
  });
});
