import { describe, expect, test } from "bun:test";
import { CardIdSchema } from "../../src/cards/model";
import { type CardLookup, resolveCard } from "../../src/cards/resolve";

const id = CardIdSchema.parse("1a8f4bf2-c498-4e20-bf1c-33588d8d38b7");
const file = { path: "Notes/카드 이름.md", extension: "md" };

describe("host-resolved annotation references", () => {
  test("uses the host's source-relative resolution and preserves UUID", () => {
    const calls: string[][] = [];
    const lookup: CardLookup<typeof file> = {
      getFirstLinkpathDest: (target, source) => {
        calls.push([target, source]);
        return file;
      },
      getFileCache: () => ({
        frontmatter: { "marginote-card": 1, "marginote-id": id, "marginote-kind": "text" },
      }),
    };
    const result = resolveCard(lookup, "카드 이름", "Notes/Source.md");
    expect(result).toEqual({ file, id, kind: "text" });
    expect(calls).toEqual([["카드 이름", "Notes/Source.md"]]);
  });

  test("keeps normal links unchanged without explicit metadata", () => {
    const lookup: CardLookup<typeof file> = {
      getFirstLinkpathDest: () => file,
      getFileCache: () => ({ frontmatter: { title: "Normal note" } }),
    };
    const result = resolveCard(lookup, "카드 이름", "Source.md");
    expect(result).toBeNull();
  });

  test("falls back when a card has been deleted", () => {
    const lookup: CardLookup<typeof file> = {
      getFirstLinkpathDest: () => null,
      getFileCache: () => null,
    };
    const result = resolveCard(lookup, "카드 이름", "Source.md");
    expect(result).toBeNull();
  });

  test("does not ask the host to resolve fragments", () => {
    const targets: string[] = [];
    const lookup: CardLookup<typeof file> = {
      getFirstLinkpathDest: (target) => {
        targets.push(target);
        return file;
      },
      getFileCache: () => null,
    };
    const result = resolveCard(lookup, "카드 이름#section", "Source.md");
    expect(result).toBeNull();
    expect(targets).toEqual([]);
  });
});
