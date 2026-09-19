export function mountNearbyFixture({ secondary = false, trigger = "nearby" } = {}) {
  function createElement(tag, options) {
    const element = document.createElement(tag);
    if (options?.text) element.textContent = options.text;
    if (options?.cls) element.className = options.cls;
    return element;
  }
  HTMLElement.prototype.createEl = function (tag, options) {
    const child = createElement(tag, options);
    this.append(child);
    return child;
  };
  HTMLElement.prototype.createDiv = function (options) {
    return this.createEl("div", options);
  };
  Element.prototype.createSvg = function (tag) {
    const child = this.ownerDocument.createElementNS("http://www.w3.org/2000/svg", tag);
    this.append(child);
    return child;
  };
  window.createDiv = () => createElement("div");
  window.createEl = createElement;

  const pane = document.createElement("main");
  pane.className = "workspace-leaf-content";
  const scroller = document.createElement("div");
  scroller.id = "scroller";
  const content = document.createElement("div");
  content.id = "content";
  scroller.append(content);
  pane.append(scroller);
  document.body.append(pane);
  const style = document.createElement("style");
  style.textContent = `
    body { margin: 0; }
    .workspace-leaf-content { width: 1000px; height: 500px; }
    #scroller { position: relative; height: 500px; overflow: auto; }
    #content { position: relative; height: 1800px; }
    #anchor { position: absolute; left: 200px; top: 600px; width: 100px; height: 25px; }
    #secondary { position: absolute; left: 100px; top: 1500px; }
    .marginote-layer { position: fixed; inset: 0; pointer-events: none; }
    .marginote-card { position: absolute; width: 160px; height: 90px; background: white; }
    .marginote-layer.is-interactive .marginote-card { pointer-events: auto; }
    .marginote-connector { position: absolute; inset: 0; width: 100%; height: 100%; }
  `;
  document.head.append(style);
  const app = {
    metadataCache: { getFirstLinkpathDest: () => null },
    workspace: { getLeavesOfType: () => [], openLinkText: () => Promise.resolve() },
  };
  const repository = {
    resolve: (name) => ({ kind: "text", file: { path: `${name}.md`, basename: name } }),
    read: async (reference) => ({ ...reference, markdown: "A short local preview." }),
  };
  const manager = new NearbyHarness.AnnotationManager(app, repository, () => ({
    previewSource: "cards",
    previewTrigger: trigger,
  }));
  manager.load();
  function addAnchor(id) {
    const node = createElement("a", { text: id });
    node.id = id;
    content.append(node);
    return { node, binding: manager.bindAnchor(node, id, "Fixture.md") };
  }
  let anchor = addAnchor("anchor");
  if (secondary) addAnchor("secondary");
  let pointerMoves = 0;
  const trackPointer = () => pointerMoves++;
  document.addEventListener("pointermove", trackPointer);
  window.nearbyFixture = {
    manager,
    scroll(top) {
      scroller.scrollTop = top;
    },
    rebind() {
      anchor.node.remove();
      anchor.binding.release();
      anchor = addAnchor("anchor");
    },
    retarget() {
      const next = createElement("a", { text: "anchor" });
      next.id = "anchor";
      anchor.node.remove();
      anchor.binding.retarget(next);
      content.append(next);
      anchor = { node: next, binding: anchor.binding };
      anchor.binding.retarget(next);
    },
    select() {
      const range = document.createRange();
      range.selectNodeContents(anchor.node);
      const selection = document.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    },
    modal(show) {
      if (show) {
        const modal = document.createElement("div");
        modal.className = "modal-container";
        document.body.append(modal);
      } else document.querySelector(".modal-container")?.remove();
    },
    snapshot() {
      const card = document.querySelector(".marginote-card");
      const controller = manager.controllers.get(document);
      return {
        cards: document.querySelectorAll(".marginote-card").length,
        point: controller?.automatic.point ?? null,
        controllers: manager.controllers.size,
        anchors: controller?.anchors.size ?? 0,
        intent: controller?.intent ?? null,
        pointerMoves,
        left: card?.getBoundingClientRect().left ?? null,
        top: card?.getBoundingClientRect().top ?? null,
        listeners: NearbyHarness.Component.activeListeners,
      };
    },
    releaseDocument() {
      manager.releaseDocument(document);
    },
    releaseBinding() {
      anchor.binding.release();
    },
    unload() {
      manager.unload();
      document.removeEventListener("pointermove", trackPointer);
    },
  };
}
