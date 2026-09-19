import { Component } from "obsidian";
import { compareProximity, getProximity, type Point, type Proximity } from "../geometry";
import { HOVER_PREVIEW_DELAY_MS } from "../preview/preferences";
import type { MarginoteSettings } from "../settings";
import type { AnnotationAnchor } from "./anchor";
import { anchorBounds, visibleAnchorRects } from "./drawing";

export type PreviewIntent = "nearby" | "hover" | "explicit";
export type ActivePreview = {
  readonly anchor: AnnotationAnchor;
  readonly card: HTMLElement;
  readonly intent: PreviewIntent;
};
type PreviewActions = {
  readonly current: () => ActivePreview | null;
  readonly open: (anchor: AnnotationAnchor, intent: "hover" | "nearby", point: Point) => void;
  readonly close: () => void;
  readonly hide: () => void;
  readonly move: (point: Point) => void;
};

export class AutomaticPreview extends Component {
  private point: Point | null = null;
  private frame = 0;
  private timer = 0;
  private leaveTimer = 0;
  private pending: AnnotationAnchor | null = null;
  private suppressed: AnnotationAnchor | null = null;

  constructor(
    private readonly doc: Document,
    private readonly win: Window,
    private readonly anchors: ReadonlySet<AnnotationAnchor>,
    private readonly settings: () => MarginoteSettings,
    private readonly actions: PreviewActions,
  ) {
    super();
  }

  override onload(): void {
    this.register(() => this.reset());
  }

  pointer(event: PointerEvent): void {
    if (event.pointerType !== "mouse" || event.buttons !== 0) {
      this.stop();
      return;
    }
    this.point = { x: event.clientX, y: event.clientY };
    this.schedule();
  }

  schedule(): void {
    if (this.frame) return;
    this.frame = this.win.requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
    });
  }

  suppress(): void {
    this.suppressed = this.actions.current()?.anchor ?? this.pending;
    this.stop();
  }

  stop(): void {
    this.reset();
    this.actions.close();
  }

  reset(): void {
    this.win.cancelAnimationFrame(this.frame);
    this.win.clearTimeout(this.timer);
    this.win.clearTimeout(this.leaveTimer);
    this.frame = 0;
    this.timer = 0;
    this.leaveTimer = 0;
    this.pending = null;
    this.point = null;
  }

  private update(): void {
    const point = this.point;
    const active = this.actions.current();
    if (active?.intent === "explicit") return;
    if (
      !point ||
      !this.win.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      !this.doc.getSelection()?.isCollapsed ||
      this.doc.querySelector(".modal-container, [aria-modal=true]")
    ) {
      this.stop();
      return;
    }
    switch (this.settings().previewTrigger) {
      case "click":
        this.stop();
        return;
      case "hover":
        this.hover(point, active);
        return;
      case "nearby":
        this.nearby(point, active);
        return;
    }
  }

  private hover(point: Point, active: ActivePreview | null): void {
    const target = this.doc.elementFromPoint(point.x, point.y);
    if (
      active?.intent === "hover" &&
      target &&
      (active.card.contains(target) || active.anchor.node.contains(target))
    ) {
      this.win.clearTimeout(this.leaveTimer);
      this.leaveTimer = 0;
      this.win.clearTimeout(this.timer);
      this.pending = null;
      return;
    }
    const anchor = [...this.anchors].find(
      (entry) => target && entry.node.contains(target) && entry.reference(),
    );
    if (anchor !== this.suppressed) this.suppressed = null;
    if (!anchor || anchor === this.suppressed) {
      this.win.clearTimeout(this.timer);
      this.pending = null;
      if (active?.intent === "hover" && !this.leaveTimer)
        this.leaveTimer = this.win.setTimeout(() => {
          this.leaveTimer = 0;
          if (this.actions.current()?.intent === "hover") this.actions.close();
        }, 220);
      if (!active) this.actions.close();
      return;
    }
    this.win.clearTimeout(this.leaveTimer);
    this.leaveTimer = 0;
    if (this.pending === anchor) return;
    this.win.clearTimeout(this.timer);
    this.pending = anchor;
    this.timer = this.win.setTimeout(() => {
      this.pending = null;
      const currentPoint = this.point;
      if (
        currentPoint &&
        anchor.node.isConnected &&
        anchor.reference() &&
        this.actions.current()?.anchor !== anchor
      ) {
        this.actions.open(anchor, "hover", currentPoint);
      }
    }, HOVER_PREVIEW_DELAY_MS);
  }

  private nearby(point: Point, active: ActivePreview | null): void {
    if (this.win.innerWidth < 768) {
      this.stop();
      return;
    }
    let best: { readonly anchor: AnnotationAnchor; readonly proximity: Proximity } | null = null;
    for (const anchor of this.anchors) {
      if (!anchor.node.isConnected || !anchor.reference()) continue;
      const bounds = anchorBounds(anchor.node);
      if (
        point.x < bounds.left ||
        point.x > bounds.right ||
        point.y < bounds.top ||
        point.y > bounds.bottom
      )
        continue;
      const proximity = getProximity(point, visibleAnchorRects(anchor.node));
      if (proximity && (!best || compareProximity(proximity, best.proximity) < 0))
        best = { anchor, proximity };
    }
    if (best?.anchor !== this.suppressed) this.suppressed = null;
    if (!best) {
      this.actions.hide();
      return;
    }
    if (best.anchor === this.suppressed) {
      this.stop();
      return;
    }
    if (active?.anchor === best.anchor) this.actions.move(point);
    else this.actions.open(best.anchor, "nearby", point);
  }
}
