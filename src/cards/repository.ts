import { type App, getFrontMatterInfo, parseYaml, TFolder } from "obsidian";
import { createUniqueCard } from "./create";
import { type CardDraft, serializeCard } from "./draft";
import { assertNever, CardCreationError } from "./errors";
import { wholeNoteLink } from "./links";
import { type CardDocument, CardIdSchema, type CardReference, parseCardMetadata } from "./model";
import { resolveCard } from "./resolve";

export class CardRepository {
  constructor(private readonly app: App) {}

  resolve(linktext: string, sourcePath: string): CardReference | null {
    return resolveCard(this.app.metadataCache, linktext, sourcePath);
  }

  async read(reference: CardReference): Promise<CardDocument | null> {
    if (this.app.vault.getAbstractFileByPath(reference.file.path) !== reference.file) return null;
    try {
      const content = await this.app.vault.cachedRead(reference.file);
      const frontmatter = getFrontMatterInfo(content);
      if (!frontmatter.exists) return null;
      const metadata = parseCardMetadata(parseYaml(frontmatter.frontmatter));
      if (!metadata || metadata.id !== reference.id) return null;
      return {
        file: reference.file,
        ...metadata,
        markdown: content.slice(frontmatter.contentStart),
      };
    } catch (error) {
      if (error instanceof Error) return null;
      throw error;
    }
  }

  async create(draft: CardDraft, alias: string, sourcePath: string): Promise<CardReference> {
    let cardDraft = draft;
    switch (draft.kind) {
      case "text":
        break;
      case "image":
      case "mixed": {
        const image = this.app.metadataCache.getFirstLinkpathDest(draft.imagePath, sourcePath);
        if (
          !image ||
          wholeNoteLink(image.path) === null ||
          !/^(?:avif|bmp|gif|jpe?g|png|svg|webp)$/iu.test(image.extension)
        ) {
          throw new CardCreationError("invalid-image", "Choose an existing image in this vault.");
        }
        cardDraft = { ...draft, imagePath: image.path };
        break;
      }
      default:
        assertNever(draft);
    }
    await this.ensureFolder();
    const id = CardIdSchema.parse(crypto.randomUUID());
    const markdown = serializeCard(cardDraft, id);
    const file = await createUniqueCard(
      {
        exists: (path) => this.app.vault.getAbstractFileByPath(path) !== null,
        create: (path, content) => this.app.vault.create(path, content),
      },
      draft.title || alias,
      markdown,
    );
    return { file, id, kind: draft.kind };
  }

  private async ensureFolder(): Promise<void> {
    const existing = this.app.vault.getAbstractFileByPath("Annotations");
    if (existing instanceof TFolder) return;
    if (existing) {
      throw new CardCreationError(
        "folder-blocked",
        'A file named "Annotations" blocks the card folder.',
      );
    }
    try {
      await this.app.vault.createFolder("Annotations");
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !(this.app.vault.getAbstractFileByPath("Annotations") instanceof TFolder)
      ) {
        throw error;
      }
    }
  }
}
