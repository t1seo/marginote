import { describe, expect, expectTypeOf, test } from "bun:test";
import { type CardDraft, parseCardDraft } from "../../src/cards/draft";

describe("card draft validation contract", () => {
  test.each([
    {
      kind: "text",
      body: "  **Text**  ",
      imagePath: "",
      expected: { kind: "text", title: "Title", body: "**Text**", imagePath: "" },
    },
    {
      kind: "image",
      body: "",
      imagePath: "  사진/돌 벽 🧱.png  ",
      expected: { kind: "image", title: "Title", body: "", imagePath: "사진/돌 벽 🧱.png" },
    },
    {
      kind: "mixed",
      body: "  Text  ",
      imagePath: "  a.png  ",
      expected: { kind: "mixed", title: "Title", body: "Text", imagePath: "a.png" },
    },
  ])("given a $kind draft, parsing trims fields and strips unrelated metadata", (input) => {
    const draft = parseCardDraft({ ...input, title: "  Title  ", unrelated: true });

    expect(draft.success).toBe(true);
    if (!draft.success) throw draft.error;
    expect(draft.data).toEqual(input.expected);
  });

  test("given a valid draft, parsing produces a readonly snapshot", () => {
    const draft = parseCardDraft({ kind: "text", title: "", body: "Text", imagePath: "" });

    if (!draft.success) throw draft.error;
    expect(Object.isFrozen(draft.data)).toBe(true);
    expectTypeOf<Extract<CardDraft, { kind: "text" }>>().toEqualTypeOf<{
      readonly kind: "text";
      readonly title: string;
      readonly body: string;
      readonly imagePath: "";
    }>();
  });

  test("given a padded 200-character title, parsing checks length after trimming", () => {
    const title = "한".repeat(200);

    const draft = parseCardDraft({
      kind: "text",
      title: `  ${title}  `,
      body: "Text",
      imagePath: "",
    });

    if (!draft.success) throw draft.error;
    expect(draft.data.title).toBe(title);
  });

  test.each([
    {
      title: "x".repeat(201),
      message: "Too big: expected string to have <=200 characters",
      code: "too_big",
    },
    { title: "line\nbreak", message: "Use a single-line title.", code: "invalid_format" },
    { title: "line\rbreak", message: "Use a single-line title.", code: "invalid_format" },
  ])(
    "given an invalid title, parsing retains the displayed $code error",
    ({ title, message, code }) => {
      const draft = parseCardDraft({ kind: "text", title, body: "Text", imagePath: "" });

      expect(draft.success).toBe(false);
      if (draft.success) throw new TypeError("The invalid title was accepted.");
      expect(draft.error).toBeInstanceOf(Error);
      expect(draft.error.issues[0]).toMatchObject({ path: ["title"], message, code });
    },
  );

  test.each([
    { kind: "text", body: "  ", imagePath: "", field: "body", message: "Enter the card's text." },
    {
      kind: "image",
      body: "",
      imagePath: "  ",
      field: "imagePath",
      message: "Enter a local image path.",
    },
    {
      kind: "mixed",
      body: "Text",
      imagePath: "  ",
      field: "imagePath",
      message: "Enter a local image path.",
    },
    {
      kind: "image",
      body: "",
      imagePath: "a.png#fragment",
      field: "imagePath",
      message: "Use a vault image path without a fragment or embed syntax.",
    },
  ])(
    "given invalid $kind content, parsing keeps the first displayed field error",
    ({ kind, body, imagePath, field, message }) => {
      const draft = parseCardDraft({ kind, title: "", body, imagePath });

      expect(draft.success).toBe(false);
      if (draft.success) throw new TypeError("The invalid draft was accepted.");
      expect(draft.error.issues[0]).toMatchObject({ path: [field], message });
    },
  );

  test("given missing mixed content, parsing reports text before the image errors", () => {
    const draft = parseCardDraft({ kind: "mixed", title: "", body: " ", imagePath: " " });

    if (draft.success) throw new TypeError("The incomplete mixed draft was accepted.");
    expect(draft.error.issues.map(({ path, message }) => ({ path, message }))).toEqual([
      { path: ["body"], message: "Enter the card's text." },
      { path: ["imagePath"], message: "Enter a local image path." },
      {
        path: ["imagePath"],
        message: "Use a vault image path without a fragment or embed syntax.",
      },
    ]);
  });
});
