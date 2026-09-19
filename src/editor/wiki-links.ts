export type TextRange = { readonly from: number; readonly to: number };

export type WikiLinkRange = TextRange & {
  readonly linktext: string;
  readonly labelFrom: number;
  readonly labelTo: number;
};

function isEscaped(text: string, position: number): boolean {
  let backslashes = 0;
  for (let index = position - 1; index >= 0 && text[index] === "\\"; index--) backslashes++;
  return backslashes % 2 === 1;
}

/** Lexical candidates only. The host syntax tree must approve each candidate before decoration. */
export function findWikiLinks(text: string, offset = 0): readonly WikiLinkRange[] {
  const links: WikiLinkRange[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const from = text.indexOf("[[", cursor);
    if (from < 0) break;
    const closing = text.indexOf("]]", from + 2);
    if (closing < 0) break;
    cursor = closing + 2;
    if (isEscaped(text, from) || (text[from - 1] === "!" && !isEscaped(text, from - 1))) {
      continue;
    }
    const body = text.slice(from + 2, closing);
    if (/[[\]\r\n]/u.test(body) || [...body].some((character) => character.charCodeAt(0) < 32)) {
      continue;
    }
    const separator = body.indexOf("|");
    const linktext = (separator < 0 ? body : body.slice(0, separator)).trim();
    const label = separator < 0 ? body : body.slice(separator + 1);
    if (!linktext || linktext.includes("#") || !label.trim() || label.includes("|")) continue;
    links.push({
      from: offset + from,
      to: offset + cursor,
      labelFrom: offset + from + 2 + (separator < 0 ? 0 : separator + 1),
      labelTo: offset + closing,
      linktext,
    });
  }
  return links;
}

export function selectionTouchesLink(link: TextRange, selections: readonly TextRange[]): boolean {
  return selections.some((selection) => selection.from <= link.to && selection.to >= link.from);
}

export function syntaxAllowsWikiLink(nodeNames: readonly string[]): boolean {
  return (
    nodeNames.some((name) => /hmd-internal-link|wikilink|internal[-_]link/iu.test(name)) &&
    !nodeNames.some((name) => /code|comment|frontmatter|yaml|html|embed/iu.test(name))
  );
}
