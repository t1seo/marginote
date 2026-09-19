import { z } from "zod";

export const PreviewSourceSchema = z.enum(["cards", "notes", "both"]);
export const PreviewTriggerSchema = z.enum(["hover", "click", "nearby"]);
export type PreviewSource = z.infer<typeof PreviewSourceSchema>;
export type PreviewTrigger = z.infer<typeof PreviewTriggerSchema>;
export const HOVER_PREVIEW_DELAY_MS = 250;

export const SettingsSchema = z
  .object({
    previewSource: PreviewSourceSchema.catch("cards"),
    previewTrigger: PreviewTriggerSchema.catch("nearby"),
  })
  .catch(() => ({ previewSource: "cards", previewTrigger: "nearby" }) as const);

export type MarginoteSettings = z.infer<typeof SettingsSchema>;

const DisabledLegacyPreviewSchema = z.object({
  autoPreview: z.literal(false),
  previewTrigger: z.undefined().optional(),
});

export function parseSettings(input: unknown): MarginoteSettings {
  const settings = SettingsSchema.parse(input);
  return DisabledLegacyPreviewSchema.safeParse(input).success
    ? { ...settings, previewTrigger: "click" }
    : settings;
}

const SOURCE_SUMMARIES = {
  cards: "Only links to annotation cards use Marginote.",
  notes: "Only ordinary whole-note Markdown links use Marginote.",
  both: "Annotation cards and ordinary whole-note Markdown links use Marginote.",
} as const satisfies Record<PreviewSource, string>;

const TRIGGER_SUMMARIES = {
  hover: "Hover directly over a link for a stationary preview, or click to keep it open.",
  click: "Automatic previews are off. Click, tap or use Enter/Space to open a preview.",
  nearby:
    "Move beside or below eligible text to preview it. The card follows your pointer; click the link to keep it open.",
} as const satisfies Record<PreviewTrigger, string>;

export function previewSummary(settings: MarginoteSettings): string {
  return `${SOURCE_SUMMARIES[settings.previewSource]} ${TRIGGER_SUMMARIES[settings.previewTrigger]}`;
}
