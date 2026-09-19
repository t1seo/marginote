import type { EditorView } from "@codemirror/view";
import type { AnnotationBinding } from "../ui/anchor";
import type { EditorAnchor } from "./decorations";
import type { TextRange } from "./wiki-links";

export type BindEditorAnchor = (
  node: HTMLElement,
  linktext: string,
  sourcePath: string,
  restoreFocus: () => void,
) => AnnotationBinding;

type BoundAnchor = EditorAnchor & {
  readonly document: Document;
  readonly binding: AnnotationBinding;
};

function sameAnchor(previous: BoundAnchor, anchor: EditorAnchor, node: HTMLElement): boolean {
  return (
    previous.document === node.ownerDocument &&
    previous.link.from === anchor.link.from &&
    previous.link.to === anchor.link.to &&
    previous.link.linktext === anchor.link.linktext &&
    previous.sourcePath === anchor.sourcePath
  );
}

export class EditorAnchorBindings {
  private readonly bound = new Map<HTMLElement, BoundAnchor>();
  private anchors: ReadonlyMap<string, EditorAnchor> = new Map();
  private destroyed = false;

  constructor(
    private readonly view: EditorView,
    private readonly bindAnchor: BindEditorAnchor,
  ) {}

  setAnchors(anchors: ReadonlyMap<string, EditorAnchor>): void {
    this.anchors = anchors;
    if (anchors.size === 0) this.clear();
    this.schedule();
  }

  schedule(): void {
    this.view.requestMeasure({
      key: this,
      read: () => null,
      write: () => {
        if (this.destroyed) return;
        const nodes = this.view.contentDOM.querySelectorAll<HTMLElement>(
          "[data-marginote-editor-anchor]",
        );
        const current = new Map<HTMLElement, EditorAnchor>();
        for (const node of nodes) {
          const key = node.getAttribute("data-marginote-editor-anchor");
          const anchor = key === null ? undefined : this.anchors.get(key);
          if (anchor && this.view.contentDOM.contains(node)) current.set(node, anchor);
        }
        for (const [node, anchor] of current) {
          const previous = this.bound.get(node);
          if (previous && sameAnchor(previous, anchor, node)) {
            previous.binding.retarget(node);
            continue;
          }
          if (previous) {
            previous.binding.release();
            this.bound.delete(node);
          }
          const replacement = [...this.bound].find(
            ([oldNode, oldAnchor]) => !current.has(oldNode) && sameAnchor(oldAnchor, anchor, node),
          );
          if (replacement) {
            const [oldNode, oldAnchor] = replacement;
            oldAnchor.binding.retarget(node);
            this.bound.delete(oldNode);
            this.bound.set(node, oldAnchor);
          } else {
            this.bound.set(node, {
              ...anchor,
              document: node.ownerDocument,
              binding: this.bindAnchor(node, anchor.link.linktext, anchor.sourcePath, () =>
                this.focusAnchor(anchor),
              ),
            });
          }
        }
        for (const [node, previous] of this.bound) {
          if (current.has(node)) continue;
          previous.binding.release();
          this.bound.delete(node);
        }
      },
    });
  }

  rangeForEvent(event: Event): TextRange | null {
    const path = event.composedPath();
    for (const [node, anchor] of this.bound) {
      if (path.includes(node)) return anchor.link;
    }
    return null;
  }

  private focusAnchor(anchor: EditorAnchor): void {
    if (this.destroyed || !this.view.contentDOM.isConnected) return;
    const selection = this.view.state.selection;
    if (
      !this.view.composing &&
      !this.view.compositionStarted &&
      selection.ranges.length === 1 &&
      selection.main.empty &&
      (selection.main.head < anchor.link.from || selection.main.head > anchor.link.to)
    )
      this.view.dispatch({ selection: { anchor: anchor.link.labelFrom } });
    this.view.focus();
  }

  clear(): void {
    for (const anchor of this.bound.values()) anchor.binding.release();
    this.bound.clear();
  }

  destroy(): void {
    this.destroyed = true;
    this.anchors = new Map();
    this.clear();
  }
}
