import { isProtectedContext } from "./protected-context";

export function selectionError(content: string, from: number, to: number): string | null {
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    to > content.length ||
    from >= to
  ) {
    return "Select the text you want to annotate.";
  }
  const text = content.slice(from, to);
  if (!text.trim()) return "Select the text you want to annotate.";
  if (/[\r\n]/u.test(text)) return "Select text within a single paragraph, without line breaks.";
  if (/[[\]`|\\*_~$<>]/u.test(text)) return "Select plain text without Markdown formatting.";
  if (isProtectedContext(content, from, to))
    return "Select plain text outside links, code, HTML, or properties.";
  return null;
}
