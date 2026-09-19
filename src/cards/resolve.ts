import { wholeNoteLink } from "./links";
import { type CardMetadata, parseCardMetadata } from "./model";

export interface CardLookup<File> {
  getFirstLinkpathDest(linkpath: string, sourcePath: string): File | null;
  getFileCache(file: File): { readonly frontmatter?: unknown } | null;
}

export function resolveCard<File extends { readonly extension: string }>(
  lookup: CardLookup<File>,
  linktext: string,
  sourcePath: string,
): (CardMetadata & { readonly file: File }) | null {
  const target = wholeNoteLink(linktext);
  if (target === null) return null;
  const file = lookup.getFirstLinkpathDest(target, sourcePath);
  if (file?.extension.toLowerCase() !== "md") return null;
  const metadata = parseCardMetadata(lookup.getFileCache(file)?.frontmatter);
  return metadata ? { file, ...metadata } : null;
}
