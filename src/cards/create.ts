import { CardCreationError } from "./errors";

export interface CardFileWriter<File> {
  exists(path: string): boolean;
  create(path: string, markdown: string): Promise<File>;
}

export async function createUniqueCard<File>(
  writer: CardFileWriter<File>,
  title: string,
  markdown: string,
): Promise<File> {
  const cleaned = Array.from(title)
    .filter((character) => (character.codePointAt(0) ?? 0) >= 32)
    .join("")
    .replace(/[\\/:*?"<>|#^[\]]/gu, "")
    .replace(/^[.\s]+|[.\s]+$/gu, "")
    .replace(/\s+/gu, " ");
  const basename = Array.from(cleaned).slice(0, 80).join("").trim() || "Annotation";
  for (let attempt = 1; attempt <= 1_000; attempt += 1) {
    const suffix = attempt === 1 ? "" : ` (${attempt})`;
    const path = `Annotations/${basename}${suffix}.md`;
    if (writer.exists(path)) continue;
    try {
      return await writer.create(path, markdown);
    } catch (error) {
      if (!(error instanceof Error) || !writer.exists(path)) throw error;
    }
  }
  throw new CardCreationError(
    "name-exhausted",
    "Too many cards share this title. Use another title.",
  );
}
