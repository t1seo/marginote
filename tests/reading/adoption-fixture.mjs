export function mountReadingFixture() {
  const events = new Map();
  const disposers = [];
  const children = new Set();
  const bindings = new Set();
  const documents = new Map();
  const counts = { created: 0, released: 0, duplicateReleases: 0 };
  let process;
  let popup;

  function trackDocument(doc, name) {
    const stats = { name, created: 0, active: 0, disconnected: 0 };
    documents.set(doc, stats);
    const NativeObserver = doc.defaultView.MutationObserver;
    doc.defaultView.MutationObserver = class extends NativeObserver {
      stopped = false;
      constructor(callback) {
        super(callback);
        stats.created++;
        stats.active++;
      }
      disconnect() {
        if (!this.stopped) {
          this.stopped = true;
          stats.active--;
          stats.disconnected++;
        }
        super.disconnect();
      }
    };
  }

  function frame(name) {
    const element = document.createElement("iframe");
    document.body.append(element);
    trackDocument(element.contentDocument, name);
    return element;
  }

  trackDocument(document, "main");
  const existing = frame("existing");
  const workspace = {
    containerEl: document.body,
    iterateAllLeaves: (visit) => visit({ view: { containerEl: existing.contentDocument.body } }),
    on(name, callback) {
      const callbacks = events.get(name) ?? new Set();
      callbacks.add(callback);
      events.set(name, callbacks);
      return { name, callback };
    },
  };
  const plugin = {
    app: { workspace },
    register(dispose) {
      disposers.push(dispose);
    },
    registerEvent({ name, callback }) {
      disposers.push(() => events.get(name)?.delete(callback));
    },
    registerMarkdownPostProcessor(callback) {
      process = callback;
    },
  };
  const manager = {
    bindAnchor(node, linktext, sourcePath) {
      const binding = { node, linktext, sourcePath, owner: node.ownerDocument };
      bindings.add(binding);
      counts.created++;
      return {
        retarget(next) {
          binding.node = next;
        },
        release() {
          if (!bindings.delete(binding)) counts.duplicateReleases++;
          else counts.released++;
        },
      };
    },
  };
  ReadingHarness.registerReadingView(plugin, manager);

  function section(name, doc, connected) {
    const root = doc.createElement("p");
    root.dataset.section = name;
    const link = doc.createElement("a");
    link.className = "internal-link";
    link.setAttribute("data-href", "Annotations/Text");
    link.textContent = name;
    root.append(link);
    if (connected) doc.body.append(root);
    let component;
    process(root, {
      sourcePath: "Reading.md",
      addChild(child) {
        component = child;
        children.add(child);
        child.onload();
      },
    });
    return { root, unload: () => component.unload() };
  }

  const detached = section("detached", document, false);
  const connected = section("connected", document, true);
  const prior = section("prior", existing.contentDocument, true);
  const emit = (name, win) => {
    for (const callback of events.get(name) ?? []) callback({}, win);
  };
  window.readingFixture = {
    detached,
    connected,
    prior,
    snapshot: () => ({
      ...counts,
      active: bindings.size,
      mismatched: [...bindings].filter(({ node, owner }) => node.ownerDocument !== owner).length,
      owners: [...documents].map(([doc, stats]) => ({
        ...stats,
        bound: [...bindings].filter(({ owner }) => owner === doc).length,
      })),
    }),
    open() {
      popup = frame("popup");
      emit("window-open", popup.contentWindow);
      popup.contentDocument.body.append(popup.contentDocument.adoptNode(detached.root));
    },
    moveConnected() {
      popup.contentDocument.body.append(connected.root);
    },
    noise() {
      popup.contentDocument.body.append(popup.contentDocument.createElement("hr"));
      const parent = connected.root.parentNode;
      connected.root.remove();
      parent.append(connected.root);
    },
    moveBack() {
      document.body.append(connected.root);
    },
    close() {
      emit("window-close", popup.contentWindow);
    },
    queueThenUnload() {
      existing.contentDocument.body.append(connected.root);
      for (const dispose of disposers.splice(0)) dispose();
    },
    unloadChildren() {
      for (const child of children) child.unload();
    },
  };
}
