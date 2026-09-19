import { wholeNoteLink } from "../cards/links";
import { selectionError } from "./selection";

export type AnnotationLink = {
  readonly from: number;
  readonly to: number;
  readonly target: string;
  readonly alias: string;
};

export function annotationLinkAt(content: string, from: number, to: number): AnnotationLink | null {
  for (const match of content.matchAll(/\[\[([^[\]\r\n|]+)\|([^[\]\r\n|]+)\]\]/gu)) {
    const start = match.index;
    const end = start + match[0].length;
    const target = match[1];
    const alias = match[2];
    if (from < start || to > end || !target || !alias || wholeNoteLink(target) === null) continue;
    if (content[start - 1] === "!" || content[start - 1] === "\\") continue;
    const unlinked = content.slice(0, start) + alias + content.slice(end);
    if (selectionError(unlinked, start, start + alias.length)) continue;
    return { from: start, to: end, target, alias };
  }
  return null;
}
