import { describe, expect, test } from "bun:test";
import { parseCardDraft, serializeCard } from "../../src/cards/draft";
import { CardIdSchema } from "../../src/cards/model";

describe("Markdown card creation", () => {
  test("writes image-only cards without a forced title or caption", () => {
    const draft = parseCardDraft({
      kind: "image",
      title: "",
      body: "",
      imagePath: "사진/돌 벽 🧱.png",
    });
    if (!draft.success) throw draft.error;
    const id = CardIdSchema.parse("1a8f4bf2-c498-4e20-bf1c-33588d8d38b7");
    const result = serializeCard(draft.data, id);
    expect(result).toBe(
      `---\nmarginote-card: 1\nmarginote-id: ${id}\nmarginote-kind: image\n---\n\n![[사진/돌 벽 🧱.png]]\n`,
    );
  });

  test("keeps Markdown body and stable metadata separate", () => {
    const draft = parseCardDraft({
      kind: "mixed",
      title: "정의 #1",
      body: "**설명**\n\n출처: [[책]]",
      imagePath: "a.png",
    });
    if (!draft.success) throw draft.error;
    const id = CardIdSchema.parse("1a8f4bf2-c498-4e20-bf1c-33588d8d38b7");
    const result = serializeCard(draft.data, id);
    expect(result).toContain("# 정의 \\#1\n\n![[a.png]]\n\n**설명**\n\n출처: [[책]]");
    expect(result).toContain(`marginote-id: ${id}`);
  });

  test.each([
    { kind: "text", title: "", body: "", imagePath: "" },
    { kind: "image", title: "", body: "", imagePath: "https://example.com/a.png" },
    { kind: "image", title: "", body: "", imagePath: "../a.png" },
    { kind: "image", title: "", body: "", imagePath: "[[a.png]]" },
    { kind: "image", title: "", body: "", imagePath: "a.png#bad" },
    { kind: "mixed", title: "", body: "Text", imagePath: "" },
    { kind: "text", title: "line\nbreak", body: "Text", imagePath: "" },
  ])("rejects incomplete or unsafe form values %#", (input) => {
    const result = parseCardDraft(input);
    expect(result.success).toBe(false);
  });
});
