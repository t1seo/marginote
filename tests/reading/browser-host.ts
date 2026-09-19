// This lifecycle shim tests the DOM adapter; actual Obsidian QA uses reading-popout.mjs.
export class MarkdownRenderChild {
  private readonly disposers: Array<() => void> = [];

  constructor(readonly containerEl: HTMLElement) {}

  onload(): void {}

  register(dispose: () => void): void {
    this.disposers.push(dispose);
  }

  unload(): void {
    for (const dispose of this.disposers.splice(0)) dispose();
  }
}
