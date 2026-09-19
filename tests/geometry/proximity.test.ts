import { describe, expect, test } from "bun:test";
import { compareProximity, getProximity } from "../../src/geometry";
import { rect } from "./fixtures";

describe("anchor proximity", () => {
  test("excludes a pointer above an anchor's line", () => {
    const anchors = [rect(100, 100, 80, 20)];

    const proximity = getProximity({ x: 140, y: 99 }, anchors);

    expect(proximity).toBeNull();
  });

  test("includes the top edge of an anchor's line", () => {
    const anchors = [rect(100, 100, 80, 20)];

    const proximity = getProximity({ x: 140, y: 100 }, anchors);

    expect(proximity).toEqual({ verticalDistance: 0, distance: 0 });
  });

  test("includes a pointer exactly 300 pixels below an anchor", () => {
    const anchors = [rect(100, 100, 80, 20)];

    const proximity = getProximity({ x: 140, y: 420 }, anchors);

    expect(proximity).toEqual({ verticalDistance: 300, distance: 300 });
  });

  test("excludes a pointer outside the circular 300-pixel reading zone", () => {
    const anchors = [rect(100, 100, 80, 20)];

    const proximity = getProximity({ x: 181, y: 420 }, anchors);

    expect(proximity).toBeNull();
  });

  test("uses the closest eligible line when an anchor wraps", () => {
    const anchors = [rect(100, 100, 180, 20), rect(100, 130, 80, 20)];

    const proximity = getProximity({ x: 185, y: 155 }, anchors);

    expect(proximity).toEqual({ verticalDistance: 5, distance: Math.hypot(5, 5) });
  });

  test("ignores hidden zero-area anchor rectangles", () => {
    const anchors = [rect(100, 100, 0, 20), rect(100, 100, 80, 0)];

    const proximity = getProximity({ x: 100, y: 100 }, anchors);

    expect(proximity).toBeNull();
  });

  test("has no candidate when no anchor rectangles remain", () => {
    const proximity = getProximity({ x: 100, y: 100 }, []);

    expect(proximity).toBeNull();
  });

  test("prefers vertical distance over straight-line distance between candidates", () => {
    const sameLine = { verticalDistance: 0, distance: 200 };
    const belowLine = { verticalDistance: 10, distance: 10 };

    const comparison = compareProximity(sameLine, belowLine);

    expect(comparison).toBeLessThan(0);
  });

  test("prefers straight-line distance when vertical distance is tied", () => {
    const near = { verticalDistance: 10, distance: 20 };
    const far = { verticalDistance: 10, distance: 30 };

    const comparison = compareProximity(near, far);

    expect(comparison).toBeLessThan(0);
  });

  test("preserves caller order when candidate distances tie completely", () => {
    const first = { verticalDistance: 10, distance: 20 };
    const second = { verticalDistance: 10, distance: 20 };

    const comparison = compareProximity(first, second);

    expect(comparison).toBe(0);
  });
});
