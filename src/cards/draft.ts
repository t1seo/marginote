import * as z from "zod/mini";
import "../validation-locale";
import { wholeNoteLink } from "./links";
import type { CardId } from "./model";

const title = z
  .string()
  .check(z.trim(), z.maxLength(200), z.regex(/^[^\r\n]*$/u, "Use a single-line title."));
const body = z.string().check(z.trim(), z.minLength(1, "Enter the card's text."));
const imagePath = z.string().check(
  z.trim(),
  z.minLength(1, "Enter a local image path."),
  z.refine(
    (path) => wholeNoteLink(path) !== null,
    "Use a vault image path without a fragment or embed syntax.",
  ),
);
const DraftSchema = z.readonly(
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("text"), title, body, imagePath: z.literal("") }),
    z.object({ kind: z.literal("image"), title, body: z.literal(""), imagePath }),
    z.object({ kind: z.literal("mixed"), title, body, imagePath }),
  ]),
);

export type CardDraft = z.infer<typeof DraftSchema>;

export function parseCardDraft(input: unknown) {
  return DraftSchema.safeParse(input);
}

export function serializeCard(draft: CardDraft, id: CardId): string {
  const heading = draft.title ? `# ${draft.title.replace(/[\\`*_{}[\]()#+.!<>]/gu, "\\$&")}` : "";
  const sections = [heading, draft.imagePath ? `![[${draft.imagePath}]]` : "", draft.body];
  return [
    "---",
    "marginote-card: 1",
    `marginote-id: ${id}`,
    `marginote-kind: ${draft.kind}`,
    "---",
    "",
    sections.filter(Boolean).join("\n\n"),
    "",
  ].join("\n");
}
