import type { AnnotationBinding } from "../ui/anchor";

type BindReadingAnchor = (
  node: HTMLElement,
  linktext: string,
  sourcePath: string,
) => AnnotationBinding;

type ReadingSection = {
  readonly element: HTMLElement;
  readonly sourcePath: string;
  readonly bindings: AnnotationBinding[];
  document: Document;
};

export class ReadingAnchorBindings {
  private readonly sections = new Set<ReadingSection>();
  private readonly documents = new Map<Document, MutationObserver>();
  private destroyed = false;

  constructor(private readonly bindAnchor: BindReadingAnchor) {}

  observeDocument(doc: Document): void {
    if (this.destroyed || this.documents.has(doc) || !doc.defaultView || doc.defaultView.closed)
      return;
    const observer = new doc.defaultView.MutationObserver(() => this.refreshOwners());
    observer.observe(doc, { childList: true, subtree: true });
    this.documents.set(doc, observer);
  }

  addSection(element: HTMLElement, sourcePath: string): () => void {
    if (this.destroyed) return () => {};
    const section: ReadingSection = {
      element,
      sourcePath,
      document: element.ownerDocument,
      bindings: [],
    };
    this.sections.add(section);
    this.observeDocument(section.document);
    this.bindSection(section);
    return () => this.releaseSection(section);
  }

  releaseDocument(doc: Document): void {
    this.refreshOwners();
    this.documents.get(doc)?.disconnect();
    this.documents.delete(doc);
    for (const section of this.sections) {
      if (section.document === doc) this.releaseSection(section);
    }
  }

  destroy(): void {
    this.destroyed = true;
    for (const observer of this.documents.values()) observer.disconnect();
    this.documents.clear();
    for (const section of this.sections) this.releaseSection(section);
  }

  private refreshOwners(): void {
    if (this.destroyed) return;
    for (const section of this.sections) {
      const nextDocument = section.element.ownerDocument;
      if (section.document === nextDocument) continue;
      for (const binding of section.bindings.splice(0)) binding.release();
      section.document = nextDocument;
      this.observeDocument(nextDocument);
      this.bindSection(section);
    }
  }

  private bindSection(section: ReadingSection): void {
    for (const link of section.element.querySelectorAll<HTMLElement>("a.internal-link")) {
      if (link.closest("code, pre, .internal-embed, .marginote-layer")) continue;
      const target = link.getAttribute("data-href") ?? link.getAttribute("href");
      if (target) section.bindings.push(this.bindAnchor(link, target, section.sourcePath));
    }
  }

  private releaseSection(section: ReadingSection): void {
    if (!this.sections.delete(section)) return;
    for (const binding of section.bindings.splice(0)) binding.release();
  }
}
