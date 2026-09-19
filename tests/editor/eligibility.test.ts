import { describe, expect, test } from "bun:test";
import { shouldKeepLinkMark } from "../../src/editor/eligibility";

describe("Live Preview pointer and edit eligibility", () => {
  const link = { from: 10, to: 30 };

  test("leaves a link editable when the keyboard caret is inside", () => {
    expect(shouldKeepLinkMark(link, [{ from: 15, to: 15 }], null, false)).toBe(false);
    expect(shouldKeepLinkMark(link, [{ from: 4, to: 4 }], null, false)).toBe(true);
  });

  test("keeps only the pressed link available for the subsequent click", () => {
    expect(shouldKeepLinkMark(link, [{ from: 15, to: 15 }], link, true)).toBe(true);
    expect(shouldKeepLinkMark(link, [{ from: 15, to: 15 }], link, false)).toBe(true);
    expect(shouldKeepLinkMark(link, [{ from: 15, to: 15 }], { from: 40, to: 50 }, true)).toBe(
      false,
    );
  });

  test("does not change the pressed span during a drag and releases it after selection", () => {
    const selection = [{ from: 5, to: 25 }];
    expect(shouldKeepLinkMark(link, selection, link, true)).toBe(true);
    expect(shouldKeepLinkMark(link, selection, link, false)).toBe(false);
  });

  test("preserves an unrelated secondary selection even when the primary caret is held", () => {
    expect(
      shouldKeepLinkMark(
        link,
        [
          { from: 15, to: 15 },
          { from: 16, to: 28 },
        ],
        link,
        false,
      ),
    ).toBe(false);
  });
});
