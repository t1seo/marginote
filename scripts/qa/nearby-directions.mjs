import { connectedInsidePane, nearbySnapshot, positionAnchor, settle } from "./nearby-driver.mjs";

export async function verifyNearbyDirections(page, fixture, mode, destination, record) {
  const { rect } = await positionAnchor(page, fixture, mode);
  const points = {
    left: { x: rect.x - 150, y: rect.y + rect.height / 2 },
    below: { x: rect.x + rect.width / 2, y: rect.y + rect.height + 150 },
    right: { x: rect.x + rect.width + 150, y: rect.y + rect.height / 2 },
  };
  for (const [direction, point] of Object.entries(points)) {
    await page.mouse.move(20, 20);
    await settle(page, 120);
    const cold = await nearbySnapshot(page, fixture, mode);
    await page.mouse.move(point.x, point.y);
    await settle(page, 350);
    const state = await nearbySnapshot(page, fixture, mode);
    const inside =
      point.x >= state.pane.left &&
      point.x <= state.pane.right &&
      point.y >= state.pane.top &&
      point.y <= state.pane.bottom;
    record(
      `${mode}: cold activation 150px ${direction} of the link`,
      cold.cards === 0 && inside && connectedInsidePane(state) && state.intent === "nearby",
      { point, cold, state },
    );
    await page.screenshot({ path: `${destination}/${mode}-nearby-${direction}.png`, scale: "css" });
  }

  await page.mouse.move(20, 20);
  await settle(page, 120);
  await page.mouse.move(points.left.x, points.left.y);
  await settle(page, 300);
  const path = [{ point: points.left, state: await nearbySnapshot(page, fixture, mode) }];
  let from = points.left;
  for (const to of [points.below, points.right]) {
    for (let step = 1; step <= 8; step++) {
      const point = {
        x: from.x + ((to.x - from.x) * step) / 8,
        y: from.y + ((to.y - from.y) * step) / 8,
      };
      await page.mouse.move(point.x, point.y);
      await settle(page, 70);
      path.push({ point, state: await nearbySnapshot(page, fixture, mode) });
    }
    from = to;
  }
  const cards = path.map((position) => position.state.card).filter(Boolean);
  const moved = cards.length
    ? Math.hypot(
        Math.max(...cards.map((card) => card.left)) - Math.min(...cards.map((card) => card.left)),
        Math.max(...cards.map((card) => card.top)) - Math.min(...cards.map((card) => card.top)),
      )
    : 0;
  record(
    `${mode}: continuous left-below-right path retains one connected card in its source pane`,
    path.every(
      (position) => connectedInsidePane(position.state) && position.state.intent === "nearby",
    ) && moved > 40,
    { path, cardCoordinateSpan: moved, clampingAllowed: true },
  );
}
