import { describe, expect, test } from "bun:test";
import { createAndLink, type SelectionState } from "../../src/authoring/creation";

const snapshot: SelectionState = {
  content: "first same, second same",
  sourcePath: "Source.md",
  from: 19,
  to: 23,
  selectionCount: 1,
};

describe("selection-preserving card creation", () => {
  test("replaces only the selected occurrence in one editor operation", async () => {
    const replacements: readonly [number, number, string][] = [];
    const changes = [...replacements];
    const target = {
      getState: () => snapshot,
      replace: (from: number, to: number, value: string) => {
        changes.push([from, to, value]);
      },
    };
    const result = await createAndLink(
      snapshot,
      target,
      () => Promise.resolve("Annotations/Card.md"),
      () => true,
    );
    expect(result).toEqual({ kind: "linked", path: "Annotations/Card.md" });
    expect(changes).toEqual([[19, 23, "[[Annotations/Card|same]]"]]);
  });

  test.each([
    { ...snapshot, content: "changed" },
    { ...snapshot, sourcePath: "Other.md" },
    { ...snapshot, from: 0, to: 5 },
    { ...snapshot, selectionCount: 2 },
  ])("does not create or edit after the editor state changed %#", async (current) => {
    let created = 0;
    let edits = 0;
    const target = {
      getState: () => current,
      replace: () => {
        edits += 1;
      },
    };
    const result = await createAndLink(
      snapshot,
      target,
      async () => {
        created += 1;
        return "card.md";
      },
      () => true,
    );
    expect(result).toEqual({ kind: "stale" });
    expect([created, edits]).toEqual([0, 0]);
  });

  test("keeps the source intact when cancelled while saving", async () => {
    let open = true;
    let edits = 0;
    const target = {
      getState: () => snapshot,
      replace: () => {
        edits += 1;
      },
    };
    const result = await createAndLink(
      snapshot,
      target,
      async () => {
        open = false;
        return "card.md";
      },
      () => open,
    );
    expect(result).toEqual({ kind: "saved", path: "card.md" });
    expect(edits).toBe(0);
  });

  test("keeps the source intact when it changes during a write", async () => {
    let current = snapshot;
    let edits = 0;
    const target = {
      getState: () => current,
      replace: () => {
        edits += 1;
      },
    };
    const result = await createAndLink(
      snapshot,
      target,
      async () => {
        current = { ...snapshot, content: "new text" };
        return "card.md";
      },
      () => true,
    );
    expect(result).toEqual({ kind: "saved", path: "card.md" });
    expect(edits).toBe(0);
  });

  test("preserves the source when card creation fails", async () => {
    const failure = new Error("Disk failure");
    let edits = 0;
    const target = {
      getState: () => snapshot,
      replace: () => {
        edits += 1;
      },
    };
    const result = createAndLink(
      snapshot,
      target,
      () => Promise.reject(failure),
      () => true,
    );
    await expect(result).rejects.toBe(failure);
    expect(edits).toBe(0);
  });
});
