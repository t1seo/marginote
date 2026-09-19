import { describe, expect, expectTypeOf, test } from "bun:test";
import { type CardId, CardIdSchema } from "../../src/cards/model";

describe("card UUID validation contract", () => {
  test.each([
    "1a8f4bf2-c498-4e20-bf1c-33588d8d38b7",
    "1A8F4BF2-C498-4E20-BF1C-33588D8D38B7",
    "00000000-0000-0000-0000-000000000000",
    "ffffffff-ffff-ffff-ffff-ffffffffffff",
  ])("given a supported UUID, parsing preserves its exact spelling: %s", (input) => {
    const id = CardIdSchema.parse(input);

    expect<string>(id).toBe(input);
    expectTypeOf<CardId>().toExtend<string>();
    expectTypeOf<string>().not.toExtend<CardId>();
  });

  test.each([
    "bad-id",
    " 1a8f4bf2-c498-4e20-bf1c-33588d8d38b7 ",
    "1a8f4bf2-c498-9e20-bf1c-33588d8d38b7",
  ])("given an unsupported UUID, parsing preserves the UUID error: %s", (input) => {
    const result = CardIdSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (result.success) throw new TypeError("The invalid UUID was accepted.");
    expect(result.error.issues[0]).toMatchObject({
      path: [],
      code: "invalid_format",
      message: "Invalid UUID",
    });
  });
});
