type Span = { readonly from: number; readonly to: number };

function intersects(a: Span, b: Span): boolean {
  return a.from < b.to && b.from < a.to;
}

function fenceCloser(line: string): RegExp | null {
  let body = line;
  let prefix = "";
  for (;;) {
    const container = /^(?: {0,3}>[ \t]?|[ \t]*(?:[-+*]|\d{1,9}[.)])[ \t]+)/u.exec(body)?.[0];
    if (!container) break;
    prefix += container.includes(">") ? " {0,3}>[ \\t]?" : `[ \\t]{${container.length}}`;
    body = body.slice(container.length);
  }
  const marker = /^ {0,3}(`{3,}|~{3,})/u.exec(body)?.[1];
  if (!marker) return null;
  return new RegExp(`^${prefix} {0,3}${marker.charAt(0)}{${marker.length},}[ \\t]*\\r?$`, "u");
}

function protectedBlock(content: string, selection: Span): boolean {
  let offset = 0;
  let yaml = false;
  let fence: RegExp | null = null;
  let math = false;
  let htmlBlock = false;
  for (const line of content.split("\n")) {
    const span = { from: offset, to: offset + line.length + 1 };
    const opening = fenceCloser(line);
    const isFirst = offset === 0;
    const yamlMarker = /^(?:\uFEFF)?---\s*$/u.test(line);
    let blocked = false;
    if (isFirst && yamlMarker) {
      yaml = true;
      blocked = true;
    } else if (yaml) {
      blocked = true;
      if (yamlMarker || /^\.\.\.\s*$/u.test(line)) yaml = false;
    } else if (fence) {
      blocked = true;
      if (fence.test(line)) fence = null;
    } else if (math) {
      blocked = true;
      if (line.includes("$$")) math = false;
    } else if (/^ {0,3}\$\$/u.test(line)) {
      blocked = true;
      math = line.indexOf("$$", line.indexOf("$$") + 2) < 0;
    } else if (opening) {
      blocked = true;
      fence = opening;
    }
    if (
      /^\s*<(?:address|article|aside|blockquote|div|details|figure|p|pre|script|section|style|table|ul|ol)(?:\s|>)/iu.test(
        line,
      )
    )
      htmlBlock = true;
    blocked ||= htmlBlock || /^(?: {4}|\t| {0,3}\[[^\]]+\]:)/u.test(line) || /[<>]/u.test(line);
    if (!line.trim() || /^\s*<\//u.test(line)) htmlBlock = false;
    if (intersects(span, selection) && blocked) return true;
    offset = span.to;
    if (offset > selection.to) break;
  }
  return false;
}

function bracketSpans(paragraph: string): readonly Span[] {
  const spans: Span[] = [];
  let start = -1;
  let depth = 0;
  for (let index = 0; index < paragraph.length; index += 1) {
    const char = paragraph[index];
    if (char === "\\") {
      index += 1;
      continue;
    }
    if (char === "[") {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === "]" && depth > 0) {
      depth -= 1;
      if (depth !== 0) continue;
      if (paragraph[index + 1] === "(") {
        let parentheses = 1;
        index += 2;
        for (; index < paragraph.length && parentheses > 0; index += 1) {
          if (paragraph[index] === "\\") {
            index += 1;
            continue;
          }
          if (paragraph[index] === "(") parentheses += 1;
          if (paragraph[index] === ")") parentheses -= 1;
        }
        index -= 1;
      }
      spans.push({ from: start, to: index + 1 });
      start = -1;
    }
  }
  if (start >= 0) spans.push({ from: start, to: paragraph.length });
  return spans;
}

export function isProtectedContext(content: string, from: number, to: number): boolean {
  const selection = { from, to };
  if (protectedBlock(content, selection)) return true;
  for (const match of content.matchAll(/<!--[\s\S]*?(?:-->|$)|%%[\s\S]*?(?:%%|$)/gu)) {
    if (intersects(selection, { from: match.index, to: match.index + match[0].length }))
      return true;
  }
  const start = content.lastIndexOf("\n\n", from) + 2;
  const paragraphStart = start === 1 ? 0 : start;
  const next = content.indexOf("\n\n", to);
  const paragraph = content.slice(paragraphStart, next < 0 ? content.length : next);
  const relative = { from: from - paragraphStart, to: to - paragraphStart };
  for (const match of paragraph.matchAll(
    /(`+)[\s\S]*?\1|\$[^$]+\$|\b(?:https?:\/\/|www\.)[^\s<>]+/gu,
  )) {
    if (intersects(relative, { from: match.index, to: match.index + match[0].length })) return true;
  }
  return bracketSpans(paragraph).some((span) => intersects(relative, span));
}
