import { describe, expect, test } from "bun:test";
import { parseSettings } from "../../src/preview/preferences";

describe("preview preferences", () => {
  test.each([undefined, null, [], "invalid", 2].map((input) => ({ input })))(
    "uses a focused, deliberate default when saved data is invalid: $input",
    ({ input }) => {
      // Given malformed or absent saved plugin data.
      // When the saved settings cross the plugin boundary.
      const settings = parseSettings(input);

      // Then ordinary note links stay native until explicitly enabled.
      expect(settings).toEqual({ previewSource: "cards", previewTrigger: "hover" });
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
    expect(settings).toEqual({ previewSource: "notes", previewTrigger: "hover" });
  });

  test("keeps automatic previews off when only the source field is damaged", () => {
    const input = { previewSource: ["cards", "notes"], previewTrigger: "click" };

    const settings = parseSettings(input);

    expect(settings).toEqual({ previewSource: "cards", previewTrigger: "click" });
  });

  test("isolates default settings when a previous instance changes its preferences", () => {
    const earlier = parseSettings(undefined);
    earlier.previewSource = "both";
    earlier.previewTrigger = "nearby";

    const settings = parseSettings(undefined);

    expect(settings).toEqual({ previewSource: "cards", previewTrigger: "hover" });
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
});
