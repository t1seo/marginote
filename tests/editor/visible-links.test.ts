import { describe, expect, test } from "bun:test";
import { EditorState, Text } from "@codemirror/state";
import { findVisibleWikiLinks } from "../../src/editor/visible-links";

describe("Live Preview visible document ranges", () => {
  test("finds both visible segments of a folded line once without decorating the gap", () => {
    const doc = Text.of(["[[one]] gap [[hidden]] gap [[two]]"]);
    const links = findVisibleWikiLinks(doc, [
      { from: 0, to: 8 },
      { from: 26, to: doc.length },
    ]);
    expect(links.map((link) => link.linktext)).toEqual(["one", "two"]);
  });

  test("includes a link whose display starts before the visible segment", () => {
    const doc = Text.of(["before [[Card|long wrapped alias]] after"]);
    expect(findVisibleWikiLinks(doc, [{ from: 20, to: 25 }]).map((link) => link.linktext)).toEqual([
      "Card",
    ]);
  });

  test("keeps offscreen lines and exact non-overlapping boundaries out", () => {
    const doc = Text.of(["[[one]]", "nothing", "[[three]]"]);
    expect(findVisibleWikiLinks(doc, [{ from: 8, to: 15 }])).toEqual([]);
  });

  test("uses updated source positions after Korean or emoji insertion and undo", () => {
    const initial = EditorState.create({ doc: "start [[Card|한글]] end" });
    const change = initial.update({ changes: { from: 0, insert: "🙂 조합 " } });
    const after = findVisibleWikiLinks(change.state.doc, [
      { from: 0, to: change.state.doc.length },
    ]);
    expect(after[0]?.from).toBe(12);
    expect(after[0]?.labelFrom).toBe(19);
    const restored = change.state.update({ changes: change.changes.invert(initial.doc) });
    expect(
      findVisibleWikiLinks(restored.state.doc, [{ from: 0, to: restored.state.doc.length }]),
    ).toEqual(findVisibleWikiLinks(initial.doc, [{ from: 0, to: initial.doc.length }]));
  });
});
