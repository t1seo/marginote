export class Component {
  static activeListeners = 0;
  private readonly children = new Set<Component>();
  private readonly disposers: Array<() => void> = [];
  private loaded = false;

  onload(): void {}
  onunload(): void {}

  load(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.onload();
    for (const child of this.children) child.load();
  }

  unload(): void {
    if (!this.loaded) return;
    this.loaded = false;
    this.onunload();
    for (const child of this.children) child.unload();
    this.children.clear();
    for (const dispose of this.disposers.splice(0).reverse()) dispose();
  }

  addChild<T extends Component>(child: T): T {
    this.children.add(child);
    if (this.loaded) child.load();
    return child;
  }

  removeChild(child: Component): void {
    this.children.delete(child);
    child.unload();
  }

  register(dispose: () => void): void {
    this.disposers.push(dispose);
  }

  registerDomEvent(
    target: EventTarget,
    name: string,
    callback: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void {
    target.addEventListener(name, callback, options);
    Component.activeListeners++;
    this.register(() => {
      target.removeEventListener(name, callback, options);
      Component.activeListeners--;
    });
  }
}

export const MarkdownRenderer = {
  render(
    _app: unknown,
    markdown: string,
    element: HTMLElement,
    _source: string,
    _scope: Component,
  ): Promise<void> {
    element.textContent = markdown;
    return Promise.resolve();
  },
};

export class Notice {
  constructor(message: string) {
    throw new TypeError(`Unexpected notice in the DOM fixture: ${message}`);
  }
}

export const Keymap = { isModEvent: () => false } as const;
