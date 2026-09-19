import { describe, expect, test } from "bun:test";
import { getConnector } from "../../src/geometry";
import { rect } from "./fixtures";

describe("corner connector", () => {
  test("connects the original tall card to the nearest outlined term edge", () => {
    const anchors = [rect(192, 484, 109, 31)];

    const connector = getConnector(anchors, rect(313, 26, 390, 483));

    expect(connector).toEqual({ anchor: { x: 304, y: 509 }, card: { x: 313, y: 509 } });
  });

  test.each([
    { name: "top left", card: rect(0, 0, 50, 50), end: { x: 50, y: 50 } },
    { name: "top right", card: rect(150, 0, 50, 50), end: { x: 150, y: 50 } },
    { name: "bottom left", card: rect(0, 150, 50, 50), end: { x: 50, y: 150 } },
    { name: "bottom right", card: rect(150, 150, 50, 50), end: { x: 150, y: 150 } },
  ])("uses the nearest card corner when the card is $name of the anchor", ({ card, end }) => {
    const anchors = [rect(80, 80, 40, 40)];

    const connector = getConnector(anchors, card);

    expect(connector?.card).toEqual(end);
  });

  test("connects to an actual line box instead of a wrapped anchor's empty bounding area", () => {
    const anchors = [rect(200, 100, 100, 20), rect(100, 130, 80, 20)];

    const connector = getConnector(anchors, rect(10, 170, 80, 60));

    expect(connector).toEqual({ anchor: { x: 97, y: 151 }, card: { x: 90, y: 170 } });
  });

  test("chooses the first card corner when distances tie", () => {
    const anchors = [rect(90, 100, 120, 20)];

    const connector = getConnector(anchors, rect(100, 150, 100, 80));

    expect(connector).toEqual({ anchor: { x: 100, y: 121 }, card: { x: 100, y: 150 } });
  });

  test("returns no connector when no anchor rectangle remains", () => {
    const connector = getConnector([], rect(100, 150, 100, 80));

    expect(connector).toBeNull();
  });

  test("returns no connector for zero-area anchors", () => {
    const connector = getConnector([rect(100, 100, 0, 20)], rect(100, 150, 100, 80));

    expect(connector).toBeNull();
  });
});
