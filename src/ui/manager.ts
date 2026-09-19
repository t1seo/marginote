import { type App, Component } from "obsidian";
import type { PreviewRepository } from "../preview/repository";
import type { MarginoteSettings } from "../settings";
import { AnnotationAnchor, type AnnotationBinding } from "./anchor";
import { WindowController } from "./window-controller";

export class AnnotationManager extends Component {
  private readonly controllers = new Map<Document, WindowController>();
  constructor(
    private readonly app: App,
    private readonly repository: PreviewRepository,
    private readonly settings: () => MarginoteSettings,
  ) {
    super();
  }

  bindAnchor(
    node: HTMLElement,
    linktext: string,
    sourcePath: string,
    restoreFocus?: () => void,
  ): AnnotationBinding {
    const doc = node.ownerDocument;
    const win = doc.defaultView;
    if (!win) return { retarget: () => {}, release: () => {} };
    let controller = this.controllers.get(doc);
    if (!controller) {
      controller = this.addChild(
        new WindowController(this.app, this.repository, doc, win, this.settings),
      );
      this.controllers.set(doc, controller);
    }
    const owner = controller;
    const anchor = owner.addChild(
      new AnnotationAnchor(
        node,
        linktext,
        sourcePath,
        this.repository,
        (keyboard) => owner.activate(anchor, keyboard),
        restoreFocus,
      ),
    );
    owner.anchors.add(anchor);
    let released = false;
    return {
      retarget: (nextNode) => {
        if (released) return;
        const changed = anchor.node !== nextNode;
        anchor.retarget(nextNode);
        owner.retarget(anchor, changed);
      },
      release: () => {
        if (released) return;
        released = true;
        owner.remove(anchor);
        owner.removeChild(anchor);
        if (owner.anchors.size === 0 && this.controllers.get(doc) === owner)
          this.releaseDocument(doc);
      },
    };
  }

  refresh(): void {
    for (const controller of this.controllers.values()) controller.refresh();
  }

  releaseDocument(doc: Document): void {
    const controller = this.controllers.get(doc);
    if (!controller) return;
    this.controllers.delete(doc);
    this.removeChild(controller);
  }

  override onunload(): void {
    this.controllers.clear();
  }
}
