import { type App, type ButtonComponent, Modal, Notice, Setting } from "obsidian";
import { parseCardDraft } from "../cards/draft";
import { assertNever } from "../cards/errors";
import type { CardRepository } from "../cards/repository";
import { type AuthoringTarget, createAndLink, type SelectionState } from "./creation";

export type AuthoringContext = {
  readonly snapshot: SelectionState;
  readonly target: AuthoringTarget;
  readonly isActive: () => boolean;
  readonly onClosed: (linked: boolean) => void;
};

export class CardAuthorModal extends Modal {
  private opened = false;
  private saving = false;
  private linked = false;
  private kind = "text";
  private title = "";
  private body = "";
  private imagePath = "";
  private errorEl: HTMLElement | null = null;
  private saveButton: ButtonComponent | null = null;

  constructor(
    app: App,
    private readonly repository: CardRepository,
    private readonly context: AuthoringContext,
  ) {
    super(app);
    this.shouldRestoreSelection = false;
  }

  override onOpen(): void {
    this.opened = true;
    this.setTitle("Create Marginote card");
    this.contentEl.addClass("marginote-authoring");
    this.contentEl.createEl("p", {
      text: `Anchor: ${this.context.snapshot.content.slice(this.context.snapshot.from, this.context.snapshot.to)}`,
    });
    const typeSetting = new Setting(this.contentEl).setName("Card type");
    new Setting(this.contentEl).setName("Title (optional)").addText((input) => {
      input.inputEl.setAttribute("aria-label", "Card title");
      input.setPlaceholder("Optional heading").onChange((value) => {
        this.title = value;
      });
    });
    const bodySetting = new Setting(this.contentEl)
      .setName("Card text")
      .setDesc("Markdown is supported.")
      .addTextArea((input) => {
        input.inputEl.setAttribute("aria-label", "Card text");
        input.inputEl.rows = 6;
        input.onChange((value) => {
          this.body = value;
        });
      });
    const imageSetting = new Setting(this.contentEl)
      .setName("Local image path")
      .setDesc("Choose an image already saved in this vault.")
      .addText((input) => {
        input.inputEl.setAttribute("aria-label", "Local image path");
        input.setPlaceholder("Attachments/photo.png").onChange((value) => {
          this.imagePath = value;
        });
      });
    imageSetting.settingEl.hide();
    typeSetting.addDropdown((input) => {
      input.selectEl.setAttribute("aria-label", "Card type");
      input
        .addOptions({ text: "Text", image: "Image", mixed: "Text and image" })
        .setValue(this.kind)
        .onChange((value) => {
          this.kind = value;
          bodySetting.settingEl.toggle(value !== "image");
          imageSetting.settingEl.toggle(value !== "text");
        });
    });
    this.errorEl = this.contentEl.createDiv({ cls: "marginote-authoring-error" });
    this.errorEl.setAttribute("role", "alert");
    new Setting(this.contentEl)
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()))
      .addButton((button) => {
        this.saveButton = button;
        button
          .setButtonText("Create card")
          .setCta()
          .onClick(() => {
            void this.submit();
          });
      });
  }

  private async submit(): Promise<void> {
    if (this.saving || !this.opened) return;
    const parsed = parseCardDraft({
      kind: this.kind,
      title: this.title,
      body: this.kind === "image" ? "" : this.body,
      imagePath: this.kind === "text" ? "" : this.imagePath,
    });
    if (!parsed.success) {
      this.errorEl?.setText(parsed.error.issues[0]?.message ?? "Check the card's fields.");
      return;
    }
    this.saving = true;
    this.saveButton?.setDisabled(true);
    this.errorEl?.setText("");
    try {
      const result = await createAndLink(
        this.context.snapshot,
        this.context.target,
        async () => {
          const snapshot = this.context.snapshot;
          const reference = await this.repository.create(
            parsed.data,
            snapshot.content.slice(snapshot.from, snapshot.to),
            snapshot.sourcePath,
          );
          return reference.file.path;
        },
        () => this.opened && this.context.isActive(),
      );
      switch (result.kind) {
        case "stale":
          this.errorEl?.setText(
            "The source or selection changed. Close this dialog and select the text again.",
          );
          break;
        case "saved":
          new Notice(
            `Card saved at ${result.path}. The source was left unchanged because the selection changed or creation was cancelled.`,
          );
          if (this.opened) this.close();
          break;
        case "linked":
          this.linked = true;
          this.close();
          new Notice("Annotation card created.");
          break;
        default:
          assertNever(result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (this.opened) this.errorEl?.setText(`Could not create the card: ${message}`);
      else new Notice(`Could not create the card: ${message}`);
    } finally {
      this.saving = false;
      this.saveButton?.setDisabled(false);
    }
  }

  override onClose(): void {
    if (!this.opened) return;
    this.opened = false;
    this.context.onClosed(this.linked);
    this.contentEl.empty();
  }
}
