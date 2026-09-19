import { Component } from "obsidian";
import type { PreviewReference, PreviewRepository } from "../preview/repository";

export type CardMode = "preview" | "interactive";

export type AnnotationBinding = {
  readonly retarget: (node: HTMLElement) => void;
  readonly release: () => void;
};

export class AnnotationAnchor extends Component {
  private readonly attributes = new Map<string, string | null>();
  private hadClass = false;
  private scope: Component | null = null;

  constructor(
    private currentNode: HTMLElement,
    readonly linktext: string,
    readonly sourcePath: string,
    private readonly repository: PreviewRepository,
    private readonly activate: (keyboard: boolean) => void,
    private readonly restoreFocus?: () => void,
  ) {
    super();
  }

  get node(): HTMLElement {
    return this.currentNode;
  }

  retarget(node: HTMLElement): void {
    if (node === this.currentNode) {
      this.refresh();
      return;
    }
    const scope = this.scope;
    if (scope) this.removeChild(scope);
    this.currentNode = node;
    if (scope) this.attachNode();
  }

  focus(): void {
    if (!this.node.isConnected) return;
    if (this.restoreFocus) this.restoreFocus();
    else this.node.focus({ preventScroll: true });
  }

  reference(): PreviewReference | null {
    return this.repository.resolve(this.linktext, this.sourcePath);
  }

  refresh(): void {
    if (!this.reference()) {
      this.restore();
      return;
    }
    this.node.classList.add("marginote-anchor");
    this.node.setAttribute("tabindex", "0");
    this.node.setAttribute("aria-haspopup", "dialog");
    if (!this.node.hasAttribute("aria-expanded")) this.node.setAttribute("aria-expanded", "false");
    if (this.node.tagName !== "A") this.node.setAttribute("role", "link");
  }

  override onload(): void {
    this.attachNode();
  }

  override onunload(): void {
    this.scope = null;
  }

  private attachNode(): void {
    this.hadClass = this.node.classList.contains("marginote-anchor");
    this.attributes.clear();
    for (const key of ["tabindex", "aria-haspopup", "aria-expanded", "role"]) {
      this.attributes.set(key, this.node.getAttribute(key));
    }
    const scope = this.addChild(new Component());
    this.scope = scope;
    this.refresh();
    scope.registerDomEvent(
      this.node,
      "click",
      (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        if (!this.reference() || !this.node.ownerDocument.getSelection()?.isCollapsed) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.activate(event.detail === 0);
      },
      true,
    );
    scope.registerDomEvent(
      this.node,
      "keydown",
      (event) => {
        if (
          (event.key !== "Enter" && event.key !== " ") ||
          event.isComposing ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          !this.reference()
        )
          return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.activate(true);
      },
      true,
    );
    scope.registerDomEvent(this.node, "mouseover", (event) => {
      if (this.reference()) event.stopPropagation();
    });
    scope.register(() => this.restore());
  }

  private restore(): void {
    if (!this.hadClass) this.node.classList.remove("marginote-anchor");
    for (const [name, value] of this.attributes) {
      if (value === null) this.node.removeAttribute(name);
      else this.node.setAttribute(name, value);
    }
  }
}
