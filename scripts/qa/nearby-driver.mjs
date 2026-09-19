import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openNote } from "./preview-driver.mjs";

export async function createNearbyFixture(page, run) {
  const source = `${run}.md`;
  const card = `Annotations/${run} card.md`;
  const paragraphs = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus sit amet lectus malesuada gravida. Integer vitae lacus ac mauris malesuada consequat. Aenean euismod, turpis nec faucibus tincidunt, lacus justo sollicitudin orci, vitae placerat mi ligula sed sapien. Donec quis augue vel magna posuere tincidunt.",
    "Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nulla vitae elit libero, a pharetra augue. Cras mattis consectetur purus sit amet fermentum. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Curabitur blandit tempus porttitor.",
    "Aliquam erat volutpat. Phasellus lacinia, nisl sed interdum consectetur, augue nibh suscipit lorem, a pellentesque metus erat in augue. Vivamus at velit eu turpis tincidunt egestas. In posuere arcu sed sapien sodales, ac porta urna interdum. Mauris eu nibh vitae lacus ornare pellentesque.",
  ];
  const filler = Array.from({ length: 18 }, (_, index) => paragraphs[index % paragraphs.length]);
  const markdown = `# Nearby reading study\n\n${filler.join("\n\n")}\n\nOne [[${card.slice(0, -3)}|linked idea]] keeps this explanation close.\n\n${filler.reverse().join("\n\n")}\n`;
  const originals = {
    [source]: markdown,
    [card]: `---\nmarginote-card: 1\nmarginote-id: ${randomUUID()}\nmarginote-kind: text\n---\nA short explanation stays beside the linked idea while the pointer moves through the surrounding passage.\n`,
  };
  await page.evaluate(async (files) => {
    for (const [path, text] of Object.entries(files)) await app.vault.create(path, text);
  }, originals);
  await page.waitForFunction(
    ({ source, card }) => app.metadataCache.resolvedLinks[source]?.[card] === 1,
    { source, card },
  );
  return { source, card, originals };
}

export function nearbyAnchor(page, fixture, mode) {
  return mode === "source"
    ? page.locator("[data-marginote-editor-anchor]").filter({ hasText: "linked idea" })
    : page.locator(`.markdown-preview-view:visible a[data-href="${fixture.card.slice(0, -3)}"]`);
}

export function scroller(page, mode) {
  return page.locator(
    mode === "source" ? ".cm-scroller:visible" : ".markdown-preview-view:visible",
  );
}

export async function settle(page, delay = 100) {
  await page.evaluate((delay) => new Promise((resolve) => setTimeout(resolve, delay)), delay);
}

export async function positionAnchor(page, fixture, mode) {
  const scroll = scroller(page, mode);
  await scroll.evaluate((node) => {
    node.scrollTop = (node.scrollHeight - node.clientHeight) / 2;
  });
  const anchor = nearbyAnchor(page, fixture, mode);
  await anchor.waitFor({ state: "visible" });
  await anchor.evaluate((node, mode) => {
    const scroll = node.closest(mode === "source" ? ".cm-scroller" : ".markdown-preview-view");
    scroll.scrollTop += node.getBoundingClientRect().top - 300;
  }, mode);
  await settle(page, 200);
  const rect = await anchor.boundingBox();
  assert.ok(rect);
  const top = await scroll.evaluate((node) => node.scrollTop);
  return {
    top,
    rect,
    first: { x: rect.x + rect.width + 150, y: rect.y + rect.height + 50 },
    second: { x: rect.x + rect.width + 260, y: rect.y + rect.height + 70 },
  };
}

export async function openNearbyMode(page, fixture, mode) {
  await openNote(page, fixture.source, mode);
  if (mode === "source") {
    await page.evaluate(() => app.workspace.activeEditor.editor.setCursor({ line: 0, ch: 0 }));
  }
  return positionAnchor(page, fixture, mode);
}

export async function nearbySnapshot(page, fixture, mode) {
  return page.evaluate(
    ({ source, target, mode }) => {
      const manager = app.plugins.plugins.marginote._children.find(
        (child) => typeof child.controllers?.get === "function",
      );
      const owner = manager.controllers.get(document);
      const node = [
        ...document.querySelectorAll(
          mode === "source" ? "[data-marginote-editor-anchor]" : "a[data-href]",
        ),
      ].find((node) =>
        mode === "source"
          ? node.textContent === "linked idea"
          : node.getAttribute("data-href") === target,
      );
      const rect = (element) => {
        if (!element) return null;
        const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
        return { left, top, right, bottom, width, height };
      };
      const card = document.querySelector(".marginote-card");
      const pane = node?.closest(".workspace-leaf-content");
      const line = document.querySelector(".marginote-connector line");
      const editor = app.workspace.activeEditor?.editor;
      return {
        source,
        mode,
        activeFile: app.workspace.getActiveFile()?.path,
        anchor: rect(node),
        anchorConnected: node?.isConnected ?? false,
        cards: document.querySelectorAll(".marginote-card").length,
        card: rect(card),
        pane: rect(pane),
        connector: line
          ? { x: Number(line.getAttribute("x2")), y: Number(line.getAttribute("y2")) }
          : null,
        intent: owner?.active ? owner.intent : null,
        point: owner?.automatic.point ?? null,
        pending: Boolean(owner?.requested || owner?.automatic.pending),
        suppressed: owner?.automatic.suppressed?.linktext ?? null,
        selected: getSelection()?.toString() ?? "",
        selections: mode === "source" ? editor?.listSelections() : null,
        pointerEvents:
          window.marginoteNearbyEvents?.events.filter((event) => event.type === "pointermove")
            .length ?? 0,
        owners: [...manager.controllers.entries()].map(([doc, controller]) => ({
          current: doc === document,
          closed: doc.defaultView?.closed ?? true,
          anchors: controller.anchors.size,
          mismatches: [...controller.anchors].filter((anchor) => anchor.node.ownerDocument !== doc)
            .length,
          activeInOwner: !controller.active || controller.active.card.ownerDocument === doc,
        })),
      };
    },
    { source: fixture.source, target: fixture.card.slice(0, -3), mode },
  );
}

