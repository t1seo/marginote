import { Notice, Plugin } from "obsidian";
import { registerAuthoring } from "./authoring/commands";
import { CardRepository } from "./cards/repository";
import { createAnnotationExtension, refreshAnnotationEditors } from "./editor/extension";
import { PreviewRepository } from "./preview/repository";
import { registerReadingView } from "./reading/processor";
import { MarginoteSettingsTab, parseSettings } from "./settings";
import { AnnotationManager } from "./ui/manager";

export default class MarginotePlugin extends Plugin {
  override async onload(): Promise<void> {
    const settings = parseSettings(await this.loadData());
    const repository = new CardRepository(this.app);
    const previews = new PreviewRepository(this.app, repository, () => settings);
    const manager = this.addChild(new AnnotationManager(this.app, previews, () => settings));
    registerAuthoring(this, repository);
    registerReadingView(this, manager);
    this.registerEditorExtension(
      createAnnotationExtension(previews, (node, linktext, sourcePath, restoreFocus) =>
        manager.bindAnchor(node, linktext, sourcePath, restoreFocus),
      ),
    );
    const refresh = () => {
      manager.refresh();
      refreshAnnotationEditors();
    };
    this.registerEvent(this.app.metadataCache.on("changed", refresh));
    this.registerEvent(this.app.metadataCache.on("resolved", refresh));
    this.registerEvent(this.app.vault.on("rename", refresh));
    this.registerEvent(this.app.vault.on("delete", refresh));
    this.registerEvent(
      this.app.workspace.on("window-close", (_window, win) =>
        manager.releaseDocument(win.document),
      ),
    );
    this.addSettingTab(
      new MarginoteSettingsTab(this.app, this, settings, async () => {
        try {
          await this.saveData(settings);
        } catch {
          new Notice("Marginote could not save settings. Your choices apply to this session only.");
        }
        refresh();
      }),
    );
  }
}
