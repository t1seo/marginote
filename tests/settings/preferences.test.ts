import { describe, expect, test } from "bun:test";
import { parseSettings, SettingsSchema } from "../../src/preview/preferences";

describe("preview preferences", () => {
  test.each([undefined, null, {}, [], "invalid", 2].map((input) => ({ input })))(
    "starts with annotation proximity previews when saved data is absent or invalid: $input",
    ({ input }) => {
      // Given malformed or absent saved plugin data.
      // When the saved settings cross the plugin boundary.
      const settings = parseSettings(input);

      // Then ordinary note links stay native until explicitly enabled.
      expect(settings).toEqual({ previewSource: "cards", previewTrigger: "nearby" });
    },
  );

  test.each(["cards", "notes", "both"] as const)(
    "preserves a supported content source when it is %s",
    (previewSource) => {
      // Given a supported source with automatic previews disabled.
      const input = { previewSource, previewTrigger: "click" } as const;

      // When the preferences are loaded.
      const settings = parseSettings(input);

      // Then both choices survive a restart.
      expect(settings).toEqual(input);
    },
  );

  test.each(["hover", "click", "nearby"] as const)(
    "preserves a supported trigger when it is %s",
    (previewTrigger) => {
      // Given a supported trigger.
      const input = { previewSource: "notes", previewTrigger };

      // When the preferences are loaded.
      const settings = parseSettings(input);

      // Then the chosen trigger survives a restart.
      expect(settings.previewTrigger).toBe(previewTrigger);
    },
  );

  test("recovers only the damaged field when the other preference is valid", () => {
    // Given an unsupported trigger from saved data.
    const input = { previewSource: "notes", previewTrigger: "instant" };

    // When preferences are parsed.
    const settings = parseSettings(input);

    // Then the note preference is retained with the safe trigger default.
    expect(settings).toEqual({ previewSource: "notes", previewTrigger: "nearby" });
  });

  test("keeps automatic previews off when only the source field is damaged", () => {
    const input = { previewSource: ["cards", "notes"], previewTrigger: "click" };

    const settings = parseSettings(input);

    expect(settings).toEqual({ previewSource: "cards", previewTrigger: "click" });
  });

  test("isolates default settings when a previous instance changes its preferences", () => {
    const earlier = parseSettings(undefined);
    earlier.previewSource = "both";
    earlier.previewTrigger = "hover";

    const settings = parseSettings(undefined);

    expect(settings).toEqual({ previewSource: "cards", previewTrigger: "nearby" });
  });

  test("preserves a disabled legacy preview preference when migrating", () => {
    // Given the earlier scaffold's explicit disabled preference.
    const input = { autoPreview: false };

    // When the preferences are migrated.
    const settings = parseSettings(input);

    // Then migration does not unexpectedly enable automatic previews.
    expect(settings).toEqual({ previewSource: "cards", previewTrigger: "click" });
  });

  test("keeps the new explicit preference when stale legacy data is present", () => {
    // Given new preferences alongside a stale legacy value.
    const input = { previewSource: "both", previewTrigger: "nearby", autoPreview: false };

    // When preferences are loaded.
    const settings = parseSettings(input);

    // Then only the current preferences control behavior.
    expect(settings).toEqual({ previewSource: "both", previewTrigger: "nearby" });
  });

  test.each([
    { previewTrigger: undefined, expected: "click" },
    { previewTrigger: null, expected: "nearby" },
    { previewTrigger: "invalid", expected: "nearby" },
    { previewTrigger: "", expected: "nearby" },
  ])(
    "given legacy disabled state, parsing only migrates an absent trigger: $previewTrigger",
    ({ previewTrigger, expected }) => {
      const settings = parseSettings({
        previewSource: "notes",
        autoPreview: false,
        previewTrigger,
      });

      expect(settings).toEqual({ previewSource: "notes", previewTrigger: expected });
    },
  );

  test.each(
    [undefined, null, [], 42, { previewSource: false }, { autoPreview: false }].map((input) => ({
      input,
    })),
  )(
    "given malformed saved input, the exported schema still returns defaults: $input",
    ({ input }) => {
      const parsed = SettingsSchema.safeParse(input);

      expect(parsed).toEqual({
        success: true,
        data: { previewSource: "cards", previewTrigger: "nearby" },
      });
    },
  );

  test("given unrelated saved data, the exported schema strips it from its mutable result", () => {
    const parsed = SettingsSchema.parse({
      previewSource: "both",
      previewTrigger: "click",
      unrelated: true,
    });

    expect(parsed).toEqual({ previewSource: "both", previewTrigger: "click" });
    expect(Object.isFrozen(parsed)).toBe(false);
  });
});
