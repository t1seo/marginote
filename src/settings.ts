import {
  type App,
  type DropdownComponent,
  type Plugin,
  PluginSettingTab,
  Setting,
  type SettingDefinitionItem,
} from "obsidian";
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

const CONTENT_NAME = "Preview content";
const CONTENT_DESCRIPTION =
  "Annotation cards attach text or images to selected words. Ordinary note links show an excerpt from the existing note.";
const AUTOMATIC_NAME = "Automatic preview";
const AUTOMATIC_DESCRIPTION =
  "Click, tap, Enter or Space always opens a preview. Hold a modifier key while clicking to follow the link normally.";

export class MarginoteSettingsTab extends PluginSettingTab {
  private readonly refreshers = new Set<() => void>();
  private readonly legacyDisposers: Array<() => void> = [];

  constructor(
    app: App,
    plugin: Plugin,
    private readonly settings: MarginoteSettings,
    private readonly save: () => Promise<void>,
  ) {
    super(app, plugin);
    plugin.register(() => {
      this.hide();
      this.refreshers.clear();
    });
  }

  override getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: CONTENT_NAME,
        desc: CONTENT_DESCRIPTION,
        aliases: ["annotation", "word", "note", "link", "excerpt"],
        render: (setting) => this.renderContent(setting),
      },
      {
        name: AUTOMATIC_NAME,
        desc: AUTOMATIC_DESCRIPTION,
        aliases: ["hover", "click", "touch", "pointer", "nearby"],
        render: (setting) => this.renderAutomatic(setting),
      },
    ];
  }

  override display(): void {
    this.hide();
    this.containerEl.empty();
    this.legacyDisposers.push(
      this.renderContent(
        new Setting(this.containerEl).setName(CONTENT_NAME).setDesc(CONTENT_DESCRIPTION),
      ),
      this.renderAutomatic(
        new Setting(this.containerEl).setName(AUTOMATIC_NAME).setDesc(AUTOMATIC_DESCRIPTION),
      ),
    );
  }

  override hide(): void {
    for (const dispose of this.legacyDisposers.splice(0)) dispose();
  }

  private renderContent(setting: Setting): () => void {
    return this.addDropdown(setting, (dropdown) => {
      dropdown.selectEl.setAttribute("aria-label", CONTENT_NAME);
      dropdown
        .addOption("cards", "Annotation cards only")
        .addOption("notes", "Ordinary note links only")
        .addOption("both", "Both")
        .onChange(async (value) => {
          this.settings.previewSource = PreviewSourceSchema.parse(value);
          this.refresh();
          await this.save();
        });
      return () => {
        dropdown.setValue(this.settings.previewSource);
      };
    });
  }

  private renderAutomatic(setting: Setting): () => void {
    const summary = setting.infoEl.createEl("p", {
      cls: "setting-item-description marginote-settings-summary",
    });
    summary.setAttribute("aria-live", "polite");
    return this.addDropdown(setting, (dropdown) => {
      dropdown.selectEl.setAttribute("aria-label", AUTOMATIC_NAME);
      dropdown
        .addOption("nearby", "Near text · follows pointer")
        .addOption("hover", "Over link · stays in place")
        .addOption("click", "Off")
        .onChange(async (value) => {
          this.settings.previewTrigger = PreviewTriggerSchema.parse(value);
          this.refresh();
          await this.save();
        });
      return () => {
        dropdown.setValue(this.settings.previewTrigger);
        summary.setText(previewSummary(this.settings));
      };
    });
  }

  private addDropdown(
    setting: Setting,
    render: (dropdown: DropdownComponent) => () => void,
  ): () => void {
    let refresh: (() => void) | undefined;
    setting.addDropdown((dropdown) => {
      refresh = render(dropdown);
      this.refreshers.add(refresh);
      refresh();
    });
    return () => {
      if (refresh) this.refreshers.delete(refresh);
    };
  }

  private refresh(): void {
    for (const refresh of this.refreshers) refresh();
  }
}
