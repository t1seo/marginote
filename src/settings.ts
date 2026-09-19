import { type App, type Plugin, PluginSettingTab, Setting } from "obsidian";
import {
  type MarginoteSettings,
  PreviewSourceSchema,
  PreviewTriggerSchema,
  previewSummary,
} from "./preview/preferences";

export {
  HOVER_PREVIEW_DELAY_MS,
  type MarginoteSettings,
  type PreviewSource,
  type PreviewTrigger,
  parseSettings,
  SettingsSchema,
} from "./preview/preferences";

export class MarginoteSettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    plugin: Plugin,
    private readonly settings: MarginoteSettings,
    private readonly save: () => Promise<void>,
  ) {
    super(app, plugin);
  }

  override display(): void {
    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName("Preview content")
      .setDesc(
        "Annotation cards attach text or images to selected words. Ordinary note links show an excerpt from the existing note.",
      )
      .addDropdown((dropdown) => {
        dropdown.selectEl.setAttribute("aria-label", "Preview content");
        dropdown
          .addOption("cards", "Annotation cards only")
          .addOption("notes", "Ordinary note links only")
          .addOption("both", "Both")
          .setValue(this.settings.previewSource)
          .onChange(async (value) => {
            this.settings.previewSource = PreviewSourceSchema.parse(value);
            summary.setText(previewSummary(this.settings));
            await this.save();
          });
      });
    new Setting(this.containerEl)
      .setName("Automatic preview")
      .setDesc(
        "Click, tap, Enter or Space always opens a preview. Hold a modifier key while clicking to follow the link normally.",
      )
      .addDropdown((dropdown) => {
        dropdown.selectEl.setAttribute("aria-label", "Automatic preview");
        dropdown
          .addOption("hover", "On hover")
          .addOption("click", "Off")
          .addOption("nearby", "Near the text")
          .setValue(this.settings.previewTrigger)
          .onChange(async (value) => {
            this.settings.previewTrigger = PreviewTriggerSchema.parse(value);
            summary.setText(previewSummary(this.settings));
            await this.save();
          });
      });
    const summary = this.containerEl.createEl("p", {
      cls: "setting-item-description marginote-settings-summary",
      text: previewSummary(this.settings),
    });
    summary.setAttribute("aria-live", "polite");
  }
}
