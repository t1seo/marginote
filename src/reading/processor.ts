import { MarkdownRenderChild, type Plugin } from "obsidian";
import type { AnnotationManager } from "../ui/manager";

class AnnotationSection extends MarkdownRenderChild {
  constructor(
    element: HTMLElement,
    private readonly sourcePath: string,
    private readonly manager: AnnotationManager,
  ) {
    super(element);
  }
  override onload(): void {
    for (const link of this.containerEl.querySelectorAll<HTMLElement>("a.internal-link")) {
      if (link.closest("code, pre, .internal-embed, .marginote-layer")) continue;
      const target = link.getAttribute("data-href") ?? link.getAttribute("href");
      if (target) this.register(this.manager.bindAnchor(link, target, this.sourcePath).release);
    }
  }
}

export function registerReadingView(plugin: Plugin, manager: AnnotationManager): void {
  plugin.registerMarkdownPostProcessor((element, context) => {
    if (element.closest(".marginote-layer")) return;
    context.addChild(new AnnotationSection(element, context.sourcePath, manager));
  });
}
