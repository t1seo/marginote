type Fence = {
  readonly marker: string;
  readonly length: number;
  readonly indent: number;
  readonly trusted: boolean;
};

function prepareInline(line: string, isLocalImage: (path: string) => boolean): string {
  let output = "";
  let index = 0;
  while (index < line.length) {
    const character = line.charAt(index);
    if (character === "\\") {
      output += line.slice(index, index + 2);
      index += 2;
      continue;
    }
    if (character === "`") {
      let runEnd = index + 1;
      while (line.charAt(runEnd) === "`") runEnd++;
      const delimiterLength = runEnd - index;
      const closing = [...line.slice(runEnd).matchAll(/`+/g)].find(
        (match) => match[0].length === delimiterLength,
      );
      const end = closing === undefined ? runEnd : runEnd + closing.index + delimiterLength;
      output += line.slice(index, end);
      index = end;
      continue;
    }
    if (line.startsWith("![[", index)) {
      const end = line.indexOf("]]", index + 3);
      if (end !== -1) {
        const target = line.slice(index + 3, end);
        const path = target.split("|")[0] ?? "";
        const safeTarget =
          path.length > 0 &&
          !/[[\]!`<>\\]/.test(target) &&
          !/^[ \t]*(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(path);
        output +=
          safeTarget && isLocalImage(path)
            ? line.slice(index, end + 2)
            : `Image unavailable: ${path.replace(/[\\[\]!*_`<>]/g, "")}`;
        index = end + 2;
        continue;
      }
    }
    if (character === "!" && line.charAt(index + 1) === "[") {
      output += "\\!";
    } else {
      output += character === "<" ? "&lt;" : character;
    }
    index++;
  }
  return output;
}

export function prepareCardMarkdown(
  markdown: string,
  isLocalImage: (path: string) => boolean,
): string {
  let fence: Fence | null = null;
  return (markdown.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g) ?? [])
    .map((line) => {
      const body = line.replace(/(?:\r\n|\r|\n)$/, "");
      const opening = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(body);
      const delimiter = opening?.[2];
      const info = opening?.[3] ?? "";
      if (fence !== null) {
        if (
          delimiter?.startsWith(fence.marker) &&
          delimiter.length >= fence.length &&
          /^[ \t]*$/.test(info)
        ) {
          fence = null;
          return line;
        }
        const indent = (body.match(/^[ \t]*/)?.[0] ?? "").replace(/\t/g, "    ").length;
        if (fence.trusted && (indent >= fence.indent || /^[ \t]*$/.test(body))) return line;
        fence = { ...fence, trusted: false };
      } else if (delimiter !== undefined && !(delimiter.startsWith("`") && info.includes("`"))) {
        fence = {
          marker: delimiter.charAt(0),
          length: delimiter.length,
          indent: opening?.[1]?.length ?? 0,
          trusted: true,
        };
        return line;
      }
      return prepareInline(body, isLocalImage) + line.slice(body.length);
    })
    .join("");
}

export function previewDuration(markdown: string): number {
  return 10_000 + Math.ceil(Math.max(0, markdown.length - 200) / 200) * 5_000;
}
