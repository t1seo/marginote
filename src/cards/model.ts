import type { TFile } from "obsidian";
import { z } from "zod";

export const CARD_KINDS = ["text", "image", "mixed"] as const;
export type CardKind = (typeof CARD_KINDS)[number];
export const CardIdSchema = z.uuid().brand("CardId");
export type CardId = z.infer<typeof CardIdSchema>;

export type CardMetadata = { readonly id: CardId; readonly kind: CardKind };
export type CardReference = CardMetadata & { readonly file: TFile };
export type CardDocument = CardReference & { readonly markdown: string };

const MetadataSchema = z.object({
  "marginote-card": z.literal(1),
  "marginote-id": CardIdSchema,
  "marginote-kind": z.enum(CARD_KINDS),
});

export function parseCardMetadata(input: unknown): CardMetadata | null {
  const parsed = MetadataSchema.safeParse(input);
  if (!parsed.success) return null;
  return { id: parsed.data["marginote-id"], kind: parsed.data["marginote-kind"] };
}
