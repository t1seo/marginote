import { type App, Component, Keymap, MarkdownRenderer, Notice } from "obsidian";
import { getPreviewPosition, type Point } from "../geometry";
import type { PreviewDocument } from "../preview/repository";
import type { AnnotationAnchor, CardMode } from "./anchor";
import { prepareCardMarkdown } from "./content";
import { anchorBounds, drawConnector, visibleAnchorRects } from "./drawing";

export class CardOverlay extends Component {
  readonly layer: HTMLDivElement;
  readonly card: HTMLDivElement;
  private readonly svg: SVGSVGElement;
  private readonly content: HTMLDivElement;
  private disposed = false;
  private point: Point;
  private resizeObserver: ResizeObserver | null = null;
  private observedPane: Element | null = null;

  constructor(
    private readonly app: App,
    readonly anchor: AnnotationAnchor,
    readonly mode: CardMode,
    point: Point,
    private readonly close: (restoreFocus: boolean) => void,
  ) {
    super();
    this.point = point;
    const doc = anchor.node.ownerDocument;
    const win = doc.defaultView;
    if (!win) throw new TypeError("Cannot create a preview in a detached document.");
    this.layer = win.createDiv();
    this.layer.className = `marginote-layer is-${mode}`;
    this.svg = this.layer.createSvg("svg");
    this.svg.classList.add("marginote-connector");
    this.svg.setAttribute("aria-hidden", "true");
    this.card = this.layer.createDiv();
    this.card.className = "marginote-card";
    this.content = this.card.createDiv();
    this.content.className = "marginote-content markdown-rendered";
    if (mode === "preview") {
      this.layer.setAttribute("aria-hidden", "true");
      this.layer.inert = true;
    } else {
      this.card.setAttribute("role", "dialog");
      this.card.setAttribute("aria-label", anchor.node.textContent || "Annotation");
      this.card.tabIndex = -1;
    }
  }

  override onload(): void {
    this.layer.ownerDocument.body.append(this.layer);
    const win = this.layer.ownerDocument.defaultView;
    if (win) {
      const observer = new win.ResizeObserver(() => this.reposition());
      this.resizeObserver = observer;
      observer.observe(this.card);
      this.register(() => {
        observer.disconnect();
        this.resizeObserver = null;
        this.observedPane = null;
      });
    }
    this.registerDomEvent(this.content, "load", () => this.reposition(), true);
    this.registerDomEvent(
      this.content,
      "error",
      (event) => {
        const image = event.target;
        if (win && image instanceof win.HTMLImageElement) {
          const fallback = win.createEl("p");
          fallback.className = "marginote-unavailable";
          fallback.textContent = `Image unavailable: ${image.alt || "local image"}`;
          image.replaceWith(fallback);
        }
        this.reposition();
      },
      true,
    );
    this.retargetAnchor();
  }

  retargetAnchor(): void {
    const pane = this.anchor.node.closest(".workspace-leaf-content");
    if (pane !== this.observedPane) {
      if (this.observedPane) this.resizeObserver?.unobserve(this.observedPane);
      if (pane) this.resizeObserver?.observe(pane);
      this.observedPane = pane;
    }
    if (this.mode === "interactive")
      this.card.setAttribute("aria-label", this.anchor.node.textContent || "Annotation");
    this.reposition();
  }

