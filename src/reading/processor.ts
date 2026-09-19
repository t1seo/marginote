import { MarkdownRenderChild, type Plugin } from "obsidian";
import type { AnnotationManager } from "../ui/manager";
import { ReadingAnchorBindings } from "./bindings";

class AnnotationSection extends MarkdownRenderChild {
  constructor(
    element: HTMLElement,
    private readonly sourcePath: string,
    private readonly bindings: ReadingAnchorBindings,
  ) {
    super(element);
  }
  override onload(): void {
    this.register(this.bindings.addSection(this.containerEl, this.sourcePath));
  }
}

export function registerReadingView(plugin: Plugin, manager: AnnotationManager): void {
  const bindings = new ReadingAnchorBindings((node, linktext, sourcePath) =>
    manager.bindAnchor(node, linktext, sourcePath),
  );
  const workspace = plugin.app.workspace;
  bindings.observeDocument(workspace.containerEl.ownerDocument);
  workspace.iterateAllLeaves((leaf) =>
    bindings.observeDocument(leaf.view.containerEl.ownerDocument),
  );
  plugin.registerEvent(
    workspace.on("window-open", (_window, win) => bindings.observeDocument(win.document)),
  );
  plugin.registerEvent(
    workspace.on("window-close", (_window, win) => bindings.releaseDocument(win.document)),
  );
  plugin.register(() => bindings.destroy());
  plugin.registerMarkdownPostProcessor((element, context) => {
    if (element.closest(".marginote-layer")) return;
    context.addChild(new AnnotationSection(element, context.sourcePath, bindings));
  });
}
