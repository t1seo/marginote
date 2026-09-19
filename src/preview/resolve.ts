import { assertNever } from "../cards/errors";
import { wholeNoteLink } from "../cards/links";
import { type CardMetadata, parseCardMetadata } from "../cards/model";
import type { CardLookup } from "../cards/resolve";
import type { PreviewSource } from "./preferences";

type ResolvedPreview<File> =
  | (CardMetadata & { readonly file: File })
  | { readonly kind: "note"; readonly file: File };

export function hasCardMarker(input: unknown): boolean {
  return typeof input === "object" && input !== null && "marginote-card" in input;
}

export function resolvePreview<File extends { readonly extension: string }>(
  lookup: CardLookup<File>,
  linktext: string,
  sourcePath: string,
  source: PreviewSource,
): ResolvedPreview<File> | null {
  const target = wholeNoteLink(linktext);
  if (target === null) return null;
  const file = lookup.getFirstLinkpathDest(target, sourcePath);
  if (file?.extension.toLowerCase() !== "md") return null;
  const frontmatter: unknown = lookup.getFileCache(file)?.frontmatter;
  const card = parseCardMetadata(frontmatter);
  if (hasCardMarker(frontmatter) && !card) return null;

  switch (source) {
    case "cards":
      return card ? { ...card, file } : null;
    case "notes":
      return card ? null : { kind: "note", file };
    case "both":
      return card ? { ...card, file } : { kind: "note", file };
    default:
      return assertNever(source);
  }
}
