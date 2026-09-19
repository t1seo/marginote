export function wholeNoteLink(linktext: string): string | null {
  if (
    !linktext.trim() ||
    /[[\]#^|\\\r\n]/u.test(linktext) ||
    Array.from(linktext).some((character) => (character.codePointAt(0) ?? 0) < 32) ||
    /^(?:[a-z][a-z\d+.-]*:|\/)/iu.test(linktext) ||
    linktext.split("/").some((part) => part === ".." || part === ".")
  )
    return null;
  return linktext;
}

export function cardLink(path: string, alias: string): string {
  return `[[${path.replace(/\.md$/iu, "")}|${alias}]]`;
}
