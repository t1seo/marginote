import { type App, Component, Notice } from "obsidian";
import type { Point } from "../geometry";
import type { PreviewRepository } from "../preview/repository";
import type { MarginoteSettings } from "../settings";
import type { AnnotationAnchor } from "./anchor";
import { AutomaticPreview, type PreviewIntent } from "./automatic-preview";
import { previewDuration } from "./content";
import { visibleAnchorRects } from "./drawing";
import { CardOverlay } from "./overlay";

export class WindowController extends Component {
  readonly anchors = new Set<AnnotationAnchor>();
  private active: CardOverlay | null = null;
  private requested: AnnotationAnchor | null = null;
  private intent: PreviewIntent = "explicit";
  private revision = 0;
  private timer = 0;
  private duration = 10000;
  private readonly automatic: AutomaticPreview;

  constructor(
    private readonly app: App,
    private readonly repository: PreviewRepository,
    private readonly doc: Document,
    private readonly win: Window,
    settings: () => MarginoteSettings,
  ) {
    super();
    this.automatic = this.addChild(
      new AutomaticPreview(doc, win, this.anchors, settings, {
        current: () =>
          this.active
            ? { anchor: this.active.anchor, card: this.active.card, intent: this.intent }
            : null,
        open: (anchor, intent, point) => {
          if ((this.active || this.requested) && this.intent === "explicit") return;
          void this.open(anchor, intent, point, false);
        },
        close: () => {
          if (this.intent !== "explicit") this.close(false);
        },
        move: (point) => {
          this.active?.reposition(point);
          this.resetTimer();
        },
      }),
    );
  }

  override onload(): void {
    this.registerDomEvent(this.doc, "pointermove", (event) => this.automatic.pointer(event), {
      passive: true,
    });
    this.registerDomEvent(
      this.doc,
      "pointerdown",
      (event) => {
        this.automatic.reset();
        if (
          this.requested &&
          !this.active &&
          (this.intent !== "explicit" || !event.composedPath().includes(this.requested.node))
        )
          this.close(false);
        if (
          this.active &&
          !event.composedPath().includes(this.active.card) &&
          !event.composedPath().includes(this.active.anchor.node)
        )
          this.close(false);
        else if (this.active && event.composedPath().includes(this.active.card))
          this.intent = "explicit";
      },
      true,
    );
    this.registerDomEvent(
      this.doc,
      "keydown",
      (event) => {
        if (event.key === "Escape" && (this.active || this.requested)) {
          event.preventDefault();
          event.stopPropagation();
          const anchor = this.active?.anchor;
          const restore = this.intent === "explicit";
          this.automatic.suppress();
          this.close(false);
          if (restore) anchor?.focus();
        } else if (this.intent === "nearby") this.automatic.stop();
      },
      true,
    );
    this.registerDomEvent(this.doc, "selectionchange", () => {
      if (!this.doc.getSelection()?.isCollapsed && this.intent !== "explicit")
        this.automatic.stop();
    });
    this.registerDomEvent(
      this.doc,
      "scroll",
      (event) => {
        if (this.active && event.composedPath().includes(this.active.card)) return;
        this.active?.reposition();
        this.automatic.schedule();
      },
      { capture: true, passive: true },
    );
    this.registerDomEvent(this.win, "resize", () => {
      this.active?.reposition();
      this.automatic.schedule();
    });
    this.registerDomEvent(this.doc, "visibilitychange", () => this.close(false));
    this.registerDomEvent(this.win, "blur", () => this.close(false));
    this.registerDomEvent(this.doc, "mouseleave", () => this.automatic.stop());
    this.register(() => {
      this.close(false);
      this.anchors.clear();
    });
  }

  activate(anchor: AnnotationAnchor, keyboard: boolean): void {
    this.automatic.reset();
    if (this.active?.anchor === anchor && this.intent !== "nearby") {
      if (this.intent === "hover") {
        this.intent = "explicit";
        if (keyboard) this.active.card.querySelector<HTMLButtonElement>("button")?.focus();
      } else this.close(true);
      return;
    }
    const rect = visibleAnchorRects(anchor.node)[0];
    if (rect)
      void this.open(
        anchor,
        "explicit",
        { x: rect.left + rect.width / 2, y: rect.bottom },
        keyboard,
      );
  }

  retarget(anchor: AnnotationAnchor, changed: boolean): void {
    const active = this.active?.anchor === anchor;
    const expanded = active && this.intent !== "nearby" ? "true" : "false";
    if (anchor.node.getAttribute("aria-expanded") !== expanded)
      anchor.node.setAttribute("aria-expanded", expanded);
    if (active && changed) this.active?.retargetAnchor();
  }

  remove(anchor: AnnotationAnchor): void {
    if (this.active?.anchor === anchor || this.requested === anchor) this.close(false);
    this.anchors.delete(anchor);
  }

  refresh(): void {
    this.close(false);
    for (const anchor of this.anchors) anchor.refresh();
  }

  close(restoreFocus: boolean, resetAutomatic = true): void {
    this.revision++;
    this.win.clearTimeout(this.timer);
    if (resetAutomatic) this.automatic.reset();
    const active = this.active;
    this.active = null;
    this.requested = null;
    if (active) {
      active.anchor.node.setAttribute("aria-expanded", "false");
      this.removeChild(active);
      if (restoreFocus) active.anchor.focus();
    }
  }

  private resetTimer(): void {
    this.win.clearTimeout(this.timer);
    this.timer = this.win.setTimeout(() => this.close(false), this.duration);
  }

  private async open(
    anchor: AnnotationAnchor,
    intent: PreviewIntent,
    point: Point,
    keyboard: boolean,
  ): Promise<void> {
    if (this.requested === anchor && this.intent === intent) return;
    this.close(false, false);
    const reference = anchor.reference();
    if (!reference) return;
    const revision = this.revision;
    this.requested = anchor;
    this.intent = intent;
    try {
      const document = await this.repository.read(reference);
      if (revision !== this.revision || !anchor.node.isConnected) return;
      if (!document) {
        this.close(false);
        return;
      }
      const overlay = new CardOverlay(
        this.app,
        anchor,
        intent === "nearby" ? "preview" : "interactive",
        point,
        (restore) => this.close(restore),
      );
      this.active = overlay;
      this.addChild(overlay);
      anchor.node.setAttribute("aria-expanded", intent === "nearby" ? "false" : "true");
      await overlay.render(document, keyboard);
      if (revision !== this.revision) return;
      this.requested = null;
      this.duration = previewDuration(document.markdown);
      if (intent === "nearby") this.resetTimer();
    } catch (error) {
      if (revision !== this.revision) return;
      this.close(false);
      new Notice(
        error instanceof Error
          ? `Marginote: ${error.message}`
          : "Marginote could not open this preview.",
      );
    }
  }
}
