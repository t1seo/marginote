export const MAX_NOTE_PREVIEW_LENGTH = 6000;

export type NoteExcerpt = { readonly markdown: string; readonly truncated: boolean };

export function noteExcerpt(markdown: string): NoteExcerpt {
  if (markdown.length <= MAX_NOTE_PREVIEW_LENGTH) return { markdown, truncated: false };

  const prefix = markdown.slice(0, MAX_NOTE_PREVIEW_LENGTH);
  const paragraphEnd = Math.max(prefix.lastIndexOf("\n\n"), prefix.lastIndexOf("\r\n\r\n"));
  const lineEnd = prefix.lastIndexOf("\n");
  const usefulBoundary = MAX_NOTE_PREVIEW_LENGTH / 2;
  const end =
    paragraphEnd >= usefulBoundary
      ? paragraphEnd
      : lineEnd >= usefulBoundary
        ? lineEnd
        : /[\uD800-\uDBFF]$/u.test(prefix)
          ? prefix.length - 1
          : prefix.length;
  return { markdown: prefix.slice(0, end).trimEnd(), truncated: true };
}