  async render(document: PreviewDocument, keyboard: boolean): Promise<void> {
    this.card.setAttribute("data-kind", document.kind);
    if (this.mode === "interactive") {
      this.addControls(document);
      this.addLinkNavigation(document.file.path);
    }
    if (document.kind === "note") {
      const heading = this.card.createDiv();
      heading.className = "marginote-note-meta";
      const title = heading.createEl("strong", { text: document.file.basename });
      title.className = "marginote-note-title";
      heading.createEl("small", { text: document.file.path });
      this.content.before(heading);
    }
    const markdown = prepareCardMarkdown(document.markdown, (path) => {
      const file = this.app.metadataCache.getFirstLinkpathDest(path, document.file.path);
      return file !== null && /^(avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(file.extension);
    });
    const scope = new Component();
    scope.load();
    try {
      await MarkdownRenderer.render(this.app, markdown, this.content, document.file.path, scope);
      if (this.disposed) {
        scope.unload();
        return;
      }
      this.addChild(scope);
      if (document.kind === "note" && !document.markdown.trim()) {
        this.content.createEl("p", {
          cls: "marginote-empty-note",
          text: "This note is empty.",
        });
      }
      if (document.kind === "note" && document.truncated) {
        this.content.createEl("p", {
          cls: "marginote-excerpt-note",
          text: "Preview excerpt. Open the note to keep reading.",
        });
      }
      this.reposition();
      if (keyboard) this.card.querySelector<HTMLButtonElement>("button")?.focus();
    } catch (error) {
      scope.unload();
      throw error;
    }
  }

  reposition(point?: Point): void {
    if (this.disposed) return;
    if (point) this.point = point;
    const rects = visibleAnchorRects(this.anchor.node);
    if (!this.anchor.node.isConnected || rects.length === 0) {
      this.close(false);
      return;
    }
    const bounds = anchorBounds(this.anchor.node);
    this.card.style.maxWidth = `${Math.max(1, bounds.width - 16)}px`;
    this.card.style.maxHeight = `${Math.max(1, bounds.height - 16)}px`;
    const size = this.card.getBoundingClientRect();
    const position = getPreviewPosition({
      pointer: this.point,
      anchorRects: rects,
      cardSize: size,
      bounds,
    });
    this.card.style.left = `${position.left}px`;
    this.card.style.top = `${position.top}px`;
    drawConnector(this.svg, rects, this.card.getBoundingClientRect());
  }

  private addControls(document: PreviewDocument): void {
    const controls = this.card.createDiv();
    controls.className = "marginote-controls";
    const edit = controls.createEl("button");
    edit.textContent = document.kind === "note" ? "Open note" : "Edit card";
    edit.type = "button";
    const close = controls.createEl("button");
    close.textContent = "Close";
    close.setAttribute("aria-label", "Close annotation");
    close.type = "button";
    this.card.prepend(controls);
    this.registerDomEvent(close, "click", () => this.close(true));
    this.registerDomEvent(edit, "click", () => {
      const owner = this.app.workspace
        .getLeavesOfType("markdown")
        .find((leaf) => leaf.view.containerEl.contains(this.anchor.node));
      this.close(false);
      const open = owner
        ? owner.openFile(document.file)
        : this.app.workspace.openLinkText(document.file.path, this.anchor.sourcePath, false);
      void open.catch((error: unknown) => {
        new Notice(
          error instanceof Error ? `Marginote: ${error.message}` : "Could not open the note.",
        );
      });
    });
  }

  private addLinkNavigation(sourcePath: string): void {
    const follow = (event: MouseEvent) => {
      const win = this.content.ownerDocument.defaultView;
      if (!win || !(event.target instanceof win.Element)) return;
      if (event.button !== 0 && event.button !== 1) return;
      if (!this.content.ownerDocument.getSelection()?.isCollapsed) return;
      const link = event.target.closest<HTMLAnchorElement>("a.internal-link");
      const target = link?.getAttribute("data-href") ?? link?.getAttribute("href");
      if (!link || !this.content.contains(link) || !target) return;
      event.preventDefault();
      event.stopPropagation();
      const owner = this.app.workspace
        .getLeavesOfType("markdown")
        .find((leaf) => leaf.view.containerEl.contains(this.anchor.node));
      const disposition = Keymap.isModEvent(event);
      this.close(false);
      if (owner) this.app.workspace.setActiveLeaf(owner, { focus: true });
      void this.app.workspace.openLinkText(target, sourcePath, disposition).catch(() => {
        new Notice("Marginote could not open this link.");
      });
    };
    this.registerDomEvent(this.content, "click", follow);
    this.registerDomEvent(this.content, "auxclick", follow);
  }

  override onunload(): void {
    this.disposed = true;
    this.layer.remove();
  }
}
