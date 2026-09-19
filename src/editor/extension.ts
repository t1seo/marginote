import { type Extension, Prec, StateEffect } from "@codemirror/state";
import { type DecorationSet, type EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { PreviewRepository } from "../preview/repository";
import { type BindEditorAnchor, EditorAnchorBindings } from "./bindings";
import { buildEditorDecorations } from "./decorations";
import type { TextRange } from "./wiki-links";

const refreshAnnotations = StateEffect.define<boolean>();
const editors = new Set<AnnotationEditor>();

class AnnotationEditor {
  decorations: DecorationSet;
  private readonly bindings: EditorAnchorBindings;
  private held: TextRange | null = null;
  private pointerDown = false;
  private composing = false;
  private destroyed = false;
  private document: Document;
  private timer: number | null = null;
  private invalidateBindings = false;

  constructor(
    private readonly view: EditorView,
    private readonly repository: PreviewRepository,
    bindAnchor: BindEditorAnchor,
  ) {
    this.document = view.dom.ownerDocument;
    this.bindings = new EditorAnchorBindings(view, bindAnchor);
    const initial = buildEditorDecorations(view, repository, null, false, false);
    this.decorations = initial.decorations;
    this.bindings.setAnchors(initial.anchors);
    this.document.addEventListener("pointerup", this.pointerEnd);
    this.document.addEventListener("pointercancel", this.pointerCancel);
    editors.add(this);
  }

  update(update: ViewUpdate): void {
    this.moveDocument();
    if (update.docChanged) this.held = null;
    if (
      update.transactions.some((transaction) =>
        transaction.effects.some((effect) => effect.is(refreshAnnotations) && effect.value),
      )
    )
      this.bindings.clear();
    const next = buildEditorDecorations(
      this.view,
      this.repository,
      this.held,
      this.pointerDown,
      this.composing,
    );
    this.decorations = next.decorations;
    this.bindings.setAnchors(next.anchors);
  }

  docViewUpdate(): void {
    this.moveDocument();
    this.bindings.schedule();
  }

  pointerStart(event: PointerEvent): void {
    this.pointerDown = true;
    this.held = this.bindings.rangeForEvent(event);
  }

  keyboardStart(): void {
    this.held = null;
    this.queueRefresh();
  }

  compositionStart(): void {
    this.composing = true;
    this.held = null;
    this.bindings.clear();
    this.queueRefresh();
  }

  compositionEnd(): void {
    this.composing = false;
    this.queueRefresh(false, 30);
  }

  queueRefresh(invalidateBindings = false, delay = 0): void {
    const ownerWindow = this.document.defaultView;
    if (!ownerWindow || this.destroyed) return;
    this.invalidateBindings ||= invalidateBindings;
    if (this.timer !== null) ownerWindow.clearTimeout(this.timer);
    this.timer = ownerWindow.setTimeout(() => {
      this.timer = null;
      if (this.destroyed) return;
      if (!this.pointerDown && this.view.state.selection.ranges.some((range) => !range.empty)) {
        this.held = null;
      }
      const invalidate = this.invalidateBindings;
      this.invalidateBindings = false;
      this.view.dispatch({ effects: refreshAnnotations.of(invalidate) });
    }, delay);
  }

  private readonly pointerEnd = (): void => {
    if (!this.pointerDown) return;
    this.pointerDown = false;
    this.queueRefresh();
  };

  private readonly pointerCancel = (): void => {
    this.pointerDown = false;
    this.held = null;
    this.queueRefresh();
  };

  private moveDocument(): void {
    if (this.document === this.view.dom.ownerDocument) return;
    this.detachDocument();
    this.bindings.clear();
    this.document = this.view.dom.ownerDocument;
    this.document.addEventListener("pointerup", this.pointerEnd);
    this.document.addEventListener("pointercancel", this.pointerCancel);
  }

  private detachDocument(): void {
    this.document.removeEventListener("pointerup", this.pointerEnd);
    this.document.removeEventListener("pointercancel", this.pointerCancel);
    if (this.timer !== null) this.document.defaultView?.clearTimeout(this.timer);
    this.timer = null;
  }

  destroy(): void {
    this.destroyed = true;
    this.detachDocument();
    this.bindings.destroy();
    editors.delete(this);
  }
}

export function createAnnotationExtension(
  repository: PreviewRepository,
  bindAnchor: BindEditorAnchor,
): Extension {
  return Prec.lowest(
    ViewPlugin.define((view) => new AnnotationEditor(view, repository, bindAnchor), {
      decorations: (plugin) => plugin.decorations,
      eventObservers: {
        pointerdown(event) {
          this.pointerStart(event);
        },
        keydown() {
          this.keyboardStart();
        },
        compositionstart() {
          this.compositionStart();
        },
        compositionend() {
          this.compositionEnd();
        },
      },
    }),
  );
}

export function refreshAnnotationEditors(): void {
  for (const editor of editors) editor.queueRefresh(true);
}