export function connectedInsidePane(state) {
  const { card, pane, connector } = state;
  return (
    state.cards === 1 &&
    card &&
    pane &&
    connector &&
    card.left >= pane.left &&
    card.top >= pane.top &&
    card.right <= pane.right + 1 &&
    card.bottom <= pane.bottom + 1 &&
    Math.min(Math.abs(connector.x - card.left), Math.abs(connector.x - card.right)) < 1 &&
    Math.min(Math.abs(connector.y - card.top), Math.abs(connector.y - card.bottom)) < 1 &&
    state.owners.every((owner) => owner.mismatches === 0 && owner.activeInOwner)
  );
}

export async function nearbyGuards(page, fixture, mode) {
  const placement = await positionAnchor(page, fixture, mode);
  const move = async (point) => {
    await page.mouse.move(point.x, point.y);
    await settle(page, 350);
  };
  await move({ x: 20, y: 20 });
  await move(placement.first);
  const before = await nearbySnapshot(page, fixture, mode);
  const line = fixture.originals[fixture.source]
    .split("\n")
    .findIndex((text) => text.startsWith("One [["));
  if (mode === "source") {
    await page.evaluate((line) => {
      const editor = app.workspace.activeEditor.editor;
      editor.setSelection({ line, ch: 0 }, { line, ch: 3 });
      editor.focus();
    }, line);
  } else {
    await nearbyAnchor(page, fixture, mode).evaluate((node) => {
      const range = node.ownerDocument.createRange();
      range.selectNodeContents(node);
      const selection = node.ownerDocument.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
  }
  await move(placement.first);
  const selected = await nearbySnapshot(page, fixture, mode);
  if (mode === "source") {
    await page.evaluate(
      (line) => app.workspace.activeEditor.editor.setCursor({ line, ch: 0 }),
      line,
    );
  }
  await page.evaluate(() => getSelection().removeAllRanges());
  await move({ x: 20, y: 20 });
  await move(placement.first);
  const opened = await nearbySnapshot(page, fixture, mode);
  await page.keyboard.press("Escape");
  await settle(page, 350);
  const closed = await nearbySnapshot(page, fixture, mode);
  await move({ x: placement.first.x + 4, y: placement.first.y + 4 });
  const nudged = await nearbySnapshot(page, fixture, mode);
  await move({ x: 20, y: 20 });
  await move(placement.first);
  const reentered = await nearbySnapshot(page, fixture, mode);
  return [
    {
      name: `${mode}: nonempty selection suppresses nearby preview`,
      passed: connectedInsidePane(before) && selected.selected.length > 0 && selected.cards === 0,
      detail: { before, selected },
    },
    {
      name: `${mode}: Escape suppresses the same nearby anchor until the pointer leaves`,
      passed:
        connectedInsidePane(opened) &&
        closed.cards === 0 &&
        nudged.cards === 0 &&
        connectedInsidePane(reentered),
      detail: { opened, closed, nudged, reentered },
    },
  ];
}

export async function observeNearbyEvents(page) {
  await page.evaluate(() => {
    const data = { events: [], listeners: [], origin: performance.now() };
    window.marginoteNearbyEvents = data;
    for (const [target, type] of [
      [document, "pointermove"],
      [document, "pointerdown"],
      [window, "blur"],
      [window, "focus"],
      [document, "visibilitychange"],
    ]) {
      const listener = (event) =>
        data.events.push({
          type,
          ms: performance.now() - data.origin,
          trusted: event.isTrusted,
          x: event.clientX ?? null,
          y: event.clientY ?? null,
          buttons: event.buttons ?? null,
          visibility: document.visibilityState,
          target: event.target === window ? "window" : (event.target?.nodeName ?? null),
        });
      const capture = target !== window;
      target.addEventListener(type, listener, capture);
      data.listeners.push({ target, type, listener, capture });
    }
  });
}

export async function stopNearbyEvents(page) {
  return page.evaluate(() => {
    const data = window.marginoteNearbyEvents;
    if (!data) return [];
    for (const { target, type, listener, capture } of data.listeners)
      target.removeEventListener(type, listener, capture);
    delete window.marginoteNearbyEvents;
    return data.events;
  });
}
