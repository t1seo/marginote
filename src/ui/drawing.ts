import { getConnector, type Rect } from "../geometry";

export function drawConnector(svg: SVGSVGElement, anchorRects: readonly Rect[], card: Rect): void {
  svg.replaceChildren();
  for (const rect of anchorRects) {
    const outline = svg.createSvg("rect");
    outline.setAttribute("x", String(rect.left - 3));
    outline.setAttribute("y", String(rect.top - 1));
    outline.setAttribute("width", String(rect.width + 6));
    outline.setAttribute("height", String(rect.height + 2));
    outline.setAttribute("rx", "2");
    outline.setAttribute("fill", "none");
  }
  const connector = getConnector(anchorRects, card);
  if (!connector) return;
  const line = svg.createSvg("line");
  line.setAttribute("x1", String(connector.anchor.x));
  line.setAttribute("y1", String(connector.anchor.y));
  line.setAttribute("x2", String(connector.card.x));
  line.setAttribute("y2", String(connector.card.y));
  for (const point of [connector.anchor, connector.card]) {
    const endpoint = svg.createSvg("rect");
    endpoint.setAttribute("x", String(point.x - 2.5));
    endpoint.setAttribute("y", String(point.y - 2.5));
    endpoint.setAttribute("width", "5");
    endpoint.setAttribute("height", "5");
    endpoint.classList.add("marginote-endpoint");
  }
}

export function anchorBounds(node: HTMLElement): Rect {
  const doc = node.ownerDocument;
  const win = doc.defaultView;
  const width = win?.innerWidth ?? doc.documentElement.clientWidth;
  const height = win?.innerHeight ?? doc.documentElement.clientHeight;
  const pane = node.closest(".workspace-leaf-content")?.getBoundingClientRect();
  const left = Math.max(0, pane?.left ?? 0);
  const top = Math.max(0, pane?.top ?? 0);
  const right = Math.max(left, Math.min(width, pane?.right ?? width));
  const bottom = Math.max(top, Math.min(height, pane?.bottom ?? height));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

export function visibleAnchorRects(node: HTMLElement): readonly DOMRect[] {
  const bounds = anchorBounds(node);
  return Array.from(node.getClientRects()).filter(
    (rect) =>
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > bounds.top &&
      rect.top < bounds.bottom &&
      rect.right > bounds.left &&
      rect.left < bounds.right,
  );
}
