import { describe, expect, test } from "bun:test";
import { CardIdSchema, parseCardMetadata } from "../../src/cards/model";

const id = CardIdSchema.parse("1a8f4bf2-c498-4e20-bf1c-33588d8d38b7");

describe("card opt-in metadata", () => {
  test.each(["text", "image", "mixed"])("preserves identity when kind is %s", (kind) => {
    const input = { "marginote-card": 1, "marginote-id": id, "marginote-kind": kind };
    const result = parseCardMetadata(input);
    expect(result).toEqual({ id, kind });
  });

  test.each([
    undefined,
    {},
    { "marginote-card": "1", "marginote-id": id, "marginote-kind": "text" },
    { "marginote-card": 2, "marginote-id": id, "marginote-kind": "text" },
    { "marginote-card": 1, "marginote-id": "bad-id", "marginote-kind": "text" },
    { "marginote-card": 1, "marginote-id": id, "marginote-kind": "video" },
    { "marginote-card": 1, "marginote-kind": "image" },
  ])("rejects malformed or unsupported metadata %#", (input) => {
    const result = parseCardMetadata(input);
    expect(result).toBeNull();
  });
});
