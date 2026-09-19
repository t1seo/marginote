import { describe, expect, test } from "bun:test";
import { CardIdSchema } from "../../src/cards/model";
import type { CardLookup } from "../../src/cards/resolve";
import { resolvePreview } from "../../src/preview/resolve";

const id = CardIdSchema.parse("1a8f4bf2-c498-4e20-bf1c-33588d8d38b7");
const cardMetadata = {
  "marginote-card": 1,
  "marginote-id": id,
  "marginote-kind": "text",
} as const;
const file = { path: "Notes/노트 이름.md", extension: "md" };

function hostLookup(frontmatter: unknown): CardLookup<typeof file> {
  return {
    getFirstLinkpathDest: () => file,
    getFileCache: () => ({ frontmatter }),
  };
}

describe("preview content selection", () => {
  test.each([
    { source: "cards", expected: { file, id, kind: "text" } },
    { source: "notes", expected: null },
    { source: "both", expected: { file, id, kind: "text" } },
  ] as const)("selects marked cards when source is $source", ({ source, expected }) => {
    // Given a host-resolved, explicitly marked annotation card.
    const lookup = hostLookup(cardMetadata);

    // When the user-selected source is applied.
    const result = resolvePreview(lookup, "노트 이름", "Notes/Source.md", source);

    // Then annotation cards never appear as ordinary note previews.
    expect(result).toEqual(expected);
  });

  test.each([
    { source: "cards", expected: null },
    { source: "notes", expected: { file, kind: "note" } },
    { source: "both", expected: { file, kind: "note" } },
  ] as const)("selects ordinary notes when source is $source", ({ source, expected }) => {
    // Given a normal note whose frontmatter does not opt into cards.
    const lookup = hostLookup({ title: "Ordinary note" });

    // When the user-selected source is applied.
    const result = resolvePreview(lookup, "노트 이름", "Notes/Source.md", source);

    // Then ordinary note links are enhanced only when the user enables them.
    expect(result).toEqual(expected);
  });

  test.each([
    { "marginote-card": 1 },
    { ...cardMetadata, "marginote-card": 2 },
    { ...cardMetadata, "marginote-id": "damaged" },
    { ...cardMetadata, "marginote-kind": "video" },
  ])("leaves malformed marked cards native instead of reclassifying them: %j", (metadata) => {
    // Given an unsupported or incomplete annotation marker.
    const lookup = hostLookup(metadata);

    // When ordinary note preview is enabled.
    const result = resolvePreview(lookup, "노트 이름", "Notes/Source.md", "both");

    // Then malformed card documents fall back to the host's link behavior.
    expect(result).toBeNull();
  });

  test("supports a normal note when no frontmatter exists", () => {
    // Given a normal note without any YAML properties.
    const lookup = hostLookup(undefined);

    // When ordinary note preview is enabled.
    const result = resolvePreview(lookup, "노트 이름", "Notes/Source.md", "notes");

    // Then the note does not need special metadata to be previewed.
    expect(result).toEqual({ file, kind: "note" });
  });

  test("keeps source-relative resolution in the host when aliases repeat", () => {
    // Given a narrow host adapter that records how a note is resolved.
    const calls: string[][] = [];
    const lookup: CardLookup<typeof file> = {
      getFirstLinkpathDest: (target, sourcePath) => {
        calls.push([target, sourcePath]);
        return file;
      },
      getFileCache: () => null,
    };

    // When a whole-note link is resolved from a folder.
    resolvePreview(lookup, "노트 이름", "Notes/Source.md", "notes");

    // Then the original path and source are delegated without global searching.
    expect(calls).toEqual([["노트 이름", "Notes/Source.md"]]);
  });

  test.each(["![[note]]", "note#heading", "note#^block", "https://example.com", "../note"])(
    "leaves unsupported targets native before host lookup: %s",
    (target) => {
      // Given a host boundary whose calls are observable.
      const calls: string[] = [];
      const lookup: CardLookup<typeof file> = {
        getFirstLinkpathDest: (path) => {
          calls.push(path);
          return file;
        },
        getFileCache: () => null,
      };

      // When an unsupported target is considered for preview.
      const result = resolvePreview(lookup, target, "Source.md", "both");

      // Then the plugin leaves the original target untouched.
      expect({ result, calls }).toEqual({ result: null, calls: [] });
    },
  );

  test("falls back when the target has been deleted", () => {
    // Given a link for which the host has no file.
    const lookup: CardLookup<typeof file> = {
      getFirstLinkpathDest: () => null,
      getFileCache: () => null,
    };

    // When the note is resolved.
    const result = resolvePreview(lookup, "deleted", "Source.md", "notes");

    // Then the host handles the missing link.
    expect(result).toBeNull();
  });

  test("falls back when the resolved file is not Markdown", () => {
    // Given a local attachment returned by the host.
    const lookup: CardLookup<typeof file> = {
      getFirstLinkpathDest: () => ({ path: "Picture.png", extension: "png" }),
      getFileCache: () => null,
    };

    // When the attachment is considered for note preview.
    const result = resolvePreview(lookup, "Picture.png", "Source.md", "notes");

    // Then attachment behavior remains with the host.
    expect(result).toBeNull();
  });
});
