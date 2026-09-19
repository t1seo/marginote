import { type App, getFrontMatterInfo, parseYaml } from "obsidian";
import { assertNever } from "../cards/errors";
import type { CardRepository } from "../cards/repository";
import { noteExcerpt } from "./excerpt";
import type { NoteDocument, NoteReference, PreviewDocument, PreviewReference } from "./model";
import type { MarginoteSettings } from "./preferences";
import { hasCardMarker, resolvePreview } from "./resolve";

export type { NoteDocument, NoteReference, PreviewDocument, PreviewReference } from "./model";

export class PreviewRepository {
  constructor(
    private readonly app: App,
    private readonly cards: CardRepository,
    private readonly settings: () => MarginoteSettings,
  ) {}

  resolve(linktext: string, sourcePath: string): PreviewReference | null {
    return resolvePreview(
      this.app.metadataCache,
      linktext,
      sourcePath,
      this.settings().previewSource,
    );
  }

  async read(reference: PreviewReference): Promise<PreviewDocument | null> {
    switch (reference.kind) {
      case "note":
        return this.settings().previewSource === "cards" ? null : this.readNote(reference);
      case "text":
      case "image":
      case "mixed":
        return this.settings().previewSource === "notes" ? null : this.cards.read(reference);
      default:
        return assertNever(reference);
    }
  }

  private async readNote(reference: NoteReference): Promise<NoteDocument | null> {
    if (this.app.vault.getAbstractFileByPath(reference.file.path) !== reference.file) return null;
    try {
      const content = await this.app.vault.cachedRead(reference.file);
      const frontmatter = getFrontMatterInfo(content);
      if (frontmatter.exists && hasCardMarker(parseYaml(frontmatter.frontmatter))) return null;
      return {
        ...reference,
        ...noteExcerpt(content.slice(frontmatter.exists ? frontmatter.contentStart : 0)),
      };
    } catch (error) {
      if (error instanceof Error) return null;
      throw error;
    }
  }
}
